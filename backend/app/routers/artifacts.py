"""
Artifacts Router
Handles artifact listing, viewing, and downloading
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, StreamingResponse
from app.models import Artifact, ApiResponse
from app.services import get_storage_service
from typing import List
import logging
import io

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/{session_id}")
async def list_artifacts(session_id: str):
    """List all artifacts for a session"""
    try:
        storage = get_storage_service()
        artifacts = storage.list_artifacts(session_id)
        
        logger.info(f"Retrieved {len(artifacts)} artifacts for session {session_id}")
        
        return ApiResponse(
            success=True,
            message=f"Found {len(artifacts)} artifacts",
            data=artifacts
        )
    except Exception as e:
        logger.error(f"Failed to list artifacts for session {session_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{session_id}/download/{filename}")
async def download_artifact(session_id: str, filename: str):
    """Download a specific artifact"""
    try:
        storage = get_storage_service()
        content = storage.get_artifact(session_id, filename)
        
        if content is None:
            raise HTTPException(status_code=404, detail="Artifact not found")
        
        logger.info(f"Downloading artifact {filename} from session {session_id}")
        
        # Return as file download
        return StreamingResponse(
            io.BytesIO(content.encode('utf-8')),
            media_type="text/markdown",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to download artifact {filename} from session {session_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{session_id}/download")
async def download_all_artifacts(session_id: str):
    """Download all artifacts as a ZIP file"""
    try:
        storage = get_storage_service()
        zip_path = storage.create_zip_archive(session_id)
        
        if not zip_path or not zip_path.exists():
            raise HTTPException(status_code=404, detail="Session not found or no artifacts available")
        
        logger.info(f"Downloading all artifacts for session {session_id}")
        
        return FileResponse(
            zip_path,
            media_type="application/zip",
            filename=f"{session_id}.zip",
            headers={
                "Content-Disposition": f"attachment; filename={session_id}.zip"
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to download artifacts for session {session_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
