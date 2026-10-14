# Building kit for script-modelled figures (ADR 0018): toon materials, lofted parts, pivot-empty rig, poses.
# Imported by render.py after the scene is reset; figure modules (kalle.py, tine.py) build on it.
import bpy, bmesh, math
from mathutils import Vector, Euler

# ---------- materials: toon bands plus a little paint noise ----------
def srgb(h):
    h = h.lstrip('#')
    return tuple((int(h[i:i + 2], 16) / 255) ** 2.2 for i in (0, 2, 4))

def toon(name, hexcol, dark=0.68, grain=0.08, shine=1.1):
    """hexcol: '#rrggbb' (sRGB) or a linear (r, g, b) tuple."""
    rgb = srgb(hexcol) if isinstance(hexcol, str) else tuple(hexcol[:3])
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    n = nt.nodes.new
    out, dif, s2r, ramp, emit = (n('ShaderNodeOutputMaterial'), n('ShaderNodeBsdfDiffuse'), n('ShaderNodeShaderToRGB'),
                                 n('ShaderNodeValToRGB'), n('ShaderNodeEmission'))
    ramp.color_ramp.interpolation = 'CONSTANT'
    e = ramp.color_ramp.elements
    e[0].position, e[0].color = 0.0, (*[c * dark for c in rgb], 1)
    e[1].position, e[1].color = 0.22, (*rgb, 1)
    hi = e.new(0.8)
    hi.color = (*[min(1, c * shine + 0.03) for c in rgb], 1)
    # gouache grain: brighten/darken a few percent with object-space noise
    tex, coord, mix = n('ShaderNodeTexNoise'), n('ShaderNodeTexCoord'), n('ShaderNodeMix')
    tex.inputs['Scale'].default_value = 9
    tex.inputs['Detail'].default_value = 3
    mix.data_type = 'RGBA'
    mix.blend_type = 'OVERLAY'
    mix.inputs['Factor'].default_value = grain
    nt.links.new(coord.outputs['Object'], tex.inputs['Vector'])
    nt.links.new(dif.outputs[0], s2r.inputs[0])
    nt.links.new(s2r.outputs[0], ramp.inputs[0])
    nt.links.new(ramp.outputs[0], mix.inputs['A'])
    nt.links.new(tex.outputs['Color'], mix.inputs['B'])
    nt.links.new(mix.outputs['Result'], emit.inputs[0])
    nt.links.new(emit.outputs[0], out.inputs[0])
    return m

_outline = None
OUTLINE_K = 1.0   # render.py scales all ink lines, e.g. thicker for small game sprites

def outline_mat():
    global _outline
    if _outline is None:
        _outline = bpy.data.materials.new('outline')
        _outline.use_nodes = True
        _outline.use_backface_culling = True
        nt = _outline.node_tree
        nt.nodes.clear()
        em = nt.nodes.new('ShaderNodeEmission')
        em.inputs[0].default_value = (*srgb('#3a2620'), 1)
        nt.links.new(em.outputs[0], nt.nodes.new('ShaderNodeOutputMaterial').inputs[0])
    return _outline

# ---------- geometry ----------
def ring(a, b, n, e):
    """Superellipse ring: e=2 is an ellipse, higher is boxier."""
    pts = []
    for k in range(n):
        t = 2 * math.pi * k / n
        c, s = math.cos(t), math.sin(t)
        pts.append((a * math.copysign(abs(c) ** (2 / e), c), b * math.copysign(abs(s) ** (2 / e), s)))
    return pts

AXES = {'z': lambda c, u, v: Vector((c[0] + u, c[1] + v, c[2])),
        'y': lambda c, u, v: Vector((c[0] + u, c[1], c[2] + v)),
        'x': lambda c, u, v: Vector((c[0], c[1] + u, c[2] + v))}

def tube(secs, axis='z', n=32, e=2.0, xf=None):
    """Sections (centre, a, b[, e]) → (verts, faces), closed at both ends."""
    verts, faces = [], []
    for sec in secs:
        c, a, b = sec[:3]
        for u, v in ring(a, b, n, sec[3] if len(sec) > 3 else e):
            verts.append(AXES[axis](c, u, v))
    for i in range(len(secs) - 1):
        for k in range(n):
            a0, a1 = i * n + k, i * n + (k + 1) % n
            faces.append((a0, a1, a1 + n, a0 + n))
    for i, sec in ((0, secs[0]), (len(secs) - 1, secs[-1])):
        verts.append(Vector(sec[0]))
        faces += [(len(verts) - 1, i * n + k, i * n + (k + 1) % n) for k in range(n)]
    if xf:
        verts = [xf @ v for v in verts]
    return verts, faces

def dense(secs, step, axis=2):
    """Insert sections every `step` along an axis so the surface stays smooth between few key sections."""
    out = [secs[0]]
    for s0, s1 in zip(secs, secs[1:]):
        k = max(1, round(abs(s1[0][axis] - s0[0][axis]) / step))
        for i in range(1, k + 1):
            t = i / k
            out.append((tuple(a + (b - a) * t for a, b in zip(s0[0], s1[0])), s0[1] + (s1[1] - s0[1]) * t, s0[2] + (s1[2] - s0[2]) * t))
    return out

def path_tube(pts, r, n=8):
    """Round tube along a polyline (straps, cords, glasses temples)."""
    verts, faces = [], []
    pts = [Vector(p) for p in pts]
    up = Vector((0, 0, 1))
    for i, p in enumerate(pts):
        t = (pts[min(i + 1, len(pts) - 1)] - pts[max(i - 1, 0)]).normalized()
        side = t.cross(up)
        if side.length < 1e-3:
            side = t.cross(Vector((0, 1, 0)))
        side.normalize()
        nrm = side.cross(t)
        verts += [p + (side * math.cos(2 * math.pi * k / n) + nrm * math.sin(2 * math.pi * k / n)) * r for k in range(n)]
    for i in range(len(pts) - 1):
        for k in range(n):
            a0, a1 = i * n + k, i * n + (k + 1) % n
            faces.append((a0, a1, a1 + n, a0 + n))
    return verts, faces

def blob(c, a, b, h, n=20):
    """Ellipsoid as a tube: centre c, half sizes a (x), b (y), h (z)."""
    rings = 9
    secs = [((c[0], c[1], c[2] + h * math.cos(math.pi * i / rings)), max(a * math.sin(math.pi * i / rings), 1e-3),
             max(b * math.sin(math.pi * i / rings), 1e-3)) for i in range(1, rings)]
    return tube(secs, n=n)

def aim(loc, direction):
    """Matrix that moves the local +Z axis onto direction, origin at loc."""
    m = Vector(direction).to_track_quat('Z', 'Y').to_matrix().to_4x4()
    m.translation = loc
    return m

def part(name, geoms, mats, parent, matfn=None, sub=1, ow=0.011, cuts=()):
    """One mesh object from several (verts, faces).
    cuts: planes (point, normal) that split faces first, so matfn(face centre) gives crisp colour borders."""
    verts, faces = [], []
    for v, f in geoms:
        faces += [tuple(i + len(verts) for i in face) for face in f]
        verts += v
    me = bpy.data.meshes.new(name)
    me.from_pydata([tuple(v) for v in verts], [], faces)
    bm = bmesh.new()
    bm.from_mesh(me)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    for co, no in cuts:
        bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=co, plane_no=no)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    for m in mats:
        me.materials.append(m)
    for p in me.polygons:
        p.use_smooth = True
        p.material_index = matfn(p.center) if matfn else 0
    if sub:
        ob.modifiers.new('sub', 'SUBSURF').levels = sub
        ob.modifiers['sub'].render_levels = sub
    if ow:
        add_outline(ob, ow)
    if parent:
        ob.parent = parent
        ob.matrix_parent_inverse = parent.matrix_world.inverted()
    return ob

def add_outline(ob, ow):
    """Inverted-hull ink line: a flipped, slightly larger shell that only shows its back faces."""
    me = ob.data
    me.materials.append(outline_mat())
    mod = ob.modifiers.new('outline', 'SOLIDIFY')
    mod.thickness = ow * OUTLINE_K
    mod.offset = 1
    mod.use_flip_normals = True
    mod.material_offset = len(me.materials) - 1

def to_toon(ob):
    """Swaps an imported model's PBR materials for toon ones with the same base colour."""
    for i, m in enumerate(ob.data.materials):
        bsdf = next((n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None) if m.node_tree else None
        if not bsdf:
            continue
        col = bsdf.inputs['Base Color'].default_value
        metal = bsdf.inputs['Metallic'].default_value > 0.5
        ob.data.materials[i] = toon(m.name + ' toon', tuple(col), dark=0.58 if metal else 0.68, shine=1.45 if metal else 1.1)

def joint(name, loc, parent=None):
    e = bpy.data.objects.new(name, None)
    bpy.context.scene.collection.objects.link(e)
    e.location = loc
    if parent:
        e.parent = parent
        e.location = Vector(loc) - parent.matrix_world.translation
    bpy.context.view_layer.update()
    return e

def bike_helmet(parent, c, a, b, z0, top, strap_mat):
    """Red bike helmet from the helmet pickup (ADR 0011 colour): shell, vents, chin strap."""
    red, red_d = toon('helmet', '#e23b3b', shine=1.25), toon('helmet_dark', '#8f2424')
    x, y = c
    shell = tube([((x, y, z0), a, b), ((x, y, z0 + 0.4 * (top - z0)), a * 0.99, b * 0.99), ((x, y, z0 + 0.75 * (top - z0)), a * 0.83, b * 0.83),
                  ((x, y, z0 + 0.93 * (top - z0)), a * 0.53, b * 0.53), ((x, y, top), 0.01, 0.01)], n=32)
    vents = [path_tube([(x + dx, y + b * 0.62, top - 0.04), (x + dx, y, top + 0.005), (x + dx, y - b * 0.62, top - 0.035)], 0.012, 6) for dx in (-0.045, 0, 0.045)]
    chin = path_tube([(x + a * 0.86, y + 0.03, z0 - 0.01), (x + a * 0.66, y + b * 0.5, z0 - 0.12), (x, y + b * 0.62, z0 - 0.17),
                      (x - a * 0.66, y + b * 0.5, z0 - 0.12), (x - a * 0.86, y + 0.03, z0 - 0.01)], 0.006, 6)
    return [part('helmet', [shell], [red], parent), part('helmet_vents', vents, [red_d], parent, sub=0, ow=0),
            part('helmet_strap', [chin], [strap_mat], parent, sub=0, ow=0)]

# ---------- rig ----------
class Rig:
    """Pivot empties every figure provides: root → hips → spine → neck; shoulder/elbow and hip/knee per side.
    arm_rest: degrees the arms stand out in the model's rest pose (A-pose); poses count from arms hanging down.
    after: callbacks run after each pose (skinned meshes re-deform there)."""
    def __init__(self, root, hips, spine, neck, limbs, arm_rest=0):
        self.root, self.hips, self.spine, self.neck, self.limbs = root, hips, spine, neck, limbs
        self.arm_rest = arm_rest
        self.after = []

    def pose(self, p):
        """p: degrees (positive swings a hanging limb forward), plus fwd/lift in units."""
        r = math.radians
        self.root.location = (0, p.get('fwd', 0), p.get('lift', 0))
        self.root.rotation_euler = (r(p.get('pitch', 0)), 0, r(p.get('yaw', 0)))
        self.spine.rotation_euler = (r(p.get('bend', 0)), r(p.get('lean', 0)), 0)
        self.neck.rotation_euler = (r(p.get('nod', 0)), r(p.get('tilt', 0)), 0)
        for side in ('l', 'r'):
            L = self.limbs[side]
            sgn = -1 if side == 'l' else 1
            pose = Euler((r(p.get(f'sh_{side}', 0)), r(p.get(f'shy_{side}', 0)) * sgn, r(p.get(f'shz_{side}', 0)) * sgn)).to_matrix()
            down = Euler((0, r(self.arm_rest) * sgn, 0)).to_matrix()   # A-pose arm → hanging arm, then the pose
            L['shoulder'].rotation_euler = (pose @ down).to_euler()
            L['elbow'].rotation_euler = (r(p.get(f'el_{side}', 0)), 0, 0)
            L['hip'].rotation_euler = (r(p.get(f'hp_{side}', 0)), r(p.get(f'hpy_{side}', 0)) * sgn, 0)
            L['knee'].rotation_euler = (r(p.get(f'kn_{side}', 0)), 0, 0)
        for f in self.after:
            f()

def lerp(a, b, t):
    return {k: a.get(k, 0) + (b.get(k, 0) - a.get(k, 0)) * t for k in set(a) | set(b)}

ease = lambda t: t * t * (3 - 2 * t)

def through(keys, t):
    """Eased walk through a list of key poses, t in 0..1."""
    t *= len(keys) - 1
    k = min(int(t), len(keys) - 2)
    return lerp(keys[k], keys[k + 1], ease(t - k))
