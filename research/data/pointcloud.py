
"""Point-cloud transformation and preprocessing utilities for GRIT."""

from __future__ import annotations

import numpy as np
from numpy.typing import NDArray


def transform_points(
    points: NDArray[np.number],
    transform: NDArray[np.number],
) -> NDArray[np.float32]:
    """Transform XYZ points using a 4x4 homogeneous transformation matrix.

    The transformation follows:

        p_transformed = R @ p + t

    where R is the upper-left 3x3 matrix and t is the translation.

    Args:
        points: Array of shape (N, 3).
        transform: Homogeneous transformation matrix of shape (4, 4).

    Returns:
        Transformed points of shape (N, 3), as float32.

    Note:
        The transform must use the same source and destination coordinate
        conventions as the points being transformed.
    """
    points_array = np.asarray(points, dtype=np.float32)
    matrix = np.asarray(transform, dtype=np.float64)

    if points_array.ndim != 2 or points_array.shape[1] != 3:
        raise ValueError("points must have shape (N, 3).")

    if matrix.shape != (4, 4):
        raise ValueError("transform must have shape (4, 4).")

    if not np.all(np.isfinite(matrix)):
        raise ValueError("transform must contain only finite values.")

    if not np.allclose(matrix[3], [0.0, 0.0, 0.0, 1.0]):
        raise ValueError(
            "The last row of transform must be [0, 0, 0, 1]."
        )

    rotation = matrix[:3, :3]
    translation = matrix[:3, 3]

    transformed = points_array @ rotation.T + translation

    return transformed.astype(np.float32)


def voxel_downsample(
    points: NDArray[np.number],
    voxel_size: float,
) -> NDArray[np.float32]:
    """Downsample a point cloud by averaging points in each voxel.

    Points are grouped into cubic voxels with side length voxel_size.
    Each occupied voxel is represented by the mean of its points.

    Args:
        points: XYZ array of shape (N, 3).
        voxel_size: Positive voxel side length, in the same units as XYZ.

    Returns:
        Downsampled XYZ points of shape (M, 3).

    Note:
        This implementation uses NumPy and does not require Open3D.
        Output voxel ordering is determined by NumPy's unique operation.
    """
    points_array = np.asarray(points, dtype=np.float32)

    if points_array.ndim != 2 or points_array.shape[1] != 3:
        raise ValueError("points must have shape (N, 3).")

    if not np.isfinite(voxel_size) or voxel_size <= 0:
        raise ValueError("voxel_size must be a finite positive number.")

    if len(points_array) == 0:
        return np.empty((0, 3), dtype=np.float32)

    if not np.all(np.isfinite(points_array)):
        raise ValueError("points must contain only finite coordinates.")

    voxel_indices = np.floor(
        points_array / np.float32(voxel_size)
    ).astype(np.int64)

    _, inverse = np.unique(
        voxel_indices,
        axis=0,
        return_inverse=True,
    )

    voxel_count = int(inverse.max()) + 1

    sums = np.zeros((voxel_count, 3), dtype=np.float64)
    counts = np.bincount(inverse, minlength=voxel_count)

    np.add.at(sums, inverse, points_array)

    downsampled = sums / counts[:, None]

    return downsampled.astype(np.float32)
