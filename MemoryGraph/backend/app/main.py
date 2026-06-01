# Updated by GitHub contribution automation.
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
import os

from app.db import init_db
from app.api.routes import router
from app.api.platform_routes import platform_router

app = FastAPI(title="MemoryGraph AI API")

# Core FastAPI application configuration
# Configure CORS for local dev + production
allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]

if prod_frontend := os.getenv("FRONTEND_URL"):
    allowed_origins.append(prod_frontend.rstrip("/"))

# Allow Vercel preview/production deployments
allow_origin_regex = os.getenv(
    "CORS_ORIGIN_REGEX",
    r"https://(.*\.vercel\.app|.*\.trycloudflare\.com)",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=allow_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        if os.getenv("COOKIE_SECURE", "false").lower() in {"1", "true", "yes"}:
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response

app.add_middleware(SecurityHeadersMiddleware)

# Platform routes with static path segments (e.g. /memories/processing) must register
# before the main router's /memories/{memory_id} or FastAPI matches "processing" as an id.
app.include_router(platform_router)
app.include_router(router)
init_db()


@app.on_event("startup")
def startup():
    init_db()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
