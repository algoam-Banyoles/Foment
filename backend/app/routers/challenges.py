from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from ..db import get_db
from .. import schemas, models
from ..services import challenges as svc_challenges
from ..config import settings

router = APIRouter(prefix="/api", tags=["challenges"])


def verify_admin(token: str = Header(None, alias="X-Admin-Token")):
    if token != settings.admin_token:
        raise HTTPException(status_code=401, detail="Invalid admin token")

@router.post("/challenges", response_model=schemas.ChallengeBase, dependencies=[Depends(verify_admin)])
def create_challenge(payload: schemas.ChallengeCreate, db: Session = Depends(get_db)):
    ch = svc_challenges.create_challenge(db, payload.type, payload.challenger_id, payload.challenged_id, payload.proposals)
    return ch

@router.post("/challenges/{challenge_id}/accept", response_model=schemas.ChallengeBase, dependencies=[Depends(verify_admin)])
def accept_challenge(challenge_id: bytes, payload: schemas.ChallengeAccept, db: Session = Depends(get_db)):
    ch = svc_challenges.accept_challenge(db, challenge_id, payload.proposal_idx, payload.scheduled_at)
    return ch

@router.post("/challenges/{challenge_id}/schedule", response_model=schemas.ChallengeBase, dependencies=[Depends(verify_admin)])
def schedule_challenge(challenge_id: bytes, payload: schemas.ChallengeAccept, db: Session = Depends(get_db)):
    ch = svc_challenges.schedule_challenge(db, challenge_id, payload.scheduled_at)
    return ch

@router.post("/challenges/{challenge_id}/result", dependencies=[Depends(verify_admin)])
def result_challenge(challenge_id: bytes, payload: schemas.ChallengeResult, db: Session = Depends(get_db)):
    svc_challenges.record_result(db, challenge_id, payload.date, payload.innings, payload.home_caram, payload.away_caram, payload.tiebreak_used, payload.tiebreak_detail)
    return {"status": "ok"}

@router.post("/challenges/{challenge_id}/no-agreement", dependencies=[Depends(verify_admin)])
def no_agreement(challenge_id: bytes, db: Session = Depends(get_db)):
    svc_challenges.no_agreement(db, challenge_id)
    return {"status": "ok"}

@router.post("/challenges/{challenge_id}/walkover", dependencies=[Depends(verify_admin)])
def walkover(challenge_id: bytes, db: Session = Depends(get_db)):
    svc_challenges.walkover(db, challenge_id)
    return {"status": "ok"}

@router.post("/challenges/{challenge_id}/refuse", dependencies=[Depends(verify_admin)])
def refuse(challenge_id: bytes, db: Session = Depends(get_db)):
    svc_challenges.refuse(db, challenge_id)
    return {"status": "ok"}
