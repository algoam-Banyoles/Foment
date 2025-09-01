from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from .. import models, crud
from . import challenges, ranking


def review_deadlines(db: Session):
    now = datetime.utcnow()
    days_accept = crud.get_param(db, "DAYS_ACCEPT")
    days_play = crud.get_param(db, "DAYS_PLAY")
    proposats = db.query(models.Challenge).filter_by(state=models.ChallengeState.PROPOSAT).all()
    for ch in proposats:
        if ch.created_at + timedelta(days=days_accept) < now:
            challenges.refuse(db, ch.id)
    acceptats = db.query(models.Challenge).filter_by(state=models.ChallengeState.ACCEPTAT).all()
    for ch in acceptats:
        if ch.accepted_at + timedelta(days=days_play) < now:
            challenges.refuse(db, ch.id)
    programats = db.query(models.Challenge).filter_by(state=models.ChallengeState.PROGRAMAT).all()
    for ch in programats:
        if ch.deadline_to_play and ch.deadline_to_play < now:
            challenges.walkover(db, ch.id)


def review_access_first_wait(db: Session):
    now = datetime.utcnow()
    days_access = crud.get_param(db, "DAYS_ACCESS_FIRST_WAIT")
    first = db.query(models.WaitList).order_by(models.WaitList.order).first()
    if first and first.date_joined + timedelta(days=days_access) < now:
        max_order = db.query(models.WaitList.order).order_by(models.WaitList.order.desc()).first()
        new_order = (max_order[0] if max_order else 0) + 1
        first.order = new_order
        db.commit()


def review_inactivity(db: Session):
    now = datetime.utcnow()
    pre_weeks = crud.get_param(db, "PREINACTIVE_WEEKS")
    inactive_weeks = crud.get_param(db, "INACTIVE_WEEKS")
    rank_entries = db.query(models.RankingActive).all()
    for entry in rank_entries:
        player = db.query(models.Player).get(entry.player_id)
        if not player.last_match_at:
            continue
        if player.last_match_at + timedelta(weeks=inactive_weeks) < now:
            # remove from ranking
            db.delete(entry)
            player.status = models.PlayerStatus.INACTIU
            ranking.promote_from_waitlist(db)
        elif player.last_match_at + timedelta(weeks=pre_weeks) < now and player.status == models.PlayerStatus.ACTIU:
            player.status = models.PlayerStatus.PRE_INACTIU
            ranking.apply_pre_inactive_drop(db, player.id)
    db.commit()
