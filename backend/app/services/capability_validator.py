import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

class CapabilityValidator:
    @staticmethod
    def validate_capability(analysis_obj: Dict[str, Any], capability_name: str) -> Dict[str, Any]:
        """
        Validates whether the uploaded dataset supports the requested operation
        based on the detected schema, columns, and size.
        """
        schema = analysis_obj.get("schema_metadata", {})
        measures = schema.get("numerical_measures", [])
        dimensions = schema.get("categorical_dimensions", [])
        dates = schema.get("date_columns", [])
        row_count = analysis_obj.get("row_count", 0)

        supported = True
        reason = "The capability is fully supported by the dataset metrics."
        required_columns = []
        available_columns = list(schema.get("all_columns", []))
        missing_columns = []

        c_name = capability_name.lower().replace("_", " ").replace(" ", "")

        if "forecast" in c_name:
            required_columns = ["Date/Time Column", "Numerical Measure"]
            if not dates:
                supported = False
                missing_columns.append("Date/Time Column")
            if not measures:
                supported = False
                missing_columns.append("Numerical Measure")
            if row_count < 5:
                supported = False
                reason = "Insufficient rows for time-series forecasting (needs at least 5 rows)."
            if not supported and not missing_columns:
                pass
            elif not supported:
                reason = f"No valid datetime column and numerical measure were detected. Missing: {', '.join(missing_columns)}."

        elif "trend" in c_name:
            required_columns = ["Date/Time Column", "Numerical Measure"]
            if not dates:
                supported = False
                missing_columns.append("Date/Time Column")
            if not measures:
                supported = False
                missing_columns.append("Numerical Measure")
            if not supported:
                reason = f"Trend analysis requires a chronological reference and a numeric variable. Missing: {', '.join(missing_columns)}."

        elif "correlation" in c_name:
            required_columns = ["At least 2 Numerical Measures"]
            if len(measures) < 2:
                supported = False
                missing_columns.append("Second Numerical Measure")
                reason = "Correlation analysis requires at least two numerical measures to evaluate relationships."

        elif "rootcause" in c_name:
            required_columns = ["Numerical Measure", "Categorical Dimension"]
            if not measures:
                supported = False
                missing_columns.append("Numerical Measure")
            if not dimensions:
                supported = False
                missing_columns.append("Categorical Dimension")
            if not supported:
                reason = f"Root cause analysis requires a target measure and segment dimension. Missing: {', '.join(missing_columns)}."

        elif "decision" in c_name:
            required_columns = ["Numerical Measure", "Categorical Dimension"]
            if not measures:
                supported = False
                missing_columns.append("Numerical Measure")
            if not dimensions:
                supported = False
                missing_columns.append("Categorical Dimension")
            if not supported:
                reason = f"Decision Intelligence requires numeric values and comparative dimensions. Missing: {', '.join(missing_columns)}."

        elif "chart" in c_name:
            required_columns = ["Numerical Measure or Categorical Dimension"]
            if not measures and not dimensions:
                supported = False
                missing_columns.append("Numerical/Categorical field")
                reason = "Chart generation requires at least one numerical measure or category grouping."

        elif "kpi" in c_name:
            required_columns = ["Numerical Measure or record indicators"]
            if row_count == 0:
                supported = False
                reason = "The uploaded dataset has no records to compute KPI statistics."

        # If a required column matches a specific name but is not found
        elif "revenue" in c_name or "profit" in c_name or "sales" in c_name:
            # Check if any detected measure looks like revenue/sales
            has_financial = any(any(k in m.lower() for k in ["revenue", "sales", "profit", "amount", "cost"]) for m in measures)
            if not has_financial:
                supported = False
                reason = "The uploaded dataset does not contain a revenue-related numerical column."

        # Logging validation check
        logger.info(
            f"Capability check - '{capability_name}': supported={supported}, reason='{reason}'"
        )

        return {
            "capability_name": capability_name,
            "supported": supported,
            "confidence_score": 100 if supported else 0,
            "required_columns": required_columns,
            "available_columns": available_columns,
            "missing_columns": missing_columns,
            "reason": reason
        }
