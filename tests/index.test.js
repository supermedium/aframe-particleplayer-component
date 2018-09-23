/* global assert, setup, suite, test */
require('aframe');
require('../index.js');
var entityFactory = require('./helpers').entityFactory;

suite('particle player', function () {
  var component;
  var el;

  setup(function (done) {
    const json = document.createElement('a-asset-item');
    json.setAttribute('id', 'json');
    json.setAttribute('src', '/base/tests/assets/test.json');

    el = entityFactory({assets: [json]});
    el.addEventListener('componentinitialized', function (evt) {
      if (evt.detail.name !== 'particleplayer') { return; }
      component = el.components.particleplayer;
      done();
    });
    el.addEventListener('loaded', () => {
      el.setAttribute('particleplayer', {
        src: json
      });
    });
  });

  suite('loadParticlesJSON', function () {
    test('loads frameData', function () {
      assert.ok(component.framedata[0][0].position instanceof THREE.Vector3);
      assert.ok(typeof component.framedata[0][0].alive === 'boolean');
      assert.ok(component.framedata[0][0].rotation instanceof THREE.Euler);
    });

    test('loads restPositions', function () {
      assert.equal(component.restPositions.length,
                   component.framedata[0].filter(p => p.alive).length);
      assert.equal(component.restPositions[0].x, component.framedata[0][0].position.x);
      assert.equal(component.restPositions[0].y, component.framedata[0][0].position.y);
      assert.equal(component.restPositions[0].z, component.framedata[0][0].position.z);
    });

    test('loads restRotations', function () {
      assert.equal(component.restRotations.length,
                   component.framedata[0].filter(p => p.alive).length);
      assert.equal(component.restRotations[0].x, component.framedata[0][0].rotation.x);
      assert.equal(component.restRotations[0].y, component.framedata[0][0].rotation.y);
      assert.equal(component.restRotations[0].z, component.framedata[0][0].rotation.z);
    });
  });
});
