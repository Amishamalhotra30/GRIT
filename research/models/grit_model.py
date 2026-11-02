"""Compact point-cloud graspness model and GRIT representation variants.

This is a research prototype, not a reproduction of the full GraspNet baseline.
Input: xyz [B,N,3], optional point features [B,N,C]. Output: per-point graspness logits.
"""
from __future__ import annotations
import torch
from torch import nn

METHODS = ('standard', 'uniform', 'robustness_trained', 'grit')
ABLATIONS = ('no_task_awareness', 'no_redundancy', 'no_recovery', 'reduced_redundancy')

class FeatureEncoder(nn.Module):
    def __init__(self, in_dim=3, width=128):
        super().__init__()
        self.net = nn.Sequential(nn.Linear(in_dim, width), nn.LayerNorm(width), nn.GELU(),
                                 nn.Linear(width, width), nn.LayerNorm(width), nn.GELU())
    def forward(self, x): return self.net(x)

class GRITModel(nn.Module):
    def __init__(self, method='grit', ablation=None, in_dim=3, width=128, redundancy=2):
        super().__init__()
        if method not in METHODS: raise ValueError(f'Unknown method: {method}')
        if ablation and ablation not in ABLATIONS: raise ValueError(f'Unknown ablation: {ablation}')
        self.method, self.ablation = method, ablation
        self.width = width
        self.encoder = FeatureEncoder(in_dim, width)
        use_red = method in ('uniform','grit') and ablation != 'no_redundancy'
        if ablation == 'reduced_redundancy': redundancy = max(1, redundancy // 2)
        self.red_dim = width * redundancy if use_red else width
        self.redundancy = nn.Linear(width, self.red_dim) if use_red else nn.Identity()
        self.task_gate = nn.Sequential(nn.Linear(self.red_dim, self.red_dim), nn.Sigmoid()) if method == 'grit' and ablation != 'no_task_awareness' else None
        self.recovery = nn.Sequential(nn.Linear(self.red_dim, self.red_dim), nn.GELU(), nn.Linear(self.red_dim, self.red_dim)) if method == 'grit' and ablation != 'no_recovery' else nn.Identity()
        self.head = nn.Sequential(nn.Linear(self.red_dim, width), nn.GELU(), nn.Linear(width, 1))
        self.aux_head = nn.Linear(self.red_dim, 3) # prototype grasp approach vector
    def forward(self, xyz, return_features=False):
        z = self.redundancy(self.encoder(xyz))
        if self.task_gate is not None: z = z * (1.0 + self.task_gate(z))
        if not isinstance(self.recovery, nn.Identity): z = z + self.recovery(z)
        graspness = self.head(z).squeeze(-1)
        approach = self.aux_head(z)
        if return_features: return {'graspness_logits': graspness, 'approach': approach, 'features': z}
        return {'graspness_logits': graspness, 'approach': approach}

def build_model(method='grit', ablation=None, **kwargs):
    return GRITModel(method=method, ablation=ablation, **kwargs)
