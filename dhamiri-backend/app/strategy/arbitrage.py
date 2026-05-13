from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from uuid import UUID

class ArbitrageOpportunity(BaseModel):
    strategy_type: str # "rebalancing" | "combinatorial"
    market_ids: List[str]
    expected_profit: float
    recommendation: str
    reasoning: str

class ArbitrageEngine:
    """
    Engine to detect and evaluate arbitrage opportunities in prediction markets.
    Inspired by 'Unravelling the Probabilistic Forest' (arXiv:2508.03474v1).
    """
    
    def check_rebalancing(self, market_id: str, outcome_prices: Dict[str, float]) -> Optional[ArbitrageOpportunity]:
        """
        Detects intra-market arbitrage (Market Rebalancing).
        Formula: sum(P_yes) != 1.0
        """
        prices = list(outcome_prices.values())
        total_p = sum(prices)
        
        if total_p < 0.98: # Threshold to account for spread/fees
            profit = 1.0 - total_p
            return ArbitrageOpportunity(
                strategy_type="rebalancing",
                market_ids=[market_id],
                expected_profit=profit,
                recommendation="BUY_ALL",
                reasoning=f"Sum of probabilities ({total_p:.3f}) is less than 1.0. Guaranteed profit: {profit:.3f} per dollar."
            )
        elif total_p > 1.02:
            profit = total_p - 1.0
            return ArbitrageOpportunity(
                strategy_type="rebalancing",
                market_ids=[market_id],
                expected_profit=profit,
                recommendation="SHORT_OVERVALUED",
                reasoning=f"Sum of probabilities ({total_p:.3f}) is greater than 1.0. NO tokens are undervalued."
            )
        return None

    def check_combinatorial(self, market_a: Dict[str, Any], market_b: Dict[str, Any], dependency_mapping: Dict[str, str]) -> Optional[ArbitrageOpportunity]:
        """
        Detects inter-market arbitrage (Combinatorial).
        Example: P(A) < P(A & B) is logically impossible.
        """
        # Logic to compare probabilities across markets based on semantic dependencies
        # This would use the mapping provided by the Research Agent's LLM
        price_a = market_a.get("price", 0.0)
        price_b = market_b.get("price", 0.0)
        
        # Simple logical check: if Outcome A implies Outcome B, then P(A) <= P(B)
        # If P(A) > P(B), then arbitrage exists.
        if price_a > (price_b + 0.05):
            profit = price_a - price_b
            return ArbitrageOpportunity(
                strategy_type="combinatorial",
                market_ids=[market_a["id"], market_b["id"]],
                expected_profit=profit,
                recommendation="SELL_A_BUY_B",
                reasoning=f"Logical inconsistency: P({market_a['name']})={price_a:.2f} > P({market_b['name']})={price_b:.2f} despite dependency."
            )
        return None
