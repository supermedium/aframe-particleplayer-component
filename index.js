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
    dur: {default: 3000, type: 'float'},
    delay: {default: 0, type: 'float'},
    loop: {default: false},
    scale: {default: 1.0, type: 'float'},
    pscale: {default: 1.0, type: 'float'},
    cache: {default: 5, type: 'int'}, // number of whole particle systems to cache
    shader: {default: 'flat', oneOf: ['flat', 'standard']},
    color: {default: '#f00', type: 'color'},
    additive: {default: false},
    img: {type: 'selector'},
  },

  init: function () {
    var data = this.data;
    this.framedata = {}; 
    this.numParticles = 0;
    this.cache = null; // object3Ds to reuse
    this.material = null;
    this.geometry = null;
  },

  update: function(oldData) {
    var Shader;
    var params;
    var data = this.data;

    this.loadParticlesJSON(data.src, data.scale);

    params = {
      color: new THREE.Color(data.color),
      side: THREE.DoubleSide,
      blending: data.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      map: data.img ? new THREE.TextureLoader().load(this.data.img.src) : null
    };

    if (data.shader === 'flat') {
      this.material = THREE.MeshBasicMaterial(params);
    } else {
      this.material = THREE.MeshStandardMaterial(params);
    }

    this.geometry = new THREE.PlaneBufferGeometry(0.1 + Math.random() * 0.3, 0.02);
    //this.geometry.rotateX(Math.PI / 2);
    //geometry.translate(0.2, 0, 0);

    this.psGroup = document.createElement('a-entity');
    this.psGroup.id = "__json-particles-" + Math.floor(Math.random()*1000);
    this.el.sceneEl.appendChild(this.psGroup);

    this.loadParticlesJSON(data.src, data.scale[i]);
    this.cacheParticles(data.cache[i] * this.numParticles);
  },

  loadParticlesJSON: function (json, scale) {
    var data = JSON.parse(json.data);
    var p; // particle
    var alive;
    var frames = data.frames;
    var velOffset = data.rotation ? 3 : 0;
    var F = data.precision;

    this.numParticles = frames.length > 0 ? frames[0].length : 0;

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

  cacheParticles: function (cacheSize) {
    var psGroup = this.psGroup.object3D;
    this.cache = [];
    for (var i = 0; i < cacheSize; i++) {
      var p = new THREE.Mesh(this.geometry, this.material);
      psGroup.add(p);
      this.cache.push(p);
    }
  },

  explode: function (position, normal, direction, color) {
    var found = -1;
    var ps;
    var id;
    var oldestTime = Number.MAX_VALUE;
    var material;

    // randomly pick one particle system
    id = this.ids[Math.floor(Math.random() * this.ids.length)]; 
    
    // find available (or oldest) particle system
    for (var i = 0; i < this.cache[id].length; i++) {
      if (this.cache[id][i].active === false){
        found = i;
        break;
      }
      if (this.cache[id][i].lastFrame < oldestTime) {
        found = i;
        oldestTime = this.cache[id][i].lastFrame;
      }
    }

    ps = this.cache[id][found];
    material = color === 'red' ? this.material : this.blueMaterial;

    direction.multiplyScalar(9999);

    ps.object3D.traverse(o => o.material = material);
    ps.active = true;
    ps.object3D.visible = true;
    ps.object3D.position.copy(position);
    ps.object3D.up.copy(normal);
    ps.object3D.lookAt(direction);
    ps.object3D.rotation.z
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

    for (id in this.cache){
      for (i = 0; i < this.cache[id].length; i++) {
        ps = this.cache[id][i];
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
  }

});
