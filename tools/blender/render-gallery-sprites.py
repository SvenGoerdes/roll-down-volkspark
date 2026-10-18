"""Render the six East Side Gallery bays from the reviewed detailed model, one sprite each.

blender -b -P tools/blender/render-gallery-sprites.py
python3 tools/build-gallery-sprites.py
Same front elevation as the gate parts. The large source stays in the ignored review directory.
"""
import hashlib
import json
import math
from pathlib import Path

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / '.claude/review/quellen/east-side-gallery/east-side-gallery-detailed.blend'
OUT = ROOT / '.claude/review/71/render-parts'
FRONT = 11.0
FLOOR = -12 * math.log((14 + FRONT) / (14 + 4))
ANGLE = math.radians(8)
UP = Vector((0, math.sin(ANGLE), math.cos(ANGLE)))
DIRECTION = Vector((0, math.cos(ANGLE), -math.sin(ANGLE)))
GAP, OUTER = 3.8, 6.0
PITCH = (OUTER - GAP / 2) / 3
# Bay name in the model -> wing start x; the plaque belongs to the bay it sits on.
BAYS = {
    'l1': ('Left front bay 1', -OUTER), 'l2': ('Left front bay 2', -OUTER + PITCH), 'l3': ('Left front bay 3', -OUTER + 2 * PITCH),
    'r1': ('Right front bay 1', GAP / 2), 'r2': ('Right front bay 2', GAP / 2 + PITCH), 'r3': ('Right front bay 3', GAP / 2 + 2 * PITCH),
}


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
objects = [o for o in scene.objects if o.type in ('MESH', 'CURVE', 'FONT')]
bounds = {}
for obj in objects:
    evaluated = obj.evaluated_get(deps)
    bounds[obj.name] = [evaluated.matrix_world @ Vector(p) for p in evaluated.bound_box]


def center_x(obj):
    xs = [p.x for p in bounds[obj.name]]
    return (min(xs) + max(xs)) / 2


def selected(part, obj):
    prefix, start = BAYS[part]
    if obj.name.startswith(prefix):
        return True
    # Museum plaque with pins and lettering sits on the outer bay of each wing.
    return 'plaque' in obj.name and start <= center_x(obj) < start + PITCH


camera_data = bpy.data.cameras.new('Gallery parts front elevation')
camera = bpy.data.objects.new('Gallery parts front elevation', camera_data)
scene.collection.objects.link(camera)
scene.camera = camera
camera_data.type = 'ORTHO'
camera_data.sensor_fit = 'HORIZONTAL'
camera_data.shift_x = camera_data.shift_y = 0
camera.rotation_euler = DIRECTION.to_track_quat('-Z', 'Y').to_euler()
manifest = {'source': str(SOURCE.relative_to(ROOT)), 'sourceSha256': digest(SOURCE),
            'scriptSha256': digest(Path(__file__)), 'pitch': PITCH, 'parts': {}}
origin = Vector((0, FRONT, FLOOR))
for part in BAYS:
    chosen = [o for o in objects if selected(part, o)]
    assert chosen, part
    for obj in objects:
        obj.hide_render = obj not in chosen
    points = [p for obj in chosen for p in bounds[obj.name]]
    # Fixed width around the bay centre, so every tile has the same pitch and anchor;
    # stray bounds (text, cracks) must not widen it.
    cx = BAYS[part][1] + PITCH / 2
    half = PITCH / 2 + .03
    x0, x1 = cx - half, cx + half
    v0, v1 = min((p - origin).dot(UP) for p in points) - .015, max((p - origin).dot(UP) for p in points) + .015
    world_width, world_height = x1 - x0, v1 - v0
    width = math.ceil(world_width * 144)
    height = math.ceil(width * world_height / world_width)
    world_height = height / width * world_width
    target = origin + Vector((cx, 0, 0)) + UP * (v0 + world_height / 2)
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
