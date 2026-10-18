"""Small, locally built Berlin landmark silhouettes in game axes (X, depth Y, height Z)."""
import bpy
import math
from mathutils import Vector


def box(name, loc, size, mat, bevel=0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    ob = bpy.context.object
    ob.name = name
    ob.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    ob.data.materials.append(mat)
    if bevel:
        mod = ob.modifiers.new('soft painted edge', 'BEVEL')
        mod.width, mod.segments = bevel, 2
        ob.modifiers.new('weighted normals', 'WEIGHTED_NORMAL')
    return ob


def cyl(name, loc, radius, depth, mat, vertices=12):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=loc)
    ob = bpy.context.object
    ob.name = name
    ob.data.materials.append(mat)
    return ob


def beam(name, a, b, radius, mat):
    direction = Vector(b) - Vector(a)
    ob = cyl(name, (Vector(a) + Vector(b)) / 2, radius, direction.length, mat, 8)
    ob.rotation_mode = 'QUATERNION'
    ob.rotation_quaternion = direction.to_track_quat('Z', 'Y')
    return ob


def arch_ring(name, y, inner_r, outer_r, spring, mat, thickness=0.42, steps=18):
    """Extruded semicircular stone ring; its lowest point stays above the player clearance."""
    verts, faces = [], []
    for i in range(steps + 1):
        a = math.pi * i / steps
        x0, z0 = inner_r * math.cos(a), spring + inner_r * math.sin(a)
        x1, z1 = outer_r * math.cos(a), spring + outer_r * math.sin(a)
        verts.extend(((x0, -thickness / 2, z0), (x1, -thickness / 2, z1),
                      (x1, thickness / 2, z1), (x0, thickness / 2, z0)))
    for i in range(steps):
        a = i * 4
        b = a + 4
        faces.extend(((a, a + 1, b + 1, b), (a + 2, a + 3, b + 3, b + 2),
                      (a + 1, a + 2, b + 2, b + 1), (a, b, b + 3, a + 3)))
    mesh = bpy.data.meshes.new(name + ' mesh')
    mesh.from_pydata(verts, [], faces)
    ob = bpy.data.objects.new(name, mesh)
    ob.location.y = y
    bpy.context.scene.collection.objects.link(ob)
    mesh.materials.append(mat)
    return ob


def triangular_pediment(name, y, width, z0, ztop, depth, mat):
    verts = [(-width / 2, -depth / 2, z0), (width / 2, -depth / 2, z0),
             (0, -depth / 2, ztop), (-width / 2, depth / 2, z0),
             (width / 2, depth / 2, z0), (0, depth / 2, ztop)]
    faces = [(0, 1, 2), (5, 4, 3), (0, 3, 4, 1), (1, 4, 5, 2), (2, 5, 3, 0)]
    mesh = bpy.data.meshes.new(name + ' mesh')
    mesh.from_pydata(verts, [], faces)
    ob = bpy.data.objects.new(name, mesh)
    ob.location.y = y
    bpy.context.scene.collection.objects.link(ob)
    mesh.materials.append(mat)
    return ob


def oberbaum(p, game):
    # Short longitudinal brick arcade: two high transverse arches and paired side towers.
    for side in (-1, 1):
        x = side * 2.55
        for y in (10.25, 11.65, 13.05):
            box('Oberbaum | arcade pier', (x, y, 1.72), (0.56, 0.58, 3.44), p['brick'], 0.06)
        box('Oberbaum | parapet', (x, 11.65, 1.05), (0.62, 3.55, 0.32), p['brick_light'], 0.04)
        # Small double-tower silhouette is outside the clear centerline.
        for y in (10.15, 13.15):
            tx = side * 4.05
            box('Oberbaum | tower shaft', (tx, y, 3.35), (0.9, 0.9, 6.7), p['brick_light'], 0.08)
            box('Oberbaum | tower crown', (tx, y, 6.9), (1.12, 1.08, 0.42), p['sand'], 0.05)
            bpy.ops.mesh.primitive_cone_add(vertices=8, radius1=0.55, radius2=0.08, depth=1.2,
                                            location=(tx, y, 7.7))
            bpy.context.object.name = 'Oberbaum | tower roof'
            bpy.context.object.data.materials.append(p['brick'])
    for y in (10.2, 13.1):
        # The arch feet overlap the pier crowns slightly instead of hovering above them.
        arch_ring('Oberbaum | cross arcade arch', y, 1.95, 2.62, 3.35, p['brick_light'], 0.62)
    drop = lambda y: game['HILL_DROP'] * math.log(
        (game['HILL_RUN'] + max(0, y)) / (game['HILL_RUN'] + game['PLAYER_Z']))
    verts = [(-2.175, 9.8, -drop(9.8) + 0.04), (2.175, 9.8, -drop(9.8) + 0.04),
             (-2.175, 13.5, -drop(13.5) + 0.04), (2.175, 13.5, -drop(13.5) + 0.04)]
    mesh = bpy.data.meshes.new('Oberbaum | sloped walkway mesh')
    mesh.from_pydata(verts, [], [(0, 1, 3, 2)])
    floor = bpy.data.objects.new('Oberbaum | short walkable arcade floor', mesh)
    bpy.context.scene.collection.objects.link(floor)
    mesh.materials.append(p['earth'])


def eastside(p, game=None):
    # Two short painted wall fragments with broad, recognizable abstract mural forms.
    for y in (10.7, 12.7):
        for side in (-1, 1):
            cx = side * 3.15
            box('East Side Gallery | mural wall', (cx, y, 1.55), (2.45, 0.34, 3.1), p['brick'], 0.04)
            # Muted, large forms read as a mural rather than masonry courses.
            bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=8, location=(cx - 0.38, y - 0.19, 1.92))
            bpy.context.object.name = 'mural | ochre sun'
            bpy.context.object.scale = (0.48, 0.04, 0.62)
            bpy.context.object.data.materials.append(p['mural_ochre'])
            for dx in (-0.2, 0.14, 0.46):
                box('mural | sage wave', (cx + dx, y - 0.205, 1.05 + dx * 0.28),
                    (0.15, 0.035, 1.0), p['mural_sage'], 0.045)
            beam('mural | dusty-red sweep', (cx - 0.8, y - 0.23, 2.45),
                 (cx + 0.75, y - 0.23, 2.85), 0.12, p['mural_rose'])
            box('mural | pale teal shape', (cx + 0.45, y - 0.22, 1.8), (0.42, 0.04, 0.3), p['mural_teal'], 0.12)


def reichstag(p, game=None):
    # Portico and pediment, with the glass dome and ribs pushed to the outer shoulder.
    width, y = 12.0, 11.0
    gap, height = 3.9, 4.2
    side = (width - gap) / 2
    box('Reichstag | left portico pier', (-gap / 2 - side / 2, y, height / 2), (side, 0.75, height), p['sand'], 0.06)
    box('Reichstag | right portico pier', (gap / 2 + side / 2, y, height / 2), (side, 0.75, height), p['sand'], 0.06)
    for x in (-5.1, -3.6, 3.6, 5.1):
        cyl('Reichstag | column', (x, 10.55, 1.8), 0.25, 3.6, p['light'])
        box('Reichstag | capital', (x, 10.55, 3.68), (0.62, 0.78, 0.24), p['light'], 0.04)
    box('Reichstag | entablature', (0, y, 4.12), (12.2, 0.92, 0.35), p['light'], 0.05)
    triangular_pediment('Reichstag | triangular pediment', y, 11.8, 4.3, 5.55, 0.7, p['sand'])
    x = 5.8
    cyl('Reichstag | dome drum', (x, 11.0, 5.05), 0.88, 0.9, p['sand'], 16)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=20, ring_count=12, location=(x, 11.0, 5.85))
    dome = bpy.context.object
    dome.name = 'Reichstag | pale glass dome'
    dome.scale = (0.9, 0.78, 0.82)
    dome.data.materials.append(p['silver'])
    for i in range(10):
        a = 2 * math.pi * i / 10
        beam('Reichstag | dome rib', (x, 11, 5.12),
             (x + 0.9 * math.cos(a), 11 + 0.78 * math.sin(a), 6.62), 0.028, p['light'])


def rathaus(p, game=None):
    # Brick gate with a high semicircular arch and a clock tower to the right.
    width, y, gap = 12.0, 11.0, 3.9
    for side in (-1, 1):
        x = side * (gap / 2 + (width - gap) / 4)
        box('Rotes Rathaus | gate pier', (x, y, 2.05), ((width - gap) / 2, 0.72, 4.1), p['brick'], 0.06)
        box('Rotes Rathaus | pilaster', (side * 4.45, 10.58, 2.15), (0.2, 0.16, 3.9), p['brick_light'], 0.025)
    arch_ring('Rotes Rathaus | brick gate arch', y, gap / 2, gap / 2 + 0.82, 4.1, p['brick_light'], 0.8)
    box('Rotes Rathaus | upper wall', (0, y, 4.25), (12, 0.75, 0.38), p['brick'], 0.05)
    # Clock tower rises on the outer wing; the passage itself remains straight and open.
    tx = 4.65
    box('Rotes Rathaus | clock tower lower shaft', (tx, 11, 6.15), (1.55, 1.45, 3.8), p['brick'], 0.08)
    box('Rotes Rathaus | clock tier', (tx, 11, 8.45), (1.85, 1.7, 0.9), p['brick_light'], 0.07)
    bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=0.53, depth=0.08,
                                        location=(tx, 10.1, 8.48), rotation=(math.pi / 2, 0, 0))
    bpy.context.object.name = 'Rotes Rathaus | pale clock face'
    bpy.context.object.data.materials.append(p['light'])
    beam('clock | hour hand', (tx, 10.03, 8.48), (tx + 0.12, 10.03, 8.72), 0.035, p['shadow'])
    beam('clock | minute hand', (tx, 10.02, 8.48), (tx - 0.24, 10.02, 8.48), 0.025, p['shadow'])
    box('Rotes Rathaus | tower cornice', (tx, 11, 9.0), (2.05, 1.85, 0.28), p['light'], 0.05)
    bpy.ops.mesh.primitive_cone_add(vertices=8, radius1=1.0, radius2=0.08, depth=1.7, location=(tx, 11, 9.95))
    bpy.context.object.name = 'Rotes Rathaus | clock-tower roof'
    bpy.context.object.data.materials.append(p['brick'])


def tv_tower_edge(p, game=None):
    y = 11.0
    bpy.ops.mesh.primitive_cone_add(vertices=16, radius1=0.31, radius2=0.17, depth=23.0,
                                    location=(0, y, 11.5))
    bpy.context.object.name = 'Fernsehturm-Rand | long slender shaft'
    bpy.context.object.data.materials.append(p['silver'])
    bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=0.36, depth=0.35, location=(0, y, 0.18))
    bpy.context.object.name = 'Fernsehturm-Rand | small shaft foot'
    bpy.context.object.data.materials.append(p['light'])
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=16, location=(0, y, 24.0))
    sphere = bpy.context.object
    sphere.name = 'Fernsehturm-Rand | spherical crown'
    sphere.scale = (1.42, 1.22, 1.42)
    sphere.data.materials.append(p['silver'])
    for face in sphere.data.polygons:
        face.use_smooth = True
    beam('Fernsehturm-Rand | antenna', (0, y, 25.25), (0, y, 30.5), 0.055, p['silver'])
    for z in (26.0, 27.1, 28.2, 29.3):
        beam('Fernsehturm-Rand | antenna collar', (-0.18, y, z), (0.18, y, z), 0.035, p['light'])


BUILDERS = {
    'brandenburg-gate': None,
    'reichstag': reichstag,
    'red-town-hall': rathaus,
    'oberbaum-bridge': oberbaum,
    'east-side-gallery': eastside,
    'fernsehturm-am-rand': tv_tower_edge,
}
