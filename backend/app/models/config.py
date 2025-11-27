"""
Configuration Models
Pydantic models for API configuration
"""

from pydantic import BaseModel, Field
from typing import Literal


class OllamaConfigModel(BaseModel):
    mode: Literal["ollama"] = "ollama"
    url: str
    model: str


class OpenAIConfigModel(BaseModel):
    mode: Literal["openai"] = "openai"
    apiKey: str = Field(..., alias="apiKey")
    model: str


class AzureConfigModel(BaseModel):
    mode: Literal["azure"] = "azure"
    apiKey: str = Field(..., alias="apiKey")
    endpoint: str
    deployment: str
    apiVersion: str = Field(..., alias="apiVersion")
