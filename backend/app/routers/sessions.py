"""
Sessions Router
Handles session management and history
"""

from fastapi import APIRouter, HTTPException
from app.models import Session, ApiResponse
from app.services import get_storage_service
from typing import List
import logging

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
