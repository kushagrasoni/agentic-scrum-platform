"""
Agent Service
Business logic for agent orchestration and execution
"""
from __future__ import annotations

import os
import uuid
import asyncio
from typing import Dict, List, Optional, Callable, Union
from datetime import datetime
import logging

from app.core import run_agent, run_agent_async, get_agent_config, apply_patch
from app.models import AgentStatus, OllamaConfigModel, OpenAIConfigModel, AzureConfigModel

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
        checkpoint_callback: Optional[Callable] = None
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
        
        Returns:
            Dictionary with execution results and artifacts
        """
        self.setup_environment(config)
        
        # Define agent execution order
        agent_sequence = [
            "product_owner",
            "scrum_master",
            "developer",
            "qa_automation",
            "scrum_summary"
        ]
        
        results = {}
        artifacts = []
        
        try:
            for i, agent_name in enumerate(agent_sequence):
                # Get agent configuration
                agent_cfg = get_agent_config(agent_name, strict_mode=False)
                
                # Update status
                if status_callback:
                    status_callback(agent_name, "running", i * 20)
                
                # Log start
                if log_callback:
                    log_callback("info", agent_name, f"Starting {agent_cfg['label']}...")
                
                # Build prompt with context from previous agents
                prompt = self._build_prompt(agent_name, inputs, results)
                
                # Execute agent
                logger.info(f"Executing agent: {agent_name}")
                response = await run_agent_async(
                    instructions=agent_cfg["instructions"],
                    prompt=prompt,
                    verbose=False
                )
                
                # Store result
                results[agent_name] = response
                artifacts.append(agent_cfg["output_filename"])

                if checkpoint_callback:
                    checkpoint_callback(agent_name, response)
                
                # Log completion
                if log_callback:
                    log_callback("success", agent_name, f"Completed {agent_cfg['label']}")
                
                # Update status
                if status_callback:
                    status_callback(agent_name, "completed", (i + 1) * 20)
            
            return {
                "status": "completed",
                "results": results,
                "artifacts": artifacts
            }
            
        except Exception as e:
            logger.error(f"Error in workflow execution: {str(e)}", exc_info=True)
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
            
            # Add SM output for developer and later
            if agent_name in ["developer", "qa_automation", "scrum_summary"] and "scrum_master" in previous_results:
                prompt_parts.append(f"\n=== Scrum Master Output ===\n{previous_results['scrum_master']}")
            
            # Add Dev output for QA and summary
            if agent_name in ["qa_automation", "scrum_summary"] and "developer" in previous_results:
                prompt_parts.append(f"\n=== Developer Output ===\n{previous_results['developer']}")
            
            # Add QA output for summary
            if agent_name == "scrum_summary" and "qa_automation" in previous_results:
                prompt_parts.append(f"\n=== QA Automation Output ===\n{previous_results['qa_automation']}")
        
        return "\n\n".join(prompt_parts)
    
    def get_available_agents(self) -> List[str]:
        """Get list of available agent roles."""
        return ["product_owner", "scrum_master", "developer", "qa_automation", "scrum_summary"]


# Global service instance
_agent_service: Optional[AgentService] = None


def get_agent_service() -> AgentService:
    """Get or create agent service singleton."""
    global _agent_service
    if _agent_service is None:
        _agent_service = AgentService()
    return _agent_service
