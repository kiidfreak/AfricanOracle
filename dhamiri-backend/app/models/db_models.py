from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Text, ARRAY, JSON, DECIMAL, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship, declarative_base
from datetime import datetime
import uuid

Base = declarative_base()

class SourceRegistry(Base):
    __tablename__ = "source_registry"

    source_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(Text, nullable=False)
    short_code = Column(Text, unique=True, nullable=False)
    base_credibility = Column(DECIMAL(3, 2))
    source_type = Column(Text, nullable=False)
    region = Column(JSON, nullable=False)
    decay_half_life_hours = Column(Integer, default=24)
    created_at = Column(DateTime, default=datetime.utcnow)

class Signal(Base):
    __tablename__ = "signals"

    signal_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    signal_class = Column(Text, nullable=False)
    layer = Column(Text)
    name = Column(Text, nullable=False)
    value = Column(DECIMAL)
    unit = Column(Text)
    direction = Column(Text)
    impact = Column(DECIMAL(4, 3))
    confidence = Column(DECIMAL(3, 2))
    source_id = Column(UUID(as_uuid=True), ForeignKey("source_registry.source_id"))
    region = Column(JSON)
    quality_flags = Column(JSON)
    raw_payload = Column(JSON)

class Hypothesis(Base):
    __tablename__ = "hypotheses"

    hypothesis_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    market_id = Column(Text, nullable=False)
    platform = Column(Text, nullable=False)
    question = Column(Text, nullable=False)
    resolution_date = Column(DateTime)
    category = Column(Text)
    prior = Column(DECIMAL(4, 3), default=0.500)
    created_at = Column(DateTime, default=datetime.utcnow)

class Prediction(Base):
    __tablename__ = "predictions"

    prediction_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    hypothesis_id = Column(UUID(as_uuid=True), ForeignKey("hypotheses.hypothesis_id"))
    generated_at = Column(DateTime, default=datetime.utcnow)
    prior = Column(DECIMAL(4, 3))
    posterior = Column(DECIMAL(4, 3))
    market_price = Column(DECIMAL(4, 3))
    edge = Column(DECIMAL(4, 3))
    kelly_fraction = Column(DECIMAL(4, 3))
    confidence = Column(DECIMAL(3, 2))
    recommendation = Column(Text)
    status = Column(Text, default="pending")
    reasoning_trace = Column(JSON)
    meta_data = Column(JSON)

class SignalPredictionMap(Base):
    __tablename__ = "signal_prediction_map"

    prediction_id = Column(UUID(as_uuid=True), ForeignKey("predictions.prediction_id"), primary_key=True)
    signal_id = Column(UUID(as_uuid=True), ForeignKey("signals.signal_id"), primary_key=True)

class Execution(Base):
    __tablename__ = "executions"

    execution_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    prediction_id = Column(UUID(as_uuid=True), ForeignKey("predictions.prediction_id"))
    executed_at = Column(DateTime, default=datetime.utcnow)
    platform = Column(Text)
    bet_direction = Column(Text)
    bet_size_usd = Column(DECIMAL(10, 2))
    market_price_at_bet = Column(DECIMAL(4, 3))
    status = Column(Text)
    platform_tx_id = Column(Text)
