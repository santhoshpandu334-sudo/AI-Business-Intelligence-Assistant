import os
import glob
import pytest
from fastapi.testclient import TestClient
from main import app
from app.db.session import SessionLocal
from app.db.models import User, Dataset

# Clear test users at database level to ensure clean state and correct password hashes
_db = SessionLocal()
try:
    for _email in ["user_digest_a@example.com", "user_digest_b@example.com", "student_tester@example.com"]:
        _user = _db.query(User).filter(User.email == _email).first()
        if _user:
            _db.delete(_user)
    _db.commit()
finally:
    _db.close()

client = TestClient(app)

def get_auth_headers(email, password, full_name="Test User"):
    # Attempt login first
    login_data = {"email": email, "password": password}
    response = client.post("/api/v1/auth/login", json=login_data)
    if response.status_code != 200:
        # Register new
        reg_data = {"email": email, "password": password, "full_name": full_name}
        client.post("/api/v1/auth/register", json=reg_data)
        response = client.post("/api/v1/auth/login", json=login_data)
    
    assert response.status_code == 200
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_email_preferences_lifecycle():
    headers_a = get_auth_headers("user_digest_a@example.com", "SecurePass123!", "User Digest A")
    
    # 1. Verify GET default preferences
    res = client.get("/api/v1/settings/email-digest", headers=headers_a)
    assert res.status_code == 200
    data = res.json()
    assert data["email_digest_enabled"] is False
    assert data["user_email"] == "user_digest_a@example.com"
    
    # 2. Verify PUT updates preference to True
    res = client.put("/api/v1/settings/email-digest", json={"email_digest_enabled": True}, headers=headers_a)
    assert res.status_code == 200
    data = res.json()
    assert data["email_digest_enabled"] is True
    
    # 3. Verify settings persist after GET refresh
    res = client.get("/api/v1/settings/email-digest", headers=headers_a)
    assert res.status_code == 200
    assert res.json()["email_digest_enabled"] is True

    # 4. Verify PUT updates preference to False
    res = client.put("/api/v1/settings/email-digest", json={"email_digest_enabled": False}, headers=headers_a)
    assert res.status_code == 200
    assert res.json()["email_digest_enabled"] is False

def test_user_settings_isolation():
    headers_a = get_auth_headers("user_digest_a@example.com", "SecurePass123!")
    headers_b = get_auth_headers("user_digest_b@example.com", "SecurePass123!")
    
    # Fetch user A preferences, verify they don't leak or modify user B preferences
    res_a = client.get("/api/v1/settings/email-digest", headers=headers_a)
    res_b = client.get("/api/v1/settings/email-digest", headers=headers_b)
    assert res_a.status_code == 200
    assert res_b.status_code == 200
    assert res_a.json()["user_email"] == "user_digest_a@example.com"
    assert res_b.json()["user_email"] == "user_digest_b@example.com"

def test_digest_manual_trigger_and_preview():
    # Login as seed admin who already has dataset #1 registered
    headers_admin = get_auth_headers("enterprise.admin@acme.com", "AdminPass2026!", "Alex Mercer (Admin)")
    
    # Clear old previews in backend/email_previews/ if any
    preview_pattern = os.path.join(os.path.dirname(__file__), "email_previews", "*.html")
    for f in glob.glob(preview_pattern):
        try:
            os.remove(f)
        except Exception:
            pass

    # Trigger test digest with dataset_id=1 (Sales dataset)
    res = client.post("/api/v1/settings/email-digest/test?dataset_id=1", headers=headers_admin)
    assert res.status_code == 200
    assert "Test email digest generated successfully" in res.json()["message"]

    # Verify a preview file was generated
    previews = glob.glob(preview_pattern)
    assert len(previews) >= 1, "Expected at least one preview HTML file to be generated."
    
    # Verify the contents of the generated HTML digest
    preview_file = previews[0]
    with open(preview_file, "r", encoding="utf-8") as f:
        content = f.read()
        assert "enterprise.admin@acme.com" in content
        assert "Acme Enterprise" in content or "Alex Mercer (Admin)" in content
        # Confirm that since it's dataset 1, it contains sales-like words and not student GPA metrics
        assert "Revenue" in content or "Sales" in content
        assert "GPA" not in content
        assert "Total Students" not in content

def test_student_dataset_digest_grounding():
    # Verify that if a dataset is student performance, it uses student metrics only and lacks sales KPIs
    # Register student test user and associate dataset #21 (Student_data_50_records.xlsx)
    db = SessionLocal()
    try:
        from app.core.security import get_password_hash
        user = db.query(User).filter(User.email == "student_tester@example.com").first()
        if not user:
            user = User(
                email="student_tester@example.com",
                hashed_password=get_password_hash("SecurePassword1!"),
                full_name="Student Tester",
                company_name="Education Board"
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        
        # Point dataset ID 21 to student_tester (or create a dataset entry if missing)
        ds = db.query(Dataset).filter(Dataset.id == 21).first()
        if ds:
            # Drop old dependent rows first to prevent foreign key errors
            from app.db.models import DatasetColumn, DataRecord
            db.query(DatasetColumn).filter(DatasetColumn.dataset_id == 21).delete()
            db.query(DataRecord).filter(DataRecord.dataset_id == 21).delete()
            db.delete(ds)
            db.commit()
            
        ds = Dataset(
            id=21,
            owner_id=user.id,
            name="Student_data_50_records.xlsx",
            file_type="xlsx",
            row_count=5,
            column_count=5,
            quality_score=100.0,
            status="processed"
        )
        db.add(ds)
        db.commit()

        # Add columns
        from app.db.models import DatasetColumn, DataRecord
        cols = [
            DatasetColumn(dataset_id=21, column_name="student_id", data_type="string"),
            DatasetColumn(dataset_id=21, column_name="name", data_type="string"),
            DatasetColumn(dataset_id=21, column_name="attendance", data_type="float"),
            DatasetColumn(dataset_id=21, column_name="gpa", data_type="float"),
            DatasetColumn(dataset_id=21, column_name="department", data_type="string")
        ]
        db.add_all(cols)
        db.commit()

        # Add 5 data records
        records_data = [
            {"student_id": "ST001", "name": "Aman", "attendance": 92.5, "gpa": 3.8, "department": "Computer Science"},
            {"student_id": "ST002", "name": "Bina", "attendance": 88.0, "gpa": 3.4, "department": "Information Tech"},
            {"student_id": "ST003", "name": "Chaman", "attendance": 95.0, "gpa": 3.9, "department": "Computer Science"},
            {"student_id": "ST004", "name": "Diva", "attendance": 78.2, "gpa": 2.8, "department": "Electronics"},
            {"student_id": "ST005", "name": "Esha", "attendance": 85.4, "gpa": 3.1, "department": "Information Tech"}
        ]
        for idx, row in enumerate(records_data):
            rec = DataRecord(dataset_id=21, row_index=idx, payload=row)
            db.add(rec)
        db.commit()
    finally:
        db.close()

    headers_student = get_auth_headers("student_tester@example.com", "SecurePassword1!", "Student Tester")
    
    # Delete old previews to isolate this check
    preview_pattern = os.path.join(os.path.dirname(__file__), "email_previews", "*.html")
    for f in glob.glob(preview_pattern):
        try:
            os.remove(f)
        except Exception:
            pass

    # Trigger test digest with dataset_id=21 (Student dataset)
    res = client.post("/api/v1/settings/email-digest/test?dataset_id=21", headers=headers_student)
    assert res.status_code == 200

    previews = glob.glob(preview_pattern)
    assert len(previews) >= 1
    
    with open(previews[0], "r", encoding="utf-8") as f:
        content = f.read()
        # Verify student-like metadata exists and sales-like metrics are NOT fabricated
        assert "Student" in content or "Education" in content
        assert "Total Students" in content
        assert "Average Gpa" in content or "Average Attendance" in content
        assert "Total Revenue" not in content or "Not Available" in content
        assert "Gross Profit" not in content or "Not Available" in content

def test_generic_dataset_digest_grounding():
    # Verify that a dataset with insufficient matching keywords defaults to Generic Dataset without domain KPIs
    db = SessionLocal()
    try:
        from app.core.security import get_password_hash
        user = db.query(User).filter(User.email == "generic_tester@example.com").first()
        if not user:
            user = User(
                email="generic_tester@example.com",
                hashed_password=get_password_hash("SecurePassword1!"),
                full_name="Generic Tester",
                company_name="Testing Org"
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        
        ds = db.query(Dataset).filter(Dataset.id == 22).first()
        if ds:
            from app.db.models import DatasetColumn, DataRecord
            db.query(DatasetColumn).filter(DatasetColumn.dataset_id == 22).delete()
            db.query(DataRecord).filter(DataRecord.dataset_id == 22).delete()
            db.delete(ds)
            db.commit()
            
        ds = Dataset(
            id=22,
            owner_id=user.id,
            name="Generic_data.csv",
            file_type="csv",
            row_count=5,
            column_count=3,
            quality_score=100.0,
            status="processed"
        )
        db.add(ds)
        db.commit()
        
        from app.db.models import DatasetColumn, DataRecord
        cols = [
            DatasetColumn(dataset_id=22, column_name="col_a", data_type="float"),
            DatasetColumn(dataset_id=22, column_name="col_b", data_type="string"),
            DatasetColumn(dataset_id=22, column_name="col_c", data_type="float")
        ]
        db.add_all(cols)
        db.commit()
        
        records_data = [
            {"col_a": 10.0, "col_b": "X", "col_c": 100.0},
            {"col_a": 20.0, "col_b": "Y", "col_c": 200.0},
            {"col_a": 30.0, "col_b": "Z", "col_c": 300.0},
            {"col_a": 40.0, "col_b": "W", "col_c": 400.0},
            {"col_a": 50.0, "col_b": "V", "col_c": 500.0}
        ]
        for idx, row in enumerate(records_data):
            rec = DataRecord(dataset_id=22, row_index=idx, payload=row)
            db.add(rec)
        db.commit()
    finally:
        db.close()

    headers_generic = get_auth_headers("generic_tester@example.com", "SecurePassword1!", "Generic Tester")
    
    # Delete old previews
    preview_pattern = os.path.join(os.path.dirname(__file__), "email_previews", "*.html")
    for f in glob.glob(preview_pattern):
        try:
            os.remove(f)
        except Exception:
            pass

    # Trigger test digest with dataset_id=22 (Generic dataset)
    res = client.post("/api/v1/settings/email-digest/test?dataset_id=22", headers=headers_generic)
    assert res.status_code == 200

    previews = glob.glob(preview_pattern)
    assert len(previews) >= 1
    
    with open(previews[0], "r", encoding="utf-8") as f:
        content = f.read()
        # Verify Generic status and absent domain elements
        assert "Generic Dataset" in content
        assert "Total Students" not in content
        assert "Total Revenue" not in content
        assert "Total Employees" not in content

def test_digest_trigger_missing_dataset_id():
    headers_admin = get_auth_headers("enterprise.admin@acme.com", "AdminPass2026!", "Alex Mercer (Admin)")
    # Expect 400 when dataset_id is missing
    res = client.post("/api/v1/settings/email-digest/test", headers=headers_admin)
    assert res.status_code == 400
    assert "dataset_id query parameter is required" in res.json()["detail"]

def test_digest_trigger_invalid_dataset_id():
    headers_admin = get_auth_headers("enterprise.admin@acme.com", "AdminPass2026!", "Alex Mercer (Admin)")
    # Expect 404 when dataset_id does not exist
    res = client.post("/api/v1/settings/email-digest/test?dataset_id=999999", headers=headers_admin)
    assert res.status_code == 404
    assert "Dataset not found or access denied" in res.json()["detail"]

def test_digest_trigger_unauthorized_dataset_id():
    # User B attempting to trigger digest using User A's dataset
    headers_b = get_auth_headers("user_digest_b@example.com", "SecurePass123!", "User Digest B")
    # Dataset 1 belongs to enterprise.admin
    res = client.post("/api/v1/settings/email-digest/test?dataset_id=1", headers=headers_b)
    assert res.status_code == 404
    assert "Dataset not found or access denied" in res.json()["detail"]

def test_digest_timestamp_timezone_offset():
    headers_admin = get_auth_headers("enterprise.admin@acme.com", "AdminPass2026!", "Alex Mercer (Admin)")
    
    # 1. Trigger a successful test digest so last_digest_sent_at is set in the DB
    res = client.post("/api/v1/settings/email-digest/test?dataset_id=1", headers=headers_admin)
    assert res.status_code == 200
    
    # 2. Retrieve preferences and check the timestamp format
    res = client.get("/api/v1/settings/email-digest", headers=headers_admin)
    assert res.status_code == 200
    data = res.json()
    last_sent = data["last_digest_sent"]
    assert last_sent is not None
    # Must be ISO-8601 with offset, e.g. "2026-08-14T10:15:30+00:00" or ends with "Z"
    assert last_sent.endswith("+00:00") or last_sent.endswith("Z") or "Z" in last_sent or "+00:00" in last_sent
