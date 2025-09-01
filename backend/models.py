from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from .database import Base

class Player(Base):
  __tablename__ = 'players'
  id = Column(Integer, primary_key=True, index=True)
  name = Column(String, unique=True, index=True)

class RankingActive(Base):
  __tablename__ = 'ranking_active'
  id = Column(Integer, primary_key=True, index=True)
  player_id = Column(Integer, ForeignKey('players.id'))
  position = Column(Integer)
  player = relationship('Player')

class WaitList(Base):
  __tablename__ = 'waitlist'
  id = Column(Integer, primary_key=True, index=True)
  player_id = Column(Integer, ForeignKey('players.id'))
  order = Column(Integer)
  player = relationship('Player')

class Challenge(Base):
  __tablename__ = 'challenges'
  id = Column(Integer, primary_key=True, index=True)
  challenger_id = Column(Integer, ForeignKey('players.id'))
  challenged_id = Column(Integer, ForeignKey('players.id'))
  status = Column(String, default='pending')
  challenger = relationship('Player', foreign_keys=[challenger_id])
  challenged = relationship('Player', foreign_keys=[challenged_id])

class Match(Base):
  __tablename__ = 'matches'
  id = Column(Integer, primary_key=True, index=True)
  challenge_id = Column(Integer, ForeignKey('challenges.id'))
  date = Column(DateTime, nullable=True)
  caramboles_local = Column(Integer, nullable=True)
  caramboles_visitant = Column(Integer, nullable=True)
  challenge = relationship('Challenge')

class History(Base):
  __tablename__ = 'history'
  id = Column(Integer, primary_key=True, index=True)
  description = Column(String)

class Audit(Base):
  __tablename__ = 'audit'
  id = Column(Integer, primary_key=True, index=True)
  action = Column(String)
  timestamp = Column(DateTime)
