import requests
import json

API_URL = "http://localhost:8000"

# Try logging in with harshgavand2@gmail.com
print("=== Testing Login ===")
response = requests.post(f"{API_URL}/auth/login", json={
    "email": "harshgavand2@gmail.com",
    "password": "test123"
})

print(f"Status: {response.status_code}")
if response.status_code == 200:
    data = response.json()
    token = data['access_token']
    user = data['user']
    print(f"Token: {token[:40]}...")
    print(f"User: {user['email']}")
    print(f"User ID: {user['id']}")
    
    # Now test the insights endpoint with this token
    print("\n=== Testing /memories/insights ===")
    response2 = requests.get(
        f"{API_URL}/memories/insights",
        headers={"Authorization": f"Bearer {token}"}
    )
    print(f"Status: {response2.status_code}")
    if response2.status_code == 200:
        data2 = response2.json()
        print(f"Memory count: {data2['count']}")
        print(f"Summaries: {json.dumps(data2['summaries'][:3], indent=2) if data2['summaries'] else 'None'}")
    else:
        print(f"Error: {response2.text}")
else:
    print(f"Error: {response.text}")
