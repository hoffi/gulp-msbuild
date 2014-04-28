/*global describe, it*/
'use strict';

var should = require('should'), 
		vinylFile = require('vinyl');

require('mocha');

delete require.cache[require.resolve('../')];

var msbuild = require('../');

describe('gulp-msbuild', function () {

	it('should choose right msbuild executable on unix', function (done) {
		var expectedExecutable = /^xbuild/;
		var execFile = function(cmd) {
			cmd.should.match(expectedExecutable);
			done();
		};

		var stream = msbuild({platform: 'linux', architecture: 'x86', windir: ''}, execFile);
		var fakeFile = new vinylFile({
	    cwd: 'cwd',
	    path: 'path',
	    contents: new Buffer('123')
	  });
	  stream.write(fakeFile);
	  stream.end();
	});

	it('should choose right msbuild executable on windows', function (done) {
		var execFile = function(cmd) {
			cmd.should.match(/^C:\/WINDOWS\/Microsoft.Net\/Framework\/v4.0.30319\/MSBuild.exe/);
			done();
		};

		var stream = msbuild({platform: 'win', architecture: 'x86', windir: 'C:/WINDOWS'}, execFile);
		var fakeFile = new vinylFile({
	    cwd: 'cwd',
	    path: 'path',
	    contents: new Buffer('123')
	  });
	  stream.write(fakeFile);
	  stream.end();
	});

	it('should choose right msbuild executable on windows 64', function (done) {
		var execFile = function(cmd) {
			cmd.should.match(/^C:\/WINDOWS\/Microsoft.Net\/Framework64\/v4.0.30319\/MSBuild.exe/);
			done();
		};

		var stream = msbuild({platform: 'win', architecture: 'x64', windir: 'C:/WINDOWS'}, execFile);
		var fakeFile = new vinylFile({
	    cwd: 'cwd',
	    path: 'path',
	    contents: new Buffer('123')
	  });
	  stream.write(fakeFile);
	  stream.end();
	});

	it('should choose right msbuild executable on windows with .net 3.5', function (done) {
		var execFile = function(cmd) {
			cmd.should.match(/^C:\/WINDOWS\/Microsoft.Net\/Framework\/v3.5\/MSBuild.exe/);
			done();
		};

		var stream = msbuild({platform: 'win', architecture: 'x86', windir: 'C:/WINDOWS', toolsVersion: 3.5}, execFile);
		var fakeFile = new vinylFile({
	    cwd: 'cwd',
	    path: 'path',
	    contents: new Buffer('123')
	  });
	  stream.write(fakeFile);
	  stream.end();
	});

	it('should have right default msbuild arguments', function (done) {
		var execFile = function(cmd) {
			cmd.should.match(/\/nologo/gi);
			cmd.should.match(/\/property:Configuration="Release"/gi);
			cmd.should.match(/\/verbosity:normal/gi);
			cmd.should.match(/\/toolsversion:4.0/gi);
			cmd.should.match(/\/target:Rebuild/gi);
			done();
		};

		var stream = msbuild({}, execFile);
		var fakeFile = new vinylFile({
	    cwd: 'cwd',
	    path: 'path',
	    contents: new Buffer('123')
	  });
	  stream.write(fakeFile);
	  stream.end();
	});

	it('should have correctly insert Debug Configuraiton', function (done) {
		var execFile = function(cmd) {
			cmd.should.match(/\/property:Configuration="Debug"/gi);
			cmd.should.not.match(/\/property:Configuration="Release"/gi);
			done();
		};

		var stream = msbuild({configuration: 'Debug'}, execFile);
		var fakeFile = new vinylFile({
	    cwd: 'cwd',
	    path: 'path',
	    contents: new Buffer('123')
	  });
	  stream.write(fakeFile);
	  stream.end();
	});

	it('should have accept maxcpucount', function (done) {
		var execFile = function(cmd) {
			cmd.should.match(/\/maxcpucount:2/g);
			done();
		};

		var stream = msbuild({maxcpucount: 2}, execFile);
		var fakeFile = new vinylFile({
	    cwd: 'cwd',
	    path: 'path',
	    contents: new Buffer('123')
	  });
	  stream.write(fakeFile);
	  stream.end();
	});

	it('should have accept user defined build properties', function (done) {
		var execFile = function(cmd) {
			cmd.should.match(/\/property:WarningLevel="2"/g);
			done();
		};

		var stream = msbuild({properties: {WarningLevel: 2}}, execFile);
		var fakeFile = new vinylFile({
	    cwd: 'cwd',
	    path: 'path',
	    contents: new Buffer('123')
	  });
	  stream.write(fakeFile);
	  stream.end();
	});

	it('should have not include nologo when specified false', function (done) {
		var execFile = function(cmd) {
			cmd.should.not.match(/\/nologo/g);
			done();
		};

		var stream = msbuild({nologo: false}, execFile);
		var fakeFile = new vinylFile({
	    cwd: 'cwd',
	    path: 'path',
	    contents: new Buffer('123')
	  });
	  stream.write(fakeFile);
	  stream.end();
	});

	it('should also work when a custom path is specified', function (done) {
		var customMsBuildPath = 'C:\\Windows\\Microsoft .NET\\Framework\\v3.5\\msbuild.exe';

		var execFile = function(cmd) {
			cmd.should.startWith(customMsBuildPath);
			done();
		};

		var stream = msbuild({msbuildPath: customMsBuildPath}, execFile);
		var fakeFile = new vinylFile({
	    cwd: 'cwd',
	    path: 'path',
	    contents: new Buffer('123')
	  });
	  stream.write(fakeFile);
	  stream.end();
	});

});
