"""Render the accepted human intro through the existing Blender/PNG pipeline.

blender -b -P tools/blender/export-intro.py -- <kalle|tine> <review-dir>
Then python3 tools/build-intro.py <review-dir> to update only that intro atlas.
The 36 source poses through tuck are sampled at 20 fps; roll/helmet/dazed stay untouched.
"""
import json
import math
import os
import sys

import bpy
from mathutils import Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import intro
import review
import storni

PPU = 192  # native DPR 2 through a ~457 CSS-px-wide game frame
FPS = 20
DURATION = 1.5
GAME = Vector((0, -6, 3.5))


def main():
    name, out = sys.argv[sys.argv.index('--') + 1:]
    if name not in ('kalle', 'tine'):
        raise SystemExit('Nur Kalle und Tine; Alaska gehört zu #20.')
    out = os.path.realpath(out)
    if not out.startswith(os.path.join(review.ROOT, '.claude', 'review') + os.sep):
        raise SystemExit('PNG-Ausgabe muss unter .claude/review liegen.')
    os.makedirs(out, exist_ok=True)
    source_frames = [round(i * intro.TUCK / (round(FPS * DURATION) - 1))
                     for i in range(round(FPS * DURATION))]
    scene, cam, target, lights = review.scene_setup()
    # Same PBR world and sun as render.py, so the old roll sheets still match.
    for light, _, _ in lights:
        bpy.data.objects.remove(light, do_unlink=True)
    scene.world.use_nodes = False
    scene.world.color = (.55, .58, .62)
    sun = bpy.data.objects.new('Intro sun', bpy.data.lights.new('Intro sun', 'SUN'))
    scene.collection.objects.link(sun)
    sun.data.energy = 3
    view = -GAME.normalized()
    right = view.cross(Vector((0, 0, 1))).normalized()
    up = right.cross(view).normalized()
    left = -right
    sun.rotation_euler = (-view + left * .7 + Vector((0, 0, .9))).to_track_quat('Z', 'Y').to_euler()
    rig, helmet, _ = review.build_figure(name)
    for ob in helmet:
        ob.hide_render = True
    actors = review.meshes(helmet)
    prop, _ = storni.build()
    props = [prop, *prop.children_recursive]
    # The accepted game-facing typography transform, not the front beauty view.
    for ob in props:
        if ob.type == 'FONT':
            ob.rotation_euler.z = 0
            ob.location.y = -ob.location.y

    def ground_actor():
        # The prototype's positive lift must not snap down only at TUCK.
        lo, _ = review.bounds(actors)
        rig.root.location.z -= lo.z
        for callback in rig.after:
            callback()

    rig.pose(intro.pose_at(name, intro.TUCK))
    ground_actor()
    lo, hi = review.bounds(actors)
    anchor = (lo + hi) * .5
    local_anchor = rig.root.matrix_world.inverted() @ anchor

    def apply(i):
        pose = intro.pose_at(name, i)
        rig.pose(pose)
        if i < intro.TUCK:
            ground_actor()
        else:
            bpy.context.view_layer.update()
            rig.root.location = anchor - rig.root.matrix_world.to_3x3() @ local_anchor
            for callback in rig.after:
                callback()
        bottle = intro.bottle_at(name, i)
        prop.location, prop.rotation_euler = bottle['location'], bottle['rotation']
        for ob in props:
            ob.hide_render = not bottle['visible']
        bpy.context.view_layer.update()
        # Bake the old standing-floor correction into frames, not into the loop.
        # Keep the actual foot/neck contact geometry together while easing to roll.
        progress = max(0, (i - intro.CONTACT) / (intro.TUCK - intro.CONTACT))
        floor = Vector((0, pose.get('fwd', 0), 0))
        correction = (.7 / 1.75 - (anchor - floor).dot(up)) * (1 - progress)
        return correction

    points = []
    for i in source_frames:
        correction = apply(i)
        objects = actors + [ob for ob in props if not ob.hide_render]
        for point in review.world_corners(objects):
            d = point - anchor - up * correction
            points.append((d.dot(right), d.dot(up)))
    margin = 8
    min_x, max_x = min(p[0] for p in points), max(p[0] for p in points)
    min_y, max_y = min(p[1] for p in points), max(p[1] for p in points)
    width = math.ceil(((max_x - min_x) * PPU + margin * 2) / 4) * 4
    height = math.ceil(((max_y - min_y) * PPU + margin * 2) / 4) * 4
    center = anchor + right * ((min_x + max_x) / 2) + up * ((min_y + max_y) / 2)
    scene.render.resolution_x, scene.render.resolution_y = width, height
    cam.data.ortho_scale = max(width, height) / PPU
    for i, source_frame in enumerate(source_frames):
        correction = apply(source_frame)
        target.location = center + up * correction
        cam.location = target.location + GAME
        scene.render.filepath = os.path.join(out, f'{i:02d}.png')
        bpy.ops.render.render(write_still=True)
    meta = dict(figure=name, n=len(source_frames), fps=FPS, contact=source_frames.index(intro.CONTACT),
                source_frames=source_frames,
                w=width, h=height, ppu=PPU, loop=False,
                ax=width / 2 - (center - anchor).dot(right) * PPU,
                ay=height / 2 + (center - anchor).dot(up) * PPU)
    with open(os.path.join(out, 'meta.json'), 'w') as handle:
        json.dump(meta, handle, indent=2)


if __name__ == '__main__':
    main()
