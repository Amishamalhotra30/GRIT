from __future__ import annotations
import argparse, json, random
from pathlib import Path
import numpy as np
import torch
from torch import nn
from torch.utils.data import DataLoader, random_split
from research.data.pointcloud_dataset import NPZPointCloudDataset
from research.models.grit_model import build_model
from research.corruption.feature_corruption import random_erasing, block_erasing, burst_corruption, feature_noise

def main():
 p=argparse.ArgumentParser(); p.add_argument('--data',default='data/processed'); p.add_argument('--method',default='grit'); p.add_argument('--ablation',default=None); p.add_argument('--epochs',type=int,default=5); p.add_argument('--batch-size',type=int,default=4); p.add_argument('--points',type=int,default=1024); p.add_argument('--lr',type=float,default=1e-3); p.add_argument('--synthetic-smoke',action='store_true'); p.add_argument('--synthetic-count',type=int,default=32); p.add_argument('--corruption',default='none',choices=['none','random','block','burst','noise']); p.add_argument('--severity',type=float,default=0.3); p.add_argument('--out',default='artifacts/checkpoints'); args=p.parse_args()
 random.seed(17); np.random.seed(17); torch.manual_seed(17)
 device='cuda' if torch.cuda.is_available() else 'cpu'
 ds=NPZPointCloudDataset(args.data,args.points,args.synthetic_count if args.synthetic_smoke else 0)
 if len(ds)<2: raise ValueError('Need at least two samples for train/validation split')
 nval=max(1,int(len(ds)*.2)); train_ds,val_ds=random_split(ds,[len(ds)-nval,nval],generator=torch.Generator().manual_seed(17))
 train=DataLoader(train_ds,batch_size=args.batch_size,shuffle=True); val=DataLoader(val_ds,batch_size=args.batch_size)
 model=build_model(args.method,args.ablation).to(device); opt=torch.optim.AdamW(model.parameters(),lr=args.lr); loss_fn=nn.BCEWithLogitsLoss()
 def corrupt(z):
  f={'random':random_erasing,'block':block_erasing,'burst':burst_corruption,'noise':feature_noise}.get(args.corruption)
  return f(z,args.severity) if f else z
 history=[]
 for epoch in range(args.epochs):
  model.train(); total=0
  for xyz,y in train:
   xyz,y=xyz.to(device),y.to(device); opt.zero_grad(); out=model(xyz,return_features=True); feats=corrupt(out['features'])
   logits=model.head(feats).squeeze(-1); loss=loss_fn(logits,y); loss.backward(); opt.step(); total+=loss.item()
  model.eval(); correct=count=vloss=0
  with torch.no_grad():
   for xyz,y in val:
    xyz,y=xyz.to(device),y.to(device); logits=model(xyz)['graspness_logits']; vloss+=loss_fn(logits,y).item(); pred=(logits.sigmoid()>=.5); correct+=(pred==y.bool()).sum().item(); count+=y.numel()
  row={'epoch':epoch+1,'train_loss':total/max(1,len(train)),'val_loss':vloss/max(1,len(val)),'point_accuracy':correct/max(1,count),'device':device,'synthetic_smoke':args.synthetic_smoke}; history.append(row); print(json.dumps(row))
 out=Path(args.out); out.mkdir(parents=True,exist_ok=True); name=f"{args.method}{('-'+args.ablation) if args.ablation else ''}.pt"
 torch.save({'model':model.state_dict(),'method':args.method,'ablation':args.ablation,'history':history,'config':vars(args)},out/name)
 (out/(name+'.json')).write_text(json.dumps(history,indent=2)); print(f'Checkpoint: {out/name}')
if __name__=='__main__': main()
