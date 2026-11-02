
"""Load and validate one RGB-D frame from the official GraspNet layout."""

from dataclasses import dataclass
from pathlib import Path

import numpy as np
from numpy.typing import NDArray
from PIL import Image

from research.data.rgbd_processing import (
    depth_to_meters,
    rgbd_to_pointcloud,
)


@dataclass(frozen=True)
class GraspNetFrame:
    scene_id: int
    camera: str
    frame_id: int
    rgb: NDArray[np.uint8]
    depth_m: NDArray[np.float32]
    intrinsics: NDArray[np.float32]
    points: NDArray[np.float32]
    colors: NDArray[np.uint8]


def load_graspnet_frame(
    dataset_root: str | Path,
    scene_id: int,
    camera: str,
    frame_id: int,
    depth_scale: float,
) -> GraspNetFrame:
    """Load one frame. depth_scale is raw depth units per meter.

    Expected layout:
      dataset_root/scenes/scene_XXXX/{camera}/rgb/XXXX.png
      dataset_root/scenes/scene_XXXX/{camera}/depth/XXXX.png
      dataset_root/scenes/scene_XXXX/{camera}/camK.npy

    Calibration and depth scale must match the downloaded dataset.
    """
    root = Path(dataset_root).expanduser()

    if scene_id < 0 or frame_id < 0:
        raise ValueError("scene_id and frame_id must be non-negative.")

    if camera not in {"kinect", "realsense"}:
        raise ValueError("camera must be 'kinect' or 'realsense'.")

    if not np.isfinite(depth_scale) or depth_scale <= 0:
        raise ValueError("depth_scale must be finite and positive.")

    scene = root / "scenes" / f"scene_{scene_id:04d}" / camera
    rgb_path = scene / "rgb" / f"{frame_id:04d}.png"
    depth_path = scene / "depth" / f"{frame_id:04d}.png"
    intrinsics_path = scene / "camK.npy"

    required = (rgb_path, depth_path, intrinsics_path)
    missing = [str(path) for path in required if not path.is_file()]
    if missing:
        raise FileNotFoundError(
            "Missing required GraspNet files:\n" + "\n".join(missing)
        )

    with Image.open(rgb_path) as image:
        rgb = np.asarray(image.convert("RGB"), dtype=np.uint8).copy()

    with Image.open(depth_path) as image:
        raw_depth = np.asarray(image).copy()

    if raw_depth.ndim != 2:
        raise ValueError("Depth image must be a single-channel 2D image.")

    if rgb.shape[:2] != raw_depth.shape:
        raise ValueError(
            f"RGB/depth dimensions differ: {rgb.shape[:2]} "
            f"versus {raw_depth.shape}."
        )

    intrinsics = np.asarray(
        np.load(intrinsics_path, allow_pickle=False),
        dtype=np.float32,
    )

    if intrinsics.shape != (3, 3):
        raise ValueError("camK.npy must contain a 3x3 matrix.")

    if not np.all(np.isfinite(intrinsics)):
        raise ValueError("Camera intrinsics contain non-finite values.")

    if (
        intrinsics[0, 0] <= 0
        or intrinsics[1, 1] <= 0
        or not np.allclose(intrinsics[2], [0, 0, 1])
        or not np.allclose(intrinsics[[0, 1], [1, 0]], [0, 0])
    ):
        raise ValueError("camK.npy is not a valid pinhole intrinsic matrix.")

    depth_m = depth_to_meters(raw_depth, depth_scale)

    points, colors = rgbd_to_pointcloud(
        rgb=rgb,
        depth_m=depth_m,
        fx=float(intrinsics[0, 0]),
        fy=float(intrinsics[1, 1]),
        cx=float(intrinsics[0, 2]),
        cy=float(intrinsics[1, 2]),
    )

    return GraspNetFrame(
        scene_id=scene_id,
        camera=camera,
        frame_id=frame_id,
        rgb=rgb,
        depth_m=depth_m,
        intrinsics=intrinsics,
        points=points,
        colors=colors,
    )
