from .enrichment import EnrichmentService
from .memory import MemoryService
from sqlalchemy.orm import Session

class ChatService:
    def __init__(self, memory_service: MemoryService | None = None):
        self.memory_service = memory_service or MemoryService()
        self.enrichment = EnrichmentService()

    async def query_memory_graph(self, user_query: str, db: Session, user_id: str):
        memories = self.memory_service.search_memories(db, user_id, user_query, limit=5)
        relationships = self.memory_service.storage.get_relationships_for_query(user_query, user_id=user_id)
        summaries = [
            f"{memory.memory_id}: {memory.structured_data.summary or memory.raw_text[:300]}"
            for memory in memories
        ]
        relationship_text = [
            f"{item['source']} {item['relation']} {item['target']}"
            for item in relationships
        ]
        answer = self.enrichment.synthesize_answer(user_query, summaries, relationship_text)

        return {
            "answer": answer,
            "sources": [memory.model_dump(mode="json") for memory in memories],
            "relationships": relationships
        }
