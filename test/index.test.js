/*!
 * hot-restart - test/index.test.js
 * Copyright(c) 2014 dead_horse <dead_horse@qq.com>
 * MIT Licensed
 */

'use strict';

/**
 * Module dependencies.
 */

var Config = require('..');
var path = require('path');
var fs = require('fs');

var config;
var configPath = path.join(__dirname, 'support', 'config.json');
var originContent = fs.readFileSync(configPath);

describe('refresh-config', function () {
  before(function () {
    config = Config(configPath);
    config.data.should.eql(JSON.parse(originContent));
  });

  describe('init', function () {
    it('should emit error when file not eixst', function (done) {
        var c = Config('not_exsit.json');
        c.once('error', function (err) {
          err.should.be.an.Error;
          done();
        })
    });
  });

  describe('onchange', function () {
    after(function () {
      fs.writeFileSync(configPath, originContent);
    });

    it('should emit change when file changed', function (done) {
      var changeData = {hello: 'world'};
      fs.writeFileSync(configPath, JSON.stringify( changeData ));
      var data = config.data;
      config.once('change', function () {
        config.data.should.eql(changeData);
        config.stale.should.equal(data);
        config.removed.should.eql(Object.keys(data));
        done();
      });
    });

    it('should error when parse error', function (done) {
      var changeData = 'parse error data';
      fs.writeFileSync(configPath, changeData);
      config.once('error', function (err) {
        done();
      });
    });

    it('should remove file fine', function (done) {
      config.once('change', function () {
        config.data.should.eql({});
        config.removed.should.eql(Object.keys(config.stale));
        done();
      });
      fs.unlinkSync(configPath);
    });

    it('should readd ok', function (done) {
      fs.writeFileSync(configPath, originContent);
      config.once('change', function () {
        config.data.should.eql(JSON.parse(originContent));
        done();
      });
    });

    it('should change again ok', function (done) {
      var changeData = {hello: 'world'};
      fs.writeFileSync(configPath, JSON.stringify( changeData ));
      config.once('change', function () {
        config.data.should.eql(changeData);
        done();
      });
    });
  });
});
