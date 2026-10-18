"""Approved Brandenburger Tor blockout geometry, without render or camera setup."""
import bpy


def box(name, loc, size, mat, bevel=0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    ob = bpy.context.object
    ob.name = name
    ob.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    ob.data.materials.append(mat)
    if bevel:
        mod = ob.modifiers.new('soft cut stone edges', 'BEVEL')
        mod.width, mod.segments = bevel, 2
        ob.modifiers.new('weighted stone normals', 'WEIGHTED_NORMAL')
    return ob


def ellipsoid(name, loc, scale, mat):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=8, location=loc)
    ob = bpy.context.object
    ob.name = name
    ob.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    ob.data.materials.append(mat)
    for face in ob.data.polygons:
        face.use_smooth = True
    return ob


def beam(name, a, b, radius, mat):
    from mathutils import Vector
    direction = Vector(b) - Vector(a)
    bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=radius, depth=direction.length,
                                        location=(Vector(a) + Vector(b)) / 2)
    ob = bpy.context.object
    ob.name = name
    ob.rotation_mode = 'QUATERNION'
    ob.rotation_quaternion = direction.to_track_quat('Z', 'Y')
    ob.data.materials.append(mat)
    return ob


def build(p, game):
    width, height, front, depth = 14.5, 5.2, 11.0, 2.4
    xs = [-6.0, -4.05, -2.09, 2.09, 4.05, 6.0]
    drop = lambda y: game['HILL_DROP'] * __import__('math').log((game['HILL_RUN'] + max(0, y)) / (game['HILL_RUN'] + game['PLAYER_Z']))
    # Approved shallow ground sheet and the two matching downhill foundations.
    verts = [(-width / 2 - 0.5, -0.6, -drop(front - 0.6) - 0.025),
             (width / 2 + 0.5, -0.6, -drop(front - 0.6) - 0.025),
             (-width / 2 - 0.5, depth + 0.6, -drop(front + depth + 0.6) - 0.025),
             (width / 2 + 0.5, depth + 0.6, -drop(front + depth + 0.6) - 0.025)]
    mesh = bpy.data.meshes.new('small terrain patch')
    mesh.from_pydata(verts, [], [(0, 1, 3, 2)])
    ground = bpy.data.objects.new('small ground patch', mesh)
    ground.location.y = front
    bpy.context.scene.collection.objects.link(ground)
    ground.data.materials.append(p['earth'])
    # Original two rows of six fluted columns and matching bases/capitals.
    for row, y in (('front', front), ('back', front + depth)):
        base = -drop(y)
        for i, x in enumerate(xs):
            bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=0.36, depth=height - 0.7,
                                                location=(x, y, base + (height - 0.7) / 2))
            col = bpy.context.object
            col.name = f'{row} fluted sandstone column {i + 1}'
            col.data.materials.append(p['sand'])
            for face in col.data.polygons:
                face.use_smooth = True
            box(f'{row} column foot {i + 1}', (x, y, base + 0.18), (0.92, 0.92, 0.36), p['light'], 0.06)
            box(f'{row} column capital {i + 1}', (x, y, base + height - 0.48), (0.98, 0.98, 0.44), p['light'], 0.06)
        box('architrave', (0, y, base + height - 0.17), (width + 0.7, 1.14, 0.78), p['sand'], 0.08)
        box('upper frieze band', (0, y, base + height + 0.25), (width + 0.92, 1.28, 0.19), p['shadow'], 0.035)
        box('cornice cap', (0, y, base + height + 0.48), (width + 1.15, 1.48, 0.28), p['light'], 0.06)
    # The four outer openings retain their approved low crossbar barriers; center is open.
    for i in (0, 1, 3, 4):
        gap = (xs[i] + xs[i + 1]) / 2
        barrier_width = xs[i + 1] - xs[i] - 0.98 + 0.18
        for y, base in ((front - 0.08, -drop(front)),
                        (front + depth + 0.08, -drop(front + depth))):
            box('closed wooden passage barrier', (gap, y, base + 0.62), (barrier_width, 0.16, 1.02), p['bronze'], 0.055)
            for off in (-barrier_width * 0.32, 0, barrier_width * 0.32):
                box('barrier upright', (gap + off, y - 0.1, base + 0.62), (0.1, 0.07, 0.86), p['shadow'], 0.025)
    # Reduced quadriga silhouette keeps the approved placement and overall composition.
    y, z = front + depth / 2, -drop(front) + height + 0.82
    for i, x in enumerate((-0.92, -0.34, 0.34, 0.92)):
        ellipsoid(f'quadriga horse {i + 1} body', (x, y, z + 0.38), (0.43, 0.20, 0.23), p['bronze'])
        ellipsoid(f'quadriga horse {i + 1} neck', (x + 0.22, y, z + 0.64), (0.14, 0.14, 0.33), p['bronze'])
        ellipsoid(f'quadriga horse {i + 1} head', (x + 0.32, y, z + 0.86), (0.20, 0.13, 0.14), p['bronze'])
        for leg_x in (x - 0.22, x + 0.16):
            beam('horse leg', (leg_x, y, z + 0.30), (leg_x + 0.05, y, z - 0.02), 0.055, p['bronze'])
        beam('horse shaft', (x + 0.28, y, z + 0.32), (x + 0.45, y, z + 0.12), 0.035, p['bronze'])
    box('small chariot body', (0, y - 0.38, z + 0.2), (0.96, 0.42, 0.36), p['bronze'], 0.08)
    for x in (-0.43, 0.43):
        bpy.ops.mesh.primitive_torus_add(major_radius=0.22, minor_radius=0.045, major_segments=12,
                                        minor_segments=6, location=(x, y - 0.62, z + 0.18),
                                        rotation=(1.5707963, 0, 0))
        bpy.context.object.name = 'chariot wheel'
        bpy.context.object.data.materials.append(p['bronze'])
    ellipsoid('quadriga driver torso', (0, y - 0.35, z + 0.62), (0.17, 0.15, 0.35), p['bronze'])
    ellipsoid('quadriga driver head', (0, y - 0.35, z + 1.02), (0.18, 0.15, 0.18), p['bronze'])
    for side in (-1, 1):
        beam('chariot rein', (side * 0.1, y - 0.4, z + 0.56), (side * 1.1, y, z + 0.85), 0.018, p['bronze'])
    # Measured central gap across every column row component is 3.2 before uniform scaling.
