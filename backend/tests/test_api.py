import os
import sys
import pytest
from fastapi.testclient import TestClient

# Add app parent path to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app

client = TestClient(app)

def test_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "service" in data

def test_model_info():
    res = client.get("/api/model-info")
    assert res.status_code == 200
    data = res.json()
    assert "primary_model_name" in data
    assert data["primary_model_name"] == "XGBoost Classifier"

def test_metrics():
    res = client.get("/api/metrics")
    assert res.status_code == 200
    data = res.json()
    assert "xgboost" in data
    assert "logistic_regression" in data
    assert "roc_auc" in data["xgboost"]

def test_predict():
    payload = {
        "type": "M",
        "air_temperature": 298.1,
        "process_temperature": 308.6,
        "rotational_speed": 1551.0,
        "torque": 42.8,
        "tool_wear": 10.0
    }
    res = client.post("/api/predict", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "prediction" in data
    assert "failure_probability" in data
    assert "risk_level" in data
    assert data["risk_level"] in ["LOW", "MEDIUM", "HIGH"]

def test_explain():
    payload = {
        "type": "M",
        "air_temperature": 298.1,
        "process_temperature": 308.6,
        "rotational_speed": 1551.0,
        "torque": 42.8,
        "tool_wear": 180.0
    }
    res = client.post("/api/explain", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "base_value" in data
    assert "prediction_value" in data
    assert "features" in data
    assert len(data["features"]) == 6

def test_what_if():
    payload = {
        "original": {
            "type": "M",
            "air_temperature": 298.1,
            "process_temperature": 308.6,
            "rotational_speed": 1551.0,
            "torque": 65.0,
            "tool_wear": 200.0
        },
        "scenario": {
            "type": "M",
            "air_temperature": 298.1,
            "process_temperature": 308.6,
            "rotational_speed": 1551.0,
            "torque": 40.0,
            "tool_wear": 50.0
        }
    }
    res = client.post("/api/what-if", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "original" in data
    assert "scenario" in data
    assert "risk_difference_pct" in data

def test_batch_predict():
    csv_content = """UDI,Product ID,Type,Air temperature [K],Process temperature [K],Rotational speed [rpm],Torque [Nm],Tool wear [min]
1,M14860,M,298.1,308.6,1551,42.8,0
2,L47181,L,298.2,308.7,1408,46.3,3
"""
    files = {"file": ("test.csv", csv_content, "text/csv")}
    res = client.post("/api/batch-predict", files=files)
    assert res.status_code == 200
    data = res.json()
    assert data["total_records"] == 2
    assert len(data["records"]) == 2
