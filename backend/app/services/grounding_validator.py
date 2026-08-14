import logging
from datetime import datetime
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)

class GroundingValidator:
    @staticmethod
    def get_metadata(
        source_columns: List[str],
        rows_analyzed: int,
        analysis_method: str = "DatasetAnalysisService",
        confidence_score: float = 100.0,
        assumptions_used: str = "None",
        unavailable_fields: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Synthesizes standard grounding metadata schema.
        """
        return {
            "source_columns": source_columns,
            "rows_analyzed": rows_analyzed,
            "analysis_method": analysis_method,
            "generated_from": "DatasetAnalysisService",
            "confidence_score": confidence_score,
            "assumptions_used": assumptions_used,
            "unavailable_fields": unavailable_fields or [],
            "generated_timestamp": datetime.utcnow().isoformat()
        }

    @staticmethod
    def validate_content(
        content_text: str,
        analysis_obj: Dict[str, Any],
        target_field: Optional[str] = None
    ) -> str:
        """
        Ensures text answers do not fabricate ungrounded business metrics.
        If a term (like revenue/sales) is requested but not in the dataset,
        substitutes the text with the standard missing info notification.
        """
        schema = analysis_obj.get("schema_metadata", {})
        measures = [m.lower() for m in schema.get("numerical_measures", [])]
        dimensions = [d.lower() for d in schema.get("categorical_dimensions", [])]
        dates = [t.lower() for t in schema.get("date_columns", [])]
        domain = analysis_obj.get("detected_domains", {}).get("primary_domain", "Generic")

        text_lower = content_text.lower()

        # Check for ungrounded financial references
        financial_keywords = ["revenue", "sales", "profit", "arr", "margin", "billing", "cost"]
        has_fin_cols = any(any(k in m for k in ["revenue", "sales", "profit", "amount", "cost"]) for m in measures)
        
        if not has_fin_cols:
            # If the output text refers to specific numbers like "$14.25M" or "Cloud Revenue",
            # or makes claims about finance but we have no financial columns, flag it.
            # However, if it's stating "no revenue columns found", that is allowed!
            if any(k in text_lower for k in financial_keywords) and not any(neg in text_lower for neg in ["not contain", "no revenue", "no profit", "unavailable", "does not"]):
                logger.warning("Grounding validation failed: Output contains ungrounded financial narratives on non-financial dataset.")
                return "This conclusion cannot be generated because the uploaded dataset does not contain sufficient information."

        # Check for placeholder concepts
        placeholder_terms = [
            "enterprise cloud", "ai analytics suite", "security governance", 
            "multi-cloud egress", "$14.25m", "apac field team", 
            "gpu accelerator", "safety stock buffer", "bangalore office", "hyderabad Rep"
        ]
        
        # Verify if placeholder terms are in the response
        found_placeholder = False
        for term in placeholder_terms:
            if term in text_lower:
                # Disqualify unless it specifically appears in the dataset name or values
                # (which is extremely unlikely unless the user uploaded that specific file)
                filename = analysis_obj.get("filename", "").lower()
                if term not in filename:
                    found_placeholder = True
                    break

        if found_placeholder:
            logger.warning(f"Grounding validation failed: Detected mock placeholder in output: '{term}'")
            return "This conclusion cannot be generated because the uploaded dataset does not contain sufficient information."

        return content_text
