## aframe-particleplayer-component

[![Version](http://img.shields.io/npm/v/aframe-particleplayer-component.svg?style=flat-square)](https://npmjs.org/package/aframe-particleplayer-component)
[![License](http://img.shields.io/npm/l/aframe-particleplayer-component.svg?style=flat-square)](https://npmjs.org/package/aframe-particleplayer-component)

Play particle systems from cached files

For [A-Frame](https://aframe.io).

### API

| Property | Description | Default Value |
| -------- | ----------- | ------------- |
|          |             |               |

### Installation

#### Browser

Install and use by directly including the [browser files](dist):

```html
<head>
  <title>My A-Frame Scene</title>
  <script src="https://aframe.io/releases/0.8.2/aframe.min.js"></script>
  <script src="https://unpkg.com/aframe-particleplayer-component/dist/aframe-particleplayer-component.min.js"></script>
</head>

<body>
  <a-scene>
    <a-entity particleplayer="foo: bar"></a-entity>
  </a-scene>
</body>
```

#### npm

Install via npm:

```bash
npm install aframe-particleplayer-component
```

Then require and use.

```js
require('aframe');
require('aframe-particleplayer-component');
```
