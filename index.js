/* global AFRAME */

if (typeof AFRAME === 'undefined') {
  throw new Error('Component attempted to register before AFRAME was available.');
}

/**
 * Particle Player component for A-Frame.
 */
AFRAME.registerComponent('particleplayer', {
  schema: {
    data: {type: 'selector'},
    on: {type: 'string'},
    dur: {default: 1000},
    delay: {default: 0},
    count: {type: 'int', default: -1},
    randomPick: {default: true},
    loop: {default: false}
  },

  init: function () {
    if (this.el.children.length == 0) { this.createDefaultGeometry(); }
    else { this.createGeometriesFromChildren() }
  },

  /*
    Entity has no children, let's create a simple small plane for particles
  */
  createDefaultGeometry: function () {
    var material = new THREE.MeshPhongMaterial({
      color: 0xFF0000,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    var geometry = new THREE.PlaneBufferGeometry(0.01, 0.01);
    //geometry.rotateX(Math.PI / 2);
    this.geometries = [new THREE.Mesh(geometry, material)];
  },

  /*
    Pick entity children entities and clone their geometries for using as particles
  */
  createGeometriesFromChildren: function () {
    var children = this.el.children;
    this.geometries = [];
    for (var i = 0; i < children.length; i++) {
      children[i].addEventListener('loaded', this.childrenGeometryReady.bind(this));
    }
  },

  /*
    Previous method has to wait until geometries are ready. This is where things get done.
  */
  childrenGeometryReady: function (evt) {
    console.log('>>>>>>', evt);
    evt.target.removeEventListener('loaded', this.childrenGeometryReady);
    this.geometries.push(evt.detail.model.clone());
    evt.target.setAttribute('visible', false);
  },





});



