from app.models.memory import StructuredMemory
from app.services.ai_provider import ai_provider


class EnrichmentService:
    def __init__(self):
        self.provider = ai_provider

    def enrich_text(self, text: str) -> StructuredMemory:
        return self.provider.enrich_text(text)

    def synthesize_answer(
        self,
        query: str,
        memory_summaries: list[str],
        relationships: list[str],
    ) -> str:
        return self.provider.synthesize_answer(query, memory_summaries, relationships)

    def _fallback_enrichment(self, text: str) -> StructuredMemory:
        return self.provider.fallback_enrichment(text)
