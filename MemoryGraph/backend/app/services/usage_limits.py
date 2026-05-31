"""Daily usage limits per subscription plan."""

from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.database import Subscription, UsageLog

TIER_LIMITS = {
    "free": {"upload": 10, "query": 50},
    "pro": {"upload": 100, "query": 500},
    "team": {"upload": 500, "query": 2000},
    "family": {"upload": 100, "query": 500},
}


def _today_window():
    today = datetime.now(timezone.utc).date()
    start = datetime(today.year, today.month, today.day, tzinfo=timezone.utc)
    return start, start + timedelta(days=1)


def get_subscription(db: Session, user_id: str) -> Subscription:
    sub = db.query(Subscription).filter(Subscription.user_id == user_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    return sub


def count_daily_uploads(db: Session, user_id: str) -> int:
    start, end = _today_window()
    return (
        db.query(UsageLog)
        .filter(
            UsageLog.user_id == user_id,
            UsageLog.action == "upload",
            UsageLog.created_at >= start,
            UsageLog.created_at < end,
        )
        .count()
    )


def count_daily_queries(db: Session, user_id: str) -> int:
    start, end = _today_window()
    return (
        db.query(UsageLog)
        .filter(
            UsageLog.user_id == user_id,
            UsageLog.action.in_(["chat", "time-machine", "ask"]),
            UsageLog.created_at >= start,
            UsageLog.created_at < end,
        )
        .count()
    )


def usage_snapshot(db: Session, user_id: str) -> dict:
    sub = get_subscription(db, user_id)
    limits = TIER_LIMITS.get(sub.plan, TIER_LIMITS["free"])
    uploads = count_daily_uploads(db, user_id)
    queries = count_daily_queries(db, user_id)
    return {
        "plan": sub.plan,
        "daily_uploads": uploads,
        "daily_upload_limit": limits["upload"],
        "daily_queries": queries,
        "daily_query_limit": limits["query"],
        "uploads_remaining": max(0, limits["upload"] - uploads),
        "queries_remaining": max(0, limits["query"] - queries),
    }


def assert_can_upload(db: Session, user_id: str) -> None:
    sub = get_subscription(db, user_id)
    limits = TIER_LIMITS.get(sub.plan, TIER_LIMITS["free"])
    if count_daily_uploads(db, user_id) >= limits["upload"]:
        raise HTTPException(
            status_code=429,
            detail=f"Daily upload limit reached ({limits['upload']} per day on {sub.plan} plan).",
        )


def assert_can_query(db: Session, user_id: str) -> None:
    sub = get_subscription(db, user_id)
    limits = TIER_LIMITS.get(sub.plan, TIER_LIMITS["free"])
    if count_daily_queries(db, user_id) >= limits["query"]:
        raise HTTPException(
            status_code=429,
            detail=f"Daily question limit reached ({limits['query']} per day on {sub.plan} plan).",
        )
