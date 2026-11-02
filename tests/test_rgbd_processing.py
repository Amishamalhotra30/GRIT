
"""Tests for GRIT RGB-D and point-cloud processing utilities."""

import numpy as np
import pytest

from research.data.rgbd_processing import (
    backproject_depth,
    depth_to_meters,
    rgbd_to_pointcloud,
)
from research.data.pointcloud import (
    transform_points,
    voxel_downsample,
)


def test_depth_to_meters_converts_values():
    depth = np.array([[1000, 2000], [0, 500]], dtype=np.uint16)

    result = depth_to_meters(depth, depth_scale=1000)

    assert result.dtype == np.float32
    assert result[0, 0] == pytest.approx(1.0)
    assert result[0, 1] == pytest.approx(2.0)
    assert np.isnan(result[1, 0])
    assert result[1, 1] == pytest.approx(0.5)


def test_depth_to_meters_rejects_invalid_scale():
    depth = np.array([[1000]], dtype=np.uint16)

    with pytest.raises(ValueError):
        depth_to_meters(depth, depth_scale=0)

    with pytest.raises(ValueError):
        depth_to_meters(depth, depth_scale=-1)


def test_backproject_depth_known_geometry():
    depth = np.array([[1.0, 1.0]], dtype=np.float32)

    points = backproject_depth(
        depth,
        fx=1.0,
        fy=1.0,
        cx=0.0,
        cy=0.0,
    )

    expected = np.array(
        [
            [0.0, 0.0, 1.0],
            [1.0, 0.0, 1.0],
        ],
        dtype=np.float32,
    )

    np.testing.assert_allclose(points, expected)


def test_backproject_depth_filters_invalid_pixels():
    depth = np.array(
        [[1.0, 0.0], [np.nan, 2.0]],
        dtype=np.float32,
    )

    points = backproject_depth(
        depth,
        fx=1.0,
        fy=1.0,
        cx=0.0,
        cy=0.0,
    )

    assert points.shape == (2, 3)
    assert np.all(np.isfinite(points))
    np.testing.assert_allclose(
        points[:, 2],
        np.array([1.0, 2.0], dtype=np.float32),
    )


def test_backproject_depth_organized_shape():
    depth = np.ones((3, 4), dtype=np.float32)

    points = backproject_depth(
        depth,
        fx=2.0,
        fy=2.0,
        cx=1.5,
        cy=1.0,
        organized=True,
    )

    assert points.shape == (3, 4, 3)


def test_rgbd_to_pointcloud_preserves_color_alignment():
    rgb = np.array(
        [
            [[255, 0, 0], [0, 255, 0]],
            [[0, 0, 255], [255, 255, 0]],
        ],
        dtype=np.uint8,
    )

    depth = np.array(
        [[1.0, 0.0], [2.0, 3.0]],
        dtype=np.float32,
    )

    points, colors = rgbd_to_pointcloud(
        rgb,
        depth,
        fx=1.0,
        fy=1.0,
        cx=0.0,
        cy=0.0,
    )

    assert points.shape == (3, 3)
    assert colors.shape == (3, 3)

    expected_colors = np.array(
        [
            [255, 0, 0],
            [0, 0, 255],
            [255, 255, 0],
        ],
        dtype=np.uint8,
    )

    np.testing.assert_array_equal(colors, expected_colors)


def test_transform_points_applies_translation():
    points = np.array(
        [
            [0.0, 0.0, 0.0],
            [1.0, 2.0, 3.0],
        ],
        dtype=np.float32,
    )

    transform = np.eye(4, dtype=np.float32)
    transform[:3, 3] = [10.0, 20.0, 30.0]

    result = transform_points(points, transform)

    expected = np.array(
        [
            [10.0, 20.0, 30.0],
            [11.0, 22.0, 33.0],
        ],
        dtype=np.float32,
    )

    np.testing.assert_allclose(result, expected)


def test_voxel_downsample_averages_points():
    points = np.array(
        [
            [0.1, 0.1, 0.1],
            [0.2, 0.2, 0.2],
            [1.1, 1.1, 1.1],
        ],
        dtype=np.float32,
    )

    result = voxel_downsample(points, voxel_size=1.0)

    assert result.shape == (2, 3)

    expected = np.array(
        [
            [0.15, 0.15, 0.15],
            [1.1, 1.1, 1.1],
        ],
        dtype=np.float32,
    )

    # Voxel order is determined by np.unique, so compare without
    # relying on the returned row order.
    result_sorted = result[np.argsort(result[:, 0])]
    np.testing.assert_allclose(result_sorted, expected, atol=1e-6)


def test_voxel_downsample_handles_empty_input():
    points = np.empty((0, 3), dtype=np.float32)

    result = voxel_downsample(points, voxel_size=0.1)

    assert result.shape == (0, 3)


def test_invalid_camera_intrinsics_are_rejected():
    depth = np.ones((2, 2), dtype=np.float32)

    with pytest.raises(ValueError):
        backproject_depth(
            depth,
            fx=0.0,
            fy=1.0,
            cx=0.0,
            cy=0.0,
        )

    with pytest.raises(ValueError):
        backproject_depth(
            depth,
            fx=np.nan,
            fy=1.0,
            cx=0.0,
            cy=0.0,
        )
