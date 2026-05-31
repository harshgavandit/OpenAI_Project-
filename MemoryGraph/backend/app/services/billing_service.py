"""Stripe billing integration (optional — requires STRIPE_SECRET_KEY)."""

import os

import httpx
from fastapi import HTTPException

STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "")
STRIPE_PRICE_FAMILY = os.getenv("STRIPE_PRICE_FAMILY", "")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000").rstrip("/")


class BillingService:
    @staticmethod
    def configured() -> bool:
        return bool(STRIPE_SECRET_KEY and STRIPE_PRICE_FAMILY)

    @staticmethod
    def create_family_checkout(user_id: str, email: str) -> dict:
        if not BillingService.configured():
            raise HTTPException(
                status_code=503,
                detail="Billing is not configured. Set STRIPE_SECRET_KEY and STRIPE_PRICE_FAMILY.",
            )
        response = httpx.post(
            "https://api.stripe.com/v1/checkout/sessions",
            auth=(STRIPE_SECRET_KEY, ""),
            data={
                "mode": "subscription",
                "success_url": f"{FRONTEND_URL}/account?billing=success",
                "cancel_url": f"{FRONTEND_URL}/account?billing=cancel",
                "customer_email": email,
                "client_reference_id": user_id,
                "line_items[0][price]": STRIPE_PRICE_FAMILY,
                "line_items[0][quantity]": "1",
            },
            timeout=30,
        )
        if response.status_code >= 400:
            raise HTTPException(status_code=502, detail="Stripe checkout failed")
        payload = response.json()
        return {"url": payload.get("url"), "session_id": payload.get("id")}

    @staticmethod
    def create_portal(customer_id: str) -> dict:
        if not STRIPE_SECRET_KEY:
            raise HTTPException(status_code=503, detail="Stripe is not configured")
        response = httpx.post(
            "https://api.stripe.com/v1/billing_portal/sessions",
            auth=(STRIPE_SECRET_KEY, ""),
            data={
                "customer": customer_id,
                "return_url": f"{FRONTEND_URL}/account",
            },
            timeout=30,
        )
        if response.status_code >= 400:
            raise HTTPException(status_code=502, detail="Stripe portal failed")
        return {"url": response.json().get("url")}
