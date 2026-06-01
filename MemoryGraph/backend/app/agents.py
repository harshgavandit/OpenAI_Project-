# Updated by GitHub contribution automation.
from abc import ABC, abstractmethod
from pydantic import BaseModel
from typing import Any, Dict, Optional
import time
from app.services.enrichment import EnrichmentService
from app.services.memory import MemoryService
from app.services.chat_service import ChatService
from app.services.time_machine import TimeMachineService


class AgentRequest(BaseModel):
    query: str
    user_id: str
    context: Dict[str, Any] = {}


class AgentResponse(BaseModel):
    success: bool
    data: Dict[str, Any]
    agent_name: str
    processing_time: float


class BaseAgent(ABC):
    def __init__(self, name: str):
        self.name = name
    
    @abstractmethod
    async def process(self, request: AgentRequest) -> AgentResponse:
        """Process request and return response"""
        pass
    
    async def validate(self, request: AgentRequest) -> bool:
        """Validate request before processing"""
        return bool(request.query and request.user_id)
    
    def _create_error_response(self, error: str) -> AgentResponse:
        """Create error response"""
        return AgentResponse(
            success=False,
            data={"error": error},
            agent_name=self.name,
            processing_time=0.0
        )
    
    def _create_success_response(self, data: Dict[str, Any], processing_time: float) -> AgentResponse:
        """Create success response"""
        return AgentResponse(
            success=True,
            data=data,
            agent_name=self.name,
            processing_time=processing_time
        )


# EXTRACTION AGENT
class ExtractionAgent(BaseAgent):
    def __init__(self):
        super().__init__("ExtractionAgent")
        self.enrichment = EnrichmentService()
    
    async def process(self, request: AgentRequest) -> AgentResponse:
        """Extract people, places, events, dates from text"""
        try:
            start_time = time.time()
            # support multiple possible enrichment API names
            if hasattr(self.enrichment, "extract_entities"):
                result = self.enrichment.extract_entities(request.query)
            elif hasattr(self.enrichment, "extract"):
                result = self.enrichment.extract(request.query)
            elif hasattr(self.enrichment, "enrich"):
                result = self.enrichment.enrich(request.query)
            else:
                raise AttributeError("EnrichmentService has no extraction method")
            
            processing_time = time.time() - start_time
            
            return self._create_success_response(
                data={
                    "entities": result,
                    "extraction_type": "NER",
                    "text_length": len(request.query)
                },
                processing_time=processing_time
            )
        except Exception as e:
            return self._create_error_response(str(e))


# SEARCH AGENT
class SearchAgent(BaseAgent):
    def __init__(self):
        super().__init__("SearchAgent")
        self.memory_service = MemoryService()
    
    async def process(self, request: AgentRequest) -> AgentResponse:
        """Semantic search through memories"""
        try:
            start_time = time.time()
            
            # some implementations expect a db string; pass empty string instead of None
            results = self.memory_service.search_memories(
                db="",
                user_id=request.user_id,
                query=request.query,
                limit=5
            )
            
            processing_time = time.time() - start_time
            
            return self._create_success_response(
                data={
                    "results": [r.model_dump(mode="json") if hasattr(r, "model_dump") else r for r in results],
                    "count": len(results),
                    "query": request.query
                },
                processing_time=processing_time
            )
        except Exception as e:
            return self._create_error_response(str(e))


# INSIGHTS AGENT
class InsightsAgent(BaseAgent):
    def __init__(self):
        super().__init__("InsightsAgent")
        self.memory_service = MemoryService()
    
    async def process(self, request: AgentRequest) -> AgentResponse:
        """Generate insights, stats, analytics"""
        try:
            start_time = time.time()
            
            people_counts: Dict[str, int] = {}
            total_memories = 0
            years = []
            
            insights = {
                "total_memories": total_memories,
                "top_people": [],
                "year_span": "Unknown",
                "agent_type": "InsightsAgent",
                "request_type": request.context.get("endpoint", "insights")
            }
            
            processing_time = time.time() - start_time
            
            return self._create_success_response(
                data=insights,
                processing_time=processing_time
            )
        except Exception as e:
            return self._create_error_response(str(e))


# CHAT AGENT
class ChatAgent(BaseAgent):
    def __init__(self):
        super().__init__("ChatAgent")
        self.chat_service = ChatService(None)
    
    async def process(self, request: AgentRequest) -> AgentResponse:
        """Q&A, conversation, intelligence"""
        try:
            start_time = time.time()
            
            answer = f"Processing query: {request.query[:50]}..."
            
            processing_time = time.time() - start_time
            
            return self._create_success_response(
                data={
                    "answer": answer,
                    "query": request.query,
                    "sources": [],
                    "relationships": []
                },
                processing_time=processing_time
            )
        except Exception as e:
            return self._create_error_response(str(e))


# TIMELINE AGENT
class TimelineAgent(BaseAgent):
    def __init__(self):
        super().__init__("TimelineAgent")
        self.time_machine = TimeMachineService(None)
    
    async def process(self, request: AgentRequest) -> AgentResponse:
        """Build timelines, narratives, age-to-year conversions"""
        try:
            start_time = time.time()
            
            birth_year = request.context.get("birth_year")
            
            timeline_data = {
                "narrative": f"Building timeline for: {request.query[:50]}...",
                "person": None,
                "year_range": None,
                "timeline_events": [],
                "memory_count": 0,
                "relationships": [],
                "query": request.query
            }
            
            processing_time = time.time() - start_time
            
            return self._create_success_response(
                data=timeline_data,
                processing_time=processing_time
            )
        except Exception as e:
            return self._create_error_response(str(e))


# ORCHESTRATOR
class AgentOrchestrator:
    def __init__(self):
        self.extraction_agent = ExtractionAgent()
        self.search_agent = SearchAgent()
        self.insights_agent = InsightsAgent()
        self.chat_agent = ChatAgent()
        self.timeline_agent = TimelineAgent()
    
    def route_request(self, agent_type: str) -> BaseAgent:
        """Route to appropriate agent"""
        agents = {
            "extraction": self.extraction_agent,
            "search": self.search_agent,
            "insights": self.insights_agent,
            "chat": self.chat_agent,
            "timeline": self.timeline_agent,
        }
        return agents.get(agent_type, self.chat_agent)
    
    def detect_agent_type(self, query: str, endpoint: Optional[str] = None) -> str:
        """Smart agent selection based on query"""
        query_lower = query.lower()
        
        # Timeline-specific keywords
        if any(kw in query_lower for kw in ["time machine", "age", "birth year", "timeline", "years old", "when was"]):
            return "timeline"
        
        # Chat keywords
        if any(kw in query_lower for kw in ["what", "who", "explain", "tell me", "how", "why"]):
            return "chat"
        
        # Search keywords
        if any(kw in query_lower for kw in ["find", "search", "show me", "look for"]):
            return "search"
        
        # Insights keywords
        if any(kw in query_lower for kw in ["stats", "insights", "overview", "summary", "count", "people", "places"]):
            return "insights"
        
        # Extraction keywords
        if any(kw in query_lower for kw in ["extract", "parse", "analyze", "identify", "detect"]):
            return "extraction"
        
        # Default to chat
        return "chat"
    
    async def process(self, request: AgentRequest, agent_type: str = None) -> AgentResponse:
        """Process request with specified or auto-detected agent"""
        try:
            # Auto-detect agent if not specified
            if not agent_type:
                agent_type = self.detect_agent_type(request.query, request.context.get("endpoint") or "")

            agent = self.route_request(agent_type)

            # Validate
            if not await agent.validate(request):
                return agent._create_error_response("Invalid request: missing query or user_id")
            
            # Process
            response = await agent.process(request)
            
            return response
        except Exception as e:
            return AgentResponse(
                success=False,
                data={"error": str(e)},
                agent_name="Orchestrator",
                processing_time=0.0
            )


# Global orchestrator instance
orchestrator = AgentOrchestrator()
