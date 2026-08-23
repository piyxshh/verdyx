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
    # Extract finance-relevant features (normalize for leading-space mismatch
    # between dataset columns like " Debt ratio %" and config entries like "Debt ratio %")
    finance_set = {f.strip() for f in FINANCE_FEATURES}
    relevant_features = {
        k.strip(): v for k, v in state["company_features"].items()
        if k.strip() in finance_set
    }

    messages = build_agent_prompt(
        agent_role="Financial Solvency & Liquidity Analyst",
        agent_instructions="""Analyze the company's solvency position and capital-structure risk.

You have EXACTLY these six ratios — do not reference any other metric, and do not
say data is missing. Interpret only what is listed above.

Specifically:
1. Debt ratio % — what fraction of assets is creditor-funded? Compare to the
   healthy band for non-bankrupt firms in this dataset (median ~0.11; distress
   risk climbs sharply past ~0.30).
2. Borrowing dependency — how reliant is the firm on external borrowing?
   Values above ~0.60 were strongly associated with distressed firms.
3. Total debt/Total net worth — gearing. Above ~0.45, equity cushion is thin.
4. Net worth/Assets — the equity buffer available to absorb losses.
5. Retained Earnings to Total Assets — accumulated internal buffer.
6. Continuous interest rate (after tax) — how much of earnings the interest
   burden consumes.

Conclude: is this solvency picture consistent with the model's distress probability?
Reference the actual numbers above in every claim you make.""",
        distress_probability=state["distress_probability"],
        top_factors=state["top_factors"],
        relevant_features=relevant_features,
    )

    report = await invoke_agent(messages)
    return {"finance_report": report}
