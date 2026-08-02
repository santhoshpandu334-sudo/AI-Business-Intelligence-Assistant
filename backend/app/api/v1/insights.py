from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import User
from app.api.deps import get_current_user
from app.schemas.schemas import (
    ExecutiveSummaryResponse, BusinessInsightItemResponse, 
    RiskIntelligenceItemResponse, InsightRecommendationResponse, InsightsDashboardResponse
)
from app.services.insights_service import InsightsEngineService

router = APIRouter()

@router.get("/executive-summary", response_model=ExecutiveSummaryResponse)
def get_executive_summary_insights(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return InsightsEngineService.get_executive_summary(db, dataset_id)

@router.get("/business", response_model=List[BusinessInsightItemResponse])
def get_business_insights_metrics(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return InsightsEngineService.get_business_insights(db, dataset_id)

@router.get("/risks", response_model=List[RiskIntelligenceItemResponse])
def get_risk_intelligence_metrics(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return InsightsEngineService.get_risk_intelligence(db, dataset_id)

@router.get("/recommendations", response_model=List[InsightRecommendationResponse])
def get_executive_recommendations(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return InsightsEngineService.get_recommendations(db, dataset_id)

@router.get("/dashboard", response_model=InsightsDashboardResponse)
def get_insights_dashboard_metrics(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return InsightsEngineService.get_dashboard_summary(db, dataset_id)
