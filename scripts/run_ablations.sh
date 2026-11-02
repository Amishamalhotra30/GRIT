#!/usr/bin/env bash
set -euo pipefail
DATA="${1:-data/processed}"
EPOCHS="${2:-5}"
for ablation in no_task_awareness no_redundancy no_recovery reduced_redundancy; do
  python -m research.training.train --data "$DATA" --method grit --ablation "$ablation" --epochs "$EPOCHS" --out artifacts/checkpoints
 done
