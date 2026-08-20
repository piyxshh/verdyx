"""
Risk Agent — Failure Mode Identifier

Reads the full prediction context plus Finance and Market reports.
Translates raw numbers into concrete, named failure modes.
Does NOT generate its own probability estimate.
"""

from orchestrator.state import ScenarioState
from agents.base_agent import build_agent_prompt, invoke_agent


async def risk_agent_node(state: ScenarioState) -> dict:
    """
    LangGraph node: Risk Agent.

    Identifies concrete failure modes by synthesizing ML prediction data
    with Finance and Market agent reports.

    Input from state:
        - distress_probability
        - top_factors
        - company_features (full set)
        - finance_report
        - market_report

    Output to state:
        - risk_report: str
    """
    # Use all features, not just a domain subset
    relevant_features = state["company_features"]

    # Build additional context from previous agent reports
    additional_context = f"""### Finance Agent Assessment
{state.get("finance_report", "Not yet available")}

### Market Agent Assessment
{state.get("market_report", "Not yet available")}"""

    messages = build_agent_prompt(
        agent_role="Risk Assessment Specialist",
        agent_instructions="""Identify specific, concrete failure modes for this company.

Your job is NOT to repeat what the Finance and Market agents said. Instead:

1. Identify COMPOUND risks — where do the finance and market weaknesses interact?
   (e.g., "high leverage + thin margin = no buffer for a single bad quarter")
2. Name specific failure scenarios — don't just say "risky", say WHAT would cause distress
   (e.g., "a 10% revenue drop would be unrecoverable given the current debt servicing load")
3. Assess the severity timeline — is this an imminent risk or a slow deterioration?
4. Identify any mitigating factors — is there anything in the data that provides a cushion?
5. Summarize the most dangerous single risk factor and the most dangerous combination.

Be concrete and specific. Generic statements like "the company faces risks" are not useful.
Name the specific scenario, the specific numbers that make it dangerous, and the specific
consequence.""",
        distress_probability=state["distress_probability"],
        top_factors=state["top_factors"],
        relevant_features=relevant_features,
        additional_context=additional_context,
    )

    report = await invoke_agent(messages)
    return {"risk_report": report}
