import os
import hashlib
import networkx as nx
try:
    import chromadb
    from chromadb.config import Settings
    _CHROMADB_AVAILABLE = True
except Exception:
    chromadb = None
    Settings = None
    _CHROMADB_AVAILABLE = False
from dotenv import load_dotenv
from pathlib import Path

# Simple in-memory fallback collection when chromadb is not available (used for tests/dev)
class SimpleInMemoryCollection:
    def __init__(self):
        self._docs: dict[str, str] = {}
        self._metas: dict[str, dict] = {}

    def upsert(self, documents, ids, metadatas):
        for _id, doc, meta in zip(ids, documents, metadatas):
            self._docs[_id] = doc
            try:
                self._metas[_id] = meta or {}
            except Exception:
                self._metas[_id] = {}

    def query(self, query_texts=None, n_results=5, where=None):
        q = (query_texts[0] if query_texts else "") or ""
        q_lower = q.lower()
        matches = []
        for _id, doc in self._docs.items():
            if where and where.get("user_id"):
                if self._metas.get(_id, {}).get("user_id") != where.get("user_id"):
                    continue
            score = 1 if q_lower in doc.lower() else 0
            matches.append((_id, score))
        matches.sort(key=lambda x: -x[1])
        ids = [m[0] for m in matches[:n_results]]
        return {"ids": [ids]}

from app.models.memory import MemoryRecord
from app.services.ai_provider import ai_provider

load_dotenv()


class SimpleEmbeddingFunction:
    fallback_dimensions = 768

    def __call__(self, input):
        return [self._embed(text) for text in input]

    def _embed(self, text: str):
        ollama_embedding = ai_provider.embed_text(text)
        if ollama_embedding:
            return ollama_embedding

        vector = [0.0] * self.fallback_dimensions
        for token in text.lower().split():
            digest = hashlib.sha256(token.encode("utf-8")).digest()
            index = digest[0] % len(vector)
            vector[index] += 1.0
        magnitude = sum(value * value for value in vector) ** 0.5 or 1.0
        return [value / magnitude for value in vector]

class StorageService:
    def __init__(self):
        self.backend_dir = Path(__file__).resolve().parents[2]
        self.data_dir = self.backend_dir / "data"
        self.data_dir.mkdir(parents=True, exist_ok=True)

        chroma_path = os.getenv("CHROMA_DB_PATH", str(self.data_dir / "chromadb"))
        if _CHROMADB_AVAILABLE and chromadb is not None:
            try:
                self.chroma_client = chromadb.PersistentClient(
                    path=chroma_path,
                    settings=Settings(anonymized_telemetry=False),
                )
                self.collection = self.chroma_client.get_or_create_collection(
                    name="memories",
                    embedding_function=SimpleEmbeddingFunction(),
                )
            except Exception:
                # Fall back to in-memory collection if chromadb initialization fails
                self.chroma_client = None
                self.collection = SimpleInMemoryCollection()
        else:
            self.chroma_client = None
            self.collection = SimpleInMemoryCollection()

        self.graph = nx.Graph()

    def save_semantic_memory(self, memory_id: str, text: str, metadata: dict | None = None):
        self.collection.upsert(
            documents=[text],
            ids=[memory_id],
            metadatas=[metadata or {"source": "upload"}]
        )

    def index_memory(self, record: MemoryRecord):
        semantic_text = " ".join(
            part
            for part in [
                record.raw_text,
                record.structured_data.summary,
                " ".join(record.structured_data.people),
                " ".join(record.structured_data.places),
                " ".join(record.structured_data.events),
                " ".join(record.structured_data.dates),
            ]
            if part
        )
        self.save_semantic_memory(
            record.memory_id,
            semantic_text or record.metadata.original_filename,
            {
                "source": "upload",
                "user_id": record.user_id or "",
                "filename": record.metadata.original_filename,
                "summary": record.structured_data.summary[:500],
            },
        )
        self.save_memory_relationships(record)

    def save_memory_relationships(self, record: MemoryRecord):
        memory_node = f"memory:{record.memory_id}"
        self.graph.add_node(
            memory_node,
            type="memory",
            user_id=record.user_id or "",
            label=record.structured_data.summary or record.metadata.original_filename,
        )

        relationship_sets = {
            "MENTIONED_IN": ("person", record.structured_data.people),
            "LOCATION_OF": ("place", record.structured_data.places),
            "EVENT_IN": ("event", record.structured_data.events),
            "DATE_OF": ("date", record.structured_data.dates),
        }
        for relation, (node_type, values) in relationship_sets.items():
            for value in values:
                if not value:
                    continue
                entity_node = f"{node_type}:{record.user_id or 'public'}:{value}"
                self.graph.add_node(entity_node, type=node_type, user_id=record.user_id or "", label=value)
                self.graph.add_edge(entity_node, memory_node, relation=relation)
                self.graph.add_node(value, type=node_type, user_id=record.user_id or "", label=value)
                self.graph.add_edge(value, memory_node, relation=relation)

        self.save_graph()

    def save_graph_relationship(self, entity_a: str, relation: str, entity_b: str):
        self.graph.add_node(entity_a, type="entity")
        self.graph.add_node(entity_b, type="entity")
        self.graph.add_edge(entity_a, entity_b, relation=relation)
        self.save_graph()

    def search_index_ids(self, query: str, limit: int = 5, user_id: str | None = None) -> list[str]:
        try:
            where = {"user_id": user_id} if user_id else None
            results = self.collection.query(query_texts=[query], n_results=limit, where=where)
            return list(results.get("ids", [[]])[0])
        except Exception:
            return []

    def get_relationships_for_query(
        self,
        query: str,
        limit: int = 20,
        user_id: str | None = None,
        terms: list[str] | None = None,
    ) -> list[dict[str, str]]:
        needles = [t.lower() for t in (terms or []) if t]
        if not needles:
            needles = [query.lower()] if query else []
        relationships = []
        for source, target, data in self.graph.edges(data=True):
            source_user = self.graph.nodes[source].get("user_id", "")
            target_user = self.graph.nodes[target].get("user_id", "")
            if user_id and user_id not in {source_user, target_user}:
                continue
            source_label = str(source)
            target_label = str(target)
            relation = data.get("relation", "RELATED_TO")
            haystack = f"{source_label} {target_label} {relation}".lower()
            if not needles or any(needle in haystack for needle in needles):
                relationships.append({"source": source_label, "relation": relation, "target": target_label})
            if len(relationships) >= limit:
                break
        return relationships

    def save_graph(self):
        return None

    def close(self):
        pass
