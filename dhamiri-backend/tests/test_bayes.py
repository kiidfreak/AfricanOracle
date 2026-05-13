import pytest
from app.engine import bayes

def test_to_logodds():
    """Test probability to log-odds conversion."""
    assert bayes.to_logodds(0.5) == 0.0
    assert bayes.to_logodds(0.999) > 0.0
    assert bayes.to_logodds(0.001) < 0.0

def test_to_probability():
    """Test log-odds to probability conversion."""
    assert round(bayes.to_probability(0.0), 2) == 0.5
    assert bayes.to_probability(5.0) > 0.9
    assert bayes.to_probability(-5.0) < 0.1

def test_update_belief_single_signal():
    """Test belief update with one signal."""
    prior = 0.5
    signals = [{"signal_id": "s1", "name": "Rainfall", "impact": 1.0}]
    quality_scores = {"s1": 1.0}
    
    belief, trace = bayes.update_belief(prior, signals, quality_scores)
    
    # Impact is 1.0 log-odds. Prior 0.5 is 0.0 log-odds.
    # New log-odds should be 1.0. 
    # P = 1 / (1 + exp(-1)) approx 0.731
    assert round(belief.probability, 3) == 0.731
    assert len(trace) == 1
    assert trace[0].signal_id == "s1"

def test_update_belief_quality_scaling():
    """Test that low quality signals have less impact."""
    prior = 0.5
    signals = [{"signal_id": "s1", "name": "Low Quality Signal", "impact": 1.0}]
    quality_scores = {"s1": 0.1} # Only 10% weight
    
    belief, trace = bayes.update_belief(prior, signals, quality_scores)
    
    # Effective impact = 1.0 * 0.1 = 0.1
    # New log-odds = 0.1. P approx 0.525
    assert round(belief.probability, 3) == 0.525
