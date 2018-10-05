/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 1);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {

/**
 * @author mrdoob / http://mrdoob.com/
 */

THREE.BufferGeometryUtils = {

	computeTangents: function ( geometry ) {

		var index = geometry.index;
		var attributes = geometry.attributes;

		// based on http://www.terathon.com/code/tangent.html
		// (per vertex tangents)

		if ( index === null ||
			 attributes.position === undefined ||
			 attributes.normal === undefined ||
			 attributes.uv === undefined ) {

			console.warn( 'THREE.BufferGeometry: Missing required attributes (index, position, normal or uv) in BufferGeometry.computeTangents()' );
			return;

		}

		var indices = index.array;
		var positions = attributes.position.array;
		var normals = attributes.normal.array;
		var uvs = attributes.uv.array;

		var nVertices = positions.length / 3;

		if ( attributes.tangent === undefined ) {

			geometry.addAttribute( 'tangent', new THREE.BufferAttribute( new Float32Array( 4 * nVertices ), 4 ) );

		}

		var tangents = attributes.tangent.array;

		var tan1 = [], tan2 = [];

		for ( var i = 0; i < nVertices; i ++ ) {

			tan1[ i ] = new THREE.Vector3();
			tan2[ i ] = new THREE.Vector3();

		}

		var vA = new THREE.Vector3(),
			vB = new THREE.Vector3(),
			vC = new THREE.Vector3(),

			uvA = new THREE.Vector2(),
			uvB = new THREE.Vector2(),
			uvC = new THREE.Vector2(),

			sdir = new THREE.Vector3(),
			tdir = new THREE.Vector3();

		function handleTriangle( a, b, c ) {

			vA.fromArray( positions, a * 3 );
			vB.fromArray( positions, b * 3 );
			vC.fromArray( positions, c * 3 );

			uvA.fromArray( uvs, a * 2 );
			uvB.fromArray( uvs, b * 2 );
			uvC.fromArray( uvs, c * 2 );

			var x1 = vB.x - vA.x;
			var x2 = vC.x - vA.x;

			var y1 = vB.y - vA.y;
			var y2 = vC.y - vA.y;

			var z1 = vB.z - vA.z;
			var z2 = vC.z - vA.z;

			var s1 = uvB.x - uvA.x;
			var s2 = uvC.x - uvA.x;

			var t1 = uvB.y - uvA.y;
			var t2 = uvC.y - uvA.y;

			var r = 1.0 / ( s1 * t2 - s2 * t1 );

			sdir.set(
				( t2 * x1 - t1 * x2 ) * r,
				( t2 * y1 - t1 * y2 ) * r,
				( t2 * z1 - t1 * z2 ) * r
			);

			tdir.set(
				( s1 * x2 - s2 * x1 ) * r,
				( s1 * y2 - s2 * y1 ) * r,
				( s1 * z2 - s2 * z1 ) * r
			);

			tan1[ a ].add( sdir );
			tan1[ b ].add( sdir );
			tan1[ c ].add( sdir );

			tan2[ a ].add( tdir );
			tan2[ b ].add( tdir );
			tan2[ c ].add( tdir );

		}

		var groups = geometry.groups;

		if ( groups.length === 0 ) {

			groups = [ {
				start: 0,
				count: indices.length
			} ];

		}

		for ( var i = 0, il = groups.length; i < il; ++ i ) {

			var group = groups[ i ];

			var start = group.start;
			var count = group.count;

			for ( var j = start, jl = start + count; j < jl; j += 3 ) {

				handleTriangle(
					indices[ j + 0 ],
					indices[ j + 1 ],
					indices[ j + 2 ]
				);

			}

		}

		var tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3();
		var n = new THREE.Vector3(), n2 = new THREE.Vector3();
		var w, t, test;

		function handleVertex( v ) {

			n.fromArray( normals, v * 3 );
			n2.copy( n );

			t = tan1[ v ];

			// Gram-Schmidt orthogonalize

			tmp.copy( t );
			tmp.sub( n.multiplyScalar( n.dot( t ) ) ).normalize();

			// Calculate handedness

			tmp2.crossVectors( n2, t );
			test = tmp2.dot( tan2[ v ] );
			w = ( test < 0.0 ) ? - 1.0 : 1.0;

			tangents[ v * 4 ] = tmp.x;
			tangents[ v * 4 + 1 ] = tmp.y;
			tangents[ v * 4 + 2 ] = tmp.z;
			tangents[ v * 4 + 3 ] = w;

		}

		for ( var i = 0, il = groups.length; i < il; ++ i ) {

			var group = groups[ i ];

			var start = group.start;
			var count = group.count;

			for ( var j = start, jl = start + count; j < jl; j += 3 ) {

				handleVertex( indices[ j + 0 ] );
				handleVertex( indices[ j + 1 ] );
				handleVertex( indices[ j + 2 ] );

			}

		}

	},

	/**
	 * @param  {Array<THREE.BufferGeometry>} geometries
	 * @return {THREE.BufferGeometry}
	 */
	mergeBufferGeometries: function ( geometries, useGroups ) {

		var isIndexed = geometries[ 0 ].index !== null;

		var attributesUsed = new Set( Object.keys( geometries[ 0 ].attributes ) );
		var morphAttributesUsed = new Set( Object.keys( geometries[ 0 ].morphAttributes ) );

		var attributes = {};
		var morphAttributes = {};

		var mergedGeometry = new THREE.BufferGeometry();

		var offset = 0;

		for ( var i = 0; i < geometries.length; ++ i ) {

			var geometry = geometries[ i ];

			// ensure that all geometries are indexed, or none

			if ( isIndexed !== ( geometry.index !== null ) ) return null;

			// gather attributes, exit early if they're different

			for ( var name in geometry.attributes ) {

				if ( ! attributesUsed.has( name ) ) return null;

				if ( attributes[ name ] === undefined ) attributes[ name ] = [];

				attributes[ name ].push( geometry.attributes[ name ] );

			}

			// gather morph attributes, exit early if they're different

			for ( var name in geometry.morphAttributes ) {

				if ( ! morphAttributesUsed.has( name ) ) return null;

				if ( morphAttributes[ name ] === undefined ) morphAttributes[ name ] = [];

				morphAttributes[ name ].push( geometry.morphAttributes[ name ] );

			}

			// gather .userData

			mergedGeometry.userData = mergedGeometry.userData || {};
			mergedGeometry.userData.mergedUserData = mergedGeometry.userData.mergedUserData || [];
			mergedGeometry.userData.mergedUserData.push( geometry.userData );

			if ( useGroups ) {

				var count;

				if ( isIndexed ) {

					count = geometry.index.count;

				} else if ( geometry.attributes.position !== undefined ) {

					count = geometry.attributes.position.count;

				} else {

					return null;

				}

				mergedGeometry.addGroup( offset, count, i );

				offset += count;

			}

		}

		// merge indices

		if ( isIndexed ) {

			var indexOffset = 0;
			var mergedIndex = [];

			for ( var i = 0; i < geometries.length; ++ i ) {

				var index = geometries[ i ].index;

				for ( var j = 0; j < index.count; ++ j ) {

					mergedIndex.push( index.getX( j ) + indexOffset );

				}

				indexOffset += geometries[ i ].attributes.position.count;

			}

			mergedGeometry.setIndex( mergedIndex );

		}

		// merge attributes

		for ( var name in attributes ) {

			var mergedAttribute = this.mergeBufferAttributes( attributes[ name ] );

			if ( ! mergedAttribute ) return null;

			mergedGeometry.addAttribute( name, mergedAttribute );

		}

		// merge morph attributes

		for ( var name in morphAttributes ) {

			var numMorphTargets = morphAttributes[ name ][ 0 ].length;

			if ( numMorphTargets === 0 ) break;

			mergedGeometry.morphAttributes = mergedGeometry.morphAttributes || {};
			mergedGeometry.morphAttributes[ name ] = [];

			for ( var i = 0; i < numMorphTargets; ++ i ) {

				var morphAttributesToMerge = [];

				for ( var j = 0; j < morphAttributes[ name ].length; ++ j ) {

					morphAttributesToMerge.push( morphAttributes[ name ][ j ][ i ] );

				}

				var mergedMorphAttribute = this.mergeBufferAttributes( morphAttributesToMerge );

				if ( ! mergedMorphAttribute ) return null;

				mergedGeometry.morphAttributes[ name ].push( mergedMorphAttribute );

			}

		}

		return mergedGeometry;

	},

	/**
	 * @param {Array<THREE.BufferAttribute>} attributes
	 * @return {THREE.BufferAttribute}
	 */
	mergeBufferAttributes: function ( attributes ) {

		var TypedArray;
		var itemSize;
		var normalized;
		var arrayLength = 0;

		for ( var i = 0; i < attributes.length; ++ i ) {

			var attribute = attributes[ i ];

			if ( attribute.isInterleavedBufferAttribute ) return null;

			if ( TypedArray === undefined ) TypedArray = attribute.array.constructor;
			if ( TypedArray !== attribute.array.constructor ) return null;

			if ( itemSize === undefined ) itemSize = attribute.itemSize;
			if ( itemSize !== attribute.itemSize ) return null;

			if ( normalized === undefined ) normalized = attribute.normalized;
			if ( normalized !== attribute.normalized ) return null;

			arrayLength += attribute.array.length;

		}

		var array = new TypedArray( arrayLength );
		var offset = 0;

		for ( var i = 0; i < attributes.length; ++ i ) {

			array.set( attributes[ i ].array, offset );

			offset += attributes[ i ].array.length;

		}

		return new THREE.BufferAttribute( array, itemSize, normalized );

	}

};


/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

/* global AFRAME */

__webpack_require__(0);

if (typeof AFRAME === 'undefined') {
  throw new Error(
    'Component attempted to register before AFRAME was available.'
  );
}

const NUM_PLANE_POSITIONS = 12;

const BLENDINGS = {
  normal: THREE.NormalBlending,
  additive: THREE.AdditiveBlending,
  substractive: THREE.SubstractiveBlending,
  multiply: THREE.MultiplyBlending
};

const SHADERS = {
  flat: THREE.MeshBasicMaterial,
  lambert: THREE.MeshLambertMaterial,
  phong: THREE.MeshPhongMaterial,
  standard: THREE.MeshStandardMaterial
};

const OFFSCREEN_VEC3 = new THREE.Vector3(-99999, -99999, -99999);

/**
 * Particle Player component for A-Frame.
 */
AFRAME.registerComponent('particleplayer', {
  schema: {
    blending: {
      default: 'additive',
      oneOf: ['normal', 'additive', 'multiply', 'substractive']
    },
    color: {default: '#fff', type: 'color'},
    count: {default: '100%'},
    delay: {default: 0, type: 'int'},
    dur: {default: 1000, type: 'int'},
    img: {type: 'selector'},
    interpolate: {default: false},
    loop: {default: 'false'},
    on: {default: 'init'},
    poolSize: {default: 5, type: 'int'}, // number of simultaneous particle systems
    protation: {type: 'vec3'},
    pscale: {default: 1.0, type: 'float'},
    scale: {default: 1.0, type: 'float'},
    shader: {
      default: 'flat',
      oneOf: ['flat', 'lambert', 'phong', 'standard']
    },
    src: {type: 'selector'}
  },

  multiple: true,

  init: function() {
    this.frame = 0;
    this.framedata = null;
    this.indexPool = null;
    this.lastFrame = 0;
    this.material = null;
    this.msPerFrame = 0;
    this.numFrames = 0;
    this.numParticles = 0; // total number of particles per system
    this.originalVertexPositions = [];
    this.particleCount = 0; // actual number of particles to spawn per event (data.count)
    this.particleSystems = [];
    this.protation = false;
    this.restPositions = []; // position at first frame each particle is alive
    this.restRotations = [];
    this.sprite_rotation = false;
    this.systems = null;
    this.useRotation = false;
  },

  update: function(oldData) {
    const data = this.data;

    if (!data.src) {
      return;
    }

    if (oldData.on !== data.on) {
      if (oldData.on) {
        this.el.removeEventListener(oldData.on, this.start);
      }
      if (data.on !== 'play') {
        this.el.addEventListener(data.on, this.start.bind(this));
      }
    }

    this.loadParticlesJSON(data.src, data.scale);

    this.numFrames = this.framedata.length;
    this.numParticles = this.numFrames > 0 ? this.framedata[0].length : 0;

    if (data.count[data.count.length - 1] === '%') {
      this.particleCount = Math.floor(
        (parseInt(data.count) * this.numParticles) / 100.0
      );
    } else {
      this.particleCount = parseInt(data.count);
    }
    this.particleCount = Math.min(
      this.numParticles,
      Math.max(0, this.particleCount)
    );

    this.msPerFrame = data.dur / this.numFrames;

    this.indexPool = new Array(this.numParticles);

    const materialParams = {
      color: new THREE.Color(data.color),
      side: THREE.DoubleSide,
      blending: BLENDINGS[data.blending],
      map: data.img ? new THREE.TextureLoader().load(data.img.src) : null,
      depthWrite: false,
      opacity: data.opacity,
      transparent: !!data.img || data.blending !== 'normal' || data.opacity < 1
    };
    if (SHADERS[data.shader] !== undefined) {
      this.material = new SHADERS[data.shader](materialParams);
    } else {
      this.material = new SHADERS['flat'](materialParams);
    }

    this.createParticles(data.poolSize);

    if (data.on === 'init') {
      this.start();
    }
  },

  loadParticlesJSON: function(json, scale) {
    var alive;

    this.restPositions.length = 0;
    this.restRotations.length = 0;

    const jsonData = JSON.parse(json.data);
    const frames = jsonData.frames;
    const precision = jsonData.precision;

    this.useRotation = jsonData.rotation;

    if (jsonData.sprite_rotation !== false) {
      this.sprite_rotation = {
        x: jsonData.sprite_rotation[0] / precision,
        y: jsonData.sprite_rotation[1] / precision,
        z: jsonData.sprite_rotation[2] / precision
      };
    } else {
      this.sprite_rotation = false;
    }

    this.framedata = new Array(frames.length);
    for (let frameIndex = 0; frameIndex < frames.length; frameIndex++) {
      this.framedata[frameIndex] = new Array(frames[frameIndex].length);
      for (
        let particleIndex = 0;
        particleIndex < frames[frameIndex].length;
        particleIndex++
      ) {
        let rawP = frames[frameIndex][particleIndex]; // data of particle i in frame f
        alive = rawP !== 0; // 0 means not alive yet this frame.

        let p = (this.framedata[frameIndex][particleIndex] = {
          position: alive
            ? {
                x: (rawP[0] / precision) * scale,
                y: (rawP[1] / precision) * scale,
                z: (rawP[2] / precision) * scale
              }
            : null,
          alive: alive
        });

        if (jsonData.rotation) {
          p.rotation = alive
            ? {
                x: rawP[3] / precision,
                y: rawP[4] / precision,
                z: rawP[5] / precision
              }
            : null;
        }

        if (alive && frameIndex === 0) {
          this.restPositions[particleIndex] = p.position
            ? {x: p.position.y, y: p.position.y, z: p.position.z}
            : null;
          this.restRotations[particleIndex] = p.rotation
            ? {x: p.rotation.y, y: p.rotation.y, z: p.rotation.z}
            : null;
        }
      }
    }
  },

  createParticles: (function() {
    const tempGeometries = [];

    return function(numParticleSystems) {
      const data = this.data;
      var loop = parseInt(this.data.loop);

      this.particleSystems.length = 0;

      if (isNaN(loop)) {
        loop = this.data.loop === 'true' ? Number.MAX_VALUE : 0;
      }

      for (let i = 0; i < numParticleSystems; i++) {
        let particleSystem = {
          active: false,
          activeParticleIndices: new Array(this.particleCount),
          loopCount: 0,
          loopTotal: loop,
          mesh: null,
          time: 0
        };

        // Fill array of geometries to merge.
        const ratio = data.img ? data.img.width / data.img.height : 1;
        tempGeometries.length = 0;
        for (let p = 0; p < this.numParticles; p++) {
          let geometry = new THREE.PlaneBufferGeometry(
            0.1 * ratio * data.pscale,
            0.1 * data.pscale
          );
          if (this.sprite_rotation !== false) {
            geometry.rotateX(this.sprite_rotation.x);
            geometry.rotateY(this.sprite_rotation.y);
            geometry.rotateZ(this.sprite_rotation.z);
          } else {
            geometry.rotateX((this.data.protation.x * Math.PI) / 180);
            geometry.rotateY((this.data.protation.y * Math.PI) / 180);
            geometry.rotateZ((this.data.protation.z * Math.PI) / 180);
          }
          tempGeometries.push(geometry);
        }

        // Create merged geometry for whole particle system.
        let mergedBufferGeometry = THREE.BufferGeometryUtils.mergeBufferGeometries(
          tempGeometries
        );

        particleSystem.mesh = new THREE.Mesh(
          mergedBufferGeometry,
          this.material
        );
        particleSystem.mesh.visible = false;
        this.el.setObject3D(`particleplayer${i}`, particleSystem.mesh);
        copyArray(
          this.originalVertexPositions,
          mergedBufferGeometry.attributes.position.array
        );

        // Hide all particles by default.
        for (
          let i = 0;
          i < mergedBufferGeometry.attributes.position.array.length;
          i++
        ) {
          mergedBufferGeometry.attributes.position.array[i] = -99999;
        }

        for (let i = 0; i < particleSystem.activeParticleIndices.length; i++) {
          particleSystem.activeParticleIndices[i] = i;
        };

        this.particleSystems.push(particleSystem);
      }
    };
  })(),

  start: function(evt) {
    if (this.data.delay > 0) {
      setTimeout(() => this.startAfterDelay(evt), this.data.delay);
    } else {
      this.startAfterDelay(evt);
    }
  },

  startAfterDelay: function(evt) {
    // position, rotation
    var found = -1;
    var particleSystem;
    var oldestTime = 0;
    var position = evt ? evt.detail.position : null;
    var rotation = evt ? evt.detail.rotation : null;

    if (!(position instanceof THREE.Vector3)) {
      position = new THREE.Vector3();
    }
    if (!(rotation instanceof THREE.Euler)) {
      rotation = new THREE.Euler();
    }

    // find available (or oldest) particle system
    for (var i = 0; i < this.particleSystems.length; i++) {
      if (this.particleSystems[i].active === false) {
        found = i;
        break;
      }
      if (this.particleSystems[i].time > oldestTime) {
        found = i;
        oldestTime = this.particleSystems[i].time;
      }
    }

    particleSystem = this.particleSystems[found];
    particleSystem.active = true;
    particleSystem.loopCount = 1;
    particleSystem.mesh.visible = true;
    particleSystem.mesh.position.copy(position);
    particleSystem.mesh.rotation.copy(rotation);
    particleSystem.time = 0;

    this.resetParticles(particleSystem);
  },

  doLoop: function(particleSystem) {
    particleSystem.loopCount++;
    particleSystem.frame = -1;
    particleSystem.time = 0;
    this.resetParticles(particleSystem);
  },

  resetParticle: function(particleSystem, particleIndex) {
    const geometry = particleSystem.mesh.geometry;

    if (this.restPositions[particleIndex]) {
      transformPlane(
        particleIndex,
        geometry,
        this.originalVertexPositions,
        this.restPositions[particleIndex],
        this.useRotation && this.restRotations[particleIndex]
      );
    } else {
      // Hide.
      transformPlane(
        particleIndex,
        geometry,
        this.originalVertexPositions,
        OFFSCREEN_VEC3
      );
    }

    // TODO: Can update transformPlane for lookAt.
    // lookAt does not support rotated or translated parents! :_(
    // part.lookAt(this.camera.position);
  },

  /**
   * When starting or finishing (looping) animation, this resets particles
   * to their initial position and, if user asked for replaying less than 100%
   * of particles, randomly choose them.
   */
  resetParticles: function(particleSystem) {
    var i;
    var rand;

    // no picking, just hide and reset
    if (this.particleCount === this.numParticles) {
      for (i = 0; i < this.numParticles; i++) {
        this.resetParticle(particleSystem, i);
      }
      return;
    }

    // hide particles from last animation and initialize indexPool
    const geometry = particleSystem.mesh.geometry;
    for (i = 0; i < this.numParticles; i++) {
      if (i < this.particleCount) {
        transformPlane(
          particleSystem.activeParticleIndices[i],
          geometry,
          this.originalVertexPositions,
          OFFSCREEN_VEC3
        );
      }
      this.indexPool[i] = i;
    }

    // scramble indexPool
    for (i = 0; i < this.particleCount; i++) {
      rand = i + Math.floor(Math.random() * (this.numParticles - i));
      particleSystem.activeParticleIndices[i] = this.indexPool[rand];
      this.indexPool[rand] = this.indexPool[i];
      this.resetParticle(
        particleSystem,
        particleSystem.activeParticleIndices[i]
      );
    }
  },

  tick: (function() {
    const helperPositionVec3 = new THREE.Vector3();

    return function(time, delta) {
      var frame; // current particle system frame
      var fdata; // all particles data in current frame
      var fdataNext; // next frame (for interpolation)
      var useRotation = this.useRotation;
      var frameTime; // time in current frame (for interpolation)
      var relTime; // current particle system relative time (0-1)
      var interpolate; // whether interpolate between frames or not

      for (
        let particleSystemIndex = 0;
        particleSystemIndex < this.particleSystems.length;
        particleSystemIndex++
      ) {
        let particleSystem = this.particleSystems[particleSystemIndex];
        if (!particleSystem.active) {
          continue;
        }

        // if the duration is so short that there's no need to interpolate, don't do it
        // even if user asked for it.
        interpolate =
          this.data.interpolate && this.data.dur / this.numFrames > delta;
        relTime = particleSystem.time / this.data.dur;
        frame = relTime * this.numFrames;
        fdata = this.framedata[Math.floor(frame)];
        if (interpolate) {
          frameTime = frame - Math.floor(frame);
          fdataNext =
            frame < this.numFrames - 1
              ? this.framedata[Math.floor(frame) + 1]
              : null;
        }

        for (
          let activeParticleIndex = 0;
          activeParticleIndex < particleSystem.activeParticleIndices.length;
          activeParticleIndex++
        ) {

          let particleIndex =
            particleSystem.activeParticleIndices[activeParticleIndex];
          let rotation = useRotation && fdata[particleIndex].rotation;

          // TODO: Add vertex position to original position to all vertices of plane...
          if (!fdata[particleIndex].alive) {
            // Hide plane off-screen when not alive.
            transformPlane(
              particleIndex,
              particleSystem.mesh.geometry,
              this.originalVertexPositions,
              OFFSCREEN_VEC3
            );
            continue;
          }

          if (interpolate && fdataNext && fdataNext[particleIndex].alive) {
            helperPositionVec3.lerpVectors(
              fdata[particleIndex].position,
              fdataNext[particleIndex].position,
              frameTime
            );
            transformPlane(
              particleIndex,
              particleSystem.mesh.geometry,
              this.originalVertexPositions,
              helperPositionVec3,
              rotation
            );
          } else {
            transformPlane(
              particleIndex,
              particleSystem.mesh.geometry,
              this.originalVertexPositions,
              fdata[particleIndex].position,
              rotation
            );
          }
        }

        particleSystem.time += delta;
        if (particleSystem.time >= this.data.dur) {
          if (particleSystem.loopCount < particleSystem.loopTotal) {
            this.el.emit('particleplayerloop', null, false);
            this.doLoop(particleSystem);
          } else {
            this.el.emit('particleplayerfinished', null, false);
            particleSystem.active = false;
            particleSystem.mesh.visible = false;
          }
          continue;
        }
      }
    };
  })(),

  _transformPlane: transformPlane
});

// Use triangle geometry as a helper for rotating.
const tri = (function() {
  const tri = new THREE.Geometry();
  tri.vertices.push(new THREE.Vector3());
  tri.vertices.push(new THREE.Vector3());
  tri.vertices.push(new THREE.Vector3());
  tri.faces.push(new THREE.Face3(0, 1, 2));
  return tri;
})();

/**
 * Faces of a plane are v0, v2, v1 and v2, v3, v1.
 * Positions are 12 numbers: [v0, v1, v2, v3].
 */
function transformPlane(
  particleIndex,
  geometry,
  originalArray,
  position,
  rotation
) {
  const array = geometry.attributes.position.array;
  const index = particleIndex * NUM_PLANE_POSITIONS;

  // Calculate first face (0, 2, 1).
  tri.vertices[0].set(
    originalArray[index + 0],
    originalArray[index + 1],
    originalArray[index + 2]
  );
  tri.vertices[1].set(
    originalArray[index + 3],
    originalArray[index + 4],
    originalArray[index + 5]
  );
  tri.vertices[2].set(
    originalArray[index + 6],
    originalArray[index + 7],
    originalArray[index + 8]
  );
  if (rotation) {
    tri.rotateX(rotation.x);
    tri.rotateY(rotation.y);
    tri.rotateZ(rotation.z);
  }
  tri.vertices[0].add(position);
  tri.vertices[1].add(position);
  tri.vertices[2].add(position);
  array[index + 0] = tri.vertices[0].x;
  array[index + 1] = tri.vertices[0].y;
  array[index + 2] = tri.vertices[0].z;
  array[index + 3] = tri.vertices[1].x;
  array[index + 4] = tri.vertices[1].y;
  array[index + 5] = tri.vertices[1].z;
  array[index + 6] = tri.vertices[2].x;
  array[index + 7] = tri.vertices[2].y;
  array[index + 8] = tri.vertices[2].z;

  // Calculate second face (2, 3, 1) just for the last vertex.
  tri.vertices[0].set(
    originalArray[index + 3],
    originalArray[index + 4],
    originalArray[index + 5]
  );
  tri.vertices[1].set(
    originalArray[index + 6],
    originalArray[index + 7],
    originalArray[index + 8]
  );
  tri.vertices[2].set(
    originalArray[index + 9],
    originalArray[index + 10],
    originalArray[index + 11]
  );
  if (rotation) {
    tri.rotateX(rotation.x);
    tri.rotateY(rotation.y);
    tri.rotateZ(rotation.z);
  }
  tri.vertices[0].add(position);
  tri.vertices[1].add(position);
  tri.vertices[2].add(position);
  array[index + 9] = tri.vertices[2].x;
  array[index + 10] = tri.vertices[2].y;
  array[index + 11] = tri.vertices[2].z;

  geometry.attributes.position.needsUpdate = true;
}
module.exports.transformPlane = transformPlane;

function copyArray(dest, src) {
  dest.length = 0;
  for (let i = 0; i < src.length; i++) {
    dest[i] = src[i];
  }
}


/***/ })
/******/ ]);