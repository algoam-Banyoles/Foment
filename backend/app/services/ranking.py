from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import update
from .. import models, crud


def get_ranking(db: Session):
    return crud.get_ranking(db)


def swap_positions(db: Session, pos_a: int, pos_b: int):
    temp = 0
    db.execute(update(models.RankingActive).where(models.RankingActive.position==pos_a).values(position=temp))
    db.execute(update(models.RankingActive).where(models.RankingActive.position==pos_b).values(position=pos_a))
    db.execute(update(models.RankingActive).where(models.RankingActive.position==temp).values(position=pos_b))
    db.commit()


def set_player_to_position(db: Session, player_id: int, position: int):
    entry = db.query(models.RankingActive).filter_by(player_id=player_id).first()
    if entry:
        entry.position = position
    else:
        entry = models.RankingActive(player_id=player_id, position=position)
        db.add(entry)
    db.commit()


def promote_from_waitlist(db: Session):
    wait_first = db.query(models.WaitList).order_by(models.WaitList.order).first()
    if not wait_first:
        return
    rank_size = crud.get_param(db, "RANK_SIZE")
    last_rank = db.query(models.RankingActive).filter_by(position=rank_size).first()
    if last_rank:
        max_order = db.query(models.WaitList.order).order_by(models.WaitList.order.desc()).first()
        new_order = (max_order[0] if max_order else 0) + 1
        db.add(models.WaitList(order=new_order, player_id=last_rank.player_id))
        db.delete(last_rank)
    db.add(models.RankingActive(position=rank_size, player_id=wait_first.player_id))
    player = db.query(models.Player).get(wait_first.player_id)
    player.last_match_at = datetime.utcnow()
    db.delete(wait_first)
    db.commit()


def apply_pre_inactive_drop(db: Session, player_id: int):
    drop = crud.get_param(db, "DROP_PREINACTIVE")
    entry = db.query(models.RankingActive).filter_by(player_id=player_id).first()
    if not entry:
        return
    new_pos = entry.position + drop
    rank_size = crud.get_param(db, "RANK_SIZE")
    if new_pos > rank_size:
        max_order = db.query(models.WaitList.order).order_by(models.WaitList.order.desc()).first()
        new_order = (max_order[0] if max_order else 0) + 1
        db.add(models.WaitList(order=new_order, player_id=player_id))
        db.delete(entry)
    else:
        affected = db.query(models.RankingActive).filter(models.RankingActive.position > entry.position, models.RankingActive.position <= new_pos).all()
        for e in affected:
            e.position -= 1
        entry.position = new_pos
    db.commit()
