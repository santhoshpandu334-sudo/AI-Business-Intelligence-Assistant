#!/usr/bin/env python3
"""Test registration endpoint with detailed error handling"""
import requests
import json

BASE_URL = "http://127.0.0.1:8000"

# Test registration with different email to avoid duplication
email = f"test_user_{int(__import__('time').time())}@example.com"

print(f"Testing registration with email: {email}")

response = requests.post(
    f"{BASE_URL}/api/v1/auth/register",
    json={
        "email": email,
        "password": "TestPass123!",
        "full_name": "Test User"
    }
)

print(f"Status Code: {response.status_code}")
print(f"Headers: {dict(response.headers)}")
print(f"Response Content-Type: {response.headers.get('content-type')}")
print(f"Response Text Length: {len(response.text)}")
print(f"Response Text: {response.text[:500]}")

if response.text:
    try:
        data = response.json()
        print(f"JSON Response: {json.dumps(data, indent=2)}")
    except:
        print("Could not parse as JSON")
