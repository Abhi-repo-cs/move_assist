from enum import Enum
from typing import List

from pydantic import BaseModel, Field


class ResponseMode(str, Enum):
    concise = "concise"
    detailed = "detailed"


class Observation(BaseModel):
    object: str = Field(..., min_length=1, max_length=120)
    relative_position: str = Field(..., max_length=120)
    confidence: float = Field(..., ge=0.0, le=1.0)


class AnalysisResult(BaseModel):
    """What the vision model must return (and what we validate)."""

    answer: str = Field(..., min_length=1, max_length=1500)
    observations: List[Observation] = Field(default_factory=list, max_length=12)
    interpretation: str = Field(default="", max_length=800)
    uncertainty: str = Field(..., min_length=1, max_length=800)
    safety_note: str = Field(..., min_length=1, max_length=400)


class AnalyzeResponse(AnalysisResult):
    demo_mode: bool = False
    model: str = ""


class HealthResponse(BaseModel):
    status: str
    demo_mode: bool
    ai_configured: bool
    mode_label: str


class ErrorResponse(BaseModel):
    detail: str
