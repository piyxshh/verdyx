"""
Feature Configuration for Verdyx

Defines the 10 form fields (which ARE the model's 10 training features),
their validation ranges, true dataset medians, and the solvency/operations
domain split used for agent routing.

NOTE: Must stay in sync with ml/train_model.py FORM_FIELDS_RAW,
ml/models/feature_medians.json, ml/models/feature_ranges.json,
and frontend/lib/constants.ts FORM_FIELDS.
"""

# Form fields exposed to the user — identical to the model's 10 training features.
# Medians/ranges below are computed from the UCI dataset (verified against artifacts).
FORM_FIELDS = {
    "Borrowing dependency": {
        "label": "Borrowing Dependency",
        "description": "Share of financing sourced from external debt (higher = more levered risk)",
        "min": 0.0,
        "max": 1.0,
        "step": 0.01,
        "default_median": 0.3726,
    },
    "Total debt/Total net worth": {
        "label": "Total Debt to Net Worth",
        "description": "Total liabilities relative to net equity (gearing ratio)",
        "min": 0.0,
        "max": 5.0,
        "step": 0.01,
        "default_median": 0.0055,
    },
    "Persistent EPS in the Last Four Seasons": {
        "label": "Persistent EPS (Last 4 Quarters)",
        "description": "Trailing earnings-per-share stability metric (scaled 0.0 to 1.0)",
        "min": 0.0,
        "max": 1.0,
        "step": 0.01,
        "default_median": 0.2245,
    },
    "Net Income to Total Assets": {
        "label": "Net Income to Total Assets (ROA)",
        "description": "Net Income / Total Assets — core return on assets (scaled)",
        "min": 0.0,
        "max": 1.0,
        "step": 0.01,
        "default_median": 0.8106,
    },
    "Retained Earnings to Total Assets": {
        "label": "Retained Earnings to Total Assets",
        "description": "Accumulated retained earnings / Total Assets",
        "min": 0.0,
        "max": 1.0,
        "step": 0.01,
        "default_median": 0.9377,
    },
    "Continuous interest rate (after tax)": {
        "label": "Continuous Interest Rate (After Tax)",
        "description": "Effective after-tax interest burden on earnings",
        "min": 0.0,
        "max": 1.0,
        "step": 0.01,
        "default_median": 0.7816,
    },
    "Debt ratio %": {
        "label": "Debt Ratio %",
        "description": "Total Debt / Total Assets (0.0 to 1.0)",
        "min": 0.0,
        "max": 1.0,
        "step": 0.01,
        "default_median": 0.1114,
    },
    "Net worth/Assets": {
        "label": "Net Worth to Assets",
        "description": "Total Equity / Total Assets (equity cushion ratio)",
        "min": 0.0,
        "max": 1.0,
        "step": 0.01,
        "default_median": 0.8886,
    },
    "Net profit before tax/Paid-in capital": {
        "label": "Pre-Tax Profit / Paid-in Capital",
        "description": "Pre-tax profitability relative to the paid-in capital base",
        "min": 0.0,
        "max": 1.0,
        "step": 0.01,
        "default_median": 0.1785,
    },
    "After-tax net Interest Rate": {
        "label": "After-Tax Net Interest Rate",
        "description": "Net interest income margin efficiency",
        "min": 0.0,
        "max": 1.0,
        "step": 0.01,
        "default_median": 0.8094,
    },
}

# Features routed to each interpretation agent.
# These two lists PARTITION the model's 10 features exactly — every model
# input reaches at least one specialist agent (matches frontend constants.ts
# solvency/operations grouping).
FINANCE_FEATURES = [
    # Solvency & capital structure
    "Debt ratio %",
    "Net worth/Assets",
    "Total debt/Total net worth",
    "Borrowing dependency",
    "Retained Earnings to Total Assets",
    "Continuous interest rate (after tax)",
]

MARKET_FEATURES = [
    # Operations & profitability
    "Persistent EPS in the Last Four Seasons",
    "Net Income to Total Assets",
    "Net profit before tax/Paid-in capital",
    "After-tax net Interest Rate",
]
