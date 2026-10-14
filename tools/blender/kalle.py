# Kalle vom Kiez: the 3D model from assets/src/characters/kalle-3d.glb (made with Blender via MCP, ADR 0018),
# rigged with skinned.py. Joint points measured on gridded front and side renders of the model.
import os
from skinned import build as skin
from toon import bike_helmet, toon

GLB = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'assets', 'src', 'characters', 'kalle-3d.glb')
JOINTS = dict(
    crotch=(0, 0, 0.7), waist=(0, 0, 0.95), neck=(0, 0, 1.42), head_top=(0, 0, 1.78),
    shoulder=(0.22, 0, 1.29), elbow=(0.335, 0, 1.06), wrist=(0.385, 0, 0.87), fingers=(0.4, 0, 0.73),
    hip=(0.1, 0, 0.82), knee=(0.11, 0, 0.47), ankle=(0.12, 0, 0.11), toe=(0.12, 0.17, 0.04),
    r_hips=0.17, r_torso=0.2, r_head=0.14, r_arm=0.08, r_leg=0.11, arm_rest=21,
)
APOSE = dict(shy_l=-21, shy_r=-21)   # the model's own rest pose

def build():
    rig, parts = skin(GLB, JOINTS)
    helmet = bike_helmet(rig.neck, (0, -0.01), 0.165, 0.18, 1.6, 1.81, toon('helmet_strap', '#2a2321'))
    return rig, helmet, []
