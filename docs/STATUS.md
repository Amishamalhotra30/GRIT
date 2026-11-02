# Build status (single integrated project folder)

## Included and locally smoke-tested
- Original representation corruption operators and their unit tests.
- Compact point-cloud model variants and ablation switches.
- NPZ point-cloud dataset reader and training/checkpoint script.
- Corruption sweep evaluation JSON exporter.
- FastAPI configuration registry and results endpoint.
- React dashboard source with experiment configuration, registry, and results views.
- PyBullet Franka scene smoke script.
- Kaggle runbook and scientific scope/limitations.

## Verification performed in the build environment
- `python -m pytest -q`: 8 tests passed.
- One-epoch CPU synthetic smoke training completed and wrote a checkpoint.

## Not yet established by this package
- Real GraspNet data has not been staged or trained here.
- No full official GraspNet 6-DoF detector or AP evaluator is included.
- No real trained checkpoint or research result is bundled.
- Browser build, live API integration, and PyBullet GUI need validation in the user's target machine/runtime.

This status document is deliberately explicit: the deliverable is a runnable integrated prototype, not a claim that the three-day research sprint has already completed.
