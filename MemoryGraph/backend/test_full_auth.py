import requests
import json

# Step 1: Login
login_response = requests.post(
    'http://localhost:8000/auth/login',
    json={'email': 'harshgavand2@gmail.com', 'password': 'demo123'},
    headers={'Content-Type': 'application/json'}
)

print(f"Login Status: {login_response.status_code}")
if login_response.status_code != 200:
    print(f"Login failed: {login_response.text}")
    exit(1)

data = login_response.json()
token = data['access_token']
user = data['user']
print(f"Logged in as: {user['full_name']}")
print(f"Token: {token[:20]}...\n")

# Step 2: Use token to call /memories/insights
insights_response = requests.get(
    'http://localhost:8000/memories/insights',
    headers={'Authorization': f'Bearer {token}'}
)

print(f"Insights Status: {insights_response.status_code}")
if insights_response.status_code == 200:
    insights = insights_response.json()
    print(f"SUCCESS! Got {insights['count']} memories")
    print(f"Summaries: {len(insights['summaries'])}")
    print(f"Top people: {insights['top_people'][:3]}")
else:
    print(f"Error: {insights_response.text}")
