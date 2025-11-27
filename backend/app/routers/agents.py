"""
Agents Router
Handles agent execution, status tracking, and logs
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from app.models import ExecutionRequest, ExecutionResponse, AgentStatusResponse, AgentStatus, Session
from app.services import get_agent_service, get_storage_service
from typing import AsyncGenerator
import asyncio
import logging
import uuid
from datetime import datetime

router = APIRouter()
logger = logging.getLogger(__name__)

# In-memory storage for sessions (replace with database in production)
active_sessions = {}


@router.post("/execute")
async def execute_agents(request: ExecutionRequest, background_tasks: BackgroundTasks):
    """
    Start agent execution workflow
    """
    try:
        session_id = str(uuid.uuid4())
        
        logger.info(f"Starting execution for session {session_id}")
        logger.info(f"Config received: mode={request.config.mode}")
        logger.info(f"Inputs: {list(request.inputs.keys())}")
        
        # Initialize session tracking
        active_sessions[session_id] = {
            "status": "running",
            "agents": [],
            "logs": [],
            "config": request.config.model_dump()
        }
        
        # Create session metadata
        session = Session(
            id=session_id,
            status="running",
            config=request.config.model_dump(),
            agents=[],  # Initialize empty agents list
            artifacts=[],
            createdAt=datetime.now()
        )
        
        # Save session metadata
        storage = get_storage_service()
        storage.save_session_metadata(session)
        
        # Execute workflow in background
        background_tasks.add_task(
            execute_workflow_background,
            session_id,
            request
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
    
    def log_callback(level: str, agent: str, message: str):
        """Add log message."""
        session = active_sessions.get(session_id)
        if session:
            session["logs"].append({
                "timestamp": datetime.now().isoformat(),
                "level": level,
                "agent": agent,
                "message": message
            })
    
    try:
        # Execute workflow
        result = await agent_service.execute_workflow(
            config=request,
            session_id=session_id,
            status_callback=status_callback,
            log_callback=log_callback
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
        
        # Update session status
        if session_id in active_sessions:
            active_sessions[session_id]["status"] = "completed"
        
        # Update session metadata
        session = storage.load_session_metadata(session_id)
        if session:
            session.status = "completed"
            session.artifacts = storage.list_artifacts(session_id)
            session.completedAt = datetime.now()
            storage.save_session_metadata(session)
    
    except Exception as e:
        logger.error(f"Workflow execution failed: {str(e)}", exc_info=True)
        
        # Update session status
        if session_id in active_sessions:
            active_sessions[session_id]["status"] = "failed"
            log_callback("error", "system", f"Execution failed: {str(e)}")
        
        # Update session metadata
        session = storage.load_session_metadata(session_id)
        if session:
            session.status = "error"
            session.error = str(e)
            storage.save_session_metadata(session)
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


@router.get("/logs/{session_id}")
async def stream_logs(session_id: str):
    """
    Stream real-time logs using Server-Sent Events (SSE)
    """
    if session_id not in active_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    async def event_generator() -> AsyncGenerator[str, None]:
        last_log_index = 0
        
        while True:
            session = active_sessions.get(session_id)
            
            if not session:
                yield f"data: {{\"error\": \"Session not found\"}}\n\n"
                break
            
            # Send new logs
            logs = session["logs"]
            while last_log_index < len(logs):
                log = logs[last_log_index]
                import json
                yield f"data: {json.dumps(log)}\n\n"
                last_log_index += 1
            
            # Check if execution is complete
            if session["status"] in ["completed", "failed", "cancelled"]:
                yield f"data: {{\"status\": \"{session['status']}\"}}\n\n"
                break
            
            await asyncio.sleep(0.5)
    
    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.post("/cancel/{session_id}")
async def cancel_execution(session_id: str):
    """
    Cancel ongoing agent execution
    """
    if session_id not in active_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # TODO: Implement actual cancellation logic
    active_sessions[session_id]["status"] = "cancelled"
    logger.info(f"Cancelled execution for session {session_id}")
    
    return {"success": True, "message": "Execution cancelled"}
