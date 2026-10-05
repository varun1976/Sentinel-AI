import os
import json
import joblib
import numpy as np
import pandas as pd
from datetime import datetime

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, roc_curve
)
from xgboost import XGBClassifier
import shap

# Configuration
DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "ai4i2020.csv")
MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
os.makedirs(MODEL_DIR, exist_ok=True)

FEATURE_COLS = [
    "Type",
    "Air temperature [K]",
    "Process temperature [K]",
    "Rotational speed [rpm]",
    "Torque [Nm]",
    "Tool wear [min]"
]

FEATURE_NAMES = [
    "Machine Type",
    "Air Temperature [K]",
    "Process Temperature [K]",
    "Rotational Speed [rpm]",
    "Torque [Nm]",
    "Tool Wear [min]"
]

TARGET_COL = "Machine failure"

TYPE_MAP = {"L": 0, "M": 1, "H": 2}
TYPE_MAP_REV = {0: "L", 1: "M", 2: "H"}


def load_and_preprocess_data():
    print(f"Loading data from {DATA_PATH}...")
    if not os.path.exists(DATA_PATH):
        raise FileNotFoundError(f"Dataset not found at {DATA_PATH}")

    df = pd.read_csv(DATA_PATH)
    print(f"Dataset loaded. Shape: {df.shape}")

    # Verify columns
    for col in FEATURE_COLS + [TARGET_COL]:
        if col not in df.columns:
            raise KeyError(f"Missing required column: {col}")

    # Clean data
    df_clean = df.copy()
    
    # Map Type: L->0, M->1, H->2
    df_clean["Type_encoded"] = df_clean["Type"].map(TYPE_MAP)

    X_raw = df_clean[[
        "Type_encoded",
        "Air temperature [K]",
        "Process temperature [K]",
        "Rotational speed [rpm]",
        "Torque [Nm]",
        "Tool wear [min]"
    ]].copy()

    y = df_clean[TARGET_COL].values

    # Train / Test Split
    X_train_raw, X_test_raw, y_train, y_test = train_test_split(
        X_raw, y, test_size=0.2, random_state=42, stratify=y
    )

    # Scaling
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train_raw)
    X_test_scaled = scaler.transform(X_test_raw)

    preprocessor = {
        "type_map": TYPE_MAP,
        "type_map_rev": TYPE_MAP_REV,
        "scaler": scaler,
        "feature_cols_raw": [
            "Type", "Air temperature [K]", "Process temperature [K]",
            "Rotational speed [rpm]", "Torque [Nm]", "Tool wear [min]"
        ],
        "feature_cols_encoded": [
            "Type_encoded", "Air temperature [K]", "Process temperature [K]",
            "Rotational speed [rpm]", "Torque [Nm]", "Tool wear [min]"
        ],
        "feature_names_display": FEATURE_NAMES
    }

    return (
        X_train_raw, X_test_raw, X_train_scaled, X_test_scaled,
        y_train, y_test, preprocessor, df_clean
    )


def evaluate_model(model, X_test, y_test):
    y_pred = model.predict(X_test)
    if hasattr(model, "predict_proba"):
        y_proba = model.predict_proba(X_test)[:, 1]
    else:
        y_proba = y_pred

    acc = float(accuracy_score(y_test, y_pred))
    prec = float(precision_score(y_test, y_pred, zero_division=0))
    rec = float(recall_score(y_test, y_pred, zero_division=0))
    f1 = float(f1_score(y_test, y_pred, zero_division=0))
    auc = float(roc_auc_score(y_test, y_proba))
    cm = confusion_matrix(y_test, y_pred).tolist()

    fpr, tpr, thresholds = roc_curve(y_test, y_proba)
    # Downsample ROC points for clean frontend rendering
    step = max(1, len(fpr) // 30)
    roc_points = [
        {"fpr": round(float(f), 4), "tpr": round(float(t), 4)}
        for f, t in zip(fpr[::step], tpr[::step])
    ]
    if roc_points[-1] != {"fpr": 1.0, "tpr": 1.0}:
        roc_points.append({"fpr": 1.0, "tpr": 1.0})

    return {
        "accuracy": round(acc, 4),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "f1_score": round(f1, 4),
        "roc_auc": round(auc, 4),
        "confusion_matrix": cm,
        "roc_curve": roc_points
    }


def train_pipeline():
    (
        X_train_raw, X_test_raw, X_train_scaled, X_test_scaled,
        y_train, y_test, preprocessor, df_clean
    ) = load_and_preprocess_data()

    print("\n--- Training Model 1: Logistic Regression Baseline ---")
    lr_model = LogisticRegression(max_iter=1000, random_state=42)
    lr_model.fit(X_train_scaled, y_train)
    lr_metrics = evaluate_model(lr_model, X_test_scaled, y_test)
    print(f"Logistic Regression Metrics: {lr_metrics}")

    print("\n--- Training Model 2: XGBoost Classifier ---")
    # Calculate scale_pos_weight for class imbalance handling
    scale_pos_weight = float((len(y_train) - sum(y_train)) / sum(y_train))
    xgb_model = XGBClassifier(
        n_estimators=150,
        max_depth=5,
        learning_rate=0.05,
        scale_pos_weight=scale_pos_weight,
        random_state=42,
        eval_metric="logloss"
    )
    xgb_model.fit(X_train_scaled, y_train)
    xgb_metrics = evaluate_model(xgb_model, X_test_scaled, y_test)
    print(f"XGBoost Metrics: {xgb_metrics}")

    print("\n--- Training Model 3 (Benchmark): Random Forest Classifier ---")
    rf_model = RandomForestClassifier(n_estimators=100, max_depth=6, random_state=42, class_weight="balanced")
    rf_model.fit(X_train_scaled, y_train)
    rf_metrics = evaluate_model(rf_model, X_test_scaled, y_test)
    print(f"Random Forest Metrics: {rf_metrics}")

    # Primary model selection: XGBoost
    primary_model = xgb_model

    print("\n--- Computing SHAP Explainability ---")
    explainer = shap.TreeExplainer(xgb_model)
    shap_values = explainer(X_test_scaled)

    # Convert shap_values to numpy if required
    if hasattr(shap_values, "values"):
        vals = shap_values.values
        base_val = float(shap_values.base_values[0]) if isinstance(shap_values.base_values, (np.ndarray, list)) else float(shap_values.base_values)
    else:
        vals = shap_values
        base_val = float(explainer.expected_value)

    # Handle binary output format from SHAP
    if len(vals.shape) == 3:  # (samples, features, classes)
        vals = vals[:, :, 1]

    # Global SHAP feature importance (mean absolute SHAP value)
    mean_abs_shap = np.mean(np.abs(vals), axis=0)

    # Sort feature indices by importance (mean absolute SHAP) descending
    sorted_feature_indices = np.argsort(mean_abs_shap)[::-1]

    shap_importance = [
        {
            "feature": FEATURE_NAMES[i],
            "raw_feature": preprocessor["feature_cols_encoded"][i],
            "importance": round(float(mean_abs_shap[i]), 5)
        }
        for i in sorted_feature_indices
    ]

    features_order = [FEATURE_NAMES[i] for i in sorted_feature_indices]

    # Generate Official Matplotlib SHAP Beeswarm Plot Image
    try:
        import matplotlib
        matplotlib.use('Agg')
        import matplotlib.pyplot as plt

        plt.figure(figsize=(10, 6), facecolor='#161C28')
        X_df_display = X_test_raw.copy()
        X_df_display.columns = FEATURE_NAMES

        # Sort columns and values by feature importance
        X_df_display = X_df_display[features_order]
        vals_sorted = vals[:, sorted_feature_indices]

        shap.summary_plot(
            vals_sorted,
            X_df_display,
            show=False,
            plot_type="dot"
        )
        fig = plt.gcf()
        fig.patch.set_facecolor('#161C28')
        for ax in fig.axes:
            ax.set_facecolor('#161C28')
            for text in ax.get_xticklabels() + ax.get_yticklabels():
                text.set_color('#F1F5F9')
            ax.xaxis.label.set_color('#F1F5F9')
            ax.yaxis.label.set_color('#F1F5F9')
            ax.tick_params(colors='#F1F5F9')

        plot_path = os.path.join(MODEL_DIR, "shap_beeswarm.png")
        plt.tight_layout()
        plt.savefig(plot_path, dpi=200, bbox_inches='tight', facecolor=fig.get_facecolor(), edgecolor='none')
        plt.close()
        print(f"Official SHAP beeswarm plot saved to {plot_path}")
    except Exception as img_err:
        print(f"Warning: Could not generate SHAP beeswarm image: {img_err}")

    # Build Beeswarm Data Points for ALL Evaluation/Test Samples
    num_samples = len(X_test_scaled)
    beeswarm_data = []

    for rank, f_idx in enumerate(sorted_feature_indices):
        f_name = FEATURE_NAMES[f_idx]
        raw_series = X_test_raw.iloc[:, f_idx].values
        f_min = float(np.min(raw_series))
        f_max = float(np.max(raw_series))
        denom = (f_max - f_min) if (f_max - f_min) > 1e-8 else 1.0

        f_shap = vals[:, f_idx]

        # Calculate density jitter per bin for realistic beeswarm vertical distribution
        bin_size = 0.02
        bin_counts = {}
        bin_indices = np.floor(f_shap / bin_size).astype(int)

        for i in range(num_samples):
            b_id = bin_indices[i]
            count = bin_counts.get(b_id, 0)
            bin_counts[b_id] = count + 1

            # Alternate vertical offset: 0, +1, -1, +2, -2, +3, -3...
            if count == 0:
                y_offset = 0.0
            else:
                multiplier = (count + 1) // 2
                direction = 1 if count % 2 == 1 else -1
                y_offset = direction * multiplier * 0.065

            # Limit max jitter height around feature rank line
            y_offset = max(-0.38, min(0.38, y_offset))

            raw_val = float(raw_series[i])
            norm_val = float((raw_val - f_min) / denom)
            norm_val = max(0.0, min(1.0, norm_val))

            # Feature-value coloring: Low = Cool Blue (#3B82F6), High = Red (#EF4444)
            r = int(59 + norm_val * (239 - 59))
            g = int(130 + norm_val * (68 - 130))
            b = int(246 + norm_val * (68 - 246))
            hex_color = f"#{r:02x}{g:02x}{b:02x}"

            beeswarm_data.append({
                "feature": f_name,
                "rank": rank,
                "raw_val": round(raw_val, 2),
                "norm_val": round(norm_val, 3),
                "shap_val": round(float(f_shap[i]), 5),
                "color": hex_color,
                "jitter_y": round(y_offset, 3)
            })

    # Save artifacts
    print("\n--- Saving Artifacts ---")
    joblib.dump(primary_model, os.path.join(MODEL_DIR, "model.pkl"))
    joblib.dump(lr_model, os.path.join(MODEL_DIR, "baseline_model.pkl"))
    joblib.dump(rf_model, os.path.join(MODEL_DIR, "rf_model.pkl"))
    joblib.dump(preprocessor, os.path.join(MODEL_DIR, "preprocessor.pkl"))

    # Metadata
    metadata = {
        "dataset_name": "AI4I 2020 Predictive Maintenance Dataset",
        "primary_model_name": "XGBoost Classifier",
        "baseline_model_name": "Logistic Regression",
        "total_samples": len(df_clean),
        "total_features": len(FEATURE_COLS),
        "failure_count": int(df_clean[TARGET_COL].sum()),
        "non_failure_count": int(len(df_clean) - df_clean[TARGET_COL].sum()),
        "failure_rate_pct": round(float(df_clean[TARGET_COL].mean() * 100), 2),
        "risk_thresholds": {
            "low_max": 0.30,
            "medium_max": 0.70
        },
        "explainability": "SHAP (SHapley Additive exPlanations)",
        "features": [
            {
                "raw_name": "Type",
                "display_name": "Machine Type",
                "unit": "",
                "type": "categorical",
                "options": ["L", "M", "H"],
                "min": 0, "max": 2
            },
            {
                "raw_name": "Air temperature [K]",
                "display_name": "Air Temperature",
                "unit": "K",
                "type": "numerical",
                "min": round(float(df_clean["Air temperature [K]"].min()), 1),
                "max": round(float(df_clean["Air temperature [K]"].max()), 1),
                "mean": round(float(df_clean["Air temperature [K]"].mean()), 1)
            },
            {
                "raw_name": "Process temperature [K]",
                "display_name": "Process Temperature",
                "unit": "K",
                "type": "numerical",
                "min": round(float(df_clean["Process temperature [K]"].min()), 1),
                "max": round(float(df_clean["Process temperature [K]"].max()), 1),
                "mean": round(float(df_clean["Process temperature [K]"].mean()), 1)
            },
            {
                "raw_name": "Rotational speed [rpm]",
                "display_name": "Rotational Speed",
                "unit": "rpm",
                "type": "numerical",
                "min": round(float(df_clean["Rotational speed [rpm]"].min()), 1),
                "max": round(float(df_clean["Rotational speed [rpm]"].max()), 1),
                "mean": round(float(df_clean["Rotational speed [rpm]"].mean()), 1)
            },
            {
                "raw_name": "Torque [Nm]",
                "display_name": "Torque",
                "unit": "Nm",
                "type": "numerical",
                "min": round(float(df_clean["Torque [Nm]"].min()), 1),
                "max": round(float(df_clean["Torque [Nm]"].max()), 1),
                "mean": round(float(df_clean["Torque [Nm]"].mean()), 1)
            },
            {
                "raw_name": "Tool wear [min]",
                "display_name": "Tool Wear",
                "unit": "min",
                "type": "numerical",
                "min": round(float(df_clean["Tool wear [min]"].min()), 1),
                "max": round(float(df_clean["Tool wear [min]"].max()), 1),
                "mean": round(float(df_clean["Tool wear [min]"].mean()), 1)
            }
        ],
        "training_timestamp": datetime.now().isoformat()
    }

    with open(os.path.join(MODEL_DIR, "metadata.json"), "w") as f:
        json.dump(metadata, f, indent=2)

    # Metrics
    metrics_all = {
        "logistic_regression": lr_metrics,
        "xgboost": xgb_metrics,
        "random_forest": rf_metrics
    }
    with open(os.path.join(MODEL_DIR, "metrics.json"), "w") as f:
        json.dump(metrics_all, f, indent=2)

    # SHAP summary data
    shap_summary = {
        "base_value": base_val,
        "global_importance": shap_importance,
        "features_order": features_order,
        "beeswarm": beeswarm_data
    }
    with open(os.path.join(MODEL_DIR, "shap_summary.json"), "w") as f:
        json.dump(shap_summary, f, indent=2)

    print("\n[SUCCESS] Training complete! All artifacts saved in backend/models/")


if __name__ == "__main__":
    train_pipeline()
