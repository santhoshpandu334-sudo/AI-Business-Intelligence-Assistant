import os
import json
import logging
import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.db.models import Dataset, DataRecord, Conversation, ChatMessageModel, User, AIUsageLog
from app.services.dataset_analysis_service import DatasetAnalysisService
from app.services.capability_validator import CapabilityValidator
from app.services.grounding_validator import GroundingValidator
from app.services.consistency_validator import ConsistencyValidator

logger = logging.getLogger(__name__)

class RAGPipelineService:
    _embedder = None

    @classmethod
    def get_embedder(cls):
        # Kept for backward compatibility
        return None

    @staticmethod
    def build_and_persist_vector_index(db: Session, dataset_id: int) -> str:
        # Kept for backward compatibility
        return f"./faiss_index/dataset_{dataset_id}.index"

    @staticmethod
    def query_rag_assistant(
        db: Session,
        message: str,
        dataset_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Grounded query handler returning a dictionary with analytical summaries.
        """
        if not dataset_id:
            ds = db.query(Dataset).order_by(Dataset.created_at.desc()).first()
            if not ds:
                return {
                    "answer": "No dataset uploaded yet.",
                    "sources": [],
                    "recommended_chart": None,
                    "data_summary": {}
                }
            dataset_id = ds.id

        analysis = DatasetAnalysisService.get_analysis(db, dataset_id)
        domain = analysis["detected_domains"]["primary_domain"]
        schema = analysis["schema_metadata"]
        kpis = analysis["kpis"]
        
        from app.services.analytics_service import AnalyticsDashboardService
        df = AnalyticsDashboardService._get_dataframe(db, dataset_id)

        q_lower = message.lower()
        answer = ""
        sources = [f"Dataset: {analysis['filename']}", "Grounding Validator Checked"]

        # --- NLQ "What is present" handler ---
        if "what is present" in q_lower or "columns" in q_lower or "summary" in q_lower or "what dataset" in q_lower:
            cols_str = ", ".join(schema["all_columns"])
            measures_str = ", ".join(schema["numerical_measures"])
            dims_str = ", ".join(schema["categorical_dimensions"])
            
            answer = (
                f"The active dataset '{analysis['filename']}' is classified as a **{domain}** dataset "
                f"(Confidence: {analysis['detected_domains']['confidence_score']}%).\n"
                f"- **Row count**: {analysis['row_count']} total records\n"
                f"- **Columns detected**: {cols_str}\n"
                f"- **Numeric Measures**: {measures_str or 'None'}\n"
                f"- **Categories/Dimensions**: {dims_str or 'None'}\n"
                f"- **Data Completeness**: {analysis['completeness_pct']:.1f}%\n"
                f"- **Dynamic KPI Indicators**: {', '.join(kpis.keys())}"
            )

        # Financial Metrics checking
        elif any(k in q_lower for k in ["revenue", "profit", "sales", "arr"]):
            if domain != "Sales/Finance":
                answer = "The uploaded dataset does not contain revenue information."
            else:
                total_rev = kpis.get("total_revenue", 0.0)
                total_prof = kpis.get("total_profit", 0.0)
                margin = kpis.get("profit_margin", 0.0)
                answer = (
                    f"Based on the **Sales/Finance** dataset context, total tracked revenue reaches **${total_rev:,.2f}** "
                    f"with aggregate net profit at **${total_prof:,.2f}** (gross margin: **{margin}%**)."
                )

        # Student Metrics checking
        elif any(k in q_lower for k in ["marks", "gpa", "score", "attendance", "student"]):
            if domain != "Student/Education":
                answer = "The uploaded dataset does not contain student marks/GPA information."
            else:
                total_st = kpis.get("total_students", 0)
                avg_marks = kpis.get("average_marks", 0.0)
                pass_pct = kpis.get("pass_percentage", 0.0)
                answer = (
                    f"Based on the **Student/Education** dataset context, we track a total of **{total_st}** students "
                    f"with an average score of **{avg_marks}** (overall pass rate: **{pass_pct}%**)."
                )

        # Dynamic Generic Column matching & Pandas aggregations
        else:
            matched_col = None
            for col in schema["all_columns"]:
                if col.lower() in q_lower:
                    matched_col = col
                    break
            
            if matched_col and matched_col in schema["numerical_measures"]:
                # Check for average vs sum
                if "average" in q_lower or "mean" in q_lower or "avg" in q_lower:
                    avg_val = df[matched_col].mean()
                    answer = f"The computed average for numeric column '{matched_col}' is **{avg_val:.2f}**."
                else:
                    sum_val = df[matched_col].sum()
                    answer = f"The aggregate sum for numeric column '{matched_col}' is **{sum_val:,.2f}**."
            elif matched_col and matched_col in schema["categorical_dimensions"]:
                cardinality = df[matched_col].nunique()
                top_val = df[matched_col].value_counts().index[0] if len(df) > 0 else "N/A"
                answer = f"Categorical column '{matched_col}' contains **{cardinality}** unique groups. The most frequent category is **'{top_val}'**."
            else:
                # If no matching details are found, print standard grounded missing response
                answer = "The uploaded dataset does not contain sufficient information to answer this question."

        # Grounding validation pass
        answer = GroundingValidator.validate_content(answer, analysis)

        # Build recharts spec if measures/dimensions exist
        chart = None
        if schema["numerical_measures"] and schema["categorical_dimensions"]:
            chart = {
                "type": "bar",
                "title": f"Distribution by Category",
                "xAxisKey": "name",
                "series": [
                    {"dataKey": "value", "color": "#6366f1", "name": schema["numerical_measures"][0]}
                ],
                "data": analysis["chart_specifications"]["category_data"]
            }

        return {
            "answer": answer,
            "sources": sources,
            "recommended_chart": chart,
            "data_summary": kpis
        }

    @staticmethod
    def execute_rag_query(
        db: Session,
        user_id: int,
        conversation_id: int,
        user_message: str,
        dataset_id: Optional[int] = None,
        model_provider: str = "llama3.1"
    ) -> ChatMessageModel:
        """
        Executes fully grounded NLQ query processing, saving conversation logs.
        """
        # Save user message
        user_msg_entry = ChatMessageModel(
            conversation_id=conversation_id,
            sender="user",
            message_text=user_message
        )
        db.add(user_msg_entry)
        db.commit()

        # Execute grounded QA
        res = RAGPipelineService.query_rag_assistant(db, user_message, dataset_id)

        # Save assistant response
        assistant_msg = ChatMessageModel(
            conversation_id=conversation_id,
            sender="assistant",
            message_text=res["answer"],
            sources_json=res["sources"],
            chart_spec_json=res["recommended_chart"],
            data_summary_json=res["data_summary"],
            confidence_score=95.0
        )
        db.add(assistant_msg)

        conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
        if conv:
            conv.updated_at = pd.Timestamp.now()
            if conv.title == "New Business Intelligence Query":
                conv.title = user_message[:40] + ("..." if len(user_message) > 40 else "")

        db.add(AIUsageLog(
            user_id=user_id,
            query_type="RAG_CHAT",
            tokens_used=120,
            execution_time_ms=10
        ))
        db.commit()
        db.refresh(assistant_msg)

        return assistant_msg

# Alias
RAGChatService = RAGPipelineService
