"""
Agents Router
Handles agent execution, status tracking, and logs
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from app.models import (
    ExecutionRequest,
    ExecutionResponse,
    SingleAgentRequest,
    SingleAgentResponse,
    MiniFlowRequest,
    MiniFlowResponse,
    AgentStatusResponse,
    AgentStatus,
    Session,
    OllamaConfigModel,
    OpenAIConfigModel,
    AzureConfigModel,
    RegenerateItemRequest,
)
from app.services import get_agent_service, get_storage_service, get_config_profile_service
from typing import AsyncGenerator, Optional, Union, Dict
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
            error=session_data.get("error"),
            flowType=session_data.get("flowType"),
            flowLabel=session_data.get("flowLabel")
        )
        
        storage.save_session_metadata(session)
        logger.info(f"[Persist] Successfully persisted session {session_id} to disk")
        
    except Exception as e:
        logger.error(f"[Persist] Failed to persist session {session_id}: {str(e)}", exc_info=True)


def resolve_config(request: Union[ExecutionRequest, SingleAgentRequest]):
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


@router.get("/available")
async def list_available_agents():
    """Return list of available agent roles."""
    try:
        from app.core import get_agent_list
        return {"success": True, "data": get_agent_list()}
    except Exception as e:
        logger.error(f"Failed to list agents: {e}")
        raise HTTPException(status_code=500, detail="Failed to list agents")


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
            "createdAt": datetime.now().isoformat(),
            "flowType": "feature_workflow",
            "flowLabel": "Feature Workflow: Full Team"
        }
        
        # Create session metadata with feature workflow tag
        session = Session(
            id=session_id,
            status="running",
            config=resolved_config.model_dump(),
            agents=[],  # Initialize empty agents list
            artifacts=[],
            createdAt=datetime.now(),
            flowType="feature_workflow",
            flowLabel="Feature Workflow: Full Team"
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


@router.post("/single", response_model=SingleAgentResponse)
async def execute_single_agent(request: SingleAgentRequest):
    """
    Run a single agent ad-hoc without the full workflow.
    Useful for targeted asks (e.g., just PO stories or QA test cases).
    """
    try:
        resolved_config = resolve_config(request)
        agent_service = get_agent_service()
        storage = get_storage_service()

        session_id = str(uuid.uuid4())
        created_at = datetime.utcnow()

        # Track minimal session state
        active_sessions[session_id] = {
            "status": "running",
            "agents": [{
                "name": request.agentName,
                "status": "running",
                "progress": 10
            }],
            "logs": [],
            "artifacts": [],
            "createdAt": created_at.isoformat(),
            "config": resolved_config.model_dump() if hasattr(resolved_config, "model_dump") else resolved_config.dict(),
            "inputs": request.inputs,
            "context": request.context,
        }

        def status_callback(agent_name: str, status: str, progress: int):
            session = active_sessions.get(session_id)
            if not session:
                return
            agent_status = next((a for a in session["agents"] if a["name"] == agent_name), None)
            if agent_status:
                agent_status["status"] = status
                agent_status["progress"] = progress
            else:
                session["agents"].append({
                    "name": agent_name,
                    "status": status,
                    "progress": progress
                })
            session["status"] = "running" if status == "running" else session.get("status", "running")

        def log_callback(level: str, agent: str, message: str):
            session = active_sessions.get(session_id)
            if session is None:
                return
            session.setdefault("logs", []).append({
                "timestamp": datetime.utcnow().isoformat(),
                "level": level,
                "agent": agent,
                "message": message
            })

        logger.info(f"Starting ad-hoc agent run for {request.agentName} in session {session_id}")
        output = await agent_service.run_single_agent(
            config=resolved_config,
            agent_name=request.agentName,
            inputs=request.inputs or {},
            context=request.context or {},
            status_callback=status_callback,
            log_callback=log_callback,
        )

        # Persist artifact and session metadata
        from app.core import get_agent_config
        agent_cfg = get_agent_config(request.agentName, strict_mode=False)
        storage.save_artifact(session_id, agent_cfg["output_filename"], output)
        artifacts = storage.list_artifacts(session_id)

        completed_at = datetime.utcnow()
        active_sessions[session_id]["status"] = "completed"
        active_sessions[session_id]["completedAt"] = completed_at.isoformat()
        if active_sessions[session_id]["agents"]:
            active_sessions[session_id]["agents"][0]["status"] = "completed"
            active_sessions[session_id]["agents"][0]["progress"] = 100
        active_sessions[session_id]["artifacts"] = [a.name for a in artifacts]

        # Get agent label for display
        agent_labels = {
            "product_owner": "Product Owner",
            "scrum_master": "Scrum Master", 
            "tech_lead": "Tech Lead",
            "developer": "Developer",
            "qa_automation": "QA Automation",
            "release_manager": "Release Manager",
        }

        session_model = Session(
            id=session_id,
            createdAt=created_at,
            completedAt=completed_at,
            status="completed",
            config=active_sessions[session_id].get("config", {}),
            agents=[AgentStatus(name=request.agentName, status="completed", progress=100)],
            artifacts=artifacts,
            checkpoints=active_sessions[session_id].get("checkpoints", []),
            logs=active_sessions[session_id].get("logs", []),
            error=None,
            flowType="single_agent",
            flowLabel=agent_labels.get(request.agentName, request.agentName),
        )
        storage.save_session_metadata(session_model)

        logger.info(f"Completed ad-hoc agent run for {request.agentName} in session {session_id}")

        return SingleAgentResponse(
            sessionId=session_id,
            agent=request.agentName,
            output=output,
            status="completed"
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Single agent execution failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/mini-flow", response_model=MiniFlowResponse)
async def execute_mini_flow(request: MiniFlowRequest):
    """
    Execute a mini flow - multiple agents in sequence as a single session.
    Each agent's output is passed as context to the next agent.
    """
    try:
        resolved_config = resolve_config(request)
        agent_service = get_agent_service()
        storage = get_storage_service()

        session_id = str(uuid.uuid4())
        created_at = datetime.utcnow()

        # Initialize session with all agents
        agent_statuses = [{"name": agent, "status": "waiting", "progress": 0} for agent in request.agents]
        
        active_sessions[session_id] = {
            "status": "running",
            "agents": agent_statuses,
            "logs": [],
            "artifacts": [],
            "checkpoints": [],
            "createdAt": created_at.isoformat(),
            "config": resolved_config.model_dump() if hasattr(resolved_config, "model_dump") else resolved_config.dict(),
            "inputs": request.inputs,
            "flowType": "mini_flow",
            "flowLabel": request.flowLabel,
        }

        def status_callback(agent_name: str, status: str, progress: int):
            session = active_sessions.get(session_id)
            if not session:
                return
            agent_status = next((a for a in session["agents"] if a["name"] == agent_name), None)
            if agent_status:
                agent_status["status"] = status
                agent_status["progress"] = progress

        def log_callback(level: str, agent: str, message: str):
            session = active_sessions.get(session_id)
            if session is None:
                return
            session.setdefault("logs", []).append({
                "timestamp": datetime.utcnow().isoformat(),
                "level": level,
                "agent": agent,
                "message": message
            })

        logger.info(f"Starting mini flow '{request.flowLabel}' with agents {request.agents} in session {session_id}")

        outputs = {}
        aggregated_context = f"Requirement:\n{request.inputs.get('requirement', '')}"
        if request.inputs.get('constraints'):
            aggregated_context += f"\nConstraints:\n{request.inputs.get('constraints')}"

        # Execute each agent in sequence
        for i, agent_name in enumerate(request.agents):
            status_callback(agent_name, "running", 10)
            log_callback("info", agent_name, f"Starting agent...")

            try:
                output = await agent_service.run_single_agent(
                    config=resolved_config,
                    agent_name=agent_name,
                    inputs=request.inputs or {},
                    context={"context": aggregated_context},
                    status_callback=status_callback,
                    log_callback=log_callback,
                )

                outputs[agent_name] = output
                
                # Add output to context for next agent
                agent_labels = {
                    "product_owner": "Product Owner",
                    "scrum_master": "Scrum Master",
                    "tech_lead": "Tech Lead",
                    "developer": "Developer",
                    "qa_automation": "QA Automation",
                    "release_manager": "Release Manager",
                }
                aggregated_context += f"\n\n{agent_labels.get(agent_name, agent_name)} Output:\n{output}"

                # Save artifact
                from app.core import get_agent_config
                agent_cfg = get_agent_config(agent_name, strict_mode=False)
                storage.save_artifact(session_id, agent_cfg["output_filename"], output)
                
                # Update checkpoint
                active_sessions[session_id].setdefault("checkpoints", []).append({
                    "agent": agent_name,
                    "content": output,
                    "timestamp": datetime.utcnow().isoformat()
                })

                progress = int(((i + 1) / len(request.agents)) * 100)
                status_callback(agent_name, "completed", progress)
                log_callback("success", agent_name, f"Completed successfully")

            except Exception as agent_error:
                logger.error(f"Agent {agent_name} failed: {str(agent_error)}")
                status_callback(agent_name, "error", 0)
                log_callback("error", agent_name, f"Failed: {str(agent_error)}")
                raise

        # Finalize session
        artifacts = storage.list_artifacts(session_id)
        completed_at = datetime.utcnow()
        
        active_sessions[session_id]["status"] = "completed"
        active_sessions[session_id]["completedAt"] = completed_at.isoformat()
        active_sessions[session_id]["artifacts"] = [a.name for a in artifacts]

        session_model = Session(
            id=session_id,
            createdAt=created_at,
            completedAt=completed_at,
            status="completed",
            config=active_sessions[session_id].get("config", {}),
            agents=[AgentStatus(name=a["name"], status=a["status"], progress=a["progress"]) 
                   for a in active_sessions[session_id]["agents"]],
            artifacts=artifacts,
            checkpoints=active_sessions[session_id].get("checkpoints", []),
            logs=active_sessions[session_id].get("logs", []),
            error=None,
            flowType="mini_flow",
            flowLabel=request.flowLabel,
        )
        storage.save_session_metadata(session_model)

        logger.info(f"Completed mini flow '{request.flowLabel}' in session {session_id}")

        # Convert outputs dict to list of MiniFlowAgentResult
        output_results = [
            MiniFlowAgentResult(agent=agent_name, output=output, status="completed")
            for agent_name, output in outputs.items()
        ]

        return MiniFlowResponse(
            sessionId=session_id,
            status="completed",
            outputs=output_results,
            artifacts=[a.name for a in artifacts]
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Mini flow execution failed: {str(e)}", exc_info=True)
        # Update session status on error
        if session_id in active_sessions:
            active_sessions[session_id]["status"] = "error"
            active_sessions[session_id]["error"] = str(e)
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
    
    def telemetry_callback(telemetry):
        """Update session telemetry data."""
        session = active_sessions.get(session_id)
        if session is not None:
            session["telemetry"] = telemetry.model_dump() if hasattr(telemetry, 'model_dump') else telemetry
            logger.info(f"[Callback] Telemetry updated: {telemetry.total_tokens} tokens, ${telemetry.total_cost_usd:.4f}")
    
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
            checkpoint_callback=checkpoint_callback,
            telemetry_callback=telemetry_callback
        )
        
        # Parse and save structured JSON outputs
        from app.services import get_output_parser_service
        output_parser = get_output_parser_service()
        
        for agent_name, content in result["results"].items():
            from app.core import get_agent_config
            agent_cfg = get_agent_config(agent_name, strict_mode=False)
            
            # Parse and save as structured JSON
            try:
                parsed = None
                if agent_name == "product_owner":
                    parsed = output_parser.parse_epic_vision(content)
                elif agent_name == "scrum_master":
                    parsed = output_parser.parse_sprint_plan(content)
                elif agent_name == "tech_lead":
                    parsed = output_parser.parse_technical_design(content)
                elif agent_name == "developer":
                    parsed = output_parser.parse_code_implementation(content)
                elif agent_name == "qa_automation":
                    parsed = output_parser.parse_test_suite(content)
                elif agent_name == "release_manager":
                    parsed = output_parser.parse_executive_summary(content)
                
                if parsed:
                    # Save structured JSON
                    storage.save_artifact(
                        session_id,
                        agent_cfg["output_filename"],
                        parsed.model_dump_json(indent=2)
                    )
                    logger.info(f"Saved structured output for {agent_name}")
                    
                    if session_id in active_sessions:
                        active_sessions[session_id].setdefault("artifacts", []).append(agent_cfg["output_filename"])
                else:
                    # Save raw output as fallback if parsing fails
                    logger.warning(f"Failed to parse structured output for {agent_name}, saving raw output")
                    storage.save_artifact(
                        session_id,
                        agent_cfg["output_filename"].replace(".json", "_raw.txt"),
                        content
                    )
                    if session_id in active_sessions:
                        active_sessions[session_id].setdefault("artifacts", []).append(agent_cfg["output_filename"].replace(".json", "_raw.txt"))
                        
            except Exception as e:
                logger.error(f"Error processing output for {agent_name}: {e}", exc_info=True)
                # Save raw output on error
                storage.save_artifact(
                    session_id,
                    agent_cfg["output_filename"].replace(".json", "_raw.txt"),
                    content
                )
                if session_id in active_sessions:
                    active_sessions[session_id].setdefault("artifacts", []).append(agent_cfg["output_filename"].replace(".json", "_raw.txt"))
        
        # Update session status and save final telemetry
        if session_id in active_sessions:
            active_sessions[session_id]["status"] = "completed"
            active_sessions[session_id]["completedAt"] = datetime.now().isoformat()
            
            # Store final telemetry from result
            if "telemetry" in result:
                active_sessions[session_id]["telemetry"] = result["telemetry"]
                # Also save telemetry as a separate artifact
                storage.save_artifact(
                    session_id,
                    "telemetry.json",
                    json.dumps(result["telemetry"], indent=2, default=str)
                )
            
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


@router.post("/regenerate/{session_id}/{agent_name}")
async def regenerate_agent(session_id: str, agent_name: str, background_tasks: BackgroundTasks):
    """
    Regenerate output for a specific agent using existing context from other agents.
    This allows users to refine individual agent outputs without re-running the entire workflow.
    
    Args:
        session_id: ID of the completed session
        agent_name: Name of agent to regenerate (product_owner, scrum_master, tech_lead, developer, qa_automation, release_manager)
    
    Returns:
        ExecutionResponse with sessionId and status
    """
    try:
        # Validate agent name
        valid_agents = ["product_owner", "scrum_master", "tech_lead", "developer", "qa_automation", "release_manager"]
        if agent_name not in valid_agents:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid agent name. Must be one of: {', '.join(valid_agents)}"
            )
        
        # Load session metadata from disk
        storage = get_storage_service()
        session = storage.load_session_metadata(session_id)
        
        if not session:
            raise HTTPException(status_code=404, detail=f"Session {session_id} not found")
        
        if session.status == "running":
            raise HTTPException(status_code=400, detail="Cannot regenerate while session is still running")
        
        # Extract original config and inputs from session
        config_dict = session.config
        mode = config_dict.get("mode")
        
        # Reconstruct config model
        if mode == "ollama":
            config = OllamaConfigModel(**config_dict)
        elif mode == "openai":
            config = OpenAIConfigModel(**config_dict)
        elif mode == "azure":
            config = AzureConfigModel(**config_dict)
        else:
            raise HTTPException(status_code=400, detail=f"Unknown config mode: {mode}")
        
        # Load existing agent outputs to build context
        from app.core import get_agent_config
        previous_results = {}
        agent_map = {
            "product_owner": "po_vision_userstories_ac",
            "scrum_master": "scrum_plan_breakdown",
            "tech_lead": "tech_lead_design",
            "developer": "dev_code_implementation",
            "qa_automation": "qa_test_suite",
            "release_manager": "release_summary"
        }
        
        for other_agent, filename_base in agent_map.items():
            if other_agent == agent_name:
                continue  # Skip the agent we're regenerating
            
            # Try loading JSON first, fallback to raw text
            try:
                json_path = storage.get_artifact_path(session_id, f"{filename_base}.json")
                with open(json_path, 'r', encoding='utf-8') as f:
                    content = json.load(f)
                    previous_results[other_agent] = json.dumps(content, indent=2)
            except Exception:
                try:
                    txt_path = storage.get_artifact_path(session_id, f"{filename_base}_raw.txt")
                    with open(txt_path, 'r', encoding='utf-8') as f:
                        previous_results[other_agent] = f.read()
                except Exception as e:
                    logger.warning(f"Could not load output for {other_agent}: {e}")
        
        # Extract original inputs from first agent's context
        # For simplicity, we'll use empty inputs since context is built from previous results
        inputs = {}
        
        logger.info(f"Starting regeneration for {agent_name} in session {session_id}")
        logger.info(f"Loaded context from {len(previous_results)} other agents")
        
        # Execute regeneration in background
        background_tasks.add_task(
            regenerate_agent_background,
            session_id,
            agent_name,
            config,
            inputs,
            previous_results
        )
        
        return ExecutionResponse(
            sessionId=session_id,
            status="regenerating",
            message=f"Regeneration started for {agent_name}"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Regeneration failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


async def regenerate_agent_background(
    session_id: str,
    agent_name: str,
    config: Union[OllamaConfigModel, OpenAIConfigModel, AzureConfigModel],
    inputs: Dict[str, str],
    previous_results: Dict[str, str]
):
    """Background task for regenerating a single agent."""
    agent_service = get_agent_service()
    storage = get_storage_service()
    
    def status_callback(agent: str, status: str, progress: int):
        logger.info(f"[Regenerate] {agent}: {status} ({progress}%)")
    
    def log_callback(level: str, agent: str, message: str):
        logger.info(f"[Regenerate] [{level}] {agent}: {message}")
    
    try:
        # Regenerate agent output
        response = await agent_service.regenerate_single_agent(
            config=config,
            agent_name=agent_name,
            inputs=inputs,
            previous_results=previous_results,
            session_id=session_id,
            status_callback=status_callback,
            log_callback=log_callback
        )
        
        # Parse and save structured output
        from app.services import get_output_parser_service
        from app.core import get_agent_config
        
        output_parser = get_output_parser_service()
        agent_cfg = get_agent_config(agent_name, strict_mode=False)
        
        try:
            parsed = None
            if agent_name == "product_owner":
                parsed = output_parser.parse_epic_vision(response)
            elif agent_name == "scrum_master":
                parsed = output_parser.parse_sprint_plan(response)
            elif agent_name == "tech_lead":
                parsed = output_parser.parse_technical_design(response)
            elif agent_name == "developer":
                parsed = output_parser.parse_code_implementation(response)
            elif agent_name == "qa_automation":
                parsed = output_parser.parse_test_suite(response)
            elif agent_name == "release_manager":
                parsed = output_parser.parse_executive_summary(response)
            
            if parsed:
                # Save structured JSON
                storage.save_artifact(
                    session_id,
                    agent_cfg["output_filename"],
                    parsed.model_dump_json(indent=2)
                )
                logger.info(f"[Regenerate] Saved structured output for {agent_name}")
            else:
                # Save raw output as fallback
                logger.warning(f"[Regenerate] Failed to parse output for {agent_name}, saving raw")
                storage.save_artifact(
                    session_id,
                    agent_cfg["output_filename"].replace(".json", "_raw.txt"),
                    response
                )
        except Exception as e:
            logger.error(f"[Regenerate] Error processing output for {agent_name}: {e}", exc_info=True)
            storage.save_artifact(
                session_id,
                agent_cfg["output_filename"].replace(".json", "_raw.txt"),
                response
            )
        
        # Update session metadata with regeneration timestamp
        session = storage.load_session_metadata(session_id)
        if session:
            session.completedAt = datetime.now()
            storage.save_session_metadata(session)
        
        logger.info(f"[Regenerate] Completed regeneration for {agent_name} in session {session_id}")
        
    except Exception as e:
        logger.error(f"[Regenerate] Failed: {str(e)}", exc_info=True)


@router.post("/regenerate-item/{session_id}/{agent_name}/{item_id}")
async def regenerate_item(
    session_id: str,
    agent_name: str,
    item_id: str,
    background_tasks: BackgroundTasks,
    request: RegenerateItemRequest = RegenerateItemRequest()
):
    """
    Regenerate a specific item (user story, task, test case) within an agent's output.
    This provides granular control for refining individual items with optional user feedback.
    
    Args:
        session_id: ID of the completed session
        agent_name: Name of agent (product_owner, scrum_master, qa_automation)
        item_id: ID of the specific item to regenerate (e.g., US-001, TASK-001, TC-001)
        request: Optional request body with feedback for regeneration
    
    Returns:
        ExecutionResponse with sessionId and status
    """
    try:
        # Validate agent name (only agents with item-level outputs)
        valid_agents = ["product_owner", "scrum_master", "qa_automation"]
        if agent_name not in valid_agents:
            raise HTTPException(
                status_code=400,
                detail=f"Item-level regeneration only supported for: {', '.join(valid_agents)}"
            )
        
        # Load session metadata
        storage = get_storage_service()
        session = storage.load_session_metadata(session_id)
        
        if not session:
            raise HTTPException(status_code=404, detail=f"Session {session_id} not found")
        
        if session.status == "running":
            raise HTTPException(status_code=400, detail="Cannot regenerate while session is still running")
        
        # Extract config
        config_dict = session.config
        mode = config_dict.get("mode")
        
        if mode == "ollama":
            config = OllamaConfigModel(**config_dict)
        elif mode == "openai":
            config = OpenAIConfigModel(**config_dict)
        elif mode == "azure":
            config = AzureConfigModel(**config_dict)
        else:
            raise HTTPException(status_code=400, detail=f"Unknown config mode: {mode}")
        
        # Load existing output to get context
        agent_map = {
            "product_owner": "po_vision_userstories_ac",
            "scrum_master": "scrum_plan_breakdown",
            "qa_automation": "qa_test_suite"
        }
        
        filename = agent_map[agent_name]
        try:
            # Use get_artifact to load existing data
            artifact_content = storage.get_artifact(session_id, f"{filename}.json")
            if not artifact_content:
                raise HTTPException(status_code=404, detail=f"Artifact {filename}.json not found")
            existing_data = json.loads(artifact_content)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=404, detail=f"Could not load existing output: {str(e)}")
        
        # Extract feedback from request
        user_feedback = request.feedback.strip() if request.feedback else ""
        logger.info(f"Starting item regeneration: {agent_name}/{item_id} in session {session_id}, feedback: {user_feedback[:50]}...")
        
        # Execute regeneration in background
        background_tasks.add_task(
            regenerate_item_background,
            session_id,
            agent_name,
            item_id,
            config,
            existing_data,
            user_feedback
        )
        
        return ExecutionResponse(
            sessionId=session_id,
            status="regenerating",
            message=f"Regeneration started for {item_id}"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Item regeneration failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


async def regenerate_item_background(
    session_id: str,
    agent_name: str,
    item_id: str,
    config: Union[OllamaConfigModel, OpenAIConfigModel, AzureConfigModel],
    existing_data: Dict,
    user_feedback: str = ""
):
    """Background task for regenerating a specific item with optional user feedback."""
    agent_service = get_agent_service()
    storage = get_storage_service()
    
    # Build feedback section for prompt
    feedback_section = ""
    if user_feedback:
        feedback_section = f"""
USER FEEDBACK - IMPORTANT: The user has provided the following specific feedback for this regeneration. 
Please incorporate these changes/improvements:
---
{user_feedback}
---

"""
    
    try:
        # Build targeted prompt for item regeneration
        from app.core import get_agent_config, run_agent_async
        
        agent_cfg = get_agent_config(agent_name, strict_mode=False)
        
        # Extract item-specific context
        item_context = ""
        other_items_context = ""
        
        if agent_name == "product_owner":
            # Find the story to regenerate
            stories = existing_data.get("user_stories", [])
            target_story = next((s for s in stories if s.get("id") == item_id), None)
            
            if not target_story:
                raise Exception(f"Story {item_id} not found")
            
            item_context = f"Current story to improve:\n{json.dumps(target_story, indent=2)}"
            
            # Context from other stories
            other_stories = [s for s in stories if s.get("id") != item_id]
            if other_stories:
                other_items_context = f"\nOther user stories for reference:\n{json.dumps(other_stories[:3], indent=2)}"
            
            prompt = f"""
You are regenerating a SINGLE user story. Keep the same ID ({item_id}) but improve the content.

{feedback_section}Vision: {existing_data.get('vision', '')}
Scope: {existing_data.get('scope', '')}

{item_context}
{other_items_context}

Regenerate ONLY this one story with improvements. Return JSON with this structure:
{{
  "id": "{item_id}",
  "title": "...",
  "as_a": "...",
  "i_want": "...",
  "so_that": "...",
  "acceptance_criteria": [
    {{"criterion_id": "AC-1", "given": "...", "when": "...", "then": "..."}}
  ],
  "priority": "High|Medium|Low",
  "story_points": 1-13,
  "labels": ["label1", "label2"]
}}

IMPORTANT: Use the structured format with separate 'as_a', 'i_want', 'so_that' fields.
For acceptance_criteria, use 'given', 'when', 'then' fields (NOT 'description').
"""
        
        elif agent_name == "scrum_master":
            tasks = existing_data.get("tasks", [])
            target_task = next((t for t in tasks if t.get("id") == item_id), None)
            
            if not target_task:
                raise Exception(f"Task {item_id} not found")
            
            item_context = f"Current task to improve:\n{json.dumps(target_task, indent=2)}"
            
            other_tasks = [t for t in tasks if t.get("id") != item_id][:3]
            if other_tasks:
                other_items_context = f"\nOther tasks for reference:\n{json.dumps(other_tasks, indent=2)}"
            
            prompt = f"""
You are regenerating a SINGLE sprint task. Keep the same ID ({item_id}) but improve the content.

{feedback_section}Sprint Goal: {existing_data.get('sprint_goal', '')}

{item_context}
{other_items_context}

Regenerate ONLY this one task. Return JSON:
{{
  "id": "{item_id}",
  "title": "...",
  "description": "...",
  "category": "Backend|Frontend|Database|Testing|DevOps",
  "estimated_hours": 1-40,
  "dependencies": ["TASK-XXX"]
}}
"""
        
        elif agent_name == "qa_automation":
            test_cases = existing_data.get("test_cases", [])
            target_test = next((t for t in test_cases if t.get("id") == item_id), None)
            
            if not target_test:
                raise Exception(f"Test case {item_id} not found")
            
            item_context = f"Current test case to improve:\n{json.dumps(target_test, indent=2)}"
            
            other_tests = [t for t in test_cases if t.get("id") != item_id][:2]
            if other_tests:
                other_items_context = f"\nOther test cases for reference:\n{json.dumps(other_tests, indent=2)}"
            
            prompt = f"""
You are regenerating a SINGLE test case. Keep the same ID ({item_id}) but improve the content.

{feedback_section}Test Strategy: {existing_data.get('test_strategy', '')}

{item_context}
{other_items_context}

Regenerate ONLY this one test case. Return JSON:
{{
  "id": "{item_id}",
  "title": "...",
  "type": "Unit|Integration|E2E|Performance",
  "priority": "Critical|High|Medium|Low",
  "preconditions": ["..."],
  "steps": [{{"step_number": 1, "action": "...", "expected_result": "..."}}],
  "test_data": "..."
}}
"""
        
        # Setup environment
        agent_service.setup_environment(config)
        
        # Execute LLM call
        logger.info(f"[RegenerateItem] Executing LLM for {agent_name}/{item_id}")
        response = await run_agent_async(
            instructions=agent_cfg["instructions"],
            prompt=prompt,
            verbose=False
        )
        
        # Parse response to extract the single item
        from app.services import get_output_parser_service
        output_parser = get_output_parser_service()
        
        # Extract JSON from response
        import re
        json_match = re.search(r'\{.*\}', response, re.DOTALL)
        if json_match:
            new_item = json.loads(json_match.group())
            
            # Update the existing data with the new item
            if agent_name == "product_owner":
                stories = existing_data.get("user_stories", [])
                existing_data["user_stories"] = [
                    new_item if s.get("id") == item_id else s
                    for s in stories
                ]
            elif agent_name == "scrum_master":
                tasks = existing_data.get("tasks", [])
                existing_data["tasks"] = [
                    new_item if t.get("id") == item_id else t
                    for t in tasks
                ]
            elif agent_name == "qa_automation":
                test_cases = existing_data.get("test_cases", [])
                existing_data["test_cases"] = [
                    new_item if t.get("id") == item_id else t
                    for t in test_cases
                ]
            
            # Save updated data
            agent_map = {
                "product_owner": "po_vision_userstories_ac",
                "scrum_master": "scrum_plan_breakdown",
                "qa_automation": "qa_test_suite"
            }
            
            storage.save_artifact(
                session_id,
                f"{agent_map[agent_name]}.json",
                json.dumps(existing_data, indent=2)
            )
            
            logger.info(f"[RegenerateItem] Updated {item_id} in {agent_name} output")
        else:
            raise Exception("Failed to extract JSON from LLM response")
        
        # Update session metadata timestamp
        session = storage.load_session_metadata(session_id)
        if session:
            session.completedAt = datetime.now()
            storage.save_session_metadata(session)
        
    except Exception as e:
        logger.error(f"[RegenerateItem] Failed: {str(e)}", exc_info=True)
