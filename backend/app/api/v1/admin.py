from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import (
    User, AuditLog, UserRole, Dataset, Report, Notification,
    AIUsageLog, DecisionScenario, BusinessGoal, BusinessAlert, DecisionHistory
)
from app.schemas.schemas import UserResponse, AuditLogResponse, AdminStatsResponse
from app.api.deps import get_current_user, require_roles
from app.services.admin_service import AdminService

router = APIRouter()

@router.get("/metrics", response_model=AdminStatsResponse)
def get_admin_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Admin"]))
):
    return AdminService.get_system_metrics(db)

@router.get("/users", response_model=List[UserResponse])
def get_all_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Admin"]))
):
    users = db.query(User).order_by(User.created_at.desc()).all()
    return users

@router.put("/users/{user_id}/role")
def update_user_role(
    user_id: int,
    role: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Admin"]))
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    valid_roles = [r.value for r in UserRole]
    if role not in valid_roles:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid role '{role}'. Allowed values are: {valid_roles}"
        )
        
    user.role = role

    db.commit()
    AdminService.log_action(db, current_user.id, "UPDATE_USER_ROLE", f"User #{user_id}", f"Role changed to {role}")
    return {"message": f"User role updated to {role}"}

@router.get("/audit-logs", response_model=List[AuditLogResponse])
def get_audit_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Admin"]))
):
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(100).all()
    if not logs:
        # Seed initial log
        AdminService.log_action(db, current_user.id, "SYSTEM_INIT", "AdminConsole", "Initialized admin governance logs")
        logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).all()
    return logs

@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Admin"]))
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if current_user.id == user_id:
        raise HTTPException(status_code=403, detail="Cannot delete current admin")

    if user.role == "Super Admin" or "superadmin" in user.email.lower():
        raise HTTPException(status_code=403, detail="Cannot delete Super Admin")

    try:
        db.query(AuditLog).filter(AuditLog.user_id == user_id).update({AuditLog.user_id: None})
        db.query(Report).filter(Report.user_id == user_id).delete()
        db.query(Notification).filter(Notification.user_id == user_id).delete()
        db.query(AIUsageLog).filter(AIUsageLog.user_id == user_id).delete()

        datasets = db.query(Dataset).filter(Dataset.owner_id == user_id).all()
        for dataset in datasets:
            db.delete(dataset)

        db.delete(user)
        db.commit()

        AdminService.log_action(
            db,
            current_user.id,
            "DELETE_USER",
            f"User #{user_id}",
            f"Deleted user: {user.full_name} ({user.email})"
        )

        return {
            "success": True,
            "message": "User deleted successfully."
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete user: {str(e)}")
