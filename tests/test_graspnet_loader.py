
import numpy as np
import pytest
from PIL import Image

from research.data.graspnet_loader import load_graspnet_frame


def make_fake_scene(root):
    scene = root / "scenes" / "scene_0000" / "kinect"
    (scene / "rgb").mkdir(parents=True)
    (scene / "depth").mkdir()

    rgb = np.zeros((4, 4, 3), dtype=np.uint8)
    rgb[..., 0] = 255

    # Synthetic depth: 1000 raw units = 1 metre
    depth = np.full((4, 4), 1000, dtype=np.uint16)

    Image.fromarray(rgb).save(scene / "rgb" / "0000.png")
    Image.fromarray(depth).save(scene / "depth" / "0000.png")

    intrinsics = np.array(
        [[100, 0, 1.5],
         [0, 100, 1.5],
         [0, 0, 1]],
        dtype=np.float32,
    )
    np.save(scene / "camK.npy", intrinsics)


def test_load_frame_returns_valid_point_cloud(tmp_path):
    make_fake_scene(tmp_path)

    frame = load_graspnet_frame(
        dataset_root=tmp_path,
        scene_id=0,
        camera="kinect",
        frame_id=0,
        depth_scale=1000,
    )

    assert frame.rgb.shape == (4, 4, 3)
    assert frame.depth_m.shape == (4, 4)
    assert frame.intrinsics.shape == (3, 3)
    assert frame.points.shape == (16, 3)
    assert frame.colors.shape == (16, 3)
    assert np.allclose(frame.depth_m, 1.0)
    assert np.all(frame.colors[:, 0] == 255)


def test_missing_frame_raises_clear_error(tmp_path):
    with pytest.raises(FileNotFoundError, match="Missing required"):
        load_graspnet_frame(
            dataset_root=tmp_path,
            scene_id=0,
            camera="kinect",
            frame_id=0,
            depth_scale=1000,
        )


def test_invalid_camera_is_rejected(tmp_path):
    with pytest.raises(ValueError, match="camera"):
        load_graspnet_frame(
            dataset_root=tmp_path,
            scene_id=0,
            camera="invalid",
            frame_id=0,
            depth_scale=1000,
        )
