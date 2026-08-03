#!/usr/bin/env python3
"""API Testing Script"""
import requests
import json
import time

BASE_URL = "http://127.0.0.1:8000"

print("=" * 60)
print("API ENDPOINT TESTS")
print("=" * 60)

# Wait for server startup
time.sleep(2)

# Test 1: User Registration
print("\n1. Testing User Registration")
print("-" * 40)
try:
    response = requests.post(
        f"{BASE_URL}/api/v1/auth/register",
        json={
            "email": "test@example.com",
            "password": "TestPass123!",
            "full_name": "Test User"
        },
        timeout=5
    )
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Registration successful!")
        print(f"   Email: {data['email']}")
        print(f"   Full Name: {data['full_name']}")
        print(f"   Role: {data['role']}")
    elif response.status_code == 400:
        print(f"⚠️ Email already registered (expected if run multiple times)")
    else:
        print(f"❌ Error: {response.json()}")
except Exception as e:
    print(f"❌ Connection error: {e}")

# Test 2: User Login
print("\n2. Testing User Login")
print("-" * 40)
try:
    response = requests.post(
        f"{BASE_URL}/api/v1/auth/login",
        json={
            "email": "test@example.com",
            "password": "TestPass123!"
        },
        timeout=5
    )
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        token = data["access_token"]
        print(f"✅ Login successful!")
        print(f"   Token Type: {data['token_type']}")
        print(f"   User Email: {data['user']['email']}")
        
        # Store token for subsequent tests
        headers = {"Authorization": f"Bearer {token}"}
    else:
        print(f"❌ Error: {response.json()}")
        headers = {}
except Exception as e:
    print(f"❌ Connection error: {e}")
    headers = {}

# Test 3: Get Datasets (requires auth)
print("\n3. Testing Get Datasets (Protected Endpoint)")
print("-" * 40)
try:
    response = requests.get(
        f"{BASE_URL}/api/v1/datasets",
        headers=headers,
        timeout=5
    )
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Got datasets successfully!")
        print(f"   Number of datasets: {len(data)}")
    else:
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json() if response.text else 'Empty'}")
except Exception as e:
    print(f"❌ Connection error: {e}")

# Test 4: Get Chat Conversations
print("\n4. Testing Get Chat Conversations (Protected Endpoint)")
print("-" * 40)
try:
    response = requests.get(
        f"{BASE_URL}/api/v1/chat/conversations",
        headers=headers,
        timeout=5
    )
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Got conversations successfully!")
        print(f"   Number of conversations: {len(data)}")
    else:
        print(f"Status: {response.status_code}")
except Exception as e:
    print(f"❌ Connection error: {e}")

# Test 5: Health Check (root endpoint)
print("\n5. Testing Root Endpoint")
print("-" * 40)
try:
    response = requests.get(f"{BASE_URL}/", timeout=5)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json() if response.text else response.status_code}")
except Exception as e:
    print(f"❌ Connection error: {e}")

print("\n" + "=" * 60)
print("TEST COMPLETE")
print("=" * 60)
