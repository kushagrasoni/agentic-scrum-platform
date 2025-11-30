"""
Response Models
Generic API response models
"""

from pydantic import BaseModel
from typing import Optional, List, Any


class ApiResponse(BaseModel):
    success: bool
    data: Optional[Any] = None
    error: Optional[str] = None
    message: Optional[str] = None


class TestConnectionResponse(BaseModel):
    success: bool
    message: str
    models: Optional[List[str]] = None
