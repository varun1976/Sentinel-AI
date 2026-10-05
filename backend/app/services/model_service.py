import os
import json
import joblib
from app.config import settings

class ModelService:
    def __init__(self):
        self.model = None
        self.baseline_model = None
        self.rf_model = None
        self.preprocessor = None
        self.metadata = None
        self.metrics = None
        self.shap_summary = None
        self.is_loaded = False

    def load_artifacts(self):
        if self.is_loaded:
            return

        model_dir = settings.MODEL_DIR
        
        # Load models
        model_path = os.path.join(model_dir, "model.pkl")
        baseline_path = os.path.join(model_dir, "baseline_model.pkl")
        rf_path = os.path.join(model_dir, "rf_model.pkl")
        preproc_path = os.path.join(model_dir, "preprocessor.pkl")
        meta_path = os.path.join(model_dir, "metadata.json")
        metrics_path = os.path.join(model_dir, "metrics.json")
        shap_path = os.path.join(model_dir, "shap_summary.json")

        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model file not found at {model_path}. Run train.py first.")

        self.model = joblib.load(model_path)
        self.baseline_model = joblib.load(baseline_path)
        if os.path.exists(rf_path):
            self.rf_model = joblib.load(rf_path)
        self.preprocessor = joblib.load(preproc_path)

        with open(meta_path, "r") as f:
            self.metadata = json.load(f)

        with open(metrics_path, "r") as f:
            self.metrics = json.load(f)

        with open(shap_path, "r") as f:
            self.shap_summary = json.load(f)

        self.is_loaded = True
        print("[ModelService] Successfully loaded all models and artifacts.")

    def get_model(self):
        self.load_artifacts()
        return self.model

    def get_baseline_model(self):
        self.load_artifacts()
        return self.baseline_model

    def get_preprocessor(self):
        self.load_artifacts()
        return self.preprocessor

    def get_metadata(self):
        self.load_artifacts()
        return self.metadata

    def get_metrics(self):
        self.load_artifacts()
        return self.metrics

    def get_shap_summary(self):
        self.load_artifacts()
        return self.shap_summary

model_service = ModelService()
