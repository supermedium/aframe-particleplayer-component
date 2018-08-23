'''
EXPORTED .JSON FILE FORMAT

{
    version: '1.0',
    precision: 1000,
    rotation: true,
    sprite_rotation: [0, 0, 0],
    frames: [<frames>]
}


Each frame is an array of particles. Each particle is an array of integers:
(to get the actual float value, divide by data.precision (1000 by default))

    [ position.x, position.y, position.z, rotation.x, rotation.y, rotation.z ]

If data is 0, the particle is not alive in that frame (it should be invisible)

'''


import bpy
import json
import os
from math import floor
from bpy.app.handlers import persistent

VERSION = '1.0' # json format version

bl_info = {
    "name": "A-Frame particleplayer exporter",
    "description": "Exports current selected object particle systems to a JSON file ready to be consumed by A-Frame's particle player component.",
    "author": "Diego F. Goberna",
    "version": (0, 0, 1),
    "blender": (2, 70, 0),
    "location": "3D View > Tools > A-Frame",
    "warning": "", # used for warning icon and text in addons panel
    "wiki_url": "http://github.com/supermedium/aframe-particleplayer-component",
    "tracker_url": "",
    "category": "Import-Export"
}

precision = 1000

def AA(n):
    return floor(n * precision)

def export_main(context, operator):
    global precision
    obj = context.scene.objects.active
    props = obj.particleplayer
    precision = int(props.precision)
    data = {'version': VERSION, 'precision': precision, 'rotation': props.userotation, 'frames': [], 'sprite_rotation': False }

    if not obj or not obj.particle_systems:
        operator.report({'ERROR'}, "No particle systems in selected object")
        return False
    
    f = open( props.path, 'w')
    if not f:
        operator.report({'ERROR'}, "Could not open " + props.path)
        return False

    if props.userotation:
        dupli = obj.particle_systems[0].settings.dupli_object
        if dupli:
            data['sprite_rotation'] = [0, 0, 0]
            data['sprite_rotation'][0] = AA( dupli.rotation_euler.x )
            data['sprite_rotation'][1] = AA( dupli.rotation_euler.z )
            data['sprite_rotation'][2] = AA( -dupli.rotation_euler.y )

    for frame in range(props.firstframe, props.lastframe + 1, props.framestep):
        context.scene.frame_set(frame)
        fdata = []
        for ps in obj.particle_systems:
            for i in range(len(ps.particles)):
                part = []
                p = ps.particles[i]
                if p.is_exist and p.alive_state == 'ALIVE':
                    part.append(AA( p.location.x ))
                    part.append(AA( p.location.z ))
                    part.append(AA( -p.location.y ))
                    if props.userotation:
                        part.append(AA( p.rotation.to_euler().x )) 
                        part.append(AA( p.rotation.to_euler().z )) 
                        part.append(AA( -p.rotation.to_euler().y ))
                else: 
                    part = 0
                    
                fdata.append(part)
        data['frames'].append(fdata)

    # write to file, finish
    f.write(json.dumps(data, separators = (',',':')))
    f.close()
    operator.report({'INFO'}, 'Saved ' + os.path.realpath(f.name))
    props.done = 1000
    return True

class ParticlePlayerProps(bpy.types.PropertyGroup):
    firstframe = bpy.props.IntProperty(name="From", min=0, subtype='UNSIGNED', default=0)
    lastframe = bpy.props.IntProperty(name="To", min=0, subtype='UNSIGNED', default=20)
    framestep = bpy.props.IntProperty(name="Step", min=1, subtype='UNSIGNED', default=1)
    userotation = bpy.props.BoolProperty(name="Rotation", default=False)
    path = bpy.props.StringProperty(description="Output file path", default="", subtype='FILE_PATH')
    precision = bpy.props.EnumProperty(name="Precision", default='1000', 
            items=(
                ('1', '1', ''),
                ('10', '10', ''),
                ('100', '100', ''),
                ('1000', '1000', ''),
                ('10000', '10000', ''),
                ('100000', '100000', ''),
                ('1000000', '1000000', ''))
            )
    done = bpy.props.IntProperty(default=0)

class ParticlePlayerAutoRange(bpy.types.Operator):
    bl_idname = "object.particleplayer_autorange"
    bl_label = "From scene"

    @classmethod
    def poll(cls, context):
        obj = context.active_object
        return obj is not None

    def execute(self, context):
        context.active_object.particleplayer.firstframe = context.scene.frame_start
        context.active_object.particleplayer.lastframe = context.scene.frame_end
        return {'FINISHED'}


class ParticlePlayerExport(bpy.types.Operator):
    """A-Frame particleplayer component exporter"""
    bl_idname = "object.particleplayer_export"
    bl_label = "Export"

    @classmethod
    def poll(cls, context):
        return context.active_object is not None

    def execute(self, context):
        export_main(context, self)
        return {'FINISHED'}



class ParticlePlayerPanel(bpy.types.Panel):
    """Particleplayer exporter panel"""
    bl_label = "ParticlePlayer Export"
    bl_idname = "OBJECT_PT_particleplayer"
    bl_space_type = 'VIEW_3D'
    bl_region_type = 'TOOLS'
    bl_category = "A-Frame"

    def draw(self, context):
        layout = self.layout

        obj = context.object
        if not obj: return

        row = layout.row()
        row.prop(obj, 'name', text="Source", icon="OBJECT_DATA")
        row = layout.row()
        row.label(text="Frames:")
        row = layout.row()
        row.prop(obj.particleplayer, "firstframe")
        row.prop(obj.particleplayer, "lastframe")
        row = layout.row()
        row.prop(obj.particleplayer, "framestep")
        row.operator("object.particleplayer_autorange", icon="TIME")
        row = layout.row()
        row.prop(obj.particleplayer, "userotation")
        row.prop(obj.particleplayer, "precision", text="")

        row = layout.row()
        row.prop(obj.particleplayer, "path", text="Save to")

        done = obj.particleplayer.done
        row = layout.row()
        row.operator("object.particleplayer_export", text = "DONE!" if done > 0 else "Export",  icon = "FILE_TICK" if done > 0 else "PARTICLES")

@persistent
def sceneupdate_pre(scene):
    obj = scene.objects.active
    if obj.particleplayer.done > 0: obj.particleplayer.done -= 1
    if obj and obj.particleplayer.path == "":
        obj.particleplayer.path = '//particles-' + obj.name + '.json'

def register():
    bpy.app.handlers.scene_update_pre.append(sceneupdate_pre)
    bpy.utils.register_module(__name__)
    bpy.types.Object.particleplayer = bpy.props.PointerProperty(type=ParticlePlayerProps)

def unregister():
    bpy.app.handlers.scene_update_pre.remove(sceneupdate_pre)
    bpy.utils.unregister_module(__name__)

if __name__ == "__main__":
    register()
