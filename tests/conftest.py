import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timedelta
from backend.app.db import Base
from backend.app import crud, models

@pytest.fixture
def db():
    engine = create_engine('sqlite://', connect_args={'check_same_thread': False})
    TestingSession = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    Base.metadata.create_all(bind=engine)
    session = TestingSession()
    # seed players
    for i in range(1,23):
        p = crud.create_player(session, f'P{i}')
        if i <= 20:
            crud.add_to_ranking(session, p.id, i)
            p.last_match_at = datetime.utcnow() - timedelta(days=1)
        else:
            crud.add_to_waitlist(session, p.id, i-20)
    session.commit()
    yield session
    session.close()
