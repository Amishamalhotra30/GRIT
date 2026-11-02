"""Evaluate a trained checkpoint on exported NPZ point clouds under feature corruptions."""
import argparse, json
from pathlib import Path
import torch
from torch.utils.data import DataLoader
from research.data.pointcloud_dataset import NPZPointCloudDataset
from research.models.grit_model import build_model
from research.corruption.feature_corruption import random_erasing,block_erasing,burst_corruption,feature_noise

def main():
 p=argparse.ArgumentParser(); p.add_argument('--checkpoint',required=True); p.add_argument('--data',default='data/processed'); p.add_argument('--points',type=int,default=1024); p.add_argument('--batch-size',type=int,default=4); p.add_argument('--synthetic-smoke',action='store_true'); p.add_argument('--out',default='artifacts/results/corruption_eval.json'); a=p.parse_args()
 ck=torch.load(a.checkpoint,map_location='cpu',weights_only=False); model=build_model(ck['method'],ck.get('ablation')); model.load_state_dict(ck['model']); device='cuda' if torch.cuda.is_available() else 'cpu'; model.to(device).eval()
 ds=NPZPointCloudDataset(a.data,a.points,12 if a.synthetic_smoke else 0); loader=DataLoader(ds,batch_size=a.batch_size)
 funcs={'random':random_erasing,'block':block_erasing,'burst':burst_corruption,'noise':feature_noise}; rows=[]
 with torch.no_grad():
  for name,fn in funcs.items():
   for sev in [0,.1,.3,.5,.7,.9]:
    hit=n=0
    for xyz,y in loader:
     xyz,y=xyz.to(device),y.to(device); out=model(xyz,return_features=True); z=fn(out['features'],sev); logits=model.head(z).squeeze(-1); hit+=((logits.sigmoid()>=.5)==y.bool()).sum().item(); n+=y.numel()
    rows.append({'corruption':name,'severity':sev,'point_accuracy':hit/max(1,n),'synthetic_smoke':a.synthetic_smoke})
 out=Path(a.out); out.parent.mkdir(parents=True,exist_ok=True); out.write_text(json.dumps(rows,indent=2)); print(out)
if __name__=='__main__': main()
