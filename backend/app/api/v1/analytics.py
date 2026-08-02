from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import User, Insight, AnomalyResult
from app.schemas.schemas import (
    ChatMessage, ChatResponse, InsightResponse, AnomalyResponse,
    KPIDashboardResponse, ChartsDashboardResponse, BusinessHealthResponse, DashboardSummaryResponse
)
from app.api.deps import get_current_user
from app.services.rag_service import RAGChatService
from app.services.insights_service import InsightsEngineService
from app.services.anomaly_service import AnomalyDetectionService
from app.services.analytics_service import AnalyticsDashboardService


router = APIRouter()

@router.post("/chat", response_model=ChatResponse)
def rag_chat(
    chat_in: ChatMessage,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    response = RAGChatService.query_rag_assistant(
        db=db,
        message=chat_in.message,
        dataset_id=chat_in.dataset_id
    )
    return response

@router.get("/insights/{dataset_id}", response_model=List[InsightResponse])
def get_insights(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    insights = db.query(Insight).filter(Insight.dataset_id == dataset_id).all()
    if not insights:
        insights = InsightsEngineService.generate_all_insights(db, dataset_id)
    return insights

@router.get("/anomalies/{dataset_id}", response_model=List[AnomalyResponse])
def get_anomalies(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    anomalies = db.query(AnomalyResult).filter(AnomalyResult.dataset_id == dataset_id).all()
    if not anomalies:
        anomalies = AnomalyDetectionService.detect_anomalies(db, dataset_id)
    return anomalies

# Phase 4 Analytics Dashboard Routes
@router.get("/dashboard", response_model=DashboardSummaryResponse)
def get_dashboard_summary(
    dataset_id: int,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    product: Optional[str] = None,
    region: Optional[str] = None,
    category: Optional[str] = None,
    customer: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    kpis = AnalyticsDashboardService.get_kpis(
        db, dataset_id, start_date, end_date, product, region, category, customer
    )
    charts = AnalyticsDashboardService.get_charts(
        db, dataset_id, start_date, end_date, product, region, category, customer
    )
    health = AnalyticsDashboardService.get_health_score(db, dataset_id)
    
    return {
        "kpis": kpis,
        "charts": charts,
        "health": health
    }

@router.get("/kpis", response_model=KPIDashboardResponse)
def get_dashboard_kpis(
    dataset_id: int,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    product: Optional[str] = None,
    region: Optional[str] = None,
    category: Optional[str] = None,
    customer: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return AnalyticsDashboardService.get_kpis(
        db, dataset_id, start_date, end_date, product, region, category, customer
    )

@router.get("/charts", response_model=ChartsDashboardResponse)
def get_dashboard_charts(
    dataset_id: int,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    product: Optional[str] = None,
    region: Optional[str] = None,
    category: Optional[str] = None,
    customer: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return AnalyticsDashboardService.get_charts(
        db, dataset_id, start_date, end_date, product, region, category, customer
    )

@router.get("/health", response_model=BusinessHealthResponse)
def get_business_health(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return AnalyticsDashboardService.get_health_score(db, dataset_id)

