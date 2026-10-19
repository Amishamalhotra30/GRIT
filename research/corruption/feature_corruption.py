"""Representation-level corruption utilities.

Input tensors use PyTorch. The last dimension is treated as the feature dimension.
These utilities are deliberately model-agnostic and are not tied to GraspNet yet.
"""
from __future__ import annotations

import torch


def _validate(x: torch.Tensor, severity: float) -> None:
    if not isinstance(x, torch.Tensor):
        raise TypeError("x must be a torch.Tensor")
    if x.numel() == 0:
        raise ValueError("x must not be empty")
    if not 0.0 <= severity <= 1.0:
        raise ValueError("severity must be in [0, 1]")


def _generator(x: torch.Tensor, seed: int | None) -> torch.Generator | None:
    if seed is None:
        return None
    # Generate random masks on CPU for consistent seed behavior, then move to x.device.
    g = torch.Generator(device="cpu")
    g.manual_seed(int(seed))
    return g


def random_erasing(
    x: torch.Tensor, severity: float, seed: int | None = None, fill: float = 0.0
) -> torch.Tensor:
    """Zero/fill a reproducible random fraction of tensor elements."""
    _validate(x, severity)
    if severity == 0:
        return x.clone()
    n = x.numel()
    count = min(n, int(round(n * severity)))
    g = _generator(x, seed)
    indices = torch.randperm(n, generator=g)[:count].to(x.device)
    out = x.clone().reshape(-1)
    out[indices] = fill
    return out.reshape_as(x)


def block_erasing(
    x: torch.Tensor, severity: float, seed: int | None = None, fill: float = 0.0
) -> torch.Tensor:
    """Erase one contiguous interval along the final feature dimension.

    For tensors with leading dimensions, the same feature interval is erased for
    every leading index. This creates a structured feature-group corruption.
    """
    _validate(x, severity)
    if severity == 0:
        return x.clone()
    width = x.shape[-1]
    count = min(width, max(1, int(round(width * severity))))
    g = _generator(x, seed)
    start = int(torch.randint(0, width - count + 1, (1,), generator=g).item())
    out = x.clone()
    out[..., start : start + count] = fill
    return out


def burst_corruption(
    x: torch.Tensor, severity: float, seed: int | None = None, fill: float = 0.0
) -> torch.Tensor:
    """Erase a contiguous burst of flattened elements.

    Unlike block_erasing, the burst is contiguous in flattened tensor order.
    This is a simple first implementation; temporal burst semantics will need a
    sequence-aware adapter if the selected model has a temporal representation.
    """
    _validate(x, severity)
    if severity == 0:
        return x.clone()
    n = x.numel()
    count = min(n, max(1, int(round(n * severity))))
    g = _generator(x, seed)
    start = int(torch.randint(0, n - count + 1, (1,), generator=g).item())
    out = x.clone().reshape(-1)
    out[start : start + count] = fill
    return out.reshape_as(x)


def feature_noise(
    x: torch.Tensor,
    severity: float,
    seed: int | None = None,
    scale: float = 1.0,
) -> torch.Tensor:
    """Add Gaussian noise with std = severity * scale.

    Here severity controls noise magnitude, not the fraction of features changed.
    """
    _validate(x, severity)
    if severity == 0:
        return x.clone()
    g = _generator(x, seed)
    # CPU sampling keeps seeded behavior consistent across device types.
    noise = torch.randn(x.shape, generator=g, dtype=x.dtype, device="cpu")
    noise = noise.to(device=x.device) * (severity * scale)
    return x + noise
