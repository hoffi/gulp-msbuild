'use strict';

var path = require('path');
var gutil = require('gulp-util');
var constants = require('./constants');
var PluginError = gutil.PluginError;

module.exports.find = function (options) {
  if (!options.platform.match(/^win/)) {
    return 'xbuild';
  }

  var version = constants.MSBUILD_VERSIONS[options.toolsVersion];
  if (!version) {
    throw new PluginError(constants.PLUGIN_NAME, 'No MSBuild Version was supplied!');
  }

  var is64Bit = options.architecture === 'x64';

  if (version === '12.0' || version === '14.0') {
    // On 64-bit systems msbuild is always under the x86 directory. If this
    // doesn't exist we are on a 32-bit system. See also:
    // https://blogs.msdn.microsoft.com/visualstudio/2013/07/24/msbuild-is-now-part-of-visual-studio/
    var env_var_dir = process.env['ProgramFiles(x86)'] || process.env['ProgramFiles'];
    var pathRoot = env_var_dir || path.join('C:', is64Bit ? 'Program Files (x86)' : 'Program Files');

    var x64_dir = is64Bit ? 'amd64' : '';
    return path.join(pathRoot, 'MSBuild', version, 'Bin', x64_dir, 'MSBuild.exe');
  }

  var framework = is64Bit ? 'Framework64' : 'Framework';
  return path.join(options.windir, 'Microsoft.Net', framework, version, 'MSBuild.exe');
};
