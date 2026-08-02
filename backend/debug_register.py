import sys
from fastapi.testclient import TestClient

sys.path.insert(0, '.')
from main import app

client = TestClient(app)

print('Routes:')
for route in app.routes:
    print(route.path)

print('\nTesting /api/v1/auth/register')
response = client.post('/api/v1/auth/register', json={
    'email': 'regtest@example.com',
    'password': 'TestPass123!',
    'full_name': 'Reg Test'
})
print('Status:', response.status_code)
print('Content-Type:', response.headers.get('content-type'))
print('Body:', response.text)

print('\nException JSON (if any):')
try:
    print(response.json())
except Exception as e:
    print('Could not parse JSON:', e)
