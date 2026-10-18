"""Renders Alaska's select, roll, roll-helmet and dazed clips as PNG frames (the intro: export-intro.py).
blender -b -P tools/blender/export-alaska.py -- <review-dir> [select|roll|roll-helmet|dazed ...]
Then python3 tools/build-figure.py <review-dir>. Every clip adds its entry to <review-dir>/meta.json."""
import json
import math
import os
import sys

import bpy
from mathutils import Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import alaska
import intro
import review

PPU = 160            # sprite pixels per figure unit, as for Kalle and Tine
SELECT_PPU = 200     # the card shows the select sprite at half size; the cat is smaller than the humans, so render it larger
UNIT = 1.1           # Blender units per figure unit: the curled cat then is about as wide as Kalle's and Tine's ball
GROUND_LIFT = .7 / 1.75 * .2   # the game centres the dazed sprite this far above the ground (figure units)
GAME = Vector((0, -6, 3.5))
SELECT = Vector((0, -6, 0.6))
ROLL_FRAMES, DAZED_FRAMES, SELECT_FRAMES = 32, 12, 12
# knocked out on her side, legs stretched out
KO = dict(roll=90, bend=-8, curl=8, nod=-12, f_l=70, f_r=55, fk_l=-10, fk_r=-15, b_l=-55, b_r=-65, bk_l=5, bk_r=5, tail=15,
          noglasses=1)


def setup():
    scene, cam, target, lights = review.scene_setup()
    for light, _, _ in lights:   # same PBR world and sun as the other figures' sheets
        bpy.data.objects.remove(light, do_unlink=True)
    scene.world.use_nodes = False
    scene.world.color = (.55, .58, .62)
    sun = bpy.data.objects.new('Sun', bpy.data.lights.new('Sun', 'SUN'))
    scene.collection.objects.link(sun)
    sun.data.energy = 3
    view = -GAME.normalized()
    left = -view.cross(Vector((0, 0, 1))).normalized()
    sun.rotation_euler = (-view + left * .7 + Vector((0, 0, .9))).to_track_quat('Z', 'Y').to_euler()
    return scene, cam, target


def basis(offset):
    view = -Vector(offset).normalized()
    right = view.cross(Vector((0, 0, 1))).normalized()
    return right, right.cross(view).normalized()


def render(scene, cam, target, out, name, n, apply, offset, anchor, loop, centred=False, margin=8, ppu=PPU):
    """Pass 1 measures the frames around the anchor, pass 2 renders. centred: the anchor is the frame centre."""
    ppb = ppu / UNIT
    right, up = basis(offset)
    xs, ys = [], []
    for i in range(n):
        apply(i)
        for point in review.world_corners(review.meshes()):
            d = point - anchor
            xs.append(d.dot(right))
            ys.append(d.dot(up))
    half_w = max(-min(xs), max(xs))
    if centred:
        w = math.ceil((2 * half_w * ppb + 2 * margin) / 4) * 4
        h = math.ceil((2 * max(-min(ys), max(ys)) * ppb + 2 * margin) / 4) * 4
        mid = 0
    else:
        w = math.ceil((2 * half_w * ppb + 2 * margin) / 4) * 4
        h = math.ceil(((max(ys) - min(ys)) * ppb + 2 * margin) / 4) * 4
        mid = (max(ys) + min(ys)) / 2
    center = anchor + up * mid
    scene.render.resolution_x, scene.render.resolution_y = w, h
    cam.data.ortho_scale = max(w, h) / ppb
    os.makedirs(os.path.join(out, name), exist_ok=True)
    for i in range(n):
        apply(i)
        target.location = center
        cam.location = center + Vector(offset)
        scene.render.filepath = os.path.join(out, name, f'{i:02d}.png')
        bpy.ops.render.render(write_still=True)
    return dict(n=n, w=w, h=h, ax=w / 2, ay=round(h / 2 + mid * ppb, 1), loop=loop)


def main():
    out, *wanted = sys.argv[sys.argv.index('--') + 1:]
    out = os.path.realpath(out)
    if not out.startswith(os.path.join(review.ROOT, '.claude', 'review') + os.sep):
        raise SystemExit('PNG-Ausgabe muss unter .claude/review liegen.')
    clips = wanted or ['select', 'roll', 'roll-helmet', 'dazed']
    scene, cam, target = setup()
    rig, helmet, _ = alaska.build()

    def show_helmet(on):
        for ob in helmet:
            ob.hide_render = not on

    meta_path = os.path.join(out, 'meta.json')
    meta = json.load(open(meta_path)) if os.path.exists(meta_path) else {}
    os.makedirs(out, exist_ok=True)

    # the ball's centre and pivot, shared by both roll clips
    show_helmet(False)
    rig.pose(intro.BALL_ALASKA)
    lo, hi = review.bounds(review.meshes())
    pivot = (lo + hi) / 2
    pivot_local = rig.root.matrix_world.inverted() @ pivot

    def settle(pose):
        rig.pose(pose)
        review.settle_on_floor(rig, review.meshes())

    for name in clips:
        show_helmet(name == 'roll-helmet')
        if name == 'select':   # faces the camera and breathes
            def apply(i):
                a = 2 * math.pi * i / SELECT_FRAMES
                settle(dict(yaw=180, bend=1.5 * math.sin(a), nod=-2 * math.sin(a), tail=5 * math.sin(a), lift=.004 * math.cos(a)))
            ground = Vector((0, 0, 0))
            meta[name] = render(scene, cam, target, out, name, SELECT_FRAMES, apply, SELECT, ground, True, ppu=SELECT_PPU)
        elif name.startswith('roll'):
            def apply(i):
                rig.pose(dict(intro.BALL_ALASKA, pitch=intro.BALL_ALASKA['pitch'] - 360 * i / ROLL_FRAMES))
                bpy.context.view_layer.update()   # a rigid turn about the ball centre: no wobble
                rig.root.location = pivot - rig.root.matrix_world.to_3x3() @ pivot_local
                for callback in rig.after:
                    callback()
            meta[name] = render(scene, cam, target, out, name, ROLL_FRAMES, apply, GAME, pivot, True)
        elif name == 'dazed':
            def apply(i):
                a = 2 * math.pi * i / DAZED_FRAMES
                settle(dict(KO, tilt=28 * math.sin(a), nod=KO['nod'] + 12 * math.cos(2 * a), f_l=KO['f_l'] + 6 * math.sin(a)))
            # the game centres the sprite GROUND_LIFT above the ground point under the body
            apply(0)
            lo, hi = review.bounds(review.meshes())
            _, up = basis(GAME)
            anchor = Vector(((lo.x + hi.x) / 2, (lo.y + hi.y) / 2, 0)) + up * (GROUND_LIFT * UNIT)
            meta[name] = render(scene, cam, target, out, name, DAZED_FRAMES, apply, GAME, anchor, True, centred=True)
            right, up = basis(GAME)
            apply(0)
            d = rig.neck.matrix_world.translation + Vector((0, 0, .1)) - anchor
            ppb = PPU / UNIT
            meta[name]['head'] = [round(meta[name]['w'] / 2 + d.dot(right) * ppb), round(meta[name]['h'] / 2 - d.dot(up) * ppb)]
        else:
            raise SystemExit(f'unbekannter Clip {name}')
        json.dump(meta, open(meta_path, 'w'), indent=1)


main()
