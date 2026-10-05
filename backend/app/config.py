import os

class Settings:
    PROJECT_NAME: str = "MaintainXAI"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    MODEL_DIR: str = os.path.join(BASE_DIR, "models")
    DATA_PATH: str = os.path.join(BASE_DIR, "data", "ai4i2020.csv")
    
    # Configurable Risk Thresholds
    LOW_RISK_MAX: float = 0.30
    MEDIUM_RISK_MAX: float = 0.70
    
    CORS_ORIGINS: list = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "*"
    ]

settings = Settings()
