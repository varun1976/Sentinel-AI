from pydantic import BaseModel, Field, ConfigDict
from typing import List, Dict, Any, Optional

class MachineInput(BaseModel):
    type: str = Field(..., description="Machine Type variant ('L', 'M', 'H')")
    air_temperature: float = Field(..., description="Air Temperature in Kelvin")
    process_temperature: float = Field(..., description="Process Temperature in Kelvin")
    rotational_speed: float = Field(..., description="Rotational Speed in RPM")
    torque: float = Field(..., description="Torque in Nm")
    tool_wear: float = Field(..., description="Tool Wear in minutes")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "type": "M",
                "air_temperature": 298.1,
                "process_temperature": 308.6,
                "rotational_speed": 1551.0,
                "torque": 42.8,
                "tool_wear": 0.0
            }
        }
    )

class PredictionResponse(BaseModel):
    prediction: int = Field(..., description="Predicted class (0: Normal, 1: Failure)")
    failure_probability: float = Field(..., description="Failure probability [0.0 - 1.0]")
    risk_level: str = Field(..., description="Risk level ('LOW', 'MEDIUM', 'HIGH')")
    model: str = Field(..., description="Name of the model used for prediction")
    risk_description: str = Field(..., description="Explanation of risk category")
    disclaimer: str = Field(default="Predictions are AI-based risk estimates, not guaranteed physical failure predictions.")

class ShapFeatureContribution(BaseModel):
    name: str
    raw_name: str
    value: Any
    shap_value: float
    impact: str  # 'increases_risk' or 'decreases_risk'
    impact_pct: float

class ExplanationResponse(BaseModel):
    base_value: float
    prediction_value: float
    features: List[ShapFeatureContribution]
    factors_increasing_risk: List[ShapFeatureContribution]
    factors_decreasing_risk: List[ShapFeatureContribution]

class WhatIfRequest(BaseModel):
    original: MachineInput
    scenario: MachineInput

class WhatIfResponse(BaseModel):
    original: PredictionResponse
    scenario: PredictionResponse
    risk_difference_pct: float
    probability_difference: float
    risk_direction: str  # 'increased', 'decreased', 'unchanged'
    changed_features: List[Dict[str, Any]]

class BatchPredictionRecord(BaseModel):
    machine_id: str
    type: str
    air_temperature: float
    process_temperature: float
    rotational_speed: float
    torque: float
    tool_wear: float
    prediction: int
    failure_probability: float
    risk_level: str
    top_risk_factor: str
    top_risk_shap: float

class BatchSummaryResponse(BaseModel):
    total_records: int
    high_risk_count: int
    medium_risk_count: int
    low_risk_count: int
    records: List[BatchPredictionRecord]

class DatasetSummaryResponse(BaseModel):
    total_machines: int
    total_failures: int
    total_non_failures: int
    failure_rate_pct: float
    high_risk_count: int
    medium_risk_count: int
    low_risk_count: int
    type_distribution: Dict[str, int]
    sensor_averages: Dict[str, float]
