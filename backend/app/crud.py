from sqlalchemy.orm import Session
from . import models

DEFAULT_PARAMS = {
    "RANK_SIZE": "20",
    "DAYS_ACCEPT": "7",
    "DAYS_PLAY": "7",
    "COOLDOWN_REPTAR_DIES": "7",
    "DAYS_ACCESS_FIRST_WAIT": "15",
    "PREINACTIVE_WEEKS": "3",
    "INACTIVE_WEEKS": "6",
    "DROP_PREINACTIVE": "5",
}

def get_param(db: Session, key: str) -> int:
    param = db.query(models.Parameter).filter_by(key=key).first()
    if not param:
        value = DEFAULT_PARAMS[key]
        param = models.Parameter(key=key, value=value, description="default")
        db.add(param)
        db.commit()
        db.refresh(param)
    return int(param.value)


def create_player(db: Session, name: str) -> models.Player:
    player = models.Player(name=name)
    db.add(player)
    db.commit()
    db.refresh(player)
    return player


def add_to_ranking(db: Session, player_id: int, position: int):
    entry = models.RankingActive(position=position, player_id=player_id)
    db.add(entry)
    db.commit()


def add_to_waitlist(db: Session, player_id: int, order: int):
    entry = models.WaitList(order=order, player_id=player_id)
    db.add(entry)
    db.commit()


def get_ranking(db: Session):
    return db.query(models.RankingActive).order_by(models.RankingActive.position).all()


def get_waitlist(db: Session):
    return db.query(models.WaitList).order_by(models.WaitList.order).all()
