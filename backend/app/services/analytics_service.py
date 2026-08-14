import logging
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.services.dataset_analysis_service import DatasetAnalysisService
from app.services.capability_validator import CapabilityValidator
from app.services.grounding_validator import GroundingValidator
from app.services.consistency_validator import ConsistencyValidator

logger = logging.getLogger(__name__)

class AnalyticsDashboardService:
    @staticmethod
    def _get_dataframe(db: Session, dataset_id: int):
        """
        Backward compatibility helper returning a dataframe from the DB.
        """
        from app.services.analytics_service import AnalyticsDashboardService as Legacy
        from app.db.models import DataRecord
        import pandas as pd
        records = db.query(DataRecord).filter(DataRecord.dataset_id == dataset_id).all()
        if not records:
            return pd.DataFrame()
        return pd.DataFrame([r.payload for r in records])

    @classmethod
    def get_kpis(
        cls,
        db: Session,
        dataset_id: int,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        product: Optional[str] = None,
        region: Optional[str] = None,
        category: Optional[str] = None,
        customer: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Fetches KPIs dynamically from the shared DatasetAnalysisService.
        """
        analysis = DatasetAnalysisService.get_analysis(db, dataset_id)
        domain = analysis["detected_domains"]["primary_domain"]
        kpis = analysis.get("kpis", {})

        # Grounding checks: if a Sales metric is requested but the dataset is not Sales,
        # return "Not Available" instead of fabricated values
        is_sales = (domain == "Sales/Finance")

        total_rev = kpis.get("total_revenue", 0.0) if is_sales else "Not Available"
        total_prof = kpis.get("total_profit", 0.0) if is_sales else "Not Available"
        profit_marg = kpis.get("profit_margin", 0.0) if is_sales else "Not Available"
        orders = kpis.get("total_orders", 0) if is_sales else "Not Available"
        
        # If student data, map total students to active customers, or GPA to revenue?
        # To avoid JS errors, we can return dynamic numeric fallbacks or "Not Available"
        active_cust = kpis.get("active_customers", 0) if is_sales else kpis.get("total_students", 0)

        # Build dynamic KPIs list for frontend dynamic rendering
        dynamic_kpis_list = []
        for key, val in kpis.items():
            if val == "Not Available" or val is None:
                continue
            pretty_name = key.replace('_', ' ').title()
            if pretty_name == "Dataset Health Score":
                pretty_name = "Dataset Health"
            if isinstance(val, float):
                val = round(val, 2)
            dynamic_kpis_list.append({
                "key": key,
                "name": pretty_name,
                "value": val
            })

        output = {
            "total_revenue": total_rev,
            "total_profit": total_prof,
            "active_customers": active_cust,
            "total_orders": orders if isinstance(orders, int) else 0,
            "avg_order_value": 0.0 if not is_sales else round(total_rev / orders if orders > 0 else 0.0, 2),
            "profit_margin": profit_marg,
            "dataset_health_score": analysis.get("completeness_pct", 100.0),
            "revenue_growth_pct": 0.0,
            "profit_growth_pct": 0.0,
            "dynamic_kpis": dynamic_kpis_list
        }

        # Run consistency check
        ConsistencyValidator.validate_consistency("Dashboard", {"kpis": output}, analysis)

        return output

    @classmethod
    def get_charts(
        cls,
        db: Session,
        dataset_id: int,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        product: Optional[str] = None,
        region: Optional[str] = None,
        category: Optional[str] = None,
        customer: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generates charts dynamically from the shared DatasetAnalysisService.
        """
        analysis = DatasetAnalysisService.get_analysis(db, dataset_id)
        chart_specs = analysis.get("chart_specifications", {})

        trend_data = chart_specs.get("trend_data", [])
        category_data = chart_specs.get("category_data", [])

        # Map to the format expected by Recharts
        return {
            "trend_data": trend_data,
            "product_data": category_data,
            "region_data": [],
            "category_data": []
        }

    @classmethod
    def get_health_score(cls, db: Session, dataset_id: int) -> Dict[str, Any]:
        """
        Calculates business health dimension index scores dynamically.
        """
        analysis = DatasetAnalysisService.get_analysis(db, dataset_id)
        score = analysis.get("completeness_pct", 100.0)

        return {
            "revenue_score": round(score, 1),
            "profit_score": round(score, 1),
            "customer_score": round(score, 1),
            "inventory_score": round(score, 1),
            "overall_score": round(score, 1)
        }
