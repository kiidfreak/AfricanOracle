from fastapi import FastAPI
from app.api import signals, hypotheses
from app.models.db_models import Base
from app.core.db import engine

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
