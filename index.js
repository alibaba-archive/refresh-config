/*!
 * refresh-config - index.js
 * Copyright(c) 2014 dead_horse <dead_horse@qq.com>
 * MIT Licensed
 */

'use strict';

var debug = require('debug')('refresh-config');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var fs = require('fs');
var path = require('path');

/**
 * expose `Config`
 */

module.exports = Config;

function Config(file) {
  if (!(this instanceof Config)) {
    return new Config(file);
  }

  this.file = path.resolve(file);
  this.filename = path.basename(file);
  this.dir = path.dirname(file);
  debug('config base on %s', this.file);

  this.watch();

  this.data = {};
  try {
    var content = fs.readFileSync(this.file, 'utf-8');
    this.data = JSON.parse(content);
  } catch (err) {
    debug('init error');
    setImmediate(this.onerror.bind(this, err));
  }
  this.emit('change', this.data);

  this.onerror = this.onerror.bind(this);
}

util.inherits(Config, EventEmitter);

Config.prototype.watch = function() {
  if (this.watcher) {
    return debug('already has dir watcher');
  }

  this.watcher = fs.watch(this.dir, {
    persistent: true,
    recursive: false
  });
  var self = this;
  this.watcher.on('change', function (event, filename) {
    if (filename !== self.filename) return;
    self.onchange();
  })
  .on('error', this.onerror);
};

Config.prototype.onchange = function () {
  debug('file %s changed', this.file);
  var self = this;

  fs.readFile(self.file, 'utf-8', function (err, content) {
    if (err) {
      if (err.code === 'ENOENT') {
        debug('config file removed');
        self.data = {};
        return self.emit('change', self.data);
      }
      return self.emit('error', err);
    }

    try {
      self.data = JSON.parse(content);
    } catch (err) {
      debug('parse json content error');
      return self.emit('error', err);
    }

    self.emit('change', self.data);
  });
};

Config.prototype.onerror = function(err) {
  if (err) this.emit('error', err);
};

Config.prototype.close =
Config.prototype.destroy = function() {
  this.watcher && this.watcher.close();
};
