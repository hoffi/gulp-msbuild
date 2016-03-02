/*global describe, it, beforeEach*/
'use strict';

var chai          = require('chai'),
    Stream        = require('stream'),
    childProcess  = require('child_process'),
    constants     = require('../lib/constants'),
    gutil         = require('gulp-util'),
    expect        = chai.expect;

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
  });

  it('should execute the msbuild command', function (done) {
    defaults.stdout = true;

    simulateEvent('close', 0);

    msbuildRunner.startMsBuildTask(defaults, {}, function () {
      expect(gutil.log).to.have.been.calledWith(gutil.colors.cyan('MSBuild complete!'));
      done();
    });

    expect(childProcess.spawn).to.have.been.calledWith('msbuild', ['/nologo']);
  });

  it('should log the command when the logCommand option is set', function(done) {
    defaults.logCommand = true;

    simulateEvent('close', 0);

    msbuildRunner.startMsBuildTask(defaults, {}, function () {
      expect(gutil.log).to.have.been.calledWith(gutil.colors.cyan('Using MSBuild command:'), 'msbuild', '/nologo');
      done();
    });
  });

  it('should log an error message when the msbuild command exits with a non-zero code', function (done) {
    simulateEvent('close', 1);

    msbuildRunner.startMsBuildTask(defaults, {}, function () {
      expect(gutil.log).to.have.been.calledWith(gutil.colors.red('MSBuild failed with code 1!'));
      done();
    });
  });

  it('should log an error message when the msbuild command is killed by a signal', function (done) {
    simulateEvent('close', null, 'SIGUSR1');

    msbuildRunner.startMsBuildTask(defaults, {}, function () {
      expect(gutil.log).to.have.been.calledWith(gutil.colors.red('MSBuild killed with signal SIGUSR1!'));
      done();
    });
  });

  it('should log an error message and return an Error in the callback when the msbuild command failed', function (done) {
    defaults.errorOnFail = true;

    simulateEvent('close', 1);

    msbuildRunner.startMsBuildTask(defaults, {}, function (err) {
      expect(err).to.be.an.instanceof(Error);
      expect(err.message).to.be.equal('MSBuild failed with code 1!');
      expect(gutil.log).to.have.been.calledWith(gutil.colors.red('MSBuild failed with code 1!'));
      done();
    });
  });

  it('should log an error message when the spawned process experienced an error', function (done) {
    var error = new Error('broken');

    simulateEvent('error', error);

    msbuildRunner.startMsBuildTask(defaults, {}, function () {
      expect(gutil.log).to.have.been.calledWith(error);
      expect(gutil.log).to.have.been.calledWith(gutil.colors.red('MSBuild failed!'));
      done();
    });
  });

  it('should log an error message and return an Error in the callback when the spawned process experienced an error', function (done) {
    defaults.errorOnFail = true;
    var error = new Error('broken');

    simulateEvent('error', error);

    msbuildRunner.startMsBuildTask(defaults, {}, function (err) {
      expect(err).to.be.equal(error);
      expect(gutil.log).to.have.been.calledWith(error);
      expect(gutil.log).to.have.been.calledWith(gutil.colors.red('MSBuild failed!'));
      done();
    });
  });
});
