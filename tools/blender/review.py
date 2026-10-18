"""Isolated model-sheet and intro renders; writes only below .claude/review."""
import importlib
import json
import math
import os
import sys

import bpy
from mathutils import Euler, Vector

TOOLS = os.path.dirname(os.path.realpath(__file__))
ROOT = os.path.realpath(os.path.join(TOOLS, '..', '..'))
sys.path.insert(0, TOOLS)


def arguments():
    args = sys.argv[sys.argv.index('--') + 1:]
    if len(args) not in (2, 3):
        raise SystemExit('usage: review.py <alaska|storni|kalle|tine> <review-dir> [sheet|intro|intro-keyframes]')
    figure, out = args[:2]
    mode = args[2] if len(args) == 3 else 'sheet'
    if figure not in ('alaska', 'storni', 'kalle', 'tine') or mode not in ('sheet', 'intro', 'intro-keyframes'):
        raise SystemExit('ungültige Figur oder Renderart')
    if mode != 'sheet' and figure == 'storni':
        raise SystemExit('Intro-Render benötigen Alaska, Kalle oder Tine')
    out = os.path.realpath(out)
    allowed = os.path.realpath(os.path.join(ROOT, '.claude', 'review')) + os.sep
    if not out.startswith(allowed):
        raise SystemExit('Ausgabe muss unter .claude/review liegen')
    return figure, out, mode


def scene_setup():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE'
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    scene.render.film_transparent = True
    scene.view_settings.view_transform = 'Standard'
    scene.render.resolution_x = scene.render.resolution_y = 600
    scene.world = bpy.data.worlds.new('Review ambient')
    scene.world.color = (.55, .58, .62)
    scene.world.use_nodes = True
    scene.world.node_tree.nodes['Background'].inputs['Color'].default_value = (.48, .52, .62, 1)
    scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value = .35
    eevee = getattr(scene, 'eevee', None)
    if eevee:
        if hasattr(eevee, 'taa_render_samples'):
            eevee.taa_render_samples = 32
        elif hasattr(eevee, 'taa_samples'):
            eevee.taa_samples = 32
    cam_data = bpy.data.cameras.new('Review camera')
    cam = bpy.data.objects.new('Review camera', cam_data)
    scene.collection.objects.link(cam)
    cam.data.type = 'ORTHO'
    scene.camera = cam
    target = bpy.data.objects.new('Camera target', None)
    scene.collection.objects.link(target)
    track = cam.constraints.new('TRACK_TO')
    track.target, track.track_axis, track.up_axis = target, 'TRACK_NEGATIVE_Z', 'UP_Y'
    lights = []
    for name, energy_factor, size_factor in (('Warm upper-left key', 110, 1.5), ('Soft fill', 40, 2.5)):
        data = bpy.data.lights.new(name, 'AREA')
        light = bpy.data.objects.new(name, data)
        scene.collection.objects.link(light)
        light.data.shape = 'DISK'
        light.data.energy = energy_factor
        lights.append((light, energy_factor, size_factor))
    return scene, cam, target, lights


def meshes(exclude=()):
    return [o for o in bpy.context.scene.objects if o.type == 'MESH' and o not in exclude and not o.hide_render]


def world_corners(objects):
    bpy.context.view_layer.update()
    depsgraph = bpy.context.evaluated_depsgraph_get()
    for obj in objects:
        evaluated = obj.evaluated_get(depsgraph)
        yield from (evaluated.matrix_world @ Vector(corner) for corner in evaluated.bound_box)


def bounds(objects):
    pts = list(world_corners(objects))
    if not pts:
        return Vector((0, 0, 0)), Vector((0, 0, 1))
    return (Vector(tuple(min(p[a] for p in pts) for a in range(3))),
            Vector(tuple(max(p[a] for p in pts) for a in range(3))))


def settle_on_floor(rig, objects):
    lo, _ = bounds(objects)
    if lo.z < 0:
        rig.root.location.z -= lo.z
        for callback in rig.after:
            callback()
        bpy.context.view_layer.update()


def shot(scene, cam, target, path, center, offset, width, height, lights):
    target.location = center
    cam.location = Vector(center) + Vector(offset)
    cam.data.ortho_scale = max(width, height)
    view = -Vector(offset).normalized()
    right = view.cross(Vector((0, 0, 1))).normalized()
    up = right.cross(view).normalized()
    extent = max(width, height)
    for index, (light, energy_factor, size_factor) in enumerate(lights):
        if index == 0:
            light.location = Vector(center) - right * extent * 1.4 + up * extent * 1.8 - view * extent * 1.8
        else:
            light.location = Vector(center) + right * extent * 1.6 + up * extent * .5 - view * extent * 1.2
        light.data.energy = energy_factor * extent ** 2
        light.data.size = size_factor * extent
        light.rotation_euler = (Vector(center) - light.location).to_track_quat('-Z', 'Y').to_euler()
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)


def build_figure(name):
    module = importlib.import_module(name)
    rig, helmet, hat = module.build()
    return rig, helmet, hat


def model_sheet(name, out, scene, cam, target, lights):
    w, h = ((500, 500) if name in ('alaska', 'storni') else (600, 600))
    scene.render.resolution_x, scene.render.resolution_y = w, h
    if name == 'storni':
        bottle, _ = importlib.import_module('storni').build()
        bottle.rotation_mode = 'QUATERNION'
        upright = Euler((0, -math.pi / 2, 0)).to_quaternion()
        bottle.rotation_quaternion = upright
        views = [('01-front', (-1, 0, 0)), ('02-links', (0, -1, 0)),
                 ('03-ruecken', (1, 0, 0)), ('04-rechts', (0, 1, 0))]
        lo, hi = bounds([ob for ob in (bottle, *bottle.children_recursive) if ob.type == 'MESH'])
        center, extent = (lo + hi) * .5, max(hi - lo) * 1.15
        for label, offset in views:
            shot(scene, cam, target, os.path.join(out, label + '.png'), center, offset, extent, extent, lights)
        return
    rig, helmet, _ = build_figure(name)
    if helmet:
        for ob in helmet:
            ob.hide_render = True
    if hasattr(importlib.import_module(name), 'APOSE'):
        rig.pose(importlib.import_module(name).APOSE)
    else:
        rig.pose({})
    front = (0, 8, 0)
    views = [('01-front', front), ('02-links', (-8, 0, 0)), ('03-ruecken', (0, -8, 0)),
             ('04-rechts', (8, 0, 0))]
    objects = meshes(helmet)
    lo, hi = bounds(objects)
    center = (lo + hi) * .5
    extent = max(hi - lo) * 1.15
    for label, offset in views:
        shot(scene, cam, target, os.path.join(out, label + '.png'), center, offset, extent, extent, lights)


def intro_render(name, out, mode, scene, cam, target, lights):
    import intro
    import storni
    rig, helmet, _ = build_figure(name)
    if helmet:
        for ob in helmet:
            ob.hide_render = True
    figure_objects = meshes(helmet)
    prop, _ = storni.build()
    prop.location = (0, 0, -10)
    prop.hide_render = True
    for child in prop.children:
        child.hide_render = True
    keys = [0, 6, 12, 18, 23, 29, 35, 39, 44]
    render_frames = range(intro.N) if mode == 'intro' else keys
    rig.pose(intro.pose_at(name, 35))
    settle_on_floor(rig, figure_objects)
    bpy.context.view_layer.update()
    # Fixed composition is anchored at the canonical first roll-ball centre.
    lo, hi = bounds(figure_objects)
    anchor = (lo + hi) * .5
    anchor_root = rig.root.matrix_world.inverted() @ anchor
    scene.render.resolution_x, scene.render.resolution_y = 480, 480
    offset = (0, -6, 3.5)
    view = -Vector(offset).normalized()
    right = view.cross(Vector((0, 0, 1))).normalized()
    up = right.cross(view).normalized()
    xs, ys = [], []
    for frame in range(intro.N):
        rig.pose(intro.pose_at(name, frame))
        if frame < intro.TUCK:
            settle_on_floor(rig, figure_objects)
        if frame >= intro.TUCK:
            bpy.context.view_layer.update()
            rig.root.location = anchor - (rig.root.matrix_world.to_3x3() @ anchor_root)
            for callback in rig.after:
                callback()
        bottle = intro.bottle_at(name, frame)
        prop.location, prop.rotation_euler = bottle['location'], bottle['rotation']
        prop.hide_render = not bottle['visible']
        for child in prop.children:
            child.hide_render = not bottle['visible']
        bpy.context.view_layer.update()
        visible = figure_objects + ([o for o in (prop, *prop.children) if not o.hide_render])
        for point in world_corners(visible):
            delta = point - anchor
            xs.append(delta.dot(right))
            ys.append(delta.dot(up))
    ortho = max(max(xs) - min(xs), max(ys) - min(ys)) * 1.08
    center = anchor + right * ((min(xs) + max(xs)) / 2) + up * ((min(ys) + max(ys)) / 2)
    pixels = math.ceil(ortho * 160 / 4) * 4
    scene.render.resolution_x = scene.render.resolution_y = pixels
    os.makedirs(out, exist_ok=True)
    for i in render_frames:
        pose = intro.pose_at(name, i)
        rig.pose(pose)
        if i < intro.TUCK:
            settle_on_floor(rig, figure_objects)
        if i >= intro.TUCK:
            bpy.context.view_layer.update()
            rig.root.location = anchor - (rig.root.matrix_world.to_3x3() @ anchor_root)
            for callback in rig.after:
                callback()
        bottle = intro.bottle_at(name, i)
        prop.location = bottle['location']
        prop.rotation_euler = bottle['rotation']
        prop.hide_render = not bottle['visible']
        for child in prop.children:
            child.hide_render = not bottle['visible']
        bpy.context.view_layer.update()
        path = os.path.join(out, f'{i:02d}.png')
        shot(scene, cam, target, path, center, offset, ortho, ortho, lights)
    meta = {'fps': intro.FPS, 'n': intro.N, 'duration': intro.N / intro.FPS,
            'width': pixels, 'height': pixels, 'frames': list(render_frames),
            'ppu': pixels / ortho, 'ortho': ortho,
            'ax': pixels / 2 + (anchor - center).dot(right) * pixels / ortho,
            'ay': pixels / 2 - (anchor - center).dot(up) * pixels / ortho,
            'anchor': list(anchor), 'tuck_frame': intro.TUCK,
            'ending_roll_angle': 11.25 * (intro.N - 1 - intro.TUCK)}
    with open(os.path.join(out, 'meta.json'), 'w') as handle:
        json.dump(meta, handle, indent=2)
    scene['review_blend_note'] = 'Die Animation liegt als PNG-Sequenz vor; diese Blend-Datei speichert das Modell in der letzten Renderpose.'


def main():
    figure, out, mode = arguments()
    os.makedirs(out, exist_ok=True)
    scene, cam, target, lights = scene_setup()
    if mode == 'sheet':
        model_sheet(figure, out, scene, cam, target, lights)
    else:
        intro_render(figure, out, mode, scene, cam, target, lights)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out, 'review.blend'))


if __name__ == '__main__':
    main()
