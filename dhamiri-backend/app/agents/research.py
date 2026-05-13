import os
import requests
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models import db_models, schemas
from uuid import UUID
from datetime import datetime, timedelta

class ResearchAgent:
    """
    Agent responsible for gathering and filtering relevant signals.
    Now supports Minifetch for high-fidelity regional data extraction.
    """
    MINIFETCH_BASE_URL = "https://minifetch.com/api/v1"

    def __init__(self, db: Session):
        self.db = db
        self.api_key = os.getenv("MINIFETCH_API_KEY")

    async def gather_signals(self, hypothesis_id: UUID, lookback_hours: int = 72) -> List[db_models.Signal]:
        # 1. Fetch the hypothesis
        hypothesis = self.db.query(db_models.Hypothesis).filter(db_models.Hypothesis.hypothesis_id == hypothesis_id).first()
        if not hypothesis:
            return []

        # 2. Define lookback window
        cutoff = datetime.utcnow() - timedelta(hours=lookback_hours)

        # 3. Fetch signals (simple version: fetch by region and category match)
        # In a real implementation, this would use semantic search or more complex filtering
        signals = self.db.query(db_models.Signal).filter(
            db_models.Signal.created_at >= cutoff,
            # For demo, we just get signals related to the region
            # db_models.Signal.region.overlap(hypothesis.tags) 
        ).all()


        return signals

    def extract_deep_signal(self, url: str) -> str:
        """
        Uses Minifetch to get LLM-ready content.
        """
        if not self.api_key:
            print("[Research] Warning: MINIFETCH_API_KEY not set.")
            return f"Basic content from {url}"
            
        endpoint = f"{self.MINIFETCH_BASE_URL}/extract/url-content"
        headers = {"Authorization": f"Bearer {self.api_key}"}
        params = {"url": url}
        
        try:
            response = requests.get(endpoint, headers=headers, params=params)
            if response.status_code == 200:
                # Based on minifetch-api docs, result is in results[0].data.content
                data = response.json()
                results = data.get("results", [])
                if results:
                    return results[0].get("data", {}).get("content", "")
        except Exception as e:
            print(f"[Research] Minifetch error: {e}")
            
        return f"Fallback content for {url}"
