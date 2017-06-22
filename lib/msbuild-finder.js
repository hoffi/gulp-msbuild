'use strict';

var path = require('path');
var gutil = require('gulp-util');
var constants = require('./constants');
var fs = require('fs');
var PluginError = gutil.PluginError;
var child = require ('child_process');

var detectMsBuild15Dir = function (pathRoot) {
  var vs2017Path = path.join(pathRoot, 'Microsoft Visual Studio', '2017');
  var possibleFolders = ['BuildTools', 'Enterprise', 'Professional', 'Community'];

  for (var index = 0; index < possibleFolders.length; index++) {
    try {
      var folderPath = path.join(vs2017Path, possibleFolders[index]);
      fs.statSync(folderPath);
      return folderPath;
    } catch (e) {}
  }
}

// Use MSBuild over XBuild where possible
var detectLinuxMsBuildExecutable = function () {
  try {
    var output = child.spawnSync('which', ['msbuild'], {encoding: 'utf8'});
    if (output.stderr && output.stderr !== 0) {
      return 'xbuild';
    }
    return 'msbuild';
  } catch (e) {}
}

var autoDetectVersion = function (pathRoot) {
  // Try to detect MSBuild 15.0.
  var msbuild15Dir = detectMsBuild15Dir(pathRoot);
  if (msbuild15Dir) {
    return [msbuild15Dir, 15.0];
  }

  // Detect MSBuild lower than 15.0.
  // ported from https://github.com/stevewillcock/grunt-msbuild/blob/master/tasks/msbuild.js#L167-L181
  var msbuildDir = path.join(pathRoot, 'MSBuild');
  var msbuildDirExists = true;

  try {
    fs.statSync(msbuildDir);
  } catch (e) {
    msbuildDirExists = false;
  }

  if (msbuildDirExists) {
    var msbuildVersions = fs.readdirSync(msbuildDir)
      .filter(function (entryName) {
        var binDirExists = true;
        var binDirPath = path.join(msbuildDir, entryName, 'Bin');
        try {
          fs.statSync(binDirPath);
        } catch (e) {
          binDirExists = false;
        }

        return entryName.indexOf('1') === 0 && binDirExists;
      });

    if (msbuildVersions.length > 0) {
      // Return latest installed msbuild version
      return [pathRoot, parseFloat(msbuildVersions.pop())];
    }
  }

  return [pathRoot, 4.0];
};

module.exports.find = function (options) {
  if (options.platform.match(/linux/)) {
    var msbuildPath = detectLinuxMsBuildExecutable();
    if (msbuildPath) {
      return msbuildPath;
    }
    return 'xbuild';
  } else if (!options.platform.match(/^win/)) {
    return 'xbuild';
  }

  var msbuildRoot;
  var is64Bit = options.architecture === 'x64';

  // On 64-bit systems msbuild is always under the x86 directory. If this
  // doesn't exist we are on a 32-bit system. See also:
  // https://blogs.msdn.microsoft.com/visualstudio/2013/07/24/msbuild-is-now-part-of-visual-studio/
  var pathRoot;
  if (is64Bit) {
    pathRoot = process.env['ProgramFiles(x86)'] || 'C:/Program Files (x86)';
  } else {
    pathRoot = process.env['ProgramFiles'] || 'C:/Program Files';
  }

  if (options.toolsVersion === 'auto') {
    var result = autoDetectVersion(pathRoot);
    msbuildRoot = result[0]
    options.toolsVersion = result[1];
  } else {
    if (options.toolsVersion === 15.0) {
      var msbuildDir = detectMsBuild15Dir(pathRoot);
      if (msbuildDir) {
        msbuildRoot = msbuildDir;
      } else {
        msbuildRoot = pathRoot;
      }
    } else {
      msbuildRoot = pathRoot;
    }
  }

  var version = constants.MSBUILD_VERSIONS[options.toolsVersion];
  if (!version) {
    throw new PluginError(constants.PLUGIN_NAME, 'No MSBuild Version was supplied!');
  }

  if (version === '12.0' || version === '14.0' || version === '15.0') {
    var x64_dir = is64Bit ? 'amd64' : '';
    return path.join(msbuildRoot, 'MSBuild', version, 'Bin', x64_dir, 'MSBuild.exe');
  } else {
    var framework = is64Bit ? 'Framework64' : 'Framework';
    return path.join(options.windir, 'Microsoft.Net', framework, version, 'MSBuild.exe');
  }
};
