from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from app.api import signals, hypotheses
from app.agents.orchestrator import OrchestratorAgent
from uuid import UUID
from app.models.db_models import Base
from app.core.db import engine, get_db

# Create tables on startup (simple approach for now)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Dhamiri Backend",
    description="Bayesian belief-updating system for African regional signals.",
    version="1.0.0"
)

app.include_router(signals.router)
app.include_router(hypotheses.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to Dhamiri Backend API"}

@app.post("/predict")
async def run_prediction(hypothesis_id: UUID, db: Session = Depends(get_db)):
    orchestrator = OrchestratorAgent(db)
    result = await orchestrator.run_prediction_cycle(hypothesis_id)
    return result
