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
model = joblib.load("../ml/models/predictor.pkl")
# Find high candidates with prob >0.65
import numpy as np
probs = model.predict_proba(X10)[:,1]
candidates = []
for idx in np.where(probs > 0.65)[0]:
    feat = {k.strip(): float(X10.iloc[idx][k]) for k in form_raw}
    # round to 2 decimals
    feat_rounded = {k: round(v,2) for k,v in feat.items()}
    # test rounded prob via model (need raw order)
    df_r = pd.DataFrame([{k: feat_rounded[k.strip()] for k in form_raw}])
    df_r.columns = form_raw
    prob_r = float(model.predict_proba(df_r)[0][1])
    if prob_r > 0.60:
        candidates.append((idx, feat, feat_rounded, probs[idx], prob_r))

print(f"Found {len(candidates)} high candidates where rounded still >0.60")
for idx, feat, feat_r, p_orig, p_r in candidates[:5]:
    print(f"idx {idx} orig {p_orig:.4f} rounded {p_r:.4f}")
    print(f"  orig: { {k: round(v,4) for k,v in feat.items()} }")
    print(f"  rounded: {feat_r}")
    print()

# Also test current frontend high rounded gave 0.525, need better
# Find the best rounded that looks most distressed (high borrowing, low EPS)
# Sort by prob_r desc and distress score
def distress_score(feat):
    # higher score = more distressed looking
    return feat["Borrowing dependency"]*0.5 + feat[" Debt ratio %"]*0.5 if " Debt ratio %" in feat else feat["Borrowing dependency"]
# Actually use stripped
def score(feat_r):
    return feat_r["Borrowing dependency"]*0.3 + feat_r["Debt ratio %"]*0.3 + (1-feat_r["Persistent EPS in the Last Four Seasons"])*0.2 + (1-feat_r["Net Income to Total Assets"])*0.2

candidates_sorted = sorted(candidates, key=lambda x: (x[4], score(x[2])), reverse=True)
if candidates_sorted:
    idx, feat, feat_r, p_orig, p_r = candidates_sorted[0]
    print("Best for demo (high prob + distressed look):")
    print(f"idx {idx} orig {p_orig:.4f} rounded {p_r:.4f}")
    print(feat_r)
