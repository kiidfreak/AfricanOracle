import asyncio
import os
import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from app.core.db import SessionLocal
from app.models import db_models
from app.ingestion.collectors import JSONCollector, RSSCollector
from app.ingestion.climate import CHIRPSRainsCollector
from app.ingestion.agriculture import ICPACMaizeCollector
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

    chirps_source = db.query(db_models.SourceRegistry).filter_by(short_code="CHIRPS").first()
    if not chirps_source:
        chirps_source = db_models.SourceRegistry(
            name="Climate Hazards Group InfraRed Precipitation (CHIRPS)",
            short_code="CHIRPS",
            base_credibility=0.95,
            source_type="api",
            region=["KE", "ETH", "SOM"],
            decay_half_life_hours=168
        )
        db.add(chirps_source)

    icpac_source = db.query(db_models.SourceRegistry).filter_by(short_code="ICPAC").first()
    if not icpac_source:
        icpac_source = db_models.SourceRegistry(
            name="IGAD Climate Prediction and Applications Centre (ICPAC)",
            short_code="ICPAC",
            base_credibility=0.88,
            source_type="geoportal",
            region=["KE"],
            decay_half_life_hours=720
        )
        db.add(icpac_source)
        
    db.commit()

    # 1. Collect JSON Data (Mocked API for maize prices)
    json_collector = JSONCollector(
        source_id=str(knbs_source.source_id),
        endpoint="https://jsonplaceholder.typicode.com/posts/1" 
    )
    data = json_collector.fetch()
    
    numeric_sanitizer = NumericSanitizer(rolling_mean=100.0, rolling_std=15.0)
    
    if data:
        mock_price = float(data.get("id", 100)) + 900
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

    # 2. Collect RSS Data
    rss_collector = RSSCollector(
        source_id=str(news_source.source_id),
        endpoint="http://rss.cnn.com/rss/edition_africa.rss"
    )
    feed_entries = rss_collector.fetch()
    
    text_sanitizer = TextSanitizer()
    for entry in feed_entries[:3]:
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

    # 3. Collect CHIRPS Rainfall Anomaly Data
    chirps_collector = CHIRPSRainsCollector(source_id=str(chirps_source.source_id))
    rains_data = chirps_collector.fetch()
    
    # We validate standard anomalies using a z-score sanitizer (mean=0.0, std=1.0)
    anomaly_sanitizer = NumericSanitizer(rolling_mean=0.0, rolling_std=1.0)
    for item in rains_data:
        val = item["anomaly"]
        sanitized = anomaly_sanitizer.sanitize(
            value=val,
            signal_class="rainfall_anomaly",
            decay_half_life_hours=168,
            last_updated=datetime.utcnow()
        )
        if sanitized.flag in (QualityFlag.CLEAN, QualityFlag.STATISTICAL_OUTLIER):
            signal = db_models.Signal(
                source_id=chirps_source.source_id,
                name=f"{item['region']} Rainfall Deficit",
                signal_class="rainfall_anomaly",
                layer="L1",
                value=sanitized.value,
                unit="z_score",
                direction="bearish" if val < 0 else "bullish", # negative anomaly means deficit/drought (bearish for crops)
                impact=val * -0.4, # drought has higher impact
                confidence=0.90,
                region=[item["region"]]
            )
            db.add(signal)
            print(f"[Worker] Ingested Climate Signal: {signal.name} -> {signal.value} ({sanitized.flag})")

    # 4. Collect ICPAC Maize Production Data
    maize_collector = ICPACMaizeCollector(source_id=str(icpac_source.source_id))
    prod_data = maize_collector.fetch()
    
    # Validate using maize production statistics (mean=4.3M tonnes, std=0.5M tonnes)
    prod_sanitizer = NumericSanitizer(rolling_mean=4300000.0, rolling_std=500000.0)
    for item in prod_data:
        val = item["value"]
        sanitized = prod_sanitizer.sanitize(
            value=val,
            signal_class="maize_production",
            decay_half_life_hours=720,
            last_updated=datetime.utcnow()
        )
        if sanitized.flag in (QualityFlag.CLEAN, QualityFlag.STATISTICAL_OUTLIER):
            signal = db_models.Signal(
                source_id=icpac_source.source_id,
                name=f"{item['region']} Maize Production ({item['year']})",
                signal_class="maize_production",
                layer="L1",
                value=sanitized.value,
                unit="Tonnes",
                direction="bullish" if val > 4300000.0 else "bearish",
                impact=0.3,
                confidence=0.85,
                region=[item["region"]]
            )
            db.add(signal)
            print(f"[Worker] Ingested Agricultural Signal: {signal.name} -> {signal.value} Tonnes ({sanitized.flag})")

    db.commit()
    db.close()
    print("[Worker] Ingestion Cycle Complete.")

if __name__ == "__main__":
    asyncio.run(run_ingestion())
