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
probs = model.predict_proba(X10)[:,1]
df["prob"] = probs
candidates = df[(df["prob"] >= 0.40) & (df["prob"] <= 0.60) & (df[" Borrowing dependency"].between(0.35, 0.60)) & (df[" Debt ratio %"].between(0.15, 0.35))]
print(f"found {len(candidates)}")
if len(candidates)>0:
    best = candidates.iloc[(candidates["prob"]-0.45).abs().argsort()[:3]]
    for idx, row in best.iterrows():
        print(f"idx {idx} prob {row['prob']:.4f} y={row['Bankrupt?']}")
        print({k.strip(): float(row[k]) for k in form_raw})
        print()
else:
    # fallback: any moderate
    mod = df[(df["prob"] >= 0.40) & (df["prob"] <= 0.60)]
    print(f"fallback mod count {len(mod)}")
    best = mod.iloc[(mod["prob"]-0.45).abs().argsort()[:3]]
    for idx, row in best.iterrows():
        print(f"idx {idx} prob {row['prob']:.4f} y={row['Bankrupt?']}")
        print({k.strip(): float(row[k]) for k in form_raw})
        print()
