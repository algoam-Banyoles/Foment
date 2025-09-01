from datetime import datetime, timedelta
from backend.app import models
from backend.app.services import challenges, ranking, eligibility, cron
from backend.app.routers.admin import voluntary_leave


def test_normal_challenge_swap(db):
    proposals = [datetime.utcnow()+timedelta(days=1), datetime.utcnow()+timedelta(days=2)]
    ch = challenges.create_challenge(db, models.ChallengeType.NORMAL, 2, 1, proposals)
    challenges.accept_challenge(db, ch.id, 0, None)
    challenges.record_result(db, ch.id, datetime.utcnow(), 20, 20, 15, False, None)
    r = ranking.get_ranking(db)
    assert r[0].player_id == 2
    assert r[1].player_id == 1


def test_access_promotion(db):
    proposals = [datetime.utcnow()+timedelta(days=1), datetime.utcnow()+timedelta(days=2)]
    ch = challenges.create_challenge(db, models.ChallengeType.ACCES, 21, 20, proposals)
    challenges.accept_challenge(db, ch.id, 0, None)
    challenges.record_result(db, ch.id, datetime.utcnow(), 20, 20, 15, False, None)
    r = ranking.get_ranking(db)
    assert any(e.player_id == 21 and e.position == 20 for e in r)


def test_refuse_noagreement_walkover(db):
    proposals = [datetime.utcnow()+timedelta(days=1), datetime.utcnow()+timedelta(days=2)]
    ch = challenges.create_challenge(db, models.ChallengeType.NORMAL, 3, 2, proposals)
    challenges.refuse(db, ch.id)
    assert db.query(models.Challenge).get(ch.id).result_reason == models.ResultReason.REFUS
    ch2 = challenges.create_challenge(db, models.ChallengeType.NORMAL, 4, 3, proposals)
    challenges.no_agreement(db, ch2.id)
    assert db.query(models.Challenge).get(ch2.id).result_reason == models.ResultReason.SENSE_ACORD
    ch3 = challenges.create_challenge(db, models.ChallengeType.NORMAL, 5,4, proposals)
    challenges.walkover(db, ch3.id)
    assert db.query(models.Challenge).get(ch3.id).result_reason == models.ResultReason.INCOMPAREIXENCA


def test_cooldown_block(db):
    proposals = [datetime.utcnow()+timedelta(days=1), datetime.utcnow()+timedelta(days=2)]
    ch = challenges.create_challenge(db, models.ChallengeType.NORMAL, 6,5, proposals)
    challenges.accept_challenge(db, ch.id, 0, None)
    challenges.record_result(db, ch.id, datetime.utcnow(), 20, 20, 15, False, None)
    until = eligibility.cooldown_block_until(db,6)
    assert until > datetime.utcnow()


def test_inactivity_and_voluntary_leave(db):
    p = db.query(models.Player).get(7)
    p.last_match_at = datetime.utcnow() - timedelta(weeks=7)
    db.commit()
    cron.review_inactivity(db)
    player = db.query(models.Player).get(7)
    assert player.status == models.PlayerStatus.INACTIU
    voluntary_leave(21, db)
    r = ranking.get_ranking(db)
    assert all(e.player_id != 21 for e in r)


def test_waitlist_window(db):
    first = db.query(models.WaitList).order_by(models.WaitList.order).first()
    first.date_joined = datetime.utcnow() - timedelta(days=16)
    db.commit()
    cron.review_access_first_wait(db)
    first_new = db.query(models.WaitList).order_by(models.WaitList.order).first()
    assert first_new.player_id != first.player_id
