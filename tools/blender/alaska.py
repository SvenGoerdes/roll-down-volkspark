"""Alaska, the British Shorthair with rainbow glasses: the cleaned TRELLIS reconstruction (prep-alaska.py) on a
four-legged pivot rig. Faces +Y; ground plane is z=0. Skinned like Kalle and Tine (skinned.py, ADR 0018)."""
import os
import bpy, math
from mathutils import Euler, Matrix, Vector
from skinned import Skin, weights
from toon import joint, part, path_tube, tube
import numpy as np
from intro import BALL_ALASKA

GLB = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'assets', 'src', 'characters', 'alaska-3d.glb')
APOSE = {}
STAND = {}
BALL = dict(BALL_ALASKA)

# Rest points, measured on the cleaned mesh (scale 0.85). Paw x differs left/right: the model is not mirror-symmetric.
HEAD = Vector((0.03, 0.36, 0.80))
SPINE = Vector((0.02, 0.25, 0.57))
MID = Vector((0.02, 0.0, 0.57))
HIPS = Vector((0.02, -0.30, 0.57))
TAIL = Vector((0.0, -0.56, 0.70))
GLASSES_CENTRE = Vector((0.04, 0.7, 0.97))   # middle of the lenses, rest pose
LEGS = {   # key: (front, side, shoulder/hip, elbow/knee, paw)
    'f_l': (True, -0.09, Vector((-0.09, 0.42, 0.52)), Vector((-0.09, 0.45, 0.27)), Vector((-0.09, 0.50, 0.03))),
    'f_r': (True, 0.15, Vector((0.15, 0.42, 0.52)), Vector((0.15, 0.45, 0.27)), Vector((0.15, 0.50, 0.03))),
    'b_l': (False, -0.14, Vector((-0.14, -0.35, 0.52)), Vector((-0.14, -0.28, 0.28)), Vector((-0.14, -0.20, 0.03))),
    'b_r': (False, 0.18, Vector((0.18, -0.35, 0.52)), Vector((0.18, -0.28, 0.28)), Vector((0.18, -0.20, 0.03))),
}


def _fur():
    mat = bpy.data.materials.new('Alaska | blue-grey fur')
    mat.use_nodes = True
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    shader = nodes['Principled BSDF']
    color = nodes.new('ShaderNodeVertexColor')
    color.layer_name = 'Color'
    links.new(color.outputs['Color'], shader.inputs['Base Color'])
    shader.inputs['Roughness'].default_value = 0.92
    shader.inputs['Sheen Weight'].default_value = 0.5
    shader.inputs['Sheen Roughness'].default_value = 0.5
    coord = nodes.new('ShaderNodeTexCoord')
    noise = nodes.new('ShaderNodeTexNoise')
    noise.inputs['Scale'].default_value = 140
    noise.inputs['Detail'].default_value = 2
    bump = nodes.new('ShaderNodeBump')
    bump.inputs['Strength'].default_value = 0.05
    bump.inputs['Distance'].default_value = 0.01
    links.new(coord.outputs['Object'], noise.inputs['Vector'])
    links.new(noise.outputs['Fac'], bump.inputs['Height'])
    links.new(bump.outputs['Normal'], shader.inputs['Normal'])
    return mat


class CatRig:
    """root → hips (rear, hind legs, tail) → mid → spine (chest, head, front legs): three spine joints bend the
    body into an arch for the roll. 'curl' turns the hips, 'arch' the middle (negative back), 'bend' the chest."""
    def __init__(self, root, spine, hips, mid, neck, legs, tail):
        self.root, self.spine, self.hips, self.mid, self.neck, self.after = root, spine, hips, mid, neck, []
        self.legs, self.tail = legs, tail
        self.neck_rest = neck.location.copy()
        self.glasses = None
        self.last = {}

    def pose(self, p):
        rad = math.radians
        self.root.location = (0, p.get('fwd', 0), p.get('lift', 0))
        self.root.rotation_euler = (rad(p.get('pitch', 0)), rad(p.get('roll', 0)), rad(p.get('yaw', 0)))
        self.spine.rotation_euler = (rad(p.get('bend', 0)), rad(p.get('lean', 0)), 0)
        tuck = p.get('tuck', 0)
        self.spine.scale = (1, 1 - .24 * tuck, 1)
        self.hips.rotation_euler = (rad(p.get('curl', 0)), 0, 0)
        self.mid.rotation_euler = (-rad(p.get('arch', 0)), 0, 0)
        self.neck.location = self.neck_rest + Vector((0, -.07 * tuck, -.10 * tuck))
        self.neck.rotation_euler = (rad(p.get('nod', 0)), 0, rad(p.get('tilt', 0)))
        for key, (shoulder, elbow) in self.legs.items():
            shoulder.rotation_euler = (rad(p.get(key, 0)), 0, 0)
            elbow.rotation_euler = (rad(p.get(key[0] + 'k_' + key[-1], 0)), 0, 0)
        self.tail.rotation_euler = (rad(p.get('tail', 0)), 0, rad(p.get('tailz', 0)))
        self.last = p
        for callback in self.after:
            callback()

    def _glasses(self, p):
        """The glasses sit on the head until 'gl' > 0: then they drop (gl 0..1 = fall progress, in world space);
        'noglasses' hides them for the roll."""
        g = self.glasses
        g.hide_render = bool(p.get('noglasses', 0))
        bpy.context.view_layer.update()
        head = self.neck.matrix_world @ self.neck_inv
        fall = p.get('gl', 0)
        # a little hop, then down; sideways and toward the game camera, so the fall stays visible behind the cat
        drop = Matrix.Translation((-.55 * fall, -.35 * fall, .3 * fall - (HEAD.z + .3) * fall * fall))
        tumble = Euler((math.radians(260 * fall), 0, math.radians(35 * fall))).to_matrix().to_4x4()
        centre = Matrix.Translation(GLASSES_CENTRE)
        m = drop @ head @ centre @ tumble @ centre.inverted() if fall else head
        if fall:   # the glasses land on the ground and stay there
            m = Matrix.Translation((0, 0, max(0, .1 - (m @ GLASSES_CENTRE).z))) @ m
        g.matrix_world = m


def _segments():
    s = {
        'chest': ('spine', [Vector((0.02, -0.45, 0.57)), Vector((0.02, 0.35, 0.60))], 0.34),
        'middle': ('mid', [Vector((0.02, -0.45, 0.57)), Vector((0.02, 0.35, 0.60))], 0.34),
        'rear': ('hips', [Vector((0.02, -0.45, 0.57)), Vector((0.02, 0.35, 0.60))], 0.34),
        'head': ('neck', [HEAD, Vector((0.04, 0.58, 1.02))], 0.34),
        'tail': ('tail', [TAIL, Vector((-0.05, -0.62, 0.42)), Vector((-0.25, -0.70, 0.22))], 0.14),
    }
    for key, (front, x, top, mid, paw) in LEGS.items():
        s[key + '_upper'] = (f'{key}_shoulder', [top, mid], 0.11)
        s[key + '_lower'] = (f'{key}_elbow', [mid, paw], 0.08)
    return s


def _smooth(lo, hi, x):
    t = np.clip((x - lo) / (hi - lo), 0, 1)
    return t * t * (3 - 2 * t)


def _polyline_dist(P, pts):
    d = np.full(len(P), np.inf)
    for a, b in zip(pts, pts[1:]):
        a, b = np.array(a), np.array(b)
        ab = b - a
        t = np.clip(((P - a) @ ab) / (ab @ ab), 0, 1)
        d = np.minimum(d, np.linalg.norm(P - (a + t[:, None] * ab), axis=1))
    return d


def cat_weights(P, segs):
    """Skin weights per vertex, column order of segs. A leg owns the vertices in a column around its axis below
    the shoulder (upper → lower blends at the elbow); head and tail own a ball and a tube; the torso keeps the rest."""
    W = np.zeros((len(P), len(segs)))
    col = {name: i for i, name in enumerate(segs)}
    others = np.zeros(len(P))
    for key, (front, x, top, mid, paw) in LEGS.items():
        z = P[:, 2]
        above = np.clip((z - mid.z) / (top.z - mid.z), 0, 1)
        below = np.clip((mid.z - z) / (mid.z - paw.z), 0, 1)
        axis_y = np.where(z > mid.z, mid.y + (top.y - mid.y) * above, mid.y + (paw.y - mid.y) * below)
        axis_x = np.where(z > mid.z, mid.x + (top.x - mid.x) * above, mid.x + (paw.x - mid.x) * below)
        d = np.hypot(P[:, 0] - axis_x, P[:, 1] - axis_y)
        radius = 0.13 if front else 0.17
        column = 1 - _smooth(radius, radius + 0.07, d)
        hi, lo = (top.z + 0.03, top.z - 0.14) if front else (top.z + 0.14, top.z - 0.06)
        leg = column * _smooth(hi, lo, z)
        lower = _smooth(mid.z + 0.06, mid.z - 0.06, z)
        W[:, col[key + '_upper']] = leg * (1 - lower)
        W[:, col[key + '_lower']] = leg * lower
        others += leg
    head_centre = np.array((0.04, 0.54, 0.98))
    dh = np.linalg.norm((P - head_centre) * (1, 1, 0.9), axis=1)
    W[:, col['head']] = 1 - _smooth(0.30, 0.42, dh)
    tail = _smooth(0.11, 0.18, _polyline_dist(P, segs['tail'][1]))
    W[:, col['tail']] = (1 - tail) * _smooth(-0.46, -0.54, P[:, 1])
    others += W[:, col['head']] + W[:, col['tail']]
    over = np.maximum(others, 1)
    W[:, [i for n, i in col.items() if n not in ('chest', 'middle', 'rear')]] /= over[:, None]
    torso = np.maximum(0, 1 - others / over)
    rear = _smooth(-0.12, -0.38, P[:, 1])   # soft bands along the spine
    chest = _smooth(0.05, 0.32, P[:, 1])
    W[:, col['chest']] = torso * chest
    W[:, col['rear']] = torso * rear
    W[:, col['middle']] = torso * (1 - chest) * (1 - rear)
    return W / W.sum(axis=1, keepdims=True)


def _plain(name, color, roughness=0.4, coat=0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    shader = mat.node_tree.nodes['Principled BSDF']
    shader.inputs['Base Color'].default_value = (*color, 1)
    shader.inputs['Roughness'].default_value = roughness
    shader.inputs['Coat Weight'].default_value = coat
    return mat


def _helmet(neck):
    """Red bike helmet (ADR 0011 colour) on the crown between the ears; parts are shown by the clip that needs them."""
    red, dark, strap = _plain('Alaska helmet', (0.75, 0.05, 0.04), 0.35, 0.6), _plain('Alaska helmet vents', (0.3, 0.02, 0.02)), \
        _plain('Alaska helmet strap', (0.04, 0.04, 0.05), 0.7)
    x, y, z0, top, a, b = 0.04, 0.52, 0.86, 1.27, 0.3, 0.29
    shell = tube([((x, y, z0), a, b), ((x, y, z0 + 0.4 * (top - z0)), a * 0.99, b * 0.99), ((x, y, z0 + 0.75 * (top - z0)), a * 0.83, b * 0.83),
                  ((x, y, z0 + 0.93 * (top - z0)), a * 0.53, b * 0.53), ((x, y, top), 0.01, 0.01)], n=32)
    vents = [path_tube([(x + dx, y + b * 0.62, top - 0.04), (x + dx, y, top + 0.005), (x + dx, y - b * 0.62, top - 0.035)], 0.012, 6)
             for dx in (-0.045, 0, 0.045)]
    chin = path_tube([(x + a * 0.9, y + 0.03, z0), (x + a * 0.7, y + b * 0.55, z0 - 0.08), (x, y + b * 0.7, z0 - 0.12),
                      (x - a * 0.7, y + b * 0.55, z0 - 0.08), (x - a * 0.9, y + 0.03, z0)], 0.006, 6)
    return [part('helmet', [shell], [red], neck, sub=1, ow=0), part('helmet_vents', vents, [dark], neck, sub=0, ow=0),
            part('helmet_strap', [chin], [strap], neck, sub=0, ow=0)]


def build():
    bpy.ops.import_scene.gltf(filepath=GLB)
    body = bpy.data.objects['figure']
    glasses = bpy.data.objects['glasses']
    body.data.materials.clear()
    body.data.materials.append(_fur())
    root = joint('root', (0, 0, 0))
    hips = joint('hips', HIPS, root)
    mid = joint('mid', MID, hips)
    spine = joint('spine', SPINE, mid)
    neck = joint('neck', HEAD, spine)
    legs = {}
    for key, (front, x, top, knee, paw) in LEGS.items():
        shoulder = joint(f'{key}_shoulder', top, spine if front else hips)
        elbow = joint(f'{key}_elbow', knee, shoulder)
        legs[key] = (shoulder, elbow)
    tail = joint('tail', TAIL, hips)
    rig = CatRig(root, spine, hips, mid, neck, legs, tail)
    segs = _segments()
    for part, only in ((body, None),):
        me = part.data
        P = np.empty(len(me.vertices) * 3)
        me.vertices.foreach_get('co', P)
        P = P.reshape(-1, 3)
        use = segs if only is None else {only: segs[only]}
        W = cat_weights(P, segs) if only is None else weights(P, use)
        rig.after.append(Skin(part, rig, use, W))
    rig.glasses = glasses
    rig.after.append(lambda: rig._glasses(rig.last))   # re-runs after the roll moves the root, too
    rig.neck_inv = neck.matrix_world.inverted()
    return rig, _helmet(neck), []
