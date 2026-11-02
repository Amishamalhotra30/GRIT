"""Dataset adapters. Supports simple NPZ point/label files for reproducible runs.

NPZ convention: xyz [N,3], graspness [N] (optional; defaults to zeros).
For GraspNet, use its official API to export sampled scene frames to this convention;
see docs/GRASPNET_ADAPTER.md. No benchmark claims are made from synthetic smoke data.
"""
from pathlib import Path
import numpy as np
import torch
from torch.utils.data import Dataset

class NPZPointCloudDataset(Dataset):
    def __init__(self, root, points=1024, synthetic_count=0, seed=17):
        self.root=Path(root); self.files=sorted(self.root.glob('*.npz')) if self.root.exists() else []
        self.synthetic_count=int(synthetic_count); self.points=int(points); self.seed=int(seed)
        if not self.files and self.synthetic_count <= 0:
            raise FileNotFoundError(f'No .npz point-cloud samples in {self.root}. Export GraspNet samples or use --synthetic-smoke.')
    def __len__(self): return len(self.files) if self.files else self.synthetic_count
    def __getitem__(self, idx):
        if self.files:
            with np.load(self.files[idx]) as d:
                xyz=np.asarray(d['xyz'], dtype=np.float32)
                y=np.asarray(d['graspness'], dtype=np.float32) if 'graspness' in d else np.zeros(len(xyz),np.float32)
        else:
            rng=np.random.default_rng(self.seed+idx); xyz=rng.normal(size=(self.points,3)).astype(np.float32)
            # Synthetic labels are for smoke-testing plumbing only, never research metrics.
            y=(xyz[:,2] > np.quantile(xyz[:,2],.65)).astype(np.float32)
        if len(xyz)==0: raise ValueError('Empty point cloud')
        rng=np.random.default_rng(self.seed+idx)
        ids=rng.choice(len(xyz), self.points, replace=len(xyz)<self.points)
        xyz=xyz[ids]; y=y[ids]
        xyz=(xyz-xyz.mean(0))/(xyz.std(0).mean()+1e-6)
        return torch.from_numpy(xyz), torch.from_numpy(y)
