from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_forecast_endpoints():
    # Attempt login or register simple test user
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
        print(f"Register status: {reg_res.status_code}, response: {reg_res.text}")
        response = client.post("/api/v1/auth/login", json=login_data)
        
    assert response.status_code == 200, f"Authentication setup failed: {response.text}"
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("Authentication OK.")

    # 1. Test GET /forecast/revenue
    print("Testing GET /api/v1/forecast/revenue...")
    res = client.get("/api/v1/forecast/revenue?dataset_id=1&horizon_days=30", headers=headers)
    assert res.status_code == 200, f"Revenue forecast failed: {res.text}"
    data = res.json()
    assert len(data) == 30, f"Expected 30 prediction points, got {len(data)}"
    assert "predicted" in data[0]
    print("Revenue Forecast API OK.")

    # 2. Test GET /forecast/profit
    print("Testing GET /api/v1/forecast/profit...")
    res = client.get("/api/v1/forecast/profit?dataset_id=1&horizon_days=7", headers=headers)
    assert res.status_code == 200, f"Profit forecast failed: {res.text}"
    assert len(res.json()) == 7
    print("Profit Forecast API OK.")

    # 3. Test GET /forecast/orders
    print("Testing GET /api/v1/forecast/orders...")
    res = client.get("/api/v1/forecast/orders?dataset_id=1&horizon_days=90", headers=headers)
    assert res.status_code == 200, f"Orders forecast failed: {res.text}"
    assert len(res.json()) == 90
    print("Orders Forecast API OK.")

    # 4. Test GET /forecast/dashboard
    print("Testing GET /api/v1/forecast/dashboard...")
    res = client.get("/api/v1/forecast/dashboard?dataset_id=1&horizon_days=30", headers=headers)
    assert res.status_code == 200, f"Forecast dashboard failed: {res.text}"
    dashboard = res.json()
    assert "forecast_kpis" in dashboard
    assert "revenue_forecast" in dashboard
    assert "anomalies" in dashboard
    assert "risks" in dashboard
    assert "recommendations" in dashboard
    
    assert len(dashboard["anomalies"]) > 0
    assert "overall_risk" in dashboard["risks"]
    assert len(dashboard["recommendations"]) > 0
    print("Forecast Dashboard API OK.")

    print("\nALL PHASE 5 ENDPOINTS VERIFIED & STABLE!")

if __name__ == "__main__":
    test_forecast_endpoints()
