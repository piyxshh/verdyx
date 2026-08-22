import pandas as pd, joblib

df = pd.read_csv("../ml/data/taiwanese_bankruptcy.csv")
form_raw = [
    " Borrowing dependency",
    " Total debt/Total net worth",
    " Persistent EPS in the Last Four Seasons",
    " Net Income to Total Assets",
    " Retained Earnings to Total Assets",
    " Continuous interest rate (after tax)",
    " Debt ratio %",
    " Net worth/Assets",
    " Net profit before tax/Paid-in capital",
    " After-tax net Interest Rate",
]
X10 = df[form_raw]
y = df["Bankrupt?"]
model = joblib.load("../ml/models/predictor.pkl")
probs = model.predict_proba(X10)[:,1]
df["prob"] = probs

# Define human distress criteria
# HIGH should look distressed: high borrowing, high debt ratio, low EPS, low ROA, low retained
high_candidates = df[
    (df["prob"] > 0.65) &
    (df[" Borrowing dependency"] > 0.5) &
    (df[" Debt ratio %"] > 0.25) &
    (df[" Persistent EPS in the Last Four Seasons"] < 0.18)
]
print(f"High candidates with prob>0.65 and distressed look: {len(high_candidates)}")
if len(high_candidates) > 0:
    # pick the highest prob among them
    best = high_candidates.loc[high_candidates["prob"].idxmax()]
    print(f"Best high realistic: prob {best['prob']:.4f} y={best['Bankrupt?']}")
    print({k.strip(): float(best[k]) for k in form_raw})
    # show a few
    print(high_candidates[[" Borrowing dependency"," Debt ratio %"," Persistent EPS in the Last Four Seasons"," Net Income to Total Assets","prob"]].head().to_string())

# Try looser
high_loose = df[(df["prob"] > 0.65) & (df[" Borrowing dependency"] > 0.4)]
print(f"\nLooser high (>0.65 and borrowing>0.4): {len(high_loose)}")
if len(high_loose) > 0:
    best2 = high_loose.loc[high_loose["prob"].idxmax()]
    print({k.strip(): float(best2[k]) for k in form_raw})

# Moderate: prob 0.30-0.60 and middling values
mod = df[(df["prob"] >= 0.30) & (df["prob"] <= 0.60)]
print(f"\nModerate count {len(mod)} sample:")
if len(mod) > 0:
    sample = mod.iloc[0]
    print(f"prob {sample['prob']:.4f} y={sample['Bankrupt?']}")
    print({k.strip(): float(sample[k]) for k in form_raw})

# Low: prob <0.10 and healthy look
low_candidates = df[(df["prob"] < 0.10) & (df[" Borrowing dependency"] < 0.4) & (df[" Debt ratio %"] < 0.15)]
print(f"\nLow candidates prob<0.10 and healthy: {len(low_candidates)}")
if len(low_candidates) > 0:
    best_low = low_candidates.loc[low_candidates["prob"].idxmin()]
    print({k.strip(): float(best_low[k]) for k in form_raw})

# Also check what all-worst should be to get high prob - maybe we need to use actual high row values directly as preset even if not looking distressed
# Let's also see average values for high prob vs low prob
high_avg = df[df["prob"] > 0.8][form_raw].mean()
low_avg = df[df["prob"] < 0.1][form_raw].mean()
print("\nAvg for prob>0.8 (high):")
for k in form_raw:
    print(f"  {k.strip():40} high_avg={high_avg[k]:.3f} low_avg={low_avg[k]:.3f} diff={high_avg[k]-low_avg[k]:+.3f}")
