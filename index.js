'use strict';

var through = require('through2'),
    _ = require('lodash'),
    constants = require('./lib/constants'),
    msbuildRunner = require('./lib/msbuild-runner');

function mergeOptionsWithDefaults(options) {
  return _.extend(constants.DEFAULTS, options);
}

module.exports = function(options) {
  options = mergeOptionsWithDefaults(options);

  var stream = through.obj(function(file, enc, callback) {
    if (file.isNull()) {
      this.push(file);
      return callback();
    }

    this.push(file);
    return msbuildRunner.startMsBuildTask(options, file, callback);
  });

  return stream;
};
