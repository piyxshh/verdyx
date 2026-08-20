"""
LangGraph Orchestrator — Agent Pipeline Graph

Defines the StateGraph that orchestrates the full prediction + interpretation pipeline:

    predictor → [finance_agent, market_agent] (parallel) → risk_agent → decision_agent

The predictor node runs FIRST (pure ML, no LLM). This is the core architectural invariant.
"""

from langgraph.graph import StateGraph, END

from orchestrator.state import ScenarioState


def create_prediction_graph(predictor, finance_agent, market_agent, risk_agent, decision_agent):
    """
    Build and compile the LangGraph StateGraph for the Verdyx pipeline.

    Args:
        predictor: Callable that runs ML prediction (no LLM)
        finance_agent: Callable for Finance Agent node
        market_agent: Callable for Market Agent node
        risk_agent: Callable for Risk Agent node
        decision_agent: Callable for Decision Agent node

    Returns:
        Compiled LangGraph ready to invoke
    """
    # Define the graph
    graph = StateGraph(ScenarioState)

    # Add nodes
    graph.add_node("predictor", predictor)
    graph.add_node("finance_agent", finance_agent)
    graph.add_node("market_agent", market_agent)
    graph.add_node("risk_agent", risk_agent)
    graph.add_node("decision_agent", decision_agent)

    # Set entry point — predictor always runs FIRST
    graph.set_entry_point("predictor")

    # Wire edges:
    # predictor → finance_agent AND market_agent (parallel)
    graph.add_edge("predictor", "finance_agent")
    graph.add_edge("predictor", "market_agent")

    # finance_agent → risk_agent
    # market_agent → risk_agent
    # (Risk agent waits for both)
    graph.add_edge("finance_agent", "risk_agent")
    graph.add_edge("market_agent", "risk_agent")

    # risk_agent → decision_agent
    graph.add_edge("risk_agent", "decision_agent")

    # decision_agent → END
    graph.add_edge("decision_agent", END)

    # Compile
    compiled = graph.compile()
    return compiled
