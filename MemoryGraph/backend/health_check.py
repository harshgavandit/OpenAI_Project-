#!/usr/bin/env python
"""
Quick health check for MemoryGraph
Verifies backend is ready
"""
import requests
import sys
from time import sleep

def check_backend():
    """Check if backend is running"""
    try:
        response = requests.get("http://localhost:8000/health", timeout=5)
        if response.status_code == 200:
            print("✅ Backend is running!")
            data = response.json()
            print(f"   Service: {data.get('service')}")
            print(f"   Status: {data.get('status')}")
            return True
    except requests.exceptions.ConnectionError:
        print("❌ Backend is NOT running")
        print("   Start it with: uvicorn app.main:app --reload")
        return False
    except Exception as e:
        print(f"❌ Error checking backend: {e}")
        return False

def test_demo_login():
    """Test login with demo account"""
    try:
        response = requests.post(
            "http://localhost:8000/auth/login",
            json={
                "email": "demo@memorygraph.com",
                "password": "demo123456"
            },
            timeout=5
        )
        if response.status_code == 200:
            data = response.json()
            print("✅ Demo login works!")
            print(f"   User: {data['user']['email']}")
            print(f"   Token received: {data['access_token'][:20]}...")
            return data['access_token']
        else:
            print(f"❌ Demo login failed: {response.status_code}")
            print(f"   {response.text}")
            return None
    except Exception as e:
        print(f"❌ Error testing login: {e}")
        return None

def get_demo_data(token):
    """Get demo memories"""
    try:
        response = requests.get(
            "http://localhost:8000/memories",
            headers={"Authorization": f"Bearer {token}"},
            timeout=5
        )
        if response.status_code == 200:
            data = response.json()
            memory_count = len(data.get('memories', []))
            print(f"✅ Demo data accessible!")
            print(f"   Total memories: {memory_count}")
            if memory_count > 0:
                print(f"   First memory: {data['memories'][0]['title']}")
            return True
        else:
            print(f"❌ Failed to get memories: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error getting memories: {e}")
        return False

def main():
    print("🔍 MemoryGraph Health Check\n")
    
    # Check backend
    if not check_backend():
        print("\n⚠️  Backend is not running. Please start it first:")
        print("   cd G:\\OpenAI_Project\\MemoryGraph\\backend")
        print("   .\\.venv\\Scripts\\uvicorn.exe app.main:app --reload")
        return False
    
    print()
    sleep(1)  # Brief pause
    
    # Test login
    token = test_demo_login()
    if not token:
        print("\n⚠️  Demo login failed. This might be normal if backend just started.")
        return False
    
    print()
    sleep(1)
    
    # Get demo data
    if get_demo_data(token):
        print("\n✅ Everything looks good!")
        print("\n🎉 You're ready to test the app:")
        print("   Frontend: http://localhost:3000")
        print("   Backend:  http://localhost:8000")
        print("   API Docs: http://localhost:8000/docs")
        print("\n📝 Demo credentials:")
        print("   Email: demo@memorygraph.com")
        print("   Password: demo123456")
        return True
    else:
        print("\n⚠️  Could not load demo data")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
