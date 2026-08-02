from datetime import timedelta
import sys
import traceback
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import User, UserRole
from app.core.security import get_password_hash, verify_password, create_access_token, create_refresh_token, decode_token
from app.schemas.schemas import UserCreate, UserLogin, UserResponse, Token, ForgotPasswordRequest, ResetPasswordRequest, RefreshTokenRequest
from app.api.deps import get_current_user

router = APIRouter()

@router.post("/health-check")
def health_check():
    """Simple health check endpoint with no dependencies"""
    return {"status": "ok", "message": "Auth router is working"}

@router.post("/register", response_model=UserResponse)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """Registration endpoint with full exception logging"""
    try:
        print("\n" + "="*70, file=sys.stderr)
        print("[REGISTER] ✅ Endpoint called", file=sys.stderr)
        print(f"[REGISTER] Email: {user_in.email}", file=sys.stderr)
        print(f"[REGISTER] Full Name: {user_in.full_name}", file=sys.stderr)
        
        # Step 1: Check for existing email
        print("[REGISTER] Step 1: Checking for existing email", file=sys.stderr)
        existing = db.query(User).filter(User.email == user_in.email).first()
        if existing:
            print(f"[REGISTER] ✓ Email exists, raising 400", file=sys.stderr)
            raise HTTPException(status_code=400, detail="Email is already registered.")
        print("[REGISTER] ✓ Email is unique", file=sys.stderr)
        
        # Step 2: Hash password
        print("[REGISTER] Step 2: Hashing password", file=sys.stderr)
        hashed_password = get_password_hash(user_in.password)
        print("[REGISTER] ✓ Password hashed successfully", file=sys.stderr)
        
        # Step 3: Create user object
        print("[REGISTER] Step 3: Creating User object", file=sys.stderr)
        user = User(
            email=user_in.email,
            hashed_password=hashed_password,
            full_name=user_in.full_name,
            company_name=user_in.company_name or "Acme Corp",
            role=user_in.role or UserRole.ANALYST.value,
            avatar_url=f"https://ui-avatars.com/api/?name={user_in.full_name.replace(' ', '+')}&background=6366f1&color=fff"
        )
        print(f"[REGISTER] ✓ User object created (email={user.email})", file=sys.stderr)
        
        # Step 4: Add to database
        print("[REGISTER] Step 4: Adding user to database session", file=sys.stderr)
        db.add(user)
        print("[REGISTER] ✓ User added to session", file=sys.stderr)
        
        # Step 5: Commit
        print("[REGISTER] Step 5: Committing database transaction", file=sys.stderr)
        db.commit()
        print("[REGISTER] ✓ Committed successfully", file=sys.stderr)
        
        # Step 6: Refresh to get ID
        print("[REGISTER] Step 6: Refreshing user object", file=sys.stderr)
        db.refresh(user)
        print(f"[REGISTER] ✓ Refreshed (ID={user.id})", file=sys.stderr)
        
        # Step 7: Return User ORM object
        print("[REGISTER] Step 7: Returning User ORM object", file=sys.stderr)
        print("="*70 + "\n", file=sys.stderr)
        
        return user
        
    except HTTPException as he:
        print(f"[REGISTER] HTTPException: {he.status_code} - {he.detail}", file=sys.stderr)
        raise
    except Exception as e:
        print(f"[REGISTER] ❌ EXCEPTION: {type(e).__name__}", file=sys.stderr)
        print(f"[REGISTER] Message: {str(e)}", file=sys.stderr)
        print("[REGISTER] Full traceback:", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        print("="*70 + "\n", file=sys.stderr)
        
        # Rollback on error
        try:
            db.rollback()
        except:
            pass
        
        # Return detailed error response
        raise HTTPException(
            status_code=500, 
            detail=f"Registration failed: {type(e).__name__}: {str(e)[:200]}"
        )



@router.post("/login", response_model=Token)
def login(login_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_in.email).first()
    if not user or not verify_password(login_in.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/refresh", response_model=Token)
def refresh_token(request: RefreshTokenRequest, db: Session = Depends(get_db)):
    payload = decode_token(request.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token.")
    
    user_id = int(payload.get("sub"))
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found.")

    new_access = create_access_token(user.id)
    new_refresh = create_refresh_token(user.id)
    return {
        "access_token": new_access,
        "refresh_token": new_refresh,
        "token_type": "bearer",
        "user": user
    }

@router.post("/forgot-password")
def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        # Don't leak user existence
        return {"message": "If your email is registered, a password reset link has been dispatched."}
    
    # Return reset architecture token
    reset_token = create_access_token(user.id, expires_delta=timedelta(minutes=15))
    return {
        "message": "Password reset token generated successfully.",
        "reset_token": reset_token
    }

@router.post("/reset-password")
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    payload = decode_token(request.token)
    if not payload:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token.")
    
    user_id = int(payload.get("sub"))
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    user.hashed_password = get_password_hash(request.new_password)
    db.commit()
    return {"message": "Password has been updated successfully."}

@router.post("/google", response_model=Token)
def google_oauth_login(db: Session = Depends(get_db)):

    """Mock Google OAuth SSO callback logic for instant Enterprise SSO login"""
    user = db.query(User).filter(User.email == "enterprise.admin@acme.com").first()
    if not user:
        user = User(
            email="enterprise.admin@acme.com",
            hashed_password=get_password_hash("AdminPass2026!"),
            full_name="Alex Mercer (Admin)",
            company_name="Acme Enterprise",
            role=UserRole.ADMIN.value,
            avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
