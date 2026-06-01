# Updated by GitHub contribution automation.
import os
import time

os.environ.setdefault("LLM_PROVIDER", "ollama")

from fastapi.testclient import TestClient

from app.main import app

c = TestClient(app)
reg = c.post(
    "/auth/register",
    json={"email": f"tmtest{int(time.time())}@x.com", "password": "memorygraph-demo", "full_name": "T"},
)
token = reg.json().get("access_token")
h = {"Authorization": f"Bearer {token}"}
c.post("/sample-archive/load", headers=h)
t0 = time.time()
r = c.post(
    "/time-machine/query",
    headers=h,
    json={"query": "Show my father's life between age 20-30", "birth_year": 1978},
)
elapsed = time.time() - t0
print("tm", elapsed, r.status_code)
if r.status_code == 200:
    body = r.json()
    print("memories", len(body.get("memories", [])), "narrative_len", len(body.get("narrative", "")))
else:
    print(r.text[:500])
