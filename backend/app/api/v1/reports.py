import os
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session


from app.db.session import get_db
from app.db.models import User, Report
from app.schemas.schemas import ReportRequest, ReportResponse
from app.api.deps import get_current_user
from app.services.report_service import MultiFormatReportService

router = APIRouter()

@router.post("/generate", response_model=ReportResponse)
def generate_report(
    req: ReportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    report = MultiFormatReportService.generate_report(
        db=db,
        user_id=current_user.id,
        title=req.title,
        format_type=req.format,
        dataset_id=req.dataset_id
    )
    return report

@router.get("/", response_model=List[ReportResponse])
def list_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    reports = db.query(Report).filter(Report.user_id == current_user.id).order_by(Report.created_at.desc()).all()
    if not reports:
        # Seed initial sample executive report
        rep = MultiFormatReportService.generate_report(
            db=db,
            user_id=current_user.id,
            title="Q3 Executive Board Report",
            format_type="pdf"
        )
        reports = [rep]
    return reports

@router.get("/{report_id}/download")
def download_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    if report.user_id != current_user.id and current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Access denied. You do not own this report.")
    if not report.file_path or not os.path.exists(report.file_path):
        raise HTTPException(status_code=404, detail="Report file not found on disk")

    
    media_type = "application/pdf" if report.format == "pdf" else ("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" if report.format == "excel" else "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
    return FileResponse(path=report.file_path, filename=f"{report.title}.{report.format}", media_type=media_type)
