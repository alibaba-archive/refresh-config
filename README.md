refresh-config
------------

[![NPM version](https://badge.fury.io/js/refresh-config.svg)](http://badge.fury.io/js/refresh-config)
[![Build Status](https://travis-ci.org/node-modules/refresh-config.svg?branch=master)](https://travis-ci.org/node-modules/refresh-config)

refresh config when config file modified.

## Install

```
npm install refresh-config
```

## Usage

```js
var Config = require('refresh-config');

var config = Config('./config.json');

config.on('error', function (err) {
  console.error(err.stack);
})
config.on('change', function () {
  console.log(config.data); // the new data object
  console.log(config.stale); // the stale object
  console.log(config.removed);  // removed keys
});

```

## License

MIT
