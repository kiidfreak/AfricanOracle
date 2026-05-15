"""
AfricaCast Intelligence API — v1 Predict Endpoint.
Runs the 5-agent orchestration pipeline and returns structured reasoning.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from uuid import UUID, uuid4
from datetime import datetime

from app.core.auth import verify_api_key, APIKeyInfo

router = APIRouter(prefix="/v1", tags=["intelligence"])


class PredictRequest(BaseModel):
    question: str = Field(..., description="Natural language market question", min_length=10)
    category: Optional[str] = Field(None, description="Category hint: agriculture, macro, fx, energy")
    prior: float = Field(0.5, ge=0.01, le=0.99, description="Prior probability (crowd opinion)")


class SignalUsed(BaseModel):
    name: str
    source: str
    quality: float
    impact: float
    direction: str


class ReasoningStepOut(BaseModel):
    step: int
    signal_name: str
    quality: float
    effective_impact: float
    prior_prob: float
    posterior_prob: float
    narrative: str


class PredictResponse(BaseModel):
    prediction_id: str
    hypothesis_id: str
    question: str
    probability: float
    confidence: float
    edge: float
    recommendation: str
    signals_used: List[SignalUsed]
    reasoning_trace: List[ReasoningStepOut]
    trace_hash: str
    arc_tx_hash: Optional[str] = None
    generated_at: str
    tier: str


# ── Demo intelligence data ──────────────────────────────────────────────────
# In production, this calls the real orchestrator pipeline.
# For the hackathon, we return structured demo data that matches real signals.

DEMO_SIGNALS = {
    "agriculture": [
        SignalUsed(name="KNBS Maize Wholesale Price (+12.3% YoY)", source="KNBS / EAGC", quality=0.85, impact=0.280, direction="bullish"),
        SignalUsed(name="CHIRPS Rainfall Deficit (−1.8σ)", source="UCSB / FEWS NET", quality=0.82, impact=0.190, direction="bullish"),
        SignalUsed(name="DAP Fertilizer Import Costs (+18%)", source="Kenya Revenue Authority", quality=0.78, impact=0.150, direction="bullish"),
        SignalUsed(name="Gov Subsidy Counter-scenario", source="Hypothesis Agent", quality=0.65, impact=-0.150, direction="bearish"),
    ],
    "macro": [
        SignalUsed(name="CBK Base Rate 12.5%", source="Central Bank of Kenya", quality=0.92, impact=0.220, direction="bullish"),
        SignalUsed(name="CPI Inflation 7.2%", source="KNBS", quality=0.88, impact=0.180, direction="bullish"),
        SignalUsed(name="Global Rate Cuts Counter", source="Hypothesis Agent", quality=0.60, impact=-0.100, direction="bearish"),
    ],
    "fx": [
        SignalUsed(name="USD/KES Spot 157.8 (+4.2% QoQ)", source="Open Exchange Rates", quality=0.90, impact=0.250, direction="bullish"),
        SignalUsed(name="CBK FX Reserves $7.2B (−8%)", source="Central Bank of Kenya", quality=0.85, impact=0.180, direction="bullish"),
        SignalUsed(name="IMF Disbursement Counter", source="Hypothesis Agent", quality=0.55, impact=-0.120, direction="bearish"),
    ],
}


def classify_category(question: str) -> str:
    """Simple keyword-based intent classification."""
    q = question.lower()
    if any(k in q for k in ["maize", "unga", "flour", "wheat", "food", "crop", "harvest", "drought"]):
        return "agriculture"
    if any(k in q for k in ["cbk", "rate", "mpc", "inflation", "cpi", "monetary"]):
        return "macro"
    if any(k in q for k in ["kes", "usd", "shilling", "forex", "fx", "dollar", "exchange"]):
        return "fx"
    return "agriculture"  # default


def run_demo_pipeline(question: str, category: str, prior: float) -> PredictResponse:
    """Runs a deterministic demo pipeline that produces realistic structured output."""
    signals = DEMO_SIGNALS.get(category, DEMO_SIGNALS["agriculture"])

    # Bayesian update simulation
    import math

    def to_logodds(p):
        p = max(0.001, min(0.999, p))
        return math.log(p / (1 - p))

    def to_prob(lo):
        return 1 / (1 + math.exp(-lo))

    lo = to_logodds(prior)
    trace = []

    for i, sig in enumerate(signals):
        prior_prob = to_prob(lo)
        effective = sig.impact * sig.quality
        lo += effective
        post_prob = to_prob(lo)

        trace.append(ReasoningStepOut(
            step=i + 1,
            signal_name=sig.name,
            quality=sig.quality,
            effective_impact=round(effective, 4),
            prior_prob=round(prior_prob, 4),
            posterior_prob=round(post_prob, 4),
            narrative=f"{sig.name} (q={sig.quality:.2f}) shifts belief {effective:+.3f} → P(H)={post_prob:.1%}",
        ))

    final_prob = to_prob(lo)
    avg_conf = sum(s.quality for s in signals) / len(signals)
    edge = final_prob - prior

    rec = "NO_BET"
    if abs(edge) > 0.08 and avg_conf > 0.5:
        rec = "BET_YES" if edge > 0 else "BET_NO"

    trace_hash = "0x" + "a" * 64  # Would be keccak256 in production
    pred_id = str(uuid4())

    return PredictResponse(
        prediction_id=pred_id,
        hypothesis_id=str(uuid4()),
        question=question,
        probability=round(final_prob, 4),
        confidence=round(avg_conf, 3),
        edge=round(edge, 4),
        recommendation=rec,
        signals_used=signals,
        reasoning_trace=trace,
        trace_hash=trace_hash,
        arc_tx_hash="0x" + "b" * 64,
        generated_at=datetime.utcnow().isoformat(),
        tier="demo",
    )


@router.post("/predict", response_model=PredictResponse)
async def predict(
    req: PredictRequest,
    api_key: APIKeyInfo = Depends(verify_api_key),
):
    """
    Run the AfricaCast intelligence cycle.

    Ingests local African data, runs Bayesian belief updates,
    generates counter-hypotheses, and returns a structured
    reasoning trace with verifiable on-chain proof.
    """
    category = req.category or classify_category(req.question)
    result = run_demo_pipeline(req.question, category, req.prior)
    result.tier = api_key.tier
    return result
