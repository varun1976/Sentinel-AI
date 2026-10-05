from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.services.model_service import model_service
from app.routes import prediction, explanation, analytics, batch

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load ML models and artifacts at startup
    print("[MaintainXAI API] Initializing model service...")
    try:
        model_service.load_artifacts()
    except Exception as e:
        print(f"[MaintainXAI API WARNING] Could not pre-load model artifacts: {e}")
    yield
    print("[MaintainXAI API] Shutting down...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Explainable AI-Based Predictive Maintenance and Machine Failure Risk Analysis REST API",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers under /api
app.include_router(prediction.router, prefix=settings.API_PREFIX)
app.include_router(explanation.router, prefix=settings.API_PREFIX)
app.include_router(analytics.router, prefix=settings.API_PREFIX)
app.include_router(batch.router, prefix=settings.API_PREFIX)

@app.get("/")
def root():
    return {
        "message": "Welcome to MaintainXAI - Explainable AI Predictive Maintenance API",
        "docs": "/docs",
        "version": settings.VERSION
    }
