"""
Predictor — ML Prediction Service

Loads the trained RandomForestClassifier and feature medians.
Runs inference: merges user input with medians → predict_proba → top factors.

This runs BEFORE any LLM agent — the prediction exists before any language model
sees the scenario. This is the core architectural invariant.
"""

import json
import os
from typing import Any

import joblib
import numpy as np
import pandas as pd


class Predictor:
    """Wraps the trained RandomForestClassifier for inference."""

    def __init__(self, model_path: str, medians_path: str):
        """
        Load model and median values at initialization.

        Args:
            model_path: Path to the trained model .pkl file
            medians_path: Path to the feature medians .json file
        """
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model file not found: {model_path}")
        if not os.path.exists(medians_path):
            raise FileNotFoundError(f"Medians file not found: {medians_path}")

        self.model = joblib.load(model_path)
        with open(medians_path, "r") as f:
            self.medians = json.load(f)

        self.feature_names = list(self.medians.keys())
        print(f"Predictor loaded: {len(self.feature_names)} features")

        # Optional: load per-feature min/max for input clamping
        # (prevents OOD extremes from derailing tree splits)
        ranges_path = os.path.join(os.path.dirname(medians_path), "feature_ranges.json")
        ranges_path = os.getenv("RANGES_PATH", ranges_path)
        self.ranges = None
        if os.path.exists(ranges_path):
            with open(ranges_path, "r") as f:
                self.ranges = json.load(f)
            print(f"Feature ranges loaded: {len(self.ranges)} features")
        else:
            print(f"Feature ranges not found at {ranges_path} — clamping disabled")

    def predict(
        self, user_features: dict[str, float]
    ) -> dict[str, Any]:
        """
        Run prediction on user-provided features.

        Steps:
        1. Start with all features at their dataset median
        2. Override with user-provided values
        3. Run predict_proba to get distress probability
        4. Extract top contributing features from feature_importances_

        Args:
            user_features: Dict of feature_name → value for the 8-10 form fields

        Returns:
            Dict with:
                - distress_probability: float (0.0 to 1.0)
                - top_factors: list of (feature_name, importance) tuples, top 5
                - all_features: the full 95-feature vector used for prediction
        """
        # Step 1: Start with medians
        full_features = self.medians.copy()

        # Step 2: Override with user input (normalizing stripped column names)
        # Create a lookup from normalized (stripped) key to exact dataset column name
        col_lookup = {col.strip(): col for col in self.feature_names}
        col_lookup.update({col: col for col in self.feature_names})

        for user_key, value in user_features.items():
            matched_col = col_lookup.get(user_key) or col_lookup.get(user_key.strip())
            if matched_col and matched_col in full_features:
                val = float(value)
                # Clamp to observed training range if available
                if self.ranges and matched_col in self.ranges:
                    r = self.ranges[matched_col]
                    val = max(r["min"], min(r["max"], val))
                full_features[matched_col] = val

        # Optional: clamp any remaining features that might be out of range
        # (defensive — medians are always in range, so this is a no-op for them)
        if self.ranges:
            for col in self.feature_names:
                if col in self.ranges:
                    r = self.ranges[col]
                    v = full_features[col]
                    if v < r["min"] or v > r["max"]:
                        full_features[col] = max(r["min"], min(r["max"], v))

        # Step 3: Build feature DataFrame in the correct column order
        df_input = pd.DataFrame([full_features])[self.feature_names]

        # Step 4: Predict
        distress_probability = float(self.model.predict_proba(df_input)[0][1])

        # Step 5: Get top contributing features (with clean stripped names for readability)
        importances = self.model.feature_importances_
        feature_importance_pairs = sorted(
            zip(self.feature_names, importances.tolist()),
            key=lambda x: x[1],
            reverse=True,
        )
        top_factors = [
            {"feature": name.strip(), "importance": round(imp, 6)}
            for name, imp in feature_importance_pairs[:5]
        ]

        return {
            "distress_probability": round(distress_probability, 4),
            "top_factors": top_factors,
            "all_features": full_features,
        }
