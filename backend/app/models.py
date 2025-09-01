import uuid
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.sqlite import BLOB
from .db import Base
from enum import Enum as PyEnum

class PlayerStatus(str, PyEnum):
    ACTIU = "actiu"
    PRE_INACTIU = "pre-inactiu"
    INACTIU = "inactiu"

class ChallengeType(str, PyEnum):
    NORMAL = "normal"
    ACCES = "acces"

class ChallengeState(str, PyEnum):
    PROPOSAT = "proposat"
    ACCEPTAT = "acceptat"
    PROGRAMAT = "programat"
    JUGAT = "jugat"
    NO_DISPUTAT = "no_disputat"
    SANCIONAT = "sancionat"
    TANCAT = "tancat"

class ResultReason(str, PyEnum):
    RESULTAT = "RESULTAT"
    INCOMPAREIXENCA = "INCOMPAREIXENCA"
    REFUS = "REFUS"
    SENSE_ACORD = "SENSE_ACORD"
    SANCIO = "SANCIO"

class Parameter(Base):
    __tablename__ = "parameters"
    key = Column(String, primary_key=True)
    value = Column(String)
    description = Column(String)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Player(Base):
    __tablename__ = "players"
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    status = Column(Enum(PlayerStatus), default=PlayerStatus.ACTIU)
    date_joined = Column(DateTime, default=datetime.utcnow)
    date_left = Column(DateTime)
    last_match_at = Column(DateTime)
    last_challenge_started_at = Column(DateTime)
    user_email = Column(String)

class RankingActive(Base):
    __tablename__ = "ranking_active"
    position = Column(Integer, primary_key=True)
    player_id = Column(Integer, ForeignKey("players.id"), unique=True)
    player = relationship("Player")

class WaitList(Base):
    __tablename__ = "waitlist"
    order = Column(Integer, primary_key=True)
    player_id = Column(Integer, ForeignKey("players.id"), unique=True)
    player = relationship("Player")
    date_joined = Column(DateTime, default=datetime.utcnow)

class Challenge(Base):
    __tablename__ = "challenges"
    id = Column(BLOB, primary_key=True, default=lambda: uuid.uuid4().bytes)
    type = Column(Enum(ChallengeType), nullable=False)
    challenger_id = Column(Integer, ForeignKey("players.id"))
    challenged_id = Column(Integer, ForeignKey("players.id"))
    state = Column(Enum(ChallengeState), default=ChallengeState.PROPOSAT)
    proposal_1 = Column(DateTime)
    proposal_2 = Column(DateTime)
    proposal_3 = Column(DateTime)
    accepted_at = Column(DateTime)
    deadline_to_play = Column(DateTime)
    scheduled_at = Column(DateTime)
    result_winner_is_challenger = Column(Boolean)
    result_reason = Column(Enum(ResultReason))
    notes = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(String)
    challenger = relationship("Player", foreign_keys=[challenger_id])
    challenged = relationship("Player", foreign_keys=[challenged_id])
    match = relationship("Match", back_populates="challenge", uselist=False)

class Match(Base):
    __tablename__ = "matches"
    id = Column(BLOB, primary_key=True, default=lambda: uuid.uuid4().bytes)
    challenge_id = Column(BLOB, ForeignKey("challenges.id"), unique=True)
    date = Column(DateTime, default=datetime.utcnow)
    home_id = Column(Integer, ForeignKey("players.id"))
    away_id = Column(Integer, ForeignKey("players.id"))
    innings = Column(Integer)
    home_caram = Column(Integer)
    away_caram = Column(Integer)
    tiebreak_used = Column(Boolean, default=False)
    tiebreak_detail = Column(String)
    validated = Column(Boolean, default=False)
    validated_by = Column(String)
    validated_at = Column(DateTime)
    challenge = relationship("Challenge", back_populates="match")

class History(Base):
    __tablename__ = "history"
    id = Column(Integer, primary_key=True, autoincrement=True)
    player_id = Column(Integer, ForeignKey("players.id"))
    description = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
