"""Approved Storni hero model, preserved from quellen/storni/scripts/storni_large.py.

The bottle's long axis is local +X, with its body centre at the origin.
Text reads along +X and faces +Z. For the game's lying view, rotate X by
about +60 degrees so +Z faces camera (0, -6, 3.5). To stand it, rotate Y
by -pi/2; the label then faces -X and the text remains upright.
"""
import math

import bpy


def _srgb(hex_color):
    """Convert an sRGB hex color to the linear RGB Blender materials expect."""
    channels = [int(hex_color[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    return tuple(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in channels)


def _material(name, color, roughness=0.42, metallic=0.0, coat=0.0):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1)
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = (*color, 1)
    shader.inputs['Roughness'].default_value = roughness
    shader.inputs['Metallic'].default_value = metallic
    shader.inputs['Coat Weight'].default_value = coat
    return mat


def _lathe(name, profile, material, segments=48):
    verts, faces = [], []
    for x, radius in profile:
        for i in range(segments):
            a = 2 * math.pi * i / segments
            verts.append((x, radius * math.cos(a), radius * math.sin(a)))
    for ring in range(len(profile) - 1):
        for i in range(segments):
            a = ring * segments + i
            b = ring * segments + (i + 1) % segments
            faces.append((a, b, b + segments, a + segments))
    faces += [tuple(reversed(tuple(range(segments)))),
              tuple(range((len(profile) - 1) * segments, len(profile) * segments))]
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.materials.append(material)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    for face in mesh.polygons:
        face.use_smooth = True
    return obj


def _parent(obj, root):
    obj.parent = root
    obj.matrix_parent_inverse = root.matrix_world.inverted()
    return obj


def build(scale=4.0):
    """Return (root, maximum body radius); dimensions scale with `scale`."""
    s = scale
    glass = _material('Storni amber glass', _srgb('#9A410B'), 0.28, coat=0.32)
    label_mat = _material('Apricot label', _srgb('#FFA52F'), 0.68)
    plum = _material('Huge red wordmark ink', _srgb('#C51618'), 0.62)
    tangerine = _material('Tangerine stripe', _srgb('#F05212'), 0.58)
    cap_mat = _material('Red brown crown cap', _srgb('#A83225'), 0.38, metallic=0.22)

    # Rounded stout body, sloped shoulders, narrow neck and a small lip.
    profile = [(-.120, .002), (-.120, .024), (-.116, .034), (-.108, .038),
               (.025, .038), (.044, .035), (.059, .027), (.069, .018),
               (.075, .013), (.086, .012), (.090, .014), (.097, .014),
               (.100, .010), (.100, .003)]
    root = _lathe('Storni bottle', [(x * s, r * s) for x, r in profile], glass)
    root.rotation_mode = 'XYZ'
    root['upright_rotation'] = 'rotation_euler.y = -pi/2'

    # Broad curved sleeve follows the bottle's cylindrical body; it faces +Z.
    label_profile = [(-.112, .0365), (-.108, .0385), (.021, .0385), (.025, .0375)]
    label = _lathe('Apricot label', [(x * s, r * s) for x, r in label_profile], label_mat)
    _parent(label, root)

    stripe = _lathe('Label lower orange band',
                    [(-.106 * s, .0389 * s), (-.086 * s, .0389 * s)], tangerine)
    _parent(stripe, root)

    # Plum fine border lines at the edges of the label.
    border = _material('Label plum border', (0.31, 0.045, 0.13), 0.55)
    for x in (-.110, .022):
        line = _lathe('Label border', [(x * s, .0391 * s), ((x + .0015) * s, .0391 * s)], border)
        _parent(line, root)

    # Exact approved lettering; the game-facing transform is set by the exporter.
    font = bpy.data.fonts.load('/System/Library/Fonts/Supplemental/Georgia Bold Italic.ttf')
    for name, body, target_width, target_height, x, y in (
        ('STORNI huge red serif', 'STORNI', .121, .040, -.043, -.003),
        ('PILSENER red serif', 'PILSENER', .090, .009, -.043, .025),
    ):
        curve = bpy.data.curves.new(name, 'FONT')
        curve.body, curve.font = body, font
        curve.align_x = 'CENTER'
        curve.align_y = 'CENTER'
        curve.size = .05 * s
        curve.extrude = .00012 * s
        text = bpy.data.objects.new(name, curve)
        bpy.context.scene.collection.objects.link(text)
        text.location = (x * s, y * s, .0398 * s)
        text.rotation_euler.z = math.pi
        curve.materials.append(plum)
        bpy.context.view_layer.update()
        text.scale.x = target_width * s / text.dimensions.x
        text.scale.y = target_height * s / text.dimensions.y
        _parent(text, root)

    # Crown cap: flanged rim and a fluted, slightly domed top along the neck axis.
    cap_profile = [(.098, .012), (.100, .016), (.106, .016), (.108, .014), (.110, .010), (.110, .002)]
    cap = _lathe('Crown cap', [(x * s, r * s) for x, r in cap_profile], cap_mat, 32)
    _parent(cap, root)
    for i in range(16):
        a = 2 * math.pi * i / 16
        rib = bpy.data.objects.new('Crown crimp', bpy.data.curves.new('Crown crimp', 'CURVE'))
        rib.data.dimensions = '3D'
        rib.data.bevel_depth = .0012 * s
        rib.data.bevel_resolution = 2
        spline = rib.data.splines.new('POLY')
        spline.points.add(1)
        for point, x in zip(spline.points, (.100, .107)):
            point.co = (x * s, .015 * s * math.cos(a), .015 * s * math.sin(a), 1)
        bpy.context.scene.collection.objects.link(rib)
        rib.data.materials.append(cap_mat)
        _parent(rib, root)

    return root, .040 * s
