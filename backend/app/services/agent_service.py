"""
Agent Service
Business logic for agent orchestration and execution
"""
from __future__ import annotations

import os
import uuid
import asyncio
import time
from typing import Dict, List, Optional, Callable, Union
from datetime import datetime
import logging

from app.core import run_agent, run_agent_async, get_agent_config, apply_patch
from app.models import AgentStatus, OllamaConfigModel, OpenAIConfigModel, AzureConfigModel
from app.models.telemetry import AgentTelemetry, SessionTelemetry, estimate_tokens, calculate_cost

logger = logging.getLogger(__name__)


class AgentService:
    """Service for managing agent execution workflows."""
    
    def __init__(self):
        """Initialize agent service and apply Azure patch if needed."""
        # Apply Azure OpenAI patch on initialization
        apply_patch()
        logger.info("AgentService initialized")
    
    def setup_environment(self, config):
        """
        Configure environment variables based on API mode.
        
        Args:
            config: Execution configuration with API settings (provider config model)
        """
        config_data = config
        mode = config_data.mode
        
        logger.info(f"Setting up environment for mode: {mode}")
        logger.info(f"Config data type: {type(config_data)}")
        logger.info(f"Config data: {config_data}")
        
        if mode == "ollama":
            os.environ["OPENAI_BASE_URL"] = config_data.url
            os.environ["OPENAI_MODEL_NAME"] = config_data.model
            os.environ["OPENAI_API_KEY"] = "ollama"  # Ollama doesn't need a real key
            
        elif mode == "openai":
            os.environ["OPENAI_API_KEY"] = config_data.apiKey
            os.environ["OPENAI_MODEL_NAME"] = config_data.model
            # Clear Azure settings
            os.environ.pop("AZURE_OPENAI_ENDPOINT", None)
            os.environ.pop("AZURE_OPENAI_API_VERSION", None)
            
        elif mode == "azure":
            os.environ["AZURE_OPENAI_API_KEY"] = config_data.apiKey
            os.environ["OPENAI_API_KEY"] = config_data.apiKey  # Some libraries need this
            os.environ["AZURE_OPENAI_ENDPOINT"] = config_data.endpoint
            os.environ["OPENAI_MODEL_NAME"] = config_data.deployment
            os.environ["AZURE_OPENAI_API_VERSION"] = config_data.apiVersion
            
            # Debug logging
            logger.info(f"Azure config set:")
            logger.info(f"  OPENAI_MODEL_NAME: {os.environ.get('OPENAI_MODEL_NAME')}")
            logger.info(f"  AZURE_OPENAI_ENDPOINT: {os.environ.get('AZURE_OPENAI_ENDPOINT')}")
            logger.info(f"  AZURE_OPENAI_API_VERSION: {os.environ.get('AZURE_OPENAI_API_VERSION')}")
        
        logger.info(f"Environment configured for {mode}")
    
    async def execute_workflow(
        self,
        config: Union[OllamaConfigModel, OpenAIConfigModel, AzureConfigModel],
        inputs: Dict[str, str],
        session_id: str,
        status_callback: Optional[Callable] = None,
        log_callback: Optional[Callable] = None,
        checkpoint_callback: Optional[Callable] = None,
        telemetry_callback: Optional[Callable] = None
    ) -> Dict:
        """
        Execute complete Scrum agent workflow.
        
        Args:
            config: Provider configuration model (OllamaConfigModel, OpenAIConfigModel, or AzureConfigModel)
            inputs: User inputs (requirements, context, constraints)
            session_id: Unique session identifier
            status_callback: Optional callback for agent status updates
            log_callback: Optional callback for log messages
            checkpoint_callback: Optional callback invoked when an agent completes with its output
            telemetry_callback: Optional callback for telemetry updates
        
        Returns:
            Dictionary with execution results, artifacts, and telemetry
        """
        self.setup_environment(config)
        
        # Determine model and provider for telemetry
        model_name = os.environ.get("OPENAI_MODEL_NAME", "unknown")
        provider = config.mode
        
        # Initialize session telemetry
        session_telemetry = SessionTelemetry(
            session_id=session_id,
            model=model_name,
            provider=provider,
            started_at=datetime.utcnow(),
            status="running",
            agents_total=6  # We have 6 agents now
        )
        
        # Define agent execution order
        agent_sequence = [
            "product_owner",
            "scrum_master",
            "tech_lead",
            "developer",
            "qa_automation",
            "release_manager"
        ]
        
        results = {}
        artifacts = []
        
        try:
            for i, agent_name in enumerate(agent_sequence):
                # Get agent configuration
                agent_cfg = get_agent_config(agent_name, strict_mode=False)
                
                # Initialize agent telemetry
                agent_telemetry = AgentTelemetry(
                    agent_name=agent_name,
                    agent_label=agent_cfg['label'],
                    model=model_name,
                    started_at=datetime.utcnow(),
                    status="running"
                )
                
                # Update status
                if status_callback:
                    status_callback(agent_name, "running", i * 17)  # 6 agents = ~17% each
                
                # Log start
                if log_callback:
                    log_callback("info", agent_name, f"Starting {agent_cfg['label']}...")
                
                # Build prompt with context from previous agents
                prompt = self._build_prompt(agent_name, inputs, results)
                
                # Calculate input tokens (estimate)
                input_tokens = estimate_tokens(agent_cfg["instructions"] + prompt)
                agent_telemetry.input_tokens = input_tokens
                
                # Execute agent with timing
                start_time = time.time()
                logger.info(f"Executing agent: {agent_name}")
                response = await run_agent_async(
                    instructions=agent_cfg["instructions"],
                    prompt=prompt,
                    verbose=False
                )
                end_time = time.time()
                
                # Calculate telemetry metrics
                latency_ms = int((end_time - start_time) * 1000)
                output_tokens = estimate_tokens(response)
                total_tokens = input_tokens + output_tokens
                cost = calculate_cost(model_name, input_tokens, output_tokens)
                
                # Update agent telemetry
                agent_telemetry.output_tokens = output_tokens
                agent_telemetry.total_tokens = total_tokens
                agent_telemetry.latency_ms = latency_ms
                agent_telemetry.cost_usd = cost
                agent_telemetry.completed_at = datetime.utcnow()
                agent_telemetry.status = "completed"
                
                # Add to session telemetry
                session_telemetry.agents.append(agent_telemetry)
                session_telemetry.total_input_tokens += input_tokens
                session_telemetry.total_output_tokens += output_tokens
                session_telemetry.total_tokens += total_tokens
                session_telemetry.total_cost_usd += cost
                session_telemetry.total_latency_ms += latency_ms
                session_telemetry.agents_completed = i + 1
                
                # Store result
                results[agent_name] = response
                artifacts.append(agent_cfg["output_filename"])

                if checkpoint_callback:
                    checkpoint_callback(agent_name, response)
                
                # Send telemetry update
                if telemetry_callback:
                    telemetry_callback(session_telemetry)
                
                # Log completion with metrics
                if log_callback:
                    log_callback("success", agent_name, 
                        f"Completed {agent_cfg['label']} ({total_tokens} tokens, {latency_ms}ms, ${cost:.4f})")
                
                # Update status
                if status_callback:
                    status_callback(agent_name, "completed", (i + 1) * 17)
            
            # Finalize session telemetry
            session_telemetry.completed_at = datetime.utcnow()
            session_telemetry.status = "completed"
            if session_telemetry.total_latency_ms > 0:
                session_telemetry.avg_tokens_per_second = (
                    session_telemetry.total_tokens / (session_telemetry.total_latency_ms / 1000)
                )
            
            return {
                "status": "completed",
                "results": results,
                "artifacts": artifacts,
                "telemetry": session_telemetry.model_dump()
            }
            
        except Exception as e:
            logger.error(f"Error in workflow execution: {str(e)}", exc_info=True)
            session_telemetry.status = "error"
            session_telemetry.completed_at = datetime.utcnow()
            if log_callback:
                log_callback("error", "system", f"Execution failed: {str(e)}")
            raise
    
    def _build_prompt(
        self,
        agent_name: str,
        inputs: Dict[str, str],
        previous_results: Dict[str, str]
    ) -> str:
        """
        Build prompt for agent based on inputs and previous agent outputs.
        
        Args:
            agent_name: Name of the current agent
            inputs: User inputs
            previous_results: Results from previous agents
        
        Returns:
            Formatted prompt string
        """
        # Base input
        prompt_parts = []
        
        # Add user inputs
        for key, value in inputs.items():
            if value:
                prompt_parts.append(f"{key}: {value}")
        
        # Add context from previous agents
        if agent_name != "product_owner":
            # Add PO output for later agents
            if "product_owner" in previous_results:
                prompt_parts.append(f"\n=== Product Owner Output ===\n{previous_results['product_owner']}")
            
            # Add SM output for tech_lead and later
            if agent_name in ["tech_lead", "developer", "qa_automation", "release_manager"] and "scrum_master" in previous_results:
                prompt_parts.append(f"\n=== Scrum Master Output ===\n{previous_results['scrum_master']}")
            
            # Add Tech Lead output for developer and later
            if agent_name in ["developer", "qa_automation", "release_manager"] and "tech_lead" in previous_results:
                prompt_parts.append(f"\n=== Tech Lead Design ===\n{previous_results['tech_lead']}")
            
            # Add Developer code output for QA and release manager
            if agent_name in ["qa_automation", "release_manager"] and "developer" in previous_results:
                prompt_parts.append(f"\n=== Developer Code Implementation ===\n{previous_results['developer']}")
            
            # Add QA output for release manager
            if agent_name == "release_manager" and "qa_automation" in previous_results:
                prompt_parts.append(f"\n=== QA Automation Output ===\n{previous_results['qa_automation']}")
        
        return "\n\n".join(prompt_parts)
    
    async def run_single_agent(
        self,
        config: Union[OllamaConfigModel, OpenAIConfigModel, AzureConfigModel],
        agent_name: str,
        inputs: Dict[str, str],
        context: Optional[Dict[str, str]] = None,
        status_callback: Optional[Callable] = None,
        log_callback: Optional[Callable] = None,
    ) -> str:
        """
        Execute a single agent ad-hoc with optional context.
        
        Args:
            config: Provider configuration model
            agent_name: Agent role to execute
            inputs: User-provided inputs for the agent
            context: Additional context (prior artifacts, notes, etc.)
            status_callback: Optional callback for status updates
            log_callback: Optional callback for logs
        
        Returns:
            Raw agent output
        """
        self.setup_environment(config)
        agent_cfg = get_agent_config(agent_name, strict_mode=False)
        
        if status_callback:
            status_callback(agent_name, "running", 10)
        if log_callback:
            log_callback("info", agent_name, f"Starting ad-hoc run for {agent_cfg['label']}")

        # Build a minimal prompt from inputs and optional context
        prompt_sections = []
        if inputs:
            prompt_sections.append("=== Task Inputs ===\n" + "\n".join(f"{k}: {v}" for k, v in inputs.items() if v))
        if context:
            prompt_sections.append("=== Context ===\n" + "\n".join(f"{k}: {v}" for k, v in context.items() if v))
        prompt = "\n\n".join(prompt_sections)

        response = await run_agent_async(
            instructions=agent_cfg["instructions"],
            prompt=prompt,
            verbose=False,
        )

        if status_callback:
            status_callback(agent_name, "completed", 100)
        if log_callback:
            log_callback("success", agent_name, f"Completed ad-hoc run for {agent_cfg['label']}")

        return response
    
    def get_available_agents(self) -> List[str]:
        """Get list of available agent roles."""
        return ["product_owner", "scrum_master", "tech_lead", "developer", "qa_automation", "release_manager"]
    
    async def regenerate_single_agent(
        self,
        config: Union[OllamaConfigModel, OpenAIConfigModel, AzureConfigModel],
        agent_name: str,
        inputs: Dict[str, str],
        previous_results: Dict[str, str],
        session_id: str,
        status_callback: Optional[Callable] = None,
        log_callback: Optional[Callable] = None
    ) -> str:
        """
        Regenerate output for a single agent using context from other agents.
        
        Args:
            config: Provider configuration model
            agent_name: Name of agent to regenerate
            inputs: Original user inputs
            previous_results: Results from other agents (excluding the one being regenerated)
            session_id: Session identifier
            status_callback: Optional callback for status updates
            log_callback: Optional callback for logs
        
        Returns:
            New agent output as string
        """
        self.setup_environment(config)
        
        # Get agent configuration
        agent_cfg = get_agent_config(agent_name, strict_mode=False)
        
        # Update status
        if status_callback:
            status_callback(agent_name, "running", 50)
        
        # Log start
        if log_callback:
            log_callback("info", agent_name, f"Regenerating {agent_cfg['label']}...")
        
        # Build prompt with context
        prompt = self._build_prompt(agent_name, inputs, previous_results)
        
        # Execute agent
        logger.info(f"Regenerating agent: {agent_name}")
        response = await run_agent_async(
            instructions=agent_cfg["instructions"],
            prompt=prompt,
            verbose=False
        )
        
        # Log completion
        if log_callback:
            log_callback("success", agent_name, f"Regenerated {agent_cfg['label']}")
        
        # Update status
        if status_callback:
            status_callback(agent_name, "completed", 100)
        
        return response


# Global service instance
_agent_service: Optional[AgentService] = None


def get_agent_service() -> AgentService:
    """Get or create agent service singleton."""
    global _agent_service
    if _agent_service is None:
        _agent_service = AgentService()
    return _agent_service
