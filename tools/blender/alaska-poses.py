"""Test poses for the Alaska rig (ticket #20): stand, walk, curled. Writes PNGs and one contact sheet below .claude/review.
blender -b -P tools/blender/alaska-poses.py -- <out-dir> [pose-file.json]"""
import json, os, sys
import bpy
import numpy as np
from mathutils import Vector

sys.path.insert(0, os.path.dirname(os.path.realpath(__file__)))
import review, alaska

POSES = {
    '01-stehen': dict(),
    '02-laufen-a': dict(f_l=30, f_r=-25, fk_l=-40, fk_r=5, b_r=25, b_l=-25, bk_r=-40, bk_l=5, tail=-18, nod=4),
    '03-laufen-b': dict(f_r=30, f_l=-25, fk_r=-40, fk_l=5, b_l=25, b_r=-25, bk_l=-40, bk_r=5, tail=18, nod=-4),
    '04-brille-faellt': dict(bend=-25, curl=20, nod=-30, f_l=40, f_r=40, fk_l=-30, fk_r=-30, gl=.55, tail=10),
    '05-eingerollt': dict(noglasses=1, curl=62, arch=68, bend=-62, nod=-25, tuck=.3, f_l=25, f_r=25, fk_l=-70, fk_r=-70,
                          b_l=40, b_r=40, bk_l=-100, bk_r=-100),
}
VIEWS = {'game': (0, -6, 3.5), 'seite': (8, 0, 0), 'vorn': (0, 8, 0)}
CLOSE = {   # name: (camera offset, look-at, view size): the spots the reconstruction got wrong
    'ohr-links': ((-6, 3, 2), (-0.2, 0.45, 1.1), 0.7), 'ohr-rechts': ((6, 3, 2), (0.28, 0.45, 1.1), 0.7),
    'kopf': ((0, 7, 2), (0.04, 0.55, 0.95), 0.9), 'brust': ((-6, 0, 0.5), (0, 0.45, 0.5), 0.9),
    'schwanz': ((5, -5, 1), (-0.05, -0.6, 0.4), 0.9), 'dreiviertel': ((5, 7, 3), (0, 0, 0.6), 2.0),
}
SIZE = 360


def sheet(paths, cols, out):
    """Pastes the PNGs onto white, row by row, into one image."""
    rows = -(-len(paths) // cols)
    canvas = np.ones((rows * SIZE, cols * SIZE, 4), dtype=np.float32)
    for i, path in enumerate(paths):
        img = bpy.data.images.load(path)
        img.scale(SIZE, SIZE)
        px = np.empty(img.size[0] * img.size[1] * 4, dtype=np.float32)
        img.pixels.foreach_get(px)
        px = px.reshape(img.size[1], img.size[0], 4)
        px = px[:, :, :3] * px[:, :, 3:] + (1 - px[:, :, 3:])
        r, c = divmod(i, cols)
        y0 = (rows - 1 - r) * SIZE   # image rows count from the bottom
        canvas[y0:y0 + SIZE, c * SIZE:(c + 1) * SIZE, :3] = px
        bpy.data.images.remove(img)
    res = bpy.data.images.new('sheet', cols * SIZE, rows * SIZE, alpha=False)
    res.pixels.foreach_set(canvas.ravel())
    res.filepath_raw, res.file_format = out, 'PNG'
    res.save()


def main():
    args = sys.argv[sys.argv.index('--') + 1:]
    out = os.path.realpath(args[0])
    poses = json.load(open(args[1])) if len(args) > 1 else POSES
    os.makedirs(out, exist_ok=True)
    scene, cam, target, lights = review.scene_setup()
    rig, helmet, _ = alaska.build()
    for ob in helmet:
        ob.hide_render = True
    objects = review.meshes()
    scene.render.resolution_x = scene.render.resolution_y = SIZE
    paths = []
    for name, pose in poses.items():
        rig.pose(pose)
        review.settle_on_floor(rig, objects)
        lo, hi = review.bounds(objects)
        center, extent = (lo + hi) * .5, max(hi - lo) * 1.25
        for view, offset in VIEWS.items():
            path = os.path.join(out, f'{name}-{view}.png')
            review.shot(scene, cam, target, path, center, offset, extent, extent, lights)
            paths.append(path)
    sheet(paths, len(VIEWS), os.path.join(out, 'blatt.png'))
    rig.pose({})
    closeups = []
    for name, (offset, centre, extent) in CLOSE.items():
        path = os.path.join(out, f'nah-{name}.png')
        review.shot(scene, cam, target, path, Vector(centre), offset, extent, extent, lights)
        closeups.append(path)
    sheet(closeups, 3, os.path.join(out, 'nahaufnahmen.png'))


main()
