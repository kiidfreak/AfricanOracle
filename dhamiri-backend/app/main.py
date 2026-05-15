"""
AfricaCast / Dhamiri Backend — Main Application.

Intelligence API for emerging market signals.
Serves prediction markets, traders, hedge funds, and protocols.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.api import signals, hypotheses
from app.api.v1 import predict as v1_predict
from app.api.v1 import data as v1_data
from app.models.db_models import Base
from app.core.db import engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables
    Base.metadata.create_all(bind=engine)
    print("[AfricaCast] Database initialized")
    print("[AfricaCast] v1 API ready — serving intelligence")
    yield
    # Shutdown
    print("[AfricaCast] Shutting down")


app = FastAPI(
    title="AfricaCast Intelligence API",
    description=(
        "On-chain reasoning infrastructure for emerging market intelligence. "
        "Turns local African signals into structured, verifiable probabilities."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS — allow frontend + external consumers
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Lock down in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Legacy routes (internal) ─────────────────────────────────────────────────
app.include_router(signals.router)
app.include_router(hypotheses.router)

# ── v1 API (production) ──────────────────────────────────────────────────────
app.include_router(v1_predict.router)
app.include_router(v1_data.router)


@app.get("/")
def read_root():
    return {
        "service": "AfricaCast Intelligence API",
        "version": "1.0.0",
        "status": "operational",
        "docs": "/docs",
        "endpoints": {
            "predict": "/v1/predict",
            "datasets": "/v1/datasets",
            "traces": "/v1/traces/{hash}",
            "questions": "/v1/questions",
        },
    }


@app.get("/health")
def health():
    return {"status": "ok", "service": "africast-backend"}
