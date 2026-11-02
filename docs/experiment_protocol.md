# Experiment protocol (prototype scope)

## Methods
- Standard: compact point encoder and graspness head.
- Uniform Redundancy: expanded representation with no task-conditioned gate.
- Robustness-trained: Standard architecture trained with representation corruption.
- Full GRIT: expanded representation, learned task gate, and residual recovery block.

## Ablations
No Task Awareness; No Redundancy; No Recovery Module; Reduced Redundancy (50%).

## Corruption and metric
Apply random element erasing, feature-group block erasing, flattened burst erasing, or Gaussian noise at severity levels 0, 0.1, 0.3, 0.5, 0.7, and 0.9. The prototype metric is pointwise binary graspness accuracy on a fixed validation split. Noise severity denotes standard deviation multiplier; erasure severity denotes fraction erased. Use identical split, seed, point count, and training budget when comparing methods.

## Limitations
This code is a compact proof-of-concept and not a full GraspNet baseline or official 6-DoF AP evaluator. Do not claim official GraspNet benchmark performance. All displayed values must come from saved run output. Synthetic smoke runs are not research evidence. Report subset size, epochs, hardware, and run seed.
