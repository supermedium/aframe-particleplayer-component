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
    on: {default: 'start'},
//    count: {default: 'all'},
//    dur: {default: 3000, type: 'int'},
//    loop: {default: false},
    delay: {default: 0, type: 'int'},
    scale: {default: 1.0, type: 'float'},
    pscale: {default: 1.0, type: 'float'},
    cache: {default: 5, type: 'int'}, // number of simultaneous particle systems
    shader: {default: 'flat', oneOf: ['flat', 'standard']},
    color: {default: '#f00', type: 'color'},
    additive: {default: false},
    img: {type: 'selector'},
  },

  init: function () {
    this.framedata = null; 
    this.numParticles = 0; // total number of particles per system
    this.count = 0; // actual number of particles to spawn per event (data.count)
    this.systems = null;
    this.cache = null;
    this.material = null;
    this.geometry = null;
    this.frame = 0;
    this.lastFrame = 0;
    this.msPerFrame = 0;
  },

  update: function(oldData) {
    var params;
    var data = this.data;


    if (oldData.on !== data.on) {
      if (oldData.on) { this.el.removeEventListener(oldData.on, this.start)}
      this.el.addEventListener(data.on, this.start.bind(this));
    }

    this.loadParticlesJSON(data.src, data.scale);

    this.numParticles = this.framedata.length > 0 ? this.framedata[0].length : 0;

    if (data.count !== 'all') {
      if (data.count[data.count.length-1] == '%') {
        this.count = Math.floor(parseInt(data.count) * this.numParticles / 100.0);
      } else { this.count = parseInt(data.count); }
    } else { this.count = this.numParticles; }

    this.msPerFrame = data.dur / this.framedata.length;

    params = {
      color: new THREE.Color(data.color),
      side: THREE.DoubleSide,
      blending: data.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      map: data.img ? new THREE.TextureLoader().load(data.img.src) : null,
      transparent: data.img ? true : false
    };

    if (data.shader === 'flat') {
      this.material = new THREE.MeshBasicMaterial(params);
    } else {
      this.material = new THREE.MeshStandardMaterial(params);
    }
    
    var ratio = data.img ? data.img.width / data.img.height : 1;
    this.geometry = new THREE.PlaneBufferGeometry(0.1 * ratio * data.pscale, 0.1 * data.pscale);
    //this.geometry.rotateX(Math.PI / 2);
    //geometry.translate(0.2, 0, 0);

    this.allParticlesEl = document.createElement('a-entity');
    this.allParticlesEl.id = "__json-particles-" + Math.floor(Math.random()*1000);
    this.el.sceneEl.appendChild(this.allParticlesEl);

    this.loadParticlesJSON(data.src, data.scale);
    this.cacheParticles(data.cache);
  },

  loadParticlesJSON: function (json, scale) {
    var data = JSON.parse(json.data);
    var p; // particle
    var alive;
    var frames = data.frames;
    var velOffset = data.rotation ? 3 : 0;
    var F = data.precision;

    this.framedata = new Array(frames.length);
    for (var f = 0; f < frames.length; f++) {
      this.framedata[f] = new Array(frames[f].length);
      for (var i = 0; i < frames[f].length; i++) {
        p = frames[f][i]; // data of particle i in frame f
        alive = p !== 0;
        this.framedata[f][i] = {
          pos: alive ? new THREE.Vector3(p[0] / F * scale, p[1] / F * scale, p[2] / F * scale): null,
          alive: alive
        };
        if (data.rotation) {
          this.framedata[f][i].rot = alive ? new THREE.Vector3(p[3] / F, p[4] / F, p[5] / F): null;
        }
        if (data.velocity) {
          this.framedata[f][i].vel = alive ? new THREE.Vector3(p[velOffset + 3] / F, p[velOffset + 4] / F, p[velOffset + 5] / F): null;
        }
      }
    }
  },

  cacheParticles: function (numParticleSystems) {
    var i;
    var p;
    this.cache = [];

    for (i = 0; i < numParticleSystems; i++) {

      var ps = {
        active: false,
        frame: 0,
        lastFrameTime: 0,
        object3D: new THREE.Object3D()
      };
      
      ps.object3D.visible = false;

      for (p = 0; p < this.numParticles; p++) {
        var part = new THREE.Mesh(this.geometry, this.material);
        ps.object3D.add(part);
      }

      this.allParticlesEl.object3D.add(ps.object3D);
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
    var oldestTime = Number.MAX_VALUE;
    var position = evt.detail['position'];
    var rotation = evt.detail['rotation'];

    if (!(position instanceof THREE.Vector3)) { position = new THREE.Vector3(); }
    if (!(rotation instanceof THREE.Euler)) { rotation = new THREE.Euler(); }

    // find available (or oldest) particle system
    for (var i = 0; i < this.cache.length; i++) {
      if (this.cache[i].active === false){
        found = i;
        break;
      }
      if (this.cache[i].lastFrame < oldestTime) {
        found = i;
        oldestTime = this.cache[i].lastFrame;
      }
    }

    ps = this.cache[found];

    ps.active = true;
    ps.object3D.visible = true;
    ps.object3D.position.copy(position);
    ps.object3D.rotation.copy(rotation);
    ps.lastFrame = 0;
    ps.frame = -1;
  },

  tick: function (time, delta) {
    var j, i; // loop vars
    var ps; // current particle system
    var p; // current particle
    var psfdata; // current particle system frame data
    var pfdata; // current particle frame data
    var ftime; // current particle system frame time (0-1)
    var numParticles; // particles in current particle system

    for (i = 0; i < this.cache.length; i++) {
      ps = this.cache[i];
      if (!ps.active) continue;
      if (time - ps.lastFrame >= ps.msPerFrame) {
        ps.frame++;
        if (ps.frame === this.framedata[id].length) {
          ps.active = false;
          ps.object3D.visible = false;
          continue;
        }

        ps.lastFrame = time;

        fdata = this.framedata[id][ps.frame];
        ftime = ps.frame / this.framedata[id].length;

        for (j = 0; j < fdata.length; j++) {
          p = ps.object3D.children[j];
          pfdata = fdata[j];
          p.position.set(pfdata.p[0], pfdata.p[1], pfdata.p[2]);
          p.rotation.set(pfdata.r[0], pfdata.r[1], pfdata.r[2]);
          p.scale.x = 1.0 - ftime;
        }
      }
    }
  }

});
