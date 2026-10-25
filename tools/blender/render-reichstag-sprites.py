"""Render the runtime parts of the Reichstag from the reviewed detailed model.

blender -b -P tools/blender/render-reichstag-sprites.py
python3 tools/build-reichstag-sprites.py
Same projection as render-oberbaum-sprites.py. The large source stays in the local, ignored review directory.
"""
import hashlib
import json
import math
import re
from pathlib import Path

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / '.claude/review/quellen/reichstag/reichstag.blend'
OUT = ROOT / '.claude/review/73/render-parts'
FRONT = 11.0
FLOOR = -12 * math.log((14 + FRONT) / (14 + 4))
ANGLE = math.radians(8)
UP = Vector((0, math.sin(ANGLE), math.cos(ANGLE)))
DIRECTION = Vector((0, math.cos(ANGLE), -math.sin(ANGLE)))
PX_PER_UNIT = 80   # about 2x the nearest wall on a 390 px phone at DPR 2
PARTS = ('wing-left', 'wing-right', 'column', 'top')
COLUMN = re.compile(r'Column base cap|Fluted tapering|Corinthian column square|Column base upper|Column lower torus|Column neck ring|'
                    r'Corinthian capital bell|Capital spiral|Capital square|Carved acanthus')
TOP = re.compile(r'Pediment|Portico|Central |Dome|Continuous curved dome|Individual curved dome|Inscription|Relief wreath|'
                 r'Dark open oculus|Upper bridge')
PORTAL = 'Portal side wall'
COLUMN_X = -3.2   # middle column of the left portico block: the wall behind it spans the whole plinth, so it tiles along closed spans


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


def centre(obj):
    xs = [p.x for p in bounds[obj.name]]
    return (min(xs) + max(xs)) / 2


def selected(part, obj):
    cx = centre(obj)
    if part == 'column':   # column, plinth and capital, plus the wall slice behind it
        return abs(cx - COLUMN_X) < .35 and COLUMN.match(obj.name) or obj.name.startswith(PORTAL) and cx < 0
    if COLUMN.match(obj.name) or obj.name.startswith(PORTAL):
        return False
    if part == 'top':
        return bool(TOP.match(obj.name))
    if TOP.match(obj.name):
        return False
    return cx < 0 if part == 'wing-left' else cx > 0


# Seen from the 8 degree camera the open top of the base torus shows a dark hole around the shaft: cap it.
torus = next(o for o in objects if o.name.startswith('Column base upper') and abs(centre(o) - COLUMN_X) < .35)
corners = bounds[torus.name]
cap_centre = Vector((centre(torus), sum(p.y for p in corners) / 8, max(p.z for p in corners) + .1))
bpy.ops.mesh.primitive_cylinder_add(radius=.29, depth=.2, location=cap_centre)
cap = bpy.context.object
cap.name = 'Column base cap'
cap.data.materials.append(torus.data.materials[0])
cap_bounds = [cap.matrix_world @ Vector(p) for p in cap.bound_box]
bounds[cap.name] = cap_bounds
objects.append(cap)

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
    if part == 'column':   # the wall slice is as wide as the plinth, so tiles join without a seam
        plinth = [p.x for o in chosen if o.name.startswith('Corinthian column square') for p in bounds[o.name]]
        x0, x1 = min(plinth) - .01, max(plinth) + .01
    world_width, world_height = x1 - x0, v1 - v0
    width = min(2048, math.ceil(world_width * PX_PER_UNIT))
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
