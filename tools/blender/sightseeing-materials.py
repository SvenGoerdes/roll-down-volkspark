"""Shared warm, matte painted materials for local sightseeing models."""
import bpy


def paint(name, color, grain=0.12):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    nodes.clear()
    new = nodes.new
    out = new('ShaderNodeOutputMaterial')
    diffuse = new('ShaderNodeBsdfDiffuse')
    to_rgb = new('ShaderNodeShaderToRGB')
    ramp = new('ShaderNodeValToRGB')
    ramp.color_ramp.interpolation = 'CONSTANT'
    ramp.color_ramp.elements[0].position = 0.12
    ramp.color_ramp.elements[0].color = (*(c * 0.72 for c in color), 1)
    ramp.color_ramp.elements[1].position = 0.58
    ramp.color_ramp.elements[1].color = (*color, 1)
    hi = ramp.color_ramp.elements.new(0.86)
    hi.color = (*(min(1, c * 1.12) for c in color), 1)
    noise = new('ShaderNodeTexNoise')
    noise.inputs['Scale'].default_value = 18
    noise.inputs['Detail'].default_value = 2
    ramp2 = new('ShaderNodeValToRGB')
    ramp2.color_ramp.elements[0].position = 0.34
    ramp2.color_ramp.elements[0].color = (0.88, 0.88, 0.88, 1)
    ramp2.color_ramp.elements[1].position = 0.68
    ramp2.color_ramp.elements[1].color = (1.0, 1.0, 1.0, 1)
    mix = new('ShaderNodeMixRGB')
    mix.blend_type = 'MULTIPLY'
    mix.inputs[0].default_value = grain
    links = mat.node_tree.links
    links.new(diffuse.outputs[0], to_rgb.inputs[0])
    links.new(to_rgb.outputs[0], ramp.inputs[0])
    links.new(noise.outputs['Fac'], ramp2.inputs[0])
    links.new(ramp.outputs[0], mix.inputs[1])
    links.new(ramp2.outputs[0], mix.inputs[2])
    emission = new('ShaderNodeEmission')
    links.new(mix.outputs[0], emission.inputs[0])
    links.new(emission.outputs[0], out.inputs[0])
    return mat


def palette(scenery=False):
    if scenery:
        return {
            'sand': paint('scenery | warm stone', (0.58, 0.48, 0.36), 0.1),
            'light': paint('scenery | pale stone', (0.69, 0.59, 0.46), 0.1),
            'shadow': paint('scenery | muted shadow', (0.35, 0.30, 0.25), 0.1),
            'brick': paint('scenery | faded brick', (0.42, 0.25, 0.20), 0.1),
            'brick_light': paint('scenery | faded red brick', (0.52, 0.33, 0.27), 0.1),
            'silver': paint('scenery | hazy silver', (0.48, 0.51, 0.50), 0.06),
            'bronze': paint('scenery | bronze', (0.31, 0.28, 0.23), 0.1),
            'earth': paint('scenery | earth', (0.43, 0.36, 0.28), 0.1),
            'mural_ochre': paint('mural | faded ochre', (0.60, 0.43, 0.29), 0.06),
            'mural_sage': paint('mural | muted sage', (0.35, 0.43, 0.32), 0.06),
            'mural_rose': paint('mural | dusty rose', (0.55, 0.34, 0.30), 0.06),
            'mural_teal': paint('mural | grey teal', (0.33, 0.45, 0.43), 0.06),
        }
    return {
        'sand': paint('paint | warm sandstone', (0.68, 0.48, 0.29)),
        'light': paint('paint | sunlit limestone', (0.82, 0.66, 0.45)),
        'shadow': paint('paint | stone shadow', (0.39, 0.27, 0.18)),
        'brick': paint('paint | muted brick red', (0.48, 0.20, 0.14)),
        'brick_light': paint('paint | old brick', (0.63, 0.32, 0.23)),
        'silver': paint('paint | neutral silver', (0.52, 0.56, 0.57), 0.07),
        'bronze': paint('paint | aged bronze', (0.33, 0.27, 0.17)),
        'earth': paint('paint | warm earth', (0.48, 0.35, 0.22)),
        'mural_ochre': paint('mural | muted ochre', (0.68, 0.47, 0.29), 0.06),
        'mural_sage': paint('mural | muted sage', (0.39, 0.48, 0.34), 0.06),
        'mural_rose': paint('mural | dusty rose', (0.60, 0.34, 0.29), 0.06),
        'mural_teal': paint('mural | muted teal', (0.34, 0.47, 0.45), 0.06),
    }
