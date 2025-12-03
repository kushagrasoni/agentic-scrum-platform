"""
Sessions Router
Handles session management and history
"""

from fastapi import APIRouter, HTTPException
from app.models import Session, ApiResponse
from app.services import get_storage_service
from typing import List
from datetime import datetime
import logging
import json

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("")
async def list_sessions():
    """Get all execution sessions"""
    try:
        storage = get_storage_service()
        sessions = storage.list_sessions()
        
        logger.info(f"Retrieved {len(sessions)} sessions")
        
        return ApiResponse(
            success=True,
            message=f"Found {len(sessions)} sessions",
            data=sessions
        )
    except Exception as e:
        logger.error(f"Failed to list sessions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{session_id}")
async def get_session(session_id: str):
    """Get details of a specific session - checks active sessions first, then disk"""
    try:
        # Import active_sessions from agents router
        from app.routers.agents import active_sessions
        from app.models import AgentStatus
        from datetime import datetime
        
        storage = get_storage_service()
        
        # Check if session is active (running)
        if session_id in active_sessions:
            logger.info(f"Fetching active session {session_id} from memory")
            session_data = active_sessions[session_id]
            
            # Convert to Session model format
            agents_list = []
            for agent in session_data.get("agents", []):
                if isinstance(agent, dict):
                    agents_list.append(agent)
                    
            # Get artifacts from disk if any
            artifacts_list = storage.list_artifacts(session_id)
            
            # Parse timestamps
            created_at = session_data.get("createdAt")
            if isinstance(created_at, str):
                created_at = datetime.fromisoformat(created_at)
            elif not isinstance(created_at, datetime):
                created_at = datetime.now()
            
            # Return active session data
            return ApiResponse(
                success=True,
                data={
                    "id": session_id,
                    "status": session_data.get("status", "running"),
                    "createdAt": created_at.isoformat(),
                    "completedAt": session_data.get("completedAt"),
                    "config": session_data.get("config", {}),
                    "agents": agents_list,
                    "artifacts": [{"name": a.name, "path": a.path, "size": a.size, "type": a.type, "createdAt": a.createdAt.isoformat()} for a in artifacts_list],
                    "checkpoints": session_data.get("checkpoints", []),
                    "logs": session_data.get("logs", []),
                    "error": session_data.get("error")
                }
            )
        
        # Fall back to disk for completed sessions
        logger.info(f"Fetching completed session {session_id} from disk")
        session = storage.load_session_metadata(session_id)
        
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Reload artifacts to ensure they're up to date
        session.artifacts = storage.list_artifacts(session_id)
        
        return ApiResponse(
            success=True,
            data=session
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get session {session_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{session_id}/structured")
async def get_structured_output(session_id: str):
    """
    Get structured (parsed) output for a session.
    Returns validated JSON schemas instead of raw text.
    """
    try:
        storage = get_storage_service()
        from app.services import get_output_parser_service
        
        # Check if session exists
        session_dir = storage.base_dir / session_id
        if not session_dir.exists():
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Try to load pre-parsed JSON files
        structured_data = {}
        
        # Map of JSON filenames to their keys
        json_files = {
            "po_vision_userstories_ac.json": "epic_vision",
            "scrum_plan_breakdown.json": "sprint_plan",
            "tech_lead_design.json": "technical_design",
            "dev_code_implementation.json": "code_implementation",
            "qa_test_suite.json": "test_suite",
            "release_summary.json": "executive_summary"
        }
        
        for filename, key in json_files.items():
            content = storage.get_artifact(session_id, filename)
            if content:
                try:
                    structured_data[key] = json.loads(content)
                except json.JSONDecodeError:
                    logger.warning(f"Failed to parse JSON from {filename}")
        
        if not structured_data:
            raise HTTPException(status_code=404, detail="No structured data found for this session")
        
        return ApiResponse(
            success=True,
            data={
                "session_id": session_id,
                **structured_data
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get structured output for {session_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{session_id}")
async def delete_session(session_id: str):
    """Delete a session and all its artifacts"""
    try:
        storage = get_storage_service()
        success = storage.delete_session(session_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Session not found")
        
        logger.info(f"Deleted session {session_id}")
        
        return {"success": True, "message": "Session deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete session {session_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
