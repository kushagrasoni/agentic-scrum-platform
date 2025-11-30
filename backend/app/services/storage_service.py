"""
Storage Service
Handles session and artifact storage/retrieval
"""
from __future__ import annotations

import os
import json
import shutil
from typing import List, Optional, Dict
from datetime import datetime
from pathlib import Path
import logging

from app.models import Session, Artifact

logger = logging.getLogger(__name__)


class StorageService:
    """Service for managing session and artifact storage."""
    
    def __init__(self, base_dir: str = "./output"):
        """
        Initialize storage service.
        
        Args:
            base_dir: Base directory for storing outputs
        """
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(parents=True, exist_ok=True)
        logger.info(f"StorageService initialized with base_dir: {self.base_dir}")
    
    def create_session_dir(self, session_id: str) -> Path:
        """
        Create directory for a new session.
        
        Args:
            session_id: Unique session identifier
        
        Returns:
            Path to session directory
        """
        session_dir = self.base_dir / session_id
        session_dir.mkdir(parents=True, exist_ok=True)
        logger.info(f"Created session directory: {session_dir}")
        return session_dir
    
    def save_artifact(
        self,
        session_id: str,
        filename: str,
        content: str
    ) -> Path:
        """
        Save an artifact file for a session.
        
        Args:
            session_id: Session identifier
            filename: Name of the file
            content: File content
        
        Returns:
            Path to saved file
        """
        session_dir = self.create_session_dir(session_id)
        file_path = session_dir / filename
        
        file_path.write_text(content, encoding="utf-8")
        logger.info(f"Saved artifact: {file_path}")
        return file_path
    
    def get_artifact(self, session_id: str, filename: str) -> Optional[str]:
        """
        Retrieve artifact content.
        
        Args:
            session_id: Session identifier
            filename: Name of the file
        
        Returns:
            File content or None if not found
        """
        file_path = self.base_dir / session_id / filename
        
        if not file_path.exists():
            logger.warning(f"Artifact not found: {file_path}")
            return None
        
        return file_path.read_text(encoding="utf-8")
    
    def list_artifacts(self, session_id: str) -> List[Artifact]:
        """
        List all artifacts for a session.
        
        Args:
            session_id: Session identifier
        
        Returns:
            List of artifact metadata
        """
        session_dir = self.base_dir / session_id
        
        if not session_dir.exists():
            logger.warning(f"Session directory not found: {session_dir}")
            return []
        
        artifacts = []
        for file_path in session_dir.iterdir():
            if file_path.is_file():
                stat = file_path.stat()
                artifacts.append(Artifact(
                    name=file_path.name,
                    path=str(file_path.relative_to(self.base_dir)),
                    size=stat.st_size,
                    type=file_path.suffix.lstrip('.') or 'txt',
                    createdAt=datetime.fromtimestamp(stat.st_ctime)
                ))
        
        logger.info(f"Found {len(artifacts)} artifacts for session {session_id}")
        return artifacts
    
    def save_session_metadata(self, session: Session) -> None:
        """
        Save session metadata to JSON file.
        
        Args:
            session: Session object to save
        """
        session_dir = self.create_session_dir(session.id)
        metadata_path = session_dir / "session_metadata.json"
        
        # Convert to dict for JSON serialization
        metadata = session.model_dump(mode='json')
        
        metadata_path.write_text(
            json.dumps(metadata, indent=2),
            encoding="utf-8"
        )
        logger.info(f"Saved session metadata: {metadata_path}")
    
    def load_session_metadata(self, session_id: str) -> Optional[Session]:
        """
        Load session metadata from JSON file.
        
        Args:
            session_id: Session identifier
        
        Returns:
            Session object or None if not found
        """
        metadata_path = self.base_dir / session_id / "session_metadata.json"
        
        if not metadata_path.exists():
            logger.warning(f"Session metadata not found: {metadata_path}")
            return None
        
        metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
        return Session(**metadata)
    
    def list_sessions(self) -> List[Session]:
        """
        List all sessions.
        
        Returns:
            List of session objects
        """
        sessions = []
        
        for session_dir in self.base_dir.iterdir():
            if session_dir.is_dir():
                try:
                    session = self.load_session_metadata(session_dir.name)
                    if session:
                        sessions.append(session)
                except Exception as e:
                    logger.warning(f"Failed to load session {session_dir.name}: {str(e)}")
                    continue
        
        # Sort by creation date (newest first)
        sessions.sort(key=lambda s: s.createdAt, reverse=True)
        logger.info(f"Found {len(sessions)} sessions")
        return sessions
    
    def delete_session(self, session_id: str) -> bool:
        """
        Delete a session and all its artifacts.
        
        Args:
            session_id: Session identifier
        
        Returns:
            True if deleted successfully
        """
        session_dir = self.base_dir / session_id
        
        if not session_dir.exists():
            logger.warning(f"Session directory not found: {session_dir}")
            return False
        
        shutil.rmtree(session_dir)
        logger.info(f"Deleted session: {session_id}")
        return True
    
    def create_zip_archive(self, session_id: str) -> Optional[Path]:
        """
        Create a ZIP archive of all session artifacts.
        
        Args:
            session_id: Session identifier
        
        Returns:
            Path to ZIP file or None if failed
        """
        session_dir = self.base_dir / session_id
        
        if not session_dir.exists():
            logger.warning(f"Session directory not found: {session_dir}")
            return None
        
        zip_path = self.base_dir / f"{session_id}.zip"
        
        shutil.make_archive(
            str(zip_path.with_suffix('')),
            'zip',
            session_dir
        )
        
        logger.info(f"Created ZIP archive: {zip_path}")
        return zip_path


# Global service instance
_storage_service: Optional[StorageService] = None


def get_storage_service() -> StorageService:
    """Get or create storage service singleton."""
    global _storage_service
    if _storage_service is None:
        _storage_service = StorageService()
    return _storage_service
