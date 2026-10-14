# Techno-Tine: the 3D model from assets/src/characters/tine-3d.glb (made with Blender via MCP, ADR 0018),
# rigged with skinned.py. Joint points measured on gridded front and side renders of the model.
import os
from skinned import build as skin
from toon import bike_helmet, toon

GLB = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'assets', 'src', 'characters', 'tine-3d.glb')
JOINTS = dict(
    crotch=(0, 0, 0.72), waist=(0, 0, 0.93), neck=(0, 0, 1.39), head_top=(0, 0, 1.72),
    shoulder=(0.19, 0, 1.28), elbow=(0.29, 0, 1.06), wrist=(0.345, 0, 0.88), fingers=(0.36, 0, 0.76),
    hip=(0.085, 0, 0.8), knee=(0.085, 0, 0.46), ankle=(0.095, 0, 0.11), toe=(0.095, 0.15, 0.04),
    r_hips=0.15, r_torso=0.17, r_head=0.15, r_arm=0.075, r_leg=0.085, arm_rest=21,
)
APOSE = dict(shy_l=-21, shy_r=-21)

def build():
    # the bucket hat becomes its own object, so the helmet clips can swap it for the helmet
    rig, parts = skin(GLB, JOINTS, split=('hat', 'black cotton', 1.5))
    helmet = bike_helmet(rig.neck, (0, -0.01), 0.15, 0.165, 1.5, 1.72, toon('helmet_strap', '#2a2321'))
    return rig, helmet, [parts['hat']]
