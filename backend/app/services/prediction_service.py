from app.schemas import MachineInput, PredictionResponse, WhatIfRequest, WhatIfResponse
from app.services.model_service import model_service
from app.utils.preprocessing import input_to_raw_dataframe, classify_risk, DISPLAY_NAMES

class PredictionService:
    def predict_instance(self, input_data: MachineInput) -> PredictionResponse:
        model = model_service.get_model()
        preproc = model_service.get_preprocessor()
        scaler = preproc["scaler"]

        df_raw = input_to_raw_dataframe(input_data)
        X_scaled = scaler.transform(df_raw)

        proba = float(model.predict_proba(X_scaled)[0, 1])
        pred_class = int(model.predict(X_scaled)[0])

        metadata = model_service.get_metadata()
        thresholds = metadata.get("risk_thresholds", {"low_max": 0.30, "medium_max": 0.70})

        risk_level, risk_desc = classify_risk(
            proba,
            low_max=thresholds.get("low_max", 0.30),
            med_max=thresholds.get("medium_max", 0.70)
        )

        return PredictionResponse(
            prediction=pred_class,
            failure_probability=round(proba, 4),
            risk_level=risk_level,
            model="XGBoost Classifier",
            risk_description=risk_desc,
            disclaimer="Predictions are AI-based risk estimates, not guaranteed physical failure predictions."
        )

    def what_if_analysis(self, req: WhatIfRequest) -> WhatIfResponse:
        orig_res = self.predict_instance(req.original)
        scen_res = self.predict_instance(req.scenario)

        prob_diff = scen_res.failure_probability - orig_res.failure_probability
        risk_diff_pct = round(prob_diff * 100, 1)

        if prob_diff < -0.01:
            direction = "decreased"
        elif prob_diff > 0.01:
            direction = "increased"
        else:
            direction = "unchanged"

        # Compare changed features
        orig_dict = req.original.model_dump()
        scen_dict = req.scenario.model_dump()

        field_names_map = {
            "type": "Machine Type",
            "air_temperature": "Air Temperature [K]",
            "process_temperature": "Process Temperature [K]",
            "rotational_speed": "Rotational Speed [rpm]",
            "torque": "Torque [Nm]",
            "tool_wear": "Tool Wear [min]"
        }

        units_map = {
            "type": "",
            "air_temperature": "K",
            "process_temperature": "K",
            "rotational_speed": "rpm",
            "torque": "Nm",
            "tool_wear": "min"
        }

        changed_features = []
        for key in orig_dict:
            val_o = orig_dict[key]
            val_s = scen_dict[key]
            if val_o != val_s:
                unit = units_map.get(key, "")
                unit_str = f" {unit}".rstrip()
                changed_features.append({
                    "field": key,
                    "display_name": field_names_map.get(key, key),
                    "original_value": f"{val_o}{unit_str}",
                    "scenario_value": f"{val_s}{unit_str}",
                    "delta": round(float(val_s) - float(val_o), 2) if isinstance(val_o, (int, float)) else f"{val_o} -> {val_s}"
                })

        return WhatIfResponse(
            original=orig_res,
            scenario=scen_res,
            risk_difference_pct=risk_diff_pct,
            probability_difference=round(prob_diff, 4),
            risk_direction=direction,
            changed_features=changed_features
        )

prediction_service = PredictionService()
