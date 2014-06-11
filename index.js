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
  this.stale = {};
  this.removed = [];

  var content;
  try {
    content = fs.readFileSync(this.file, 'utf-8');
  } catch (err) {
    if (err.code !== 'ENOENT') {
      debug('init error');
      setImmediate(this.onerror.bind(this, err));
    }
  }

  this.parse(content);
  setImmediate(this.emit.bind(this, 'change'));

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
    if (err && err.code !== 'ENOENT') return self.emit('error', err);
    if (err && err.code === 'ENOENT') debug('config file removed');
    self.parse(content);
    self.emit('change');
  });
};

Config.prototype.parse = function (content) {
  var data = {};
  if (content) {
    try {
      data = JSON.parse(content);
    } catch (err) {
      debug('parse json content error');
      return this.emit('error', err);
    }
  }

  this.stale = this.data;
  this.data = data;
  this.removed = substract(this.data, this.stale);
};

Config.prototype.onerror = function(err) {
  if (err) this.emit('error', err);
};

Config.prototype.close =
Config.prototype.destroy = function() {
  this.watcher && this.watcher.close();
};

function substract(fresh, stale) {
  var removed = [];
  for (var key in stale) {
    if (fresh[key] === undefined) {
      removed.push(key);
    }
  }

  return removed;
}
