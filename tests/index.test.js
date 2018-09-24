/* global assert, setup, suite, test */
require('aframe');
require('../index.js');
var entityFactory = require('./helpers').entityFactory;

const NUM_VERTICES = 4;
const ITEM_SIZE = 3;

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

  suite('createParticles', function () {
    test('creates merged geometry', function () {
      const geo = component.particleSystems[0].mesh.geometry;
      assert.ok(geo);

      assert.equal(component.particleSystems.length, component.data.cache);
      assert.equal(geo.attributes.position.array.length,
                   component.numParticles * NUM_VERTICES * ITEM_SIZE);
    });
  });

  suite('transformPlane', function () {
    var geometry;
    var originalPositions;
    var positions;

    setup(() => {
      geometry = THREE.BufferGeometryUtils.mergeBufferGeometries([
        new THREE.PlaneBufferGeometry(),
        new THREE.PlaneBufferGeometry(),
        new THREE.PlaneBufferGeometry()
      ]);
      positions = geometry.attributes.position.array;

      originalPositions = positions.slice();

      assert.equal(positions.length, 36);
    });

    test('does not change on zero position and rotation', function () {
      component._transformPlane(0, geometry, originalPositions,
                               new THREE.Vector3(0, 0, 0));
      originalPositions.forEach((n, i) => {
        assert.equal(positions[i], n, i);
      });
    });

    test('can change first plane position', function () {
      component._transformPlane(0, geometry, originalPositions,
                               new THREE.Vector3(1.1, 2.2, 3.3));
      for (let i = 0; i < 12; i += 3) {
        positions[i] = originalPositions[i] + 1.1;
        positions[i + 1] = originalPositions[i + 1] + 2.2;
        positions[i + 2] = originalPositions[i + 2] + 3.3;
      }
      for (let i = 12; i < 36; i += 3) {
        positions[i] = originalPositions[i];
        positions[i + 1] = originalPositions[i + 1];
        positions[i + 2] = originalPositions[i + 2];
      }
    });

    test('can change indexed plane position', function () {
      component._transformPlane(1, geometry, originalPositions,
                               new THREE.Vector3(1.1, 2.2, 3.3));
      for (let i = 12; i < 24; i += 3) {
        assertAlmostEqual(positions[i], originalPositions[i] + 1.1);
        assertAlmostEqual(positions[i + 1], originalPositions[i + 1] + 2.2);
        assertAlmostEqual(positions[i + 2], originalPositions[i + 2] + 3.3);
      }
      for (let i = 0; i < 12; i += 3) {
        assertAlmostEqual(positions[i], originalPositions[i]);
        assertAlmostEqual(positions[i + 1], originalPositions[i + 1]);
        assertAlmostEqual(positions[i + 2], originalPositions[i + 2]);
      }
      for (let i = 24; i < 36; i += 3) {
        assertAlmostEqual(positions[i], originalPositions[i]);
        assertAlmostEqual(positions[i + 1], originalPositions[i + 1]);
        assertAlmostEqual(positions[i + 2], originalPositions[i + 2]);
      }
    });

    test('can rotate X', function () {
      component._transformPlane(0, geometry, originalPositions,
                               new THREE.Vector3(0, 0, 0),
                               new THREE.Euler(Math.PI / 4, 0, 0));
      assert.shallowDeepEqual(positions.slice(0, 12), [
        -0.5,
        0.3535533845424652,
        0.3535533845424652,
        0.5,
        0.3535533845424652,
        0.3535533845424652,
        -0.5,
        -0.3535533845424652,
        -0.3535533845424652,
        0.5,
        -0.3535533845424652,
        -0.3535533845424652,
      ]);
    });

    test('can rotate then position', function () {
      component._transformPlane(0, geometry, originalPositions,
                               new THREE.Vector3(1, 2, 3),
                               new THREE.Euler(Math.PI / 4, 0, 0));

      assertAlmostArray(positions.slice(0, 12), [
        -0.5 + 1,
        0.3535533845424652 + 2,
        0.3535533845424652 + 3,
        0.5 + 1,
        0.3535533845424652 + 2,
        0.3535533845424652 + 3,
        -0.5 + 1,
        -0.3535533845424652 + 2,
        -0.3535533845424652 + 3,
        0.5 + 1,
        -0.3535533845424652 + 2,
        -0.3535533845424652 + 3,
      ]);
    });
  });
});

function assertAlmostArray(x, y) {
  x = x.map(n => n.toFixed(4));
  y = x.map(n => n.toFixed(4));
  assert.shallowDeepEqual(x, y);
}

function assertAlmostEqual(x, y) {
  assert.equal(x.toFixed(4), y.toFixed(4));
}
