import math
import re
from datetime import datetime, timedelta
from typing import Optional, Dict, List, Any
from dataclasses import dataclass
from app.engine.scoring import QualityFlag

@dataclass
class SanitizedValue:
    value: Optional[float]
    flag: QualityFlag
    z_score: float = 0.0

class NumericSanitizer:
    """
    Applied to: commodity prices, FX rates, rainfall mm, NDVI values.
    """
    def __init__(self, rolling_mean: float = 0.0, rolling_std: float = 1.0):
        self.rolling_mean = rolling_mean
        self.rolling_std = rolling_std

    def sanitize(self, value: Optional[float], signal_class: str, decay_half_life_hours: int, last_updated: datetime) -> SanitizedValue:
        # 1. Null / NaN guard
        if value is None or math.isnan(value):
            return SanitizedValue(value=None, flag=QualityFlag.MISSING)

        # 2. Physical bounds check
        if not self._within_physical_bounds(value, signal_class):
            return SanitizedValue(value=None, flag=QualityFlag.PHYSICALLY_IMPLAUSIBLE)

        # 3. Statistical outlier detection (rolling z-score)
        z = (value - self.rolling_mean) / (self.rolling_std + 1e-8)
        if abs(z) > 4.0:
            return SanitizedValue(value=value, flag=QualityFlag.STATISTICAL_OUTLIER, z_score=z)

        # 4. Staleness check
        age_hours = (datetime.utcnow() - last_updated).total_seconds() / 3600
        if age_hours > decay_half_life_hours * 2:
            return SanitizedValue(value=value, flag=QualityFlag.STALE)

        return SanitizedValue(value=value, flag=QualityFlag.CLEAN)

    def _within_physical_bounds(self, value: float, signal_class: str) -> bool:
        BOUNDS = {
            "maize_price_ksh_per_90kg":  (800, 12000),
            "rainfall_mm_daily":         (0, 300),
            "usd_kes":                   (50, 250),
            "ndvi":                      (-1.0, 1.0),
            "fuel_pump_ksh_per_litre":   (80, 400),
        }
        low, high = BOUNDS.get(signal_class, (-1e9, 1e9))
        return low <= value <= high

class TextSanitizer:
    """
    Applied to: news headlines, social media, farmer reports.
    """
    def sanitize(self, raw_text: str) -> Dict[str, Any]:
        # 1. Basic normalization (placeholder for ftfy)
        text = raw_text.strip()
        
        # 2. Language detection (placeholder)
        # In a real app, we'd use langdetect
        lang = "en" 
        if lang not in ("en", "sw"):
            return {"text": text, "flag": QualityFlag.UNSUPPORTED_LANGUAGE}

        # 3. Spam / low-quality filter
        if len(text.split()) < 3:
            return {"text": text, "flag": QualityFlag.LOW_QUALITY}

        # 4. NLP enrichment (placeholder)
        sentiment_score = 0.0 # Neutral
        
        return {
            "text": text,
            "sentiment": sentiment_score,
            "flag": QualityFlag.CLEAN
        }
