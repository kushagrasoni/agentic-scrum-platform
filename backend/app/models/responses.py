"""
Response Models
Generic API response models
"""

from pydantic import BaseModel
from typing import Optional, Dict, List


class ApiResponse(BaseModel):
    success: bool
    data: Optional[Dict] = None
    error: Optional[str] = None
    message: Optional[str] = None


class TestConnectionResponse(BaseModel):
    success: bool
    message: str
    models: Optional[List[str]] = None
