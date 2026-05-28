from collections import defaultdict, deque
from time import time

from fastapi import HTTPException, Request


class InMemoryRateLimiter:
    def __init__(self):
        self.requests = defaultdict(deque)

    def check(self, key: str, limit: int, window_seconds: int):
        now = time()
        bucket = self.requests[key]
        while bucket and now - bucket[0] > window_seconds:
            bucket.popleft()
        if len(bucket) >= limit:
            raise HTTPException(status_code=429, detail="Too many requests. Please try again shortly.")
        bucket.append(now)


rate_limiter = InMemoryRateLimiter()


def rate_limit(request: Request, scope: str, limit: int, window_seconds: int = 60):
    forwarded = request.headers.get("x-forwarded-for")
    client_ip = forwarded.split(",")[0].strip() if forwarded else (request.client.host if request.client else "unknown")
    rate_limiter.check(f"{scope}:{client_ip}", limit, window_seconds)
