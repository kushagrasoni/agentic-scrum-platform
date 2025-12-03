"""
Telemetry Router
Endpoints for LLM telemetry data - token usage, costs, latency
"""

from fastapi import APIRouter, HTTPException
from app.models.telemetry import SessionTelemetry, TelemetrySummary, AgentTelemetry
from app.services import get_storage_service
from typing import Optional, List
import logging
import json
import os

router = APIRouter()
logger = logging.getLogger(__name__)


# IMPORTANT: Static routes MUST come before dynamic routes like /{session_id}
# Otherwise FastAPI will try to match "summary" as a session_id

@router.get("/summary")
async def get_telemetry_summary(limit: int = 50):
    """
    Get aggregated telemetry summary across all sessions.
    Returns data in format expected by frontend TelemetrySummary interface.
    """
    try:
        storage = get_storage_service()
        
        # Initialize aggregates
        total_sessions = 0
        total_tokens = 0
        total_input_tokens = 0
        total_output_tokens = 0
        total_cost = 0.0
        total_latency = 0
        model_usage = {}  # model -> total tokens
        provider_usage = {}  # provider -> total tokens
        
        # List all session directories
        if not os.path.exists(storage.base_dir):
            return {
                "success": True, 
                "data": {
                    "totalSessions": 0,
                    "totalTokens": 0,
                    "totalInputTokens": 0,
                    "totalOutputTokens": 0,
                    "totalEstimatedCost": 0.0,
                    "avgTokensPerSession": 0,
                    "avgLatencyPerSession": 0,
                    "modelUsage": {},
                    "providerUsage": {}
                }
            }
        
        session_dirs = [
            d for d in os.listdir(storage.base_dir) 
            if os.path.isdir(os.path.join(storage.base_dir, d))
        ]
        
        for session_id in session_dirs:
            telemetry_file = os.path.join(storage.base_dir, session_id, "telemetry.json")
            
            if os.path.exists(telemetry_file):
                try:
                    with open(telemetry_file, "r") as f:
                        telemetry = json.load(f)
                    
                    total_sessions += 1
                    session_tokens = telemetry.get("total_tokens", 0)
                    session_input = telemetry.get("total_input_tokens", 0)
                    session_output = telemetry.get("total_output_tokens", 0)
                    session_cost = telemetry.get("total_cost_usd", 0)
                    session_latency = telemetry.get("total_latency_ms", 0)
                    
                    total_tokens += session_tokens
                    total_input_tokens += session_input
                    total_output_tokens += session_output
                    total_cost += session_cost
                    total_latency += session_latency
                    
                    # Aggregate by model
                    model = telemetry.get("model", "unknown")
                    if model not in model_usage:
                        model_usage[model] = 0
                    model_usage[model] += session_tokens
                    
                    # Aggregate by provider
                    provider = telemetry.get("provider", "unknown")
                    if provider not in provider_usage:
                        provider_usage[provider] = 0
                    provider_usage[provider] += session_tokens
                        
                except Exception as e:
                    logger.warning(f"Failed to parse telemetry for session {session_id}: {e}")
                    continue
        
        # Build response in frontend format
        summary = {
            "totalSessions": total_sessions,
            "totalTokens": total_tokens,
            "totalInputTokens": total_input_tokens,
            "totalOutputTokens": total_output_tokens,
            "totalEstimatedCost": round(total_cost, 6),
            "avgTokensPerSession": round(total_tokens / total_sessions, 0) if total_sessions > 0 else 0,
            "avgLatencyPerSession": round(total_latency / total_sessions, 0) if total_sessions > 0 else 0,
            "modelUsage": model_usage,
            "providerUsage": provider_usage
        }
        
        logger.info(f"Telemetry summary: {total_sessions} sessions, {total_tokens} tokens, ${total_cost:.4f}")
        return {"success": True, "data": summary}
        
    except Exception as e:
        logger.error(f"Failed to get telemetry summary: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/models")
async def get_model_pricing():
    """
    Get available model pricing information.
    """
    from app.models.telemetry import MODEL_PRICING
    return {"success": True, "data": MODEL_PRICING}


# Dynamic route MUST come last
@router.get("/{session_id}")
async def get_session_telemetry(session_id: str):
    """
    Get telemetry data for a specific session.
    """
    try:
        storage = get_storage_service()
        
        # Try to load telemetry from saved artifact
        output_dir = os.path.join(storage.base_dir, session_id)
        telemetry_file = os.path.join(output_dir, "telemetry.json")
        
        if os.path.exists(telemetry_file):
            with open(telemetry_file, "r") as f:
                telemetry_data = json.load(f)
            return {"success": True, "data": telemetry_data}
        
        # Fallback: Check session metadata
        metadata_file = os.path.join(output_dir, "session_metadata.json")
        if os.path.exists(metadata_file):
            with open(metadata_file, "r") as f:
                metadata = json.load(f)
            if "telemetry" in metadata:
                return {"success": True, "data": metadata["telemetry"]}
        
        # No telemetry found
        return {
            "success": False, 
            "data": None,
            "message": "No telemetry data found for this session"
        }
        
    except Exception as e:
        logger.error(f"Failed to get session telemetry: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
