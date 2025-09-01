from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
from .models import PlayerStatus, ChallengeState, ChallengeType, ResultReason

class Player(BaseModel):
    id: int
    name: str
    status: PlayerStatus
    class Config:
        orm_mode = True

class RankingEntry(BaseModel):
    position: int
    player: Player
    class Config:
        orm_mode = True

class WaitListEntry(BaseModel):
    order: int
    player: Player
    date_joined: datetime
    class Config:
        orm_mode = True

class ChallengeBase(BaseModel):
    id: bytes
    type: ChallengeType
    challenger_id: int
    challenged_id: int
    state: ChallengeState
    proposal_1: Optional[datetime]
    proposal_2: Optional[datetime]
    proposal_3: Optional[datetime]
    accepted_at: Optional[datetime]
    deadline_to_play: Optional[datetime]
    scheduled_at: Optional[datetime]
    result_winner_is_challenger: Optional[bool]
    result_reason: Optional[ResultReason]
    created_at: datetime
    class Config:
        orm_mode = True

class ChallengeCreate(BaseModel):
    type: ChallengeType
    challenger_id: int
    challenged_id: int
    proposals: List[datetime]

class ChallengeAccept(BaseModel):
    proposal_idx: Optional[int] = None
    scheduled_at: Optional[datetime] = None

class ChallengeResult(BaseModel):
    date: datetime
    innings: int
    home_caram: int
    away_caram: int
    tiebreak_used: bool = False
    tiebreak_detail: Optional[str] = None
