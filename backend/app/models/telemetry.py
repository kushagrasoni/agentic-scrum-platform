"""
Telemetry Models
Data models for LLM telemetry tracking - tokens, costs, latency
"""
from __future__ import annotations

from typing import Optional, List, Dict
from datetime import datetime
from pydantic import BaseModel, Field


# Cost per 1K tokens (USD) - Updated Dec 2024
MODEL_PRICING = {
    # OpenAI Models
    "gpt-4o": {"input": 0.0025, "output": 0.01},
    "gpt-4o-mini": {"input": 0.00015, "output": 0.0006},
    "gpt-4-turbo": {"input": 0.01, "output": 0.03},
    "gpt-4": {"input": 0.03, "output": 0.06},
    "gpt-3.5-turbo": {"input": 0.0005, "output": 0.0015},
    # Azure deployments (same pricing as OpenAI)
    "gpt-4o-deployment": {"input": 0.0025, "output": 0.01},
    # Ollama/Local (free)
    "llama2": {"input": 0.0, "output": 0.0},
    "llama3": {"input": 0.0, "output": 0.0},
    "mistral": {"input": 0.0, "output": 0.0},
    "codellama": {"input": 0.0, "output": 0.0},
    # Default fallback
    "default": {"input": 0.002, "output": 0.002},
}


class AgentTelemetry(BaseModel):
    """Telemetry data for a single agent execution."""
    agent_name: str
    agent_label: str
    model: str
    input_tokens: int = 0
    output_tokens: int = 0
    total_tokens: int = 0
    latency_ms: int = 0
    cost_usd: float = 0.0
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    status: str = "pending"  # pending, running, completed, error
    error_message: Optional[str] = None


class SessionTelemetry(BaseModel):
    """Aggregated telemetry for an entire workflow session."""
    session_id: str
    model: str
    provider: str  # ollama, openai, azure
    
    # Aggregate metrics
    total_input_tokens: int = 0
    total_output_tokens: int = 0
    total_tokens: int = 0
    total_cost_usd: float = 0.0
    total_latency_ms: int = 0
    avg_tokens_per_second: float = 0.0
    
    # Per-agent breakdown
    agents: List[AgentTelemetry] = Field(default_factory=list)
    
    # Timing
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    
    # Status
    agents_completed: int = 0
    agents_total: int = 5
    status: str = "pending"  # pending, running, completed, error


class TelemetrySummary(BaseModel):
    """Summary statistics across multiple sessions."""
    total_sessions: int = 0
    total_tokens_used: int = 0
    total_cost_usd: float = 0.0
    avg_tokens_per_session: float = 0.0
    avg_cost_per_session: float = 0.0
    avg_latency_ms: float = 0.0
    
    # By model breakdown
    by_model: Dict[str, Dict[str, float]] = Field(default_factory=dict)
    
    # By agent breakdown
    by_agent: Dict[str, Dict[str, float]] = Field(default_factory=dict)
    
    # Recent sessions (for trend)
    recent_sessions: List[SessionTelemetry] = Field(default_factory=list)


def estimate_tokens(text: str) -> int:
    """
    Estimate token count from text.
    Uses approximation: ~4 characters per token for English text.
    For more accurate counts, use tiktoken library.
    """
    if not text:
        return 0
    # Rough estimation: 1 token ~= 4 characters
    return max(1, len(text) // 4)


def calculate_cost(model: str, input_tokens: int, output_tokens: int) -> float:
    """
    Calculate cost in USD based on model and token counts.
    
    Args:
        model: Model name/deployment name
        input_tokens: Number of input tokens
        output_tokens: Number of output tokens
    
    Returns:
        Cost in USD
    """
    # Normalize model name (lowercase, remove common suffixes)
    model_key = model.lower().replace("-deployment", "").replace("_deployment", "")
    
    # Find pricing (try exact match first, then partial match, then default)
    pricing = MODEL_PRICING.get(model_key)
    
    if not pricing:
        # Try partial match
        for key in MODEL_PRICING:
            if key in model_key or model_key in key:
                pricing = MODEL_PRICING[key]
                break
    
    if not pricing:
        pricing = MODEL_PRICING["default"]
    
    input_cost = (input_tokens / 1000) * pricing["input"]
    output_cost = (output_tokens / 1000) * pricing["output"]
    
    return round(input_cost + output_cost, 6)
