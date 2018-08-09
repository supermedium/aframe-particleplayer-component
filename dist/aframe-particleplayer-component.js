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





/***/ })
/******/ ]);