#!/usr/bin/env python3
"""Simple registration test"""
import requests
import time

time.sleep(2)

r = requests.post(
    'http://127.0.0.1:8000/api/v1/auth/register',
    json={
        'email': 'simple_test@example.com',
        'password': 'TestPass123!',
        'full_name': 'Simple Test'
    }
)

print(f'Status: {r.status_code}')
print(f'Response: {r.json() if r.headers.get("content-type") == "application/json" else r.text[:100]}')
