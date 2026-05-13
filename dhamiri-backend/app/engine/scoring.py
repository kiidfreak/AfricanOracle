import math
from datetime import datetime
from typing import List, Dict
from enum import Enum

class QualityFlag(str, Enum):
    CLEAN = "CLEAN"
    STATISTICAL_OUTLIER = "STATISTICAL_OUTLIER"
    STALE = "STALE"
    LOW_QUALITY = "LOW_QUALITY"
    MISSING = "MISSING"
    PHYSICALLY_IMPLAUSIBLE = "PHYSICALLY_IMPLAUSIBLE"
    UNSUPPORTED_LANGUAGE = "UNSUPPORTED_LANGUAGE"
    DUPLICATE = "DUPLICATE"

def compute_quality_score(
    created_at: datetime,
    base_credibility: float,
    decay_half_life_hours: int,
    reliability_history: List[float],
    quality_flags: List[str]
) -> float:
    """
    q = base_credibility × freshness_factor × completeness_factor × reliability_factor
    """
    # Freshness: exponential decay based on signal age
    age_hours = (datetime.utcnow() - created_at).total_seconds() / 3600
    freshness = math.exp(-age_hours / decay_half_life_hours)

    # Reliability: source's rolling historical accuracy
    # Default to 0.5 if no history
    if reliability_history:
        recent_history = reliability_history[-10:]
        reliability = sum(recent_history) / len(recent_history)
    else:
        reliability = 0.5

    # Quality flag penalties
    FLAG_PENALTIES = {
        QualityFlag.CLEAN:                 1.00,
        QualityFlag.STATISTICAL_OUTLIER:   0.70,
        QualityFlag.STALE:                 0.40,
        QualityFlag.LOW_QUALITY:           0.25,
        QualityFlag.MISSING:               0.00,
        QualityFlag.PHYSICALLY_IMPLAUSIBLE: 0.10,
    }
    
    # Use the first flag or default to CLEAN
    flag = quality_flags[0] if quality_flags else QualityFlag.CLEAN
    flag_multiplier = FLAG_PENALTIES.get(flag, 0.5)

    # Simplified completeness factor (could be expanded based on schema)
    completeness = 1.0 

    return (
        base_credibility
        * freshness
        * completeness
        * reliability
        * flag_multiplier
    )
