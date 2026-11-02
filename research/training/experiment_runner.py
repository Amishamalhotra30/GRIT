
"""GRIT experiment orchestration.

This module manages experiment lifecycle and delegates actual model work
to an explicitly supplied executor. It does not fabricate training results.
"""

from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from threading import Lock
from typing import Any, Callable
import json
import traceback
import uuid


METHODS = {
    "standard",
    "uniform_redundancy",
    "robustness_trained",
    "grit",
}

ABLATIONS = {
    "no_task_awareness",
    "no_redundancy",
    "no_recovery_module",
    "reduced_redundancy_50",
}

CORRUPTIONS = {
    "random_feature_erasing",
    "structured_block_erasing",
    "burst_corruption",
    "feature_noise",
}

SEVERITIES = tuple(range(0, 100, 10))

Executor = Callable[[dict[str, Any]], dict[str, Any]]


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def validate_config(config: dict[str, Any]) -> dict[str, Any]:
    """Validate an experiment specification before execution."""

    method = config.get("method")
    corruption = config.get("corruption")
    severity = config.get("severity")
    seed = config.get("seed", 42)
    ablation = config.get("ablation")

    if method not in METHODS:
        raise ValueError(f"Unsupported method: {method}")

    if corruption not in CORRUPTIONS:
        raise ValueError(f"Unsupported corruption: {corruption}")

    if (
        not isinstance(severity, int)
        or isinstance(severity, bool)
        or severity not in SEVERITIES
    ):
        raise ValueError(f"Severity must be one of {SEVERITIES}")

    if not isinstance(seed, int) or isinstance(seed, bool) or seed < 0:
        raise ValueError("seed must be a non-negative integer")

    if ablation is not None and ablation not in ABLATIONS:
        raise ValueError(f"Unsupported ablation: {ablation}")

    result = {
        "method": method,
        "corruption": corruption,
        "severity": severity,
        "seed": seed,
        "dataset": config.get("dataset", "GraspNet-1Billion"),
        "task": config.get("task", "6-DoF grasp detection"),
    }

    if ablation is not None:
        result["ablation"] = ablation

    return result


class ExperimentRunner:
    """Persist and execute experiments through a real supplied executor.

    Executor contract:
      executor(config) -> {
          "metrics": {... measured numeric metrics ...},
          "artifacts": {... optional artifact paths ...}
      }

    The executor must perform actual training/evaluation and return only
    metrics it genuinely measured. Without an executor, runs cannot start.
    """

    def __init__(
        self,
        metadata_path: str | Path,
        executor: Executor | None = None,
    ) -> None:
        self.metadata_path = Path(metadata_path)
        self.executor = executor
        self._lock = Lock()
        self._experiments: dict[str, dict[str, Any]] = {}
        self._load()

    def _load(self) -> None:
        if not self.metadata_path.exists():
            return

        saved = json.loads(self.metadata_path.read_text(encoding="utf-8"))
        if not isinstance(saved, list):
            raise ValueError("Experiment metadata must contain a JSON list.")

        for item in saved:
            if not isinstance(item, dict) or "id" not in item:
                continue
            if item.get("status") in {"queued", "running"}:
                item["status"] = "interrupted"
                item["updated_at"] = utc_now()
                item["message"] = "Process ended before completion."
            self._experiments[item["id"]] = item

        self._save()

    def _save(self) -> None:
        self.metadata_path.parent.mkdir(parents=True, exist_ok=True)
        temporary = self.metadata_path.with_suffix(".tmp")
        temporary.write_text(
            json.dumps(list(self._experiments.values()), indent=2),
            encoding="utf-8",
        )
        temporary.replace(self.metadata_path)

    def create(self, config: dict[str, Any]) -> dict[str, Any]:
        validated = validate_config(config)
        experiment_id = str(uuid.uuid4())
        now = utc_now()

        record = {
            "id": experiment_id,
            "created_at": now,
            "updated_at": now,
            "config": validated,
            "status": "queued",
            "message": "Configuration queued; execution has not started.",
            "metrics": None,
            "artifacts": None,
            "error": None,
        }

        with self._lock:
            self._experiments[experiment_id] = record
            self._save()

        return record.copy()

    def get(self, experiment_id: str) -> dict[str, Any] | None:
        with self._lock:
            record = self._experiments.get(experiment_id)
            return record.copy() if record else None

    def list(self) -> list[dict[str, Any]]:
        with self._lock:
            return [record.copy() for record in self._experiments.values()]

    def run(self, experiment_id: str) -> dict[str, Any]:
        """Run a queued experiment synchronously with the configured executor."""

        if self.executor is None:
            raise RuntimeError(
                "No research executor is connected. "
                "Do not mark this experiment as completed."
            )

        with self._lock:
            record = self._experiments.get(experiment_id)

            if record is None:
                raise KeyError(f"Experiment not found: {experiment_id}")

            if record["status"] != "queued":
                raise ValueError(
                    f"Cannot run experiment in state {record['status']!r}"
                )

            record["status"] = "running"
            record["message"] = "Training/evaluation is running."
            record["updated_at"] = utc_now()
            self._save()
            config = dict(record["config"])

        try:
            output = self.executor(config)

            if not isinstance(output, dict):
                raise TypeError("Executor must return a dictionary.")

            metrics = output.get("metrics")
            artifacts = output.get("artifacts", {})

            if not isinstance(metrics, dict) or not metrics:
                raise ValueError(
                    "Executor must return measured metrics as a non-empty dict."
                )

            for name, value in metrics.items():
                if (
                    not isinstance(name, str)
                    or not isinstance(value, (int, float))
                    or isinstance(value, bool)
                ):
                    raise ValueError(
                        "Metrics must map string names to numeric values."
                    )

            if not isinstance(artifacts, dict):
                raise ValueError("artifacts must be a dictionary.")

            with self._lock:
                record = self._experiments[experiment_id]
                record["status"] = "completed"
                record["message"] = "Executor completed successfully."
                record["metrics"] = metrics
                record["artifacts"] = artifacts
                record["updated_at"] = utc_now()
                self._save()
                return record.copy()

        except Exception as exc:
            with self._lock:
                record = self._experiments[experiment_id]
                record["status"] = "failed"
                record["message"] = "Training/evaluation failed."
                record["error"] = {
                    "type": type(exc).__name__,
                    "message": str(exc),
                    "traceback": traceback.format_exc(),
                }
                record["updated_at"] = utc_now()
                self._save()
            raise
