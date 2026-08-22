import warnings
warnings.filterwarnings("ignore")
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
import numpy as np
# best high among all rows
idx_high = int(np.argmax(probs))
idx_low = int(np.argmin(probs))
print(f"Best HIGH prob {probs[idx_high]:.4f} at idx {idx_high} y={y.iloc[idx_high]}")
print({k.strip(): float(X10.iloc[idx_high][k]) for k in form_raw})
print(f"Best LOW prob {probs[idx_low]:.4f} at idx {idx_low} y={y.iloc[idx_low]}")
print({k.strip(): float(X10.iloc[idx_low][k]) for k in form_raw})

# Test frontend presets via direct model (no median fill needed)
presets = {
    "high": {" Borrowing dependency": 0.84, " Total debt/Total net worth": 3.85, " Persistent EPS in the Last Four Seasons": 0.06, " Net Income to Total Assets": 0.18, " Retained Earnings to Total Assets": 0.25, " Continuous interest rate (after tax)": 0.35, " Debt ratio %": 0.65, " Net worth/Assets": 0.35, " Net profit before tax/Paid-in capital": 0.04, " After-tax net Interest Rate": 0.42},
    "moderate": {" Borrowing dependency": 0.48, " Total debt/Total net worth": 0.45, " Persistent EPS in the Last Four Seasons": 0.20, " Net Income to Total Assets": 0.62, " Retained Earnings to Total Assets": 0.72, " Continuous interest rate (after tax)": 0.71, " Debt ratio %": 0.38, " Net worth/Assets": 0.62, " Net profit before tax/Paid-in capital": 0.14, " After-tax net Interest Rate": 0.72},
    "low": {" Borrowing dependency": 0.12, " Total debt/Total net worth": 0.01, " Persistent EPS in the Last Four Seasons": 0.35, " Net Income to Total Assets": 0.88, " Retained Earnings to Total Assets": 0.95, " Continuous interest rate (after tax)": 0.85, " Debt ratio %": 0.08, " Net worth/Assets": 0.92, " Net profit before tax/Paid-in capital": 0.24, " After-tax net Interest Rate": 0.86},
}
for name, feat in presets.items():
    df_in = pd.DataFrame([feat])[form_raw]
    prob = float(model.predict_proba(df_in)[0][1])
    print(f"{name:10} direct model prob {prob:.4f}")

# Test all-worst
worst = {" Borrowing dependency": 1.0, " Total debt/Total net worth": 5.0, " Persistent EPS in the Last Four Seasons": 0.0, " Net Income to Total Assets": 0.0, " Retained Earnings to Total Assets": 0.0, " Continuous interest rate (after tax)": 0.0, " Debt ratio %": 1.0, " Net worth/Assets": 0.0, " Net profit before tax/Paid-in capital": 0.0, " After-tax net Interest Rate": 0.0}
print(f"All-worst prob {float(model.predict_proba(pd.DataFrame([worst])[form_raw])[0][1]):.4f}")

# Distribution
dfp = pd.DataFrame({"y": y, "prob": probs})
print(dfp.groupby("y")["prob"].describe().to_string())
