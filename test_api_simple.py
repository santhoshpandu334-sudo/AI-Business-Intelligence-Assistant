#!/usr/bin/env python3
"""Simple API test"""
import requests

BASE_URL = "http://127.0.0.1:8000"

# Test 1: Root endpoint (GET)
print("Testing GET /")
try:
    r = requests.get(f"{BASE_URL}/")
    print(f"Status: {r.status_code}")
    print(f"Response: {r.json()}")
except Exception as e:
    print(f"Error: {e}")

# Test 2: Try login with non-existent user (should return 401, not 500)
print("\nTesting POST /api/v1/auth/login with non-existent user")
try:
    r = requests.post(
        f"{BASE_URL}/api/v1/auth/login",
        json={"email": "nonexistent@example.com", "password": "wrongpass"}
    )
    print(f"Status: {r.status_code}")
    if r.text:
        print(f"Response: {r.json() if r.headers.get('content-type') == 'application/json' else r.text[:200]}")
except Exception as e:
    print(f"Error: {e}")

# Test 3: Try with invalid request
print("\nTesting POST /api/v1/auth/register with invalid email")
try:
    r = requests.post(
        f"{BASE_URL}/api/v1/auth/register",
        json={"email": "not-an-email", "password": "Test123!", "full_name": "Test"}
    )
    print(f"Status: {r.status_code}")
    if r.text:
        print(f"Response: {r.json() if r.headers.get('content-type') == 'application/json' else r.text[:200]}")
except Exception as e:
    print(f"Error: {e}")
