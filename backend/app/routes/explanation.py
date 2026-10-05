import os
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from app.schemas import MachineInput, ExplanationResponse
from app.services.shap_service import shap_service
from app.services.model_service import model_service
from app.config import settings

router = APIRouter(tags=["Explainable AI (SHAP)"])

@router.post("/explain", response_model=ExplanationResponse, summary="Local Single-Prediction SHAP Explanation")
def explain_prediction(input_data: MachineInput):
    """
    Computes local SHAP values for a given single machine instance,
    breaking down factors that increase vs. decrease failure risk.
    """
    try:
        return shap_service.explain_instance(input_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Explanation generation error: {str(e)}")

@router.get("/feature-importance", summary="Global Model Feature Importance")
def get_global_feature_importance():
    """
    Returns global feature importance ranked by mean absolute SHAP values.
    """
    try:
        shap_sum = model_service.get_shap_summary()
        return {
            "method": "SHAP (Mean Absolute Value)",
            "base_value": shap_sum.get("base_value", 0.0),
            "features": shap_sum.get("global_importance", [])
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch feature importance: {str(e)}")

@router.get("/shap-summary", summary="Global SHAP Beeswarm Plot Data")
def get_shap_summary():
    """
    Returns full test-set SHAP beeswarm data points for frontend visualization.
    """
    try:
        return model_service.get_shap_summary()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch SHAP summary: {str(e)}")

@router.get("/shap-beeswarm-image", summary="Official SHAP Summary/Beeswarm Plot Image")
def get_shap_beeswarm_image():
    """
    Serves the official matplotlib SHAP summary/beeswarm plot PNG generated directly by SHAP.
    """
    img_path = os.path.join(settings.MODEL_DIR, "shap_beeswarm.png")
    if not os.path.exists(img_path):
        raise HTTPException(status_code=404, detail="SHAP beeswarm plot image not found. Train model first.")
    return FileResponse(img_path, media_type="image/png")
