import math
from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from app.engine import bayes
from app.models import db_models, schemas
from datetime import datetime

class HypothesisAgent:
    """
    Agent 3 - The Thinker/Skeptic.
    Challenges the primary thesis and generates counter-scenarios.
    """
    def __init__(self, db: Session):
        self.db = db

    async def challenge(
        self, 
        primary_belief: Any, 
        signals: List[Dict[str, Any]], 
        quality_scores: Dict[str, float],
        category: str
    ) -> Dict[str, Any]:
        """
        Generates a counter-scenario and estimates its probability.
        """
        # 1. Generate counter scenario narrative based on category
        counter_scenario = self._generate_counter_scenario(category)

        # 2. Estimate counter probability (Independent Bayesian run)
        # We look for "opposing" signals - in this simplified version, 
        # we'll just run a update with an inverted prior and scaled impact of bearish signals.
        
        # Invert prior: if prior was 0.6, counter-prior is 0.4
        counter_prior = 1.0 - getattr(primary_belief, 'prior', 0.5)
        
        # Filter signals that support the counter-thesis (bearish relative to the primary)
        # For simplicity, we'll just use all signals but invert their impact for the counter-view
        counter_signals = []
        for s in signals:
            cs = s.copy()
            cs['impact'] = -s['impact'] # Invert impact
            counter_signals.append(cs)

        counter_belief, _ = bayes.update_belief(
            prior=counter_prior,
            signals=counter_signals,
            quality_scores=quality_scores
        )

        disagreement = abs(primary_belief.probability - counter_belief.probability)
        
        return {
            "primary_probability": round(primary_belief.probability, 4),
            "counter_scenario": counter_scenario,
            "counter_probability": round(counter_belief.probability, 4),
            "disagreement_score": round(disagreement, 4),
            "implied_volatility": "HIGH" if disagreement > 0.25 else "NORMAL",
            "narrative": (
                f"Counter thesis: {counter_scenario}. "
                f"If correct, probability inverts to {counter_belief.probability:.1%}."
            )
        }

    def _generate_counter_scenario(self, category: str) -> str:
        COUNTER_TEMPLATES = {
            "agriculture": "Surprise rainfall recovery stabilizes supply",
            "fx": "CBK FX intervention caps KES weakness",
            "macro": "MPC holds rates — inflation viewed as transitory",
            "energy": "EPRA review delays price hike",
        }
        return COUNTER_TEMPLATES.get(category.lower(), "Market conditions reverse unexpectedly")
