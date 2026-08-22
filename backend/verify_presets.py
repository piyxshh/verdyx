import warnings
warnings.filterwarnings("ignore")
from prediction.predictor import Predictor

p = Predictor("../ml/models/predictor.pkl", "../ml/models/feature_medians.json")
print(f"Loaded {len(p.feature_names)} features")

presets = {
    "high": {"Borrowing dependency": 0.84, "Total debt/Total net worth": 3.85, "Persistent EPS in the Last Four Seasons": 0.06, "Net Income to Total Assets": 0.18, "Retained Earnings to Total Assets": 0.25, "Continuous interest rate (after tax)": 0.35, "Debt ratio %": 0.65, "Net worth/Assets": 0.35, "Net profit before tax/Paid-in capital": 0.04, "After-tax net Interest Rate": 0.42},
    "moderate": {"Borrowing dependency": 0.48, "Total debt/Total net worth": 0.45, "Persistent EPS in the Last Four Seasons": 0.20, "Net Income to Total Assets": 0.62, "Retained Earnings to Total Assets": 0.72, "Continuous interest rate (after tax)": 0.71, "Debt ratio %": 0.38, "Net worth/Assets": 0.62, "Net profit before tax/Paid-in capital": 0.14, "After-tax net Interest Rate": 0.72},
    "low": {"Borrowing dependency": 0.12, "Total debt/Total net worth": 0.01, "Persistent EPS in the Last Four Seasons": 0.35, "Net Income to Total Assets": 0.88, "Retained Earnings to Total Assets": 0.95, "Continuous interest rate (after tax)": 0.85, "Debt ratio %": 0.08, "Net worth/Assets": 0.92, "Net profit before tax/Paid-in capital": 0.24, "After-tax net Interest Rate": 0.86},
}
for name, feat in presets.items():
    r = p.predict(feat)
    print(f"{name:10} -> prob {r['distress_probability']:.4f}  top: {r['top_factors'][0]['feature']} ({r['top_factors'][0]['importance']:.4f})")
    # also check clamping for debt/net worth 3.85 which exceeds max? Actually max is 9940000000 so not clamped
