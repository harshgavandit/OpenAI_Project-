# Updated by GitHub contribution automation.
import os
import shutil
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TEST_DATA = ROOT / "backend" / "data" / "test"
shutil.rmtree(TEST_DATA, ignore_errors=True)
TEST_DATA.mkdir(parents=True, exist_ok=True)

os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DATA / 'memorygraph_test.db'}"
os.environ["CHROMA_DB_PATH"] = str(TEST_DATA / "chromadb")
os.environ["LLM_PROVIDER"] = "fallback"
os.environ["OLLAMA_TIMEOUT_SECONDS"] = "2"

sys.path.insert(0, str(ROOT / "backend"))

from fastapi.testclient import TestClient  # noqa: E402
from app.main import app  # noqa: E402


def register(client: TestClient, suffix: str):
    response = client.post(
        "/auth/register",
        json={
            "email": f"{suffix}-{int(time.time() * 1000)}@memorygraph.ai",
            "password": "memorygraph-demo",
            "full_name": "Test User",
        },
    )
    assert response.status_code == 200
    return response.json()["access_token"]


def test_auth_upload_search_chat_and_isolation():
    client = TestClient(app)
    token_a = register(client, "a")
    token_b = register(client, "b")
    headers_a = {"Authorization": f"Bearer {token_a}"}
    headers_b = {"Authorization": f"Bearer {token_b}"}

    client.cookies.clear()
    protected = client.get("/memories")
    assert protected.status_code in {401, 403}

    upload = client.post(
        "/memories/upload",
        headers=headers_a,
        files={
            "file": (
                "family_memory.txt",
                b"Grandfather and I visited Mumbai during summer vacation in 2015.",
                "text/plain",
            )
        },
    )
    assert upload.status_code == 200, upload.text
    memory_id = upload.json()["memory_id"]

    status = client.get(f"/memories/{memory_id}/status", headers=headers_a)
    assert status.status_code == 200
    assert status.json()["status"] == "completed", status.text

    search_a = client.get("/memories/search", headers=headers_a, params={"query": "Mumbai"})
    assert search_a.status_code == 200
    assert len(search_a.json()["results"]) == 1

    nl_search = client.get(
        "/memories/search",
        headers=headers_a,
        params={"query": "What memories involve grandfather?"},
    )
    assert nl_search.status_code == 200, nl_search.text
    assert len(nl_search.json()["results"]) >= 1, nl_search.text

    search_b = client.get("/memories/search", headers=headers_b, params={"query": "Mumbai"})
    assert search_b.status_code == 200
    assert len(search_b.json()["results"]) == 0

    chat = client.post("/chat", headers=headers_a, json={"query": "What memories involve grandfather?"})
    assert chat.status_code == 200, chat.text
    body = chat.json()
    assert "answer" in body
    assert "proofs" in body
    assert len(body.get("sources", [])) >= 1, body
    assert len(body["proofs"]) >= 1

    time_machine = client.post(
        "/time-machine/query",
        headers=headers_a,
        json={"query": "Show events from 2015"},
    )
    assert time_machine.status_code == 200
    assert time_machine.json()["timeline"]

    seed = client.post("/sample-archive/load", headers=headers_a)
    assert seed.status_code == 200, seed.text
    father_chapter = client.post(
        "/time-machine/query",
        headers=headers_a,
        json={"query": "Show my father's life between age 20-30", "birth_year": 1978},
    )
    assert father_chapter.status_code == 200, father_chapter.text
    father_body = father_chapter.json()
    assert len(father_body["memories"]) >= 1, father_body
    assert len(father_body["timeline"]) >= 1, father_body
    assert "could not find enough connected memories" not in father_body["narrative"].lower()
