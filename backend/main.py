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

from prediction.predictor import Predictor
from routers import predict

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

    model_path = os.getenv("MODEL_PATH", "../ml/models/predictor.pkl")
    medians_path = os.getenv("MEDIANS_PATH", "../ml/models/feature_medians.json")

    print(f"Loading model from: {model_path}")
    predictor = Predictor(model_path=model_path, medians_path=medians_path)
    print("Model loaded successfully.")

    # Store predictor in app state for access in routes
    app.state.predictor = predictor

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
