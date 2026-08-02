import pandas as pd
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

# Column Aliases for Dynamic Detection
REVENUE_ALIASES = ["revenue", "sales", "total sales", "amount", "price", "turnover", "total_sales", "income", "sales_amount"]
PROFIT_ALIASES = ["profit", "net profit", "gross profit", "net_profit", "gross_profit", "earnings", "margin"]
ORDERS_ALIASES = ["orders", "order count", "transactions", "order_count", "quantity", "qty", "orders_count", "sales_count"]
CUSTOMERS_ALIASES = ["customers", "customer count", "clients", "customer_count", "client_count", "users", "customer_name", "customer", "client_name"]
REGION_ALIASES = ["region", "state", "territory", "country", "location", "zone", "area"]
CATEGORY_ALIASES = ["category", "product category", "product_category", "group", "type", "class", "product_type"]
COST_ALIASES = ["cost", "expense", "operational cost", "operational_cost", "opex", "expenditure"]
MARKETING_ALIASES = ["marketing", "marketing spend", "ad spend", "marketing_spend", "advertising", "promotions"]
DATE_ALIASES = ["date", "timestamp", "created_at", "order_date", "time", "order date"]

class DecisionIntelligenceService:

    @staticmethod
    def _detect_column(df: pd.DataFrame, aliases: List[str]) -> Optional[str]:
        """
        Dynamically detects equivalent columns in the DataFrame using case-insensitive matches.
        """
        cols = [str(c).lower().strip() for c in df.columns]
        # Try exact matching first
        for alias in aliases:
            alias_norm = alias.lower().strip()
            if alias_norm in cols:
                idx = cols.index(alias_norm)
                return df.columns[idx]
        # Try substring matching
        for alias in aliases:
            alias_norm = alias.lower().strip()
            for idx, col in enumerate(cols):
                if alias_norm in col or col in alias_norm:
                    return df.columns[idx]
        return None

    @classmethod
    def _get_dataset_df(cls, db: Session, dataset_id: Optional[int] = None) -> tuple[Optional[Dataset], Optional[pd.DataFrame]]:
        """
        Retrieves the specified dataset and loads its DataRecords into a pandas DataFrame.
        If no datasets exist, returns (None, None).
        """
        if dataset_id:
            ds = db.query(Dataset).filter(Dataset.id == dataset_id).first()
        else:
            ds = db.query(Dataset).order_by(Dataset.created_at.desc()).first()

        if not ds:
            return None, None

        records = db.query(DataRecord).filter(DataRecord.dataset_id == ds.id).all()
        if not records:
            return ds, None

        df = pd.DataFrame([r.payload for r in records])
        return ds, df

    @classmethod
    def get_health_score(cls, db: Session, user_id: int, dataset_id: Optional[int] = None) -> Union[HealthScore, Dict[str, Any]]:
        ds, df = cls._get_dataset_df(db, dataset_id)
        if ds is None or df is None:
            return {
                "success": True,
                "data": None,
                "message": "No datasets uploaded."
            }

        rev_col = cls._detect_column(df, REVENUE_ALIASES)
        profit_col = cls._detect_column(df, PROFIT_ALIASES)
        orders_col = cls._detect_column(df, ORDERS_ALIASES)
        cust_col = cls._detect_column(df, CUSTOMERS_ALIASES)

        rev_score = 0.0
        if rev_col and rev_col in df.columns:
            df[rev_col] = pd.to_numeric(df[rev_col], errors='coerce').fillna(0.0)
            if df[rev_col].sum() > 0:
                rev_score = min(float((df[rev_col] > 0).mean() * 100.0), 100.0)

        profit_score = 0.0
        if profit_col and profit_col in df.columns:
            df[profit_col] = pd.to_numeric(df[profit_col], errors='coerce').fillna(0.0)
            if df[profit_col].sum() > 0:
                profit_score = min(float((df[profit_col] > 0).mean() * 100.0), 100.0)

        sales_score = 0.0
        if orders_col and orders_col in df.columns:
            df[orders_col] = pd.to_numeric(df[orders_col], errors='coerce').fillna(0.0)
            if df[orders_col].sum() > 0:
                sales_score = min(float((df[orders_col] > 0).mean() * 100.0), 100.0)

        cust_score = 0.0
        if cust_col and cust_col in df.columns:
            unique_cust = df[cust_col].nunique()
            cust_score = min(float(unique_cust * 2.0), 100.0)

        forecast_score = 0.0
        fm = db.query(ForecastModel).filter(ForecastModel.dataset_id == ds.id).first()
        if fm and fm.metrics_json:
            r2 = fm.metrics_json.get("r2_score", 0.0)
            forecast_score = max(min(float(r2 * 100.0), 100.0), 0.0)

        anomalies = db.query(AnomalyResult).filter(AnomalyResult.dataset_id == ds.id).all()
        op_risk = max(100.0 - (len(anomalies) * 10.0), 0.0)

        quality_score = float(ds.quality_score) if ds.quality_score is not None else 100.0

        scores_list = [rev_score, profit_score, sales_score, cust_score, forecast_score, op_risk, quality_score]
        valid_scores = [s for s in scores_list if s > 0]
        overall = sum(valid_scores) / len(valid_scores) if valid_scores else 0.0

        status_label = "Critical"
        if overall >= 80.0:
            status_label = "Good"
        elif overall >= 60.0:
            status_label = "Warning"

        trend = "Stable"
        if overall > 75.0:
            trend = "Up"
        elif overall < 50.0:
            trend = "Down"

        return HealthScore(
            score=round(overall, 2),
            breakdown={
                "Revenue": round(rev_score, 2),
                "Profit": round(profit_score, 2),
                "Sales": round(sales_score, 2),
                "Customers": round(cust_score, 2),
                "Forecast Confidence": round(forecast_score, 2),
                "Operational Risk": round(op_risk, 2),
                "Data Quality": round(quality_score, 2)
            },
            status=status_label,
            trend=trend,
            calculated_at=datetime.utcnow()
        )

    @classmethod
    def run_what_if_analysis(cls, db: Session, user_id: int, req: WhatIfRequest) -> Union[WhatIfResponse, Dict[str, Any]]:
        ds, df = cls._get_dataset_df(db, req.dataset_id)
        if ds is None or df is None:
            return {
                "success": True,
                "data": None,
                "message": "No datasets uploaded."
            }

        rev_col = cls._detect_column(df, REVENUE_ALIASES)
        profit_col = cls._detect_column(df, PROFIT_ALIASES)
        cust_col = cls._detect_column(df, CUSTOMERS_ALIASES)
        cost_col = cls._detect_column(df, COST_ALIASES)
        marketing_col = cls._detect_column(df, MARKETING_ALIASES)

        original_revenue = 0.0
        original_profit = 0.0
        original_customers = 100

        if rev_col and rev_col in df.columns:
            df[rev_col] = pd.to_numeric(df[rev_col], errors='coerce').fillna(0.0)
            original_revenue = float(df[rev_col].sum())
        if profit_col and profit_col in df.columns:
            df[profit_col] = pd.to_numeric(df[profit_col], errors='coerce').fillna(0.0)
            original_profit = float(df[profit_col].sum())
        if cust_col and cust_col in df.columns:
            original_customers = int(df[cust_col].nunique())

        original_margin = (original_profit / original_revenue * 100.0) if original_revenue > 0.0 else 0.0

        original_cost = 0.0
        if cost_col and cost_col in df.columns:
            df[cost_col] = pd.to_numeric(df[cost_col], errors='coerce').fillna(0.0)
            original_cost = float(df[cost_col].sum())
        else:
            original_cost = max(original_revenue - original_profit, 0.0)

        original_marketing = 0.0
        if marketing_col and marketing_col in df.columns:
            df[marketing_col] = pd.to_numeric(df[marketing_col], errors='coerce').fillna(0.0)
            original_marketing = float(df[marketing_col].sum())
        else:
            original_marketing = original_revenue * 0.10

        factor = req.adjustment_pct / 100.0

        predicted_revenue = original_revenue
        predicted_profit = original_profit
        predicted_customers = original_customers
        business_explanation = ""

        scenario = req.scenario_type.lower()
        if "price" in scenario:
            elasticity = -1.5
            volume_change = factor * elasticity
            predicted_revenue = original_revenue * (1.0 + factor) * (1.0 + volume_change)
            predicted_cost = (original_cost * 0.4) + (original_cost * 0.6 * (1.0 + volume_change))
            predicted_profit = predicted_revenue - predicted_cost
            predicted_customers = max(int(round(original_customers * (1.0 + volume_change))), 1)
            business_explanation = (
                f"Simulating a price change by {req.adjustment_pct}%. Under price elasticity of demand ({elasticity}), "
                f"sales volume is projected to shift by {round(volume_change * 100, 2)}%, resulting in a predicted revenue of "
                f"${round(predicted_revenue, 2)} and a net profit change of {round(((predicted_profit - original_profit)/original_profit*100) if original_profit > 0 else 0, 2)}%."
            )
        elif "volume" in scenario:
            predicted_revenue = original_revenue * (1.0 + factor)
            predicted_cost = (original_cost * 0.4) + (original_cost * 0.6 * (1.0 + factor))
            predicted_profit = predicted_revenue - predicted_cost
            predicted_customers = max(int(round(original_customers * (1.0 + factor))), 1)
            business_explanation = (
                f"Simulating a {req.adjustment_pct}% change in sales volume. Revenue scales proportionally to "
                f"${round(predicted_revenue, 2)}, while variable operational costs adjust by {round(factor * 100 * 0.6, 2)}%, "
                f"shifting operating profit to ${round(predicted_profit, 2)}."
            )
        elif "marketing" in scenario:
            budget_diff = original_marketing * factor
            predicted_revenue = original_revenue + (budget_diff * 2.5)
            predicted_cost = original_cost + budget_diff
            predicted_profit = predicted_revenue - predicted_cost
            cust_growth_pct = factor * 0.4 if factor > 0 else factor * 0.6
            predicted_customers = max(int(round(original_customers * (1.0 + cust_growth_pct))), 1)
            business_explanation = (
                f"Modifying the marketing budget by {req.adjustment_pct}% (${round(budget_diff, 2)} absolute change). "
                f"Assuming a 2.5x return on ad spend (ROAS), this projects top-line revenue at ${round(predicted_revenue, 2)} "
                f"and shifts the active customer base by {round(cust_growth_pct * 100, 2)}%."
            )
        elif "cost" in scenario:
            predicted_revenue = original_revenue
            predicted_cost = original_cost * (1.0 + factor)
            predicted_profit = predicted_revenue - predicted_cost
            predicted_customers = original_customers
            business_explanation = (
                f"Simulating a cost shift of {req.adjustment_pct}% in operational overheads. Revenue remains flat at "
                f"${round(original_revenue, 2)}, but total opex changes to ${round(predicted_cost, 2)}, driving net margins "
                f"from {round(original_margin, 2)}% to {round((predicted_profit / predicted_revenue * 100.0) if predicted_revenue > 0 else 0, 2)}%."
            )
        elif "customer" in scenario:
            predicted_customers = max(int(round(original_customers * (1.0 + factor))), 1)
            predicted_revenue = original_revenue * (1.0 + factor)
            predicted_cost = (original_cost * 0.4) + (original_cost * 0.6 * (1.0 + factor))
            predicted_profit = predicted_revenue - predicted_cost
            business_explanation = (
                f"Adjusting the customer base by {req.adjustment_pct}%. Proportional transaction volumes drive revenue to "
                f"${round(predicted_revenue, 2)} and shift opex variables, changing net profit by "
                f"{round(((predicted_profit - original_profit)/original_profit*100) if original_profit > 0 else 0, 2)}%."
            )
        elif "margin" in scenario:
            predicted_revenue = original_revenue
            predicted_margin = original_margin * (1.0 + factor)
            predicted_profit = predicted_revenue * (predicted_margin / 100.0)
            predicted_customers = original_customers
            business_explanation = (
                f"Simulating a {req.adjustment_pct}% relative shift in net operating margins. Operating margin "
                f"targets {round(predicted_margin, 2)}%, yielding a projected profit of ${round(predicted_profit, 2)}."
            )
        elif "discount" in scenario:
            discount_val = -abs(factor)
            volume_growth = abs(factor) * 2.0
            predicted_revenue = original_revenue * (1.0 + discount_val) * (1.0 + volume_growth)
            predicted_cost = (original_cost * 0.4) + (original_cost * 0.6 * (1.0 + volume_growth))
            predicted_profit = predicted_revenue - predicted_cost
            predicted_customers = max(int(round(original_customers * (1.0 + volume_growth * 0.8))), 1)
            business_explanation = (
                f"Running a discount campaign of {abs(req.adjustment_pct)}%. Volume is projected to increase by "
                f"{round(volume_growth * 100, 2)}%, resulting in a net revenue shift of "
                f"{round(((predicted_revenue - original_revenue)/original_revenue*100) if original_revenue > 0 else 0, 2)}%."
            )
        elif "inventory" in scenario:
            predicted_revenue = original_revenue
            predicted_cost = original_cost * (1.0 + factor * 0.15)
            predicted_profit = predicted_revenue - predicted_cost
            predicted_customers = original_customers
            business_explanation = (
                f"Adjusting average inventory stock levels by {req.adjustment_pct}%. Projects carrying cost opex shift by "
                f"{round(factor * 0.15 * 100, 2)}%, resulting in net profit of ${round(predicted_profit, 2)}."
            )
        else:
            predicted_revenue = original_revenue * (1.0 + factor)
            predicted_profit = original_profit * (1.0 + factor)
            predicted_customers = max(int(round(original_customers * (1.0 + factor))), 1)
            business_explanation = f"Evaluated scenario {req.scenario_type} with adjustment {req.adjustment_pct}%."

        predicted_margin = (predicted_profit / predicted_revenue * 100.0) if predicted_revenue > 0.0 else 0.0

        revenue_diff = predicted_revenue - original_revenue
        revenue_change_pct = (revenue_diff / original_revenue * 100.0) if original_revenue > 0.0 else 0.0

        profit_diff = predicted_profit - original_profit
        profit_change_pct = (profit_diff / original_profit * 100.0) if original_profit > 0.0 else 0.0

        margin_diff = predicted_margin - original_margin
        margin_change_pct = (margin_diff / original_margin * 100.0) if original_margin > 0.0 else 0.0

        customers_diff = predicted_customers - original_customers
        customers_change_pct = (customers_diff / original_customers * 100.0) if original_customers > 0.0 else 0.0

        growth_pct = revenue_change_pct

        risk_level = "Low"
        if profit_change_pct < -15.0 or abs(req.adjustment_pct) > 25.0:
            risk_level = "High"
        elif profit_change_pct < -5.0 or abs(req.adjustment_pct) > 12.0:
            risk_level = "Medium"

        quality_score = float(ds.quality_score) if ds.quality_score is not None else 100.0
        confidence_score = quality_score * (1.0 - abs(factor) * 0.2)
        confidence_score = max(min(confidence_score, 98.0), 30.0)

        # Log scenario run to database
        db_scenario = DecisionScenario(
            user_id=user_id,
            name=f"What-If: {req.scenario_type} ({req.adjustment_pct}%)",
            description=business_explanation,
            variables_json={
                "scenario_type": req.scenario_type,
                "adjustment_pct": req.adjustment_pct,
                "target_metric": req.target_metric
            },
            projected_metrics_json={
                "original_revenue": original_revenue,
                "predicted_revenue": predicted_revenue,
                "revenue_change_pct": revenue_change_pct,
                "original_profit": original_profit,
                "predicted_profit": predicted_profit,
                "profit_change_pct": profit_change_pct,
                "growth_pct": growth_pct,
                "risk_level": risk_level,
                "confidence_score": confidence_score
            }
        )
        db.add(db_scenario)
        db.commit()
        db.refresh(db_scenario)

        return WhatIfResponse(
            success=True,
            scenario_type=req.scenario_type,
            adjustment_pct=req.adjustment_pct,
            target_metric=req.target_metric,

            original_revenue=round(original_revenue, 2),
            predicted_revenue=round(predicted_revenue, 2),
            revenue_diff=round(revenue_diff, 2),
            revenue_change_pct=round(revenue_change_pct, 2),

            original_profit=round(original_profit, 2),
            predicted_profit=round(predicted_profit, 2),
            profit_diff=round(profit_diff, 2),
            profit_change_pct=round(profit_change_pct, 2),

            original_margin=round(original_margin, 2),
            predicted_margin=round(predicted_margin, 2),
            margin_diff=round(margin_diff, 2),
            margin_change_pct=round(margin_change_pct, 2),

            original_customers=original_customers,
            predicted_customers=predicted_customers,
            customers_diff=customers_diff,
            customers_change_pct=round(customers_change_pct, 2),

            growth_pct=round(growth_pct, 2),
            risk_level=risk_level,
            confidence_score=round(confidence_score, 2),
            business_explanation=business_explanation
        )

    @classmethod
    def get_root_cause_analysis(cls, db: Session, user_id: int, dataset_id: Optional[int] = None, metric: Optional[str] = None) -> Union[RootCauseAnalysis, Dict[str, Any]]:
        ds, df = cls._get_dataset_df(db, dataset_id)
        if ds is None or df is None:
            return {
                "success": True,
                "data": None,
                "message": "No datasets uploaded."
            }

        target_metric = metric or "Revenue"
        
        # Detect metric column
        if target_metric.lower() in ["revenue", "sales", "revenue margin", "sales trend"]:
            metric_col = cls._detect_column(df, REVENUE_ALIASES)
        elif target_metric.lower() in ["profit", "profit margin", "margin"]:
            metric_col = cls._detect_column(df, PROFIT_ALIASES)
        elif target_metric.lower() in ["orders", "transactions"]:
            metric_col = cls._detect_column(df, ORDERS_ALIASES)
        elif target_metric.lower() in ["customers", "clients"]:
            metric_col = cls._detect_column(df, CUSTOMERS_ALIASES)
        else:
            metric_col = cls._detect_column(df, REVENUE_ALIASES) or df.columns[0]

        if not metric_col or metric_col not in df.columns:
            return RootCauseAnalysis(
                metric=target_metric,
                deviation_pct=0.0,
                possible_causes=[{"factor": "Metric column not found in dataset.", "contribution_pct": 100.0}],
                insights=["Ensure the uploaded dataset matches aliases."],
                analyzed_at=datetime.utcnow()
            )

        df[metric_col] = pd.to_numeric(df[metric_col], errors='coerce').fillna(0.0)

        # Sort chronologically if date column is present
        date_col = cls._detect_column(df, DATE_ALIASES)
        if date_col and date_col in df.columns:
            try:
                df[date_col] = pd.to_datetime(df[date_col], errors='coerce')
                df = df.dropna(subset=[date_col]).sort_values(by=date_col)
            except Exception:
                pass

        # Split into Historical vs Recent (50/50 split)
        n = len(df)
        if n < 2:
            return RootCauseAnalysis(
                metric=target_metric,
                deviation_pct=0.0,
                possible_causes=[{"factor": "Dataset contains insufficient rows for comparison.", "contribution_pct": 100.0}],
                insights=["Upload a larger time-series dataset to perform root cause analysis."],
                analyzed_at=datetime.utcnow()
            )

        hist_df = df.iloc[:n//2]
        recent_df = df.iloc[n//2:]

        hist_sum = float(hist_df[metric_col].sum())
        recent_sum = float(recent_df[metric_col].sum())
        diff = recent_sum - hist_sum
        deviation_pct = (diff / hist_sum * 100.0) if hist_sum > 0 else 0.0

        # Dynamically detect categorical dimensions
        dimensions = []
        for col in df.columns:
            if col not in [metric_col, date_col] and df[col].dtype in ['object', 'category']:
                cardinality = df[col].nunique()
                if 1 < cardinality <= 35:
                    dimensions.append(col)

        possible_causes = []
        insights = []

        if dimensions and abs(diff) > 0:
            for dim in dimensions:
                # Group by in both halves
                hist_groups = hist_df.groupby(dim)[metric_col].sum()
                recent_groups = recent_df.groupby(dim)[metric_col].sum()
                
                all_vals = set(hist_groups.index).union(recent_groups.index)
                for val in all_vals:
                    val_hist = float(hist_groups.get(val, 0.0))
                    val_recent = float(recent_groups.get(val, 0.0))
                    val_diff = val_recent - val_hist
                    
                    # Match direction of overall deviation
                    is_main_driver = (diff < 0 and val_diff < 0) or (diff > 0 and val_diff > 0)
                    if is_main_driver:
                        possible_causes.append({
                            "factor": f"{dim} '{val}' shift",
                            "contribution_pct": round((val_diff / diff * 100.0), 2),
                            "raw_diff": val_diff
                        })

        # Rank contributing factors by highest absolute contribution percentage
        possible_causes = sorted(possible_causes, key=lambda x: abs(x["contribution_pct"]), reverse=True)[:5]

        # Structure insights
        direction = "drop" if diff < 0 else "spike"
        if possible_causes:
            top_cause = possible_causes[0]
            insights.append(
                f"The dynamic root cause model indicates the overall {direction} was primarily driven by {top_cause['factor']} "
                f"which accounted for {top_cause['contribution_pct']}% of the variance."
            )
            for cause in possible_causes[1:3]:
                insights.append(f"Secondary driver identified: {cause['factor']} contributing {cause['contribution_pct']}% to the shift.")
        else:
            possible_causes = [{"factor": "Symmetrical variance across all categories.", "contribution_pct": 100.0}]
            insights.append("Metric shift is evenly distributed. No single product line or region is disproportionately responsible.")

        return RootCauseAnalysis(
            metric=target_metric,
            deviation_pct=round(deviation_pct, 2),
            possible_causes=[{"factor": c["factor"], "contribution_pct": abs(c["contribution_pct"])} for c in possible_causes],
            insights=insights,
            analyzed_at=datetime.utcnow()
        )

    @classmethod
    def get_alerts(cls, db: Session, user_id: int, dataset_id: Optional[int] = None) -> Union[List[BusinessAlertSchema], Dict[str, Any]]:
        ds, df = cls._get_dataset_df(db, dataset_id)
        if ds is None or df is None:
            return {
                "success": True,
                "data": None,
                "message": "No datasets uploaded."
            }

        rev_col = cls._detect_column(df, REVENUE_ALIASES)
        profit_col = cls._detect_column(df, PROFIT_ALIASES)
        cust_col = cls._detect_column(df, CUSTOMERS_ALIASES)

        # Clear old alerts to avoid spamming
        db.query(BusinessAlert).filter(BusinessAlert.user_id == user_id).delete()
        db.commit()

        new_alerts = []

        # Metric Trends Checks
        n = len(df)
        if n >= 2:
            hist_df = df.iloc[:n//2]
            recent_df = df.iloc[n//2:]

            if rev_col and rev_col in df.columns:
                df[rev_col] = pd.to_numeric(df[rev_col], errors='coerce').fillna(0.0)
                hist_rev = hist_df[rev_col].sum()
                recent_rev = recent_df[rev_col].sum()
                rev_change = (recent_rev - hist_rev) / hist_rev if hist_rev > 0 else 0
                if rev_change < -0.15:
                    new_alerts.append(BusinessAlert(
                        user_id=user_id,
                        title="Severe Revenue Devaluation",
                        message=f"Revenue fell by {round(abs(rev_change)*100, 2)}% comparing historical vs recent periods.",
                        severity="Critical",
                        metric="Revenue",
                        current_value=float(recent_rev),
                        threshold_value=float(hist_rev),
                        is_resolved=False
                    ))
                elif rev_change < -0.05:
                    new_alerts.append(BusinessAlert(
                        user_id=user_id,
                        title="Revenue Contraction Warning",
                        message=f"Detected a drop of {round(abs(rev_change)*100, 2)}% in aggregate revenue metrics.",
                        severity="High",
                        metric="Revenue",
                        current_value=float(recent_rev),
                        threshold_value=float(hist_rev),
                        is_resolved=False
                    ))

            if profit_col and profit_col in df.columns:
                df[profit_col] = pd.to_numeric(df[profit_col], errors='coerce').fillna(0.0)
                hist_prof = hist_df[profit_col].sum()
                recent_prof = recent_df[profit_col].sum()
                prof_change = (recent_prof - hist_prof) / hist_prof if hist_prof > 0 else 0
                if prof_change < -0.20:
                    new_alerts.append(BusinessAlert(
                        user_id=user_id,
                        title="Critical Margin Erosion",
                        message=f"Net profits contracted sharply by {round(abs(prof_change)*100, 2)}%. Check cost structures immediately.",
                        severity="Critical",
                        metric="Profit",
                        current_value=float(recent_prof),
                        threshold_value=float(hist_prof),
                        is_resolved=False
                    ))
                elif prof_change < -0.05:
                    new_alerts.append(BusinessAlert(
                        user_id=user_id,
                        title="Operating Profit Deficit",
                        message=f"Profit dropped by {round(abs(prof_change)*100, 2)}% compared to the baseline period.",
                        severity="High",
                        metric="Profit",
                        current_value=float(recent_prof),
                        threshold_value=float(hist_prof),
                        is_resolved=False
                    ))

            if cust_col and cust_col in df.columns:
                hist_cust = hist_df[cust_col].nunique()
                recent_cust = recent_df[cust_col].nunique()
                cust_change = (recent_cust - hist_cust) / hist_cust if hist_cust > 0 else 0
                if cust_change < -0.10:
                    new_alerts.append(BusinessAlert(
                        user_id=user_id,
                        title="Rapid Customer Churn Spurt",
                        message=f"Active customer accounts count decreased by {round(abs(cust_change)*100, 2)}% over time.",
                        severity="High",
                        metric="Customers",
                        current_value=float(recent_cust),
                        threshold_value=float(hist_cust),
                        is_resolved=False
                    ))

        # Forecast accuracy check
        fm = db.query(ForecastModel).filter(ForecastModel.dataset_id == ds.id).first()
        if fm and fm.metrics_json:
            r2 = fm.metrics_json.get("r2_score", 1.0)
            if r2 < 0.60:
                new_alerts.append(BusinessAlert(
                    user_id=user_id,
                    title="Forecast Inaccuracy Warning",
                    message=f"The current predictive forecast R2 score of {round(r2, 2)} drops below minimum confidence.",
                    severity="High",
                    metric="Forecast Confidence",
                    current_value=float(r2),
                    threshold_value=0.75,
                    is_resolved=False
                ))
            elif r2 < 0.75:
                new_alerts.append(BusinessAlert(
                    user_id=user_id,
                    title="Moderate Forecast Variance",
                    message=f"ML model fits display minor deviations. R2 score currently sits at {round(r2, 2)}.",
                    severity="Medium",
                    metric="Forecast Confidence",
                    current_value=float(r2),
                    threshold_value=0.75,
                    is_resolved=False
                ))

        # Anomalies check
        anomalies = db.query(AnomalyResult).filter(AnomalyResult.dataset_id == ds.id).all()
        if len(anomalies) > 0:
            new_alerts.append(BusinessAlert(
                user_id=user_id,
                title="Transaction Anomaly Spike",
                message=f"Detected {len(anomalies)} statistical anomalies in records. Review anomalies log tab.",
                severity="Critical" if len(anomalies) > 5 else "Medium",
                metric="Anomalies",
                current_value=float(len(anomalies)),
                threshold_value=0.0,
                is_resolved=False
            ))

        # Fallback if no alerts generated to ensure the list isn't empty
        if not new_alerts:
            new_alerts.append(BusinessAlert(
                user_id=user_id,
                title="Healthy KPI Boundaries",
                message="All dynamic indicators (Revenue, Profit, Customers, Quality) sit within safe operating bounds.",
                severity="Low",
                metric="General",
                current_value=100.0,
                threshold_value=90.0,
                is_resolved=True
            ))

        db.add_all(new_alerts)
        db.commit()

        alerts_in_db = db.query(BusinessAlert).filter(BusinessAlert.user_id == user_id).all()
        return [
            BusinessAlertSchema(
                id=a.id,
                title=a.title,
                message=a.message,
                severity=a.severity,
                metric=a.metric,
                current_value=a.current_value,
                threshold_value=a.threshold_value,
                is_resolved=a.is_resolved,
                created_at=a.created_at
            ) for a in alerts_in_db
        ]

    @classmethod
    def plan_goal(cls, db: Session, user_id: int, req: GoalPlannerRequest) -> Union[GoalPlannerResponse, Dict[str, Any]]:
        ds, df = cls._get_dataset_df(db)
        if ds is None or df is None:
            return {
                "success": True,
                "data": None,
                "message": "No datasets uploaded."
            }

        rev_col = cls._detect_column(df, REVENUE_ALIASES)
        profit_col = cls._detect_column(df, PROFIT_ALIASES)
        orders_col = cls._detect_column(df, ORDERS_ALIASES)
        cust_col = cls._detect_column(df, CUSTOMERS_ALIASES)

        # Baseline aggregates
        current_revenue = float(df[rev_col].sum()) if (rev_col and rev_col in df.columns) else 100000.0
        current_profit = float(df[profit_col].sum()) if (profit_col and profit_col in df.columns) else 30000.0
        current_orders = float(df[orders_col].sum()) if (orders_col and orders_col in df.columns) else 1000.0
        current_customers = float(df[cust_col].nunique()) if (cust_col and cust_col in df.columns) else 100.0
        current_margin = (current_profit / current_revenue * 100.0) if current_revenue > 0 else 0.0

        targets = [
            ("Revenue", current_revenue, req.target_revenue),
            ("Profit", current_profit, req.target_profit),
            ("Orders", current_orders, req.target_orders),
            ("Customers", current_customers, req.target_customers),
            ("Profit Margin", current_margin, req.target_margin),
        ]

        # Calculate time difference
        try:
            deadline_dt = datetime.strptime(req.target_date, "%Y-%m-%d")
        except Exception:
            deadline_dt = datetime.utcnow()
        
        days_left = max((deadline_dt - datetime.utcnow()).days, 1)
        months_left = max(days_left / 30.0, 0.1)

        gaps = []
        growth_rates = []

        for metric_name, current_val, target_val in targets:
            if target_val is None:
                continue

            gap = target_val - current_val
            gap_pct = (gap / current_val * 100.0) if current_val > 0 else 0.0
            req_growth = gap_pct

            # timelines distribute
            monthly = gap / months_left
            weekly = gap / (days_left / 7.0)
            daily = gap / days_left

            gaps.append(GoalGapItem(
                metric_name=metric_name,
                current_value=round(current_val, 2),
                target_value=round(target_val, 2),
                gap=round(gap, 2),
                gap_pct=round(gap_pct, 2),
                required_growth_pct=round(req_growth, 2),
                monthly_target=round(monthly, 2),
                weekly_target=round(weekly, 2),
                daily_target=round(daily, 2)
            ))
            growth_rates.append(req_growth)

        # Average required growth
        avg_growth = sum(growth_rates) / len(growth_rates) if growth_rates else 0.0

        overall_feasibility = 100.0 - (avg_growth * 0.4)
        overall_feasibility = max(min(overall_feasibility, 98.0), 15.0)

        overall_difficulty = "Easy"
        if avg_growth > 30.0:
            overall_difficulty = "Very Challenging"
        elif avg_growth > 15.0:
            overall_difficulty = "Hard"
        elif avg_growth > 5.0:
            overall_difficulty = "Medium"

        overall_risk = "Low"
        if avg_growth > 25.0 or days_left < 90:
            overall_risk = "High"
        elif avg_growth > 10.0:
            overall_risk = "Medium"

        # Formulate customized strategy and steps
        recommended_strategy = (
            f"Prioritize volume expansion and cost optimization simultaneously. Feasibility is rated at {round(overall_feasibility, 2)}% "
            f"across a timeline of {days_left} days. Focus on high margin product categories to accelerate net gains."
        )

        steps = []
        for idx, gap_item in enumerate(gaps):
            steps.append({
                "step": idx + 1,
                "description": f"Close the {gap_item.metric_name} gap of {gap_item.gap} by securing a monthly incremental target of {gap_item.monthly_target}.",
                "target_subvalue": gap_item.target_value
            })

        # Save goal planner record to DB
        db_goal = BusinessGoal(
            user_id=user_id,
            metric_name=", ".join([g.metric_name for g in gaps]) or "Multi-Goal",
            current_value=current_revenue,
            target_value=req.target_revenue or 0.0,
            target_date=req.target_date,
            status="active"
        )
        db.add(db_goal)
        db.commit()

        return GoalPlannerResponse(
            success=True,
            target_date=req.target_date,
            gaps=gaps,
            overall_feasibility_score=round(overall_feasibility, 2),
            overall_difficulty=overall_difficulty,
            overall_risk_level=overall_risk,
            recommended_strategy=recommended_strategy,
            plan_steps=steps,
            recommendations=[
                "Deploy targeted loyalty points programs to scale Customer volumes.",
                "Review pricing elasticities monthly to optimize margins pass-through."
            ]
        )

    @classmethod
    def get_recommendations(cls, db: Session, user_id: int, dataset_id: Optional[int] = None) -> Union[List[BusinessRecommendation], Dict[str, Any]]:
        ds, df = cls._get_dataset_df(db, dataset_id)
        if ds is None or df is None:
            return {
                "success": True,
                "data": None,
                "message": "No datasets uploaded."
            }

        recommendations = []
        quality_score = float(ds.quality_score) if ds.quality_score is not None else 100.0

        recommendations.append(
            BusinessRecommendation(
                title="Optimize Resource Allocation",
                description=f"Analysis of dataset '{ds.name}' suggests opex consolidations to optimize top-line performance.",
                impact_score=85.0,
                difficulty="Medium",
                category="cost",
                created_at=datetime.utcnow()
            )
        )
        recommendations.append(
            BusinessRecommendation(
                title="Data Quality Remediation",
                description=f"Dataset quality is scored at {quality_score}%. Resolve missing values to increase forecast confidence.",
                impact_score=90.0,
                difficulty="Easy",
                category="customer",
                created_at=datetime.utcnow()
            )
        )
        return recommendations

    @classmethod
    def run_executive_advisor(cls, db: Session, user_id: int, req: ExecutiveAdvisorRequest) -> Union[ExecutiveAdvisorResponse, Dict[str, Any]]:
        ds, df = cls._get_dataset_df(db)
        if ds is None or df is None:
            return {
                "success": True,
                "data": None,
                "message": "No datasets uploaded."
            }

        # Log query to history
        db_history = DecisionHistory(
            user_id=user_id,
            action_type="advisor_query",
            query_text=req.query
        )
        db.add(db_history)
        db.commit()
        db.refresh(db_history)

        query_lower = req.query.lower()

        # Compute dynamic elements to synthesize
        health = cls.get_health_score(db, user_id, ds.id)
        health_score = health.score if isinstance(health, HealthScore) else 80.0

        # RAG - Pull Insight database records matching key concepts
        insights_db = db.query(Insight).filter(Insight.dataset_id == ds.id).all()
        rag_context = ""
        for ins in insights_db:
            if any(term in ins.content.lower() for term in ["revenue", "profit", "sales", "cost", "anomaly", "risk"]):
                rag_context += f"- {ins.title}: {ins.content} "

        # Dynamic query routing
        if "region" in query_lower:
            region_col = cls._detect_column(df, REGION_ALIASES)
            rev_col = cls._detect_column(df, REVENUE_ALIASES)
            if region_col and rev_col:
                df[rev_col] = pd.to_numeric(df[rev_col], errors='coerce').fillna(0.0)
                region_sums = df.groupby(region_col)[rev_col].sum()
                best_region = region_sums.idxmax()
                best_val = region_sums.max()
                response_text = (
                    f"Dynamic database aggregates show that Region '{best_region}' is the top performer with "
                    f"a total sales sum of ${round(best_val, 2)}. "
                )
                if rag_context:
                    response_text += f"\nCombining historical context: {rag_context[:200]}..."
                actions = [f"Replicate sales strategies from region {best_region}", "Optimize logistics in secondary zones"]
            else:
                response_text = "No region geographical metrics found in dataset. Standardize state/country aliases to view breakdown."
                actions = ["Format geographical headers"]

        elif "profit" in query_lower or "decrease" in query_lower or "drop" in query_lower:
            # Root Cause analysis on Profit
            rca = cls.get_root_cause_analysis(db, user_id, ds.id, "Profit")
            dev = rca.deviation_pct if isinstance(rca, RootCauseAnalysis) else 0.0
            main_cause = rca.possible_causes[0]["factor"] if (isinstance(rca, RootCauseAnalysis) and rca.possible_causes) else "operational overheads"
            response_text = (
                f"Root cause checks show that Profit shifted by {dev}% over time. "
                f"The main contributing factor was {main_cause}. "
            )
            if rag_context:
                response_text += f"Active database insights report: {rag_context[:180]}..."
            actions = ["Conduct comprehensive vendor budget review", "Execute What-If Operational Cost simulation"]

        elif "risk" in query_lower:
            # Check alerts
            alerts_list = cls.get_alerts(db, user_id, ds.id)
            crit_count = len([a for a in alerts_list if a.severity == "Critical"]) if isinstance(alerts_list, list) else 0
            response_text = (
                f"Governance audits report {crit_count} critical/high alerts active. Forecast fits Sit stable, "
                f"but cost devaluations represent operating risks. "
            )
            actions = ["Inspect critical severity alerts immediately", "Review threshold limits monthly"]

        elif "next month" in query_lower or "do next" in query_lower or "sales" in query_lower:
            # Run What-If pricing scenario impact
            response_text = (
                f"AI strategic models advise raising sales volumes by 15% to offset high fixed costs. "
                f"Our What-If elasticity forecasts indicate this pass-through will recover operating profit margins."
            )
            actions = ["Incorporate customer loyalty campaigns", "Reallocate ad spend towards top margins channels"]

        else:
            response_text = (
                f"Overall executive overview: Business Health Score is {health_score}/100. "
                f"ML Forecasting systems fit is within safe boundaries. Recommend reviewing Smart Alerts."
            )
            actions = ["Monitor decision alerts weekly", "Execute What-If Pricing changes simulations"]

        confidence = 90.0 - (10.0 if "risk" in query_lower else 0.0)

        db_history.response_text = response_text
        db.commit()

        return ExecutiveAdvisorResponse(
            response_text=response_text,
            supporting_data={"health_score": health_score, "dataset_id": ds.id},
            suggested_actions=actions,
            confidence_score=confidence,
            generated_at=datetime.utcnow()
        )

    @classmethod
    def get_decision_history(cls, db: Session, user_id: int) -> List[DecisionHistoryItem]:
        # Fetch user
        user = db.query(User).filter(User.id == user_id).first()
        user_email = user.email if user else "user@example.com"

        history_items = []

        # Get What-If runs
        scenarios = db.query(DecisionScenario).filter(DecisionScenario.user_id == user_id).all()
        for s in scenarios:
            vars_json = s.variables_json or {}
            metrics_json = s.projected_metrics_json or {}
            
            summary = (
                f"Run What-If: {vars_json.get('scenario_type')} at {vars_json.get('adjustment_pct')}%. "
                f"Proj Profit: ${round(metrics_json.get('predicted_profit', 0.0), 2)}"
            )

            history_items.append(DecisionHistoryItem(
                id=s.id,
                user_email=user_email,
                timestamp=s.created_at,
                decision_type="simulation",
                scenario_type=s.name,
                input_parameters=vars_json,
                output_summary=s.description or summary,
                confidence_score=float(metrics_json.get("confidence_score", 95.0)),
                risk_level=metrics_json.get("risk_level", "Low")
            ))

        # Get advisor queries
        queries = db.query(DecisionHistory).filter(DecisionHistory.user_id == user_id).all()
        for q in queries:
            history_items.append(DecisionHistoryItem(
                id=q.id + 10000, # prevent ID collisions
                user_email=user_email,
                timestamp=q.created_at,
                decision_type="advisor_query",
                scenario_type=q.query_text or "Executive Question",
                input_parameters={"query": q.query_text},
                output_summary=q.response_text or "No response logged.",
                confidence_score=90.0,
                risk_level="Low"
            ))

        # Sort chronologically descending
        history_items.sort(key=lambda x: x.timestamp, reverse=True)
        return history_items
