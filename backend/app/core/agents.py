"""
Agent execution logic for PraisonAI
Handles running agents with consistent configuration and environment setup
"""
from __future__ import annotations

import os
import logging
from typing import Optional
from praisonaiagents import Agent

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def run_agent(
    instructions: str, 
    prompt: str, 
    *, 
    verbose: bool = False, 
    stream: bool = False
) -> str:
    """
    Execute a PraisonAI Agent and return text output.
    
    Args:
        instructions: System instructions for the agent
        prompt: User prompt/query
        verbose: Enable verbose logging
        stream: Enable streaming (not implemented in basic version)
    
    Returns:
        Agent response as string
    """
    model_name = os.environ.get("OPENAI_MODEL_NAME")
    api_key = os.environ.get("OPENAI_API_KEY")
    
    logger.info(f"run_agent called with model: {model_name}")
    logger.info(f"Base URL: {os.environ.get('OPENAI_BASE_URL')}")
    logger.info(f"Azure Endpoint: {os.environ.get('AZURE_OPENAI_ENDPOINT')}")
    logger.info(f"Azure API Version: {os.environ.get('AZURE_OPENAI_API_VERSION')}")

    try:
        # Agent will use the patched OpenAIClient which handles APIM headers
        agent = Agent(
            llm=model_name,
            api_key=api_key,
            instructions=instructions,
            verbose=verbose,
            stream=False,
        )
        logger.info("Agent created successfully, calling chat...")
        resp = agent.chat(prompt=prompt or "")
        logger.info(f"Agent response received: {str(resp)[:100]}...")
        return str(resp) if resp is not None else ""
    except Exception as e:
        logger.error(f"Error in run_agent: {type(e).__name__}: {str(e)}", exc_info=True)
        raise


async def run_agent_async(
    instructions: str,
    prompt: str,
    *,
    verbose: bool = False,
    callback=None
) -> str:
    """
    Async version of agent execution with optional streaming callback.
    
    Args:
        instructions: System instructions for the agent
        prompt: User prompt/query
        verbose: Enable verbose logging
        callback: Optional callback function for streaming chunks
    
    Returns:
        Agent response as string
    """
    model_name = os.environ.get("OPENAI_MODEL_NAME")
    api_key = os.environ.get("OPENAI_API_KEY")
    
    # Debug: Log all relevant environment variables
    logger.info(f"Environment check in run_agent_async:")
    logger.info(f"  OPENAI_MODEL_NAME: {model_name}")
    logger.info(f"  OPENAI_API_KEY: {'***' if api_key else None}")
    logger.info(f"  AZURE_OPENAI_ENDPOINT: {os.environ.get('AZURE_OPENAI_ENDPOINT')}")
    logger.info(f"  AZURE_OPENAI_API_VERSION: {os.environ.get('AZURE_OPENAI_API_VERSION')}")

    if not model_name:
        raise RuntimeError("OPENAI_MODEL_NAME not configured")

    logger.info(f"run_agent_async called with model: {model_name}")

    try:
        # Create agent with async support
        agent = Agent(
            llm=model_name,
            api_key=api_key,
            instructions=instructions,
            verbose=verbose,
            stream=False,
        )
        
        logger.info("Async agent created, calling chat...")
        resp = agent.chat(prompt=prompt or "")
        
        result = str(resp) if resp is not None else ""
        logger.info(f"Async agent response received: {result[:100]}...")
        
        # Call callback if provided
        if callback and result:
            try:
                callback(result)
            except Exception as cb_err:
                logger.warning(f"Callback error: {cb_err}")
        
        return result
        
    except Exception as e:
        logger.error(f"Error in run_agent_async: {type(e).__name__}: {str(e)}", exc_info=True)
        raise


def validate_environment() -> dict:
    """
    Validate that required environment variables are set.
    
    Returns:
        Dictionary with validation results
    """
    required = ["OPENAI_MODEL_NAME", "OPENAI_API_KEY"]
    missing = [var for var in required if not os.environ.get(var)]
    
    return {
        "valid": len(missing) == 0,
        "missing": missing,
        "model": os.environ.get("OPENAI_MODEL_NAME"),
        "provider": "azure" if os.environ.get("AZURE_OPENAI_ENDPOINT") else "openai"
    }
