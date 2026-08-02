from typing import List, Optional, Union
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import User
from app.schemas.schemas import (
    WhatIfScenario, HealthScore, BusinessRecommendation,
    GoalPlannerRequest, GoalPlannerResponse, RootCauseAnalysis,
    BusinessAlert, ExecutiveAdvisorRequest, ExecutiveAdvisorResponse,
    DecisionNoDataResponse, WhatIfRequest, WhatIfResponse,
    DecisionHistoryItem
)
from app.api.deps import get_current_user
from app.services.decision_service import DecisionIntelligenceService

router = APIRouter()

@router.get("/health-score", response_model=Union[HealthScore, DecisionNoDataResponse])
def get_health_score(
    dataset_id: Optional[int] = Query(None, description="Dataset ID for analysis"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return DecisionIntelligenceService.get_health_score(db, current_user.id, dataset_id)

@router.post("/what-if", response_model=Union[WhatIfResponse, DecisionNoDataResponse])
def run_what_if_analysis(
    req: WhatIfRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return DecisionIntelligenceService.run_what_if_analysis(db, current_user.id, req)

@router.get("/root-cause", response_model=Union[RootCauseAnalysis, DecisionNoDataResponse])
def get_root_cause_analysis(
    dataset_id: Optional[int] = Query(None, description="Dataset ID for root cause check"),
    metric: Optional[str] = Query(None, description="Metric to inspect"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return DecisionIntelligenceService.get_root_cause_analysis(db, current_user.id, dataset_id, metric)

@router.post("/goal-plan", response_model=Union[GoalPlannerResponse, DecisionNoDataResponse])
def plan_goal(
    req: GoalPlannerRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return DecisionIntelligenceService.plan_goal(db, current_user.id, req)

@router.get("/recommendations", response_model=Union[List[BusinessRecommendation], DecisionNoDataResponse])
def get_recommendations(
    dataset_id: Optional[int] = Query(None, description="Dataset ID for recommendations"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return DecisionIntelligenceService.get_recommendations(db, current_user.id, dataset_id)

@router.get("/alerts", response_model=Union[List[BusinessAlert], DecisionNoDataResponse])
def get_alerts(
    dataset_id: Optional[int] = Query(None, description="Dataset ID for alerts"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return DecisionIntelligenceService.get_alerts(db, current_user.id, dataset_id)

@router.post("/advisor", response_model=Union[ExecutiveAdvisorResponse, DecisionNoDataResponse])
def run_executive_advisor(
    req: ExecutiveAdvisorRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return DecisionIntelligenceService.run_executive_advisor(db, current_user.id, req)

@router.get("/history", response_model=Union[List[DecisionHistoryItem], DecisionNoDataResponse])
def get_decision_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return DecisionIntelligenceService.get_decision_history(db, current_user.id)
