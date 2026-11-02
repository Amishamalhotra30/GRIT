"""Task metric helpers. Point accuracy is a prototype metric, not GraspNet AP."""
import torch
def binary_point_metrics(logits, targets, threshold=.5):
 p=logits.sigmoid()>=threshold; y=targets.bool(); return {'accuracy':(p==y).float().mean().item(),'precision':(p&y).sum().item()/max(1,p.sum().item()),'recall':(p&y).sum().item()/max(1,y.sum().item())}
