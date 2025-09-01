from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from .database import SessionLocal
from . import models, schemas

app = FastAPI()


def get_db():
  db = SessionLocal()
  try:
    yield db
  finally:
    db.close()


@app.get('/api/challenges', response_model=list[schemas.ChallengeRead])
def list_challenges(db: Session = Depends(get_db)):
  return db.query(models.Challenge).all()


@app.post('/api/challenges', response_model=schemas.ChallengeRead)
def create_challenge(challenge: schemas.ChallengeCreate, db: Session = Depends(get_db)):
  db_chal = models.Challenge(**challenge.dict())
  db.add(db_chal)
  db.commit()
  db.refresh(db_chal)
  return db_chal


@app.get('/api/ranking', response_model=list[schemas.RankingRead])
def list_ranking(db: Session = Depends(get_db)):
  return db.query(models.RankingActive).order_by(models.RankingActive.position).all()


@app.get('/api/waitlist', response_model=list[schemas.WaitListRead])
def list_waitlist(db: Session = Depends(get_db)):
  return db.query(models.WaitList).order_by(models.WaitList.order).all()
