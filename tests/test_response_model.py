#!/usr/bin/env python3
"""Test response model serialization with ORM object"""
import sys
sys.path.insert(0, 'd:\\AI Business Intelligence Assistant\\backend')

from app.db.session import SessionLocal, engine, Base
from app.db.models import User
from app.schemas.schemas import UserResponse
from app.core.security import get_password_hash

# Initialize tables
Base.metadata.create_all(bind=engine)

# Get a database session
session = SessionLocal()

# Clear existing test user to prevent duplicate keys
session.query(User).filter(User.email == 'response_test@example.com').delete()
session.commit()

# Create a new user in the database
try:
    user = User(
        email='response_test@example.com',
        hashed_password=get_password_hash('TestPass123!'),
        full_name='Response Test User',
        company_name='Test Company',
        role='Analyst'
    )
    session.add(user)
    session.commit()
    session.refresh(user)

    
    print(f"[OK] User created in database: ID={user.id}, Email={user.email}")
    
    # Now try to convert to UserResponse
    print("\nTesting UserResponse schema conversion...")
    
    # Method 1: Direct from ORM object (using from_attributes=True)
    try:
        response = UserResponse.from_orm(user)
        print(f"[FAIL] from_orm method doesn't exist in Pydantic v2")
    except AttributeError:
        try:
            response = UserResponse.model_validate(user)
            print(f"[OK] model_validate works!")
            print(f"   Email: {response.email}")
        except Exception as e:
            print(f"[FAIL] model_validate failed: {type(e).__name__}: {str(e)[:100]}")
    
    # Method 2: Convert to dict
    try:
        user_dict = {
            'id': user.id,
            'email': user.email,
            'full_name': user.full_name,
            'company_name': user.company_name,
            'role': user.role,
            'avatar_url': user.avatar_url,
            'is_active': user.is_active,
            'is_verified': user.is_verified,
            'created_at': user.created_at
        }
        response = UserResponse(**user_dict)
        print(f"[OK] Dict conversion works!")
        print(f"   Email: {response.email}")
        print(f"   Response JSON: {response.model_dump_json()[:200]}")
    except Exception as e:
        print(f"[FAIL] Dict conversion failed: {type(e).__name__}: {str(e)[:100]}")

        import traceback
        traceback.print_exc()

finally:
    session.close()
