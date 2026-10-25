"""Render the runtime parts of the Rotes Rathaus from the reviewed detailed model.

blender -b -P tools/blender/render-rathaus-sprites.py
python3 tools/build-rathaus-sprites.py
Same projection as render-brandenburg-sprites.py. The large source stays in the local, ignored review directory.
"""
import hashlib
import json
import math
from pathlib import Path

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / '.claude/review/quellen/red-town-hall/rotes-rathaus-packed.blend'
OUT = ROOT / '.claude/review/74/render-parts'
FRONT = 11.0
FLOOR = -12 * math.log((14 + FRONT) / (14 + 4))
ANGLE = math.radians(8)
UP = Vector((0, math.sin(ANGLE), math.cos(ANGLE)))
DIRECTION = Vector((0, math.cos(ANGLE), -math.sin(ANGLE)))
TOWER_HALF = 2.6      # objects centred inside this |x| belong to the clocktower block
ROW_TOP = -2.2        # the wing tile keeps only the lowest arcade row, as low as a wall (WALL_H)
ROW_EDGES = ('Low sandstone plinth', 'Wing cornice ochre edge')   # their bounds frame that row
BAY = 0.77            # window bay pitch of the wings
BAY_START = 2.535     # left edge of the first bay of the right wing
WING_BAYS = (1, 5)    # tile: bays 1..4, a seamless run of whole bays
PER_UNIT = {'wing': 128, 'tower': 96}
PARTS = ('wing', 'tower')


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


bpy.ops.wm.open_mainfile(filepath=str(SOURCE))
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.samples = 32
scene.cycles.use_denoising = True
scene.render.film_transparent = True
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
OUT.mkdir(parents=True, exist_ok=True)
bpy.context.view_layer.update()
deps = bpy.context.evaluated_depsgraph_get()
objects = [o for o in scene.objects if o.type in ('MESH', 'CURVE')]
bounds = {}
for obj in objects:
    evaluated = obj.evaluated_get(deps)
    bounds[obj.name] = [evaluated.matrix_world @ Vector(p) for p in evaluated.bound_box]
origin = Vector((0, FRONT, FLOOR))


def limits(obj):
    points = bounds[obj.name]
    heights = [(p - origin).dot(UP) for p in points]
    return (min(p.x for p in points), max(p.x for p in points), min(heights), max(heights))


def selected(part, obj):
    x0, x1, v0, v1 = limits(obj)
    cx = (x0 + x1) / 2
    if part == 'tower':
        return abs(cx) < TOWER_HALF
    bottom = min(p.z for p in bounds[obj.name])
    return cx > TOWER_HALF and bottom <= ROW_TOP


camera_data = bpy.data.cameras.new('Runtime parts front elevation')
camera = bpy.data.objects.new('Runtime parts front elevation', camera_data)
scene.collection.objects.link(camera)
scene.camera = camera
camera_data.type = 'ORTHO'
camera_data.sensor_fit = 'HORIZONTAL'
camera_data.shift_x = camera_data.shift_y = 0
camera.rotation_euler = DIRECTION.to_track_quat('-Z', 'Y').to_euler()
manifest = {'source': str(SOURCE.relative_to(ROOT)), 'sourceSha256': digest(SOURCE),
            'scriptSha256': digest(Path(__file__)), 'parts': {}}
for part in PARTS:
    chosen = [o for o in objects if selected(part, o)]
    assert chosen, part
    for obj in objects:
        obj.hide_render = obj not in chosen
    points = [p for obj in chosen for p in bounds[obj.name]]
    x0, x1 = min(p.x for p in points) - .015, max(p.x for p in points) + .015
    if part == 'wing':
        x0, x1 = BAY_START + WING_BAYS[0] * BAY, BAY_START + WING_BAYS[1] * BAY
    if part == 'wing':   # the wing body is taller than the row: frame the row by its plinth and cornice
        points = [p for o in objects if o.name.startswith(ROW_EDGES) and sum(limits(o)[:2]) > 0
                  and max(q.z for q in bounds[o.name]) <= ROW_TOP for p in bounds[o.name]]
    v0, v1 = min((p - origin).dot(UP) for p in points) - .015, max((p - origin).dot(UP) for p in points) + .015
    world_width, world_height = x1 - x0, v1 - v0
    width = math.ceil(world_width * PER_UNIT[part])
    height = math.ceil(width * world_height / world_width)
    world_height = height / width * world_width
    target = origin + Vector(((x0 + x1) / 2, 0, 0)) + UP * (v0 + world_height / 2)
    camera.location = target - DIRECTION * 50
    camera_data.ortho_scale = world_width
    scene.render.resolution_x, scene.render.resolution_y = width, height
    scene.render.resolution_percentage = 100
    scene.render.filepath = str(OUT / f'{part}.png')
    bpy.ops.render.render(write_still=True)
    manifest['parts'][part] = {'width': width, 'height': height,
                              'worldWidth': world_width, 'worldHeight': world_height,
                              'left': x0, 'bottom': v0, 'objects': len(chosen),
                              'pngSha256': digest(OUT / f'{part}.png')}
(OUT / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
