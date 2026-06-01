# Updated by GitHub contribution automation.
"""
Simulate the full auth flow:
1. Create a token in the running uvicorn server
2. Use that token to call /memories/insights
"""

import requests
import json

# Step 1: Create a token by calling /auth/register or /auth/login
# For testing, let's use email/password login

response = requests.post(
    'http://localhost:8000/auth/login',
    json={'email': 'harshgavand2@gmail.com', 'password': 'test_password_123'},
    headers={'Content-Type': 'application/json'}
)

print(f"Login response status: {response.status_code}")
print(f"Login response: {response.text}")

if response.status_code == 200:
    data = response.json()
    token = data['access_token']
    print(f"\n✓ Got token: {token[:20]}...")
    
    # Step 2: Use that token to call /memories/insights
    response2 = requests.get(
        'http://localhost:8000/memories/insights',
        headers={'Authorization': f'Bearer {token}'}
    )
    
    print(f"\nMemories insights response status: {response2.status_code}")
    print(f"Response: {response2.text[:300]}")
else:
    print("Login failed!")
