import logging
from datetime import datetime
from typing import List, Dict, Any, Optional, Union
from sqlalchemy.orm import Session

from app.db.models import DecisionScenario, BusinessGoal, BusinessAlert, DecisionHistory, Dataset, DataRecord, ForecastModel, AnomalyResult, User, Insight
from app.schemas.schemas import (
    WhatIfScenario, HealthScore, BusinessRecommendation,
    GoalPlannerRequest, GoalPlannerResponse, RootCauseAnalysis,
    BusinessAlert as BusinessAlertSchema, ExecutiveAdvisorRequest, ExecutiveAdvisorResponse,
    WhatIfRequest, WhatIfResponse, DecisionHistoryItem, GoalGapItem
)
from app.services.dataset_analysis_service import DatasetAnalysisService
from app.services.capability_validator import CapabilityValidator
from app.services.grounding_validator import GroundingValidator
from app.services.consistency_validator import ConsistencyValidator

logger = logging.getLogger(__name__)

class DecisionIntelligenceService:

    @classmethod
    def get_health_score(cls, db: Session, user_id: int, dataset_id: Optional[int] = None) -> Union[HealthScore, Dict[str, Any]]:
        if not dataset_id:
            ds = db.query(Dataset).order_by(Dataset.created_at.desc()).first()
            if not ds:
                return {"success": True, "data": None, "message": "No datasets uploaded."}
            dataset_id = ds.id

        analysis = DatasetAnalysisService.get_analysis(db, dataset_id)
        score = analysis.get("completeness_pct", 100.0)

        # Map to HealthScore schema
        return HealthScore(
            score=round(score, 1),
            revenue_rating="Good" if score > 80 else "Needs Work",
            profit_rating="Good" if score > 80 else "Needs Work",
            sales_rating="Good" if score > 80 else "Needs Work",
            customer_rating="Good" if score > 80 else "Needs Work",
            forecast_rating="Optimal" if score > 80 else "Stable",
            operating_risk_score=15.0,
            analyzed_at=datetime.utcnow()
        )

    @classmethod
    def get_root_cause_analysis(cls, db: Session, user_id: int, dataset_id: int, target_metric: str) -> RootCauseAnalysis:
        analysis = DatasetAnalysisService.get_analysis(db, dataset_id)
        anomalies = analysis.get("anomaly_summaries", [])
        
        if not anomalies:
            return RootCauseAnalysis(
                metric=target_metric,
                deviation_pct=0.0,
                possible_causes=[{"factor": "Evidence is insufficient inside the data statistics.", "contribution_pct": 100.0}],
                insights=["No active anomalies detected in the canonical dataset analysis."],
                analyzed_at=datetime.utcnow()
            )

        causes = []
        insights = []
        for anom in anomalies[:3]:
            causes.append({
                "factor": f"Row {anom['row_index']} '{anom['measure']}' spike",
                "contribution_pct": abs(anom["deviation_pct"])
            })
            insights.append(f"Spike of {anom['value']} on row index {anom['row_index']} deviates significantly.")

        return RootCauseAnalysis(
            metric=target_metric,
            deviation_pct=round(anomalies[0]["deviation_pct"], 2) if anomalies else 0.0,
            possible_causes=causes,
            insights=insights,
            analyzed_at=datetime.utcnow()
        )

    @classmethod
    def get_alerts(cls, db: Session, user_id: int, dataset_id: Optional[int] = None) -> Union[List[BusinessAlertSchema], Dict[str, Any]]:
        if not dataset_id:
            ds = db.query(Dataset).order_by(Dataset.created_at.desc()).first()
            if not ds:
                return []
            dataset_id = ds.id

        analysis = DatasetAnalysisService.get_analysis(db, dataset_id)
        anomalies = analysis.get("anomaly_summaries", [])

        alerts = []
        for idx, anom in enumerate(anomalies[:3]):
            alerts.append(BusinessAlertSchema(
                id=idx + 1,
                title=f"Statistical Anomaly: {anom['measure'].replace('_',' ').title()} Spike",
                message=f"Value {anom['value']} on row {anom['row_index']} deviates by {anom['deviation_pct']:+.1f}% from mean.",
                severity="Warning",
                metric=anom["measure"],
                current_value=anom["value"],
                threshold_value=0.0,
                is_resolved=False,
                created_at=datetime.utcnow()
            ))

        if not alerts:
            alerts.append(BusinessAlertSchema(
                id=1,
                title="System Operational Stable",
                message="Scans verify data variance limits are within control control limits.",
                severity="Info",
                metric="Performance",
                current_value=100.0,
                threshold_value=100.0,
                is_resolved=True,
                created_at=datetime.utcnow()
            ))
        return alerts

    @classmethod
    def get_active_recommendations(cls, db: Session, user_id: int, dataset_id: Optional[int] = None) -> List[BusinessRecommendation]:
        if not dataset_id:
            ds = db.query(Dataset).order_by(Dataset.created_at.desc()).first()
            if not ds:
                return []
            dataset_id = ds.id

        analysis = DatasetAnalysisService.get_analysis(db, dataset_id)
        recs = analysis.get("recommendations", [])

        result = []
        for r in recs:
            result.append(BusinessRecommendation(
                title=r["title"],
                description=f"Action: {r['benefit']}. Supporting columns: {', '.join(analysis['schema_metadata']['numerical_measures'][:2])}. Confidence: {r['confidence_score']}%",
                impact_score=r["confidence_score"],
                difficulty="Medium",
                category="General",
                created_at=datetime.utcnow()
            ))
        return result

    @classmethod
    def run_executive_advisor(cls, db: Session, user_id: int, req: ExecutiveAdvisorRequest) -> Union[ExecutiveAdvisorResponse, Dict[str, Any]]:
        ds = db.query(Dataset).order_by(Dataset.created_at.desc()).first()
        if not ds:
            return {"success": True, "data": None, "message": "No datasets uploaded."}

        analysis = DatasetAnalysisService.get_analysis(db, ds.id)
        domain = analysis["detected_domains"]["primary_domain"]
        kpis = analysis.get("kpis", {})

        # Log query to database
        db_history = DecisionHistory(
            user_id=user_id,
            action_type="advisor_query",
            query_text=req.query
        )
        db.add(db_history)
        db.commit()
        db.refresh(db_history)

        query_lower = req.query.lower()

        # Dynamic advice synthesis without placeholders
        if "revenue" in query_lower or "profit" in query_lower:
            if domain == "Sales/Finance":
                response_text = (
                    f"Dynamic database aggregates show total revenue is ${kpis.get('total_revenue', 0.0):,.2f} "
                    f"and total net profit is ${kpis.get('total_profit', 0.0):,.2f} (margin: {kpis.get('profit_margin', 0.0)}%)."
                )
                actions = ["Conduct comprehensive vendor spend audits.", "Maximize transactional margin avenues."]
            else:
                response_text = "This information is not available in the uploaded dataset."
                actions = ["Verify if financial columns exist in database files."]
        elif "marks" in query_lower or "gpa" in query_lower or "student" in query_lower:
            if domain == "Student/Education":
                response_text = (
                    f"Education aggregates show a total student count of {kpis.get('total_students', 0)} "
                    f"with subject averages at {kpis.get('average_marks', 0.0)} (pass rate: {kpis.get('pass_percentage', 0.0)}%)."
                )
                actions = ["Focus tutoring resources on lower scorer categories.", "Review attendance factors."]
            else:
                response_text = "This information is not available in the uploaded dataset."
                actions = ["Verify if student/GPA records exist in database files."]
        else:
            response_text = (
                f"Ingestion domain is classified as {domain} with a health rating of "
                f"{kpis.get('dataset_health_score', 100.0)}%. The pipeline is tracking row bounds of {analysis['row_count']} total entries."
            )
            actions = ["Monitor alerts regularly.", "Audit missing data indicators."]

        response_text = GroundingValidator.validate_content(response_text, analysis)

        db_history.response_text = response_text
        db.commit()

        return ExecutiveAdvisorResponse(
            response_text=response_text,
            supporting_data={"health_score": kpis.get("dataset_health_score", 100.0), "dataset_id": ds.id},
            suggested_actions=actions,
            confidence_score=analysis["detected_domains"]["confidence_score"],
            generated_at=datetime.utcnow()
        )

    @classmethod
    def get_gap_analysis(cls, db: Session, user_id: int, req: GoalPlannerRequest) -> GoalPlannerResponse:
        ds = db.query(Dataset).order_by(Dataset.created_at.desc()).first()
        dataset_id = ds.id if ds else 1

        analysis = DatasetAnalysisService.get_analysis(db, dataset_id)
        kpis = analysis.get("kpis", {})

        current_val = float(kpis.get("total_revenue", 1000.0)) if isinstance(kpis.get("total_revenue"), (int, float)) else 1000.0
        target_val = float(req.target_revenue) if req.target_revenue else current_val

        gap = target_val - current_val
        gap_pct = (gap / current_val * 100.0) if current_val > 0 else 0.0

        gap_item = GoalGapItem(
            metric_name="Primary Revenue",
            current_value=round(current_val, 2),
            target_value=round(target_val, 2),
            gap=round(gap, 2),
            gap_pct=round(gap_pct, 2),
            required_growth_pct=round(gap_pct, 2),
            monthly_target=round(gap / 12.0, 2),
            weekly_target=round(gap / 52.0, 2),
            daily_target=round(gap / 365.0, 2)
        )

        return GoalPlannerResponse(
            overall_feasibility=85.0,
            overall_difficulty="Medium",
            overall_risk="Low",
            recommended_strategy="Ensure columns align with planned goals.",
            steps=["Audit baseline variance.", "Monitor KPIs daily."],
            gaps=[gap_item]
        )

    @classmethod
    def simulate_scenario(cls, db: Session, user_id: int, req: WhatIfRequest) -> WhatIfResponse:
        ds = db.query(Dataset).order_by(Dataset.created_at.desc()).first()
        dataset_id = ds.id if ds else 1
        analysis = DatasetAnalysisService.get_analysis(db, dataset_id)
        kpis = analysis.get("kpis", {})

        base_val = float(kpis.get("total_revenue", 100000.0)) if isinstance(kpis.get("total_revenue"), (int, float)) else 100000.0
        proj_val = base_val * (1.0 + (req.adjustment_pct / 100.0))

        scenario = DecisionScenario(
            user_id=user_id,
            dataset_id=dataset_id,
            title=f"What-If: {req.scenario_type}",
            variables_json={"scenario_type": req.scenario_type, "adjustment_pct": req.adjustment_pct},
            projected_metrics_json={"predicted_revenue": proj_val, "predicted_profit": proj_val * 0.3}
        )
        db.add(scenario)
        db.commit()
        db.refresh(scenario)

        return WhatIfResponse(
            scenario_id=scenario.id,
            baseline_value=round(base_val, 2),
            projected_value=round(proj_val, 2),
            absolute_change=round(proj_val - base_val, 2),
            percentage_change=round(req.adjustment_pct, 2),
            insights=[f"Adjustment of {req.scenario_type} by {req.adjustment_pct}% shifts metric to {round(proj_val, 2)}."],
            generated_at=datetime.utcnow()
        )

    @classmethod
    def get_decision_history(cls, db: Session, user_id: int) -> List[DecisionHistoryItem]:
        scenarios = db.query(DecisionScenario).filter(DecisionScenario.user_id == user_id).all()
        history_items = []
        for s in scenarios:
            vars_json = s.variables_json or {}
            metrics_json = s.projected_metrics_json or {}
            history_items.append(DecisionHistoryItem(
                id=s.id,
                action_type="scenario_simulation",
                summary=f"Simulated {vars_json.get('scenario_type')} change: {vars_json.get('adjustment_pct')}%",
                result_text=f"Projected Val: ${round(metrics_json.get('predicted_revenue', 0.0), 2):,.2f}",
                created_at=s.created_at
            ))
        return history_items
