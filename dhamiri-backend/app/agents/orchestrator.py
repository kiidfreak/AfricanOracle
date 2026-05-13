import time
import os
from sqlalchemy.orm import Session
from app.agents.research import ResearchAgent
from app.agents.trader import TraderAgent
from app.agents.hypothesis import HypothesisAgent
from app.agents.trace import TraceAgent
# from app.core.identity import IdentityManager
from app.strategy.arbitrage import ArbitrageEngine
from app.engine import bayes, scoring
from app.models import db_models, schemas
from uuid import UUID
from datetime import datetime

class OrchestratorAgent:
    """
    Central brain coordinating the 5-agent flow:
    Orchestrator -> Research -> Hypothesis (Challenge) -> Bayesian Engine -> Trader -> Trace
    """
    def __init__(self, db: Session):
        self.db = db
        self.research_agent = ResearchAgent(db)
        self.hypothesis_agent = HypothesisAgent(db)
        self.trader_agent = TraderAgent(db)
        self.trace_agent = TraceAgent()
        # self.identity_manager = IdentityManager()
        self.identity_manager = None
        self.arbitrage_engine = ArbitrageEngine()

    async def run_prediction_cycle(self, hypothesis_id: UUID) -> schemas.Prediction:
        latencies = {}
        start_total = time.time()

        # 1. Fetch the hypothesis
        hypothesis = self.db.query(db_models.Hypothesis).filter(
            db_models.Hypothesis.hypothesis_id == hypothesis_id
        ).first()

        # 2. Research Agent: Gather signals
        start_step = time.time()
        db_signals = await self.research_agent.gather_signals(hypothesis_id)
        latencies['research'] = round(time.time() - start_step, 3)
        
        # 3. Process signals and quality scores
        signals_data = []
        quality_scores = {}
        for db_signal in db_signals:
            source = self.db.query(db_models.SourceRegistry).filter(
                db_models.SourceRegistry.source_id == db_signal.source_id
            ).first()
            
            base_credibility = float(source.base_credibility) if source else 0.5
            decay_half_life = source.decay_half_life_hours if source else 24
            
            q = scoring.compute_quality_score(
                created_at=db_signal.created_at,
                base_credibility=base_credibility,
                decay_half_life_hours=decay_half_life,
                reliability_history=[], 
                quality_flags=db_signal.quality_flags or []
            )
            
            signal_id_str = str(db_signal.signal_id)
            quality_scores[signal_id_str] = q
            signals_data.append({
                "signal_id": signal_id_str,
                "name": db_signal.name,
                "impact": float(db_signal.impact)
            })

        # 4. Bayesian Update (The Logic)
        start_step = time.time()
        belief, trace = bayes.update_belief(
            prior=float(hypothesis.prior),
            signals=signals_data,
            quality_scores=quality_scores
        )
        latencies['bayesian'] = round(time.time() - start_step, 3)

        # 5. Hypothesis Agent: Challenge the thesis
        start_step = time.time()
        challenge = await self.hypothesis_agent.challenge(
            primary_belief=belief,
            signals=signals_data,
            quality_scores=quality_scores,
            category=hypothesis.category
        )
        latencies['hypothesis'] = round(time.time() - start_step, 3)

        # 6. Fetch market price (Placeholder)
        market_price = 0.5 

        # 7. Trader Agent: Decision + Arc Execution
        start_step = time.time()
        edge = belief.probability - market_price
        recommendation = "NO_BET"
        if abs(edge) > 0.08 and belief.confidence > 0.5:
            recommendation = "BET_YES" if edge > 0 else "BET_NO"

        trade_result = None
        if recommendation != "NO_BET":
            trade_result = await self.trader_agent.execute_trade(
                market_id=hypothesis.market_id,
                recommendation=recommendation,
                amount=10.0 # Standard test amount
            )
        latencies['trader'] = round(time.time() - start_step, 3)

        # 8. Trace Agent: Publish reasoning on-chain
        start_step = time.time()
        trace_result = await self.trace_agent.publish(
            trace=[step.model_dump() for step in trace],
            hypothesis_id=str(hypothesis_id)
        )
        latencies['trace'] = round(time.time() - start_step, 3)

        # 9. Store prediction with new fields
        db_prediction = db_models.Prediction(
            hypothesis_id=hypothesis_id,
            prior=hypothesis.prior,
            posterior=belief.probability,
            market_price=market_price,
            edge=edge,
            kelly_fraction=0.0, 
            confidence=belief.confidence,
            recommendation=recommendation,
            reasoning_trace=[step.model_dump() for step in trace],
            # Adding metadata for new fields (assuming schema is updated or using JSON field)
            meta_data={
                "challenge": challenge,
                "trace_hash": trace_result['trace_hash'],
                "arc_tx_hash": trace_result['arc_tx_hash'],
                "latencies": latencies,
                "total_latency": round(time.time() - start_total, 3)
            }
        )
        
        self.db.add(db_prediction)
        self.db.commit()
        self.db.refresh(db_prediction)

        return schemas.Prediction.from_orm(db_prediction)

