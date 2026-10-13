# Render a GLB from front, right, back and the game camera: Blender -b -P tools/blender/view-glb.py -- model.glb out_prefix
import bpy, sys, math
from mathutils import Vector
glb, out = sys.argv[sys.argv.index('--') + 1:][:2]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=glb)
sc = bpy.context.scene
meshes = [o for o in sc.objects if o.type == 'MESH']
pts = [o.matrix_world @ Vector(c) for o in meshes for c in o.bound_box]
lo = Vector([min(p[i] for p in pts) for i in range(3)]); hi = Vector([max(p[i] for p in pts) for i in range(3)])
ctr = (lo + hi) / 2; size = max(hi - lo)
print('BBOX', [round(v, 2) for v in lo], [round(v, 2) for v in hi], 'faces', sum(len(o.data.polygons) for o in meshes))
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(cam); sc.camera = cam
cam.data.type = 'ORTHO'; cam.data.ortho_scale = size * 1.1
aim = bpy.data.objects.new('aim', None); sc.collection.objects.link(aim); aim.location = ctr
t = cam.constraints.new('TRACK_TO'); t.target = aim; t.track_axis = 'TRACK_NEGATIVE_Z'; t.up_axis = 'UP_Y'
sc.world = bpy.data.worlds.new('w'); sc.world.use_nodes = True
sc.world.node_tree.nodes['Background'].inputs[0].default_value = (1, 1, 1, 1)
sc.world.node_tree.nodes['Background'].inputs[1].default_value = 2.5
sun = bpy.data.objects.new('sun', bpy.data.lights.new('sun', 'SUN')); sc.collection.objects.link(sun)
sun.rotation_euler = (math.radians(45), 0, math.radians(30)); sun.data.energy = 2.5
sc.render.engine = 'BLENDER_EEVEE'; sc.render.film_transparent = True
sc.render.resolution_x = sc.render.resolution_y = 512; sc.view_settings.view_transform = 'Standard'
# glTF is Y-up, Blender imports it Z-up; front faces -Y
for name, d in (('front', (0, -1, 0)), ('right', (1, 0, 0)), ('back', (0, 1, 0)), ('game', (0, 0.83, 0.55))):
    cam.location = ctr + Vector(d).normalized() * size * 3
    sc.render.filepath = f'{out}-{name}.png'
    bpy.ops.render.render(write_still=True)
