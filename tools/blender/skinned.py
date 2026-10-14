# Rigs a static figure mesh (from prep-glb.py) with the pivot-empty Rig from toon.py (ADR 0018).
# Each vertex follows the one or two nearest bone segments (distance scaled by the limb's thickness);
# after every pose the mesh is re-skinned with numpy (linear blend skinning). No armature needed.
import bpy, math
import numpy as np
from mathutils import Vector, Matrix
from toon import joint, Rig

# bone segments: (driving joint, polyline of rest points, thickness)
def segments(j):
    s = {
        'hips': ('hips', [j['crotch'], j['waist']], j['r_hips']),
        'spine': ('spine', [j['waist'], j['neck']], j['r_torso']),
        'neck': ('neck', [j['neck'], j['head_top']], j['r_head']),
    }
    for side, sx in (('l', -1), ('r', 1)):
        m = lambda p: (p[0] * sx, p[1], p[2])
        s[f'upper_arm_{side}'] = (f'shoulder_{side}', [m(j['shoulder']), m(j['elbow'])], j['r_arm'])
        s[f'forearm_{side}'] = (f'elbow_{side}', [m(j['elbow']), m(j['wrist']), m(j['fingers'])], j['r_arm'])
        s[f'thigh_{side}'] = (f'hip_{side}', [m(j['hip']), m(j['knee'])], j['r_leg'])
        s[f'shin_{side}'] = (f'knee_{side}', [m(j['knee']), m(j['ankle']), m(j['toe'])], j['r_leg'])
    return s

def dist_to_polyline(P, pts):
    d = np.full(len(P), np.inf)
    for a, b in zip(pts, pts[1:]):
        a, b = np.array(a), np.array(b)
        ab = b - a
        t = np.clip(((P - a) @ ab) / (ab @ ab), 0, 1)
        d = np.minimum(d, np.linalg.norm(P - (a + t[:, None] * ab), axis=1))
    return d

def weights(P, segs, soft=0.12):
    """Soft-min over thickness-scaled distances; keeps the two nearest segments per vertex."""
    D = np.stack([dist_to_polyline(P, pts) / r for _, pts, r in segs.values()], axis=1)
    W = np.exp(-(D - D.min(axis=1, keepdims=True)) / soft)
    W[W < np.sort(W, axis=1)[:, -2:-1]] = 0
    return W / W.sum(axis=1, keepdims=True)

class Skin:
    def __init__(self, ob, rig, segs, W):
        self.ob, self.rig = ob, rig
        me = ob.data
        rest = np.empty(len(me.vertices) * 3)
        me.vertices.foreach_get('co', rest)
        self.rest = np.c_[rest.reshape(-1, 3), np.ones(len(me.vertices))]
        self.empties = [bpy.data.objects[e] for e, _, _ in segs.values()]
        self.inv0 = [np.array(e.matrix_world.inverted()) for e in self.empties]
        self.W = W

    def __call__(self):
        bpy.context.view_layer.update()
        out = np.zeros((len(self.rest), 3))
        for k, (e, inv0) in enumerate(zip(self.empties, self.inv0)):
            w = self.W[:, k]
            nz = w > 0
            if nz.any():
                M = np.array(e.matrix_world) @ inv0
                out[nz] += w[nz, None] * (self.rest[nz] @ M.T)[:, :3]
        me = self.ob.data
        me.vertices.foreach_set('co', out.ravel())
        me.update()
        bpy.context.view_layer.update()

def split_off(ob, name, material, zmin):
    """Moves the faces of one material above zmin into their own object (e.g. a hat to swap for the helmet)."""
    me = ob.data
    idx = {i for i, m in enumerate(me.materials) if material in m.name}
    me.vertices.foreach_set('select', [False] * len(me.vertices))
    me.edges.foreach_set('select', [False] * len(me.edges))
    for p in me.polygons:
        p.select = p.material_index in idx and p.center.z > zmin
    bpy.context.tool_settings.mesh_select_mode = (False, False, True)
    bpy.context.view_layer.objects.active = ob
    ob.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.separate(type='SELECTED')
    bpy.ops.object.mode_set(mode='OBJECT')
    new = next(o for o in bpy.context.selected_objects if o is not ob)
    new.name = name
    return new

def build(path, j, split=None):
    """Imports the prepared GLB, builds the joint empties at the measured points, binds the mesh.
    Returns the rig and the mesh parts by name ('figure', plus the split-off part)."""
    bpy.ops.import_scene.gltf(filepath=path)
    ob = next(o for o in bpy.context.scene.objects if o.type == 'MESH')
    ob.name = 'figure'
    parts = {'figure': ob}
    if split:
        parts[split[0]] = split_off(ob, *split)
    root = joint('root', (0, 0, 0))
    hips = joint('hips', j['waist'], root)
    spine = joint('spine', j['waist'], hips)
    neck = joint('neck', j['neck'], spine)
    limbs = {}
    for side, sx in (('l', -1), ('r', 1)):
        m = lambda p: (p[0] * sx, p[1], p[2])
        sh = joint(f'shoulder_{side}', m(j['shoulder']), spine)
        el = joint(f'elbow_{side}', m(j['elbow']), sh)
        hip = joint(f'hip_{side}', m(j['hip']), hips)
        kn = joint(f'knee_{side}', m(j['knee']), hip)
        limbs[side] = dict(shoulder=sh, elbow=el, hip=hip, knee=kn)
    rig = Rig(root, hips, spine, neck, limbs, arm_rest=j['arm_rest'])
    segs = segments(j)
    for part in parts.values():
        me = part.data
        P = np.empty(len(me.vertices) * 3)
        me.vertices.foreach_get('co', P)
        rig.after.append(Skin(part, rig, segs, weights(P.reshape(-1, 3), segs)))
    return rig, parts
