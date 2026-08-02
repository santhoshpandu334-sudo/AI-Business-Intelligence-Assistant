from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import User, ForecastModel
from app.schemas.schemas import (
    ForecastRequest, ForecastResponse, ForecastDataPointResponse, 
    AnomalyItemResponse, RiskAnalysisResponse, RecommendationResponse, ForecastDashboardResponse
)
from app.api.deps import get_current_user
from app.services.ml_service import MLForecastingService
from app.services.anomaly_service import AnomalyDetectionService

router = APIRouter()

@router.post("/run", response_model=ForecastResponse)
def run_ml_forecast(
    req: ForecastRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    model_res = MLForecastingService.run_forecasting(
        db=db,
        dataset_id=req.dataset_id,
        algorithm=req.algorithm,
        target_column=req.target_column,
        date_column=req.date_column,
        periods=req.periods
    )
    return model_res

# Phase 5 REST API routes
@router.get("/revenue", response_model=List[ForecastDataPointResponse])
def get_revenue_forecast(
    dataset_id: int,
    horizon_days: int = Query(30, description="Horizon days: 7, 30, 90, 365"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return MLForecastingService.generate_predictions(db, dataset_id, "revenue", horizon_days)

@router.get("/profit", response_model=List[ForecastDataPointResponse])
def get_profit_forecast(
    dataset_id: int,
    horizon_days: int = Query(30, description="Horizon days: 7, 30, 90, 365"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return MLForecastingService.generate_predictions(db, dataset_id, "profit", horizon_days)

@router.get("/orders", response_model=List[ForecastDataPointResponse])
def get_orders_forecast(
    dataset_id: int,
    horizon_days: int = Query(30, description="Horizon days: 7, 30, 90, 365"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return MLForecastingService.generate_predictions(db, dataset_id, "orders", horizon_days)

@router.get("/dashboard", response_model=ForecastDashboardResponse)
def get_forecast_dashboard(
    dataset_id: int,
    horizon_days: int = Query(30, description="Horizon days: 7, 30, 90, 365"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    revenue_f = MLForecastingService.generate_predictions(db, dataset_id, "revenue", horizon_days)
    profit_f = MLForecastingService.generate_predictions(db, dataset_id, "profit", horizon_days)
    orders_f = MLForecastingService.generate_predictions(db, dataset_id, "orders", horizon_days)
    
    anomalies = AnomalyDetectionService.detect_anomalies(db, dataset_id)
    risks = MLForecastingService.get_risk_analysis(db, dataset_id)
    recommendations = MLForecastingService.get_ai_recommendations(db, dataset_id)
    
    # Calculate Forecast KPIs summary
    total_rev_forecast = sum(p["predicted"] for p in revenue_f)
    total_profit_forecast = sum(p["predicted"] for p in profit_f)
    total_orders_forecast = sum(p["predicted"] for p in orders_f)
    
    kpi_summary = {
        "forecasted_revenue": round(total_rev_forecast, 2),
        "forecasted_profit": round(total_profit_forecast, 2),
        "forecasted_orders": total_orders_forecast,
        "anomalies_count": len(anomalies),
        "overall_risk_score": risks["overall_risk"]
    }
    
    return {
        "forecast_kpis": kpi_summary,
        "revenue_forecast": revenue_f,
        "profit_forecast": profit_f,
        "orders_forecast": orders_f,
        "anomalies": anomalies,
        "risks": risks,
        "recommendations": recommendations
    }
