"""
Integrations Router
Handles external tool integrations for Jira and GitHub.
Provides endpoints for credential management, connection testing, and direct push.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List
from app.models.responses import ApiResponse
from app.services import get_storage_service
import logging
import json
import os
from pathlib import Path

router = APIRouter()
logger = logging.getLogger(__name__)

# Storage path for integration credentials
INTEGRATIONS_FILE = Path(__file__).parent.parent.parent / "data" / "integrations.json"


# ============================================================================
# Models
# ============================================================================

class JiraCredentials(BaseModel):
    """Jira Cloud connection credentials"""
    url: str = Field(..., description="Jira Cloud URL (e.g., https://company.atlassian.net)")
    email: str = Field(..., description="Jira account email")
    api_token: str = Field(..., description="Jira API token")


class GitHubCredentials(BaseModel):
    """GitHub connection credentials"""
    token: str = Field(..., description="GitHub personal access token")
    owner: Optional[str] = Field(None, description="Default repository owner/org")
    repo: Optional[str] = Field(None, description="Default repository name")


class IntegrationStatus(BaseModel):
    """Connection status for an integration"""
    connected: bool
    last_tested: Optional[str] = None
    error: Optional[str] = None
    details: Optional[dict] = None


class PushToJiraRequest(BaseModel):
    """Request to push items to Jira"""
    project_key: str = Field(..., description="Jira project key")
    items: List[dict] = Field(..., description="Items to create as issues")
    default_issue_type: str = Field(default="Story", description="Default issue type")
    default_labels: List[str] = Field(default_factory=lambda: ["ai-generated"])


class PushToGitHubRequest(BaseModel):
    """Request to push items to GitHub"""
    owner: str = Field(..., description="Repository owner/org")
    repo: str = Field(..., description="Repository name")
    items: List[dict] = Field(..., description="Items to create as issues")
    default_labels: List[str] = Field(default_factory=lambda: ["ai-generated"])


class PushResult(BaseModel):
    """Result of a push operation"""
    success: bool
    created_count: int
    failed_count: int
    results: List[dict]


# ============================================================================
# Helper Functions
# ============================================================================

def _load_integrations() -> dict:
    """Load integration credentials from file"""
    if not INTEGRATIONS_FILE.exists():
        return {"jira": None, "github": None}
    try:
        with open(INTEGRATIONS_FILE, "r") as f:
            return json.load(f)
    except Exception:
        return {"jira": None, "github": None}


def _save_integrations(data: dict) -> None:
    """Save integration credentials to file"""
    INTEGRATIONS_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(INTEGRATIONS_FILE, "w") as f:
        json.dump(data, f, indent=2)


# ============================================================================
# Jira Endpoints
# ============================================================================

@router.post("/jira/connect")
async def connect_jira(credentials: JiraCredentials):
    """Save Jira credentials and test connection"""
    try:
        # Test connection first
        test_result = await _test_jira_connection(credentials)
        
        if not test_result["success"]:
            return ApiResponse(
                success=False,
                message="Failed to connect to Jira",
                data=test_result
            )
        
        # Save credentials
        integrations = _load_integrations()
        integrations["jira"] = {
            "url": credentials.url,
            "email": credentials.email,
            "api_token": credentials.api_token,
            "connected_at": _get_timestamp(),
            "projects": test_result.get("projects", [])
        }
        _save_integrations(integrations)
        
        logger.info(f"Jira connected: {credentials.url}")
        
        return ApiResponse(
            success=True,
            message="Jira connected successfully",
            data={
                "connected": True,
                "projects": test_result.get("projects", [])
            }
        )
    except Exception as e:
        logger.error(f"Failed to connect Jira: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/jira/status")
async def get_jira_status():
    """Get Jira connection status"""
    integrations = _load_integrations()
    jira = integrations.get("jira")
    
    if not jira:
        return ApiResponse(
            success=True,
            data=IntegrationStatus(connected=False)
        )
    
    return ApiResponse(
        success=True,
        data=IntegrationStatus(
            connected=True,
            last_tested=jira.get("connected_at"),
            details={
                "url": jira.get("url"),
                "email": jira.get("email"),
                "projects": jira.get("projects", [])
            }
        )
    )


@router.delete("/jira/disconnect")
async def disconnect_jira():
    """Disconnect Jira integration"""
    integrations = _load_integrations()
    integrations["jira"] = None
    _save_integrations(integrations)
    
    logger.info("Jira disconnected")
    
    return ApiResponse(
        success=True,
        message="Jira disconnected"
    )


@router.post("/jira/test")
async def test_jira():
    """Test existing Jira connection"""
    integrations = _load_integrations()
    jira = integrations.get("jira")
    
    if not jira:
        return ApiResponse(
            success=False,
            message="Jira not connected"
        )
    
    credentials = JiraCredentials(
        url=jira["url"],
        email=jira["email"],
        api_token=jira["api_token"]
    )
    
    result = await _test_jira_connection(credentials)
    return ApiResponse(
        success=result["success"],
        message="Connection test completed",
        data=result
    )


@router.post("/jira/push")
async def push_to_jira(request: PushToJiraRequest):
    """Push items directly to Jira as issues"""
    integrations = _load_integrations()
    jira = integrations.get("jira")
    
    if not jira:
        raise HTTPException(status_code=400, detail="Jira not connected")
    
    results = []
    created_count = 0
    failed_count = 0
    
    for item in request.items:
        try:
            issue_result = await _create_jira_issue(
                jira,
                request.project_key,
                item,
                request.default_issue_type,
                request.default_labels
            )
            
            if issue_result["success"]:
                created_count += 1
                results.append({
                    "success": True,
                    "title": item.get("title", "Untitled"),
                    "issue_key": issue_result.get("issue_key"),
                    "url": issue_result.get("url")
                })
            else:
                failed_count += 1
                results.append({
                    "success": False,
                    "title": item.get("title", "Untitled"),
                    "error": issue_result.get("error")
                })
        except Exception as e:
            failed_count += 1
            results.append({
                "success": False,
                "title": item.get("title", "Untitled"),
                "error": str(e)
            })
    
    logger.info(f"Jira push completed: {created_count} created, {failed_count} failed")
    
    return ApiResponse(
        success=created_count > 0,
        message=f"Created {created_count} issues, {failed_count} failed",
        data=PushResult(
            success=created_count > 0,
            created_count=created_count,
            failed_count=failed_count,
            results=results
        )
    )


# ============================================================================
# GitHub Endpoints
# ============================================================================

@router.post("/github/connect")
async def connect_github(credentials: GitHubCredentials):
    """Save GitHub credentials and test connection"""
    try:
        # Test connection first
        test_result = await _test_github_connection(credentials)
        
        if not test_result["success"]:
            return ApiResponse(
                success=False,
                message="Failed to connect to GitHub",
                data=test_result
            )
        
        # Save credentials
        integrations = _load_integrations()
        integrations["github"] = {
            "token": credentials.token,
            "owner": credentials.owner,
            "repo": credentials.repo,
            "connected_at": _get_timestamp(),
            "user": test_result.get("user"),
            "repos": test_result.get("repos", [])
        }
        _save_integrations(integrations)
        
        logger.info(f"GitHub connected: {test_result.get('user', 'unknown')}")
        
        return ApiResponse(
            success=True,
            message="GitHub connected successfully",
            data={
                "connected": True,
                "user": test_result.get("user"),
                "repos": test_result.get("repos", [])
            }
        )
    except Exception as e:
        logger.error(f"Failed to connect GitHub: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/github/status")
async def get_github_status():
    """Get GitHub connection status"""
    integrations = _load_integrations()
    github = integrations.get("github")
    
    if not github:
        return ApiResponse(
            success=True,
            data=IntegrationStatus(connected=False)
        )
    
    return ApiResponse(
        success=True,
        data=IntegrationStatus(
            connected=True,
            last_tested=github.get("connected_at"),
            details={
                "user": github.get("user"),
                "repos": github.get("repos", []),
                "default_owner": github.get("owner"),
                "default_repo": github.get("repo")
            }
        )
    )


@router.delete("/github/disconnect")
async def disconnect_github():
    """Disconnect GitHub integration"""
    integrations = _load_integrations()
    integrations["github"] = None
    _save_integrations(integrations)
    
    logger.info("GitHub disconnected")
    
    return ApiResponse(
        success=True,
        message="GitHub disconnected"
    )


@router.post("/github/test")
async def test_github():
    """Test existing GitHub connection"""
    integrations = _load_integrations()
    github = integrations.get("github")
    
    if not github:
        return ApiResponse(
            success=False,
            message="GitHub not connected"
        )
    
    credentials = GitHubCredentials(
        token=github["token"],
        owner=github.get("owner"),
        repo=github.get("repo")
    )
    
    result = await _test_github_connection(credentials)
    return ApiResponse(
        success=result["success"],
        message="Connection test completed",
        data=result
    )


@router.post("/github/push")
async def push_to_github(request: PushToGitHubRequest):
    """Push items directly to GitHub as issues"""
    integrations = _load_integrations()
    github = integrations.get("github")
    
    if not github:
        raise HTTPException(status_code=400, detail="GitHub not connected")
    
    results = []
    created_count = 0
    failed_count = 0
    
    for item in request.items:
        try:
            issue_result = await _create_github_issue(
                github,
                request.owner,
                request.repo,
                item,
                request.default_labels
            )
            
            if issue_result["success"]:
                created_count += 1
                results.append({
                    "success": True,
                    "title": item.get("title", "Untitled"),
                    "issue_number": issue_result.get("issue_number"),
                    "url": issue_result.get("url")
                })
            else:
                failed_count += 1
                results.append({
                    "success": False,
                    "title": item.get("title", "Untitled"),
                    "error": issue_result.get("error")
                })
        except Exception as e:
            failed_count += 1
            results.append({
                "success": False,
                "title": item.get("title", "Untitled"),
                "error": str(e)
            })
    
    logger.info(f"GitHub push completed: {created_count} created, {failed_count} failed")
    
    return ApiResponse(
        success=created_count > 0,
        message=f"Created {created_count} issues, {failed_count} failed",
        data=PushResult(
            success=created_count > 0,
            created_count=created_count,
            failed_count=failed_count,
            results=results
        )
    )


# ============================================================================
# Internal Helper Functions
# ============================================================================

def _get_timestamp() -> str:
    """Get current timestamp"""
    from datetime import datetime
    return datetime.utcnow().isoformat() + "Z"


async def _test_jira_connection(credentials: JiraCredentials) -> dict:
    """
    Test Jira connection and retrieve available projects.
    NOTE: For POC demo, this simulates the API call.
    In production, use the actual Jira REST API.
    """
    try:
        # For POC demo - simulate successful connection
        # In production, replace with actual Jira API call:
        # import httpx
        # async with httpx.AsyncClient() as client:
        #     auth = (credentials.email, credentials.api_token)
        #     response = await client.get(
        #         f"{credentials.url}/rest/api/3/project",
        #         auth=auth
        #     )
        #     response.raise_for_status()
        #     projects = [p["key"] for p in response.json()]
        
        # Simulated response for demo
        if not credentials.url or not credentials.email or not credentials.api_token:
            return {
                "success": False,
                "error": "Missing required credentials"
            }
        
        # Simulate validation
        if not credentials.url.startswith("https://"):
            return {
                "success": False,
                "error": "Invalid Jira URL - must start with https://"
            }
        
        return {
            "success": True,
            "projects": ["SCRUM", "AI-DEMO", "POC"],  # Simulated projects
            "message": "Connection successful (POC simulation)"
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


async def _test_github_connection(credentials: GitHubCredentials) -> dict:
    """
    Test GitHub connection and retrieve user info.
    NOTE: For POC demo, this simulates the API call.
    In production, use the actual GitHub API.
    """
    try:
        # For POC demo - simulate successful connection
        # In production, replace with actual GitHub API call:
        # import httpx
        # async with httpx.AsyncClient() as client:
        #     headers = {"Authorization": f"token {credentials.token}"}
        #     user_response = await client.get(
        #         "https://api.github.com/user",
        #         headers=headers
        #     )
        #     user_response.raise_for_status()
        #     user = user_response.json()["login"]
        #     
        #     repos_response = await client.get(
        #         "https://api.github.com/user/repos",
        #         headers=headers
        #     )
        #     repos = [r["full_name"] for r in repos_response.json()[:10]]
        
        # Simulated response for demo
        if not credentials.token:
            return {
                "success": False,
                "error": "Missing GitHub token"
            }
        
        # Simulate validation - token should start with ghp_ or be longer than 10 chars
        if len(credentials.token) < 10:
            return {
                "success": False,
                "error": "Invalid GitHub token format"
            }
        
        return {
            "success": True,
            "user": "demo-user",  # Simulated user
            "repos": ["org/frontend", "org/backend", "org/shared"],  # Simulated repos
            "message": "Connection successful (POC simulation)"
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


async def _create_jira_issue(
    jira_config: dict,
    project_key: str,
    item: dict,
    issue_type: str,
    labels: List[str]
) -> dict:
    """
    Create a single Jira issue.
    NOTE: For POC demo, this simulates the API call.
    In production, use the actual Jira REST API.
    """
    try:
        # For POC demo - simulate issue creation
        # In production, replace with actual Jira API call:
        # import httpx
        # async with httpx.AsyncClient() as client:
        #     auth = (jira_config["email"], jira_config["api_token"])
        #     payload = {
        #         "fields": {
        #             "project": {"key": project_key},
        #             "summary": item.get("title"),
        #             "description": item.get("description"),
        #             "issuetype": {"name": issue_type},
        #             "labels": labels
        #         }
        #     }
        #     response = await client.post(
        #         f"{jira_config['url']}/rest/api/3/issue",
        #         json=payload,
        #         auth=auth
        #     )
        #     response.raise_for_status()
        #     data = response.json()
        #     return {
        #         "success": True,
        #         "issue_key": data["key"],
        #         "url": f"{jira_config['url']}/browse/{data['key']}"
        #     }
        
        # Simulated response for demo
        import random
        issue_number = random.randint(100, 999)
        issue_key = f"{project_key}-{issue_number}"
        
        return {
            "success": True,
            "issue_key": issue_key,
            "url": f"{jira_config['url']}/browse/{issue_key}"
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


async def _create_github_issue(
    github_config: dict,
    owner: str,
    repo: str,
    item: dict,
    labels: List[str]
) -> dict:
    """
    Create a single GitHub issue.
    NOTE: For POC demo, this simulates the API call.
    In production, use the actual GitHub API.
    """
    try:
        # For POC demo - simulate issue creation
        # In production, replace with actual GitHub API call:
        # import httpx
        # async with httpx.AsyncClient() as client:
        #     headers = {"Authorization": f"token {github_config['token']}"}
        #     payload = {
        #         "title": item.get("title"),
        #         "body": item.get("description"),
        #         "labels": labels
        #     }
        #     response = await client.post(
        #         f"https://api.github.com/repos/{owner}/{repo}/issues",
        #         json=payload,
        #         headers=headers
        #     )
        #     response.raise_for_status()
        #     data = response.json()
        #     return {
        #         "success": True,
        #         "issue_number": data["number"],
        #         "url": data["html_url"]
        #     }
        
        # Simulated response for demo
        import random
        issue_number = random.randint(100, 999)
        
        return {
            "success": True,
            "issue_number": issue_number,
            "url": f"https://github.com/{owner}/{repo}/issues/{issue_number}"
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }
