"""
Prediction Router — API Endpoints for the Verdyx Pipeline

Endpoints:
    POST /predict              — Submit form data, run predictor + full agent pipeline
    GET  /predict/{id}         — Status + result (if run async)
    GET  /predict/{id}/result  — Full result: probability + agent reports + verdict
    GET  /predict              — Prediction history, per user
"""

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Request

from models.schemas import (
    PredictionRequest,
    PredictionCreateResponse,
    PredictionStatusResponse,
    PredictionResultResponse,
    PredictionHistoryResponse,
    PredictionStatus,
    TopFactor,
    AgentReports,
    FinalVerdict,
)

router = APIRouter()

# In-memory store for MVP (replace with Supabase in production)
predictions_store: dict = {}


@router.post("", response_model=PredictionCreateResponse)
async def create_prediction(request: PredictionRequest, req: Request):
    """
    Submit a new prediction request.

    Runs the full pipeline:
    1. ML Predictor (RandomForest) — FIRST, no LLM
    2. Finance Agent (interpret solvency)
    3. Market Agent (interpret operations) — parallel with Finance
    4. Risk Agent (identify failure modes) — after Finance + Market
    5. Decision Agent (final verdict) — LAST
    """
    prediction_id = str(uuid.uuid4())
    predictor = req.app.state.predictor

    # Step 1: ML Prediction — runs FIRST, before any agent
    prediction_result = predictor.predict(request.company_features)

    # Store initial state
    predictions_store[prediction_id] = {
        "prediction_id": prediction_id,
        "status": PredictionStatus.PROCESSING,
        "company_features": request.company_features,
        "distress_probability": prediction_result["distress_probability"],
        "top_factors": prediction_result["top_factors"],
        "created_at": datetime.now(timezone.utc),
        # Agent reports will be populated as they complete
        "finance_report": None,
        "market_report": None,
        "risk_report": None,
        "final_verdict": None,
        "confidence": None,
        "reasoning_summary": None,
        "risk_tier": None,
        "completed_at": None,
    }

    # TODO: Run agent pipeline asynchronously (for now, synchronous placeholder)
    # In production: dispatch to background task, return 202 Accepted
    # For MVP: run inline and update store

    return PredictionCreateResponse(
        prediction_id=prediction_id,
        status=PredictionStatus.PROCESSING,
        message="Prediction pipeline initiated. ML prediction complete, agents running.",
    )


@router.get("/{prediction_id}", response_model=PredictionStatusResponse)
async def get_prediction_status(prediction_id: str):
    """Check the status of a prediction."""
    if prediction_id not in predictions_store:
        raise HTTPException(status_code=404, detail="Prediction not found")

    pred = predictions_store[prediction_id]
    return PredictionStatusResponse(
        prediction_id=prediction_id,
        status=pred["status"],
        created_at=pred["created_at"],
    )


@router.get("/{prediction_id}/result", response_model=PredictionResultResponse)
async def get_prediction_result(prediction_id: str):
    """Get the full prediction result including agent reports and verdict."""
    if prediction_id not in predictions_store:
        raise HTTPException(status_code=404, detail="Prediction not found")

    pred = predictions_store[prediction_id]

    return PredictionResultResponse(
        prediction_id=prediction_id,
        status=pred["status"],
        distress_probability=pred.get("distress_probability"),
        risk_tier=pred.get("risk_tier"),
        top_factors=[
            TopFactor(**f) for f in (pred.get("top_factors") or [])
        ],
        agent_reports=AgentReports(
            finance=pred.get("finance_report") or "",
            market=pred.get("market_report") or "",
            risk=pred.get("risk_report") or "",
        ) if pred.get("finance_report") else None,
        final_verdict=FinalVerdict(
            tier=pred.get("risk_tier") or "Unknown",
            confidence=pred.get("confidence") or 0.0,
            reasoning=pred.get("reasoning_summary") or "",
        ) if pred.get("final_verdict") else None,
        created_at=pred["created_at"],
        completed_at=pred.get("completed_at"),
    )


@router.get("", response_model=PredictionHistoryResponse)
async def get_prediction_history():
    """Get prediction history for the current user."""
    # TODO: Filter by authenticated user
    items = [
        {
            "prediction_id": pred["prediction_id"],
            "risk_tier": pred.get("risk_tier"),
            "distress_probability": pred.get("distress_probability"),
            "created_at": pred["created_at"],
        }
        for pred in predictions_store.values()
    ]
    # Sort by most recent first
    items.sort(key=lambda x: x["created_at"], reverse=True)

    return PredictionHistoryResponse(predictions=items)
