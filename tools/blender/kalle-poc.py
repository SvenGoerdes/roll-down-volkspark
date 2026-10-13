# Proof of concept: toy-like Kalle built from primitives, posed with pivot empties, toon-shaded.
# /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/blender/kalle-poc.py -- <out_dir> <poses|fall|roll|debug>   (SIDE=1 for a side camera)
import bpy, math, sys, os
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1:]
OUT, MODE = argv[0], argv[1]
os.makedirs(OUT, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

# ---------- materials (toon: diffuse -> shader to RGB -> constant ramp) ----------
def toon(name, rgb, dark=0.62):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    dif = nt.nodes.new('ShaderNodeBsdfDiffuse')
    s2r = nt.nodes.new('ShaderNodeShaderToRGB')
    ramp = nt.nodes.new('ShaderNodeValToRGB')
    emit = nt.nodes.new('ShaderNodeEmission')
    ramp.color_ramp.interpolation = 'CONSTANT'
    e = ramp.color_ramp.elements
    e[0].position, e[0].color = 0.0, (*[c * dark for c in rgb], 1)
    e[1].position, e[1].color = 0.25, (*rgb, 1)
    hi = ramp.color_ramp.elements.new(0.85)
    hi.color = (*[min(1, c * 1.12 + 0.05) for c in rgb], 1)
    nt.links.new(dif.outputs[0], s2r.inputs[0])
    nt.links.new(s2r.outputs[0], ramp.inputs[0])
    nt.links.new(ramp.outputs[0], emit.inputs[0])
    nt.links.new(emit.outputs[0], out.inputs[0])
    return m

def srgb(h):
    h = h.lstrip('#')
    return tuple((int(h[i:i + 2], 16) / 255) ** 2.2 for i in (0, 2, 4))

MUSTARD = toon('mustard', srgb('#d9a03a'))
PURPLE = toon('purple', srgb('#6b4fa8'))
BEIGE = toon('beige', srgb('#cdbf9f'))
SKIN = toon('skin', srgb('#f0c6a0'))
HAIR = toon('hair', srgb('#7a4a2a'))
WHITE = toon('white', srgb('#f2f0ea'), 0.8)
BLACK = toon('black', srgb('#1e1e22'), 0.8)
STRAP = toon('strap', srgb('#6e5a48'))

OUTLINE = bpy.data.materials.new('outline')
OUTLINE.use_nodes = True
OUTLINE.use_backface_culling = True
nt = OUTLINE.node_tree
nt.nodes.clear()
em = nt.nodes.new('ShaderNodeEmission')
em.inputs[0].default_value = (0.08, 0.05, 0.04, 1)
o = nt.nodes.new('ShaderNodeOutputMaterial')
nt.links.new(em.outputs[0], o.inputs[0])

# ---------- building blocks ----------
def outline(obj, w=0.025):
    obj.data.materials.append(OUTLINE)
    mod = obj.modifiers.new('outline', 'SOLIDIFY')
    mod.thickness = w
    mod.offset = 1
    mod.use_flip_normals = True
    mod.material_offset = len(obj.data.materials) - 1

def blob(name, mat, loc, scale, parent=None, seg=32):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=seg // 2, location=loc)
    ob = bpy.context.object
    ob.name = name
    ob.scale = scale
    bpy.ops.object.shade_smooth()
    ob.data.materials.append(mat)
    outline(ob)
    if parent:
        ob.parent = parent
        ob.matrix_parent_inverse = parent.matrix_world.inverted()
    return ob

def capsule(name, mat, top, length, r, parent):
    """Limb hanging down from a joint: cylinder plus round ends."""
    bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=r, depth=length, location=(top[0], top[1], top[2] - length / 2))
    ob = bpy.context.object
    ob.name = name
    bpy.ops.object.shade_smooth()
    ob.data.materials.append(mat)
    outline(ob)
    ob.parent = parent
    ob.matrix_parent_inverse = parent.matrix_world.inverted()
    blob(name + '_end', mat, (top[0], top[1], top[2] - length), (r, r, r), parent)
    return ob

def joint(name, loc, parent=None):
    e = bpy.data.objects.new(name, None)
    scene.collection.objects.link(e)
    e.location = loc
    if parent:
        e.parent = parent
        e.location = Vector(loc) - parent.matrix_world.translation
    bpy.context.view_layer.update()
    return e

# ---------- Kalle (faces +Y, the camera sees his back) ----------
root = joint('root', (0, 0, 0))
hips = joint('hips', (0, 0, 0.72), root)
blob('pants', BEIGE, (0, 0, 0.72), (0.34, 0.27, 0.2), hips)
spine = joint('spine', (0, 0, 0.8), hips)
# torso: purple lower half, mustard upper half (two overlapping blobs)
blob('jacket_lo', PURPLE, (0, 0, 0.95), (0.42, 0.33, 0.3), spine)
blob('jacket_hi', MUSTARD, (0, 0, 1.13), (0.43, 0.34, 0.26), spine)
blob('collar', PURPLE, (0, 0, 1.33), (0.2, 0.18, 0.08), spine)
# belt bag strap across the back and bag at the front
bpy.ops.mesh.primitive_torus_add(major_radius=0.4, minor_radius=0.025, location=(0, 0, 1.08), rotation=(0, math.radians(40), 0))
strap = bpy.context.object
strap.scale = (1, 0.88, 1)
strap.data.materials.append(STRAP)
strap.parent = spine
strap.matrix_parent_inverse = spine.matrix_world.inverted()
blob('bag', STRAP, (-0.12, 0.33, 0.98), (0.17, 0.08, 0.09), spine)

neck = joint('neck', (0, 0, 1.36), spine)
blob('head', SKIN, (0, 0, 1.68), (0.34, 0.33, 0.36), neck)
blob('hair', HAIR, (0, -0.03, 1.8), (0.37, 0.36, 0.3), neck)
blob('hair_back', HAIR, (0, -0.12, 1.66), (0.33, 0.26, 0.3), neck)
blob('glass_l', BLACK, (-0.13, 0.31, 1.69), (0.11, 0.04, 0.07), neck)
blob('glass_r', BLACK, (0.13, 0.31, 1.69), (0.11, 0.04, 0.07), neck)
blob('stache', HAIR, (0, 0.33, 1.55), (0.1, 0.03, 0.03), neck)

limbs = {}
for side, sx in (('l', -1), ('r', 1)):
    sh = joint(f'shoulder_{side}', (0.42 * sx, 0, 1.22), spine)
    capsule(f'uparm_{side}', MUSTARD, (0.42 * sx, 0, 1.22), 0.3, 0.11, sh)
    el = joint(f'elbow_{side}', (0.42 * sx, 0, 0.92), sh)
    capsule(f'forearm_{side}', PURPLE, (0.42 * sx, 0, 0.92), 0.24, 0.1, el)
    blob(f'hand_{side}', SKIN, (0.42 * sx, 0, 0.62), (0.09, 0.09, 0.09), el)
    hip = joint(f'hip_{side}', (0.17 * sx, 0, 0.62), hips)
    capsule(f'thigh_{side}', BEIGE, (0.17 * sx, 0, 0.62), 0.28, 0.14, hip)
    kn = joint(f'knee_{side}', (0.17 * sx, 0, 0.34), hip)
    capsule(f'shin_{side}', BEIGE, (0.17 * sx, 0, 0.34), 0.22, 0.13, kn)
    blob(f'shoe_{side}', WHITE, (0.17 * sx, 0.06, 0.08), (0.13, 0.2, 0.09), kn)
    limbs[side] = dict(shoulder=sh, elbow=el, hip=hip, knee=kn)

# ---------- poses: degrees around X (positive swings a hanging limb forward) ----------
def pose(p):
    root.location = (0, p.get('fwd', 0), p.get('lift', 0))
    root.rotation_euler = (math.radians(p.get('pitch', 0)), 0, 0)
    spine.rotation_euler = (math.radians(p.get('bend', 0)), 0, 0)
    neck.rotation_euler = (math.radians(p.get('nod', 0)), 0, 0)
    for side in ('l', 'r'):
        L = limbs[side]
        sgn = -1 if side == 'l' else 1
        L['shoulder'].rotation_euler = (math.radians(p.get(f'sh_{side}', 0)), math.radians(p.get(f'shy_{side}', 0)) * sgn, math.radians(p.get(f'shz_{side}', 0)) * sgn)
        L['elbow'].rotation_euler = (math.radians(p.get(f'el_{side}', 0)), 0, 0)
        L['hip'].rotation_euler = (math.radians(p.get(f'hp_{side}', 0)), 0, 0)
        L['knee'].rotation_euler = (math.radians(p.get(f'kn_{side}', 0)), 0, 0)

STAND = dict(sh_l=4, sh_r=4, shy_l=8, shy_r=8)
TRIP = dict(bend=-20, nod=10, sh_l=-35, shy_l=55, sh_r=50, shy_r=35, el_l=35, el_r=40, hp_l=-30, kn_l=-35, hp_r=20, kn_r=-10, pitch=-10, fwd=0.15)
FLAIL = dict(bend=-25, nod=20, sh_l=150, shy_l=45, sh_r=110, shy_r=60, el_l=25, el_r=45, hp_l=-45, kn_l=-70, hp_r=15, kn_r=-30, pitch=-40, fwd=0.5, lift=0.15)
TUCK = dict(bend=-45, nod=-25, sh_l=60, sh_r=60, shy_l=10, shy_r=10, el_l=-50, el_r=-50, hp_l=80, hp_r=80, kn_l=-110, kn_r=-110, pitch=-70, fwd=0.85, lift=0.3)
BALL = dict(bend=-60, nod=-40, sh_l=35, sh_r=35, shy_l=-15, shy_r=-15, el_l=-65, el_r=-65, hp_l=105, hp_r=105, kn_l=-150, kn_r=-150, pitch=-30, fwd=1.0, lift=0.45)

# ---------- camera, light, render ----------
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam'))
scene.collection.objects.link(cam)
cam.location = (8, 0.3, 1.0) if os.environ.get('SIDE') else (0, -6, 4.0)
cam.data.type = 'ORTHO'
cam.data.ortho_scale = 2.9
aim = bpy.data.objects.new('aim', None)
scene.collection.objects.link(aim)
aim.location = (0, 0.3, 0.95)
track = cam.constraints.new('TRACK_TO')
track.target = aim
track.track_axis = 'TRACK_NEGATIVE_Z'
track.up_axis = 'UP_Y'
scene.camera = cam
sun = bpy.data.objects.new('sun', bpy.data.lights.new('sun', 'SUN'))
scene.collection.objects.link(sun)
sun.rotation_euler = (math.radians(40), math.radians(-35), math.radians(-20))
sun.data.energy = 3
world = bpy.data.worlds.new('w')
scene.world = world
scene.render.engine = 'BLENDER_EEVEE'
scene.render.film_transparent = True
scene.render.resolution_x = scene.render.resolution_y = 512
scene.view_settings.view_transform = 'Standard'

def center():
    bpy.context.view_layer.update()
    pts = [o.matrix_world @ Vector(c) for o in scene.objects if o.type == 'MESH' for c in o.bound_box]
    lo = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
    hi = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
    return (lo + hi) / 2

def shot(path):
    aim.location = center()
    cam.location = aim.location + ((Vector((8, 0, 0))) if os.environ.get('SIDE') else Vector((0, -6, 3.1)))
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)

def lerp(a, b, t):
    keys = set(a) | set(b)
    return {k: a.get(k, 0) + (b.get(k, 0) - a.get(k, 0)) * t for k in keys}

ease = lambda t: t * t * (3 - 2 * t)

if MODE == 'poses':
    for name, p in (('stand', STAND), ('trip', TRIP), ('flail', FLAIL), ('tuck', TUCK), ('ball', BALL)):
        pose(p)
        shot(f'{OUT}/{name}.png')
elif MODE == 'fall':
    keys = [STAND, TRIP, FLAIL, TUCK, BALL]
    n = 24
    for i in range(n):
        t = i / (n - 1) * (len(keys) - 1)
        k = min(int(t), len(keys) - 2)
        pose(lerp(keys[k], keys[k + 1], ease(t - k)))
        shot(f'{OUT}/fall_{i:02d}.png')
elif MODE == 'roll':
    n = int(os.environ.get('N', 32))
    pose(BALL)
    c0 = center()
    for i in range(n):
        p = dict(BALL)
        p['pitch'] = BALL['pitch'] - 360 * i / n
        pose(p)
        root.location += c0 - center()
        shot(f'{OUT}/roll_{i:02d}.png')
elif MODE == 'debug':
    for name, p in (('stand', STAND), ('ball', BALL)):
        pose(p); bpy.context.view_layer.update()
        print('DBG', name, {n: tuple(round(v, 2) for v in bpy.data.objects[n].matrix_world.translation) for n in ('head', 'jacket_hi', 'pants', 'shoe_l', 'hand_l', 'shin_l_end')})
