from fastapi.testclient import TestClient
from main import app
from app.core.config import settings

client = TestClient(app)

def test_insights_endpoints():
    # Authenticate first
    login_data = {
        "email": "simple_test@example.com",
        "password": "TestPass123!"
    }
    
    print("Testing Authentication login...")
    response = client.post("/api/v1/auth/login", json=login_data)
    if response.status_code != 200:
        print("Login failed, attempting user registration first...")
        reg_data = {
            "email": "simple_test@example.com",
            "password": "TestPass123!",
            "full_name": "Simple Test"
        }
        reg_res = client.post("/api/v1/auth/register", json=reg_data)
        response = client.post("/api/v1/auth/login", json=login_data)
        
    assert response.status_code == 200, f"Authentication setup failed: {response.text}"
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("Authentication OK.")

    # 1. Test GET /insights/executive-summary
    print("Testing GET /api/v1/insights/executive-summary...")
    res = client.get("/api/v1/insights/executive-summary?dataset_id=1", headers=headers)
    assert res.status_code == 200, f"Executive summary failed: {res.text}"
    summary = res.json()
    assert "summary" in summary
    assert "total_revenue" in summary
    print("Executive Summary API OK.")

    # 2. Test GET /insights/business
    print("Testing GET /api/v1/insights/business...")
    res = client.get("/api/v1/insights/business?dataset_id=1", headers=headers)
    assert res.status_code == 200, f"Business insights failed: {res.text}"
    data = res.json()
    assert len(data) > 0
    assert "category" in data[0]
    print("Business Insights API OK.")

    # 3. Test GET /insights/risks
    print("Testing GET /api/v1/insights/risks...")
    res = client.get("/api/v1/insights/risks?dataset_id=1", headers=headers)
    assert res.status_code == 200, f"Risks list failed: {res.text}"
    data = res.json()
    assert len(data) > 0
    assert "risk_type" in data[0]
    print("Risk Intelligence API OK.")

    # 4. Test GET /insights/recommendations
    print("Testing GET /api/v1/insights/recommendations...")
    res = client.get("/api/v1/insights/recommendations?dataset_id=1", headers=headers)
    assert res.status_code == 200, f"Recommendations list failed: {res.text}"
    data = res.json()
    assert len(data) > 0
    assert "expected_benefit" in data[0]
    print("AI Recommendations API OK.")

    # 5. Test GET /insights/dashboard
    print("Testing GET /api/v1/insights/dashboard...")
    res = client.get("/api/v1/insights/dashboard?dataset_id=1", headers=headers)
    assert res.status_code == 200, f"Insights dashboard failed: {res.text}"
    dashboard = res.json()
    assert "executive_summary" in dashboard
    assert "business_insights" in dashboard
    assert "risks" in dashboard
    assert "recommendations" in dashboard
    print("Insights Dashboard API OK.")

    print("\nALL PHASE 6 ENDPOINTS VERIFIED & STABLE!")

if __name__ == "__main__":
    test_insights_endpoints()
