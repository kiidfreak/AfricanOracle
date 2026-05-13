from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.models import db_models, schemas
from app.core.db import get_db
from uuid import UUID

router = APIRouter(prefix="/signals", tags=["signals"])

@router.post("/", response_model=schemas.Signal)
def create_signal(signal: schemas.SignalCreate, db: Session = Depends(get_db)):
    db_signal = db_models.Signal(**signal.model_dump())
    db.add(db_signal)
    db.commit()
    db.refresh(db_signal)
    return db_signal

@router.get("/", response_model=List[schemas.Signal])
def read_signals(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    signals = db.query(db_models.Signal).offset(skip).limit(limit).all()
    return signals

@router.get("/{signal_id}", response_model=schemas.Signal)
def read_signal(signal_id: UUID, db: Session = Depends(get_db)):
    db_signal = db.query(db_models.Signal).filter(db_models.Signal.signal_id == signal_id).first()
    if db_signal is None:
        raise HTTPException(status_code=404, detail="Signal not found")
    return db_signal
