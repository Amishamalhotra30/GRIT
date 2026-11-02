
from pathlib import Path
from threading import Lock

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from backend.experiment_config import (
    METHODS,
    ABLATIONS,
    CORRUPTIONS,
    SEVERITIES,
)
from research.training.experiment_runner import ExperimentRunner

app = FastAPI(
    title="GRIT Research API",
    description="Local API for GRIT robotic perception experiments.",
    version="0.3.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PROJECT_ROOT = Path(__file__).resolve().parent.parent
METADATA_PATH = PROJECT_ROOT / "artifacts" / "experiments" / "experiments.json"

# The real training executor will be connected in a later implementation.
runner = ExperimentRunner(metadata_path=METADATA_PATH)
run_lock = Lock()


class ExperimentRequest(BaseModel):
    method: str
    corruption: str
    severity: int = Field(ge=0, le=90)
    seed: int = Field(default=42, ge=0)
    ablation: str | None = None


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "project": "GRIT",
        "mode": "local",
    }


@app.get("/api/experiments/methods")
def experiment_methods():
    return {
        "methods": list(METHODS),
        "ablations": list(ABLATIONS),
        "corruptions": list(CORRUPTIONS),
        "severities": list(SEVERITIES),
        "results_available": False,
    }


@app.post("/api/experiments/configure")
def configure_experiment(request: ExperimentRequest):
    config = request.model_dump()

    try:
        from research.training.experiment_runner import validate_config
        validated = validate_config(config)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    return {
        "valid": True,
        "config": validated,
        "note": "Validated only; no training has run.",
    }


@app.post("/api/experiments", status_code=201)
def create_experiment(request: ExperimentRequest):
    try:
        return runner.create(request.model_dump())
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@app.get("/api/experiments")
def list_experiments():
    experiments = runner.list()
    return {
        "count": len(experiments),
        "experiments": experiments,
    }


@app.get("/api/experiments/{experiment_id}")
def get_experiment(experiment_id: str):
    experiment = runner.get(experiment_id)

    if experiment is None:
        raise HTTPException(status_code=404, detail="Experiment not found")

    return experiment


@app.post("/api/experiments/{experiment_id}/run")
def run_experiment(experiment_id: str):
    # Prevent simultaneous run requests within this API process.
    if not run_lock.acquire(blocking=False):
        raise HTTPException(
            status_code=409,
            detail="Another experiment run is being requested.",
        )

    try:
        try:
            return runner.run(experiment_id)
        except KeyError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc
        except ValueError as exc:
            raise HTTPException(status_code=409, detail=str(exc)) from exc
        except RuntimeError as exc:
            # Expected until a real training executor is connected.
            raise HTTPException(status_code=503, detail=str(exc)) from exc
        except Exception as exc:
            raise HTTPException(
                status_code=500,
                detail=f"Experiment execution failed: {exc}",
            ) from exc
    finally:
        run_lock.release()
