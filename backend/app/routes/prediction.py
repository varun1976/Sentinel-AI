from fastapi import APIRouter, HTTPException
from app.schemas import MachineInput, PredictionResponse, WhatIfRequest, WhatIfResponse
from app.services.prediction_service import prediction_service

router = APIRouter(tags=["Prediction & Scenarios"])

@router.post("/predict", response_model=PredictionResponse, summary="Predict Machine Failure Probability & Risk")
def predict_machine_failure(input_data: MachineInput):
    """
    Accepts 6 machine operating parameters, applies model preprocessing,
    and returns failure probability, binary prediction, and classified risk level.
    """
    try:
        return prediction_service.predict_instance(input_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@router.post("/what-if", response_model=WhatIfResponse, summary="What-If Counterfactual Scenario Analysis")
def run_what_if_analysis(request: WhatIfRequest):
    """
    Compares current machine parameters against a modified scenario,
    calculating the probability delta, risk level change, and parameter variations.
    """
    try:
        return prediction_service.what_if_analysis(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scenario analysis error: {str(e)}")
