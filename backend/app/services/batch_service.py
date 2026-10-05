import io
import pandas as pd
import numpy as np
from typing import List, Tuple
import shap
from fastapi import HTTPException
from app.services.model_service import model_service
from app.utils.preprocessing import TYPE_MAP, classify_risk, DISPLAY_NAMES
from app.schemas import BatchPredictionRecord, BatchSummaryResponse

COLUMN_MAPPING = {
    "type": "Type",
    "machine type": "Type",
    "air temperature [k]": "Air temperature [K]",
    "air temperature": "Air temperature [K]",
    "air_temperature": "Air temperature [K]",
    "process temperature [k]": "Process temperature [K]",
    "process temperature": "Process temperature [K]",
    "process_temperature": "Process temperature [K]",
    "rotational speed [rpm]": "Rotational speed [rpm]",
    "rotational speed": "Rotational speed [rpm]",
    "rotational_speed": "Rotational speed [rpm]",
    "torque [nm]": "Torque [Nm]",
    "torque": "Torque [Nm]",
    "tool wear [min]": "Tool wear [min]",
    "tool wear": "Tool wear [min]",
    "tool_wear": "Tool wear [min]"
}

class BatchService:
    def __init__(self):
        self._explainer = None

    def _get_explainer(self):
        if self._explainer is None:
            model = model_service.get_model()
            self._explainer = shap.TreeExplainer(model)
        return self._explainer

    def process_csv(self, file_contents: bytes) -> Tuple[BatchSummaryResponse, str]:
        try:
            df = pd.read_csv(io.BytesIO(file_contents))
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid CSV file format: {str(e)}")

        if df.empty:
            raise HTTPException(status_code=400, detail="CSV file is empty.")

        # Normalize column names for matching
        normalized_cols = {col: str(col).strip().lower() for col in df.columns}
        renamed_df = df.rename(columns=lambda c: COLUMN_MAPPING.get(normalized_cols[c], c))

        required = [
            "Air temperature [K]", "Process temperature [K]",
            "Rotational speed [rpm]", "Torque [Nm]", "Tool wear [min]"
        ]
        missing = [req for req in required if req not in renamed_df.columns]
        if missing:
            raise HTTPException(
                status_code=400,
                detail=f"Missing required sensor columns in CSV: {', '.join(missing)}. Available columns: {list(df.columns)}"
            )

        if "Type" not in renamed_df.columns:
            renamed_df["Type"] = "M"

        # Limit to 2,000 rows max for fast response if large dataset uploaded
        if len(renamed_df) > 2000:
            renamed_df = renamed_df.iloc[:2000].copy()

        # Handle machine IDs
        id_col = None
        for candidate in ["UDI", "Product ID", "Machine ID", "id", "ID", "Machine"]:
            if candidate in df.columns:
                id_col = candidate
                break

        # Map Type
        renamed_df["Type_encoded"] = renamed_df["Type"].astype(str).str.upper().map(TYPE_MAP).fillna(1).astype(int)

        X_raw = renamed_df[[
            "Type_encoded", "Air temperature [K]", "Process temperature [K]",
            "Rotational speed [rpm]", "Torque [Nm]", "Tool wear [min]"
        ]].copy()

        # Scale
        model = model_service.get_model()
        preproc = model_service.get_preprocessor()
        scaler = preproc["scaler"]
        X_scaled = scaler.transform(X_raw)

        # Batch Predict
        probas = model.predict_proba(X_scaled)[:, 1]
        preds = model.predict(X_scaled)

        # SHAP calculation for top risk factor
        explainer = self._get_explainer()
        shap_vals = explainer.shap_values(X_scaled)
        if isinstance(shap_vals, list):
            shap_vals = shap_vals[1]

        records: List[BatchPredictionRecord] = []
        high_cnt, med_cnt, low_cnt = 0, 0, 0

        metadata = model_service.get_metadata()
        thresholds = metadata.get("risk_thresholds", {"low_max": 0.30, "medium_max": 0.70})

        for i in range(len(renamed_df)):
            m_id = str(df.iloc[i][id_col]) if id_col and id_col in df.columns else f"MACH-{i+1:04d}"
            prob = float(probas[i])
            pred = int(preds[i])

            risk_lvl, _ = classify_risk(
                prob,
                low_max=thresholds.get("low_max", 0.30),
                med_max=thresholds.get("medium_max", 0.70)
            )

            if risk_lvl == "HIGH":
                high_cnt += 1
            elif risk_lvl == "MEDIUM":
                med_cnt += 1
            else:
                low_cnt += 1

            # Find top positive risk factor (or overall max abs SHAP)
            s_row = shap_vals[i]
            pos_indices = np.where(s_row > 0)[0]
            if len(pos_indices) > 0:
                top_idx = pos_indices[np.argmax(s_row[pos_indices])]
            else:
                top_idx = np.argmax(np.abs(s_row))

            top_factor_name = DISPLAY_NAMES[top_idx]
            top_factor_shap = float(s_row[top_idx])

            records.append(BatchPredictionRecord(
                machine_id=m_id,
                type=str(renamed_df.iloc[i]["Type"]),
                air_temperature=float(renamed_df.iloc[i]["Air temperature [K]"]),
                process_temperature=float(renamed_df.iloc[i]["Process temperature [K]"]),
                rotational_speed=float(renamed_df.iloc[i]["Rotational speed [rpm]"]),
                torque=float(renamed_df.iloc[i]["Torque [Nm]"]),
                tool_wear=float(renamed_df.iloc[i]["Tool wear [min]"]),
                prediction=pred,
                failure_probability=round(prob, 4),
                risk_level=risk_lvl,
                top_risk_factor=top_factor_name,
                top_risk_shap=round(top_factor_shap, 4)
            ))

        summary = BatchSummaryResponse(
            total_records=len(records),
            high_risk_count=high_cnt,
            medium_risk_count=med_cnt,
            low_risk_count=low_cnt,
            records=records
        )

        # Generate CSV output string
        out_df = pd.DataFrame([{
            "machine_id": r.machine_id,
            "type": r.type,
            "air_temperature_k": r.air_temperature,
            "process_temperature_k": r.process_temperature,
            "rotational_speed_rpm": r.rotational_speed,
            "torque_nm": r.torque,
            "tool_wear_min": r.tool_wear,
            "prediction": r.prediction,
            "failure_probability": r.failure_probability,
            "risk_level": r.risk_level,
            "top_risk_factor": r.top_risk_factor
        } for r in records])

        csv_buffer = io.StringIO()
        out_df.to_csv(csv_buffer, index=False)
        csv_string = csv_buffer.getvalue()

        return summary, csv_string

batch_service = BatchService()
