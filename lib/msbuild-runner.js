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

  var cp = childProcess.spawn(command.executable, command.args, spawnOptions);

  cp.on('error', function (err) {
    if (err) {
      gutil.log(err);
      gutil.log(gutil.colors.red('MSBuild failed!'));

      if (options.errorOnFail) {
        return callback(err);
      }
    }

    return callback();
  });

  cp.on('close', function (code, signal) {
    if (code === 0) {
      gutil.log(gutil.colors.cyan('MSBuild complete!'));

      if (options.emitPublishedFiles) {
        var publishUrl = options.properties.PublishUrl;
        glob('**/*', { cwd: publishUrl }, function (err, files) {
          if (err) {
            var msg = 'Error globbing published files at ' + publishUrl;
            gutil.log(gutil.colors.red(msg));
            return callback(new Error(msg));
          }

          for (var i = 0; i < files.length; i++) {
            var fileName = files[i];
            var filePath = join(publishUrl, fileName);

            if (fs.statSync(filePath).isFile()) {
              stream.push(new gutil.File({
                cwd: publishUrl,
                base: publishUrl,
                path: filePath,
                contents: new Buffer(fs.readFileSynce(filePath))
              }));
            }
          }
        });
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

    return callback();
  });
};
