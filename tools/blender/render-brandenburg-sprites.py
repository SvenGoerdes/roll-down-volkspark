"""Render three runtime parts from the reviewed detailed model, not the old prototype.

blender -b -P tools/blender/render-brandenburg-sprites.py
python3 tools/build-gate-sprites.py
The large source remains in the local, ignored review directory.
"""
import hashlib
import json
import math
from pathlib import Path

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / '.claude/review/quellen/brandenburg-gate/brandenburg-gate-detailed.blend'
OUT = ROOT / '.claude/review/28/render-parts'
S = 3.72 / 3.2
FRONT = 11.0
FLOOR = -12 * math.log((14 + FRONT) / (14 + 4))
ANGLE = math.radians(8)
UP = Vector((0, math.sin(ANGLE), math.cos(ANGLE)))
DIRECTION = Vector((0, math.cos(ANGLE), -math.sin(ANGLE)))


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


def limits(obj):
    points = bounds[obj.name]
    return (min(p.x for p in points), max(p.x for p in points),
            min(p.z for p in points), max(p.z for p in points))


def selected(part, obj):
    x0, x1, z0, z1 = limits(obj)
    if part == 'roof':
        return z0 >= FLOOR + 4.87 * S
    if part == 'pier':
        # Third front/rear pier including its original fluting and side relief.
        barrier = any(m and m.name.startswith('Barrier |') for m in obj.data.materials)
        return not barrier and abs((x0 + x1) / 2 - (-2.09 * S)) < .55 * S and z1 < FLOOR + 4.88 * S
    # Original oak planks, hinges and nails in the leftmost blocked passage.
    return -6 * S + .5 * S < (x0 + x1) / 2 < -4.05 * S - .5 * S and z1 < FLOOR + 1.4 * S


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
origin = Vector((0, FRONT, FLOOR))
for part in ('roof', 'pier', 'barrier'):
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
    # Use the exact pixel aspect after rounding so metadata and projection agree.
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
                              'bottom': v0, 'objects': len(chosen),
                              'pngSha256': digest(OUT / f'{part}.png')}
(OUT / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
