from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from pathlib import Path
from datetime import datetime, timezone
import json, uuid

ROOT=Path(__file__).resolve().parents[2]; STORE=ROOT/'artifacts'/'experiments.json'
app=FastAPI(title='GRIT Research API',version='1.0.0')
app.add_middleware(CORSMiddleware,allow_origins=['http://localhost:5173','http://127.0.0.1:5173'],allow_methods=['*'],allow_headers=['*'])
class ExperimentCreate(BaseModel):
 name:str=Field(default='GRIT run',min_length=1,max_length=100)
 method:str=Field(pattern='^(standard|uniform|robustness_trained|grit)$')
 ablation:str|None=None
 corruption:str=Field(default='random',pattern='^(random|block|burst|noise)$')
 severity:float=Field(default=.3,ge=0,le=.9)
 epochs:int=Field(default=5,ge=1,le=500)
def read():
 STORE.parent.mkdir(parents=True,exist_ok=True)
 return json.loads(STORE.read_text()) if STORE.exists() else []
def write(rows): STORE.write_text(json.dumps(rows,indent=2))
@app.get('/api/health')
def health(): return {'status':'ok','service':'GRIT API'}
@app.get('/api/methods')
def methods(): return {'methods':['standard','uniform','robustness_trained','grit'],'ablations':['no_task_awareness','no_redundancy','no_recovery','reduced_redundancy'],'corruptions':['random','block','burst','noise']}
@app.get('/api/experiments')
def list_experiments(): return read()
@app.post('/api/experiments',status_code=201)
def create_experiment(payload:ExperimentCreate):
 rows=read(); item={'id':str(uuid.uuid4()),**payload.model_dump(),'status':'configured','created_at':datetime.now(timezone.utc).isoformat(),'note':'Configuration saved. Launch training with research/training/train.py; this API does not execute GPU jobs.'}; rows.insert(0,item); write(rows); return item
@app.get('/api/experiments/{experiment_id}')
def get_experiment(experiment_id:str):
 item=next((x for x in read() if x['id']==experiment_id),None)
 if not item: raise HTTPException(404,'Experiment not found')
 return item
@app.get('/api/results')
def results():
 p=ROOT/'artifacts'/'results'/'corruption_eval.json'
 return json.loads(p.read_text()) if p.exists() else {'status':'no_results','message':'Run evaluation to populate measured results.'}
