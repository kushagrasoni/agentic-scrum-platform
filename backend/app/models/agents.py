"""
Agent Models
Pydantic models for agent execution and status
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, List, Literal
from datetime import datetime


class ExecutionRequest(BaseModel):
    llmProfileId: str
    inputs: Dict[str, str] = Field(default_factory=dict)


class SingleAgentRequest(BaseModel):
    """Request body for ad-hoc single-agent execution."""
    llmProfileId: str = Field(..., description="LLM profile to use for the run")
    agentName: Literal[
        "product_owner",
        "scrum_master",
        "tech_lead",
        "developer",
        "qa_automation",
        "release_manager",
    ]
    inputs: Dict[str, str] = Field(default_factory=dict, description="Input fields for the agent")
    context: Dict[str, str] = Field(default_factory=dict, description="Optional context (previous artifacts, notes)")


class SingleAgentResponse(BaseModel):
    """Response for ad-hoc single-agent execution."""
    sessionId: str
    agent: str
    output: str
    status: Literal["completed", "error"]


class RegenerateItemRequest(BaseModel):
    """Request body for item-level regeneration with optional user feedback."""
    feedback: Optional[str] = Field(default="", description="User feedback to guide regeneration")


class ExecutionResponse(BaseModel):
    sessionId: str
    status: str
    message: str


class AgentStatus(BaseModel):
    name: str
    status: Literal["waiting", "running", "completed", "error"]
    progress: int
    error: Optional[str] = None


class AgentStatusResponse(BaseModel):
    sessionId: str
    status: Literal["running", "completed", "error", "cancelled"]
    agents: List[AgentStatus]
    artifacts: List[str]


class Session(BaseModel):
    id: str
    createdAt: datetime
    completedAt: Optional[datetime] = None
    status: Literal["running", "completed", "error", "cancelled"]
    config: Dict
    agents: List[AgentStatus] = []
    artifacts: List["Artifact"] = []
    checkpoints: Optional[List[Dict]] = []
    logs: Optional[List[Dict]] = []
    error: Optional[str] = None


class Artifact(BaseModel):
    name: str
    path: str
    size: int
    type: str
    createdAt: datetime
