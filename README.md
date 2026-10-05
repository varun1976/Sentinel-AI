# MaintainXAI: Explainable AI-Based Predictive Maintenance System

**Explainable AI-Based Predictive Maintenance and Machine Failure Risk Analysis**

MaintainXAI is a production-quality, full-stack Explainable AI (XAI) predictive maintenance platform built for industrial equipment health monitoring. It combines machine learning classification (XGBoost) with **SHAP (SHapley Additive exPlanations)** to provide both high-accuracy failure risk predictions and human-readable feature contribution breakdowns.

---

## 📌 Problem Statement & Objectives

Industrial machinery failures lead to unplanned downtime, high maintenance costs, and safety hazards. Standard machine learning models can predict failure risks but operate as opaque "black boxes," leaving shop-floor operators uncertain about **why** a machine is flagged for risk.

**MaintainXAI addresses this challenge by providing:**
1. **Machine Failure Prediction**: Calculates failure probability (%) and assigns calibrated risk categories (`LOW`, `MEDIUM`, `HIGH`).
2. **Local SHAP Explainability**: Explains single predictions by identifying factors increasing risk vs. factors decreasing risk.
3. **Global Model Explainability**: Visualizes overall dataset feature importances and SHAP beeswarm distributions.
4. **What-If Counterfactual Simulator**: Allows operators to test parameter adjustments and evaluate risk deltas.
5. **Batch CSV Analysis**: Enables multi-machine CSV upload, automated column normalization, and downloadable CSV prediction reports.
6. **Model Benchmarking**: Empirically compares Logistic Regression (Baseline) vs. XGBoost vs. Random Forest across Precision, Recall, F1, and ROC-AUC.

---

## 🏗️ System Architecture

```text
React Frontend (Vite + Tailwind CSS + Recharts)
       │
       │ REST API (JSON / HTTP)
       ▼
FastAPI Backend
       │
       ├── ML Prediction Service (XGBoost Classifier)
       ├── SHAP Explanation Service (TreeExplainer)
       ├── What-If Scenario Service
       ├── Batch CSV Processing Service
       └── Analytics & Model Info Service
              │
              ▼
       Trained Model Artifacts (model.pkl, preprocessor.pkl, metadata.json)
```

---

## 📊 Dataset Information

This system uses the publicly available **AI4I 2020 Predictive Maintenance Dataset** (UCI Machine Learning Repository).

- **Total Records**: 10,000 industrial machine rows
- **Failure Target**: `Machine failure` (Binary: 0 = Normal, 1 = Failure)
- **Primary Operational Features (6)**:
  1. `Type`: Machine Quality Variant (`L` = Low/50%, `M` = Medium/30%, `H` = High/20%)
  2. `Air temperature [K]`: Ambient temperature in Kelvin
  3. `Process temperature [K]`: Process operating temperature in Kelvin
  4. `Rotational speed [rpm]`: Spindle rotation speed
  5. `Torque [Nm]`: Applied mechanical torque
  6. `Tool wear [min]`: Cumulative tool usage duration

*Note: Failure type columns (`TWF`, `HDF`, `PWF`, `OSF`, `RNF`) were excluded from model training to prevent target leakage.*

---

## 🔬 Model Performance & Evaluation

Models were evaluated using an 80/20 train/test stratified split:

| Evaluation Metric | Logistic Regression (Baseline) | XGBoost Classifier (Primary) | Random Forest (Benchmark) |
| :--- | :---: | :---: | :---: |
| **ROC-AUC Score** | 0.9003 | **0.9721** ⭐ | 0.9687 |
| **Recall (Failure Detection)** | 0.1029 | **0.8529** | 0.8971 |
| **F1-Score** | 0.1772 | **0.5949** | 0.4656 |
| **Precision** | 0.6364 | 0.4567 | 0.3144 |
| **Accuracy** | 0.9675 | 0.9605 | 0.9300 |

*XGBoost was chosen as the primary model due to its superior ROC-AUC (0.9721) and balanced high recall for critical failure detection.*

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Recharts, Lucide React, Axios
- **Backend**: Python 3.11, FastAPI, Uvicorn, Pydantic v2, Pytest
- **Machine Learning**: XGBoost, Scikit-learn, SHAP, Pandas, NumPy, Joblib

---

## 🚀 Setup & Execution Guide (Windows 11)

### 1. Backend Setup

```powershell
# Navigate to backend
cd backend

# Create & activate virtual environment (optional)
python -m venv venv
venv\Scripts\activate

# Install requirements
pip install -r requirements.txt

# Train ML Models & Generate SHAP Artifacts
python train.py

# Launch FastAPI Server
uvicorn app.main:app --reload --port 8000
```

FastAPI OpenAPI Documentation will be live at: `http://localhost:8000/docs`

### 2. Frontend Setup

Open a second terminal:

```powershell
# Navigate to frontend
cd frontend

# Install dependencies
cmd /c npm install

# Launch Vite Dev Server
cmd /c npm run dev
```

React Web Application will be live at: `http://localhost:5173`

---

## 🧪 Testing

To run backend unit and API integration tests:

```powershell
cd backend
cmd /c "set PYTHONPATH=. & pytest tests"
```

---

## 🔌 API Reference & Example Prediction

### POST `/api/predict`

**Request Body:**
```json
{
  "type": "M",
  "air_temperature": 298.1,
  "process_temperature": 308.6,
  "rotational_speed": 1551.0,
  "torque": 42.8,
  "tool_wear": 15 font
}
```

**Response Body:**
```json
{
  "prediction": 0,
  "failure_probability": 0.0142,
  "risk_level": "LOW",
  "model": "XGBoost Classifier",
  "risk_description": "Machine probability of failure is 1.4%. Machine appears relatively unlikely to fail according to the model.",
  "disclaimer": "Predictions are AI-based risk estimates, not guaranteed physical failure predictions."
}
```

---

## 📁 Project Structure

```text
XAI-PROJECT/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── schemas.py
│   │   ├── routes/
│   │   │   ├── prediction.py
│   │   │   ├── explanation.py
│   │   │   ├── analytics.py
│   │   │   └── batch.py
│   │   ├── services/
│   │   │   ├── model_service.py
│   │   │   ├── shap_service.py
│   │   │   ├── prediction_service.py
│   │   │   └── batch_service.py
│   │   └── utils/
│   │       └── preprocessing.py
│   ├── data/
│   │   └── ai4i2020.csv
│   ├── models/
│   │   ├── model.pkl
│   │   ├── baseline_model.pkl
│   │   ├── preprocessor.pkl
│   │   ├── metadata.json
│   │   ├── metrics.json
│   │   └── shap_summary.json
│   ├── tests/
│   │   └── test_api.py
│   ├── train.py
│   ├── requirements.txt
│   └── README.md
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Header.jsx
│   │   │   ├── RiskBadge.jsx
│   │   │   ├── StatCard.jsx
│   │   │   ├── Tooltip.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   └── DetailedExplanationModal.jsx
│   │   ├── pages/
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── PredictionPage.jsx
│   │   │   ├── WhatIfPage.jsx
│   │   │   ├── ExplainabilityPage.jsx
│   │   │   ├── BatchPage.jsx
│   │   │   ├── ModelPerformancePage.jsx
│   │   │   └── AboutPage.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── .gitignore
└── README.md
```

---

## ⚠️ Limitations & Disclaimer

- **Model-Based Risk Estimates**: Predictions generated by MaintainXAI represent statistical probability estimations based on historical dataset patterns. They do not guarantee physical machine failure or eliminate the need for physical equipment inspection.
- **SHAP Attribution vs. Causality**: SHAP values quantify feature contributions toward model outputs; they do not prove direct physical cause-and-effect relationships.
