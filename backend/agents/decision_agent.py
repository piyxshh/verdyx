"""
Decision Agent — Final Verdict Synthesizer

Reads all agent reports + distress probability and produces:
- Risk tier (Low / Medium / High)
- Confidence score (0.0 to 1.0)
- Plain-English reasoning summary
"""

from orchestrator.state import ScenarioState
from agents.base_agent import build_agent_prompt, invoke_agent

import json


async def decision_agent_node(state: ScenarioState) -> dict:
    """
    LangGraph node: Decision Agent (final node).

    Synthesizes all previous analysis into a single, actionable verdict.

    Input from state:
        - distress_probability
        - top_factors
        - finance_report
        - market_report
        - risk_report

    Output to state:
        - final_verdict: "Low Risk" | "Medium Risk" | "High Risk"
        - confidence: float (0.0 to 1.0)
        - reasoning_summary: str
    """
    additional_context = f"""### Finance Agent Assessment
{state.get("finance_report", "Not available")}

### Market Agent Assessment
{state.get("market_report", "Not available")}

### Risk Agent Assessment
{state.get("risk_report", "Not available")}"""

    messages = build_agent_prompt(
        agent_role="Chief Decision Officer",
        agent_instructions="""Synthesize all analysis into a final verdict.

You must produce a structured response in EXACTLY this JSON format:
```json
{
    "risk_tier": "Low Risk" | "Medium Risk" | "High Risk",
    "confidence": <float 0.0 to 1.0>,
    "reasoning": "<2-3 sentence plain-English summary of primary drivers>"
}
```

Guidelines for risk tier:
- **Low Risk** (distress probability < 30%): Company has adequate buffers and healthy fundamentals
- **Medium Risk** (30-60%): Notable weaknesses that require attention but not imminent danger
- **High Risk** (>60%): Significant distress indicators, urgent action needed

Your confidence score reflects how clearly the data supports the risk tier assignment.
High confidence = all agents agree and data is unambiguous.
Low confidence = mixed signals or data quality concerns.

The reasoning should mention the 1-2 most important drivers (not all of them) and be
written for a non-technical executive audience.

Respond with ONLY the JSON object, no additional text.""",
        distress_probability=state["distress_probability"],
        top_factors=state["top_factors"],
        relevant_features={},  # Decision agent doesn't need raw features
        additional_context=additional_context,
    )

    response = await invoke_agent(messages)

    # Parse the JSON response
    try:
        # Try to extract JSON from the response
        response_clean = response.strip()
        if response_clean.startswith("```json"):
            response_clean = response_clean[7:]
        if response_clean.startswith("```"):
            response_clean = response_clean[3:]
        if response_clean.endswith("```"):
            response_clean = response_clean[:-3]
        response_clean = response_clean.strip()

        verdict = json.loads(response_clean)

        return {
            "final_verdict": verdict.get("risk_tier", "Unknown"),
            "confidence": float(verdict.get("confidence", 0.5)),
            "reasoning_summary": verdict.get("reasoning", response),
        }
    except (json.JSONDecodeError, KeyError, ValueError):
        # Fallback: use the raw response as reasoning
        prob = state["distress_probability"]
        tier = "High Risk" if prob > 0.6 else ("Medium Risk" if prob > 0.3 else "Low Risk")
        return {
            "final_verdict": tier,
            "confidence": 0.5,
            "reasoning_summary": response,
        }
