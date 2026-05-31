import json
import os
import re
import threading
import time
from typing import Any

import httpx
from dotenv import load_dotenv

from app.models.memory import StructuredMemory

load_dotenv()

# Limit concurrent Ollama calls (single home GPU / shared server)
_OLLAMA_SEMAPHORE = threading.Semaphore(int(os.getenv("OLLAMA_MAX_CONCURRENT", "2")))
_OLLAMA_REACHABLE_CACHE: dict[str, Any] = {"checked_at": 0.0, "reachable": False, "models": []}
_OLLAMA_CACHE_TTL = float(os.getenv("OLLAMA_REACHABLE_CACHE_SECONDS", "20"))


class AIProvider:
    def __init__(self):
        # Default to fallback so local dev works without Ollama; set LLM_PROVIDER=ollama when it is running.
        self.provider = os.getenv("LLM_PROVIDER", "fallback").lower()
        self.ollama_base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").rstrip("/")
        self.chat_model = os.getenv("OLLAMA_CHAT_MODEL", "mistral:latest")
        self.fallback_model = os.getenv("OLLAMA_FALLBACK_MODEL", "mistral:latest")
        self.embed_model = os.getenv("OLLAMA_EMBED_MODEL", "nomic-embed-text:latest")
        self.timeout = float(os.getenv("OLLAMA_TIMEOUT_SECONDS", "45"))
        self.ping_timeout = float(os.getenv("OLLAMA_PING_TIMEOUT_SECONDS", "2"))
        self.chat_timeout = float(os.getenv("OLLAMA_CHAT_TIMEOUT_SECONDS", "20"))

    def _ollama_enabled(self) -> bool:
        return self.provider == "ollama"

    def _probe_ollama(self) -> tuple[bool, list[str]]:
        if not self._ollama_enabled():
            return False, []
        try:
            response = httpx.get(f"{self.ollama_base_url}/api/tags", timeout=self.ping_timeout)
            response.raise_for_status()
            data = response.json()
            models = [item.get("name", "") for item in data.get("models", []) if item.get("name")]
            return True, models
        except Exception:
            return False, []

    def _ollama_reachable(self, *, force: bool = False) -> bool:
        if not self._ollama_enabled():
            return False
        now = time.monotonic()
        if not force and now - float(_OLLAMA_REACHABLE_CACHE["checked_at"]) < _OLLAMA_CACHE_TTL:
            return bool(_OLLAMA_REACHABLE_CACHE["reachable"])
        reachable, models = self._probe_ollama()
        _OLLAMA_REACHABLE_CACHE["reachable"] = reachable
        _OLLAMA_REACHABLE_CACHE["models"] = models
        _OLLAMA_REACHABLE_CACHE["checked_at"] = now
        return reachable

    def status(self) -> dict[str, Any]:
        reachable = False
        models: list[str] = []
        if self._ollama_enabled():
            reachable = self._ollama_reachable()
            models = list(_OLLAMA_REACHABLE_CACHE.get("models") or [])
        elif self.provider in {"fallback", "local", "offline"}:
            reachable = False
        return {
            "provider": self.provider,
            "reachable": reachable,
            "chat_model": self.chat_model,
            "fallback_model": self.fallback_model,
            "embedding_model": self.embed_model,
            "models": models,
        }

    def enrich_text(self, text: str) -> StructuredMemory:
        if not text.strip():
            return StructuredMemory()
        if not self._ollama_enabled() or not self._ollama_reachable():
            return self.fallback_enrichment(text)

        prompt = (
            "Extract structured memory intelligence from the user's text. "
            "Return strict JSON only with keys: people, places, events, dates, summary. "
            "Each list must contain concise strings. The summary must be one vivid sentence."
        )
        data = self._chat_json(prompt, text[:12000])
        if not data:
            return self.fallback_enrichment(text)
        try:
            return StructuredMemory(**data)
        except Exception:
            return self.fallback_enrichment(text)

    def synthesize_answer(self, query: str, memory_summaries: list[str], relationships: list[str]) -> str:
        if not memory_summaries:
            return "I do not remember anything matching that yet."
        if not self._ollama_enabled() or not self._ollama_reachable():
            return self.template_answer(query, memory_summaries, relationships)

        system = (
            "You are MemoryGraph AI, a Human Memory Operating System. "
            "Answer warmly and concretely using only the supplied memory context. "
            "Mention the relationships or timeline clues when helpful. Keep it under 120 words."
        )
        user = (
            f"Query: {query}\n\n"
            f"Memory context:\n{chr(10).join(memory_summaries)}\n\n"
            f"Relationships:\n{chr(10).join(relationships)}"
        )
        answer = self._chat_text(system, user)
        return answer or self.template_answer(query, memory_summaries, relationships)

    def embed_text(self, text: str) -> list[float] | None:
        if not self._ollama_enabled() or not text.strip() or not self._ollama_reachable():
            return None
        try:
            response = httpx.post(
                f"{self.ollama_base_url}/api/embeddings",
                json={"model": self.embed_model, "prompt": text[:8000]},
                timeout=self.timeout,
            )
            response.raise_for_status()
            embedding = response.json().get("embedding")
            return embedding if isinstance(embedding, list) else None
        except Exception:
            return None

    def _chat_text(self, system: str, user: str) -> str:
        if not self._ollama_reachable():
            return ""
        chat_timeout = min(self.timeout, self.chat_timeout)
        for model in [self.chat_model, self.fallback_model]:
            try:
                with _OLLAMA_SEMAPHORE:
                    response = httpx.post(
                    f"{self.ollama_base_url}/api/chat",
                    json={
                        "model": model,
                        "messages": [
                            {"role": "system", "content": system},
                            {"role": "user", "content": user},
                        ],
                        "stream": False,
                        "options": {"temperature": 0.25},
                    },
                    timeout=chat_timeout,
                )
                response.raise_for_status()
                content = response.json().get("message", {}).get("content", "")
                if content:
                    return self._strip_thinking(content).strip()
            except Exception:
                continue
        return ""

    def _chat_json(self, system: str, user: str) -> dict[str, Any] | None:
        content = self._chat_text(system, user)
        if not content:
            return None
        try:
            return json.loads(content)
        except Exception:
            match = re.search(r"\{.*\}", content, flags=re.DOTALL)
            if not match:
                return None
            try:
                return json.loads(match.group(0))
            except Exception:
                return None

    def _strip_thinking(self, content: str) -> str:
        return re.sub(r"<think>.*?</think>", "", content, flags=re.DOTALL | re.IGNORECASE)

    def person_portrait(self, person_name: str, memory_summaries: list[str], dna: dict | None = None) -> dict:
        """Source-grounded portrait — only uses supplied memory text."""
        if not memory_summaries:
            return {
                "person": person_name,
                "portrait": f"No memories in the archive mention {person_name} yet. Upload files or run the sample archive first.",
                "source_count": 0,
                "disclaimer": "Generated only from saved memories in your archive.",
            }
        context = "\n".join(memory_summaries[:12])
        dna_hint = ""
        if dna:
            dna_hint = (
                f"Values: {', '.join(dna.get('core_values', []))}. "
                f"Places: {', '.join(dna.get('recurring_places', []))}. "
                f"Themes: {', '.join(dna.get('emotional_themes', []))}."
            )
        system = (
            "You write warm, third-person family portraits using ONLY the supplied memory excerpts. "
            "Do not invent facts. If something is unclear, say the archive is still growing. "
            "Write 2 short paragraphs (under 140 words total)."
        )
        user = f"Person: {person_name}\n{dna_hint}\n\nMemory excerpts:\n{context}"
        portrait = self._chat_text(system, user) if self._ollama_enabled() and self._ollama_reachable() else ""
        if not portrait:
            portrait = (
                f"{person_name} appears in {len(memory_summaries)} source memories. "
                f"{dna.get('what_shaped_them', '') if dna else ''} "
                "The archive is still revealing their story."
            ).strip()
        return {
            "person": person_name,
            "portrait": portrait,
            "source_count": len(memory_summaries),
            "disclaimer": "Portrait generated only from your uploaded memories — not a real-time person.",
        }

    def fallback_answer(self, memory_summaries: list[str]) -> str:
        return "I found these connected memories: " + " ".join(memory_summaries[:3])

    def template_answer(self, query: str, memory_summaries: list[str], relationships: list[str]) -> str:
        """Fast, source-grounded narrative when Ollama is off or unreachable (demo / dev)."""
        highlights = []
        for line in memory_summaries[:4]:
            cleaned = line.split(":", 1)[-1].strip()
            if cleaned:
                highlights.append(cleaned[:180])
        relation_hint = ""
        if relationships:
            relation_hint = f" Connections include {relationships[0]}."
        body = " ".join(highlights)
        if not body:
            return self.fallback_answer(memory_summaries)
        return (
            f"From your archive, here is what connects to “{query.strip()[:120]}”: {body}"
            f"{relation_hint} Each point comes from the source memories listed beside this chapter."
        )

    def fallback_enrichment(self, text: str) -> StructuredMemory:
        years = sorted(set(re.findall(r"\b(?:19|20)\d{2}\b", text)))
        title_words = re.findall(r"\b[A-Z][a-zA-Z]+\b", text)
        people = []
        places = []
        place_words = {"mumbai", "delhi", "pune", "bangalore", "kolkata", "chennai", "oakland", "moab", "sf"}
        for word in title_words:
            lowered = word.lower()
            if lowered in {"i", "we", "my", "during", "summer", "today"}:
                continue
            if lowered in place_words:
                places.append(word)
            elif word not in people:
                people.append(word)

        events = []
        event_keywords = {
            "wedding": "Wedding",
            "graduation": "Graduation",
            "internship": "Internship",
            "vacation": "Vacation",
            "college": "College",
            "business": "Business Launch",
        }
        lowered_text = text.lower()
        for keyword, label in event_keywords.items():
            if keyword in lowered_text:
                events.append(label)

        summary = text.strip().splitlines()[0][:240]
        if len(text.strip()) > 240:
            summary += "..."

        return StructuredMemory(
            people=people[:8],
            places=sorted(set(places)),
            events=sorted(set(events)),
            dates=years,
            summary=summary,
        )


ai_provider = AIProvider()
