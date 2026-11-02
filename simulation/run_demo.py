"""Minimal PyBullet Franka Panda scene for a local visual demo (not grasp validation)."""
import argparse

def main():
 p=argparse.ArgumentParser(); p.add_argument('--gui',action='store_true'); args=p.parse_args()
 try: import pybullet as pb; import pybullet_data
 except ImportError as e: raise SystemExit('Install requirements/simulation.txt first: '+str(e))
 mode=pb.GUI if args.gui else pb.DIRECT; cid=pb.connect(mode); pb.setAdditionalSearchPath(pybullet_data.getDataPath()); pb.setGravity(0,0,-9.81); pb.loadURDF('plane.urdf'); pb.loadURDF('franka_panda/panda.urdf',[0,0,0],useFixedBase=True); pb.loadURDF('cube_small.urdf',[.55,0,.03]);
 for _ in range(480): pb.stepSimulation()
 print('PyBullet Franka Panda scene loaded. This is a scene smoke test, not a grasp-success result.')
 if args.gui:
  try:
   import time
   while True: pb.stepSimulation(); time.sleep(1/240)
  except KeyboardInterrupt: pass
 pb.disconnect()
if __name__=='__main__': main()
