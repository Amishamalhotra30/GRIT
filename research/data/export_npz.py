"""Validate exported NPZ samples in the GRIT point-cloud format."""
import argparse
from pathlib import Path
import numpy as np

def main():
 p=argparse.ArgumentParser(); p.add_argument('root'); a=p.parse_args(); files=list(Path(a.root).glob('*.npz'))
 if not files: raise SystemExit('No NPZ files found')
 for f in files:
  with np.load(f) as d:
   if 'xyz' not in d: raise ValueError(f'{f}: missing xyz key')
   xyz=d['xyz']; assert xyz.ndim==2 and xyz.shape[1]==3 and len(xyz)>0
   if 'graspness' in d: assert d['graspness'].shape==(len(xyz),)
 print(f'Validated {len(files)} point-cloud files.')
if __name__=='__main__': main()
