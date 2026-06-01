# Updated by GitHub contribution automation.
"""Lightweight agents package for MemoryGraph backend.
Includes: ExtractionAgent, SearchAgent, InsightsAgent, ChatAgent, TimelineAgent and AgentManager.
"""
from typing import Any, Dict, List
import logging
import re
import math
from collections import defaultdict, Counter
from datetime import datetime

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

class BaseAgent:
    def __init__(self, name: str):
        self.name = name

    def start(self) -> None:
        logger.info(f"{self.name} started")

    def stop(self) -> None:
        logger.info(f"{self.name} stopped")

    def status(self) -> Dict[str, Any]:
        return {"name": self.name, "status": "idle"}

    def handle(self, *args, **kwargs):
        raise NotImplementedError("handle must be implemented by subclasses")

class ExtractionAgent(BaseAgent):
    def __init__(self):
        super().__init__("ExtractionAgent")

    def extract_entities(self, text: str) -> Dict[str, List[str]]:
        entities: Dict[str, List[str]] = {}
        entities["urls"] = re.findall(r"https?://\S+", text)
        entities["emails"] = re.findall(r"[\w\.-]+@[\w\.-]+", text)
        entities["dates"] = re.findall(r"\b(?:\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b", text)
        entities["proper_nouns"] = re.findall(r"\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b", text)
        return entities

def _tokenize(text: str) -> List[str]:
    return [t for t in re.findall(r"\w+", text.lower()) if len(t) > 1]

class SearchAgent(BaseAgent):
    def __init__(self):
        super().__init__("SearchAgent")
        self.docs: Dict[str, str] = {}
        self.doc_term_freq: Dict[str, Counter] = {}
        self.term_doc_count = defaultdict(int)
        self.N = 0

    def index(self, doc_id: str, text: str) -> None:
        tokens = _tokenize(text)
        tf = Counter(tokens)
        if doc_id in self.docs:
            old = self.doc_term_freq.get(doc_id, Counter())
            for term in old:
                self.term_doc_count[term] -= 1
                if self.term_doc_count[term] <= 0:
                    del self.term_doc_count[term]
        self.docs[doc_id] = text
        self.doc_term_freq[doc_id] = tf
        for term in tf:
            self.term_doc_count[term] += 1
        self.N = len(self.docs)

    def _tfidf_vector(self, tf: Counter) -> Dict[str, float]:
        vec: Dict[str, float] = {}
        for term, freq in tf.items():
            idf = math.log((self.N + 1) / (1 + self.term_doc_count.get(term, 0))) + 1
            vec[term] = freq * idf
        return vec

    def _cosine_sim(self, a: Dict[str, float], b: Dict[str, float]) -> float:
        num = 0.0
        sa = 0.0
        sb = 0.0
        for k, v in a.items():
            sa += v * v
            if k in b:
                num += v * b[k]
        for v in b.values():
            sb += v * v
        if sa == 0 or sb == 0:
            return 0.0
        return num / (math.sqrt(sa) * math.sqrt(sb))

    def search(self, query: str, top_k: int = 5) -> List[Dict]:
        qtf = Counter(_tokenize(query))
        qvec = self._tfidf_vector(qtf)
        results: List[Dict] = []
        for doc_id, tf in self.doc_term_freq.items():
            dvec = self._tfidf_vector(tf)
            score = self._cosine_sim(qvec, dvec)
            if score > 0:
                results.append({"id": doc_id, "score": score, "text": self.docs[doc_id]})
        results.sort(key=lambda x: x["score"], reverse=True)
        return results[:top_k]

class InsightsAgent(BaseAgent):
    def __init__(self, search_agent=None):
        super().__init__("InsightsAgent")
        self.search_agent = search_agent

    def corpus_stats(self) -> Dict[str, Any]:
        if not self.search_agent:
            return {}
        docs = self.search_agent.docs
        term_counts = Counter()
        lengths: List[int] = []
        for t in docs.values():
            tokens = re.findall(r"\w+", t.lower())
            term_counts.update(tokens)
            lengths.append(len(tokens))
        return {
            "num_documents": len(docs),
            "avg_doc_length": (sum(lengths) / len(lengths)) if lengths else 0,
            "top_terms": term_counts.most_common(20),
        }

class ChatAgent(BaseAgent):
    def __init__(self, search_agent=None, extraction_agent=None):
        super().__init__("ChatAgent")
        self.search_agent = search_agent
        self.extraction_agent = extraction_agent

    def answer(self, query: str) -> str:
        context = ""
        hits: List[Dict] = []
        if self.search_agent:
            hits = self.search_agent.search(query, top_k=3)
            if hits:
                context = "\n---\n".join([h["text"] for h in hits])
        entities = {}
        if self.extraction_agent and context:
            entities = self.extraction_agent.extract_entities(context)
        resp = f"Query: {query}\n"
        if context:
            resp += f"Found {len(hits)} relevant documents. Sample:\n{hits[0]['text'][:500]}\n"
        if entities:
            resp += "Extracted entities: " + str({k: len(v) for k, v in entities.items()}) + "\n"
        if not context and not entities:
            resp += "No context found; please provide more details."
        return resp

class TimelineAgent(BaseAgent):
    def __init__(self):
        super().__init__("TimelineAgent")

    def _parse_date(self, text: str):
        m = re.search(r"(\d{4}-\d{2}-\d{2})", text)
        if m:
            try:
                return datetime.fromisoformat(m.group(1))
            except:
                pass
        m = re.search(r"(\d{1,2}/\d{1,2}/\d{2,4})", text)
        if m:
            for fmt in ("%d/%m/%Y", "%m/%d/%Y", "%d/%m/%y"):
                try:
                    return datetime.strptime(m.group(1), fmt)
                except:
                    continue
        return None

    def build_timeline(self, items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        parsed: List[Dict[str, Any]] = []
        for it in items:
            dt = it.get("date")
            if not dt:
                dt = self._parse_date(it.get("text", "")) or None
            if isinstance(dt, str):
                try:
                    dt = datetime.fromisoformat(dt)
                except:
                    dt = None
            parsed.append({"id": it.get("id"), "text": it.get("text"), "date": dt})
        parsed.sort(key=lambda x: (x["date"] is None, x["date"] or datetime.max))
        return parsed

class AgentManager:
    def __init__(self):
        self.extraction = ExtractionAgent()
        self.search = SearchAgent()
        self.insights = InsightsAgent(search_agent=self.search)
        self.chat = ChatAgent(search_agent=self.search, extraction_agent=self.extraction)
        self.timeline = TimelineAgent()

    def index_document(self, doc_id: str, text: str) -> None:
        self.search.index(doc_id, text)

    def get_insights(self):
        return self.insights.corpus_stats()

    def answer(self, query: str) -> str:
        return self.chat.answer(query)

    def extract(self, text: str):
        return self.extraction.extract_entities(text)

    def build_timeline(self, items):
        return self.timeline.build_timeline(items)
