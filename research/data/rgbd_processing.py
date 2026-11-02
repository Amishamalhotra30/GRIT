
"""RGB-D image processing utilities for the GRIT project.

These functions are dataset-agnostic. Verify the depth scale, camera
intrinsics, and coordinate conventions before using them with GraspNet.
"""

from __future__ import annotations

import numpy as np
from numpy.typing import NDArray


def depth_to_meters(
    depth: NDArray[np.number],
    depth_scale: float,
) -> NDArray[np.float32]:
    """Convert a depth image to meters.

    Args:
        depth: Raw depth values from a depth image.
        depth_scale: Number of raw depth units per meter.
            For example, 1000 means raw depth 1000 = 1 meter.

    Returns:
        Float32 depth image in meters. Invalid or nonpositive values
        become NaN.

    Note:
        Confirm the dataset's actual depth encoding before choosing
        depth_scale. Do not assume every dataset uses millimeters.
    """
    if not np.isfinite(depth_scale) or depth_scale <= 0:
        raise ValueError("depth_scale must be a finite positive number.")

    depth_array = np.asarray(depth, dtype=np.float32)

    valid = np.isfinite(depth_array) & (depth_array > 0)

    result = np.full(depth_array.shape, np.nan, dtype=np.float32)
    result[valid] = depth_array[valid] / depth_scale

    return result


def backproject_depth(
    depth_m: NDArray[np.number],
    fx: float,
    fy: float,
    cx: float,
    cy: float,
    organized: bool = False,
) -> NDArray[np.float32]:
    """Back-project a depth image into a 3D point cloud.

    Uses the pinhole-camera model:

        X = (u - cx) * Z / fx
        Y = (v - cy) * Z / fy
        Z = depth

    Args:
        depth_m: Two-dimensional depth image in meters.
        fx, fy: Focal lengths in pixel units.
        cx, cy: Principal point in pixel coordinates.
        organized: If True, return shape (H, W, 3), retaining the
            image layout. Invalid pixels contain NaNs.
            If False, return only valid points with shape (N, 3).

    Returns:
        XYZ coordinates as a float32 array.
    """
    depth = np.asarray(depth_m, dtype=np.float32)

    if depth.ndim != 2:
        raise ValueError("depth_m must be a 2D array.")

    intrinsics = np.asarray([fx, fy, cx, cy], dtype=np.float64)

    if not np.all(np.isfinite(intrinsics)):
        raise ValueError("Camera intrinsics must be finite.")

    if fx <= 0 or fy <= 0:
        raise ValueError("Focal lengths fx and fy must be positive.")

    height, width = depth.shape

    u, v = np.meshgrid(
        np.arange(width, dtype=np.float32),
        np.arange(height, dtype=np.float32),
    )

    z = depth
    x = (u - np.float32(cx)) * z / np.float32(fx)
    y = (v - np.float32(cy)) * z / np.float32(fy)

    points = np.stack((x, y, z), axis=-1).astype(np.float32)

    valid = np.isfinite(depth) & (depth > 0)
    points[~valid] = np.nan

    if organized:
        return points

    return points[valid]


def rgbd_to_pointcloud(
    rgb: NDArray[np.number],
    depth_m: NDArray[np.number],
    fx: float,
    fy: float,
    cx: float,
    cy: float,
) -> tuple[NDArray[np.float32], NDArray[np.uint8]]:
    """Convert an RGB image and aligned depth image into XYZ and RGB arrays.

    Args:
        rgb: RGB image of shape (H, W, 3).
        depth_m: Aligned depth image of shape (H, W), in meters.
        fx, fy, cx, cy: Camera intrinsics.

    Returns:
        points: Valid XYZ points with shape (N, 3).
        colors: Corresponding RGB values with shape (N, 3).

    Important:
        This function assumes RGB and depth are pixel-aligned and that
        rgb is already in RGB channel order, not BGR.
    """
    rgb_array = np.asarray(rgb)
    depth_array = np.asarray(depth_m)

    if rgb_array.ndim != 3 or rgb_array.shape[2] != 3:
        raise ValueError("rgb must have shape (H, W, 3).")

    if depth_array.ndim != 2:
        raise ValueError("depth_m must be a 2D array.")

    if rgb_array.shape[:2] != depth_array.shape:
        raise ValueError(
            "RGB and depth images must have matching height and width."
        )

    points = backproject_depth(
        depth_m=depth_array,
        fx=fx,
        fy=fy,
        cx=cx,
        cy=cy,
        organized=True,
    )

    valid = np.isfinite(depth_array) & (depth_array > 0)

    colors = np.asarray(rgb_array[valid], dtype=np.uint8)
    valid_points = np.asarray(points[valid], dtype=np.float32)

    return valid_points, colors
