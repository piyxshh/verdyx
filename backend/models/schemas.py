"""
Pydantic Models — Request/Response Schemas for the Verdyx API

Defines validation schemas for all API endpoints.
"""

from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class PredictionStatus(str, Enum):
    """Status of a prediction through the pipeline."""
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class PredictionRequest(BaseModel):
    """Request body for POST /predict."""
    company_features: dict[str, float] = Field(
        ...,
        description="Financial ratios from the input form (8-10 key features)",
        json_schema_extra={
            "example": {
                "Debt ratio %": 0.62,
                "Current Ratio": 1.1,
                "Net Income to Total Assets": 0.02,
                "Operating Profit Rate": 0.04,
                "Retained Earnings to Total Assets": 0.05,
                "Revenue Per Share (Yen)": 0.15,
                "Total Asset Turnover": 0.8,
                "Working Capital to Total Assets": 0.12,
            }
        },
    )


class TopFactor(BaseModel):
    """A top contributing feature from the model."""
    feature: str
    importance: float


class AgentReports(BaseModel):
    """Reports from each interpretation agent."""
    finance: str = ""
    market: str = ""
    risk: str = ""


class FinalVerdict(BaseModel):
    """The Decision Agent's final output."""
    tier: str = Field(..., description="Low Risk | Medium Risk | High Risk")
    confidence: float = Field(..., ge=0.0, le=1.0)
    reasoning: str


class PredictionStatusResponse(BaseModel):
    """Response for GET /predict/{id} (status check)."""
    prediction_id: str
    status: PredictionStatus
    created_at: datetime


class PredictionResultResponse(BaseModel):
    """Full response for GET /predict/{id}/result."""
    prediction_id: str
    status: PredictionStatus
    distress_probability: Optional[float] = None
    risk_tier: Optional[str] = None
    top_factors: list[TopFactor] = []
    agent_reports: Optional[AgentReports] = None
    final_verdict: Optional[FinalVerdict] = None
    created_at: datetime
    completed_at: Optional[datetime] = None


class PredictionCreateResponse(BaseModel):
    """Response for POST /predict (creation confirmation)."""
    prediction_id: str
    status: PredictionStatus
    message: str = "Prediction pipeline initiated"


class PredictionHistoryItem(BaseModel):
    """Summary item for prediction history listing."""
    prediction_id: str
    risk_tier: Optional[str] = None
    distress_probability: Optional[float] = None
    created_at: datetime


class PredictionHistoryResponse(BaseModel):
    """Response for GET /predict (history listing)."""
    predictions: list[PredictionHistoryItem]
