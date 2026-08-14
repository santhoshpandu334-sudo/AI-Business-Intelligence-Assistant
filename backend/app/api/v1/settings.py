from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
from datetime import timezone

from app.db.session import get_db
from app.db.models import User, Dataset
from app.api.deps import get_current_user
from app.schemas.schemas import EmailDigestPreferenceResponse, EmailDigestPreferenceUpdate
from app.services.email_digest_service import EmailDigestService

router = APIRouter()

@router.get("/email-digest", response_model=EmailDigestPreferenceResponse)
def get_email_digest_preference(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves the current email digest preference and email status for the authenticated user.
    """
    last_sent = current_user.last_digest_sent_at
    if last_sent and last_sent.tzinfo is None:
        last_sent = last_sent.replace(tzinfo=timezone.utc)
        
    return EmailDigestPreferenceResponse(
        email_digest_enabled=bool(current_user.email_digest_enabled),
        user_email=current_user.email,
        last_digest_sent=last_sent
    )

@router.put("/email-digest", response_model=EmailDigestPreferenceResponse)
def update_email_digest_preference(
    pref: EmailDigestPreferenceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Updates the email digest preference for the authenticated user.
    """
    user_db = db.query(User).filter(User.id == current_user.id).first()
    if not user_db:
        raise HTTPException(status_code=404, detail="User not found")
        
    user_db.email_digest_enabled = pref.email_digest_enabled
    db.commit()
    db.refresh(user_db)
    
    last_sent = user_db.last_digest_sent_at
    if last_sent and last_sent.tzinfo is None:
        last_sent = last_sent.replace(tzinfo=timezone.utc)
        
    return EmailDigestPreferenceResponse(
        email_digest_enabled=bool(user_db.email_digest_enabled),
        user_email=user_db.email,
        last_digest_sent=last_sent
    )

@router.post("/email-digest/test")
def trigger_email_digest_test(
    dataset_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Triggers an immediate generation and delivery of the email digest for the authenticated user.
    If EMAIL_DEV_MODE=true, it generates a local preview HTML file.
    """
    if dataset_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="dataset_id query parameter is required. Please select an active dataset."
        )

    # Verify dataset exists and belongs to the authenticated user/company scope
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.owner_id == current_user.id).first()
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found or access denied."
        )

    user_db = db.query(User).filter(User.id == current_user.id).first()
    if not user_db:
        raise HTTPException(status_code=404, detail="User not found")
        
    original_setting = bool(user_db.email_digest_enabled)
    # Ensure it's marked as enabled temporarily for generation validation checks
    user_db.email_digest_enabled = True
    db.commit()
    
    try:
        success = EmailDigestService.generate_and_send_digest(db, current_user.id, dataset_id=dataset_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to generate digest. Ensure you have uploaded at least one dataset and analysis completed successfully."
            )
        return {"message": "Test email digest generated successfully."}
    finally:
        # Revert back to original preference
        user_db.email_digest_enabled = original_setting
        db.commit()
        db.refresh(user_db)
