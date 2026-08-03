#!/usr/bin/env python3
"""Test health check endpoint"""
import requests
import time

time.sleep(2)

print("\n1. Testing health-check endpoint")
r = requests.post('http://127.0.0.1:8000/api/v1/auth/health-check')
print(f'   Status: {r.status_code}')
if r.status_code == 200:
    print(f'   ✅ Response: {r.json()}')
else:
    print(f'   ❌ Response: {r.text[:100]}')

print("\n2. Testing registration endpoint")
r = requests.post(
    'http://127.0.0.1:8000/api/v1/auth/register',
    json={
        'email': 'trace_test@example.com',
        'password': 'TestPass123!',
        'full_name': 'Trace Test'
    }
)
print(f'   Status: {r.status_code}')
print(f'   Response: {r.text[:300]}')
