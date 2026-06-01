# Updated by GitHub contribution automation.
"""Memory Proof — cite every AI insight back to source memories."""

from __future__ import annotations

from app.models.database import Memory

PROCESSING_LINEAGE = [
    ("uploaded", "Uploaded"),
    ("metadata", "Metadata"),
    ("content_extraction", "Extracted"),
    ("ai_enrichment", "Enriched"),
    ("relationship_processing", "Relationships"),
    ("indexing", "Indexed"),
    ("completed", "Complete"),
]


def processing_lineage(stage: str, status: str) -> list[dict]:
    stage = (stage or "uploaded").lower()
    status = (status or "pending").lower()
    order = [key for key, _ in PROCESSING_LINEAGE]
    try:
        current_index = order.index(stage if stage in order else "completed")
    except ValueError:
        current_index = len(order) - 1
    lineage = []
    for index, (key, label) in enumerate(PROCESSING_LINEAGE):
        if index < current_index:
            state = "done"
        elif index == current_index:
            state = "failed" if status == "failed" else ("active" if status in {"pending", "processing"} else "done")
        else:
            state = "pending"
        lineage.append({"key": key, "label": label, "state": state})
    return lineage


def memory_proof_payload(memory: Memory) -> dict:
    data = memory.structured_data or {}
    confidence = 0.35
    for key in ("people", "places", "events", "dates"):
        if isinstance(data, dict) and data.get(key):
            confidence += 0.12
    return {
        "memory_id": memory.id,
        "title": memory.title,
        "summary": memory.summary,
        "status": memory.status,
        "processing_stage": memory.processing_stage,
        "evidence": {
            "people": data.get("people", []) if isinstance(data, dict) else [],
            "places": data.get("places", []) if isinstance(data, dict) else [],
            "events": data.get("events", []) if isinstance(data, dict) else [],
            "dates": data.get("dates", []) if isinstance(data, dict) else [],
            "excerpt": (memory.raw_text or memory.summary or "")[:260],
        },
        "confidence": round(min(confidence, 0.95), 2),
        "created_at": memory.created_at.isoformat() if memory.created_at else None,
        "lineage": processing_lineage(memory.processing_stage, memory.status),
    }


def proofs_for_memory_ids(db, user_id: str, memory_ids: list[str]) -> list[dict]:
    if not memory_ids:
        return []
    rows = (
        db.query(Memory)
        .filter(Memory.user_id == user_id, Memory.id.in_(memory_ids))
        .all()
    )
    by_id = {row.id: row for row in rows}
    return [memory_proof_payload(by_id[mid]) for mid in memory_ids if mid in by_id]
