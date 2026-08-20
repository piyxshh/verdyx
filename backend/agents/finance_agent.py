"""
Finance Agent — Solvency & Liquidity Interpreter

Reads debt/liquidity ratios and the ML prediction, explains the solvency picture.
Does NOT generate its own probability estimate.
"""

from orchestrator.state import ScenarioState
from prediction.feature_config import FINANCE_FEATURES
from agents.base_agent import build_agent_prompt, invoke_agent


async def finance_agent_node(state: ScenarioState) -> dict:
    """
    LangGraph node: Finance Agent.

    Interprets the solvency and liquidity picture behind the ML prediction.

    Input from state:
        - distress_probability
        - top_factors
        - company_features (filtered to debt/liquidity domain)

    Output to state:
        - finance_report: str
    """
    # Extract finance-relevant features from the full feature set
    relevant_features = {
        k: v for k, v in state["company_features"].items()
        if k in FINANCE_FEATURES
    }

    messages = build_agent_prompt(
        agent_role="Financial Solvency & Liquidity Analyst",
        agent_instructions="""Analyze the company's solvency position and liquidity cushion.

Specifically:
1. Assess the debt ratio — is it within the healthy range for companies in this dataset that did NOT go bankrupt?
2. Evaluate the current ratio — does it provide adequate short-term liquidity?
3. Examine retained earnings relative to total assets — does the company have accumulated buffers?
4. Assess working capital adequacy — is there enough operational breathing room?
5. Conclude with a summary: is the solvency picture consistent with the model's distress probability?

Reference specific threshold values where possible (e.g., "a debt ratio above 0.5 was associated with
higher distress rates in the training data").""",
        distress_probability=state["distress_probability"],
        top_factors=state["top_factors"],
        relevant_features=relevant_features,
    )

    report = await invoke_agent(messages)
    return {"finance_report": report}
