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


@router.get("/{session_id}/export")
async def export_artifacts(session_id: str, format: str = "markdown"):
    """
    Export session artifacts in various formats for integration with external tools.
    Supports: jira (CSV), github (JSON), markdown (MD), confluence (MD)
    """
    try:
        storage = get_storage_service()
        session = storage.load_session_metadata(session_id)
        
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Load all artifacts
        artifacts_content = {}
        for artifact_name in session.artifacts:
            content = storage.get_artifact(session_id, artifact_name)
            if content:
                artifacts_content[artifact_name] = content
        
        if not artifacts_content:
            raise HTTPException(status_code=404, detail="No artifacts found for session")
        
        if format == "jira":
            # Jira CSV format for bulk import
            csv_content = _format_as_jira_csv(artifacts_content, session)
            return StreamingResponse(
                io.BytesIO(csv_content.encode('utf-8')),
                media_type="text/csv",
                headers={"Content-Disposition": f"attachment; filename=jira_import_{session_id}.csv"}
            )
        
        elif format == "github":
            # GitHub Issues JSON format
            json_content = _format_as_github_json(artifacts_content, session)
            return StreamingResponse(
                io.BytesIO(json_content.encode('utf-8')),
                media_type="application/json",
                headers={"Content-Disposition": f"attachment; filename=github_issues_{session_id}.json"}
            )
        
        elif format in ["markdown", "confluence"]:
            # Markdown format (compatible with Confluence)
            md_content = _format_as_markdown(artifacts_content, session)
            return StreamingResponse(
                io.BytesIO(md_content.encode('utf-8')),
                media_type="text/markdown",
                headers={"Content-Disposition": f"attachment; filename=scrum_artifacts_{session_id}.md"}
            )
        
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported format: {format}")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to export artifacts for session {session_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


def _format_as_jira_csv(artifacts: dict, session) -> str:
    """Format artifacts as Jira-compatible CSV for bulk import"""
    import csv
    from io import StringIO
    
    output = StringIO()
    writer = csv.writer(output)
    
    # Jira CSV headers
    writer.writerow(["Summary", "Description", "Issue Type", "Priority", "Labels", "Reporter"])
    
    # Extract user stories from PO artifact
    po_content = artifacts.get("po_vision_userstories_ac.txt", "")
    stories = _extract_user_stories(po_content)
    
    for story in stories:
        writer.writerow([
            story.get("title", "User Story"),
            story.get("description", ""),
            "Story",
            "Medium",
            "ai-generated,scrum-workflow",
            "AI Scrum Team"
        ])
    
    return output.getvalue()


def _format_as_github_json(artifacts: dict, session) -> str:
    """Format artifacts as GitHub Issues JSON"""
    import json
    
    issues = []
    po_content = artifacts.get("po_vision_userstories_ac.txt", "")
    stories = _extract_user_stories(po_content)
    
    for story in stories:
        issues.append({
            "title": story.get("title", "User Story"),
            "body": story.get("description", ""),
            "labels": ["ai-generated", "scrum-workflow", "user-story"],
            "assignees": []
        })
    
    return json.dumps(issues, indent=2)


def _format_as_markdown(artifacts: dict, session) -> str:
    """Format all artifacts as a single Markdown document"""
    md_lines = [
        f"# Scrum Workflow Artifacts",
        f"",
        f"**Session ID:** {session.id}",
        f"**Generated:** {session.createdAt}",
        f"**Status:** {session.status}",
        f"",
        "---",
        ""
    ]
    
    agent_labels = {
        "po_vision_userstories_ac.txt": "Product Owner - Vision & User Stories",
        "scrum_plan_breakdown.txt": "Scrum Master - Sprint Plan",
        "dev_design_and_app_login.py.txt": "Developer - Technical Design & Code",
        "login_tests.py.txt": "QA Engineer - Test Suite",
        "scrum_summary.txt": "Release Manager - Executive Summary"
    }
    
    for artifact_name, content in artifacts.items():
        label = agent_labels.get(artifact_name, artifact_name)
        md_lines.extend([
            f"## {label}",
            "",
            content,
            "",
            "---",
            ""
        ])
    
    return "\n".join(md_lines)


def _extract_user_stories(po_content: str) -> list:
    """Extract user stories from Product Owner artifact"""
    stories = []
    lines = po_content.split("\n")
    
    current_story = None
    for line in lines:
        line = line.strip()
        if line.startswith("**User Story") or line.startswith("User Story"):
            if current_story:
                stories.append(current_story)
            current_story = {"title": line, "description": ""}
        elif current_story:
            current_story["description"] += line + "\n"
    
    if current_story:
        stories.append(current_story)
    
    return stories if stories else [{"title": "Scrum Workflow Output", "description": po_content}]


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
