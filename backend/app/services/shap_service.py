import shap
import numpy as np
from typing import Dict, Any, List
from app.services.model_service import model_service
from app.utils.preprocessing import input_to_raw_dataframe, DISPLAY_NAMES
from app.schemas import MachineInput, ExplanationResponse, ShapFeatureContribution

class ShapService:
    def __init__(self):
        self._explainer = None

    def _get_explainer(self):
        if self._explainer is None:
            model = model_service.get_model()
            self._explainer = shap.TreeExplainer(model)
        return self._explainer

    def explain_instance(self, input_data: MachineInput) -> ExplanationResponse:
        model = model_service.get_model()
        preproc = model_service.get_preprocessor()
        scaler = preproc["scaler"]
        
        # Raw DF
        df_raw = input_to_raw_dataframe(input_data)
        X_scaled = scaler.transform(df_raw)

        # Probabilities
        proba = float(model.predict_proba(X_scaled)[0, 1])

        # SHAP calculation
        explainer = self._get_explainer()
        shap_res = explainer(X_scaled)

        if hasattr(shap_res, "values"):
            vals = shap_res.values[0]
            base_val = float(shap_res.base_values[0]) if isinstance(shap_res.base_values[0], (np.ndarray, list)) else float(shap_res.base_values[0])
        else:
            vals = shap_res[0]
            base_val = float(explainer.expected_value)

        if len(vals.shape) == 2:  # Binary class format
            vals = vals[:, 1]

        # Extract features
        raw_vals = [
            input_data.type,
            input_data.air_temperature,
            input_data.process_temperature,
            input_data.rotational_speed,
            input_data.torque,
            input_data.tool_wear
        ]

        total_abs_shap = sum(abs(v) for v in vals) or 1.0

        features_contrib: List[ShapFeatureContribution] = []
        factors_inc: List[ShapFeatureContribution] = []
        factors_dec: List[ShapFeatureContribution] = []

        for i in range(len(DISPLAY_NAMES)):
            sv = float(vals[i])
            impact = "increases_risk" if sv > 0 else "decreases_risk"
            impact_pct = round((abs(sv) / total_abs_shap) * 100, 1)

            contrib = ShapFeatureContribution(
                name=DISPLAY_NAMES[i],
                raw_name=preproc["feature_cols_raw"][i],
                value=raw_vals[i],
                shap_value=round(sv, 5),
                impact=impact,
                impact_pct=impact_pct
            )

            features_contrib.append(contrib)
            if sv > 0:
                factors_inc.append(contrib)
            else:
                factors_dec.append(contrib)

        # Sort factors by absolute magnitude
        features_contrib.sort(key=lambda x: abs(x.shap_value), reverse=True)
        factors_inc.sort(key=lambda x: x.shap_value, reverse=True)
        factors_dec.sort(key=lambda x: abs(x.shap_value), reverse=True)

        return ExplanationResponse(
            base_value=round(base_val, 4),
            prediction_value=round(proba, 4),
            features=features_contrib,
            factors_increasing_risk=factors_inc,
            factors_decreasing_risk=factors_dec
        )

shap_service = ShapService()
