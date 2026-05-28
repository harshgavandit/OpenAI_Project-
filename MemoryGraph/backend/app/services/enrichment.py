import json
import os
import re

from dotenv import load_dotenv
try:
    from openai import OpenAI
except Exception:
    OpenAI = None

from app.models.memory import StructuredMemory

load_dotenv()


class EnrichmentService:
    def __init__(self):
        api_key = os.getenv("OPENAI_API_KEY")
        self.client = OpenAI(api_key=api_key) if (api_key and OpenAI) else None
        self.model = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")

    def enrich_text(self, text: str) -> StructuredMemory:
        if not text.strip():
            return StructuredMemory()

        if not self.client:
            return self._fallback_enrichment(text)

        prompt = (
            "Extract structured memory data from the user's text. "
            "Return only JSON with these keys: people, places, events, dates, summary. "
            "Each list should contain concise human-readable strings. "
            "The summary should be one short sentence."
        )

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": prompt},
                    {"role": "user", "content": text[:12000]},
                ],
                temperature=0.2,
            )
            content = response.choices[0].message.content or "{}"
            data = json.loads(content)
            return StructuredMemory(**data)
        except Exception:
            return self._fallback_enrichment(text)

    def synthesize_answer(
        self,
        query: str,
        memory_summaries: list[str],
        relationships: list[str],
    ) -> str:
        if not memory_summaries:
            return "I do not remember anything matching that yet."

        if not self.client:
            return "I found these connected memories: " + " ".join(memory_summaries[:3])

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are MemoryGraph AI, a Human Memory Operating System. "
                            "Answer warmly and concisely using only the supplied memory context."
                        ),
                    },
                    {
                        "role": "user",
                        "content": (
                            f"Query: {query}\n\n"
                            f"Memory context:\n{chr(10).join(memory_summaries)}\n\n"
                            f"Relationships:\n{chr(10).join(relationships)}"
                        ),
                    },
                ],
                temperature=0.3,
            )
            return response.choices[0].message.content or "I found related memories, but could not summarize them."
        except Exception:
            return "I found these connected memories: " + " ".join(memory_summaries[:3])

    def _fallback_enrichment(self, text: str) -> StructuredMemory:
        years = sorted(set(re.findall(r"\b(?:19|20)\d{2}\b", text)))
        title_words = re.findall(r"\b[A-Z][a-zA-Z]+\b", text)
        people = []
        places = []
        for word in title_words:
            lowered = word.lower()
            if lowered in {"i", "we", "my", "during", "summer"}:
                continue
            if lowered in {"mumbai", "delhi", "pune", "bangalore", "kolkata", "chennai"}:
                places.append(word)
            elif word not in people:
                people.append(word)

        summary = text.strip().splitlines()[0][:240]
        if len(text.strip()) > 240:
            summary += "..."

        return StructuredMemory(
            people=people[:8],
            places=sorted(set(places)),
            events=[],
            dates=years,
            summary=summary,
        )
