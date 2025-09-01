from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from .. import models


def has_active_challenge(db: Session, player_id: int) -> bool:
    q = db.query(models.Challenge).filter(models.Challenge.state != models.ChallengeState.TANCAT,
                                         ((models.Challenge.challenger_id == player_id) | (models.Challenge.challenged_id == player_id)))
    return db.query(q.exists()).scalar()


def cooldown_block_until(db: Session, player_id: int):
    challenges = db.query(models.Challenge).filter(
        (models.Challenge.challenger_id == player_id) | (models.Challenge.challenged_id == player_id)
    ).all()
    until = datetime.min
    for ch in challenges:
        if ch.match:
            until = max(until, ch.match.date + timedelta(days=7))
        elif ch.state == models.ChallengeState.PROPOSAT and ch.challenger_id == player_id:
            until = max(until, ch.created_at + timedelta(days=21))
        elif ch.state in (models.ChallengeState.ACCEPTAT, models.ChallengeState.PROGRAMAT) and ch.challenger_id == player_id:
            until = max(until, ch.accepted_at + timedelta(days=14))
    return until
