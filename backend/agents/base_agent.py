"""
Base Agent — Shared Utilities for All Interpretation Agents

Provides:
- Common prompt template construction
- LLM invocation wrapper with error handling
- Response parsing utilities

All agents inherit from this pattern. Each agent receives the ML prediction
as established fact and interprets it — never generates its own estimate.
"""

from langchain_core.messages import HumanMessage, SystemMessage

from orchestrator.config import get_llm


def build_agent_prompt(
    agent_role: str,
    agent_instructions: str,
    distress_probability: float,
    top_factors: list[dict],
    relevant_features: dict[str, float],
    additional_context: str = "",
) -> list:
    """
    Build a structured prompt for an interpretation agent.

    The prompt template enforces the architectural invariant: the ML prediction
    is presented as fact, and the agent is explicitly told NOT to generate its
    own probability estimate.

    Args:
        agent_role: Role description (e.g., "Financial Solvency Analyst")
        agent_instructions: Specific task instructions for this agent
        distress_probability: ML prediction (0.0 to 1.0)
        top_factors: Top contributing features from the model
        relevant_features: Domain-specific features for this agent
        additional_context: Optional additional context (e.g., other agent reports)

    Returns:
        List of LangChain messages ready for LLM invocation
    """
    system_prompt = f"""You are the {agent_role} in Verdyx, a financial distress analysis system.

IMPORTANT: The distress probability of {distress_probability * 100:.1f}% has already been
computed by a trained RandomForestClassifier on verified financial data from the
Taiwanese Bankruptcy Prediction dataset (6,819 companies, 95 financial ratios).

Your job is to INTERPRET and EXPLAIN this prediction — NOT to generate your own
probability estimate. The number is a fact produced by the ML model; your job is
to explain WHY it makes sense (or what nuances it might miss) given the financial
data below.

Do NOT say "I estimate..." or "I think the probability is...". The probability
is {distress_probability * 100:.1f}%. Explain what the data tells us about why."""

    # Format top factors
    factors_str = "\n".join(
        f"  - {f['feature']}: importance {f['importance']:.4f}"
        for f in top_factors
    )

    # Format relevant features
    features_str = "\n".join(
        f"  - {name}: {value}"
        for name, value in relevant_features.items()
    )

    human_prompt = f"""## Prediction Context
- **Distress Probability:** {distress_probability * 100:.1f}%
- **Top Contributing Factors (from model):**
{factors_str}

## Company Financial Data (Your Domain)
{features_str}

{f"## Additional Context{chr(10)}{additional_context}" if additional_context else ""}

## Your Task
{agent_instructions}

Respond in 3-5 concise paragraphs. Be specific — reference actual numbers from the data above.
Do not use generic platitudes. If a ratio is healthy, say so. If it's dangerous, name the specific risk."""

    return [
        SystemMessage(content=system_prompt),
        HumanMessage(content=human_prompt),
    ]


async def invoke_agent(messages: list) -> str:
    """
    Invoke the configured LLM with the given messages.

    Args:
        messages: List of LangChain messages (System + Human)

    Returns:
        Agent's response as a string

    Raises:
        Exception: If LLM invocation fails
    """
    try:
        llm = get_llm()
        response = await llm.ainvoke(messages)
        return response.content
    except Exception as e:
        return f"[Agent Error: {str(e)}]"
