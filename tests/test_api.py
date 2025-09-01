import os
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from fastapi.testclient import TestClient
from backend.api import app
from backend.database import Base, engine


def setup_module(module):
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def test_create_and_list_challenge():
    client = TestClient(app)
    res = client.post('/api/challenges', json={
        'challenger_id': 1,
        'challenged_id': 2,
        'status': 'pending'
    })
    assert res.status_code == 200
    data = res.json()
    assert data['challenger_id'] == 1
    res = client.get('/api/challenges')
    assert res.status_code == 200
    assert len(res.json()) == 1


def test_empty_ranking_and_waitlist():
    client = TestClient(app)
    assert client.get('/api/ranking').json() == []
    assert client.get('/api/waitlist').json() == []
