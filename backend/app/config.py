"""
Application Configuration using Pydantic Settings
"""

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings"""
    
    # API Settings
    api_title: str = "ChatGPTeam API"
    api_version: str = "1.0.0"
    
    # Server Settings
    host: str = "0.0.0.0"
    port: int = 8020
    reload: bool = True
    
    # CORS Settings
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:3010"]
    
    # Storage Settings
    output_dir: str = "./output"
    artifacts_dir: str = "./output"
    
    # LLM Settings (optional defaults)
    ollama_url: Optional[str] = "http://localhost:11434"
    ollama_model: Optional[str] = "llama2"
    
    openai_api_key: Optional[str] = None
    openai_model: Optional[str] = "gpt-4"
    
    azure_api_key: Optional[str] = None
    azure_endpoint: Optional[str] = None
    azure_deployment: Optional[str] = None
    azure_api_version: Optional[str] = "2024-02-15-preview"
    
    class Config:
        env_file = ".env"
        case_sensitive = False


# Global settings instance
settings = Settings()
