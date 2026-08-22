import warnings
warnings.filterwarnings("ignore")
import pandas as pd
from prediction.predictor import Predictor

p = Predictor("../ml/models/predictor.pkl", "../ml/models/feature_medians.json")
df = pd.read_csv("../ml/data/taiwanese_bankruptcy.csv")
y = df["Bankrupt?"]

form_stripped = [
    "Borrowing dependency",
    "Total debt/Total net worth",
    "Persistent EPS in the Last Four Seasons",
    "Net Income to Total Assets",
    "Retained Earnings to Total Assets",
    "Continuous interest rate (after tax)",
    "Debt ratio %",
    "Net worth/Assets",
    "Net profit before tax/Paid-in capital",
    "After-tax net Interest Rate",
]
col_lookup = {c.strip(): c for c in df.columns}

# Find best high among real rows (using only 10 fields)
best_high = (0, None)
best_low = (1, None)
for idx, row in df.iterrows():
    feat = {f: float(row[col_lookup[f]]) for f in form_stripped}
    prob = p.predict(feat)["distress_probability"]
    if prob > best_high[0]:
        best_high = (prob, (idx, feat, int(y.iloc[idx])))
    if prob < best_low[0]:
        best_low = (prob, (idx, feat, int(y.iloc[idx])))

print(f"Best HIGH prob {best_high[0]:.4f} at idx {best_high[1][0]} true_y={best_high[1][2]}")
print(best_high[1][1])
print(f"Best LOW prob {best_low[0]:.4f} at idx {best_low[1][0]} true_y={best_low[1][2]}")
print(best_low[1][1])

# Test all-worst extreme
worst = {
    "Borrowing dependency": 1.0,
    "Total debt/Total net worth": 5.0,
    "Persistent EPS in the Last Four Seasons": 0.0,
    "Net Income to Total Assets": 0.0,
    "Retained Earnings to Total Assets": 0.0,
    "Continuous interest rate (after tax)": 0.0,
    "Debt ratio %": 1.0,
    "Net worth/Assets": 0.0,
    "Net profit before tax/Paid-in capital": 0.0,
    "After-tax net Interest Rate": 0.0,
}
print(f"All-worst extreme -> {p.predict(worst)['distress_probability']:.4f}")

# Try tuning high preset to be more extreme: use 1st percentile of bankrupt for LOWER-worse, 99th for HIGHER-worse
import numpy as np
tuned_high = {}
for f in form_stripped:
    raw = col_lookup[f]
    # direction: bankrupt mean vs healthy mean
    m_healthy = df.loc[y==0, raw].mean()
    m_bank = df.loc[y==1, raw].mean()
    lower_worse = m_bank < m_healthy
    if lower_worse:
        val = float(df.loc[y==1, raw].quantile(0.01))
    else:
        val = float(df.loc[y==1, raw].quantile(0.99))
    tuned_high[f] = val
print(f"Tuned 1%/99% bankrupt extreme -> {p.predict(tuned_high)['distress_probability']:.4f}")
print(tuned_high)

# Try even more extreme: use 0.0/1.0 for lower/higher worse
tuned_all = {}
for f in form_stripped:
    raw = col_lookup[f]
    m_healthy = df.loc[y==0, raw].mean()
    m_bank = df.loc[y==1, raw].mean()
    lower_worse = m_bank < m_healthy
    tuned_all[f] = 0.0 if lower_worse else 1.0
    # For debt/net worth, 1.0 is not max, but use 5.0 to match frontend max
    if f == "Total debt/Total net worth" and not lower_worse:
        tuned_all[f] = 5.0
print(f"0/1 extreme -> {p.predict(tuned_all)['distress_probability']:.4f}")

# Check distribution of probs for bankrupt vs healthy
import pandas as pd
probs = []
for idx, row in df.iterrows():
    feat = {f: float(row[col_lookup[f]]) for f in form_stripped}
    probs.append(p.predict(feat)["distress_probability"])
df_probs = pd.DataFrame({"y": y, "prob": probs})
print(df_probs.groupby("y")["prob"].describe().to_string())
