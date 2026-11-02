
"""Canonical experiment configuration for GRIT."""

METHODS = (
    "standard",
    "uniform_redundancy",
    "robustness_trained",
    "grit",
)

ABLATIONS = (
    "no_task_awareness",
    "no_redundancy",
    "no_recovery_module",
    "reduced_redundancy_50",
)

CORRUPTIONS = (
    "random_feature_erasing",
    "structured_block_erasing",
    "burst_corruption",
    "feature_noise",
)

SEVERITIES = (0, 10, 20, 30, 40, 50, 60, 70, 80, 90)


def build_experiment_config(
    method: str,
    corruption: str,
    severity: int,
    seed: int = 42,
) -> dict:
    """Validate and build a reproducible experiment specification."""

    if method not in METHODS:
        raise ValueError(f"Unknown method: {method}")

    if corruption not in CORRUPTIONS:
        raise ValueError(f"Unknown corruption: {corruption}")

    if severity not in SEVERITIES:
        raise ValueError(
            f"Severity must be one of {SEVERITIES}"
        )

    if not isinstance(seed, int) or isinstance(seed, bool) or seed < 0:
        raise ValueError("seed must be a non-negative integer")

    return {
        "method": method,
        "corruption": corruption,
        "severity": severity,
        "seed": seed,
        "dataset": "GraspNet-1Billion",
        "task": "6-DoF grasp detection",
    }
