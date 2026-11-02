# GRIT — Task-Aware Error-Correcting Visual Representations

Local-first research prototype comparing Standard, Uniform Redundancy, Robustness-trained, and Full GRIT under representation-level corruption. The repository includes a PyTorch point-cloud graspness model, NPZ dataset adapter, training/evaluation scripts, FastAPI experiment registry, React dashboard, and PyBullet scene smoke demo.

## Quick start

### Research environment
```bash
python -m venv .venv
# Windows: .venv\\Scripts\\activate | macOS/Linux: source .venv/bin/activate
pip install -r requirements/research.txt
python -m pytest
python -m research.training.train --synthetic-smoke --epochs 1 --points 128
```

Synthetic mode is only a code smoke test. For research, prepare actual GraspNet-derived `.npz` files as described in `docs/GRASPNET_ADAPTER.md` and train with `--data data/processed`.

### API
```bash
pip install -r backend/requirements.txt
uvicorn backend.app.main:app --reload --port 8000
```

### Dashboard
```bash
cd frontend
npm install
npm run dev
```

### Simulation
```bash
pip install -r requirements/simulation.txt
python simulation/run_demo.py --gui
```

## Kaggle
See `docs/KAGGLE_RUNBOOK.md`. Keep scene-based train/validation splits fixed and export checkpoints/results before session expiry.

## Scientific scope warning
This is a compact prototype, not a full GraspNet baseline, not a 6-DoF pose proposal implementation, and not official GraspNet AP evaluation. Its pointwise graspness accuracy is a prototype metric. Do not present synthetic smoke metrics as research results. See `docs/EXPERIMENT_PROTOCOL.md`.
