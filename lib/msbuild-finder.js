'use strict';

var path = require('path');
var gutil = require('gulp-util');
var constants = require('./constants');
var fs = require('fs');
var PluginError = gutil.PluginError;

module.exports.find = function (options) {
  if (!options.platform.match(/^win/)) {
    return 'xbuild';
  }

  var version;

  var is64Bit = options.architecture === 'x64';
  var env_var_dir = is64Bit ? process.env['ProgramFiles(x86)'] : process.env['ProgramFiles'];

  if (options.toolsVersion === 'auto') {
    // ported from https://github.com/stevewillcock/grunt-msbuild/blob/master/tasks/msbuild.js#L167-L181
    var msbuildDir = path.join(env_var_dir, 'MSBuild');
    var msbuildDirExists = true;

    try {
      fs.statSync(msbuildDir);
    } catch (e) {
      msbuildDirExists = false;
    }

    if (msbuildDirExists) {
       var msbuildVersions = fs.readdirSync(msbuildDir)
           .filter(function(entryName) {
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
           // set latest installed msbuild version
           options.toolsVersion = parseFloat(msbuildVersions.pop());
       } else {
        options.toolsVersion = 4.0;
       }
    } else {
      options.toolsVersion = 4.0;
    }
  }
  version = constants.MSBUILD_VERSIONS[options.toolsVersion];


  if (!version) {
    throw new PluginError(constants.PLUGIN_NAME, 'No MSBuild Version was supplied!');
  }

  if (version === '12.0' || version === '14.0' || version === '15.0') {
    // On 64-bit systems msbuild is always under the x86 directory. If this
    // doesn't exist we are on a 32-bit system. See also:
    // https://blogs.msdn.microsoft.com/visualstudio/2013/07/24/msbuild-is-now-part-of-visual-studio/
    var pathRoot = env_var_dir || path.join('C:', is64Bit ? 'Program Files (x86)' : 'Program Files');
    var x64_dir = is64Bit ? 'amd64' : '';
    var msbuildRoot = pathRoot

    if(version === '15.0') {
      var possibleFolders = ['Enterprise', 'Professional', 'Community', 'BuildTools'];

      for(var index = 0; index< possibleFolders.length; index++) {
        try {
          var folderPath = path.join(pathRoot, 'Microsoft Visual Studio','2017',possibleFolders[index]);
          fs.statSync(folderPath);
          msbuildRoot = folderPath
          break;
        } catch (e) { }
      }
    }

    return path.join(msbuildRoot, 'MSBuild', version, 'Bin', x64_dir, 'MSBuild.exe');
  }

  var framework = is64Bit ? 'Framework64' : 'Framework';
  return path.join(options.windir, 'Microsoft.Net', framework, version, 'MSBuild.exe');
};
