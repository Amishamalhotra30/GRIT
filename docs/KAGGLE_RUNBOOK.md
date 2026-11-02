# Kaggle GPU runbook

1. Create a Kaggle notebook, enable a free GPU accelerator, and attach/import the project files.
2. Install dependencies: `pip install -r requirements/research.txt` (Kaggle images often already include PyTorch).
3. Export GraspNet samples as described in `GRASPNET_ADAPTER.md` into `/kaggle/working/data/processed`.
4. Check the exported data: `python research/data/export_npz.py /kaggle/working/data/processed`.
5. Start with a brief smoke run: `python -m research.training.train --data /kaggle/working/data/processed --method grit --epochs 1 --points 512`.
6. Train each method separately with a fixed scene split and seed. Save checkpoints under `/kaggle/working/artifacts/checkpoints` and download them before the session ends.
7. Run corruption evaluation on each saved checkpoint. Store the JSON output with the checkpoint/config metadata.

For testing only, `--synthetic-smoke` uses procedurally generated point clouds. Those results are plumbing checks and must never be reported as GraspNet performance. Kaggle quotas and session time vary; save checkpoints frequently and do not assume uninterrupted three-day GPU availability.
