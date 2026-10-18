"""Script-built British Shorthair Alaska. Faces +Y; ground plane is z=0."""
import bpy, math
from mathutils import Matrix, Vector
from toon import blob, part, path_tube

APOSE = {}
STAND = {}
from intro import BALL_ALASKA

BALL = dict(BALL_ALASKA)
HEAD = Vector((0, 0.34, 0.88))


def _pbr(name, color, roughness=0.82, metallic=0, noise_scale=115, bump_strength=0.12):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    nodes.clear()
    out = nodes.new('ShaderNodeOutputMaterial')
    shader = nodes.new('ShaderNodeBsdfPrincipled')
    shader.inputs['Base Color'].default_value = (*color, 1)
    shader.inputs['Roughness'].default_value = roughness
    shader.inputs['Metallic'].default_value = metallic
    links = mat.node_tree.links
    if noise_scale:
        coord = nodes.new('ShaderNodeTexCoord')
        noise = nodes.new('ShaderNodeTexNoise')
        noise.inputs['Scale'].default_value = noise_scale
        noise.inputs['Detail'].default_value = 2.0
        noise.inputs['Roughness'].default_value = 0.68
        bump = nodes.new('ShaderNodeBump')
        bump.inputs['Strength'].default_value = bump_strength
        bump.inputs['Distance'].default_value = 0.018
        links.new(coord.outputs['Generated'], noise.inputs['Vector'])
        links.new(noise.outputs['Fac'], bump.inputs['Height'])
        links.new(bump.outputs['Normal'], shader.inputs['Normal'])
    links.new(shader.outputs['BSDF'], out.inputs['Surface'])
    return mat


def _empty(name, loc, parent=None):
    ob = bpy.data.objects.new(name, None)
    bpy.context.scene.collection.objects.link(ob)
    if parent:
        ob.parent = parent
        ob.matrix_parent_inverse = Matrix.Identity(4)
    ob.location = loc
    return ob


def _part(name, geometry, mat, parent, sub=1):
    ob = part(name, [geometry], [mat], parent, sub=sub, ow=0)
    if parent:
        ob.matrix_parent_inverse = Matrix.Identity(4)
    return ob


def _ellipsoid(name, loc, scale, mat, parent, sub=1):
    return _part(name, blob(loc, *scale, n=32), mat, parent, sub)


def _tube(name, points, radius, mat, parent):
    return _part(name, path_tube(points, radius, 10), mat, parent, 0)


def _loft(name, rings, mat, parent, sides=16, sub=1):
    verts, faces = [], []
    for z, x, depth, y in rings:
        for i in range(sides):
            a = 2 * math.pi * i / sides
            verts.append((x + math.cos(a) * depth, y + math.sin(a) * depth * 0.6, z))
    for j in range(len(rings) - 1):
        for i in range(sides):
            a, b = j * sides + i, j * sides + (i + 1) % sides
            faces.append((a, b, b + sides, a + sides))
    faces += [tuple(reversed(range(sides))), tuple((len(rings) - 1) * sides + i for i in range(sides))]
    return _part(name, (verts, faces), mat, parent, sub)


def _curved_tail(parent, mat):
    points = [Vector(p) for p in ((0, 0, 0), (0, -.12, -.03), (.02, -.24, -.08),
              (.05, -.36, -.08), (.08, -.46, -.03), (.10, -.50, .02))]
    radii = (.105, .105, .098, .085, .06, .004)
    verts, faces = [], []
    n = 20
    for i, (point, radius) in enumerate(zip(points, radii)):
        tangent = (points[min(i + 1, len(points) - 1)] - points[max(0, i - 1)]).normalized()
        side = tangent.cross(Vector((1, 0, 0))).normalized()
        up = tangent.cross(side).normalized()
        for j in range(n):
            angle = j * 2 * math.pi / n
            verts.append(point + radius * (side * math.cos(angle) + up * math.sin(angle)))
        if i:
            faces += [((i - 1) * n + j, (i - 1) * n + (j + 1) % n,
                       i * n + (j + 1) % n, i * n + j) for j in range(n)]
    faces += [tuple(reversed(range(n))), tuple(range((len(points) - 1) * n, len(points) * n))]
    return _part('Curved plush tail', (verts, faces), mat, parent, 2)


def _head_ellipsoid(name, world_loc, scale, mat, parent, sub=1):
    loc = Vector(world_loc) - HEAD
    return _ellipsoid(name, loc, scale, mat, parent, sub)


def _head_tube(name, world_points, radius, mat, parent):
    return _tube(name, [Vector(p) - HEAD for p in world_points], radius, mat, parent)


def _rainbow_glass():
    mat = _pbr('Alaska | rainbow mirrored lenses', (0.4, 0.16, 0.55), 0.23, 0.32, 0, 0)
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    coord = nodes.new('ShaderNodeTexCoord')
    separate = nodes.new('ShaderNodeSeparateXYZ')
    add = nodes.new('ShaderNodeMath')
    add.operation = 'ADD'
    add.inputs[1].default_value = 0.5
    half = nodes.new('ShaderNodeMath')
    half.operation = 'MULTIPLY'
    half.inputs[1].default_value = 0.5
    ramp = nodes.new('ShaderNodeValToRGB')
    colors = ((0.0, (0.18, 0.12, 0.78, 1)), (0.28, (0.78, 0.12, 0.63, 1)),
              (0.52, (1.0, 0.48, 0.12, 1)), (0.76, (0.12, 0.68, 0.86, 1)),
              (1.0, (0.34, 0.2, 0.78, 1)))
    ramp.color_ramp.elements[0].position, ramp.color_ramp.elements[0].color = colors[0]
    ramp.color_ramp.elements[1].position, ramp.color_ramp.elements[1].color = colors[-1]
    for pos, color in colors[1:-1]:
        item = ramp.color_ramp.elements.new(pos)
        item.color = color
    links.new(coord.outputs['Generated'], separate.inputs[0])
    links.new(separate.outputs['X'], add.inputs[0])
    links.new(separate.outputs['Z'], add.inputs[1])
    links.new(add.outputs[0], half.inputs[0])
    links.new(half.outputs[0], ramp.inputs['Fac'])
    links.new(ramp.outputs['Color'], nodes.get('Principled BSDF').inputs['Base Color'])
    return mat


class CatRig:
    def __init__(self, root, spine, neck, legs, tail):
        self.root, self.spine, self.neck, self.after = root, spine, neck, []
        self.legs, self.tail = legs, tail

    def pose(self, p):
        rad = math.radians
        self.root.location = (0, p.get('fwd', 0), p.get('lift', 0))
        self.root.rotation_euler = (rad(p.get('pitch', 0)), rad(p.get('roll', 0)), rad(p.get('yaw', 0)))
        self.spine.rotation_euler = (rad(p.get('bend', 0)), rad(p.get('lean', 0)), 0)
        tuck = p.get('tuck', 0)
        self.spine.scale = (1, 1 - .24 * tuck, 1)
        self.neck.location = HEAD + Vector((0, -.07 * tuck, -.10 * tuck))
        self.neck.rotation_euler = (rad(p.get('nod', 0)), 0, rad(p.get('tilt', 0)))
        for key, (shoulder, elbow, front) in self.legs.items():
            side = key[-1]
            shoulder.rotation_euler = (rad(p.get(('f_' if front else 'b_') + side, 0)), 0, 0)
            elbow.rotation_euler = (rad(p.get(('fk_' if front else 'bk_') + side, 0)), 0, 0)
        self.tail.rotation_euler = (rad(p.get('tail', 0)), 0, 0)
        for callback in self.after:
            callback()


def build():
    fur = _pbr('Alaska | short blue-grey plush', (0.19, 0.23, 0.31), roughness=0.9, noise_scale=145, bump_strength=0.065)
    silver = _pbr('Alaska | silver muzzle', (0.31, 0.34, 0.39), roughness=0.9, noise_scale=140, bump_strength=0.05)
    slate = _pbr('Alaska | slate details', (0.12, 0.14, 0.19), noise_scale=0)
    ear_pink = _pbr('Alaska | ear pink', (0.35, 0.16, 0.18), noise_scale=0)
    nose_mat = _pbr('Alaska | nose', (0.22, 0.12, 0.1), 0.42, noise_scale=0)
    amber = _pbr('Alaska | amber eyes', (0.62, 0.29, 0.055), 0.24, noise_scale=0)
    pupil = _pbr('Alaska | pupils', (0.025, 0.02, 0.024), 0.2, noise_scale=0)
    paw_mat = fur
    frame = _pbr('Alaska | matte plum glasses', (0.075, 0.035, 0.065), 0.48, 0.08, 0)
    lens = _rainbow_glass()

    root = _empty('Alaska root', (0, 0, 0))
    spine = _empty('Alaska spine pivot', (0, 0, 0), root)
    # Rounded overlapping trunk and chest keep the compact cobby silhouette.
    body = _ellipsoid('Cobby body', (0, -0.08, 0.52), (0.34, 0.55, 0.36), fur, spine, 0)
    chest = _ellipsoid('Full chest', (0, 0.25, 0.59), (0.32, 0.32, 0.34), fur, spine, 0)
    for ob in (body, chest):
        bpy.context.view_layer.objects.active = ob
        mod = ob.modifiers.new('Smooth loft before sculpt', 'SUBSURF')
        mod.levels = 2
        bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.ops.object.select_all(action='DESELECT')
    body.select_set(True)
    chest.select_set(True)
    bpy.context.view_layer.objects.active = body
    bpy.ops.object.join()
    body.name = 'Seamless cobby torso'
    body.data.remesh_voxel_size = 0.015
    bpy.ops.object.voxel_remesh()
    soften = body.modifiers.new('Soft sculpt surface', 'SMOOTH')
    soften.factor = 0.65
    soften.iterations = 3
    for face in body.data.polygons:
        face.use_smooth = True
    _ellipsoid('Neck light fur', (0, 0.48, 0.58), (0.18, 0.055, 0.13), silver, spine, 2)
    neck = _empty('Alaska head pivot', HEAD, spine)
    _ellipsoid('Round head', (0, 0, 0), (0.39, 0.30, 0.31), fur, neck, 2)
    # Lofted ears keep a broad attached base and a rounded, visible triangular tip.
    for side, x in (('L', -0.255), ('R', 0.255)):
        ear_rings = [(0.18, x, 0.095, 0.015), (0.205, x, 0.11, 0.012),
                     (0.25, x, 0.09, 0.01), (0.32, x, 0.055, 0.006),
                     (0.385, x, 0.018, 0.002), (0.402, x, 0.003, 0)]
        _loft('Rounded triangular ear ' + side, ear_rings, fur, neck, sub=1)
        _ellipsoid('Inner ear ' + side, (x, 0.066, 0.265), (0.049, 0.012, 0.064), ear_pink, neck, 1)

    for side, x in (('L', -0.145), ('R', 0.145)):
        _head_ellipsoid('Cheek volume ' + side, (x * 0.88, 0.535, 0.78), (0.16, 0.12, 0.135), fur, neck, 2)
        _head_ellipsoid('Amber eye ' + side, (x, 0.613, 0.94), (0.073, 0.035, 0.088), amber, neck)
        _head_ellipsoid('Pupil ' + side, (x, 0.646, 0.94), (0.021, 0.013, 0.063), pupil, neck)
        _head_ellipsoid('Lens ' + side, (x, 0.674, 0.94), (0.124, 0.023, 0.128), lens, neck)
        ring = [(x + 0.126 * math.cos(i * 2 * math.pi / 32), 0.701,
                 0.94 + 0.13 * math.sin(i * 2 * math.pi / 32)) for i in range(33)]
        _head_tube('Round plum rim ' + side, ring, 0.012, frame, neck)
        sign = 1 if x > 0 else -1
        _head_tube('Glasses temple ' + side, [(x + sign * 0.12, 0.68, 0.94),
                     (x + sign * 0.23, 0.56, 0.94), (x + sign * 0.31, 0.25, 0.91)], 0.012, frame, neck)
    _head_tube('Glasses bridge', [(-0.035, 0.7, 0.95), (0, 0.716, 0.97), (0.035, 0.7, 0.95)], 0.012, frame, neck)
    _head_ellipsoid('Short broad muzzle', (0, 0.625, 0.735), (0.145, 0.085, 0.074), silver, neck, 2)
    _head_ellipsoid('Nose', (0, 0.702, 0.79), (0.045, 0.025, 0.03), nose_mat, neck)
    _head_tube('Mouth', [(0, 0.7, 0.765), (0, 0.703, 0.73), (-0.035, 0.696, 0.715)], 0.006, slate, neck)
    _head_tube('Mouth R', [(0, 0.703, 0.73), (0.035, 0.696, 0.715)], 0.006, slate, neck)
    for sign in (-1, 1):
        for i in range(3):
            _head_tube('Whisker', [(sign * 0.08, 0.68, 0.74 - i * 0.025),
                         (sign * 0.22, 0.63, 0.75 - i * 0.055),
                         (sign * 0.31, 0.57, 0.76 - i * 0.075)], 0.0025, silver, neck)

    legs = {}
    # Shoulder heights are chosen so the paw ellipsoids rest on z=0 in STAND.
    for front, y, top, hx in ((True, 0.29, 0.60, 0.23), (False, -0.42, 0.585, 0.22)):
        for side, x in (('l', -hx), ('r', hx)):
            shoulder = _empty(('Front ' if front else 'Hind ') + side + ' shoulder', (x, y, top), spine)
            _ellipsoid('Upper leg ' + side, (0, 0, -0.12), (0.14, 0.16, 0.25), fur, shoulder, 2)
            elbow = _empty(('Front ' if front else 'Hind ') + side + ' elbow', (0, 0.015, -0.31), shoulder)
            _ellipsoid('Lower leg ' + side, (0, 0.04, -0.09), (0.11, 0.125, 0.16), fur, elbow, 2)
            _ellipsoid('Plush paw ' + side, (0, 0.12, -0.20), (0.12, 0.17, 0.085), paw_mat, elbow, 2)
            for groove in (-1, 1):
                _tube('Subtle toe groove', [(groove * 0.035, 0.27, -0.20),
                      (groove * 0.035, 0.273, -0.235), (groove * 0.035, 0.26, -0.25)],
                      0.0025, slate, elbow)
            legs[('f_' if front else 'b_') + side] = (shoulder, elbow, front)

    tail = _empty('Tail base', (0, -0.52, 0.55), spine)
    _curved_tail(tail, fur)
    rig = CatRig(root, spine, neck, legs, tail)
    rig.pose(STAND)
    return rig, [], []
