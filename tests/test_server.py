import os
os.environ['DATABASE_URL'] = 'sqlite:///./test.db'
from fastapi.testclient import TestClient

from server import app
from backend.database import Base, engine


def test_server_exposes_api_challenges():
    """Ensure the combined server includes the backend API routes."""

    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    client = TestClient(app)
    resp = client.get("/api/challenges")
    assert resp.status_code == 200
    assert resp.json() == []

