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
    agents: List[str]
    artifacts: List[str]
    error: Optional[str] = None


class Artifact(BaseModel):
    name: str
    path: str
    size: int
    type: str
    createdAt: datetime
