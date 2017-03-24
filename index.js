'use strict';

var through = require('through2'),
    _ = require('lodash'),
    constants = require('./lib/constants'),
    msbuildRunner = require('./lib/msbuild-runner'),
    didYouMean = require('didyoumean'),
    gutil = require('gulp-util'),
    PluginError = gutil.PluginError;


function mergeOptionsWithDefaults(options) {
  return _.extend({}, constants.DEFAULTS, options);
}

function validateOptions(options) {
  for (var key in options) {
    var defaultKeys = Object.keys(constants.DEFAULTS);
    if (defaultKeys.indexOf(key) < 0) {
      var match;
      var msg = "Unknown option '" + key + "'!";

      if (match = didYouMean(key, defaultKeys)) {
        msg += " Did you mean '" + match + "'?";
      }

      throw new PluginError(constants.PLUGIN_NAME, gutil.colors.red(msg));
    }
  }
}

module.exports = function(options) {
  var mergedOptions = _.cloneDeep(mergeOptionsWithDefaults(options));
  validateOptions(mergedOptions);

  var stream = through.obj(function(file, enc, callback) {
    var self = this;
    if (!file || !file.path) {
      self.push(file);
      return callback();
    }

    return msbuildRunner.startMsBuildTask(mergedOptions, file, function(err) {
      if (err) return callback(err);
      self.push(file);
      if (mergedOptions.emitEndEvent) self.emit("end");
      return callback();
    });
  });

  return stream;
};
