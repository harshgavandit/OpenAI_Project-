# Updated by GitHub contribution automation.
import asyncio

async def run_endpoint_check():
    from app.db import SessionLocal
    from app.models.database import User

    db = SessionLocal()
    user = db.query(User).filter(User.email == "harshgavand2@gmail.com").first()

    if user:
        from app.services.auth import auth_service
        from app.api.routes import memories_insights
        
        token = auth_service.create_access_token(user.id, db)
        print(f"Token created: {token[:20]}...")
        
        # Mock the function call
        try:
            result = await memories_insights(user, db)
            print(f"\nSuccess! Result:")
            print(f"Count: {result.get('count')}")
            print(f"Summaries: {len(result.get('summaries', []))}")
            print(f"Duplicates: {result.get('duplicates')}")
        except Exception as e:
            print(f"Error: {e}")
            import traceback
            traceback.print_exc()

    db.close()

if __name__ == "__main__":
    asyncio.run(run_endpoint_check())
