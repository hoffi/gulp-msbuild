import test from 'ava';
import msbuild from '../index';
var path = require('path');
var fs = require('fs');
var gutil = require('gulp-util');
var through = require('through2');

test.beforeEach(t => {
  var bin = __dirname + '/fixtures/HelloWorld/bin';
  if (fs.existsSync(bin)) {
    fs.unlinkSync(bin);
  }
});

test.cb('does build a c# solution file', t => {
  t.plan(1);

  var filePath = __dirname + '/fixtures/HelloWorld.sln';
  var expectedFile = __dirname + '/fixtures/HelloWorld1/bin/Release/HelloWorld1.exe';
  var fixture = new gutil.File({
      path: filePath,
      cwd: __dirname,
      base: path.dirname(filePath),
      contents: fs.readFileSync(filePath)
  });

  var stream = msbuild({ stdout: true });
  stream.once('end', function () {
    t.true(fs.existsSync(expectedFile));
    t.end()
  });

  stream.write(fixture);
  stream.end();
});

test.cb('does not build a non existing solution file', t => {
  var stream = msbuild({ stdout: true });
  stream.on('data', function() {});
  stream.on('end', function() { t.end(); });
  stream.write(new gutil.File({ path: null, contents: null }));
  stream.end();
});
