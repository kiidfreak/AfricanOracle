from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.models import db_models, schemas
from app.core.db import get_db
from uuid import UUID

router = APIRouter(prefix="/hypotheses", tags=["hypotheses"])

@router.post("/", response_model=schemas.Hypothesis)
def create_hypothesis(hypothesis: schemas.HypothesisCreate, db: Session = Depends(get_db)):
    db_hypothesis = db_models.Hypothesis(**hypothesis.model_dump())
    db.add(db_hypothesis)
    db.commit()
    db.refresh(db_hypothesis)
    return db_hypothesis

@router.get("/", response_model=List[schemas.Hypothesis])
def read_hypotheses(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    hypotheses = db.query(db_models.Hypothesis).offset(skip).limit(limit).all()
    return hypotheses

@router.get("/{hypothesis_id}", response_model=schemas.Hypothesis)
def read_hypothesis(hypothesis_id: UUID, db: Session = Depends(get_db)):
    db_hypothesis = db.query(db_models.Hypothesis).filter(db_models.Hypothesis.hypothesis_id == hypothesis_id).first()
    if db_hypothesis is None:
        raise HTTPException(status_code=404, detail="Hypothesis not found")
    return db_hypothesis
