# Updated by GitHub contribution automation.
import requests


def run_insights_api_check():
    try:
        from app.db import SessionLocal
        from app.models.database import User
        from app.services.auth import auth_service

        db = SessionLocal()
        user = db.query(User).filter(User.email == "harshgavand2@gmail.com").first()

        if user:
            token = auth_service.create_access_token(user.id, db)
            print("Generated token for testing")

            response = requests.get(
                'http://localhost:8000/memories/insights',
                headers={'Authorization': f'Bearer {token}'},
                timeout=15,
            )

            print(f"Status: {response.status_code}")
            print(f"Response: {response.text[:500]}")

            if response.status_code == 200:
                data = response.json()
                print("\nSuccess!")
                print(f"Count: {data.get('count')}")
                print(f"Summaries: {len(data.get('summaries', []))}")
            else:
                print(f"\nError: {response.status_code}")

        db.close()
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    run_insights_api_check()
