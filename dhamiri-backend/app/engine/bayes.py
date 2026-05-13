import math
from typing import List, Tuple, Dict
from pydantic import BaseModel
from datetime import datetime

class ReasoningStep(BaseModel):
    step: int
    signal_id: str
    signal_name: str
    prior_logodds: float
    impact: float
    posterior_logodds: float
    posterior_prob: float
    narrative: str

class BeliefState(BaseModel):
    probability: float
    log_odds: float
    confidence: float

def to_logodds(p: float) -> float:
    """Converts a probability to log-odds, with clamping to avoid infinity."""
    p = max(0.001, min(0.999, p))
    return math.log(p / (1 - p))

def to_probability(log_odds: float) -> float:
    """Converts log-odds to a probability."""
    return 1 / (1 + math.exp(-log_odds))

def update_belief(
    prior: float,
    signals: List[Dict],
    quality_scores: Dict[str, float]
) -> Tuple[BeliefState, List[ReasoningStep]]:
    """
    Sequentially update belief across all signals.
    Returns final belief state and full reasoning trace.
    """
    current_logodds = to_logodds(prior)
    trace = []

    for i, signal in enumerate(signals):
        signal_id = signal.get("signal_id")
        q = quality_scores.get(signal_id, 0.5)

        # Scale impact by quality score
        # Impact is assumed to be in log-odds delta
        raw_impact = signal.get("impact", 0.0)
        effective_impact = raw_impact * q

        prior_logodds = current_logodds
        current_logodds += effective_impact
        posterior_prob = to_probability(current_logodds)

        trace.append(ReasoningStep(
            step=i + 1,
            signal_id=signal_id,
            signal_name=signal.get("name", "Unknown Signal"),
            prior_logodds=prior_logodds,
            impact=effective_impact,
            posterior_logodds=current_logodds,
            posterior_prob=posterior_prob,
            narrative=f"{signal.get('name')} (quality={q:.2f}) shifts belief "
                      f"by {effective_impact:+.3f} log-odds -> "
                      f"P(H)={posterior_prob:.3f}"
        ))

    avg_confidence = sum(quality_scores.values()) / len(quality_scores) if quality_scores else 0.0

    return BeliefState(
        probability=to_probability(current_logodds),
        log_odds=current_logodds,
        confidence=round(avg_confidence, 3)
    ), trace

def compute_effective_impact(impact: float, quality_score: float, created_at: datetime) -> float:
    """
    effective_impact = raw_impact × quality_score × recency_boost
    Clamped to [-1.5, +1.5] to prevent single signals dominating.
    """
    # Recency boost: signals < 6 hours old get a 1.2× multiplier
    age_hours = (datetime.utcnow() - created_at).total_seconds() / 3600
    recency_boost = 1.2 if age_hours < 6 else 1.0

    raw = impact * quality_score * recency_boost
    return max(-1.5, min(1.5, raw))
