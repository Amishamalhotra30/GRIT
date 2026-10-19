import torch
import pytest

from research.corruption import (
    random_erasing,
    block_erasing,
    burst_corruption,
    feature_noise,
)


@pytest.mark.parametrize("fn", [random_erasing, block_erasing, burst_corruption, feature_noise])
def test_zero_severity_is_identity_copy(fn):
    x = torch.arange(24, dtype=torch.float32).reshape(2, 12)
    y = fn(x, 0.0, seed=7)
    assert torch.equal(x, y)
    assert y.data_ptr() != x.data_ptr()


def test_random_erasing_is_reproducible_and_masks_expected_count():
    x = torch.ones(100)
    y1 = random_erasing(x, 0.2, seed=10)
    y2 = random_erasing(x, 0.2, seed=10)
    assert torch.equal(y1, y2)
    assert int((y1 == 0).sum()) == 20


def test_block_erasing_masks_contiguous_feature_range():
    x = torch.ones(2, 10)
    y = block_erasing(x, 0.3, seed=4)
    assert torch.all((y == 0).sum(dim=-1) == 3)
    assert torch.equal(y[0], y[1])


def test_burst_corruption_masks_contiguous_flattened_range():
    x = torch.ones(100)
    y = burst_corruption(x, 0.25, seed=5)
    zero_indices = torch.where(y == 0)[0]
    assert len(zero_indices) == 25
    assert int(zero_indices[-1] - zero_indices[0] + 1) == 25


def test_invalid_severity_raises():
    with pytest.raises(ValueError):
        random_erasing(torch.ones(5), 1.1, seed=1)
