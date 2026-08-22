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


@router.post("", response_model=PredictionResultResponse)
async def create_prediction(request: PredictionRequest, req: Request):
    """
    Submit a new prediction request.

    Runs the full pipeline synchronously (inline) and returns the complete result:
    1. ML Predictor (RandomForest) — FIRST, no LLM
    2. Finance Agent (interpret solvency)
    3. Market Agent (interpret operations) — parallel with Finance
    4. Risk Agent (identify failure modes) — after Finance + Market
    5. Decision Agent (final verdict) — LAST

    Total latency ~8-15s (dominated by the 4 LLM calls).
    """
    prediction_id = str(uuid.uuid4())
    graph = req.app.state.graph

    # Initial state — only inputs; the predictor node populates everything ML-related
    initial_state = {
        "scenario_id": prediction_id,
        "user_id": "anonymous",  # auth not wired yet
        "company_features": request.company_features,
    }

    try:
        final_state = await graph.ainvoke(initial_state)
    except Exception as e:
        predictions_store[prediction_id] = {
            "prediction_id": prediction_id,
            "status": PredictionStatus.FAILED,
            "company_features": request.company_features,
            "created_at": datetime.now(timezone.utc),
            "completed_at": datetime.now(timezone.utc),
        }
        raise HTTPException(status_code=500, detail=f"Prediction pipeline failed: {e}")

    record = {
        "prediction_id": prediction_id,
        "status": PredictionStatus.COMPLETED,
        "company_features": request.company_features,
        "distress_probability": final_state["distress_probability"],
        "top_factors": final_state["top_factors"],
        "finance_report": final_state.get("finance_report"),
        "market_report": final_state.get("market_report"),
        "risk_report": final_state.get("risk_report"),
        "final_verdict": final_state.get("final_verdict"),
        "confidence": final_state.get("confidence"),
        "reasoning_summary": final_state.get("reasoning_summary"),
        "risk_tier": final_state.get("final_verdict"),
        "created_at": datetime.now(timezone.utc),
        "completed_at": datetime.now(timezone.utc),
    }
    predictions_store[prediction_id] = record

    return _build_result_response(record)


def _build_result_response(pred: dict) -> PredictionResultResponse:
    """Assemble the full result response from a stored prediction record."""
    return PredictionResultResponse(
        prediction_id=pred["prediction_id"],
        status=pred["status"],
        distress_probability=pred.get("distress_probability"),
        risk_tier=pred.get("risk_tier"),
        top_factors=[TopFactor(**f) for f in (pred.get("top_factors") or [])],
        agent_reports=(
            AgentReports(
                finance=pred.get("finance_report") or "",
                market=pred.get("market_report") or "",
                risk=pred.get("risk_report") or "",
            )
            if pred.get("finance_report")
            else None
        ),
        final_verdict=(
            FinalVerdict(
                tier=pred.get("risk_tier") or "Unknown",
                confidence=pred.get("confidence") or 0.0,
                reasoning=pred.get("reasoning_summary") or "",
            )
            if pred.get("final_verdict")
            else None
        ),
        created_at=pred["created_at"],
        completed_at=pred.get("completed_at"),
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

    return _build_result_response(predictions_store[prediction_id])


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
