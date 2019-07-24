'use strict';

var path = require('path');
var gutil = require('gulp-util');
var constants = require('./constants');
var fs = require('fs');
var PluginError = gutil.PluginError;
var child = require ('child_process');
var constants = require("./constants");
var childProcess = require("child_process");
var os = require("os");
var lsCache = {};

function msBuildFromWhere(pathRoot) {
  var vsWherePath = path.join(pathRoot, 'Microsoft Visual Studio','Installer', 'vswhere.exe');
  var whereProcess = child.spawnSync(vsWherePath,
    ['-latest', '-products', '*', '-requires', 'Microsoft.Component.MSBuild'],
    {
      cwd: process.cwd(),
      env: process.env,
      stdio: 'pipe',
      encoding: 'utf-8'
    }
  );

  if (whereProcess.output === null) {
    return '';
  }
  var cmdOutput = '';
  if (whereProcess.output.length > 0){
    for (var index = 0; index < whereProcess.output.length; index++) {
      cmdOutput = whereProcess.output[index] || '';
      if (cmdOutput.length > 0) {
        break;
      }
    }
  }
  var installKeyword = 'installationPath';
  if (cmdOutput.length > 0) {
    var results = cmdOutput.split(/\r?\n/);
    for (var cmdLineIndex = 0; cmdLineIndex < results.length; cmdLineIndex++) {
      var cmdLine = results[cmdLineIndex];
      if (cmdLine.startsWith(installKeyword)) {
        var match = cmdLine.replace(installKeyword + ': ', '');
        return match;
      }
    }
  }
  return '';
}

module.exports.msBuildFromWhere = msBuildFromWhere;

function detectMsBuild15Dir (pathRoot) {
  var wherePath = msBuildFromWhere(pathRoot) || '';
  if (wherePath.length > 0) {
    return wherePath;
  }
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
var detectMsBuildOverXBuild = function () {
  try {
    var output = child.spawnSync('which', ['msbuild'], {encoding: 'utf8'});
    if (output.stderr && output.stderr !== 0) {
      return 'xbuild';
    }
    return 'msbuild';
  } catch (e) {}
}

function lsR(folder) {
  if (lsCache[folder]) {
    return lsCache[folder];
  }
  return lsCache[folder] = fs.readdirSync(folder)
    .reduce((acc, cur) => {
      var fullPath = path.join(folder, cur);
      var st = fs.statSync(fullPath);
      if (st.isFile()) {
        acc.push(fullPath);
        return acc;
      }
      return acc.concat(lsR(fullPath));
    }, []);
}

function findMSBuildExeUnder(folder) {
  return lsR(folder).filter(fpath => {
    var fileName = path.basename(fpath);
    return fileName.toLowerCase() === "msbuild.exe";
  });
}

function addDetectedMsBuildVersionsToConstantsLookup(executables) {
  return executables.map(exe => {
    try {
      var proc = childProcess.spawnSync(exe, [ "/version" ], { encoding: "utf8" });
      var lines = proc.stdout.split(os.EOL);
      var thisVersion = lines[lines.length - 1];
      var verParts = thisVersion.split(".");
      var major = verParts[0];
      var shortVer = `${major}.0`; // not technically correct: I see msbuild 16.1 on my machine, but keeps in line with prior versioning
      var ver = parseFloat(shortVer);
      if (!constants.MSBUILD_VERSIONS[shortVer]) {
        constants.MSBUILD_VERSIONS[ver] = shortVer;
        return ver;
      }
    } catch (e) {
      console.warn(`Unable to query version of ${exe}: ${e}`);
    }
  })
  .filter(ver => !!ver)
  .reduce((acc, cur) => {
    if (acc.indexOf(cur) === -1) {
      acc.push(cur);
    }
    return acc;
  }, [])
  .sort()
  .reverse();
}

function autoDetectVersion (pathRoot) {
  // Try to detect MSBuild 15.0.
  var msbuild15OrLaterDir = detectMsBuild15Dir(pathRoot);
  if (msbuild15OrLaterDir) {
    var msbuildHome = path.join(msbuild15OrLaterDir, "MSBuild");
    var msbuildExecutables = findMSBuildExeUnder(msbuildHome);
    var detected = addDetectedMsBuildVersionsToConstantsLookup(msbuildExecutables);
    return [msbuild15OrLaterDir, detected[0] || 15.0 ];
  }

  // Detect MSBuild lower than 15.0.
  // ported from https://github.com/stevewillcock/grunt-msbuild/blob/master/tasks/msbuild.js#L167-L181
  var msbuildDir = path.join(pathRoot, 'MSBuild');
  var msbuildDirExists;
  try {
    fs.statSync(msbuildDir);
    msbuildDirExists = true;
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
  if (options.platform.match(/linux|darwin/)) {
    var msbuildPath = detectMsBuildOverXBuild();
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

  // auto-detection also registers higher msbuild versions which from 2019+
  var shouldProbe = options.toolsVersion === 'auto';
  if (options.toolsVersion !== 'auto') {
    var major = parseInt(('' + options.toolsVersion).split('.')[0]);
    if (!isNaN(major) && major > 15) {
      shouldProbe = true;
    }
  }
  var auto = shouldProbe ? autoDetectVersion(pathRoot) : null;
  if (options.toolsVersion === 'auto') {
    // var result = autoDetectVersion(pathRoot);
    msbuildRoot = auto[0]
    options.toolsVersion = auto[1];
  } else {
    var msbuildDir = detectMsBuild15Dir(pathRoot);
    if (options.toolsVersion >= 15.0) {
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

  var major = parseInt(version.split(".")[0]);
  if (major > 15) {
    var x64_dir = is64Bit ? 'amd64' : '';
    var msbuildHome = path.join(msbuildRoot, 'MSBuild');
    var msbuildExe = findMSBuildExeUnder(msbuildHome)
      .filter(exe => {
        var pathParts = exe.split(path.sep);
        return is64Bit
          ? pathParts.indexOf(x64_dir) > -1
          : pathParts.indexOf(x64_dir) === -1;
      })[0];
      if (!msbuildExe) {
        throw new PluginError(
          constants.PLUGIN_NAME,
          `Unable to find msbuild.exe under ${msbuildHome}`);
      }
      return msbuildExe;
  } else if (major >= 12 && major <= 15) {
    var x64_dir = is64Bit ? 'amd64' : '';
    return path.join(msbuildRoot, 'MSBuild', version, 'Bin', x64_dir, 'MSBuild.exe');
  } else {
    var framework = is64Bit ? 'Framework64' : 'Framework';
    return path.join(options.windir, 'Microsoft.Net', framework, version, 'MSBuild.exe');
  }
};
