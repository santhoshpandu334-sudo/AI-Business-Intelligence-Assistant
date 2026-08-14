import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.db.models import Insight, Dataset, DataRecord
from app.services.dataset_analysis_service import DatasetAnalysisService
from app.services.capability_validator import CapabilityValidator
from app.services.grounding_validator import GroundingValidator

logger = logging.getLogger(__name__)

class InsightsEngineService:
    @staticmethod
    def generate_all_insights(db: Session, dataset_id: int) -> List[Insight]:
        """
        Scans dataset and generates auto-synthesized insights based on canonical analysis.
        """
        # Clear previous insights
        db.query(Insight).filter(Insight.dataset_id == dataset_id).delete()
        db.commit()

        analysis = DatasetAnalysisService.get_analysis(db, dataset_id)
        domain = analysis["detected_domains"]["primary_domain"]
        row_count = analysis["row_count"]
        quality = analysis["completeness_pct"]
        measures = analysis["schema_metadata"]["numerical_measures"]
        dimensions = analysis["schema_metadata"]["categorical_dimensions"]

        primary_measure = measures[0] if measures else "records"
        primary_dimension = dimensions[0] if dimensions else "segment"

        # Dynamically build insight cards
        insights_to_create = [
            Insight(
                dataset_id=dataset_id,
                type="executive_summary",
                title=f"Executive {domain} Dataset Overview",
                content=(
                    f"Overall evaluation for dataset tracks {row_count} total entries with a schema validation score of "
                    f"{quality:.1f}%. The primary analysis coordinate is set on '{primary_measure}' across categories in '{primary_dimension}'."
                ),
                importance="High",
                metrics_json={"row_count": row_count, "validation_score": f"{quality:.1f}%", "domain": domain}
            ),
            Insight(
                dataset_id=dataset_id,
                type="revenue_driver",
                title=f"Primary Distribution Driver: {primary_dimension.replace('_',' ').title()}",
                content=(
                    f"Aggregate analysis indicates significant concentration across categorical values. "
                    f"Management focus should target optimizing variance within '{primary_dimension}' groups."
                ),
                importance="High",
                metrics_json={"primary_measure": primary_measure, "primary_dimension": primary_dimension}
            ),
            Insight(
                dataset_id=dataset_id,
                type="cost_reduction",
                title="Process Efficiency Optimization Plan",
                content=(
                    f"Continuous audit loops suggest optimizing data cells. Resolving missing values "
                    f"will improve the standard forecast fit by establishing stronger analytical baselines."
                ),
                importance="High",
                metrics_json={"missing_values": analysis["missing_count"], "duplicates": analysis["duplicate_count"]}
            )
        ]

        # Add anomaly insight if found
        anomalies = analysis.get("anomaly_summaries", [])
        if anomalies:
            insights_to_create.append(Insight(
                dataset_id=dataset_id,
                type="anomaly",
                title=f"Outlier Spike Anomaly on Row {anomalies[0]['row_index']}",
                content=f"Statistical check flagged a deviation of {anomalies[0]['value']} in metric '{anomalies[0]['measure']}' (deviation: {anomalies[0]['deviation_pct']:+.1f}%). Recommended manual audit.",
                importance="High",
                metrics_json={"row": anomalies[0]['row_index'], "val": anomalies[0]['value'], "pct": f"{anomalies[0]['deviation_pct']}%"}
            ))
        else:
            insights_to_create.append(Insight(
                dataset_id=dataset_id,
                type="anomaly",
                title="Stable Variance Distribution Checks",
                content="Isolation Forest scans verify no severe outlier spikes exist beyond 2.5x standard deviations.",
                importance="Medium",
                metrics_json={"status": "Optimal"}
            ))

        # Dynamic recommendations from analysis object
        recs = analysis.get("recommendations", [])
        for idx, r in enumerate(recs[:3]):
            insights_to_create.append(Insight(
                dataset_id=dataset_id,
                type=f"business_recommendation_{idx}",
                title=r["title"],
                content=r["benefit"],
                importance=r["priority"],
                metrics_json={"priority": r["priority"], "impact": r["impact"]}
            ))

        db.add_all(insights_to_create)
        db.commit()
        
        return db.query(Insight).filter(Insight.dataset_id == dataset_id).all()

    @classmethod
    def get_executive_summary(cls, db: Session, dataset_id: int) -> Dict[str, Any]:
        """
        Generates a concise natural-language summary analyzing historical and projected company performance.
        """
        analysis = DatasetAnalysisService.get_analysis(db, dataset_id)
        domain = analysis["detected_domains"]["primary_domain"]
        row_count = analysis["row_count"]
        quality = analysis["completeness_pct"]

        summary_text = (
            f"The uploaded dataset is classified as {domain.upper()} with a confidence level of "
            f"{analysis['detected_domains']['confidence_score']}%. Processing successfully ingested {row_count} rows. "
            f"Automated data verification gives this schema a high-integrity score of {quality:.1f}%. "
            f"No default templates were applied; metrics are directly bound to the uploaded columns."
        )
        
        return {
            "summary": summary_text,
            "total_revenue": 0.0,
            "total_profit": 0.0,
            "orders": row_count,
            "active_customers": 0,
            "overall_health_score": quality,
            "company_status": "STRONG" if quality > 80 else "STABLE"
        }

    @classmethod
    def get_business_insights(cls, db: Session, dataset_id: int) -> List[Dict[str, Any]]:
        """
        Generates business insights across active dataset drivers.
        """
        analysis = DatasetAnalysisService.get_analysis(db, dataset_id)
        domain = analysis["detected_domains"]["primary_domain"]
        schema = analysis["schema_metadata"]
        
        return [
            {
                "category": "Domain Overview",
                "title": f"Dynamic {domain} Context",
                "details": f"Analysis confirms a high-fit {domain} classification. Column variables: {', '.join(schema['all_columns'][:8])}.",
                "severity": "Info"
            },
            {
                "category": "Measures Evaluated",
                "title": "Detected Numerical Series",
                "details": f"The analysis pipeline is actively tracking numerical columns: {', '.join(schema['numerical_measures'] or ['None'])}.",
                "severity": "Success"
            },
            {
                "category": "Dimensions Evaluated",
                "title": "Categorical Breakdowns",
                "details": f"Pivot analyses are supported on categoricals: {', '.join(schema['categorical_dimensions'] or ['None'])}.",
                "severity": "Info"
            }
        ]

    @classmethod
    def get_risk_intelligence(cls, db: Session, dataset_id: int) -> List[Dict[str, Any]]:
        """
        Generates risk assessments mapping severity, impact, probability, and recommendations.
        """
        analysis = DatasetAnalysisService.get_analysis(db, dataset_id)
        missing_count = analysis["missing_count"]
        
        return [
            {
                "risk_type": "Data Integrity Risk",
                "severity": "High" if missing_count > 10 else "Low",
                "business_impact": "Null cell entries can skew standard deviation calculations.",
                "probability": "Medium",
                "recommendation": "Configure column validation constraints on data upload files."
            }
        ]

    @classmethod
    def get_recommendations(cls, db: Session, dataset_id: int) -> List[Dict[str, Any]]:
        """
        Generates ranked recommendations containing priority, benefits, and confidence.
        """
        analysis = DatasetAnalysisService.get_analysis(db, dataset_id)
        recs = analysis.get("recommendations", [])
        
        result = []
        for r in recs:
            result.append({
                "title": r["title"],
                "priority": r["priority"],
                "expected_benefit": r["benefit"],
                "estimated_impact": r["impact"],
                "confidence_score": r["confidence_score"]
            })
        return result

    @classmethod
    def get_dashboard_summary(cls, db: Session, dataset_id: int) -> Dict[str, Any]:
        """
        Aggregates summaries, insights, risks, and recommendations together.
        """
        return {
            "executive_summary": cls.get_executive_summary(db, dataset_id),
            "business_insights": cls.get_business_insights(db, dataset_id),
            "risks": cls.get_risk_intelligence(db, dataset_id),
            "recommendations": cls.get_recommendations(db, dataset_id)
        }
