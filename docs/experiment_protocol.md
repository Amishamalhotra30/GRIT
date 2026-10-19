# Experiment protocol — initial draft

## Primary methods
1. Standard
2. Uniform Redundancy
3. Robustness-trained
4. Full GRIT

## Ablations
1. No Task Awareness
2. No Redundancy
3. No Recovery Module
4. Reduced Redundancy (50%)

## Fairness controls
- Same data split and evaluation samples for comparable runs.
- Same corruption types, severity definitions, and seeds where applicable.
- Record parameter count, representation size, training budget, and latency.
- Select checkpoints using validation data only.
- Keep the official test split isolated until final evaluation.
- Label subset experiments clearly.

## Open decisions before production runs
- Exact baseline repository revision and supported environment.
- Exact representation tensor where corruption is injected.
- Formal definition of redundancy budget and allocation units.
- Training objective and recovery loss.
- Exact GraspNet evaluation settings/AP aggregation.
- Definition of severity for each corruption family.
- Number of seeds and repeated runs feasible under free-tier compute.

Do not treat provisional config values as final scientific definitions.
