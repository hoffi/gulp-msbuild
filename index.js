'use strict';

var through = require('through2'),
  gutil = require('gulp-util'),
  PluginError = gutil.PluginError,
  path = require('path'),
  os = require('os'),
  _ = require('lodash'),
  exec = require('child_process').exec;

var PLUGIN_NAME = 'gulp-msbuild';

var msbuildVersions = {
  1.0: 'v1.0.3705',
  1.1: 'v1.1.4322',
  2.0: 'v2.0.50727',
  3.5: 'v3.5',
  4.0: 'v4.0.30319'
};

function findMsBuildExecutable(toolsVersion, platform, architecture, windir) {
  var executable;
  if (platform === 'linux' || platform === 'darwin') {
    executable = 'xbuild';
  } else {
    var version = msbuildVersions[toolsVersion];
    if (!version) {
      throw new PluginError(PLUGIN_NAME, 'No MSBuild Version was supplied!');
    }

    var framework = architecture === 'x64' ? 'Framework64' : 'Framework';
    executable = path.join(windir, 'Microsoft.Net', framework, version, 'MSBuild.exe');
  }

  return executable;
}

function buildArguments(options) {
  var args = [];
  args.push('/target:' + options.targets.join(';'));
  args.push('/verbosity:' + options.verbosity);
  args.push('/toolsversion:' + msbuildVersions[options.toolsVersion].substr(1));

  if (options.nologo) {
    args.push('/nologo');
  }

  if (options.maxcpucount && options.maxcpucount > 0) {
    gutil.log(gutil.colors.cyan('Using maxcpucount: ' + options.maxcpucount));
    args.push('/maxcpucount:' + options.maxcpucount);
  }

  for (var property in options.properties) {
    args.push('/property:' + property + '="' + options.properties[property] + '"');
  }

  return args.join(' ');
}

function msbuild(options, execFile) {
  options = _.extend({
    stdout: false,
    stderr: true,
    targets: ['Rebuild'],
    configuration: 'Release',
    toolsVersion: 4.0,
    properties: {},
    verbosity: 'normal',
    maxcpucount: 0,
    nologo: true, 
    platform: process.platform,
    architecture: os.arch(),
    windir: process.env.WINDIR
  }, options);

  var stream = through.obj(function(file, enc, callback) {
    if (file.isNull()) {
      this.push(file);
      return callback();
    }

    this.push(file);
    options.properties.Configuration = options.configuration;

    var executable = path.normalize(findMsBuildExecutable(options.toolsVersion, options.platform, options.architecture, options.windir));
    var args = buildArguments(options);

    var executeFunc = execFile ? execFile : exec;
    var cp = executeFunc([executable, file.path, args].join(' '), {}, function(err) {
      if (err) {
        gutil.log(gutil.colors.red('Build failed!'));
        return;
      }

      gutil.log(gutil.colors.cyan('Build complete!'));
      return;
    });

    if (options.stdout && cp) {
      cp.stdout.pipe(process.stdout);
    }

    if (options.stderr && cp) {
      cp.stderr.pipe(process.stderr);
    }

    return callback();
  });

  return stream;
}

module.exports = msbuild;
