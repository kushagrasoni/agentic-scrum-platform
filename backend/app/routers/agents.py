"""
Agents Router
Handles agent execution, status tracking, and logs
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from app.models import (
    ExecutionRequest,
    ExecutionResponse,
    AgentStatusResponse,
    AgentStatus,
    Session,
    OllamaConfigModel,
    OpenAIConfigModel,
    AzureConfigModel,
)
from app.services import get_agent_service, get_storage_service, get_config_profile_service
from typing import AsyncGenerator, Optional
import asyncio
import logging
import uuid
from datetime import datetime
import json

router = APIRouter()
logger = logging.getLogger(__name__)

# In-memory storage for sessions (replace with database in production)
active_sessions = {}


async def persist_session_to_disk(session_id: str, storage):
    """Helper function to persist session data from active_sessions to disk."""
    try:
        session_data = active_sessions.get(session_id)
        if not session_data:
            logger.warning(f"Session {session_id} not found in active_sessions")
            return
        
        # Convert agents to AgentStatus objects
        agents_list = []
        for agent in session_data.get("agents", []):
            if isinstance(agent, dict):
                agents_list.append(AgentStatus(**agent))
        
        # Get artifacts from disk
        artifacts_list = storage.list_artifacts(session_id)
        
        # Parse timestamps
        created_at = session_data.get("createdAt")
        if isinstance(created_at, str):
            created_at = datetime.fromisoformat(created_at)
        elif not isinstance(created_at, datetime):
            created_at = datetime.now()
            
        completed_at = session_data.get("completedAt")
        if isinstance(completed_at, str):
            completed_at = datetime.fromisoformat(completed_at)
        elif completed_at is None and session_data.get("status") in ["completed", "error", "cancelled"]:
            completed_at = datetime.now()
        
        # Create Session - pass Pydantic model instances directly
        session = Session(
            id=session_id,
            createdAt=created_at,
            completedAt=completed_at,
            status=session_data.get("status", "completed"),
            config=session_data.get("config", {}),
            agents=agents_list,  # Already AgentStatus instances
            artifacts=artifacts_list,  # Already Artifact instances
            checkpoints=session_data.get("checkpoints", []),
            logs=session_data.get("logs", []),
            error=session_data.get("error")
        )
        
        storage.save_session_metadata(session)
        logger.info(f"[Persist] Successfully persisted session {session_id} to disk")
        
    except Exception as e:
        logger.error(f"[Persist] Failed to persist session {session_id}: {str(e)}", exc_info=True)


def resolve_config(request: ExecutionRequest):
    """Resolve provider config from llmProfileId."""
    profile = get_config_profile_service().get_profile(request.llmProfileId)
    if not profile:
        raise HTTPException(status_code=404, detail=f"Profile not found: {request.llmProfileId}")
    
    mode = profile.get("mode")
    data = profile.get("data") or {}

    if mode == "ollama":
        return OllamaConfigModel(**data)
    if mode == "openai":
        return OpenAIConfigModel(**data)
    if mode == "azure":
        return AzureConfigModel(**data)
    raise HTTPException(status_code=400, detail=f"Unknown mode: {mode}")


@router.post("/execute")
async def execute_agents(request: ExecutionRequest, background_tasks: BackgroundTasks):
    """
    Start agent execution workflow
    """
    try:
        resolved_config = resolve_config(request)

        session_id = str(uuid.uuid4())
        
        logger.info(f"Starting execution for session {session_id}")
        logger.info(f"Config received: mode={resolved_config.mode}")
        logger.info(f"Inputs: {list(request.inputs.keys())}")
        
        # Initialize session tracking
        active_sessions[session_id] = {
            "status": "running",
            "agents": [],
            "logs": [],
            "config": resolved_config.model_dump(),
            "checkpoints": [],
            "artifacts": [],
            "createdAt": datetime.now().isoformat()
        }
        
        # Create session metadata
        session = Session(
            id=session_id,
            status="running",
            config=resolved_config.model_dump(),
            agents=[],  # Initialize empty agents list
            artifacts=[],
            createdAt=datetime.now()
        )
        
        # Save session metadata
        storage = get_storage_service()
        storage.save_session_metadata(session)
        
        # Execute workflow in background
        execution_request = ExecutionRequest(
            llmProfileId=request.llmProfileId,
            inputs=request.inputs
        )
        background_tasks.add_task(
            execute_workflow_background,
            session_id,
            execution_request
        )
        
        return ExecutionResponse(
            sessionId=session_id,
            status="running",
            message="Agent execution started successfully"
        )
        
    except Exception as e:
        logger.error(f"Execution failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


async def execute_workflow_background(session_id: str, request: ExecutionRequest):
    """Background task for executing agent workflow."""
    agent_service = get_agent_service()
    storage = get_storage_service()
    
    def status_callback(agent_name: str, status: str, progress: int):
        """Update agent status."""
        logger.info(f"[Callback] status_callback: {agent_name} - {status} - {progress}%")
        session = active_sessions.get(session_id)
        if session:
            # Find or create agent status
            agent_status = next(
                (a for a in session["agents"] if a["name"] == agent_name),
                None
            )
            if agent_status:
                agent_status["status"] = status
                agent_status["progress"] = progress
            else:
                session["agents"].append({
                    "name": agent_name,
                    "status": status,
                    "progress": progress
                })
            logger.info(f"[Callback] Updated session agents: {len(session['agents'])} agents")
    
    def log_callback(level: str, agent: str, message: str):
        """Add log message."""
        logger.info(f"[Callback] log_callback: [{level}] {agent} - {message}")
        session = active_sessions.get(session_id)
        if session:
                session["logs"].append({
                    "timestamp": datetime.now().isoformat(),
                    "level": level,
                    "agent": agent,
                    "message": message
                })
                logger.info(f"[Callback] Total logs: {len(session['logs'])}")

    def checkpoint_callback(agent_name: str, content: str):
        """Persist checkpoint output in memory for streaming."""
        logger.info(f"[Callback] checkpoint_callback: {agent_name} - {len(content)} chars")
        session = active_sessions.get(session_id)
        if session is not None:
            session["checkpoints"].append({
                "agent": agent_name,
                "content": content,
                "timestamp": datetime.now().isoformat()
            })
            logger.info(f"[Callback] Total checkpoints: {len(session['checkpoints'])}")
    
    try:
        # Resolve config from llmProfileId
        resolved_config = resolve_config(request)
        
        # Execute workflow
        result = await agent_service.execute_workflow(
            config=resolved_config,
            inputs=request.inputs,
            session_id=session_id,
            status_callback=status_callback,
            log_callback=log_callback,
            checkpoint_callback=checkpoint_callback
        )
        
        # Save artifacts
        for agent_name, content in result["results"].items():
            from app.core import get_agent_config
            agent_cfg = get_agent_config(agent_name, strict_mode=False)
            storage.save_artifact(
                session_id,
                agent_cfg["output_filename"],
                content
            )
            if session_id in active_sessions:
                active_sessions[session_id].setdefault("artifacts", []).append(agent_cfg["output_filename"])
        
        # Update session status
        if session_id in active_sessions:
            active_sessions[session_id]["status"] = "completed"
            active_sessions[session_id]["completedAt"] = datetime.now().isoformat()
            
            # Persist session to disk
            await persist_session_to_disk(session_id, storage)
    
    except Exception as e:
        logger.error(f"Workflow execution failed: {str(e)}", exc_info=True)
        
        # Update session status
        if session_id in active_sessions:
            active_sessions[session_id]["status"] = "error"
            active_sessions[session_id]["error"] = str(e)
            active_sessions[session_id]["completedAt"] = datetime.now().isoformat()
            log_callback("error", "system", f"Execution failed: {str(e)}")
            
            # Persist error state to disk
            await persist_session_to_disk(session_id, storage)
@router.get("/status/{session_id}", response_model=AgentStatusResponse)
async def get_agent_status(session_id: str):
    """
    Get current status of agent execution
    """
    if session_id not in active_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = active_sessions[session_id]
    
    # Build agent statuses from session data
    agents = [
        AgentStatus(
            name=a["name"],
            status=a["status"],
            progress=a.get("progress", 0)
        )
        for a in session["agents"]
    ]
    
    return AgentStatusResponse(
        sessionId=session_id,
        status=session["status"],
        agents=agents,
        artifacts=session.get("artifacts", [])
    )


@router.get("/stream/{session_id}")
async def stream_session(session_id: str):
    """
    Stream live session updates (status, logs, checkpoints) using SSE.
    """
    if session_id not in active_sessions:
        raise HTTPException(status_code=404, detail="Session not found")

    logger.info(f"[SSE] Client connected to stream for session {session_id}")

    async def event_generator() -> AsyncGenerator[str, None]:
        last_log_index = 0
        last_checkpoint_index = 0
        last_status_signature = None

        while True:
            session = active_sessions.get(session_id)

            if not session:
                logger.warning(f"[SSE] Session {session_id} not found in active_sessions")
                yield 'event: error\ndata: {"message": "Session not found"}\n\n'
                break

            agents = session.get("agents", [])
            status = session.get("status")
            artifacts = session.get("artifacts", [])

            signature_parts = [status] + [
                f"{a.get('name')}:{a.get('status')}:{a.get('progress', 0)}"
                for a in agents
            ]
            status_signature = "|".join(signature_parts)

            if status_signature != last_status_signature:
                status_payload = {
                    "status": status,
                    "agents": agents,
                    "artifacts": artifacts,
                }
                logger.info(f"[SSE] Sending status event: {status} with {len(agents)} agents")
                yield f"event: status\ndata: {json.dumps(status_payload)}\n\n"
                last_status_signature = status_signature

            checkpoints = session.get("checkpoints", [])
            while last_checkpoint_index < len(checkpoints):
                checkpoint = checkpoints[last_checkpoint_index]
                logger.info(f"[SSE] Sending checkpoint event for {checkpoint.get('agent')}")
                yield f"event: checkpoint\ndata: {json.dumps(checkpoint)}\n\n"
                last_checkpoint_index += 1

            logs = session.get("logs", [])
            while last_log_index < len(logs):
                log = logs[last_log_index]
                logger.info(f"[SSE] Sending log event: {log.get('agent')} - {log.get('message')[:50]}")
                yield f"event: log\ndata: {json.dumps(log)}\n\n"
                last_log_index += 1

            if status in ["completed", "failed", "cancelled"]:
                logger.info(f"[SSE] Sending done event with status: {status}")
                yield f"event: done\ndata: {json.dumps({'status': status})}\n\n"
                break

            await asyncio.sleep(0.5)

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.post("/persist/{session_id}")
async def persist_session(session_id: str):
    """
    Manually persist session data from active_sessions to disk storage.
    This endpoint is kept for backward compatibility but persistence now happens automatically.
    """
    if session_id not in active_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    storage = get_storage_service()
    await persist_session_to_disk(session_id, storage)
    
    return {"success": True, "message": "Session persisted successfully"}
    if session_id not in active_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    try:
        session_data = active_sessions[session_id]
        storage = get_storage_service()
        
        # Convert agents to AgentStatus objects
        agents_list = []
        for agent in session_data.get("agents", []):
            if isinstance(agent, dict):
                agents_list.append(AgentStatus(**agent))
        
        # Get artifacts from disk
        artifacts_list = storage.list_artifacts(session_id)
        
        # Parse timestamps
        created_at = session_data.get("createdAt")
        if isinstance(created_at, str):
            created_at = datetime.fromisoformat(created_at)
        elif not isinstance(created_at, datetime):
            created_at = datetime.now()
            
        completed_at = session_data.get("completedAt")
        if isinstance(completed_at, str):
            completed_at = datetime.fromisoformat(completed_at)
        elif completed_at is None and session_data.get("status") in ["completed", "error", "cancelled"]:
            completed_at = datetime.now()
        
        # Create Session using model_dump for nested objects
        session = Session(
            id=session_id,
            createdAt=created_at,
            completedAt=completed_at,
            status=session_data.get("status", "completed"),
            config=session_data.get("config", {}),
            agents=[agent.model_dump() for agent in agents_list],
            artifacts=[artifact.model_dump() for artifact in artifacts_list],
            checkpoints=session_data.get("checkpoints", []),
            logs=session_data.get("logs", []),
            error=session_data.get("error")
        )
        
        storage.save_session_metadata(session)
        logger.info(f"Persisted session {session_id}")
        
        return {"success": True, "message": "Session persisted successfully"}
        
    except Exception as e:
        logger.error(f"Failed to persist session {session_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to persist session: {str(e)}")
