# Updated by GitHub contribution automation.
"""Detect timeline gaps and date contradictions in a family archive."""

from __future__ import annotations

import re
from collections import defaultdict

from sqlalchemy.orm import Session

from app.models.database import ArchiveInsightAction, Memory, TimelineEvent


def _years_from_memory(memory: Memory) -> set[int]:
    years: set[int] = set()
    data = memory.structured_data if isinstance(memory.structured_data, dict) else {}
    for date_value in data.get("dates", []) or []:
        if isinstance(date_value, str):
            for match in re.findall(r"\b(19\d{2}|20\d{2})\b", date_value):
                years.add(int(match))
    for match in re.findall(r"\b(19\d{2}|20\d{2})\b", f"{memory.title} {memory.summary} {memory.raw_text}"):
        years.add(int(match))
    return years


def insight_key(item: dict) -> str:
    return f"{item.get('type', 'unknown')}:{item.get('label', '')}"


def _load_actions(db: Session, user_id: str) -> dict[str, ArchiveInsightAction]:
    rows = db.query(ArchiveInsightAction).filter(ArchiveInsightAction.user_id == user_id).all()
    return {row.insight_key: row for row in rows}


def _attach_keys(items: list[dict]) -> list[dict]:
    enriched = []
    for item in items:
        copy = dict(item)
        copy["insight_key"] = insight_key(copy)
        enriched.append(copy)
    return enriched


def _filter_items(items: list[dict], actions: dict[str, ArchiveInsightAction]) -> list[dict]:
    filtered = []
    for item in items:
        key = insight_key(item)
        action = actions.get(key)
        if action and action.action == "dismiss":
            continue
        if action and action.action == "merge" and action.merge_target:
            item = dict(item)
            item["merge_target"] = action.merge_target
            item["resolved"] = True
        filtered.append(item)
    return filtered


def analyze_archive(db: Session, user_id: str) -> dict:
    memories = (
        db.query(Memory)
        .filter(Memory.user_id == user_id, Memory.archived_at.is_(None), Memory.deleted_at.is_(None))
        .order_by(Memory.updated_at.desc())
        .limit(200)
        .all()
    )
    timeline_years = sorted(
        {
            row.year
            for row in db.query(TimelineEvent.year)
            .filter(TimelineEvent.user_id == user_id, TimelineEvent.year.isnot(None))
            .distinct()
            .all()
            if row.year
        }
    )
    memory_years: set[int] = set()
    for memory in memories:
        memory_years |= _years_from_memory(memory)

    all_years = sorted(timeline_years or memory_years)
    gaps = []
    if len(all_years) >= 2:
        for idx in range(len(all_years) - 1):
            start, end = all_years[idx], all_years[idx + 1]
            span = end - start
            if span >= 4:
                gaps.append(
                    {
                        "type": "timeline_gap",
                        "label": f"No mapped memories between {start} and {end}",
                        "year_start": start,
                        "year_end": end,
                        "severity": "high" if span >= 8 else "medium",
                        "suggestion": f"Upload photos, letters, or notes from {start + 1}–{end - 1} to close this gap.",
                    }
                )

    if not memories:
        gaps.append(
            {
                "type": "empty_archive",
                "label": "Archive is empty",
                "severity": "high",
                "suggestion": "Load the sample archive or upload your first family file.",
            }
        )
    elif len(memories) < 5:
        gaps.append(
            {
                "type": "thin_archive",
                "label": f"Only {len(memories)} memories indexed",
                "severity": "medium",
                "suggestion": "Add 3–5 more files so Time Machine and Proof stay grounded.",
            }
        )

    contradictions = []
    event_years: dict[str, set[int]] = defaultdict(set)
    for memory in memories:
        data = memory.structured_data if isinstance(memory.structured_data, dict) else {}
        years = _years_from_memory(memory)
        for event in data.get("events", []) or []:
            if isinstance(event, str) and years:
                key = event.strip().lower()
                event_years[key] |= years

    for event, years in event_years.items():
        if len(years) >= 2 and max(years) - min(years) >= 3:
            ordered = sorted(years)
            contradictions.append(
                {
                    "type": "date_conflict",
                    "label": f"“{event.title()}” appears across {ordered[0]}–{ordered[-1]}",
                    "years": ordered,
                    "severity": "watch",
                    "suggestion": "Review source memories — the same event may need merging or clearer dates.",
                }
            )

    people_without_dates = []
    for memory in memories[:40]:
        data = memory.structured_data if isinstance(memory.structured_data, dict) else {}
        if (data.get("people") or []) and not _years_from_memory(memory):
            people_without_dates.append(memory.title)
    if len(people_without_dates) >= 3:
        contradictions.append(
            {
                "type": "missing_dates",
                "label": f"{len(people_without_dates)} memories mention people but no years",
                "examples": people_without_dates[:4],
                "severity": "neutral",
                "suggestion": "Add date hints in filenames or upload journals with years.",
            }
        )

    actions = _load_actions(db, user_id)
    gaps = _filter_items(gaps, actions)
    contradictions = _filter_items(contradictions, actions)
    score = max(0, 100 - len(gaps) * 12 - len(contradictions) * 8)
    return {
        "archive_score": score,
        "memory_count": len(memories),
        "year_span": [all_years[0], all_years[-1]] if all_years else [],
        "gaps": _attach_keys(gaps[:6]),
        "contradictions": _attach_keys(contradictions[:6]),
        "summary": _summary(gaps, contradictions, len(memories)),
    }


def _summary(gaps: list, contradictions: list, memory_count: int) -> str:
    if memory_count == 0:
        return "Start your archive to unlock gap detection and contradiction checks."
    if not gaps and not contradictions:
        return "Your archive timeline looks consistent. Keep adding memories to strengthen Proof coverage."
    parts = []
    if gaps:
        parts.append(f"{len(gaps)} timeline gap(s)")
    if contradictions:
        parts.append(f"{len(contradictions)} item(s) to review")
    return "Archive intelligence found " + " and ".join(parts) + "."
