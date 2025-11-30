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
    """Get details of a specific session"""
    try:
        storage = get_storage_service()
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
