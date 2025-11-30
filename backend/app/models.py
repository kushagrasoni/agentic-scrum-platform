"""
Pydantic Models for API Request/Response
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, List, Literal, Any
from datetime import datetime


# Configuration Models
class OllamaConfigModel(BaseModel):
    mode: Literal["ollama"] = "ollama"
    url: str
    model: str


class OpenAIConfigModel(BaseModel):
    mode: Literal["openai"] = "openai"
    apiKey: str = Field(..., alias="apiKey")
    model: str


class AzureConfigModel(BaseModel):
    mode: Literal["azure"] = "azure"
    apiKey: str = Field(..., alias="apiKey")
    endpoint: str
    deployment: str
    apiVersion: str = Field(..., alias="apiVersion")


# Execution Models
class ExecutionRequest(BaseModel):
    llmProfileId: Optional[str] = None
    config: Optional[OllamaConfigModel | OpenAIConfigModel | AzureConfigModel] = None
    inputs: Dict[str, str] = Field(default_factory=dict)


class ExecutionResponse(BaseModel):
    sessionId: str
    status: str
    message: str


# Agent Status Models
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


# Session Models
class Session(BaseModel):
    id: str
    createdAt: datetime
    completedAt: Optional[datetime] = None
    status: Literal["running", "completed", "error", "cancelled"]
    config: Dict
    agents: List[str]
    artifacts: List[str]
    error: Optional[str] = None


# Artifact Models
class Artifact(BaseModel):
    name: str
    path: str
    size: int
    type: str
    createdAt: datetime


# Response Models
class ApiResponse(BaseModel):
    success: bool
    data: Optional[Any] = None
    error: Optional[str] = None
    message: Optional[str] = None


class TestConnectionResponse(BaseModel):
    success: bool
    message: str
    models: Optional[List[str]] = None
