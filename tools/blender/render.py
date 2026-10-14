# Renders a rigged figure (ADR 0018) to PNG frames for tools/build-sprites.py.
# /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/blender/render.py -- <kalle|tine> <out_dir> [sheet|poses|clips|<clip>…]
#   sheet: front/right/back in A-pose, framed like the model sheets (for a side-by-side check)
#   poses: the key poses from the game camera, for a quick check of the rig
#   clips: every game clip below, plus meta.json
# LOOK=toon (default: flat colour bands and ink outline) or LOOK=pbr (the model's own materials)
import bpy, importlib, json, math, os, sys
from mathutils import Matrix, Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
argv = sys.argv[sys.argv.index('--') + 1:]
FIGURE, OUT, MODES = argv[0], argv[1], argv[2:] or ['clips']
os.makedirs(OUT, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
import toon
toon.OUTLINE_K = 1.0 if MODES == ['sheet'] else 1.5   # thicker ink reads better at phone size
fig = importlib.import_module(FIGURE)
rig, helmet, hat = fig.build()   # hat: parts the helmet replaces
LOOK = os.environ.get('LOOK', 'toon')
for ob in [o for o in scene.objects if o.type == 'MESH' and o not in helmet]:
    if LOOK == 'toon':
        toon.to_toon(ob)
        toon.add_outline(ob, 0.011)
if LOOK == 'pbr':   # soft sky light so the PBR materials are not black in the shadows
    scene.world = bpy.data.worlds.new('w')
    scene.world.color = (0.55, 0.58, 0.62)

# ---------- poses shared by all figures: degrees; negative shy/hpy spread a limb outwards ----------
STAND = dict(shy_l=-8, shy_r=-8, sh_l=3, sh_r=3)
STEP = dict(hp_r=28, kn_r=-25, hp_l=-8, sh_l=22, sh_r=-18, shy_l=-8, shy_r=-8, el_l=15, el_r=10, fwd=0.05)
CATCH = dict(bend=-15, nod=15, hp_r=12, kn_r=-8, hp_l=-20, kn_l=-20, sh_l=45, sh_r=40, shy_l=-20, shy_r=-20, el_l=20, el_r=20, pitch=-12, fwd=0.14)
TRIP = dict(bend=-20, nod=10, sh_l=-35, shy_l=55, sh_r=50, shy_r=35, el_l=35, el_r=40, hp_l=-30, kn_l=-35, hp_r=20, kn_r=-10, pitch=-18, fwd=0.25)
FLAIL = dict(bend=-25, nod=20, sh_l=150, shy_l=45, sh_r=110, shy_r=60, el_l=25, el_r=45, hp_l=-45, kn_l=-70, hp_r=15, kn_r=-30, pitch=-40, fwd=0.5, lift=0.15)
TUCK = dict(bend=-45, nod=-25, sh_l=60, sh_r=60, shy_l=10, shy_r=10, el_l=-50, el_r=-50, hp_l=80, hp_r=80, kn_l=-110, kn_r=-110, pitch=-70, fwd=0.85, lift=0.3)
BALL = dict(bend=-60, nod=-40, sh_l=35, sh_r=35, shy_l=-15, shy_r=-15, el_l=-65, el_r=-65, hp_l=105, hp_r=105, kn_l=-150, kn_r=-150, pitch=-30, fwd=1.0, lift=0.45)
KO = dict(yaw=180, pitch=90, lift=0.16, shy_l=-75, shy_r=-70, sh_l=10, sh_r=-5, el_l=-25, el_r=-30, hpy_l=-22, hpy_r=-18, kn_l=-15, kn_r=-25, nod=-10)   # starfish on his back

# ---------- prop: an empty "Storni" (brown half-litre bottle, painted label from assets/src/storni-label.jpg) ----------
LABEL = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'assets', 'src', 'storni-label.jpg')
BOTTLE_K = 1.7   # bigger than life so it reads on a phone
LABEL_TURN = -60   # degrees about the bottle's axis, so the lettering faces the camera
BOTTLE_AT = (0.3, 0.42, 40)   # x, y, turn in degrees: beside the right foot, neck to the front right, still in the kick's way

def pbr(name, rgb, rough, metal=0.0, coat=0.0, image=None):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes['Principled BSDF']
    bsdf.inputs['Base Color'].default_value = (*rgb, 1)
    bsdf.inputs['Roughness'].default_value = rough
    bsdf.inputs['Metallic'].default_value = metal
    bsdf.inputs['Coat Weight'].default_value = coat
    if image:
        tex = m.node_tree.nodes.new('ShaderNodeTexImage')
        tex.image = bpy.data.images.load(image)
        m.node_tree.links.new(tex.outputs['Color'], bsdf.inputs['Base Color'])
    return m

def bottle():
    k = BOTTLE_K
    R = 0.034 * k
    secs = [((x * k, 0, 0), r * k, r * k) for x, r in ((-0.12, 0.004), (-0.118, 0.034), (0.02, 0.034), (0.05, 0.026), (0.075, 0.013),
                                                         (0.11, 0.012), (0.112, 0.014), (0.12, 0.013), (0.121, 0.004))]
    glass = pbr('bottle_glass', (0.11, 0.045, 0.012), 0.08, coat=1.0)
    b = toon.part('bottle', [toon.tube(secs, axis='x', n=24)], [glass], None, lambda p: 0, ow=0)
    b.rotation_mode = 'XYZ'
    # the label wraps the body; a cylinder brings its own UVs, so the painted label maps straight on
    bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=R * 1.01, depth=0.1 * k, end_fill_type='NOTHING',
                                        location=(-0.048 * k, 0, 0), rotation=(0, math.pi / 2, 0))
    label = bpy.context.object
    label.name = 'bottle-label'
    label.data.materials.append(pbr('bottle_label', (1, 1, 1), 0.6, image=LABEL))
    label.data.transform(Matrix.Rotation(math.radians(LABEL_TURN), 4, 'Z'))   # turn the lettering up toward the camera
    bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=0.0145 * k, depth=0.012 * k, location=(0.121 * k, 0, 0), rotation=(0, math.pi / 2, 0))
    cap = bpy.context.object
    cap.name = 'bottle-cap'
    cap.data.materials.append(pbr('bottle_cap', (0.75, 0.12, 0.08), 0.3, metal=0.8))
    for o in (label, cap):
        o.parent = b
    return b, R

# ---------- camera, light ----------
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam'))
scene.collection.objects.link(cam)
cam.data.type = 'ORTHO'
target = bpy.data.objects.new('target', None)
scene.collection.objects.link(target)
track = cam.constraints.new('TRACK_TO')
track.target = target
track.track_axis = 'TRACK_NEGATIVE_Z'
track.up_axis = 'UP_Y'
scene.camera = cam
sun = bpy.data.objects.new('sun', bpy.data.lights.new('sun', 'SUN'))
scene.collection.objects.link(sun)
sun.data.energy = 3
if not scene.world:
    scene.world = bpy.data.worlds.new('w')
scene.render.engine = 'BLENDER_EEVEE'
scene.render.film_transparent = True
scene.view_settings.view_transform = 'Standard'
scene.eevee.taa_render_samples = 16

GAME = Vector((0, -6, 3.5))   # behind and ~30° above, like the in-game camera
PPU = 160                     # pixels per unit: about 1:1 with the screen at DPR 2 on a 390 px wide phone

def figure_meshes():
    return [o for o in scene.objects if o.type == 'MESH' and not o.hide_render and not o.name.startswith('bottle')]

def center():
    bpy.context.view_layer.update()
    pts = [o.matrix_world @ Vector(c) for o in figure_meshes() for c in o.bound_box]
    lo = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
    hi = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
    return (lo + hi) / 2

def setup(at, offset, w, h, ppu=PPU):
    """Ortho camera on `at` from at+offset; the sun comes from over the camera's left shoulder."""
    target.location = at
    cam.location = Vector(at) + Vector(offset)
    cam.data.ortho_scale = max(w, h) / ppu
    scene.render.resolution_x, scene.render.resolution_y = w, h
    view = -Vector(offset).normalized()
    left = Vector((0, 0, 1)).cross(view).normalized()
    sun.rotation_euler = (-view + left * 0.7 + Vector((0, 0, 0.9))).to_track_quat('Z', 'Y').to_euler()

def shot(path):
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)

def show_helmet(on):
    for o in helmet:
        o.hide_render = not on
    for o in hat:
        o.hide_render = on

# ---------- clips ----------
def clip_frames(name):
    """Yields (pose, bottle_frame) per frame; bottle_frame None hides the bottle."""
    if name in ('idle', 'select'):   # faces the camera, breathes, shifts weight; in game the bottle already lies there
        for i in range(12):
            a = 2 * math.pi * i / 12
            yield dict(STAND, yaw=180, bend=1.5 * math.sin(a), nod=-2 * math.sin(a), lean=1.5 * math.sin(a / 2) ** 2 - 0.75,
                       sh_l=3 + 3 * math.sin(a), sh_r=3 - 3 * math.sin(a), lift=0.006 * math.cos(a)), (0 if name == 'idle' else None)
    elif name == 'turn':   # turns his back to us, two little steps; the bottle already lies there
        keys = [dict(STAND, yaw=180), dict(STAND, yaw=125, hp_l=22, kn_l=-40, lift=0.015), dict(STAND, yaw=60, hp_r=22, kn_r=-40, lift=0.015), dict(STAND)]
        for i in range(12):
            yield toon.through(keys, i / 11), 0
    elif name == 'trip':   # steps forward, kicks the bottle, falls into the ball
        keys = [STAND, STEP, CATCH, TRIP, FLAIL, TUCK, BALL]
        for i in range(24):
            yield toon.through(keys, i / 23), i
    elif name in ('roll', 'roll-helmet'):
        for i in range(32):
            yield dict(BALL, pitch=BALL['pitch'] - 360 * i / 32), None
    elif name == 'dazed':   # knocked out on his back, head rolling
        for i in range(12):
            a = 2 * math.pi * i / 12
            yield dict(KO, tilt=16 * math.sin(a), nod=KO['nod'] + 5 * math.cos(2 * a), sh_l=KO['sh_l'] + 6 * math.sin(a)), None

SELECT = Vector((0, -6, 0.6))   # nearly eye level, for the figure select screen
CLIPS = {'select': (True, SELECT), 'idle': (True, GAME), 'turn': (False, GAME), 'trip': (False, GAME),
         'roll': (True, GAME), 'roll-helmet': (True, GAME), 'dazed': (True, GAME)}   # name: (loops, camera offset)

def roll_pivot():
    """Ball centre at the end of the trip, in world and in root space (the roll turns about it).
    Every clip is anchored on this point, so the game can chain them without a jump."""
    show_helmet(False)
    rig.pose(BALL)
    c = center()
    return c, rig.root.matrix_world.inverted() @ c

def screen_basis(offset):
    view = -Vector(offset).normalized()
    right = view.cross(Vector((0, 0, 1))).normalized()
    return right, right.cross(view).normalized()

def apply(name, i, p, bottle_frame, pivot, prop):
    rig.pose(p)
    if name.startswith('roll'):   # rigid turn about the ball centre: no wobble
        bpy.context.view_layer.update()
        rig.root.location = pivot[0] - (rig.root.matrix_world.to_3x3() @ pivot[1])
        for f in rig.after:   # re-skin: the root moved after the pose
            f()
    b, R = prop
    for o in (b, *b.children):
        o.hide_render = bottle_frame is None
    if bottle_frame is not None:
        # the bottle lies in front of the right foot; from frame 6 it gets kicked forward and to the side
        t = max(0, bottle_frame - 6)
        d = 2.4 * (1 - math.exp(-t / 5))
        b.location = (BOTTLE_AT[0] + 0.55 * d, BOTTLE_AT[1] + d, R)
        b.rotation_euler = (d / R * 0.6, 0, math.radians(BOTTLE_AT[2] + 25 * d))
    bpy.context.view_layer.update()

def render_clip(name, pivot, prop, margin=6):
    show_helmet(name == 'roll-helmet')
    frames = list(clip_frames(name))
    anchor = pivot[0]
    loop, offset = CLIPS[name]
    right, up = screen_basis(offset)
    # pass 1: screen extents of the figure over all frames, relative to the anchor
    xs, ys = [], []
    for i, (p, bf) in enumerate(frames):
        apply(name, i, p, bf, pivot, prop)
        # the bottle lying still belongs in the frame; once kicked it may fly out
        lying = [prop[0], *prop[0].children] if name in ('idle', 'turn') else []
        for o in figure_meshes() + lying:
            for c in o.bound_box:
                d = o.matrix_world @ Vector(c) - anchor
                xs.append(d.dot(right))
                ys.append(d.dot(up))
    half_w = max(-min(xs), max(xs))   # keep the anchor centred horizontally
    w = math.ceil((2 * half_w * PPU + 2 * margin) / 4) * 4
    h = math.ceil(((max(ys) - min(ys)) * PPU + 2 * margin) / 4) * 4
    at = anchor + up * ((max(ys) + min(ys)) / 2)
    # pass 2: render
    os.makedirs(f'{OUT}/{name}', exist_ok=True)
    for i, (p, bf) in enumerate(frames):
        apply(name, i, p, bf, pivot, prop)
        setup(at, offset, w, h)
        shot(f'{OUT}/{name}/{i:02d}.png')
    # the anchor (ball centre) in px from the top left; the game draws every frame with it on the player
    meta = dict(n=len(frames), w=w, h=h, ax=w / 2, ay=round(h / 2 + (max(ys) + min(ys)) / 2 * PPU, 1), loop=loop)
    if name == 'dazed':
        apply(name, 0, frames[0][0], None, pivot, prop)
        d = rig.neck.matrix_world.translation + Vector((0, 0, 0.15)) - anchor
        meta['head'] = [round(meta['ax'] + d.dot(right) * PPU), round(meta['ay'] - d.dot(up) * PPU)]
    return meta

if MODES == ['poses']:
    show_helmet(False)
    for name, p in (('front', dict(STAND, yaw=180)), ('back', STAND), ('step', STEP), ('trip', TRIP), ('flail', FLAIL),
                    ('tuck', TUCK), ('ball', BALL), ('ko', KO)):
        rig.pose(p)
        setup(center(), GAME, 420, 420)
        shot(f'{OUT}/{name}.png')
elif MODES == ['sheet']:
    rig.pose(fig.APOSE)
    show_helmet(False)
    for name, off in (('front', (0, 10, 0)), ('right', (10, 0, 0)), ('back', (0, -10, 0))):
        setup((0, 0, 0.9), off, 600, 800, ppu=800 / 2.06)
        shot(f'{OUT}/{name}.png')
else:
    names = list(CLIPS) if MODES == ['clips'] else MODES
    pivot = roll_pivot()
    prop = bottle()
    meta = {name: render_clip(name, pivot, prop) for name in names}
    meta['_'] = dict(ppu=PPU, elevation=round(math.degrees(math.atan2(GAME.z, -GAME.y)), 1))
    path = f'{OUT}/meta.json'
    old = json.load(open(path)) if os.path.exists(path) else {}
    json.dump({**old, **meta}, open(path, 'w'), indent=1)
