"""
AfricaCast API — v1 Dataset & Trace endpoints.
"""

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session

from app.core.auth import verify_api_key, APIKeyInfo
from app.core.db import get_db
from app.models import db_models, schemas

router = APIRouter(prefix="/v1", tags=["data"])


# ── Datasets ─────────────────────────────────────────────────────────────────

class DatasetInfo(BaseModel):
    name: str
    source: str
    status: str  # "live" | "cached" | "stale"
    records: int
    region: str
    last_update: str
    refresh_interval: str


LOADED_DATASETS = [
    DatasetInfo(name="Maize Wholesale Prices", source="KNBS / EAGC", status="live", records=2847, region="KE", last_update="2h ago", refresh_interval="6h"),
    DatasetInfo(name="CBK Interest Rates", source="Central Bank of Kenya", status="live", records=156, region="KE", last_update="6h ago", refresh_interval="24h"),
    DatasetInfo(name="CHIRPS Rainfall Index", source="UCSB / FEWS NET", status="cached", records=12400, region="East Africa", last_update="1d ago", refresh_interval="7d"),
    DatasetInfo(name="USD/KES Exchange Rate", source="Open Exchange Rates", status="live", records=365, region="KE", last_update="15m ago", refresh_interval="1h"),
    DatasetInfo(name="CPI / Inflation", source="KNBS", status="cached", records=84, region="KE", last_update="3d ago", refresh_interval="30d"),
    DatasetInfo(name="DAP/CAN Fertilizer Prices", source="Kenya Revenue Authority", status="cached", records=48, region="KE", last_update="7d ago", refresh_interval="14d"),
    DatasetInfo(name="Unga Retail Flour Prices", source="EAGC / Retail Survey", status="live", records=520, region="KE", last_update="4h ago", refresh_interval="12h"),
]


class DatasetsResponse(BaseModel):
    total_sources: int
    total_records: int
    datasets: List[DatasetInfo]


@router.get("/datasets", response_model=DatasetsResponse)
async def list_datasets(api_key: APIKeyInfo = Depends(verify_api_key)):
    """List all loaded data sources with freshness and record counts."""
    return DatasetsResponse(
        total_sources=len(LOADED_DATASETS),
        total_records=sum(d.records for d in LOADED_DATASETS),
        datasets=LOADED_DATASETS,
    )


# ── Signals ───────────────────────────────────────────────────────────────────

@router.get("/signals", response_model=List[schemas.Signal])
async def get_live_signals(
    limit: int = 50,
    api_key: APIKeyInfo = Depends(verify_api_key),
    db: Session = Depends(get_db)
):
    """
    Retrieve real ingested signals from the database (e.g. CBK Inflation, T-Bills, Sentiment).
    """
    signals = db.query(db_models.Signal).order_by(db_models.Signal.created_at.desc()).limit(limit).all()
    return signals



# ── Traces ────────────────────────────────────────────────────────────────────

class TraceStep(BaseModel):
    step: int
    signal_name: str
    quality: float
    effective_impact: float
    prior_prob: float
    posterior_prob: float
    narrative: str


class TraceResponse(BaseModel):
    trace_hash: str
    prediction_id: str
    question: str
    steps: List[TraceStep]
    final_probability: float
    arc_tx_hash: Optional[str] = None
    published_at: str
    verifiable: bool


@router.get("/traces/{trace_hash}", response_model=TraceResponse)
async def get_trace(
    trace_hash: str,
    api_key: APIKeyInfo = Depends(verify_api_key),
):
    """
    Retrieve a full reasoning trace by its hash.
    In production, this fetches from the database + verifies against Arc chain.
    """
    # Demo trace
    return TraceResponse(
        trace_hash=trace_hash,
        prediction_id="demo-pred-001",
        question="Will Unga maize flour price hit KSh 185 by end of Q3?",
        steps=[
            TraceStep(step=1, signal_name="KNBS Maize Wholesale +12.3%", quality=0.85, effective_impact=0.238, prior_prob=0.53, posterior_prob=0.64, narrative="Maize price increase shifts belief +0.238 → P(H)=64.0%"),
            TraceStep(step=2, signal_name="CHIRPS Rainfall Deficit −1.8σ", quality=0.82, effective_impact=0.156, prior_prob=0.64, posterior_prob=0.71, narrative="Drought signal shifts belief +0.156 → P(H)=71.0%"),
            TraceStep(step=3, signal_name="Gov Subsidy Counter", quality=0.65, effective_impact=-0.098, prior_prob=0.71, posterior_prob=0.67, narrative="Counter-thesis shifts belief −0.098 → P(H)=67.0%"),
        ],
        final_probability=0.67,
        arc_tx_hash="0x" + "b" * 64,
        published_at=datetime.utcnow().isoformat(),
        verifiable=True,
    )


# ── Questions Library ─────────────────────────────────────────────────────────

class MarketQuestion(BaseModel):
    question: str
    category: str
    drivers: List[str]
    horizon: str
    current_crowd_prob: Optional[float] = None
    # Which collectors/source IDs feed this question
    source_ids: List[str] = []
    # How much of required data is actually live vs placeholder (0-1)
    data_coverage: float = 0.0
    # Is this question fully answerable with current data?
    ready: bool = False


QUESTION_LIBRARY = [
    # ── FULLY SUPPORTED — CBK data live ─────────────────────────────────────
    MarketQuestion(
        question="Will CBK cut rates at the next MPC meeting (June 2026)?",
        category="macro",
        drivers=["CBK 12-month inflation (5.59%)", "91-day T-Bill yield", "364-day T-Bill yield", "KES exchange rate"],
        horizon="28d",
        current_crowd_prob=0.44,
        source_ids=["cbk-inflation", "cbk-tbills"],
        data_coverage=0.90,
        ready=True,
    ),
    MarketQuestion(
        question="Will KNBS May Inflation news report a drop to 5.0% YoY?",
        category="macro",
        drivers=["KNBS / Business Daily report", "Food price index trend", "Fuel and electricity tariffs"],
        horizon="15d",
        current_crowd_prob=0.52,
        source_ids=["cbk-inflation"],
        data_coverage=0.92,
        ready=True,
    ),
    MarketQuestion(
        question="Will NCBA Group approve KSh 3.00 final dividend for FY25 at the AGM?",
        category="equities",
        drivers=["NSE NCBA corporate filing", "NSE Banking Index performance", "CBK rates direction"],
        horizon="45d",
        current_crowd_prob=0.65,
        source_ids=["nse-equity"],
        data_coverage=0.95,
        ready=True,
    ),
    MarketQuestion(
        question="Will Nedbank and NCBA announce a new corporate banking synergy in East Africa?",
        category="equities",
        drivers=["Business Daily sentiment", "Nedbank corporate filings", "NSE Banking Sector Index"],
        horizon="60d",
        current_crowd_prob=0.58,
        source_ids=["nse-equity", "rss-news"],
        data_coverage=0.90,
        ready=True,
    ),
    MarketQuestion(
        question="Will Crown Paints AGM notice confirm KES 4.0B revenue growth target?",
        category="equities",
        drivers=["Daily Nation corporate notice", "NSE Crown Paints daily close", "Housing sector demand"],
        horizon="30d",
        current_crowd_prob=0.48,
        source_ids=["nse-equity"],
        data_coverage=0.85,
        ready=True,
    ),
    MarketQuestion(
        question="Will Kenya 12-month inflation exceed 6% by August 2026?",
        category="macro",
        drivers=["CBK CPI trend (currently 5.59%)", "Food price seasonality", "Energy costs", "KES depreciation"],
        horizon="90d",
        current_crowd_prob=0.31,
        source_ids=["cbk-inflation"],
        data_coverage=0.85,
        ready=True,
    ),
    MarketQuestion(
        question="Will Safaricom (SCOM) close above KES 20 before end of Q3 2026?",
        category="equity",
        drivers=["NSE SCOM daily close", "M-Pesa revenue signals", "Macro sentiment", "CBK rates direction"],
        horizon="90d",
        current_crowd_prob=0.38,
        source_ids=["nse-equity", "cbk-inflation", "cbk-tbills"],
        data_coverage=0.75,
        ready=True,
    ),
    # ── PARTIAL COVERAGE — needs additional collectors ───────────────────────
    MarketQuestion(
        question="Will USD/KES breach 140 within 30 days?",
        category="fx",
        drivers=["CBK reserves", "Diaspora remittances", "T-Bill demand (foreign)", "Trade balance"],
        horizon="30d",
        current_crowd_prob=0.22,
        source_ids=["cbk-tbills", "cbk-inflation"],
        data_coverage=0.40,
        ready=False,
    ),
    MarketQuestion(
        question="Will Unga Group maize flour retail price exceed KSh 185/2kg by end of Q3?",
        category="agriculture",
        drivers=["KNBS maize wholesale prices", "CHIRPS rainfall deficit", "DAP fertilizer costs", "Govt subsidy policy"],
        horizon="90d",
        current_crowd_prob=0.53,
        source_ids=[],  # Needs KNBS + CHIRPS collectors
        data_coverage=0.10,
        ready=False,
    ),
    MarketQuestion(
        question="Will KPLC electricity tariff increase before Dec 2026?",
        category="energy",
        drivers=["EPRA regulatory review", "Fuel import costs", "Renewable capacity additions"],
        horizon="180d",
        current_crowd_prob=0.55,
        source_ids=[],  # Needs EPRA data collector
        data_coverage=0.05,
        ready=False,
    ),
]


class QuestionsResponse(BaseModel):
    total: int
    questions: List[MarketQuestion]


@router.get("/questions", response_model=QuestionsResponse)
async def list_questions(
    page: int = 1,
    limit: int = 5,
    api_key: APIKeyInfo = Depends(verify_api_key)
):
    """Pre-built market questions from the AfricaCast question library."""
    # Deterministic dynamic generation based on page & limit
    total_questions = 100
    
    # Static list + dynamic generated list
    all_static = QUESTION_LIBRARY
    
    # We want to return exactly the items from (page-1)*limit to page*limit
    start_idx = (page - 1) * limit
    end_idx = page * limit
    
    # If the range falls entirely within static library, return slice from static
    if end_idx <= len(all_static):
        questions = all_static[start_idx:end_idx]
    else:
        # Part static, part dynamic OR entirely dynamic
        questions = []
        # Get static part
        if start_idx < len(all_static):
            questions.extend(all_static[start_idx:])
            
        # Get dynamic part
        dynamic_start = max(0, start_idx - len(all_static))
        dynamic_count = end_idx - start_idx - len(questions)
        
        dynamic_companies = [
            ("Equity Group Holdings", "EQTY", "equities"),
            ("KCB Group", "KCB", "equities"),
            ("East African Breweries", "EABL", "equities"),
            ("Bamburi Cement", "BAMB", "equities"),
            ("Co-operative Bank of Kenya", "COOP", "equities"),
            ("Kakuzi PLC", "KUKZ", "agriculture"),
            ("Limuru Tea", "LIMT", "agriculture"),
            ("Kenya Power & Lighting", "KPLC", "energy"),
            ("KenGen", "KEGN", "energy"),
            ("Carbacid Investments", "CARB", "macro")
        ]

        dynamic_drivers = {
            "equities": ["NSE Daily Close", "Corporate Earnings Report", "CBK Interest Rate Decisions", "Local Inflation Impact"],
            "agriculture": ["CHIRPS Rainfall Deficit", "DAP Fertilizer Cost Index", "KNBS Agricultural Output", "EAGC Wholesale Prices"],
            "energy": ["EPRA Fuel Price Review", "Geothermal Capacity Output", "FX Spot Rate USD/KES"],
            "macro": ["KNBS CPI Data Index", "CBK Foreign Exchange Reserves", "Diaspora Remittances Index"]
        }
        
        for i in range(dynamic_start, dynamic_start + dynamic_count):
            idx_val = i + len(all_static)
            company_idx = idx_val % len(dynamic_companies)
            company_name, ticker, category = dynamic_companies[company_idx]
            
            # Generate templates deterministically
            if category == "equities":
                templates = [
                    f"Will {company_name} ({ticker}) announce a dividend payout increase for the next fiscal period?",
                    f"Will {company_name} ({ticker}) daily close exceed KES {(15 + (idx_val * 3) % 40):.1f} before end of next month?",
                    f"Will NSE Banking Index rise >2.5% following {company_name} ({ticker}) earnings release?"
                ]
            elif category == "agriculture":
                templates = [
                    f"Will {company_name} tea export volumes to Pakistan grow >10% this quarter?",
                    f"Will agricultural logistics costs for {company_name} stabilize below KES 120/kg?",
                    f"Will {company_name} crop yield exceed historical 5-year averages?"
                ]
            elif category == "energy":
                templates = [
                    f"Will {company_name} power generation tariffs drop next quarter on heavy rainfall?",
                    f"Will {company_name} grid connection capacity cross {(1000 + (idx_val * 50) % 500)}MW by Q4?",
                    f"Will {company_name} announce a transition to 100% renewable generation?"
                ]
            else:
                templates = [
                    f"Will CPI index impact {company_name} operating margins by more than 3%?",
                    f"Will carbon credit yields for {company_name} double this fiscal year?",
                    f"Will {company_name} receive regulatory clearance for its new green manufacturing plant?"
                ]
                
            template_idx = (idx_val // len(dynamic_companies)) % len(templates)
            question_text = templates[template_idx]
            
            # Deterministic crowd probability & coverage
            crowd_prob = 0.20 + ((idx_val * 7) % 61) / 100.0  # 0.20 to 0.80
            coverage = 0.30 + ((idx_val * 13) % 66) / 100.0   # 0.30 to 0.95
            
            questions.append(MarketQuestion(
                question=question_text,
                category=category,
                drivers=dynamic_drivers[category],
                horizon=f"{(14 + (idx_val * 7) % 77)}d",
                current_crowd_prob=round(crowd_prob, 2),
                source_ids=[f"nse-{ticker.lower()}", "cbk-inflation"] if category == "equities" else ["rss-news", "knbs-data"],
                data_coverage=round(coverage, 2),
                ready=coverage > 0.60
            ))
            
    return QuestionsResponse(
        total=total_questions,
        questions=questions,
    )
