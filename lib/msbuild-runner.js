'use strict';

var commandBuilder = require('./msbuild-command-builder');
var gutil = require('gulp-util');
var glob = require('glob');
var join = require('path').join;
var fs = require('fs');
var childProcess = require('child_process');

module.exports.startMsBuildTask = function (options, file, stream, callback) {
  var command = commandBuilder.construct(file, options);

  if (options.logCommand) {
    gutil.log(gutil.colors.cyan('Using MSBuild command:'), command.executable, command.args.join(' '));
  }

  var io = ['ignore'];

  io.push(options.stdout ? process.stdout : 'ignore');
  io.push(options.stderr ? process.stderr : 'ignore');

  var spawnOptions = { stdio: io };

  var closed = false;
  var cp = childProcess.spawn(command.executable, command.args, spawnOptions);

  cp.on('error', function (err) {
    if (err) { gutil.log(err); }

    // The 'exit' event also can fire after the error event. We need to guard
    // when the process has already been closed:
    // https://nodejs.org/api/child_process.html#child_process_event_error
    if (closed) { return; }

    closed = true;
    if (err) {
      gutil.log(gutil.colors.red('MSBuild failed!'));

      if (options.errorOnFail) {
        return callback(err);
      }
    }

    return callback();
  });

  cp.on('exit', function (code, signal) {
    // The 'exit' event also can fire after the error event. We need to guard
    // when the process has already been closed:
    // https://nodejs.org/api/child_process.html#child_process_event_error
    if (closed) { return; }

    closed = true;
    if (code === 0) {
      gutil.log(gutil.colors.cyan('MSBuild complete!'));

      if (options.emitPublishedFiles) {
        var publishDirectory = options.publishDirectory;
        glob('**/*', { cwd: publishDirectory, nodir: true, absolute: true }, function (err, files) {
          if (err) {
            var msg = 'Error globbing published files at ' + publishDirectory;
            gutil.log(gutil.colors.red(msg));
            return callback(err);
          }

          for (var i = 0; i < files.length; i++) {
            var filePath = files[i];

            if (fs.statSync(filePath).isFile()) {
              stream.push(new gutil.File({
                cwd: publishDirectory,
                base: publishDirectory,
                path: filePath,
                contents: new Buffer(fs.readFileSync(filePath))
              }));
            }
          }
          return callback();
        });
      } else {
        return callback();
      }
    } else {
      var msg;

      if (code != null) {
        // Exited normally, but failed.
        msg = 'MSBuild failed with code ' + code + '!';
      } else {
        // Killed by parent process.
        msg = 'MSBuild killed with signal ' + signal + '!';
      }

      gutil.log(gutil.colors.red(msg));

      if (options.errorOnFail) {
        return callback(new Error(msg));
      }
    }
  });
};
