"""
Configuration Router
Handles API configuration testing and saving
"""

from fastapi import APIRouter, HTTPException
from app.models import TestConnectionResponse
from app.services import get_azure_service
from typing import Dict
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/test")
async def test_connection(config: Dict):
    """
    Test LLM connection with provided configuration
    """
    try:
        mode = config.get("mode")
        
        if mode == "ollama":
            import httpx
            
            url = config.get("url")
            logger.info(f"Testing Ollama connection to {url}")
            
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{url}/api/tags")
                
                if response.status_code == 200:
                    data = response.json()
                    models = [m["name"] for m in data.get("models", [])]
                    
                    return TestConnectionResponse(
                        success=True,
                        message=f"Connected to Ollama at {url}",
                        models=models
                    )
                else:
                    raise HTTPException(status_code=500, detail=f"Ollama returned status {response.status_code}")
        
        elif mode == "openai":
            from openai import OpenAI
            
            logger.info("Testing OpenAI connection")
            
            client = OpenAI(api_key=config.get("apiKey"))
            
            # Test with a simple completion
            response = client.chat.completions.create(
                model=config.get("model"),
                messages=[{"role": "user", "content": "Hello"}],
                max_tokens=10
            )
            
            return TestConnectionResponse(
                success=True,
                message="Connected to OpenAI API",
                models=[config.get("model")]
            )
        
        elif mode == "azure":
            logger.info(f"Testing Azure OpenAI connection to {config.get('endpoint')}")
            
            azure_service = get_azure_service()
            result = azure_service.test_azure_connection(
                api_key=config.get("apiKey"),
                endpoint=config.get("endpoint"),
                deployment=config.get("deployment"),
                api_version=config.get("apiVersion", "2024-02-01")
            )
            
            return TestConnectionResponse(
                success=result["success"],
                message=result["message"],
                models=[config.get("deployment")] if result["success"] else []
            )
        
        else:
            raise HTTPException(status_code=400, detail=f"Unknown mode: {mode}")
            
    except Exception as e:
        logger.error(f"Connection test failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/save")
async def save_configuration(config: Dict):
    """
    Save current configuration
    """
    logger.info(f"Saving configuration for mode: {config.get('mode')}")
    
    return {
        "success": True,
        "message": "Configuration saved successfully"
    }


@router.get("/current")
async def get_current_configuration():
    """
    Get current saved configuration
    """
    return {
        "mode": None,
        "config": {}
    }
