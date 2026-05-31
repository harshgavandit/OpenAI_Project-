import requests

# Test 1: Just try to login with bad email to see if endpoint works
response = requests.post(
    'http://localhost:8000/auth/login',
    json={'email': 'test@test.com', 'password': 'wrong'},
    headers={'Content-Type': 'application/json'}
)

print(f"Test 1 - Bad email:")
print(f"Status: {response.status_code}")
print(f"Response: {response.text}\n")

# Test 2: Login with correct credentials
response = requests.post(
    'http://localhost:8000/auth/login',
    json={'email': 'harshgavand2@gmail.com', 'password': 'demo123'},
    headers={'Content-Type': 'application/json'}
)

print(f"Test 2 - Correct credentials:")
print(f"Status: {response.status_code}")
print(f"Response: {response.text[:200]}")
