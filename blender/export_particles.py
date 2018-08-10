'''
EXPORTED .JSON FILE FORMAT

{
	version: '1.0',
	precision: 1000,
	rotation: true,
	velocity: False,
	frames: [<frames>]
}


Each frame is an array of particles. Each particle is an array of integers:
(to get the actual float value, divide by data.precision (1000 by default))

	[ position.x, position.y, position.z, rotation.x, rotation.y, rotation.z ]

If data is 0, the particle is not alive in that frame (it should be invisible)

'''

# CONFIGURATION ------------------------------

# Destination folder. Leave empty for using same folder as current .blend
FOLDER = '' 

# First and last frame of the simulation to export
FIRST_FRAME = 1
LAST_FRAME = 100

# Export particle rotation
ROTATION = False

# Export particle velocity
VELOCITY = False

# Export one each <STEP> frames
STEP = 1

# Values precision. The more zeroes, the more precision (10, 1000, 100000...)
PRECISION = 1000

# END OF CONFIGURATION -----------------------



import bpy
import json
import os
from math import floor
VERSION = '1.0'

obj = bpy.context.active_object

f = open(bpy.path.abspath('//') + 'particles-' + str(obj.name) + '.json', 'w')

numparts = 0
data = {'version': VERSION, 'precision': PRECISION, 'rotation': ROTATION, 'velocity': VELOCITY, 'frames': [] }

def AA(n):
	return floor(n * PRECISION)
#	return floor(n * PRECISION) / PRECISION

for frame in range(FIRST_FRAME, LAST_FRAME + 1, STEP):
	bpy.context.scene.frame_set(frame)
	fdata = []
	for ps in obj.particle_systems:
		for i in range(len(ps.particles)):
			part = []
			p = ps.particles[i]
			if p.is_exist and p.alive_state == 'ALIVE':
				part.append(AA( p.location.x ))
				part.append(AA( p.location.z ))
				part.append(AA( -p.location.y ))
				if ROTATION:
					part.append(AA( -p.rotation.to_euler().x )) 
					part.append(AA( -p.rotation.to_euler().z )) 
					part.append(AA( -p.rotation.to_euler().y ))
		
				if VELOCITY:
					part.append(AA( p.velocity.x ))
					part.append(AA( p.velocity.z ))
					part.append(AA( -p.velocity.y ))
			else: 
				part = 0
				
			fdata.append(part)
	data['frames'].append(fdata)

# write to file, finish
f.write(json.dumps(data, separators = (',',':')))
f.close()
print(os.getcwd())
print('saved ' + os.path.realpath(f.name))

