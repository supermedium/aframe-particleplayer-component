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
      console.log(component.framedata);
    });
  });
});
