from pydantic import BaseModel

class ChallengeBase(BaseModel):
  challenger_id: int
  challenged_id: int
  status: str = 'pending'

class ChallengeCreate(ChallengeBase):
  pass

class ChallengeRead(ChallengeBase):
  id: int

  class Config:
    orm_mode = True

class RankingBase(BaseModel):
  player_id: int
  position: int

class RankingRead(RankingBase):
  id: int

  class Config:
    orm_mode = True

class WaitListBase(BaseModel):
  player_id: int
  order: int

class WaitListRead(WaitListBase):
  id: int

  class Config:
    orm_mode = True
