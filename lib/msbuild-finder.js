'use strict';

var path = require('path');
var gutil = require('gulp-util');
var constants = require('./constants');
var PluginError = gutil.PluginError;

module.exports.find = function (options) {
  if (options.platform.indexOf('win') !== 0) {
    return 'xbuild';
  }

  var version = constants.MSBUILD_VERSIONS[options.toolsVersion];
  if (!version) {
    throw new PluginError(constants.PLUGIN_NAME, 'No MSBuild Version was supplied!');
  }

  if (version === '12.0') {
  	var program_files = options.architecture === 'x64' ? 'Program Files (x86)' : 'Program Files';
  	return path.join('C:', program_files, 'MSBuild', version, 'Bin/MSBuild.exe');
  }

  var framework = options.architecture === 'x64' ? 'Framework64' : 'Framework';
  return path.join(options.windir, 'Microsoft.Net', framework, version, 'MSBuild.exe');
};
