/*global describe, it, beforeEach*/
'use strict';

var chai          = require('chai'),
    childProcess  = require('child_process'),
    constants     = require('../lib/constants'),
    gutil         = require('gulp-util'),
    expect        = chai.expect,
    path          = require('path'),
    fs            = require('fs'),
    proxyquire    = require('proxyquire');

chai.use(require('sinon-chai'));
require('mocha-sinon');

var commandBuilder = require('../lib/msbuild-command-builder');
var msbuildRunner = require('../lib/msbuild-runner');

var defaults;

var events;

function simulateEvent(name) {
  events.push({ name: name, data: Array.prototype.slice.call(arguments, 1) });
}

describe('msbuild-runner', function () {

  beforeEach(function () {
    defaults = JSON.parse(JSON.stringify(constants.DEFAULTS));
    events = [];

    function spawn(command, args, options) {
      var listeners = {};

      process.nextTick(function() {
        events.forEach(function(e) {
          listeners[e.name].apply(this, e.data);
        });
      });

      return {
        on: function(name, handler) {
          listeners[name] = handler;
        }
      };
    }

    this.sinon.stub(childProcess, 'spawn', spawn);
    this.sinon.stub(commandBuilder, 'construct').returns({ executable: 'msbuild', args: ['/nologo'] });
    this.sinon.stub(gutil, 'log');
    this.sinon.stub(path, 'join');
  });

  it('should execute the msbuild command', function (done) {
    defaults.stdout = true;

    simulateEvent('close', 0);

    msbuildRunner.startMsBuildTask(defaults, {}, null, function () {
      expect(gutil.log).to.have.been.calledWith(gutil.colors.cyan('MSBuild complete!'));
      done();
    });

    expect(childProcess.spawn).to.have.been.calledWith('msbuild', ['/nologo']);
  });

  it('should log the command when the logCommand option is set', function(done) {
    defaults.logCommand = true;

    simulateEvent('close', 0);

    msbuildRunner.startMsBuildTask(defaults, {}, null, function () {
      expect(gutil.log).to.have.been.calledWith(gutil.colors.cyan('Using MSBuild command:'), 'msbuild', '/nologo');
      done();
    });
  });

  it('should log an error message when the msbuild command exits with a non-zero code', function (done) {
    simulateEvent('close', 1);

    msbuildRunner.startMsBuildTask(defaults, {}, null, function () {
      expect(gutil.log).to.have.been.calledWith(gutil.colors.red('MSBuild failed with code 1!'));
      done();
    });
  });

  it('should log an error message when the msbuild command is killed by a signal', function (done) {
    simulateEvent('close', null, 'SIGUSR1');

    msbuildRunner.startMsBuildTask(defaults, {}, null, function () {
      expect(gutil.log).to.have.been.calledWith(gutil.colors.red('MSBuild killed with signal SIGUSR1!'));
      done();
    });
  });

  it('should log an error message and return an Error in the callback when the msbuild command failed', function (done) {
    defaults.errorOnFail = true;

    simulateEvent('close', 1);

    msbuildRunner.startMsBuildTask(defaults, {}, null, function (err) {
      expect(err).to.be.an.instanceof(Error);
      expect(err.message).to.be.equal('MSBuild failed with code 1!');
      expect(gutil.log).to.have.been.calledWith(gutil.colors.red('MSBuild failed with code 1!'));
      done();
    });
  });

  it('should log an error message when the spawned process experienced an error', function (done) {
    var error = new Error('broken');

    simulateEvent('error', error);

    msbuildRunner.startMsBuildTask(defaults, {}, null, function () {
      expect(gutil.log).to.have.been.calledWith(error);
      expect(gutil.log).to.have.been.calledWith(gutil.colors.red('MSBuild failed!'));
      done();
    });
  });

  it('should log an error message and return an Error in the callback when the spawned process experienced an error', function (done) {
    defaults.errorOnFail = true;
    var error = new Error('broken');

    simulateEvent('error', error);

    msbuildRunner.startMsBuildTask(defaults, {}, null, function (err) {
      expect(err).to.be.equal(error);
      expect(gutil.log).to.have.been.calledWith(error);
      expect(gutil.log).to.have.been.calledWith(gutil.colors.red('MSBuild failed!'));
      done();
    });
  });

  it('should return an Error if we cannot glob the publish location', function(done) {
    defaults.emitPublishedFiles = true;
    defaults.properties.PublishUrl = 'foobar';

    var error = new Error('Error globbing published files at foobar');
    var mockGlob = this.sinon.stub().callsArgWith(2, error, []);

    simulateEvent('close', 0);

    var msbuildRunner = proxyquire('../lib/msbuild-runner', { 'glob': mockGlob });

    msbuildRunner.startMsBuildTask(defaults, {}, null, function(err) {
      expect(err).to.be.equal(error);
      expect(gutil.log).to.have.been.calledWith(gutil.colors.cyan('MSBuild complete!'));
      expect(gutil.log).to.have.been.calledWith(gutil.colors.red('Error globbing published files at foobar'));
      done();
    });
  });

  it('should call join with the publishUrl and the file path for each file', function(done) {
    defaults.emitPublishedFiles = true;
    defaults.properties.PublishUrl = 'foobar';

    var fileArray = [
      'foo.js',
      'bar.js'
    ];

    var mockGlob = this.sinon.stub().callsArgWith(2, null, fileArray);
    var msbuildRunner = proxyquire('../lib/msbuild-runner', { 'glob': mockGlob });

    var stubStatsObj = {
      isFile: function() { return false; }
    };
    this.sinon.stub(fs, 'statSync').returns(stubStatsObj);

    simulateEvent('close', 0);

    msbuildRunner.startMsBuildTask(defaults, {}, null, function(err) {
      expect(path.join).to.have.been.calledWith('foobar', fileArray[0]);
      expect(path.join).to.have.been.calledWith('foobar', fileArray[1]);
      done();
    });
  });

  it('should should push gutil files for each file with the correct attributes', function(done) {
    defaults.emitPublishedFiles = true;
    defaults.properties.PublishUrl = 'foobar';

    var fileArray = [
      'foo.js',
      'bar.js'
    ];

    var pathArray = [
      'foobar/foo.js',
      'foobar/bar.js'
    ];

    var contentArray = [
      'foo content',
      'bar content'
    ];

    var mockGlob = this.sinon.stub().callsArgWith(2, null, fileArray);
    var msbuildRunner = proxyquire('../lib/msbuild-runner',{ 'glob': mockGlob });

    var stubStatsObj = {
      isFile: function() { return true; }
    };
    this.sinon.stub(fs, 'statSync').returns(stubStatsObj);

    path.join.withArgs(defaults.properties.PublishUrl, fileArray[0]).returns(pathArray[0]);
    path.join.withArgs(defaults.properties.PublishUrl, fileArray[1]).returns(pathArray[1]);

    this.sinon.stub(fs, 'readFileSync').withArgs(fileArray[0]).returns(contentArray[0]);
    fs.readFileSync.withArgs(fileArray[1]).returns(contentArray[1]);

    this.sinon.stub(gutil, 'File').returnsArg(0);

    var mockStream = {
      push: this.sinon.stub()
    };

    simulateEvent('close', 0);

    msbuildRunner.startMsBuildTask(defaults, {}, mockStream, function(err) {
      expect(gutil.File).to.have.been.calledWithNew;
      expect(mockStream.push).to.have.been.calledTwice;
      // TODO: Needs more asserts here, but I can't get calledWith to work on mockStream.push
      done();
    });
  });
});
