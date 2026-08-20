# ML Training Script for Verdyx
# Reproducible script version of train_model.ipynb
#
# Usage: python train_model.py
# Output: models/predictor.pkl, models/feature_medians.json, evaluation/metrics.json

import json
import os
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, roc_auc_score, precision_score, recall_score, f1_score
import joblib

# --- Configuration ---
DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "taiwanese_bankruptcy.csv")
MODEL_OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "models", "predictor.pkl")
MEDIANS_OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "models", "feature_medians.json")
METRICS_OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "evaluation", "metrics.json")

RANDOM_STATE = 42
TEST_SIZE = 0.2
N_ESTIMATORS = 200
TOP_N_FEATURES = 10


def main():
    print("=" * 60)
    print("Verdyx — Model Training Script")
    print("=" * 60)

    # --- 1. Load Data ---
    print("\n[1/7] Loading dataset...")
    df = pd.read_csv(DATA_PATH)
    print(f"  Dataset shape: {df.shape}")
    print(f"  Columns: {len(df.columns)}")

    # --- 2. Explore Class Distribution ---
    print("\n[2/7] Class distribution:")
    target_col = "Bankrupt?"
    class_dist = df[target_col].value_counts()
    print(f"  Not bankrupt (0): {class_dist.get(0, 0)} ({class_dist.get(0, 0)/len(df)*100:.2f}%)")
    print(f"  Bankrupt (1):     {class_dist.get(1, 0)} ({class_dist.get(1, 0)/len(df)*100:.2f}%)")

    # --- 3. Prepare Features and Target ---
    print("\n[3/7] Preparing features and target...")
    X = df.drop(target_col, axis=1)
    y = df[target_col]

    # Compute and save feature medians (for inference-time filling)
    feature_medians = X.median().to_dict()

    # --- 4. Train/Test Split ---
    print("\n[4/7] Splitting data (80/20, stratified)...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE, stratify=y
    )
    print(f"  Train: {X_train.shape[0]} samples")
    print(f"  Test:  {X_test.shape[0]} samples")

    # --- 5. Train Model ---
    print("\n[5/7] Training RandomForestClassifier...")
    model = RandomForestClassifier(
        n_estimators=N_ESTIMATORS,
        class_weight="balanced",  # Handles the 3.23% class imbalance
        random_state=RANDOM_STATE,
    )
    model.fit(X_train, y_train)
    print("  Training complete.")

    # --- 6. Evaluate ---
    print("\n[6/7] Evaluating model...")
    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)[:, 1]

    report = classification_report(y_test, y_pred, output_dict=True)
    auc_score = roc_auc_score(y_test, y_proba)

    print("\n  Classification Report:")
    print(classification_report(y_test, y_pred))
    print(f"  AUC: {auc_score:.4f}")

    # Top features by importance
    feature_importance_pairs = sorted(
        zip(X.columns.tolist(), model.feature_importances_.tolist()),
        key=lambda x: x[1],
        reverse=True,
    )
    top_features = feature_importance_pairs[:TOP_N_FEATURES]

    print(f"\n  Top {TOP_N_FEATURES} Features by Importance:")
    for i, (name, importance) in enumerate(top_features, 1):
        print(f"    {i:2d}. {name}: {importance:.4f}")

    # --- 7. Save Artifacts ---
    print("\n[7/7] Saving artifacts...")

    # Ensure output directories exist
    os.makedirs(os.path.dirname(MODEL_OUTPUT_PATH), exist_ok=True)
    os.makedirs(os.path.dirname(MEDIANS_OUTPUT_PATH), exist_ok=True)
    os.makedirs(os.path.dirname(METRICS_OUTPUT_PATH), exist_ok=True)

    # Save model
    joblib.dump(model, MODEL_OUTPUT_PATH)
    print(f"  Model saved to: {MODEL_OUTPUT_PATH}")

    # Save medians
    with open(MEDIANS_OUTPUT_PATH, "w") as f:
        json.dump(feature_medians, f, indent=2)
    print(f"  Medians saved to: {MEDIANS_OUTPUT_PATH}")

    # Save metrics
    metrics = {
        "accuracy": report["accuracy"],
        "precision_bankrupt": report["1"]["precision"],
        "recall_bankrupt": report["1"]["recall"],
        "f1_bankrupt": report["1"]["f1-score"],
        "auc": auc_score,
        "class_distribution": {
            "not_bankrupt": int(class_dist.get(0, 0)),
            "bankrupt": int(class_dist.get(1, 0)),
            "bankrupt_percentage": round(class_dist.get(1, 0) / len(df) * 100, 2),
        },
        "top_features": [
            {"feature": name, "importance": round(imp, 6)}
            for name, imp in top_features
        ],
        "model_params": {
            "n_estimators": N_ESTIMATORS,
            "class_weight": "balanced",
            "random_state": RANDOM_STATE,
        },
        "note": "Evaluate with precision/recall/F1/AUC — not raw accuracy. "
                "The 3.23% class imbalance makes accuracy alone misleading.",
    }
    with open(METRICS_OUTPUT_PATH, "w") as f:
        json.dump(metrics, f, indent=2)
    print(f"  Metrics saved to: {METRICS_OUTPUT_PATH}")

    print("\n" + "=" * 60)
    print("Training complete! Key metrics:")
    print(f"  AUC:              {auc_score:.4f}")
    print(f"  Precision (1):    {report['1']['precision']:.4f}")
    print(f"  Recall (1):       {report['1']['recall']:.4f}")
    print(f"  F1 (1):           {report['1']['f1-score']:.4f}")
    print("=" * 60)


if __name__ == "__main__":
    main()
