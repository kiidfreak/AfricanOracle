import asyncio
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.db_models import Base
from app.models import db_models
from app.agents.orchestrator import OrchestratorAgent
from uuid import uuid4

# Setup In-Memory SQLite for Demo
DEMO_DATABASE_URL = "sqlite:///./demo.db"
engine = create_engine(DEMO_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base.metadata.drop_all(bind=engine) # Clear old data
Base.metadata.create_all(bind=engine)

async def run_live_demo():
    print("\nStarting AfricaCast 5-Agent Live Simulation")
    db = SessionLocal()
    orchestrator = OrchestratorAgent(db)

    # 1. Setup Demo Data (Hypothesis & Source)
    print("\n[Demo] Setting up environment...")
    source = db_models.SourceRegistry(
        name="Kenya Meteorological Department",
        short_code="KMD",
        base_credibility=0.85,
        source_type="government_api",
        region=["KE"],
        decay_half_life_hours=12
    )
    db.add(source)
    db.commit()

    hypothesis = db_models.Hypothesis(
        question="Will Kenya maize prices rise >5% by end of Q3 2026?",
        market_id="0xMarket_Maize_Q3",
        platform="polymarket",
        category="agriculture",
        prior=0.5,
    )
    db.add(hypothesis)
    db.commit()
    db.refresh(hypothesis)

    # 2. Simulate Signal Ingestion
    print(f"\n[Demo] Researching signals for hypothesis: '{hypothesis.question}'")
    
    # Create an L1 Signal: Rainfall Deficit
    signal1 = db_models.Signal(
        source_id=source.source_id,
        name="Rift Valley Rainfall Deficit",
        signal_class="weather",
        layer="L1",
        value=-1.8, # z-score
        unit="z_score",
        direction="bearish", # bearish for supply -> bullish for price
        impact=0.8,
        confidence=0.9,
        region=["KE"]
    )
    db.add(signal1)
    db.commit()

    # 3. Trigger Orchestration Cycle (The 5-Agent Flow)
    print("\n[Orchestrator] Running 5-Agent Intelligence Cycle...")
    prediction = await orchestrator.run_prediction_cycle(hypothesis.hypothesis_id)

    print("\n--- SIMULATION RESULTS ---")
    print(f"Prediction ID:    {prediction.prediction_id}")
    print(f"Posterior P(H):   {prediction.posterior:.2%}")
    print(f"Edge vs Market:   {prediction.edge:+.2%}")
    print(f"Recommendation:   {prediction.recommendation}")
    print(f"Confidence:       {prediction.confidence:.2%}")
    
    meta = prediction.meta_data
    if meta:
        print("\n--- AGENT INSIGHTS ---")
        print(f"Hypothesis Agent (Challenge): {meta['challenge']['counter_scenario']}")
        print(f"Disagreement Score:           {meta['challenge']['disagreement_score']}")
        print(f"Trace Hash (On-Chain):        {meta['trace_hash'][:16]}...")
        print(f"Arc Transaction Hash:         {meta['arc_tx_hash']}")
        
        print("\n--- LATENCY BREAKDOWN ---")
        for agent, lat in meta['latencies'].items():
            print(f"  {agent.capitalize()}: {lat}s")
        print(f"  TOTAL:    {meta['total_latency']}s")
    
    print("\n--- REASONING TRACE (Top 2 Steps) ---")
    for step in prediction.reasoning_trace[:2]:
        print(f"Step {step.step}: {step.narrative}")
    
    print("------------------------------------------\n")

    print("Simulation Complete. AfricaCast is ready for Arc Testnet deployment.")

if __name__ == "__main__":
    asyncio.run(run_live_demo())
