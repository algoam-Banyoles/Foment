from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from .. import models, crud
from . import ranking


def create_challenge(db: Session, type: models.ChallengeType, challenger_id: int, challenged_id: int, proposals):
    if len(proposals) < 2:
        raise ValueError("At least two proposals")
    if type == models.ChallengeType.NORMAL:
        # challenger not #1 and within 2 positions below challenged
        challenger_entry = db.query(models.RankingActive).filter_by(player_id=challenger_id).first()
        challenged_entry = db.query(models.RankingActive).filter_by(player_id=challenged_id).first()
        if not challenger_entry or not challenged_entry:
            raise ValueError("Both must be in ranking")
        if challenger_entry.position <= 1:
            raise ValueError("Challenger cannot be #1")
        if challenger_entry.position - challenged_entry.position > 2:
            raise ValueError("Too far in ranking")
    else:
        # access challenge
        first_wait = db.query(models.WaitList).order_by(models.WaitList.order).first()
        rank_size = crud.get_param(db, "RANK_SIZE")
        last_rank = db.query(models.RankingActive).filter_by(position=rank_size).first()
        if not first_wait or first_wait.player_id != challenger_id:
            raise ValueError("Challenger must be first on waitlist")
        if not last_rank or last_rank.player_id != challenged_id:
            raise ValueError("Challenged must be #20")
    ch = models.Challenge(
        type=type,
        challenger_id=challenger_id,
        challenged_id=challenged_id,
        proposal_1=proposals[0],
        proposal_2=proposals[1],
        proposal_3=proposals[2] if len(proposals) > 2 else None,
        created_by="system",
    )
    db.add(ch)
    db.commit()
    db.refresh(ch)
    return ch


def accept_challenge(db: Session, challenge_id: bytes, proposal_idx: int | None, scheduled_at: datetime | None):
    ch = db.query(models.Challenge).get(challenge_id)
    if ch.state != models.ChallengeState.PROPOSAT:
        raise ValueError("Not in proposat")
    ch.accepted_at = datetime.utcnow()
    days_play = crud.get_param(db, "DAYS_PLAY")
    ch.deadline_to_play = ch.accepted_at + timedelta(days=days_play)
    if scheduled_at:
        ch.scheduled_at = scheduled_at
        ch.state = models.ChallengeState.PROGRAMAT
    else:
        if proposal_idx is None:
            raise ValueError("proposal index required")
        chosen = [ch.proposal_1, ch.proposal_2, ch.proposal_3][proposal_idx]
        ch.scheduled_at = chosen
        ch.state = models.ChallengeState.PROGRAMAT
    db.commit()
    return ch


def schedule_challenge(db: Session, challenge_id: bytes, scheduled_at: datetime):
    ch = db.query(models.Challenge).get(challenge_id)
    if ch.state != models.ChallengeState.ACCEPTAT:
        raise ValueError("Not accepted")
    ch.scheduled_at = scheduled_at
    ch.state = models.ChallengeState.PROGRAMAT
    db.commit()
    return ch


def record_result(db: Session, challenge_id: bytes, date: datetime, innings: int, home_caram: int, away_caram: int, tiebreak_used: bool, tiebreak_detail: str | None):
    ch = db.query(models.Challenge).get(challenge_id)
    match = models.Match(challenge_id=challenge_id, date=date, home_id=ch.challenger_id, away_id=ch.challenged_id,
                         innings=innings, home_caram=home_caram, away_caram=away_caram,
                         tiebreak_used=tiebreak_used, tiebreak_detail=tiebreak_detail, validated=True,
                         validated_by="system", validated_at=datetime.utcnow())
    db.add(match)
    ch.match = match
    ch.state = models.ChallengeState.JUGAT
    ch.result_reason = models.ResultReason.RESULTAT
    ch.result_winner_is_challenger = home_caram > away_caram
    # ranking effect
    if ch.type == models.ChallengeType.NORMAL:
        if ch.result_winner_is_challenger:
            # swap positions
            challenger_entry = db.query(models.RankingActive).filter_by(player_id=ch.challenger_id).first()
            challenged_entry = db.query(models.RankingActive).filter_by(player_id=ch.challenged_id).first()
            ranking.swap_positions(db, challenger_entry.position, challenged_entry.position)
    else:
        if ch.result_winner_is_challenger:
            ranking.promote_from_waitlist(db)
    ch.state = models.ChallengeState.TANCAT
    db.commit()
    return match


def no_agreement(db: Session, challenge_id: bytes):
    ch = db.query(models.Challenge).get(challenge_id)
    ch.state = models.ChallengeState.TANCAT
    ch.result_reason = models.ResultReason.SENSE_ACORD
    entry_ch = db.query(models.RankingActive).filter_by(player_id=ch.challenger_id).first()
    entry_cd = db.query(models.RankingActive).filter_by(player_id=ch.challenged_id).first()
    if entry_ch and entry_cd:
        if entry_ch.position > entry_cd.position:
            higher, lower = entry_ch, entry_cd
        else:
            higher, lower = entry_cd, entry_ch
        ranking.swap_positions(db, higher.position, higher.position+1)
        ranking.swap_positions(db, lower.position, lower.position+1)
    db.commit()

def walkover(db: Session, challenge_id: bytes):
    ch = db.query(models.Challenge).get(challenge_id)
    ch.state = models.ChallengeState.TANCAT
    ch.result_reason = models.ResultReason.INCOMPAREIXENCA
    ch.result_winner_is_challenger = True
    if ch.type == models.ChallengeType.NORMAL:
        challenger_entry = db.query(models.RankingActive).filter_by(player_id=ch.challenger_id).first()
        challenged_entry = db.query(models.RankingActive).filter_by(player_id=ch.challenged_id).first()
        ranking.swap_positions(db, challenger_entry.position, challenged_entry.position)
    else:
        ranking.promote_from_waitlist(db)
    db.commit()

def refuse(db: Session, challenge_id: bytes):
    ch = db.query(models.Challenge).get(challenge_id)
    ch.state = models.ChallengeState.TANCAT
    ch.result_reason = models.ResultReason.REFUS
    db.commit()
