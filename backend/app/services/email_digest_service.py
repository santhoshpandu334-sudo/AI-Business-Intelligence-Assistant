import os
import logging
import numpy as np
from datetime import datetime
from sqlalchemy.orm import Session

from app.db.models import User, Dataset
from app.services.dataset_analysis_service import DatasetAnalysisService
from app.services.email_service import EmailService

logger = logging.getLogger(__name__)

class EmailDigestService:
    @classmethod
    def generate_and_send_digest(cls, db: Session, user_id: int, dataset_id: int = None) -> bool:
        """
        Gathers the user's active dataset analysis and sends/previews the executive digest.
        """
        user = db.query(User).filter(User.id == user_id).first()
        if not user or not user.email:
            logger.warning(f"User #{user_id} not found or lacks a registered email address.")
            return False

        if not user.email_digest_enabled:
            logger.warning(f"Email digest is currently disabled for user #{user_id}.")
            return False

        if dataset_id is not None:
            # Query the specific dataset owned by the user
            dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.owner_id == user_id).first()
            if not dataset:
                logger.warning(f"Dataset #{dataset_id} not found or not owned by user #{user_id}. Skipping email digest generation.")
                return False
        else:
            # Fall back to latest active dataset owned by this user
            dataset = db.query(Dataset).filter(Dataset.owner_id == user_id).order_by(Dataset.created_at.desc()).first()
            if not dataset:
                logger.warning(f"No active dataset found for user #{user_id}. Skipping email digest generation.")
                return False

        try:
            analysis = DatasetAnalysisService.get_analysis(db, dataset.id)
        except Exception as e:
            logger.error(f"Failed to generate analysis for dataset #{dataset.id} during digest generation: {e}")
            return False

        # Build dynamic HTML and plain text payloads
        html_content, text_content = cls.build_digest_content(user.full_name, dataset.name, analysis)

        # Dispatch via EmailService
        success = EmailService.send_email(
            to_email=user.email,
            subject=f"Executive AI Performance Digest: {dataset.name}",
            html_content=html_content,
            text_content=text_content
        )

        if success:
            user.last_digest_sent_at = datetime.utcnow()
            db.commit()
            logger.info(f"Successfully recorded weekly digest dispatch timestamp for user #{user_id}")

        return success

    @classmethod
    def build_digest_content(cls, user_name: str, dataset_name: str, analysis: dict) -> tuple[str, str]:
        """
        Compiles the HTML and plain-text body of the email based exclusively on canonical DatasetAnalysisObject metrics.
        """
        domain = analysis.get("detected_domains", {}).get("primary_domain", "Generic Dataset")
        health = analysis.get("completeness_pct", 100.0)
        kpis = analysis.get("kpis", {})
        recommendations = analysis.get("recommendations", [])
        anomalies = analysis.get("anomaly_summaries", [])
        
        # Build dynamic KPI rows
        kpi_rows = ""
        text_kpis = ""
        for key, val in kpis.items():
            if val == "Not Available" or val is None:
                continue
            name = key.replace("_", " ").title()
            if name == "Dataset Health Score":
                name = "Dataset Health"
                
            # Formatting helper to detect monetary KPIs
            is_monetary = any(k in key.lower() for k in ["revenue", "profit", "salary", "sales", "cost", "charge"])
            
            if isinstance(val, (int, float, np.integer, np.floating)):
                formatted_val = f"${val:,.2f}" if is_monetary else f"{val:,}"
            else:
                formatted_val = str(val)

            kpi_rows += f"""
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #4a5568;">{name}</td>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #1a202c; text-align: right;">{formatted_val}</td>
            </tr>
            """
            text_kpis += f"- {name}: {formatted_val}\n"

        # Build dynamic anomalies section
        anom_html = ""
        text_anom = ""
        if anomalies:
            for idx, anom in enumerate(anomalies[:3]):
                measure_name = anom.get("measure", "Value").replace("_", " ").title()
                val = anom.get("value", 0)
                formatted_val = f"${val:,.2f}" if isinstance(val, (int, float, np.integer, np.floating)) and any(k in str(anom.get('measure')).lower() for k in ["revenue", "profit", "salary"]) else str(val)
                deviation = anom.get("deviation_pct", 0.0)
                row_idx = anom.get("row_index", 0)
                
                anom_html += f"""
                <div style="background-color: #fffaf0; border-left: 4px solid #dd6b20; padding: 12px; margin-bottom: 8px; border-radius: 6px;">
                    <strong style="color: #dd6b20; font-size: 13px;">Statistical Outlier: {measure_name} Spike</strong><br/>
                    <span style="color: #4a5568; font-size: 12px;">Recorded value of {formatted_val} at row index {row_idx} (deviates by {deviation:+.1f}% from mean).</span>
                </div>
                """
                text_anom += f"- Spike in {measure_name}: value {formatted_val} at index {row_idx} (deviation: {deviation:+.1f}%)\n"
        else:
            anom_html = "<p style='color: #718096; font-size: 12px; margin: 0;'>Stable variance limits verified. No statistical anomalies detected.</p>"
            text_anom = "No anomalies detected.\n"

        # Build dynamic recommendations section
        recs_html = ""
        text_recs = ""
        if recommendations:
            for rec in recommendations[:3]:
                title = rec.get("title", "Optimization Insight")
                impact = rec.get("impact", "")
                priority = rec.get("priority", "Medium")
                
                # Dynamic priority tags
                p_color = "#3182ce" if priority == "Medium" else ("#e53e3e" if priority == "High" else "#319795")
                recs_html += f"""
                <li style="margin-bottom: 12px; font-size: 13px; color: #4a5568;">
                    <strong style="color: #2d3748;">{title}</strong> 
                    <span style="background-color: {p_color}22; color: {p_color}; font-size: 9px; font-weight: bold; padding: 2px 6px; border-radius: 4px; margin-left: 6px; text-transform: uppercase;">{priority}</span><br/>
                    <span style="color: #718096; font-size: 12px; display: inline-block; margin-top: 2px;">{impact}</span>
                </li>
                """
                text_recs += f"- [{priority}] {title}: {impact}\n"
        else:
            recs_html = "<p style='color: #718096; font-size: 12px; margin: 0;'>No recommendations available.</p>"
            text_recs = "No recommendations.\n"

        # Build dynamic HTML body
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Executive AI Performance Digest</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7fafc; padding: 20px; margin: 0;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
                <!-- Header Banner -->
                <div style="background-color: #4f46e5; padding: 28px; text-align: center; color: #ffffff;">
                    <span style="text-transform: uppercase; font-size: 10px; letter-spacing: 1.5px; font-weight: bold; background-color: rgba(255,255,255,0.2); padding: 4px 10px; border-radius: 20px;">AI Executive Digest</span>
                    <h1 style="margin: 12px 0 0 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">{dataset_name}</h1>
                    <p style="margin: 4px 0 0 0; font-size: 12px; color: #c7d2fe;">Ingested Domain: {domain} | Data Quality Health: {health}%</p>
                </div>
                
                <div style="padding: 24px;">
                    <p style="margin: 0 0 20px 0; color: #4a5568; font-size: 13px; line-height: 1.5;">
                        Hello {user_name},<br/><br/>
                        Here is the compiled performance summary for the active dataset, grounded dynamically by the analytical engine.
                    </p>
                    
                    <!-- KPI Table -->
                    <div style="margin-bottom: 24px;">
                        <h2 style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: #4f46e5; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 12px; font-weight: bold;">Key Performance Indicators</h2>
                        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                            {kpi_rows}
                        </table>
                    </div>

                    <!-- Alerts / Anomalies -->
                    <div style="margin-bottom: 24px;">
                        <h2 style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: #e53e3e; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 12px; font-weight: bold;">Active Alerts & Outliers</h2>
                        {anom_html}
                    </div>

                    <!-- Recommendations -->
                    <div style="margin-bottom: 24px;">
                        <h2 style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: #319795; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 12px; font-weight: bold;">AI Core Recommendations</h2>
                        <ul style="padding-left: 20px; margin: 0; font-size: 13px; line-height: 1.5;">
                            {recs_html}
                        </ul>
                    </div>
                    
                    <!-- Footer Notice -->
                    <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 24px; text-align: center; font-size: 11px; color: #a0aec0; line-height: 1.4;">
                        This digest was generated dynamically from your active dataset workspace.<br/>
                        To configure or disable these email reports, visit System & Workspace Settings in the application.
                    </div>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Build plain text fallback
        text = f"""
EXECUTIVE AI PERFORMANCE DIGEST
Dataset: {dataset_name}
Domain: {domain}
Completeness/Health: {health}%

----------------------------------------
KEY PERFORMANCE INDICATORS
{text_kpis}

----------------------------------------
ACTIVE ALERTS & OUTLIERS
{text_anom}

----------------------------------------
AI RECOMMENDATIONS
{text_recs}

----------------------------------------
Configure weekly notifications in System & Workspace Settings.
"""
        return html, text
