from app.db import SessionLocal, engine, Base
from app import crud
from datetime import datetime

Base.metadata.create_all(bind=engine)

def run():
    db = SessionLocal()
    for i in range(1, 23):
        p = crud.create_player(db, f"Player {i}")
        if i <= 20:
            crud.add_to_ranking(db, p.id, i)
            p.last_match_at = datetime.utcnow()
        else:
            crud.add_to_waitlist(db, p.id, i-20)
    db.commit()
    db.close()

if __name__ == "__main__":
    run()
