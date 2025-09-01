from datetime import datetime
from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session
from ..db import get_db
from ..config import settings
from .. import models, crud
from ..services import ranking

router = APIRouter(prefix="/api/admin", tags=["admin"])

def verify_admin(token: str = Header(None, alias="X-Admin-Token")):
    if token != settings.admin_token:
        raise HTTPException(status_code=401, detail="Invalid admin token")

@router.post("/leave", dependencies=[Depends(verify_admin)])
def voluntary_leave(player_id: int, db: Session = Depends(get_db)):
    entry = db.query(models.RankingActive).filter_by(player_id=player_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Player not in ranking")
    position = entry.position
    db.delete(entry)
    player = db.query(models.Player).get(player_id)
    player.status = models.PlayerStatus.INACTIU
    player.date_left = datetime.utcnow()
    db.commit()
    rank_size = crud.get_param(db, "RANK_SIZE")
    if position == rank_size:
        ranking.promote_from_waitlist(db)
    return {"status": "ok"}
