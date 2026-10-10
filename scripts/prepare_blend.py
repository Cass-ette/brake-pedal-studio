"""Import the generated animated GLB and prepare an editable Blender scene."""
import os
import sys

import bpy
from mathutils import Vector

args = sys.argv[sys.argv.index('--') + 1:]
source, destination = map(os.path.abspath, args)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=source)
scene = bpy.context.scene
scene.render.fps = 30
scene.frame_start = 1
scene.frame_end = 181
scene.frame_set(1)
engines = scene.render.bl_rna.properties['engine'].enum_items.keys()
scene.render.engine = 'BLENDER_EEVEE_NEXT' if 'BLENDER_EEVEE_NEXT' in engines else 'BLENDER_EEVEE'
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.resolution_percentage = 100
scene.world.use_nodes = True
scene.world.node_tree.nodes['Background'].inputs[0].default_value = (.12, .15, .13, 1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value = .7

def aim(obj, target):
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat('-Z', 'Y').to_euler()

for name, position, energy, color, size in [
    ('Studio_key', (-3, -4, 6), 900, (1, .96, .90), 4),
    ('Studio_fill', (4, -1, 3), 500, (.84, .91, 1), 3),
    ('Studio_rim', (1, 3, 4), 750, (.91, 1, .95), 3),
]:
    data = bpy.data.lights.new(name, 'AREA')
    data.energy = energy
    data.color = color
    data.shape = 'DISK'
    data.size = size
    obj = bpy.data.objects.new(name, data)
    scene.collection.objects.link(obj)
    obj.location = position
    aim(obj, (0, 0, 1.2))

camera_data = bpy.data.cameras.new('Overview_camera')
camera = bpy.data.objects.new('Overview_camera', camera_data)
scene.collection.objects.link(camera)
camera.location = (-3.6, -5.4, 3.1)
camera_data.lens = 46
aim(camera, (0, -.2, 1.2))
scene.camera = camera
bpy.ops.mesh.primitive_plane_add(size=200, location=(0, 0, -.065))
floor = bpy.context.object
floor.name = 'Studio_Ground'
material = bpy.data.materials.new('Studio_graphite')
material.use_nodes = True
material.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (.08, .10, .09, 1)
material.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value = .95
floor.data.materials.append(material)

scene['illustration_note'] = 'Generic outward bearing lip fracture. Assumed geometry, timing and fragment motion; not a measured engineering simulation.'
scene['animation_seconds'] = 6
scene.timeline_markers.new('01 - Intact', frame=1)
scene.timeline_markers.new('02 - Pedal press', frame=46)
scene.timeline_markers.new('03 - Illustrated fracture', frame=104)
scene.timeline_markers.new('04 - Loss of support', frame=136)
for screen in bpy.data.screens:
    for area in screen.areas:
        if area.type == 'VIEW_3D':
            area.spaces.active.region_3d.view_perspective = 'CAMERA'
            area.spaces.active.shading.type = 'MATERIAL'
bpy.ops.wm.save_as_mainfile(filepath=destination)
animated = [o.name for o in bpy.data.objects if o.animation_data]
assert len(animated) >= 4, 'Imported GLB must retain multiple animated objects'
print('Saved editable Blender scene:', destination)
print('Animated objects:', animated)
