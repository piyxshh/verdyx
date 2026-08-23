"""
Market Agent — Operating Position & Competitive Interpreter

Reads margin/revenue-related ratios and the ML prediction, explains the
company's operational efficiency and competitive position.
Does NOT generate its own probability estimate.
"""

from orchestrator.state import ScenarioState
from prediction.feature_config import MARKET_FEATURES
from agents.base_agent import build_agent_prompt, invoke_agent


async def market_agent_node(state: ScenarioState) -> dict:
    """
    LangGraph node: Market Agent.

    Interprets the operating and competitive position behind the ML prediction.

    Input from state:
        - distress_probability
        - top_factors
        - company_features (filtered to margin/revenue domain)

    Output to state:
        - market_report: str
    """
    # Extract market-relevant features (normalize for leading-space mismatch)
    market_set = {f.strip() for f in MARKET_FEATURES}
    relevant_features = {
        k.strip(): v for k, v in state["company_features"].items()
        if k.strip() in market_set
    }

    messages = build_agent_prompt(
        agent_role="Market & Operations Analyst",
        agent_instructions="""Analyze the company's operational efficiency and earnings quality.

You have EXACTLY these four ratios — do not reference operating margin, asset
turnover, or revenue per share (they are not part of this model's feature set),
and do not say data is missing. Interpret only what is listed above.

Specifically:
1. Persistent EPS in the Last Four Seasons — earnings stability across the
   trailing four quarters. Low values (< ~0.18) signal multi-period erosion.
2. Net Income to Total Assets (ROA) — core capital productivity.
3. Net profit before tax/Paid-in capital — profitability generated relative
   to the shareholder capital base.
4. After-tax net Interest Rate — net interest margin efficiency.

Assess whether the earnings profile supports durable operations or fragile,
leverage-dependent profitability. Conclude: does this operating picture support
or contradict the model's distress probability? Reference the actual numbers
above in every claim you make.""",
        distress_probability=state["distress_probability"],
        top_factors=state["top_factors"],
        relevant_features=relevant_features,
    )

    report = await invoke_agent(messages)
    return {"market_report": report}
