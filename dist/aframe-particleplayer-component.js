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
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {

/* global AFRAME */

if (typeof AFRAME === 'undefined') {
  throw new Error('Component attempted to register before AFRAME was available.');
}

/**
 * Particle Player component for A-Frame.
 */
AFRAME.registerComponent('particleplayer', {
 multiple: true,
  schema: {
    src: {type: 'selector'},
    on: {default: 'init'},
    count: {default: '100%'},
    dur: {default: 1000, type: 'int'},
    loop: {default: 'false'},
    delay: {default: 0, type: 'int'},
    scale: {default: 1.0, type: 'float'},
    pscale: {default: 1.0, type: 'float'},
    protation: {type: 'vec3'},
    cache: {default: 5, type: 'int'}, // number of simultaneous particle systems
    shader: {default: 'flat', oneOf: ['flat', 'lambert', 'phong', 'standard']},
    color: {default: '#fff', type: 'color'},
    blending: {default: 'additive', oneOf: ['normal', 'additive', 'multiply', 'substractive']},
    img: {type: 'selector'},
    interpolate: {default: false}
  },

  init: function () {
    this.framedata = null;
    this.restPositions = null; // position at first frame each particle is alive
    this.restRotations = null; 
    this.numFrames = 0;
    this.numParticles = 0; // total number of particles per system
    this.count = 0; // actual number of particles to spawn per event (data.count)
    this.systems = null;
    this.cache = null;
    this.material = null;
    this.geometry = null;
    this.frame = 0;
    this.lastFrame = 0;
    this.msPerFrame = 0;
    this.useRotation = false;
    this.sprite_rotation = false;
    this.protation = false;
    this.allParticlesEl = null;

    // temporal vars for preventing gc
    this.v = new THREE.Vector3();
    this.indexPool = null;
  },

  update: function(oldData) {
    var params;
    const BLENDINGS = {
      'normal': THREE.NormalBlending,
      'additive': THREE.AdditiveBlending,
      'substractive': THREE.SubstractiveBlending,
      'multiply': THREE.MultiplyBlending
    };
    const SHADERS = {
      'flat': THREE.MeshBasicMaterial,
      'lambert': THREE.MeshLambertMaterial,
      'phong': THREE.MeshPhongMaterial,
      'standard': THREE.MeshStandardMaterial
    }
    var data = this.data;

    if (oldData.on !== data.on) {
      if (oldData.on) { this.el.removeEventListener(oldData.on, this.start)}
      if (data.on !== 'play') {
        this.el.addEventListener(data.on, this.start.bind(this));
      }
    }

    this.loadParticlesJSON(data.src, data.scale);

    this.numFrames = this.framedata.length;
    this.numParticles = this.numFrames > 0 ? this.framedata[0].length : 0;

    if (data.count[data.count.length-1] == '%') {
      this.count = Math.floor(parseInt(data.count) * this.numParticles / 100.0);
    } else { 
      this.count = parseInt(data.count); 
    }
    this.count = Math.min(this.numParticles, Math.max(0, this.count));

    this.msPerFrame = data.dur / this.numFrames;
 
    this.indexPool = new Array(this.numParticles);


    params = {
      color: new THREE.Color(data.color),
      side: THREE.DoubleSide,
      blending: BLENDINGS[data.blending],
      map: data.img ? new THREE.TextureLoader().load(data.img.src) : null,
      depthWrite: false,
      opacity: data.opacity,
      transparent: data.img || data.blending !== 'normal' || data.opacity < 1 ? true : false
    };

    if (SHADERS[data.shader] !== undefined) {
      this.material = new SHADERS[data.shader](params);
    } else {
      this.material = new SHADERS['flat'](params);
    }
    
    var ratio = data.img ? data.img.width / data.img.height : 1;
    this.geometry = new THREE.PlaneBufferGeometry(0.1 * ratio * data.pscale, 0.1 * data.pscale);

    if (!this.allParticlesEl) {
      this.allParticlesEl = document.createElement('a-entity');
      this.allParticlesEl.id = "__json-particles-" + Math.floor(Math.random()*1000);
      this.el.appendChild(this.allParticlesEl);
    }

    if (this.sprite_rotation !== false){
      this.geometry.rotateX(this.sprite_rotation.x);
      this.geometry.rotateY(this.sprite_rotation.y);
      this.geometry.rotateZ(this.sprite_rotation.z);
    }
    else {
      this.geometry.rotateX(this.data.protation.x * Math.PI / 180);
      this.geometry.rotateY(this.data.protation.y * Math.PI / 180);
      this.geometry.rotateZ(this.data.protation.z * Math.PI / 180);
    }

    this.cacheParticles(data.cache);

    if (data.on === 'init') {
      this.start();
    }
  },

  loadParticlesJSON: function (json, scale) {
    var data = JSON.parse(json.data);
    var p; // particle
    var alive;
    var frames = data.frames;
    var velOffset = data.rotation ? 3 : 0;
    var F = data.precision;
    this.restPositions = [];
    this.restRotations = []; 

    this.useRotation = data.rotation;

    if (data.sprite_rotation !== false) {
      this.sprite_rotation = new THREE.Vector3();
      this.sprite_rotation.x = data.sprite_rotation[0] / F;
      this.sprite_rotation.y = data.sprite_rotation[1] / F;
      this.sprite_rotation.z = data.sprite_rotation[2] / F;
    }
    else { this.sprite_rotation = false; }

    this.framedata = new Array(frames.length);
    for (var f = 0; f < frames.length; f++) {
      this.framedata[f] = new Array(frames[f].length);
      for (var i = 0; i < frames[f].length; i++) {
        p = frames[f][i]; // data of particle i in frame f
        alive = p !== 0;

        this.framedata[f][i] = {
          position: alive ? 
            new THREE.Vector3(p[0] / F * scale, p[1] / F * scale, p[2] / F * scale) :
            null,
          alive: alive
        };

        if (data.rotation) {
          this.framedata[f][i].rotation = alive ? 
            new THREE.Euler(p[3] / F, p[4] / F, p[5] / F) :
            null;
        }

        if (alive && this.restPositions[i] === undefined) {
          this.restPositions[i] = this.framedata[f][i].position;
          if (data.rotation) {
            this.restRotations[i] = this.framedata[f][i].rotation;
          }
        }
      }
    }
  },

  cacheParticles: function (numParticleSystems) {
    var i;
    var p;
    var allParticles;
    var loop = parseInt(this.data.loop);
    
    //remove old particles
    allParticles = this.allParticlesEl.object3D;
    while (allParticles.children.length) {
      allParticles.remove(allParticles.children[0]);
    }

    this.cache = [];

    if (isNaN(loop)) { 
      loop = this.data.loop === 'true' ? Number.MAX_VALUE : 0; 
    }

    for (i = 0; i < numParticleSystems; i++) {
      var ps = {
        active: false,
        loopTotal: loop,
        loopCount: 0,
        time: 0,
        activeParticles: new Array(this.count),
        object3D: new THREE.Object3D()
      };

      ps.object3D.visible = false;

      for (p = 0; p < this.numParticles; p++) {
        var part = new THREE.Mesh(this.geometry, this.material);
        part.visible = false;
        ps.object3D.add(part);
        if (p < this.count) {
          ps.activeParticles[p] = p;
        }
      }

      allParticles.add(ps.object3D);
      this.cache.push(ps);
    }
  },

  start: function (evt) {
    if (this.data.delay > 0) {
      setTimeout( () => this.startAfterDelay(evt), this.data.delay);
    } else {
      this.startAfterDelay(evt);
    }
  },

  startAfterDelay: function (evt) { 
    // position, rotation
    var found = -1;
    var ps;
    var id;
    var oldestTime = 0;
    var position = evt ? evt.detail['position'] : null;
    var rotation = evt ? evt.detail['rotation'] : null;

    if (!(position instanceof THREE.Vector3)) { position = new THREE.Vector3(); }
    if (!(rotation instanceof THREE.Euler)) { rotation = new THREE.Euler(); }

    // find available (or oldest) particle system
    for (var i = 0; i < this.cache.length; i++) {
      if (this.cache[i].active === false){
        found = i;
        break;
      }
      if (this.cache[i].time > oldestTime) {
        found = i;
        oldestTime = this.cache[i].time;
      }
    }

    ps = this.cache[found];

    ps.active = true;
    ps.loopCount = 1;
    ps.object3D.visible = true;
    ps.object3D.position.copy(position);
    ps.object3D.rotation.copy(rotation);
    ps.time = 0;

    this.resetParticles(ps);
  },

  doLoop: function (ps) {
    ps.loopCount++;
    ps.frame = -1;
    ps.time = 0;
    this.resetParticles(ps);
  },

  resetParticle: function (part, i) {
    part.visible = false;
    if (this.restPositions[i]) { part.position.copy(this.restPositions[i]); }
    if (this.useRotation){
      if (this.restRotations[i]) { part.rotation.copy(this.restRotations[i]); }
    } else {
      //part.lookAt(this.camera.position); // lookAt does not support rotated or translated parents! :_(
    }
  },

/**
 * When starting or finishing (looping) animation, this resets particles
 * to their initial position and, if user asked for replaying less than 100%
 * of particles, randomly choose them.
 */
  resetParticles: function (ps) {
    var i;
    var pi;
    var part;
    var rand;
    var aux;

    // no picking, just hide and reset
    if (this.count === this.numParticles) {
      for (i = 0; i < this.numParticles; i++) { 
        this.resetParticle(ps.object3D.children[i], i);
      }
      return;
    }

    // hide particles from last animation and initialize indexPool
    for (i = 0; i < this.numParticles; i++) { 
      if (i < this.count) {
        ps.object3D.children[ ps.activeParticles[i] ].visible = false;
      }
      this.indexPool[i] = i;
    }

    // scramble indexPool
    for (i = 0; i < this.count - 1; i++) { 
      rand = i + Math.floor(Math.random() * (this.numParticles - i));
      ps.activeParticles[i] = this.indexPool[rand];
      this.indexPool[rand] = this.indexPool[i];
      this.resetParticle(ps.object3D.children[ps.activeParticles[i]], i);
    }
  },

  tick: function (time, delta) {
    var j, i; // loop vars
    var ps; // current particle system
    var frame; // current particle system frame
    var particle; // current particle
    var pi; // index of current particle
    var fdata; // all particles data in current frame
    var fdataNext; // next frame (for interpolation)
    var useRotation = this.useRotation;
    var frameTime; // time in current frame (for interpolation)
    var relTime; // current particle system relative time (0-1)
    var interpolate; // whether interpolate between frames or not

    for (i = 0; i < this.cache.length; i++) {
      ps = this.cache[i];
      if (!ps.active) continue;
      
      // if the duration is so short that there's no need to interpolate, don't do it
      // even if user asked for it.
      interpolate = this.data.interpolate && this.data.dur / this.numFrames > delta;

      relTime = ps.time / this.data.dur;
      frame = relTime * this.numFrames;
      fdata = this.framedata[Math.floor(frame)];
      if (interpolate) {
        frameTime = frame - Math.floor(frame);
        fdataNext = frame < this.numFrames - 1 ? this.framedata[Math.floor(frame) + 1] : null;
      }
      for (j = 0; j < ps.activeParticles.length; j++) {
        pi = ps.activeParticles[j];
        particle = ps.object3D.children[pi];
        if (!fdata[pi].alive){
          particle.visible = false;
          continue;
        } 

        particle.visible = true;

        if (interpolate && fdataNext && fdataNext[pi].alive) {
          particle.position.lerpVectors(fdata[pi].position, fdataNext[pi].position, frameTime);
        } else {
          particle.position.copy(fdata[pi].position);
        }

        if (useRotation) {
          particle.rotation.copy(fdata[pi].rotation);
        }
      }

      ps.time += delta;
      if (ps.time >= this.data.dur) {
        if (ps.loopCount < ps.loopTotal) {
          this.el.emit('loop');
          this.doLoop(ps);
        } else {
          this.el.emit('finished');
          ps.active = false;
          ps.object3D.visible = false;
        }
        continue;
      }
    }
  }

});


/***/ })
/******/ ]);