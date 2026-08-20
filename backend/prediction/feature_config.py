"""
Feature Configuration for Verdyx

Maps form fields to dataset columns, defines validation ranges,
and categorizes features by domain (finance vs market) for agent routing.

NOTE: The FORM_FIELDS dict should be updated after training with the actual
top 8-10 features from the model's feature_importances_. The placeholder
values below are based on commonly strong features on this dataset — confirm
the actual ranking from your trained model before finalizing.
"""

# Form fields exposed to the user (top 10 by trained model feature importance)
FORM_FIELDS = {
    "Borrowing dependency": {
        "label": "Borrowing Dependency",
        "description": "Cost of debt / Total revenue & borrowings (higher = more levered risk)",
        "min": 0.0,
        "max": 1.0,
        "step": 0.01,
        "default_median": 0.37,
    },
    "Total debt/Total net worth": {
        "label": "Total Debt to Net Worth",
        "description": "Total liabilities relative to net equity (gearing ratio)",
        "min": 0.0,
        "max": 10.0,
        "step": 0.01,
        "default_median": 0.005,
    },
    "Persistent EPS in the Last Four Seasons": {
        "label": "Persistent EPS (Last 4 Quarters)",
        "description": "Trailing earnings per share stability metric (0.0 to 1.0)",
        "min": 0.0,
        "max": 1.0,
        "step": 0.01,
        "default_median": 0.22,
    },
    "Net Income to Total Assets": {
        "label": "Net Income to Total Assets (ROA)",
        "description": "Net Income / Total Assets (core return on assets)",
        "min": 0.0,
        "max": 1.0,
        "step": 0.01,
        "default_median": 0.80,
    },
    "Retained Earnings to Total Assets": {
        "label": "Retained Earnings to Total Assets",
        "description": "Accumulated retained earnings / Total Assets",
        "min": 0.0,
        "max": 1.0,
        "step": 0.01,
        "default_median": 0.93,
    },
    "Continuous interest rate (after tax)": {
        "label": "Continuous Interest Rate (After Tax)",
        "description": "Effective after-tax interest rate coverage capability",
        "min": 0.0,
        "max": 1.0,
        "step": 0.01,
        "default_median": 0.78,
    },
    "Debt ratio %": {
        "label": "Debt Ratio %",
        "description": "Total Debt / Total Assets (0.0 to 1.0)",
        "min": 0.0,
        "max": 1.0,
        "step": 0.01,
        "default_median": 0.11,
    },
    "Net worth/Assets": {
        "label": "Net Worth to Assets",
        "description": "Total Equity / Total Assets (equity cushion ratio)",
        "min": 0.0,
        "max": 1.0,
        "step": 0.01,
        "default_median": 0.88,
    },
    "Net profit before tax/Paid-in capital": {
        "label": "Pre-Tax Profit / Paid-in Capital",
        "description": "Pre-tax profitability relative to paid-in capital base",
        "min": 0.0,
        "max": 1.0,
        "step": 0.01,
        "default_median": 0.17,
    },
    "After-tax net Interest Rate": {
        "label": "After-Tax Net Interest Rate",
        "description": "Net interest income margin efficiency",
        "min": 0.0,
        "max": 1.0,
        "step": 0.01,
        "default_median": 0.80,
    },
}

# Features categorized by domain — used for routing to specific agents
FINANCE_FEATURES = [
    "Debt ratio %",
    "Current Ratio",
    "Quick Ratio",
    "Retained Earnings to Total Assets",
    "Working Capital to Total Assets",
    "Borrowing dependency",
    "Current Liability to Assets",
    "Current Liabilities/Equity",
    "Long-term Liability to Current Assets",
    "Total debt/Total net worth",
]

MARKET_FEATURES = [
    "Operating Profit Rate",
    "Net Income to Total Assets",
    "Revenue Per Share (Yen)",
    "Total Asset Turnover",
    "Operating Profit Per Share (Yen)",
    "Per Share Net profit before tax (Yen)",
    "Realized Sales Gross Margin",
    "Operating Expense Rate",
    "Gross Profit to Sales",
    "Net Income to Stockholder's Equity",
]
