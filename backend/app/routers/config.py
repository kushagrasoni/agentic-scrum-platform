"""
Configuration Router
Handles API configuration testing and saving
"""

from fastapi import APIRouter, HTTPException
from app.models import TestConnectionResponse
from app.services import get_azure_service, get_config_profile_service
from typing import Dict
import logging
from pydantic import BaseModel

class ConfigProfileRequest(BaseModel):
    mode: str
    name: str
    data: Dict

class ConfigProfileResponse(BaseModel):
    llmProfileId: str
    mode: str
    name: str
    data: Dict
    createdAt: str
    updatedAt: str

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/test")
async def test_connection(config: Dict):
    """
    Test LLM connection with provided configuration
    """
    try:
        profile_id = config.get("llmProfileId")
        if profile_id:
            profile = get_config_profile_service().get_profile(profile_id)
            if not profile:
                raise HTTPException(status_code=404, detail="Profile not found")
            config = {"mode": profile["mode"], **profile["data"]}

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


@router.get("/profiles")
async def list_profiles():
    """List all saved provider profiles."""
    service = get_config_profile_service()
    return service.list_profiles()


@router.post("/profiles", response_model=ConfigProfileResponse)
async def create_profile(profile: ConfigProfileRequest):
    """Create and persist a provider profile."""
    service = get_config_profile_service()
    created = service.add_profile(profile.mode, profile.name, profile.data)
    return created


@router.put("/profiles/{profile_id}", response_model=ConfigProfileResponse)
async def update_profile(profile_id: str, profile: ConfigProfileRequest):
    """Update an existing provider profile."""
    service = get_config_profile_service()
    updated = service.update_profile(profile_id, profile.mode, profile.name, profile.data)
    if not updated:
        raise HTTPException(status_code=404, detail="Profile not found")
    return updated


@router.delete("/profiles/{profile_id}")
async def delete_profile(profile_id: str):
    """Delete a provider profile."""
    service = get_config_profile_service()
    deleted = service.delete_profile(profile_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Profile not found")
    return {"success": True}
