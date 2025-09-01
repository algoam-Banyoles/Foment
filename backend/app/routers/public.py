from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..db import get_db
from .. import schemas, models, crud

router = APIRouter(prefix="/api", tags=["public"])

@router.get("/ranking", response_model=list[schemas.RankingEntry])
def get_ranking(db: Session = Depends(get_db)):
    entries = crud.get_ranking(db)
    return entries

@router.get("/waitlist", response_model=list[schemas.WaitListEntry])
def get_waitlist(db: Session = Depends(get_db)):
    entries = crud.get_waitlist(db)
    return entries

@router.get("/challenges", response_model=list[schemas.ChallengeBase])
def get_challenges(state: models.ChallengeState | None = None, db: Session = Depends(get_db)):
    q = db.query(models.Challenge)
    if state:
        q = q.filter_by(state=state)
    return q.order_by(models.Challenge.created_at.desc()).all()
