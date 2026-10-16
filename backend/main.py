"""
KEYSTONE — FastAPI Application
Stage 3C: REST API wrapping the failure_engine with backup modeling

Endpoints
---------
GET  /health          → {"status": "ok", "stage": "3C"}
POST /api/analyze     → full_report() from FailureEngine

DISCLAIMER: Results are estimates from a simplified sequential-line
model. Not industrially validated data.
"""

from __future__ import annotations

import sys
import os

# Allow running from project root or backend/
sys.path.insert(0, os.path.dirname(__file__))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
from typing import Any

from failure_engine import FailureEngine
from mitigation_engine import MitigationEngine


# ---------------------------------------------------------------------------
# App instance
# ---------------------------------------------------------------------------

app = FastAPI(
    title="KEYSTONE Failure Analysis & Mitigation API",
    description=(
        "Deterministic production-line failure scenario search engine with backup paths "
        "and AI-assisted mitigation recommendation layer. "
        "Results are ESTIMATES based on a simplified sequential-line model "
        "and are NOT industrially validated data."
    ),
    version="4.1.0",
)

# ---------------------------------------------------------------------------
# CORS — allow the Vite dev server on any common port
# ---------------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite default
        "http://localhost:5174",  # Vite fallback
        "http://localhost:5175",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Request / response models
# ---------------------------------------------------------------------------

class MachineIn(BaseModel):
    id: str = Field(..., min_length=1, description="Unique machine identifier")
    name: str = Field(..., min_length=1, description="Human-readable station name")
    capacity_per_min: float = Field(
        ..., gt=0, description="Maximum primary throughput in units/minute (must be > 0)"
    )
    backup_capacity_per_min: float = Field(
        default=0.0, ge=0, description="Throughput when backup machine is engaged (>= 0)"
    )
    backup_enabled: bool = Field(
        default=False, description="Whether the backup machine is active/enabled"
    )
    dependencies: list[str] = Field(
        default_factory=list,
        description="Upstream machine IDs (accepted; not yet used in strict-serial model)",
    )

    @field_validator("id")
    @classmethod
    def id_no_spaces(cls, v: str) -> str:
        if " " in v:
            raise ValueError("Machine id must not contain spaces")
        return v


class AnalyzeRequest(BaseModel):
    machines: list[MachineIn] = Field(
        ..., min_length=1, description="Ordered list of machines (sequential line)"
    )

    @field_validator("machines")
    @classmethod
    def unique_ids(cls, machines: list[MachineIn]) -> list[MachineIn]:
        ids = [m.id for m in machines]
        if len(ids) != len(set(ids)):
            raise ValueError("All machine IDs must be unique")
        return machines


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/health", tags=["Meta"])
def health() -> dict[str, str]:
    """Confirm the API is running."""
    return {
        "status": "ok",
        "stage": "4A",
        "note": (
            "KEYSTONE Failure Analysis & Mitigation API — results are estimates "
            "from a simplified sequential-line model with mitigation recommendations."
        ),
    }


@app.post("/api/analyze", tags=["Analysis"])
def analyze(request: AnalyzeRequest) -> dict[str, Any]:
    """
    Accept a factory configuration and return a full failure analysis report.
    """
    config = {
        "machines": [
            {
                "id": m.id,
                "name": m.name,
                "capacity_per_min": m.capacity_per_min,
                "backup_capacity_per_min": m.backup_capacity_per_min,
                "backup_enabled": m.backup_enabled,
                "dependencies": m.dependencies,
            }
            for m in request.machines
        ]
    }

    try:
        engine = FailureEngine(config)
        report = engine.full_report()
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Internal engine error: {exc}",
        ) from exc

    return report


@app.post("/api/recommendations", tags=["Mitigation"])
def get_recommendations(request: AnalyzeRequest) -> dict[str, Any]:
    """
    Accept factory configuration, evaluate failure risks, and return
    prioritized mitigations grounded in simulation verification.
    """
    config = {
        "machines": [
            {
                "id": m.id,
                "name": m.name,
                "capacity_per_min": m.capacity_per_min,
                "backup_capacity_per_min": m.backup_capacity_per_min,
                "backup_enabled": m.backup_enabled,
                "dependencies": m.dependencies,
            }
            for m in request.machines
        ]
    }

    try:
        mitigation_engine = MitigationEngine(config)
        return mitigation_engine.generate_mitigations()
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Internal mitigation engine error: {exc}",
        ) from exc

