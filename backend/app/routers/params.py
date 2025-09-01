from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..db import get_db
from .. import crud

router = APIRouter(prefix="/api", tags=["params"])

@router.get("/parameters/{key}")
def get_parameter(key: str, db: Session = Depends(get_db)):
    value = crud.get_param(db, key)
    return {"key": key, "value": value}
