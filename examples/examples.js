AFRAME.registerComponent('trigger', {
  init: function() {
    document.addEventListener('keydown', evt => {
      if (evt.keyCode === 32) { this.trigger(); }
    });
    document.addEventListener('click', () => {
      this.trigger();
    });
  },

  trigger: function() {
    this.el.emit('particleplayerstart', {
      position: new THREE.Vector3(
        (Math.random() - 0.5) * 7,
        Math.random() * 2,
        -5 - Math.random() * 2
      ),
      rotation: new THREE.Euler(Math.random() * 1 - .5, 0, 0)
    });
  }
});
