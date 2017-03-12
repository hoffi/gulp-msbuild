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
  if (options.toolsVersion) {
    var version = parseFloat(options.toolsVersion).toFixed(1);
    if (isNaN(version)) {
      version = '4.0';
    }
    args.push('/toolsversion:' + version);
  }

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

  if (options.solutionPlatform) {
    options.properties = _.extend({
      'Platform': options.solutionPlatform
    }, options.properties);
  }

  for (var property in options.properties) {
    args.push('/property:' + property + '=' + options.properties[property]);
  }

  if (options.customArgs) {
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

  var newOptions = _.cloneDeep(options);

  Object.keys(newOptions.properties).forEach(function(prop) {
    var context = { file: file };
    newOptions.properties[prop] = gutil.template(newOptions.properties[prop], context);
  });

  var args = this.buildArguments(newOptions);

  return {
    executable: path.normalize(options.msbuildPath),
    args: [file.path].concat(args)
  };
};
