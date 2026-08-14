from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.session import get_db
from app.db.models import User
from app.api.deps import get_current_user
from app.services.consultant_service import BusinessConsultantService

router = APIRouter()

class ExplainRequest(BaseModel):
    dataset_id: int
    section_id: str
    report: Dict[str, Any]

class AskRequest(BaseModel):
    dataset_id: int
    question: str
    report: Dict[str, Any]
    chat_history: Optional[List[Dict[str, str]]] = []

@router.get("/report/{dataset_id}")
def get_consultant_report(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        report = BusinessConsultantService.get_or_generate_report(db, dataset_id, force_refresh=False)
        return report
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load consultant report: {str(e)}"
        )

@router.post("/analyze/{dataset_id}")
def analyze_dataset_consultant(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        report = BusinessConsultantService.get_or_generate_report(db, dataset_id, force_refresh=True)
        return report
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate consultant report: {str(e)}"
        )

@router.post("/explain")
def explain_report_section(
    payload: ExplainRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        explanation = BusinessConsultantService.explain_section(
            db, payload.dataset_id, payload.section_id, payload.report
        )
        return explanation
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate section explanation: {str(e)}"
        )

@router.post("/ask")
def ask_consultant_question(
    payload: AskRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        answer = BusinessConsultantService.ask_follow_up(
            db, payload.dataset_id, payload.question, payload.report, payload.chat_history or []
        )
        return {"answer": answer}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate consultant answer: {str(e)}"
        )

from jose import JWTError, jwt
from app.core.config import settings

@router.get("/report/{dataset_id}/download")
def download_consultant_pdf(
    dataset_id: int,
    token: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    try:
        # Authenticate via query param token or default dependency
        user = current_user
        if token:
            try:
                payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
                user_id_str = payload.get("sub")
                if user_id_str:
                    user = db.query(User).filter(User.id == int(user_id_str)).first()
            except Exception:
                pass
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials for report download."
            )

        file_path = BusinessConsultantService.generate_consultant_pdf(db, dataset_id)
        if not os.path.exists(file_path):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Consultant report PDF file could not be generated."
            )
        return FileResponse(
            file_path,
            media_type="application/pdf",
            filename=f"AI_Business_Consultation_{dataset_id}.pdf"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to stream report PDF: {str(e)}"
        )

import os
