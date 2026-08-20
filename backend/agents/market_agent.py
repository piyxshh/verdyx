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
    # Extract market-relevant features from the full feature set
    relevant_features = {
        k: v for k, v in state["company_features"].items()
        if k in MARKET_FEATURES
    }

    messages = build_agent_prompt(
        agent_role="Market & Operations Analyst",
        agent_instructions="""Analyze the company's operational efficiency and competitive position.

Specifically:
1. Assess operating margin — does the company have pricing power or is margin compressed?
2. Evaluate asset turnover — is the company efficiently using its assets to generate revenue?
3. Examine profitability ratios — is net income to total assets adequate?
4. Assess revenue per share trends — what does this suggest about scale and efficiency?
5. Conclude: does the operating picture support or contradict the model's distress probability?

Focus on what the margins and efficiency ratios tell us about the company's competitive viability.
Companies with thin margins and low asset utilization have less buffer against shocks.""",
        distress_probability=state["distress_probability"],
        top_factors=state["top_factors"],
        relevant_features=relevant_features,
    )

    report = await invoke_agent(messages)
    return {"market_report": report}
