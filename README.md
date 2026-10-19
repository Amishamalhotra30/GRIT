# GRIT

**Task-Aware Error-Correcting Visual Representations for Robust Robotic Perception Under Catastrophic Information Loss**

This repository is the local-first scaffold for the GRIT major project.

## Locked scope
- Dataset: GraspNet-1Billion
- Primary methods: Standard, Uniform Redundancy, Robustness-trained, Full GRIT
- Ablations: No Task Awareness, No Redundancy, No Recovery Module, Reduced Redundancy (50%)
- Representation-level corruptions: random erasing, block erasing, burst corruption, feature noise
- Robot simulation: Franka Panda with PyBullet
- Dashboard: React + TypeScript, backed by FastAPI
- Compute: local development first; Kaggle/Colab free-tier GPU sessions later; no paid cloud resources

## Important research rule
No benchmark numbers should be shown as results until they have been measured and exported by a real run. Subset results must be labelled as subset results.

## Repository layout
- `research/`: model adapters, corruption, training, evaluation, export
- `configs/`: explicit experiment configurations
- `notebooks/`: staged notebooks for Kaggle/Colab
- `backend/`: local FastAPI API
- `frontend/`: dashboard
- `simulation/`: PyBullet simulation
- `tests/`: unit tests
- `data/`: instructions only; do not commit dataset files
- `artifacts/`: generated outputs; do not commit large checkpoints

## Day 1 setup
1. Create/activate a Python virtual environment.
2. Install `requirements/research.txt`.
3. Run `python -m pytest`.
4. Read `docs/experiment_protocol.md`.
5. Do not download the full dataset yet.

See `docs/day1_checklist.md` for the next steps.
