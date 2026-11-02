#!/usr/bin/env bash
set -euo pipefail
DATA="${1:-data/processed}"
EPOCHS="${2:-5}"
for method in standard uniform robustness_trained grit; do
  python -m research.training.train --data "$DATA" --method "$method" --epochs "$EPOCHS" --out artifacts/checkpoints
 done
