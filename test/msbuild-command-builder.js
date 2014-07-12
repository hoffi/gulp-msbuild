/*global describe, it, beforeEach*/
'use strict';

var chai          = require('chai'),
    constants     = require('../lib/constants'),
    gutil         = require('gulp-util'),
    expect        = chai.expect;

chai.use(require('sinon-chai'));
require('mocha-sinon');

var commandBuilder = require('../lib/msbuild-command-builder');
var msbuildFinder = require('../lib/msbuild-finder');

var defaults;

describe('msbuild-command-builder', function () {

  beforeEach(function () {
    defaults = JSON.parse(JSON.stringify(constants.DEFAULTS));

    this.sinon.stub(gutil, 'log');
  });

  describe('buildArguments', function () {
    it('should build arguments with default options', function () {
      var result = commandBuilder.buildArguments(constants.DEFAULTS);

      expect(result).to.be.equal('/target:Rebuild /verbosity:normal /toolsversion:4.0 /nologo /property:Configuration="Release"');
    });

    it('should build arguments without nologo', function () {
      var options = defaults;
      options.nologo = undefined;
      var result = commandBuilder.buildArguments(options);

      expect(result).to.be.equal('/target:Rebuild /verbosity:normal /toolsversion:4.0 /property:Configuration="Release"');
    });

    it('should build arguments with maxcpucount', function () {
      var options = defaults;
      options.maxcpucount = 4;
      var result = commandBuilder.buildArguments(options);

      expect(result).to.be.equal('/target:Rebuild /verbosity:normal /toolsversion:4.0 /nologo /maxcpucount:4 /property:Configuration="Release"');
    });

    it('should build arguments with maxcpucount under zero', function () {
      var options = defaults;
      options.maxcpucount = -1;
      var result = commandBuilder.buildArguments(options);

      expect(result).to.be.equal('/target:Rebuild /verbosity:normal /toolsversion:4.0 /nologo /property:Configuration="Release"');
    });

    it('should build arguments with custom properties', function () {
      var options = defaults;
      options.properties = { WarningLevel: 2 };
      var result = commandBuilder.buildArguments(options);

      expect(result).to.be.equal('/target:Rebuild /verbosity:normal /toolsversion:4.0 /nologo /property:Configuration="Release" /property:WarningLevel="2"');
    });
  });



  describe('construct', function () {
    it('should fail with no options', function () {
      var func = function () {
        return commandBuilder.construct({}, {});
      };

      expect(func).to.be.throw('No options specified!');
    });

    it('should find msbuild when not specified', function () {
      this.sinon.stub(msbuildFinder, 'find').returns('');

      commandBuilder.construct({}, defaults);

      expect(msbuildFinder.find).to.have.been.calledWith(defaults);
    });

    it('should use msbuildpath if specified', function () {
      this.sinon.stub(msbuildFinder, 'find')  ;

      var options = defaults;
      options.msbuildPath = 'here';
      var command = commandBuilder.construct({}, options);

      expect(msbuildFinder.find).to.not.have.been.calledWith(options);
      expect(command).to.be.match(/here(.+)/);
    });

    it('should construct a valid command', function () {
      var options = defaults;
      options.msbuildPath = 'here';
      var command = commandBuilder.construct({ path: 'test.sln' }, options);

      expect(command).to.be.match(/here "test.sln" (.+)/);
    });
  });

});
