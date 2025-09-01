from sqlalchemy.orm import Session
from .. import models


def add_history(db: Session, player_id: int, description: str):
    h = models.History(player_id=player_id, description=description)
    db.add(h)
    db.commit()
