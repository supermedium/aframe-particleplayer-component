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
    count: {default: '100%'}, // not used yet
    dur: {default: 1000, type: 'int'},
    loop: {default: 'false'}, // not used yet
    delay: {default: 0, type: 'int'},
    scale: {default: 1.0, type: 'float'},
    pscale: {default: 1.0, type: 'float'},
    cache: {default: 5, type: 'int'}, // number of simultaneous particle systems
    shader: {default: 'flat', oneOf: ['flat', 'standard']},
    color: {default: '#fff', type: 'color'},
    additive: {default: false},
    img: {type: 'selector'},
    interpolate: {default: false}
  },

  init: function () {
    this.framedata = null;
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
  },

  update: function(oldData) {
    var params;
    var data = this.data;


    if (oldData.on !== data.on) {
      if (oldData.on) { this.el.removeEventListener(oldData.on, this.start)}
      this.el.addEventListener(data.on, this.start.bind(this));
    }

    this.loadParticlesJSON(data.src, data.scale);

    this.numFrames = this.framedata.length;
    this.numParticles = this.numFrames > 0 ? this.framedata[0].length : 0;

    if (data.count[data.count.length-1] == '%') {
      this.count = Math.floor(parseInt(data.count) * this.numParticles / 100.0);
    } else { 
      this.count = parseInt(data.count); 
    }

    this.msPerFrame = data.dur / this.numFrames;

    params = {
      color: new THREE.Color(data.color),
      side: THREE.DoubleSide,
      blending: data.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      map: data.img ? new THREE.TextureLoader().load(data.img.src) : null,
      depthWrite: false,
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

    this.useRotation = data.rotation;

    this.framedata = new Array(frames.length);
    for (var f = 0; f < frames.length; f++) {
      this.framedata[f] = new Array(frames[f].length);
      for (var i = 0; i < frames[f].length; i++) {
        p = frames[f][i]; // data of particle i in frame f
        alive = p !== 0;
        this.framedata[f][i] = {
          position: alive ? new THREE.Vector3(p[0] / F * scale, p[1] / F * scale, p[2] / F * scale): null,
          alive: alive
        };
        if (data.rotation) {
          this.framedata[f][i].rotation = alive ? new THREE.Vector3(p[3] / F, p[4] / F, p[5] / F): null;
        }
        if (data.velocity) {
          this.framedata[f][i].velocity = alive ? new THREE.Vector3(p[velOffset + 3] / F, p[velOffset + 4] / F, p[velOffset + 5] / F): null;
        }
      }
    }
  },

  cacheParticles: function (numParticleSystems) {
    var i;
    var p;
    var loop = parseInt(this.data.loop);
    this.cache = [];

    if (isNaN(loop)) { 
      loop = this.data.loop === 'true' ? Number.MAX_VALUE : 0; 
    }

    for (i = 0; i < numParticleSystems; i++) {
      var ps = {
        active: false,
        frame: 0,
        loopTotal: loop,
        loopCount: 0,
        lastFrameTime: 0,
        activeParticles: null,
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
    var oldestTime = 0;
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
      if (this.cache[i].lastFrame > oldestTime) {
        found = i;
        oldestTime = this.cache[i].lastFrame;
      }
    }

    ps = this.cache[found];

    ps.active = true;
    ps.loopCount = 1;
    ps.object3D.visible = true;
    ps.object3D.position.copy(position);
    ps.object3D.rotation.copy(rotation);
    ps.lastFrame = 0;
    ps.frame = -1;

    ps.activeParticles = this.pickRandomParticles();
    this.hideSystemParticles(ps);
  },

  hideSystemParticles: function (ps) {
    for (var i = 0; i < this.numParticles; i++) {
      ps.object3D.children[i].visible = false;
    }
  },

  doLoop: function (ps) {
    ps.loopCount++;
    ps.frame = -1;
    ps.lastFrame = 0;
    ps.activeParticles = this.pickRandomParticles();
    this.hideSystemParticles(ps);
  },

  pickRandomParticles: function () {
    var all = new Array(this.numParticles);
    var arr = new Array(this.count);
    var i;
    for (i = 0; i < this.numParticles; i++) { all[i] = i; }
    if (this.count == this.numParticles) { return all; }
    for (i = 0; i < this.count; i++) {
      arr[i] = all.splice(Math.floor(Math.random() * all.length), 1)[0];
    }
    return arr.sort((a, b) => a - b);
  },

  tick: function (time, delta) {
    var j, i; // loop vars
    var ps; // current particle system
    var particle; // current particle
    var pi; // index of current particle
    var fdata; // all particles data in current frame
    var useRotation = this.useRotation;
    var deltaTime;
    //var ftime; // current particle system frame time (0-1)

    for (i = 0; i < this.cache.length; i++) {
      ps = this.cache[i];
      if (!ps.active) continue;
      if (time - ps.lastFrame >= this.msPerFrame) {
        if (ps.lastFrame === 0) { ps.frame ++; } 
        else { ps.frame += Math.floor((time - ps.lastFrame) / this.msPerFrame); }

        if (ps.frame >= this.numFrames) {
          if (ps.loopCount < ps.loopTotal) {
            this.doLoop(ps);
          }
          else {
            ps.active = false;
            ps.object3D.visible = false;
          }
          continue;
        }

        ps.lastFrame = time;

        fdata = this.framedata[ps.frame];
        //ftime = ps.frame / this.numFrames;

        for (j = 0; j < ps.activeParticles.length; j++) {
          pi = ps.activeParticles[j];
          particle = ps.object3D.children[pi];
          if (!fdata[pi].alive){
            particle.visible = false;
            continue;
          } 
          particle.visible = true;
          particle.position.copy(fdata[pi].position);
          if (useRotation) {
            particle.rotation.copy(fdata[pi].rotation);
          }
        }
      }
    }
  }

});
