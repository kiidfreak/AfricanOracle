import pytest
from app.engine import bayes
from app.agents.hypothesis import HypothesisAgent
from pydantic import BaseModel

# Mock BeliefState for testing HypothesisAgent
class MockBelief(BaseModel):
    probability: float
    prior: float = 0.5

def test_bayesian_update_consistency():
    """Verify that Bayesian update returns the correct structure and confidence."""
    prior = 0.5
    signals = [{"signal_id": "s1", "name": "Signal 1", "impact": 0.5}]
    quality_scores = {"s1": 1.0}
    
    belief, trace = bayes.update_belief(prior, signals, quality_scores)
    
    assert hasattr(belief, "probability")
    assert hasattr(belief, "confidence")
    assert belief.confidence == 1.0
    assert len(trace) == 1
    assert "->" in trace[0].narrative

def test_hypothesis_agent_challenge():
    """Verify that the Hypothesis Agent correctly generates counter-theses."""
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    
    # Mock DB
    engine = create_engine("sqlite:///:memory:")
    Session = sessionmaker(bind=engine)
    db = Session()
    
    agent = HypothesisAgent(db)
    primary_belief = MockBelief(probability=0.7, prior=0.5)
    signals = [{"signal_id": "s1", "name": "Signal 1", "impact": 0.5}]
    quality_scores = {"s1": 1.0}
    
    # Use a dummy category
    challenge = agent.db.query # Just checking init
    
    # We can run the async method using pytest-asyncio if installed, 
    # but for now let's just check logic if possible or run synchronously in a simple way.
    # Since I'm in a script, I'll use a helper to run async.
    import asyncio
    
    loop = asyncio.get_event_loop()
    result = loop.run_until_complete(agent.challenge(primary_belief, signals, quality_scores, "agriculture"))
    
    assert "counter_scenario" in result
    assert "disagreement_score" in result
    assert result["primary_probability"] == 0.7
    assert result["counter_probability"] < 0.7 # Since impact was inverted
