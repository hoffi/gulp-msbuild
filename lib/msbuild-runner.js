'use strict';

var commandBuilder = require('./msbuild-command-builder');
var gutil = require('gulp-util');
var childProcess = require('child_process');

module.exports.startMsBuildTask = function (options, file, callback) {
  var command = commandBuilder.construct(file, options);

  if (options.logCommand) {
    gutil.log('Using msbuild command:', command.executable, command.args.join(' '));
  }

  var io = ['ignore'];

  io.push(options.stdout ? process.stdout : 'ignore');
  io.push(options.stderr ? process.stderr : 'ignore');

  var spawnOptions = { stdio: io };

  var cp = childProcess.spawn(command.executable, command.args, spawnOptions);

  cp.on('error', function (err) {
    if (err) {
      gutil.log(err);
      gutil.log(gutil.colors.red('Build failed!'));

      if (options.errorOnFail) {
        return callback(err);
      }
    }

    return callback();
  });

  cp.on('close', function (code, signal) {
    if (code != 0) {
      gutil.log(gutil.colors.red('Build failed with code ' + code + '!'));

      if (options.errorOnFail) {
        return callback({ code: code, signal: signal });
      }
    } else {
      gutil.log(gutil.colors.cyan('Build complete!'));
    }

    return callback();
  });
};
