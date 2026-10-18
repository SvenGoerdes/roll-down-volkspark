# Prepares the TRELLIS Alaska reconstruction for rigging (ticket #20): welds and voxel-remeshes the torn fur,
# smooths it, decimates it and bakes the coat colour into vertex colours (the 95k-polygon mesh had holes at ears and tail).
# blender -b <alaska-trellis-with-glasses.blend> -P tools/blender/prep-alaska.py -- <out.glb> [voxel=0.009] [faces=40000]
import bpy, bmesh, math, sys
import numpy as np
from mathutils import Matrix, Vector
from mathutils.bvhtree import BVHTree
from mathutils.interpolate import poly_3d_calc

argv = sys.argv[sys.argv.index('--') + 1:]
OUT = argv[0]
VOXEL = float(argv[1]) if len(argv) > 1 else 0.009
FACES = int(argv[2]) if len(argv) > 2 else 40000
SMOOTH_PASSES = 8
SCALE = 0.85   # the reconstruction is 1.5 tall; the game cat is smaller than Kalle and Tine but reads at phone size
COAT_TINT = (.39, .49, .66)   # same tint as the source scene: only desaturated pixels become blue-grey

scene = bpy.context.scene
src = bpy.data.objects['geometry_0']
for o in bpy.data.objects:
    if o.type == 'MESH' and o is not src and o.name != 'Review studio floor':
        o.data.transform(o.matrix_world)   # bake the glasses' transforms into their vertices
        o.parent = None
        o.matrix_world = Matrix.Identity(4)
src.data.transform(src.matrix_world)
src.parent = None
src.matrix_world = Matrix.Identity(4)

# ---------- colour source: the model's own texture, tinted like the approved renders ----------
mat = src.data.materials[0]
img = next(n.image for n in mat.node_tree.nodes if n.type == 'TEX_IMAGE' and n.image.name == 'Image_0')
w, h = img.size
px = np.empty(w * h * 4, dtype=np.float32)
img.pixels.foreach_get(px)
px = px.reshape(h, w, 4)[:, :, :3]
uv = src.data.uv_layers.active.data

me = src.data
me.calc_loop_triangles()
tri_loops = [tuple(t.loops) for t in me.loop_triangles]
tri_verts = [[me.vertices[v].co.copy() for v in t.vertices] for t in me.loop_triangles]
tri_uvs = [[tuple(uv[l].uv) for l in loops] for loops in tri_loops]
bvh = BVHTree.FromPolygons([tuple(m.co) for m in me.vertices],
                           [tuple(t.vertices) for t in me.loop_triangles])

def coat_colour(co):
    loc, _, idx, _ = bvh.find_nearest(co)
    a, b, c = tri_verts[idx]
    wts = poly_3d_calc([a, b, c], loc)
    u = sum(wt * p[0] for wt, p in zip(wts, tri_uvs[idx]))
    v = sum(wt * p[1] for wt, p in zip(wts, tri_uvs[idx]))
    rgb = px[min(h - 1, max(0, int(v * h))), min(w - 1, max(0, int(u * w)))] ** 2.2   # sRGB texture -> linear
    sat = (rgb.max() - rgb.min()) / max(rgb.max(), 1e-4)
    t = min(1, max(0, (0.36 - sat) / (0.36 - 0.12)))   # 1 = fully desaturated
    return tuple(rgb * (1 + t * (np.array(COAT_TINT) - 1)))

# ---------- clean surface: weld, fill, smooth, decimate ----------
bm = bmesh.new()
bm.from_mesh(src.data)
bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
bm.to_mesh(src.data)
bm.free()
body = src.copy()
body.data = src.data.copy()
scene.collection.objects.link(body)
body.name = 'figure'
bpy.context.view_layer.objects.active = body
for o in scene.objects:
    o.select_set(o is body)
body.data.materials.clear()
body.data.remesh_voxel_size = VOXEL
bpy.ops.object.voxel_remesh()
smooth = body.modifiers.new('smooth', 'SMOOTH')
smooth.factor = 0.6
smooth.iterations = SMOOTH_PASSES
bpy.ops.object.modifier_apply(modifier=smooth.name)
faces = len(body.data.polygons)
if faces > FACES:
    mod = body.modifiers.new('decimate', 'DECIMATE')
    mod.ratio = FACES / faces
    bpy.ops.object.modifier_apply(modifier=mod.name)
print(f'faces {faces} -> {len(body.data.polygons)}')
for p in body.data.polygons:
    p.use_smooth = True

attr = body.data.color_attributes.new('Color', 'FLOAT_COLOR', 'POINT')
for v in body.data.vertices:
    attr.data[v.index].color = (*coat_colour(v.co), 1)

# ---------- one glasses object ----------
parts = [o for o in scene.objects if o.type == 'MESH' and o.name not in ('figure', 'geometry_0', 'Review studio floor')]
for o in scene.objects:
    o.select_set(o in parts)
for o in parts:   # one UV layer name, so the lens keeps its rainbow texture after the join
    layers = o.data.uv_layers
    if layers:
        layers[0].name = 'UVMap'
    else:
        layers.new(name='UVMap')
bpy.context.view_layer.objects.active = parts[0]
bpy.ops.object.join()
glasses = bpy.context.view_layer.objects.active
glasses.name = 'glasses'
glasses.parent = None
glasses.matrix_world = Matrix.Identity(4)

# the model faces −Y; our rig and cameras expect +Y
for o in (body, glasses):
    o.data.transform(Matrix.Rotation(math.pi, 4, 'Z') @ Matrix.Scale(SCALE, 4))
# ---------- ears: the reconstruction left torn pits; smooth them and paint the inside pink ----------
EAR_TIPS = ((-0.21, 0.55, 1.25), (0.295, 0.616, 1.25))   # measured on the cleaned mesh, final frame
EAR_PINK = (0.30, 0.13, 0.14)
EAR_RADIUS = 0.11
EAR_PINK_RADIUS = 0.07   # the pink stays inside the ear, not on the cheek
group = body.vertex_groups.new(name='soft')
colors = body.data.color_attributes['Color']
for tip in EAR_TIPS:
    centre = Vector(tip) + Vector((0, 0.045, -0.095))
    for v in body.data.vertices:
        d = (v.co - centre).length
        if d < EAR_RADIUS and v.normal.y > -0.1 and v.co.z > tip[2] - 0.17:
            group.add([v.index], 1 - d / EAR_RADIUS, 'REPLACE')
        if d < EAR_PINK_RADIUS and v.normal.y > -0.1 and v.co.z > tip[2] - 0.17:
            mix = min(1, (1 - d / EAR_PINK_RADIUS) * 1.8)
            old = colors.data[v.index].color
            colors.data[v.index].color = tuple(old[i] * (1 - mix) + EAR_PINK[i] * mix for i in range(3)) + (1,)
soft = body.modifiers.new('soft smooth', 'SMOOTH')
soft.vertex_group = 'soft'
soft.factor = 0.8
soft.iterations = 30
bpy.context.view_layer.objects.active = body
bpy.ops.object.modifier_apply(modifier=soft.name)
# blur the coat colour across the band too: the dark seam of the fringe reads as a crease
colors = body.data.color_attributes['Color']
bm = bmesh.new()
bm.from_mesh(body.data)
bm.verts.ensure_lookup_table()
col = [list(colors.data[i].color) for i in range(len(bm.verts))]
band = [v.index for v in bm.verts if 0.22 < v.co.y < 0.68 and 0.26 < v.co.z < 0.66]
# the fur fringe leaves a ragged hem under the shoulders and chest: relax that band hard (weight fades at its edges)
edge = {i: max(0.05, min(1, min(bm.verts[i].co.z - 0.26, 0.66 - bm.verts[i].co.z,
                                 bm.verts[i].co.y - 0.22, 0.68 - bm.verts[i].co.y) / 0.08)) for i in band}
for _ in range(80):
    moved = {i: bm.verts[i].co.lerp(sum((e.other_vert(bm.verts[i]).co for e in bm.verts[i].link_edges), Vector()) /
                                    len(bm.verts[i].link_edges), 0.7 * edge[i]) for i in band}
    for i, co in moved.items():
        bm.verts[i].co = co
bm.to_mesh(body.data)
colors = body.data.color_attributes['Color']
for _ in range(40):
    nxt = {}
    for i in band:
        around = [col[e.other_vert(bm.verts[i]).index] for e in bm.verts[i].link_edges] + [col[i]]
        nxt[i] = [sum(c[k] for c in around) / len(around) for k in range(4)]
    for i, c in nxt.items():
        col[i] = c
for i in band:
    colors.data[i].color = col[i]
bm.free()

if 'custom_normal' in body.data.attributes:   # stale normals from before the smoothing would show as speckles
    bpy.context.view_layer.objects.active = body
    bpy.ops.mesh.customdata_custom_splitnormals_clear()
for p in body.data.polygons:
    p.use_smooth = True

keep = {body, glasses}
for o in list(scene.objects):
    if o not in keep:
        bpy.data.objects.remove(o)
for o in keep:
    o.select_set(True)
bpy.ops.outliner.orphans_purge(do_recursive=True)
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', use_selection=True, export_apply=True)
