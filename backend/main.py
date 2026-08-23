"""
Verdyx Backend — FastAPI Application

Main entry point for the Verdyx backend. Handles:
- CORS configuration
- Model loading at startup (lifespan)
- Router registration
- Health check endpoint
"""

import os
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from agents.decision_agent import decision_agent_node
from agents.finance_agent import finance_agent_node
from agents.market_agent import market_agent_node
from agents.risk_agent import risk_agent_node
from orchestrator.graph import create_prediction_graph
from prediction.predictor import Predictor
from routers import predict


def make_predictor_node(predictor_instance: Predictor):
    """
    Bind the loaded Predictor instance into a LangGraph node.

    The predictor node runs FIRST in the graph — pure ML, no LLM.
    It expands the user's 8-10 form fields into the full 95-feature vector
    (median-filled) and populates distress_probability + top_factors.
    """

    def predictor_node(state) -> dict:
        result = predictor_instance.predict(state["company_features"])
        return {
            "company_features": result["all_features"],  # full 95-feature vector
            "distress_probability": result["distress_probability"],
            "top_factors": result["top_factors"],
        }

    return predictor_node

# Load environment variables
root_dir = Path(__file__).resolve().parent.parent
load_dotenv(root_dir / ".env.local")
load_dotenv(root_dir / ".env")
load_dotenv()

# Global predictor instance — loaded once at startup
predictor: Predictor | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load ML model and resources at startup, clean up at shutdown."""
    global predictor

    backend_dir = Path(__file__).resolve().parent
    default_model = backend_dir.parent / "ml" / "models" / "predictor.pkl"
    default_medians = backend_dir.parent / "ml" / "models" / "feature_medians.json"

    model_path = os.getenv("MODEL_PATH", str(default_model))
    medians_path = os.getenv("MEDIANS_PATH", str(default_medians))

    print(f"Loading model from: {model_path}")
    predictor = Predictor(model_path=model_path, medians_path=medians_path)
    print("Model loaded successfully.")

    # Store predictor in app state for access in routes
    app.state.predictor = predictor

    # Build and compile the LangGraph pipeline:
    # predictor → [finance, market] (parallel) → risk → decision
    app.state.graph = create_prediction_graph(
        make_predictor_node(predictor),
        finance_agent_node,
        market_agent_node,
        risk_agent_node,
        decision_agent_node,
    )
    print("LangGraph pipeline compiled: predictor -> [finance, market] -> risk -> decision")

    yield

    # Cleanup
    print("Shutting down...")


app = FastAPI(
    title="Verdyx API",
    description="ML-Powered Multi-Agent System for Predictive Enterprise Decision Intelligence",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(predict.router, prefix="/predict", tags=["predictions"])


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "model_loaded": predictor is not None,
    }
