# Prepares a high-poly figure GLB for the sprite renders (ADR 0018): joins it, turns it to face +Y, decimates it, writes a small GLB.
# /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/blender/prep-glb.py -- <in.glb> <out.glb> [target_faces=120000]
import bpy, math, sys
from mathutils import Matrix

argv = sys.argv[sys.argv.index('--') + 1:]
src, out = argv[0], argv[1]
target = int(argv[2]) if len(argv) > 2 else 120000

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
bpy.context.view_layer.objects.active = meshes[0]
for o in meshes:
    o.select_set(True)
if len(meshes) > 1:
    bpy.ops.object.join()
ob = bpy.context.view_layer.objects.active
ob.name = 'figure'
bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
# the models face −Y (their glasses sit at y < 0); our rig and cameras expect +Y
ob.data.transform(Matrix.Rotation(math.pi, 4, 'Z'))
faces = len(ob.data.polygons)
if faces > target:
    mod = ob.modifiers.new('decimate', 'DECIMATE')
    mod.ratio = target / faces
    bpy.ops.object.modifier_apply(modifier=mod.name)
print(f'faces {faces} -> {len(ob.data.polygons)}')
for o in list(bpy.context.scene.objects):
    if o is not ob:
        bpy.data.objects.remove(o)
bpy.ops.outliner.orphans_purge(do_recursive=True)
bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', use_selection=False, export_apply=True)
