"""Render the runtime parts of the Oberbruecke from the reviewed detailed model.

blender -b -P tools/blender/render-oberbaum-sprites.py
python3 tools/build-oberbaum-sprites.py
Same projection as render-brandenburg-sprites.py. The large source stays in the local, ignored review directory.
"""
import hashlib
import json
import math
from pathlib import Path

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / '.claude/review/quellen/oberbaum-bridge/oberbaum-bridge.blend'
OUT = ROOT / '.claude/review/72/render-parts'
FRONT = 11.0
FLOOR = -12 * math.log((14 + FRONT) / (14 + 4))
ANGLE = math.radians(8)
UP = Vector((0, math.sin(ANGLE), math.cos(ANGLE)))
DIRECTION = Vector((0, math.cos(ANGLE), -math.sin(ANGLE)))
TOWER_X = 2.45   # tower objects lie beyond this |x|, the arcade inside it
PARTS = ('tower-left', 'tower-right', 'arch', 'pier')
FLOOR_NAME = 'short walkable ar'
PIERS = ('arcade piers', 'pier sandstone plinth')
SKIP = ('slender arcade attached colu', 'longitudinal side Gothic arc', 'side arcade pale reveal',
        'low brick side parapet', 'parapet sandstone coping', 'side parapet quatrefoils', 'approach ')


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
    if FLOOR_NAME in obj.name or any(k in obj.name for k in SKIP):
        return False
    x0, x1, v0, v1 = limits(obj)
    cx = (x0 + x1) / 2
    tower = abs(cx) > TOWER_X or 'crown corbel' in obj.name
    if part == 'tower-left':
        return tower and cx < 0
    if part == 'tower-right':
        return tower and cx > 0
    if tower:
        return False
    # Pier: the left front brick pier (mirrored at runtime); arch: the rest of the span.
    if part == 'pier':
        return cx < 0 and any(k in obj.name for k in PIERS)
    return not any(k in obj.name for k in PIERS)


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
    v0, v1 = min((p - origin).dot(UP) for p in points) - .015, max((p - origin).dot(UP) for p in points) + .015
    world_width, world_height = x1 - x0, v1 - v0
    width = min(2048, math.ceil(world_width * 128))
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
