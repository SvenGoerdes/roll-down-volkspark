"""Local Blender sightseeing-asset pipeline. Checks never render or write PNGs."""
import argparse
import importlib.machinery
import json
import math
import os
import subprocess
import sys
import bpy
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Vector

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
OUT_DIR = os.path.join(ROOT, '.claude', 'review', 'runde-2')
W, H = 1170, 2532
BASE_W, BASE_H = 390, 844
CLEARANCE_MARGIN = 0.02


def load_file(name, filename):
    return importlib.machinery.SourceFileLoader(name, os.path.join(HERE, filename)).load_module()


def game_values():
    code = """import {computeView,terrainDrop} from './js/view.js';
import {CORRIDOR,PLAYER_Z,PLAYER_SCREEN_Y,HORIZON,HILL_DROP,HILL_RUN} from './js/config.js';
import {spacingAt,shiftAt,gapWidthAt} from './js/logic.js';
const v=computeView(390,844); console.log(JSON.stringify({F:v.F,horizonY:v.horizonY,CH:v.CH,CORRIDOR,PLAYER_Z,PLAYER_SCREEN_Y,HORIZON,HILL_DROP,HILL_RUN,spacing:spacingAt(1),shift:shiftAt(1),gap:gapWidthAt(0),spacingCurve:Object.fromEntries([1,80,200].map(n=>[n,{spacing:spacingAt(n),shift:shiftAt(n),gap:gapWidthAt(n)}])),drop11:terrainDrop(11)}));"""
    raw = subprocess.check_output(['bun', '--eval', code], cwd=ROOT, text=True)
    return json.loads(raw.strip().splitlines()[-1])


def terrain_drop(z, g):
    return g['HILL_DROP'] * math.log((g['HILL_RUN'] + max(0, z)) / (g['HILL_RUN'] + g['PLAYER_Z']))


def scene_setup(g):
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE'
    camera_w, camera_h = (192, 384) if g.get('scenery') else (W, H)
    scene.render.resolution_x, scene.render.resolution_y = camera_w, camera_h
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    camera_data = bpy.data.cameras.new('exact game projection')
    camera = bpy.data.objects.new('exact game projection', camera_data)
    scene.collection.objects.link(camera)
    camera.location = (g.get('cameraX', 0), 0, g['CH'])
    camera.rotation_euler = (math.pi / 2, 0, 0)
    camera_data.type = 'ORTHO' if g.get('scenery') else 'PERSP'
    camera_data.lens = g['F'] * 36 / BASE_W
    camera_data.ortho_scale = 16
    camera_data.sensor_fit = 'HORIZONTAL'
    camera_data.sensor_width = 36
    camera_data.sensor_height = 36 * camera_h / camera_w
    camera_data.shift_y = (g['horizonY'] - BASE_H / 2) / BASE_W
    if g.get('scenery'):
        camera_data.shift_y = 0
    scene.camera = camera
    world = bpy.data.worlds.new('transparent warm studio')
    world.use_nodes = True
    world.node_tree.nodes['Background'].inputs['Color'].default_value = (0.67, 0.59, 0.47, 1)
    world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.7
    scene.world = world
    light_data = bpy.data.lights.new('soft light from upper left', 'AREA')
    light = bpy.data.objects.new('soft light from upper left', light_data)
    scene.collection.objects.link(light)
    light.location = (-8, 5, g['CH'] + 12)
    light_data.energy, light_data.shape, light_data.size = 2200, 'DISK', 9
    light.rotation_euler = (Vector((0, 11, 2)) - light.location).to_track_quat('-Z', 'Y').to_euler()
    scene.view_settings.view_transform = 'Standard'
    scene.view_settings.look = 'Medium High Contrast'
    return camera


def fit_scenery_camera(camera, bounds):
    xs = [b[i] for b in bounds.values() for i in (0, 1)]
    zs = [b[i] for b in bounds.values() for i in (4, 5)]
    if not xs or not zs:
        raise RuntimeError('Fernsehturm-Randcutout hat keine ausgewerteten Mesh-Bounds.')
    x_mid = (min(xs) + max(xs)) / 2
    z_min, z_max = min(zs), max(zs)
    height = z_max - z_min
    aspect = 192 / 384
    camera.data.ortho_scale = (height / 0.95) * aspect
    camera.location = (x_mid, 0, (z_min + z_max) / 2)
    scene = bpy.context.scene
    points = [(x, y, z) for b in bounds.values()
              for x in (b[0], b[1]) for y in (b[2], b[3]) for z in (b[4], b[5])]
    for _ in range(4):
        bpy.context.view_layer.update()
        ys = [(1 - world_to_camera_view(scene, camera, Vector(p)).y) for p in points]
        fill = max(ys) - min(ys)
        camera.data.ortho_scale *= fill / 0.95
    bpy.context.view_layer.update()
    projected = [world_to_camera_view(scene, camera, Vector(p)) for p in points]
    xs = [p.x for p in projected]
    ys = [1 - p.y for p in projected]
    fill = max(ys) - min(ys)
    assert 0.94 <= fill <= 0.96, f'Randkamera-BBox füllt nur {fill:.3f} der Bildhöhe.'
    assert min(xs) > 0 and max(xs) < 1 and min(ys) > 0 and max(ys) < 1, 'Randmodell liegt außerhalb der Kamera.'
    z_mid = (z_min + z_max) / 2
    for ob in scene.objects:
        if ob.type == 'LIGHT' and ob.name == 'soft light from upper left':
            ob.location = (-5, 3, z_max + 7)
            ob.rotation_euler = (Vector((x_mid, 11, z_mid)) - ob.location).to_track_quat('-Z', 'Y').to_euler()
    print(f'RANDKAMERA: orthographic bbox height={height:.3f}, scale={camera.data.ortho_scale:.3f}, fill=95%.')


def projection_checks(scene, camera, g):
    max_error = 0.0
    bpy.context.view_layer.update()
    for z in (8.0, 11.0, 13.6, 32.0):
        for x in (-1.0, 0.0, 1.0):
            for height in (0.0, 1.4, 3.7, 6.0):
                co = Vector((x, z, height - terrain_drop(z, g)))
                ndc = world_to_camera_view(scene, camera, co)
                got = (ndc.x * BASE_W, (1 - ndc.y) * BASE_H)
                s = g['F'] / z
                want = (BASE_W / 2 + x * s, g['horizonY'] + (g['CH'] + terrain_drop(z, g) - height) * s)
                error = max(abs(got[0] - want[0]), abs(got[1] - want[1]))
                assert error < 1e-3, f'Kameraprojektion bei x={x}, y={z}, h={height} weicht um {error:g}px ab'
                max_error = max(max_error, error)
    print(f'KAMERA: alle 48 Originalprojektionsanker stimmen bis {max_error:.6f}px.')
    return max_error


WALKABLE = {'small ground patch', 'Oberbaum | short walkable arcade floor'}


def evaluated_bounds():
    bpy.context.view_layer.update()
    deps = bpy.context.evaluated_depsgraph_get()
    bounds = {}
    for ob in bpy.context.scene.objects:
        if ob.type != 'MESH':
            continue
        evaluated = ob.evaluated_get(deps)
        points = [evaluated.matrix_world @ Vector(c) for c in evaluated.bound_box]
        if points:
            bounds[ob.name] = (min(p.x for p in points), max(p.x for p in points),
                               min(p.y for p in points), max(p.y for p in points),
                               min(p.z for p in points), max(p.z for p in points))
    return bounds


def corridor_parts(bounds, game):
    parts = []
    for name, b in bounds.items():
        if name in WALKABLE or b[3] < 4 or b[2] > 35:
            continue
        floor_low = min(-terrain_drop(max(0, b[2]), game), -terrain_drop(max(0, b[3]), game))
        floor_high = max(-terrain_drop(max(0, b[2]), game), -terrain_drop(max(0, b[3]), game))
        if b[4] < floor_high + 1.4 and b[5] > floor_low:
            parts.append((name, b))
    return parts


def minimum_opening(bounds, game):
    parts = corridor_parts(bounds, game)
    left = [(n, b) for n, b in parts if b[1] < 0]
    right = [(n, b) for n, b in parts if b[0] > 0]
    pairs = []
    for left_name, a in left:
        for right_name, b in right:
            y_overlap = min(a[3], b[3]) - max(a[2], b[2])
            z_overlap = min(a[5], b[5]) - max(a[4], b[4])
            if y_overlap >= 0 and z_overlap >= 0:
                pairs.append((b[0] - a[1], left_name, right_name))
    return min(pairs, default=(float(game['CORRIDOR']), '', ''))


def gate_opening(bounds):
    clearances = []
    for row in ('front', 'back'):
        for part in ('fluted sandstone column', 'column foot', 'column capital'):
            left = bounds[f'{row} {part} 3'][1]
            right = bounds[f'{row} {part} 4'][0]
            clearances.append((right - left, f'{row} {part}'))
    return min(clearances)


def bounds_and_gaps(gap_min, game, bounds, scenery=False):
    gate = any('fluted sandstone column' in n for n in bounds)
    if scenery:
        print('GAP: Fernsehturm-Randcutout; kein spielbarer Korridor in dieser Szenenvariante.')
    else:
        if gate:
            for row in ('front', 'back'):
                parts = ('fluted sandstone column', 'column foot', 'column capital')
                clearances = []
                for part in parts:
                    left = bounds[f'{row} {part} 3'][1]
                    right = bounds[f'{row} {part} 4'][0]
                    clearances.append(right - left)
                    print(f'GAP Tor {row} {part}: {right - left:.6f}')
                print(f'GAP Tor {row}: min Säule/Fuß/Kapitell = {min(clearances):.4f} (soll >= {gap_min:.2f})')
        measured, left_part, right_part = minimum_opening(bounds, game)
        print(f'GAP gemessen: {measured:.4f} (Bauteile: {left_part} / {right_part}); Ziel={gap_min:.2f}')
        assert measured >= gap_min - 1e-4, f'Meshöffnung {measured:.4f} ist kleiner als G={gap_min:.2f}'
        # Test evaluated world bounds against the terrain-relative player box. Only named floors pass.
        blockers = []
        for name, b in corridor_parts(bounds, game):
            if b[1] <= -gap_min / 2 or b[0] >= gap_min / 2:
                continue
            blockers.append(name)
        if blockers:
            details = {name: [round(v, 3) for v in bounds[name]] for name in blockers}
            raise AssertionError('Mesh-Bounds schneiden den terrainrelativen Spielerkorridor: ' + json.dumps(details))
        print(f'GAP: jede ausgewertete Mesh-Boundingbox liegt aus x=[{-gap_min/2:.2f},{gap_min/2:.2f}], y=4..35 oder terrainrelativ unter 1,4 m heraus; nur benannte Böden ausgenommen.')
    # Keep evaluated bounds for the visibility note; the camera view can be checked without a render.
    return bounds


def visibility_check(game, landmark, camera):
    deps = bpy.context.evaluated_depsgraph_get()
    scene = bpy.context.scene
    scene.camera = camera
    origin = camera.location.copy()
    offsets = {}
    walkable = {'small ground patch', 'Oberbaum | short walkable arcade floor'}
    for n in (1, 80, 200):
        curve = game['spacingCurve'][str(n)]
        width = max(game['assetGap'], curve['gap'])
        limit = max(0, game['CORRIDOR'] / 2 - width / 2)
        side_shift = min(curve['shift'], limit)
        centers = sorted({-side_shift, 0.0, side_shift})
        rows = []
        for label, y in (('vorbeifahrt', game['PLAYER_Z'] + 1),
                         ('naechste-wand', 11.0 + curve['spacing'])):
            for center in centers:
                for x in (center - width / 2 + 0.12, center, center + width / 2 - 0.12):
                    for h in (0.2, 0.9, 1.4):
                        target = Vector((x, y, h - terrain_drop(y, game)))
                        direction = target - origin
                        distance = direction.length
                        direction.normalize()
                        start, remaining, hit_name = origin.copy(), distance, None
                        for _ in range(8):
                            hit, loc, normal, face, ob, matrix = scene.ray_cast(
                                deps, start, direction, distance=remaining)
                            if not hit:
                                break
                            if ob.name not in walkable:
                                hit_name = ob.name
                                break
                            travelled = (loc - start).length + 1e-3
                            start, remaining = loc + direction * 1e-3, remaining - travelled
                            if remaining <= 0:
                                break
                        rows.append({'where': label, 'target': [round(x, 3), round(y, 3), h], 'hit': hit_name})
        hits = [row for row in rows if row['hit']]
        key = f'n{n}'
        close_hits = [row for row in hits if row['where'] == 'vorbeifahrt']
        next_hits = [row for row in hits if row['where'] == 'naechste-wand']
        offsets[key] = {'spacing': curve['spacing'], 'gapWidth': width, 'sideShift': side_shift,
                        'samples': len(rows), 'approachOccluded': len(close_hits),
                        'nextWallOccluded': len(next_hits),
                        'hitObjects': sorted({r['hit'] for r in hits}),
                        'blockedTargets': hits}
        print(f"SICHT {landmark} {key}: Abstand={curve['spacing']:.3f}, gap={width:.3f}, Versatz=±{side_shift:.3f}; vor Passage {len(close_hits)}/27, nächste Wand {len(next_hits)}/27 blockiert durch {offsets[key]['hitObjects']}.")
    print('SICHT-Ziele: Kamera-nah PLAYER_Z+1 sowie die Folgewand hinter y=11; Raycasts auf Meshes, ohne Laufzeit- oder Fade-Behauptung.')
    return offsets


def fade_bottom_alpha(filepath):
    code = """from PIL import Image
import sys
p=sys.argv[1]; im=Image.open(p).convert('RGBA'); w,h=im.size
assert (w,h)==(192,384), f'expected 192x384, got {w}x{h}'
box=im.getchannel('A').getbbox(); assert box, 'empty tower alpha'
x0,y0,x1,y1=box; fade=max(1,round((y1-y0)*.18)); start=y1-fade; px=im.load()
for y in range(start,y1):
    f=(y1-1-y)/max(1,fade-1)
    for x in range(x0,x1):
        r,g,b,a=px[x,y]; px[x,y]=(r,g,b,round(a*f))
im.save(p,'PNG'); check=Image.open(p).convert('RGBA')
assert check.getchannel('A').crop((x0,y1-1,x1,y1)).getbbox() is None
print('ALPHA_FADE',box,'height',fade,'bottom row alpha 0')"""
    subprocess.run(['python3', '-c', code, filepath], check=True)


def scale_scene_about(anchor, scale):
    if scale <= 1.0 + 1e-9:
        return
    root = bpy.data.objects.new('uniform gap-fit root', None)
    bpy.context.scene.collection.objects.link(root)
    root.location = anchor
    bpy.context.view_layer.update()
    children = [ob for ob in bpy.context.scene.objects if ob.type == 'MESH']
    for ob in children:
        matrix = ob.matrix_world.copy()
        ob.parent = root
        ob.matrix_world = matrix
    root.scale = (scale, scale, scale)
    bpy.context.view_layer.update()


def build_one(landmark, game, render):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    edge = landmark == 'fernsehturm-am-rand'
    palette = load_file('sightseeing_materials', 'sightseeing-materials.py').palette(scenery=edge)
    models = load_file('sightseeing_models', 'sightseeing-models.py')
    scene_game = dict(game, scenery=edge, cameraX=4.0 if edge else game.get('cameraX', 0.0))
    builder = models.BUILDERS[landmark]
    if landmark == 'brandenburg-gate':
        load_file('sightseeing_gate_builder', 'sightseeing-gate.py').build(palette, game)
    else:
        builder(palette, game)
        for ob in bpy.context.scene.objects:
            if ob.type == 'MESH' and ob.name != 'Oberbaum | short walkable arcade floor':
                ob.location.z -= terrain_drop(ob.location.y, game)
    bounds_before_scale = evaluated_bounds()
    if landmark == 'brandenburg-gate':
        measured_gap, gate_parts = gate_opening(bounds_before_scale)
        left_name, right_name = gate_parts, 'central passage edge'
    else:
        measured_gap, left_name, right_name = minimum_opening(bounds_before_scale, game)
    scale = max(1.0, (game['assetGap'] + CLEARANCE_MARGIN) / measured_gap)
    anchor = Vector((0, 11.0, -terrain_drop(11.0, game)))
    scale_scene_about(anchor, scale)
    camera = scene_setup(scene_game)
    output_path = os.path.join(OUT_DIR, landmark + '.png')
    bpy.context.scene.render.filepath = output_path
    projection_error = None if edge else projection_checks(bpy.context.scene, camera, game)
    bounds = bounds_and_gaps(game['assetGap'], game, evaluated_bounds(), scenery=edge)
    if edge:
        fit_scenery_camera(camera, bounds)
    sight = {'sceneryCutout': True} if edge else visibility_check(game, landmark, camera)
    if render:
        bpy.context.scene.render.resolution_x, bpy.context.scene.render.resolution_y = (192, 384) if edge else (W, H)
        bpy.ops.render.render(write_still=True)
        if edge:
            fade_bottom_alpha(output_path)
        print(f'RENDER: {output_path}')
    if edge:
        measured_after = None
    elif landmark == 'brandenburg-gate':
        measured_after = gate_opening(bounds)[0]
    else:
        measured_after = minimum_opening(bounds, game)[0]
    return {
        'id': landmark, 'requestedGap': game['assetGap'], 'gameGapAt0': game['gap'],
        'measuredOpeningBeforeScale': measured_gap,
        'measuredOpeningWidth': measured_after,
        'measuredOpeningParts': [left_name, right_name],
        'uniformScale': scale, 'resolution': [192, 384] if edge else [W, H], 'output': output_path,
        'bottomAlphaFadeFraction': 0.18 if edge else 0.0,
        'renderRequested': render, 'pngFilePresent': os.path.exists(output_path),
        'projectionErrorPx': projection_error, 'visibility': sight,
        'geometryNote': ('Uniform homothety about front-foot anchor; rear terrain is not re-warped.'
                         if landmark == 'brandenburg-gate' and scale > 1 else None),
        'meshBounds': {name: [round(v, 4) for v in b] for name, b in bounds.items()},
    }


def main():
    global OUT_DIR
    parser = argparse.ArgumentParser()
    parser.add_argument('--landmark', choices=['all', *load_file('sightseeing_models', 'sightseeing-models.py').BUILDERS])
    parser.add_argument('--out', default=OUT_DIR)
    parser.add_argument('--check-only', action='store_true')
    parser.add_argument('--export-blend', action='store_true')
    parser.add_argument('--scenery', action='store_true')
    parser.add_argument('--gap', type=float, help='Mindestöffnung der fünf Spielmodelle (Standard: gapWidthAt0 aus config.js).')
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    args = parser.parse_args(argv)
    OUT_DIR = os.path.abspath(os.path.join(ROOT, args.out)) if not os.path.isabs(args.out) else args.out
    game = game_values()
    game['assetGap'] = args.gap if args.gap is not None else game['gap']
    if game['assetGap'] <= 0 or game['assetGap'] > game['CORRIDOR']:
        parser.error('--gap muss größer als 0 und höchstens CORRIDOR sein.')
    choice = args.landmark or ('fernsehturm-am-rand' if args.scenery else 'all')
    game['cameraX'] = 0.0
    os.makedirs(OUT_DIR, exist_ok=True)
    ids = list(load_file('sightseeing_models', 'sightseeing-models.py').BUILDERS) if choice == 'all' else [choice]
    manifest_tools = load_file('sightseeing_manifest', 'sightseeing-manifest.py')
    source_digest = manifest_tools.source_hash(HERE)
    results = []
    bpy.context.preferences.filepaths.save_version = 0
    for landmark in ids:
        result = build_one(landmark, game, not args.check_only)
        if args.export_blend:
            result['blendOutput'] = os.path.join(OUT_DIR, landmark + '.blend')
            result['blendSourceSha256'] = source_digest
            bpy.ops.wm.save_as_mainfile(filepath=result['blendOutput'])
            result['blendSha256'] = manifest_tools.sha256(result['blendOutput'])
        if result['renderRequested']:
            manifest_tools.record_render(OUT_DIR, result, source_digest)
        results.append(result)
    manifest_tools.write_run_manifests(OUT_DIR, game['assetGap'], source_digest, results)
    print('CHECK-ONLY: kein Render und keine PNG-Datei erzeugt.' if args.check_only else 'Render abgeschlossen.')


if __name__ == '__main__':
    main()
