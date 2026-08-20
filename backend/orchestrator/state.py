"""
ScenarioState — Shared State Schema for LangGraph Pipeline

This TypedDict defines the single state object that flows through the entire
agent orchestration pipeline. Fields are populated in strict order:

1. company_features (from user form)
2. distress_probability + top_factors (from ML predictor — FIRST, before any LLM)
3. finance_report + market_report (from Finance/Market agents — parallel)
4. risk_report (from Risk Agent — after Finance + Market)
5. final_verdict + confidence + reasoning_summary (from Decision Agent — LAST)
"""

from typing import TypedDict


class ScenarioState(TypedDict):
    """State object shared across all LangGraph nodes."""

    # --- Input (populated from form submission) ---
    scenario_id: str                        # UUID, assigned at creation
    user_id: str                            # From Supabase auth
    company_features: dict[str, float]      # 8-10 user fields + median-filled remainder

    # --- ML Prediction (populated by predictor node — FIRST) ---
    distress_probability: float             # 0.0 to 1.0, from predict_proba
    top_factors: list[dict[str, any]]       # [{feature, importance}, ...], top 5

    # --- Agent Reports (populated by interpretation agents) ---
    finance_report: str                     # From Finance Agent
    market_report: str                      # From Market Agent
    risk_report: str                        # From Risk Agent

    # --- Final Verdict (populated by Decision Agent — LAST) ---
    final_verdict: str                      # "Low Risk" | "Medium Risk" | "High Risk"
    confidence: float                       # 0.0 to 1.0
    reasoning_summary: str                  # Plain-English explanation
