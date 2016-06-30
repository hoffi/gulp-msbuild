'use strict';

var _ = require('lodash');
var path = require('path');
var constants = require('./constants');
var gutil = require('gulp-util');
var PluginError = gutil.PluginError;

module.exports.buildArguments = function(options) {
  var args = [];
  args.push('/target:' + options.targets.join(';'));
  args.push('/verbosity:' + options.verbosity);
  args.push('/toolsversion:' + parseFloat(options.toolsVersion).toFixed(1));

  if (options.nologo) {
    args.push('/nologo');
  }

  if (options.fileLoggerParameters) {
    args.push('/flp:' + options.fileLoggerParameters);
  }

  if (options.consoleLoggerParameters) {
    args.push('/clp:' + options.consoleLoggerParameters);
  }

  if (options.loggerParameters) {
    args.push('/logger:' + options.loggerParameters);
  }

  // xbuild does not support the `maxcpucount` argument and throws if provided
  if (options.maxcpucount >= 0 && options.msbuildPath !== 'xbuild') {
    if (options.maxcpucount === 0) {
      args.push('/maxcpucount');
    } else {
      args.push('/maxcpucount:' + options.maxcpucount);
    }
  }

  if (options.nodeReuse === false) {
    args.push('/nodeReuse:False')
  }

  if (options.configuration) {
    options.properties = _.extend({
      'Configuration': options.configuration
    }, options.properties);
  }

  for (var property in options.properties) {
    args.push('/property:' + property + '=' + options.properties[property]);
  }

  if(options.customArgs) {
    args = args.concat(options.customArgs);
  }

  return args;
};

module.exports.construct = function(file, options) {
  if (!options || Object.keys(options).length <= 0) {
    throw new PluginError(constants.PLUGIN_NAME, 'No options specified!');
  }

  if (!options.msbuildPath) {
    var msbuildFinder = require('./msbuild-finder');
    options.msbuildPath = msbuildFinder.find(options);
  }

  var args = this.buildArguments(options);

  return {
    executable: path.normalize(options.msbuildPath),
    args: [file.path].concat(args)
  };
};
