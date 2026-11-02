# GraspNet data preparation

The training implementation consumes compact `.npz` point-cloud samples to avoid coupling the model to a particular GraspNet API release. Each sample must contain:

- `xyz`: float array `[N,3]` of camera-frame point coordinates.
- `graspness`: optional float array `[N]` with pointwise graspness targets in `[0,1]`.

Use the official GraspNet-1Billion toolkit and its scene/camera/depth/calibration/grasp-label interfaces to export scene frames into this representation. Keep scene IDs split by scene (not by frame) to avoid leakage. The ZIP does not contain the dataset or its official annotations. Do not label generated smoke samples as GraspNet data. Pointwise graspness labels should be derived from the official grasp annotations using a documented neighborhood assignment; this repository does not silently invent those labels.

The current prototype learns pointwise graspness and an auxiliary approach vector. It is not a full 6-DoF grasp pose estimator and its point accuracy is not GraspNet AP. Full benchmark evaluation requires official grasp proposal decoding and the GraspNet evaluation toolkit.
