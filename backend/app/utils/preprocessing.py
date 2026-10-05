import pandas as pd
import numpy as np
from typing import Dict, Any, Union
from app.schemas import MachineInput

TYPE_MAP = {"L": 0, "M": 1, "H": 2}
TYPE_MAP_REV = {0: "L", 1: "M", 2: "H"}

RAW_FEATURE_ORDER = [
    "Type_encoded",
    "Air temperature [K]",
    "Process temperature [K]",
    "Rotational speed [rpm]",
    "Torque [Nm]",
    "Tool wear [min]"
]

DISPLAY_NAMES = [
    "Machine Type",
    "Air Temperature [K]",
    "Process Temperature [K]",
    "Rotational Speed [rpm]",
    "Torque [Nm]",
    "Tool Wear [min]"
]

def input_to_raw_dataframe(input_data: Union[MachineInput, Dict[str, Any]]) -> pd.DataFrame:
    if isinstance(input_data, MachineInput):
        d = input_data.model_dump()
    else:
        d = input_data.copy()

    # Normalize type
    t_val = str(d.get("type", "M")).upper()
    if t_val not in TYPE_MAP:
        t_val = "M"
    t_encoded = TYPE_MAP[t_val]

    raw_dict = {
        "Type_encoded": [t_encoded],
        "Air temperature [K]": [float(d.get("air_temperature", 298.1))],
        "Process temperature [K]": [float(d.get("process_temperature", 308.6))],
        "Rotational speed [rpm]": [float(d.get("rotational_speed", 1500.0))],
        "Torque [Nm]": [float(d.get("torque", 40.0))],
        "Tool wear [min]": [float(d.get("tool_wear", 0.0))]
    }
    return pd.DataFrame(raw_dict)

def classify_risk(probability: float, low_max: float = 0.30, med_max: float = 0.70) -> tuple:
    pct = round(probability * 100, 1)
    if probability < low_max:
        return (
            "LOW",
            f"Machine probability of failure is {pct}%. Machine appears relatively unlikely to fail according to the model."
        )
    elif probability < med_max:
        return (
            "MEDIUM",
            f"Machine probability of failure is {pct}%. Machine shows elevated predicted failure risk and warrants scheduled inspection."
        )
    else:
        return (
            "HIGH",
            f"Machine probability of failure is {pct}%. Machine has high predicted failure probability and should be reviewed immediately."
        )
