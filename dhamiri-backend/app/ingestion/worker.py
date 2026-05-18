import asyncio
import os
import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from app.core.db import SessionLocal
from app.models import db_models
from app.ingestion.collectors import JSONCollector, RSSCollector
from app.ingestion.sanitizers import NumericSanitizer, TextSanitizer
from app.engine.scoring import QualityFlag

async def run_ingestion():
    print("[Worker] Starting Data Ingestion Cycle...")
    db: Session = SessionLocal()
    
    # Ensure some sources exist
    knbs_source = db.query(db_models.SourceRegistry).filter_by(short_code="KNBS").first()
    if not knbs_source:
        knbs_source = db_models.SourceRegistry(
            name="Kenya National Bureau of Statistics (Mock)",
            short_code="KNBS",
            base_credibility=0.9,
            source_type="api",
            region=["KE"],
            decay_half_life_hours=24
        )
        db.add(knbs_source)
    
    news_source = db.query(db_models.SourceRegistry).filter_by(short_code="NEWS").first()
    if not news_source:
        news_source = db_models.SourceRegistry(
            name="Local Business News",
            short_code="NEWS",
            base_credibility=0.7,
            source_type="rss",
            region=["KE", "EA"],
            decay_half_life_hours=12
        )
        db.add(news_source)
        
    db.commit()

    # 1. Collect JSON Data (Mocked API for maize prices)
    # Using a public placeholder API just for demonstration purposes
    json_collector = JSONCollector(
        source_id=str(knbs_source.source_id),
        endpoint="https://jsonplaceholder.typicode.com/posts/1" 
    )
    data = json_collector.fetch()
    
    numeric_sanitizer = NumericSanitizer(rolling_mean=100.0, rolling_std=15.0)
    
    if data:
        # Mock parsing a value from the JSON response
        # Let's pretend the 'id' field is a price point 
        mock_price = float(data.get("id", 100)) + 900 # Shift into maize price bounds (800-12000)
        
        sanitized = numeric_sanitizer.sanitize(
            value=mock_price, 
            signal_class="maize_price_ksh_per_90kg", 
            decay_half_life_hours=24, 
            last_updated=datetime.utcnow()
        )
        
        if sanitized.flag in (QualityFlag.CLEAN, QualityFlag.STATISTICAL_OUTLIER):
            signal = db_models.Signal(
                source_id=knbs_source.source_id,
                name="Maize Wholesale Price Update",
                signal_class="maize_price_ksh_per_90kg",
                layer="L1",
                value=sanitized.value,
                unit="KSh",
                direction="neutral",
                impact=0.5,
                confidence=0.8,
                region=["KE"]
            )
            db.add(signal)
            print(f"[Worker] Ingested Numeric Signal: {signal.name} -> {signal.value} ({sanitized.flag})")
        else:
            print(f"[Worker] Rejected Numeric Signal due to flag: {sanitized.flag}")

    # 2. Collect RSS Data
    rss_collector = RSSCollector(
        source_id=str(news_source.source_id),
        endpoint="http://rss.cnn.com/rss/edition_africa.rss" # Public Africa news feed
    )
    feed_entries = rss_collector.fetch()
    
    text_sanitizer = TextSanitizer()
    
    for entry in feed_entries[:3]: # Just take top 3 for demo
        summary_text = entry.get("summary", "")
        if summary_text:
            result = text_sanitizer.sanitize(summary_text)
            
            if result["flag"] == QualityFlag.CLEAN:
                signal = db_models.Signal(
                    source_id=news_source.source_id,
                    name=f"News: {entry.get('title', 'Headline')}",
                    signal_class="news_sentiment",
                    layer="L1",
                    value=result["sentiment"],
                    unit="polarity",
                    direction="bullish" if result["sentiment"] > 0 else "bearish",
                    impact=abs(result["sentiment"]) * 0.5,
                    confidence=0.6,
                    region=["EA"]
                )
                db.add(signal)
                print(f"[Worker] Ingested Text Signal: {signal.name} -> Sentiment: {signal.value:.2f}")
            else:
                print(f"[Worker] Rejected Text Signal due to flag: {result['flag']}")
                
    db.commit()
    db.close()
    print("[Worker] Ingestion Cycle Complete.")

if __name__ == "__main__":
    asyncio.run(run_ingestion())
