# MaintainXAI - Backend API

Production-ready FastAPI backend for **MaintainXAI**, an Explainable AI Predictive Maintenance and Machine Failure Risk Analysis platform.

## Features
- **Machine Failure Prediction**: XGBoost model delivering failure probability & risk classification (`LOW`, `MEDIUM`, `HIGH`).
- **Explainable AI (SHAP)**: Single-instance local waterfall explanations (factors increasing vs. decreasing risk) and global feature importance.
- **What-If Scenario Simulator**: Counterfactual impact comparison of machine parameter adjustments.
- **Batch CSV Analysis**: Multi-machine CSV processing with automated column normalization and downloadable CSV reports.
- **Model Benchmark & Metrics**: Automated performance metrics comparing Logistic Regression (Baseline) vs XGBoost vs Random Forest.

## Setup Instructions

### 1. Install Dependencies
```powershell
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Train ML Models
```powershell
python train.py
```
This trains the models on `data/ai4i2020.csv` and serializes model artifacts to `models/`.

### 3. Run FastAPI Server
```powershell
uvicorn app.main:app --reload --port 8000
```
Interactive OpenAPI documentation will be accessible at: `http://localhost:8000/docs`

### 4. Run Pytest Suite
```powershell
cmd /c "set PYTHONPATH=. & pytest tests"
```
