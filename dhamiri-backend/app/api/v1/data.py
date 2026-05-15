"""
AfricaCast API — v1 Dataset & Trace endpoints.
"""

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from app.core.auth import verify_api_key, APIKeyInfo

router = APIRouter(prefix="/v1", tags=["data"])


# ── Datasets ─────────────────────────────────────────────────────────────────

class DatasetInfo(BaseModel):
    name: str
    source: str
    status: str  # "live" | "cached" | "stale"
    records: int
    region: str
    last_update: str
    refresh_interval: str


LOADED_DATASETS = [
    DatasetInfo(name="Maize Wholesale Prices", source="KNBS / EAGC", status="live", records=2847, region="KE", last_update="2h ago", refresh_interval="6h"),
    DatasetInfo(name="CBK Interest Rates", source="Central Bank of Kenya", status="live", records=156, region="KE", last_update="6h ago", refresh_interval="24h"),
    DatasetInfo(name="CHIRPS Rainfall Index", source="UCSB / FEWS NET", status="cached", records=12400, region="East Africa", last_update="1d ago", refresh_interval="7d"),
    DatasetInfo(name="USD/KES Exchange Rate", source="Open Exchange Rates", status="live", records=365, region="KE", last_update="15m ago", refresh_interval="1h"),
    DatasetInfo(name="CPI / Inflation", source="KNBS", status="cached", records=84, region="KE", last_update="3d ago", refresh_interval="30d"),
    DatasetInfo(name="DAP/CAN Fertilizer Prices", source="Kenya Revenue Authority", status="cached", records=48, region="KE", last_update="7d ago", refresh_interval="14d"),
    DatasetInfo(name="Unga Retail Flour Prices", source="EAGC / Retail Survey", status="live", records=520, region="KE", last_update="4h ago", refresh_interval="12h"),
]


class DatasetsResponse(BaseModel):
    total_sources: int
    total_records: int
    datasets: List[DatasetInfo]


@router.get("/datasets", response_model=DatasetsResponse)
async def list_datasets(api_key: APIKeyInfo = Depends(verify_api_key)):
    """List all loaded data sources with freshness and record counts."""
    return DatasetsResponse(
        total_sources=len(LOADED_DATASETS),
        total_records=sum(d.records for d in LOADED_DATASETS),
        datasets=LOADED_DATASETS,
    )


# ── Traces ────────────────────────────────────────────────────────────────────

class TraceStep(BaseModel):
    step: int
    signal_name: str
    quality: float
    effective_impact: float
    prior_prob: float
    posterior_prob: float
    narrative: str


class TraceResponse(BaseModel):
    trace_hash: str
    prediction_id: str
    question: str
    steps: List[TraceStep]
    final_probability: float
    arc_tx_hash: Optional[str] = None
    published_at: str
    verifiable: bool


@router.get("/traces/{trace_hash}", response_model=TraceResponse)
async def get_trace(
    trace_hash: str,
    api_key: APIKeyInfo = Depends(verify_api_key),
):
    """
    Retrieve a full reasoning trace by its hash.
    In production, this fetches from the database + verifies against Arc chain.
    """
    # Demo trace
    return TraceResponse(
        trace_hash=trace_hash,
        prediction_id="demo-pred-001",
        question="Will Unga maize flour price hit KSh 185 by end of Q3?",
        steps=[
            TraceStep(step=1, signal_name="KNBS Maize Wholesale +12.3%", quality=0.85, effective_impact=0.238, prior_prob=0.53, posterior_prob=0.64, narrative="Maize price increase shifts belief +0.238 → P(H)=64.0%"),
            TraceStep(step=2, signal_name="CHIRPS Rainfall Deficit −1.8σ", quality=0.82, effective_impact=0.156, prior_prob=0.64, posterior_prob=0.71, narrative="Drought signal shifts belief +0.156 → P(H)=71.0%"),
            TraceStep(step=3, signal_name="Gov Subsidy Counter", quality=0.65, effective_impact=-0.098, prior_prob=0.71, posterior_prob=0.67, narrative="Counter-thesis shifts belief −0.098 → P(H)=67.0%"),
        ],
        final_probability=0.67,
        arc_tx_hash="0x" + "b" * 64,
        published_at=datetime.utcnow().isoformat(),
        verifiable=True,
    )


# ── Questions Library ─────────────────────────────────────────────────────────

class MarketQuestion(BaseModel):
    question: str
    category: str
    drivers: List[str]
    horizon: str
    current_crowd_prob: Optional[float] = None


QUESTION_LIBRARY = [
    MarketQuestion(question="Will Unga maize flour price hit KSh 185 by end of Q3?", category="agriculture", drivers=["KNBS maize prices", "CHIRPS rainfall", "fertilizer costs"], horizon="90d", current_crowd_prob=0.53),
    MarketQuestion(question="Will CBK raise rates by >=50bps at the next MPC meeting?", category="macro", drivers=["CPI inflation", "CBK base rate", "KES stability"], horizon="45d", current_crowd_prob=0.42),
    MarketQuestion(question="Will USD/KES breach 160 within 30 days?", category="fx", drivers=["CBK reserves", "trade balance", "diaspora remittances"], horizon="30d", current_crowd_prob=0.38),
    MarketQuestion(question="Will Kenya tea export revenue decline >10% this quarter?", category="agriculture", drivers=["global tea prices", "weather patterns", "logistics costs"], horizon="90d", current_crowd_prob=0.29),
    MarketQuestion(question="Will KPLC electricity tariff increase before Dec 2026?", category="energy", drivers=["EPRA review", "fuel costs", "renewable capacity"], horizon="180d", current_crowd_prob=0.55),
]


class QuestionsResponse(BaseModel):
    total: int
    questions: List[MarketQuestion]


@router.get("/questions", response_model=QuestionsResponse)
async def list_questions(api_key: APIKeyInfo = Depends(verify_api_key)):
    """Pre-built market questions from the AfricaCast question library."""
    return QuestionsResponse(
        total=len(QUESTION_LIBRARY),
        questions=QUESTION_LIBRARY,
    )
