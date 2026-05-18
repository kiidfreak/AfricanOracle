from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union
from datetime import datetime
from uuid import UUID, uuid4

class SignalBase(BaseModel):
    name: str
    signal_class: str
    layer: str = Field(pattern="^(L1|L2)$")
    value: float
    unit: str
    direction: str = Field(pattern="^(bullish|bearish|neutral)$")
    impact: float
    confidence: float
    region: Optional[List[str]] = []
    raw_payload: Optional[Dict[str, Any]] = None

class SignalCreate(SignalBase):
    source_id: UUID

class Signal(SignalBase):
    signal_id: UUID
    created_at: datetime
    source_id: UUID
    quality_flags: Optional[List[str]] = []

    class Config:
        from_attributes = True

class HypothesisBase(BaseModel):
    market_id: str
    platform: str
    question: str
    resolution_date: Optional[datetime] = None
    resolution_criteria: Optional[str] = None
    category: str
    tags: List[str] = []
    prior: float = 0.5

class HypothesisCreate(HypothesisBase):
    pass

class Hypothesis(HypothesisBase):
    hypothesis_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

class ReasoningStep(BaseModel):
    step: int
    signal_id: str
    signal_name: str
    prior_logodds: float
    impact: float
    posterior_logodds: float
    posterior_prob: float
    narrative: str

class PredictionBase(BaseModel):
    hypothesis_id: UUID
    prior: float
    posterior: float
    market_price: float
    edge: float
    kelly_fraction: float
    confidence: float
    recommendation: str

class PredictionCreate(PredictionBase):
    signal_ids: List[UUID]
    reasoning_trace: List[ReasoningStep]

class Prediction(PredictionBase):
    prediction_id: UUID
    generated_at: datetime
    status: str = "pending"
    reasoning_trace: List[ReasoningStep]
    meta_data: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

class SourceBase(BaseModel):
    name: str
    short_code: str
    base_credibility: float
    source_type: str
    region: List[str]
    decay_half_life_hours: int = 24

class Source(SourceBase):
    source_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True
