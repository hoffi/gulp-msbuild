/*global describe, it, afterEach, before*/
'use strict';

var chai          = require('chai'),
    constants     = require('../lib/constants'),
    expect        = chai.expect,
    _             = require('lodash'),
    path          = require('path');

chai.use(require('sinon-chai'));
require('mocha-sinon');

var msbuildFinder = require('../lib/msbuild-finder');

describe('msbuild-finder', function () {

  it('should use xbuild on linux', function () {
    var result = msbuildFinder.find({ platform: 'linux' });

    expect(result).to.be.equal('xbuild');
  });

  it('should use xbuild on darwin', function () {
    var result = msbuildFinder.find({ platform: 'darwin' });

    expect(result).to.be.equal('xbuild');
  });

  it('should use xbuild on unknown platform', function () {
    var result = msbuildFinder.find({ platform: 'xyz' });

    expect(result).to.be.equal('xbuild');
  });

  it('should use msbuild on windows', function () {
    var windir = 'WINDIR';
    var toolsVersion = 3.5;
    var result = msbuildFinder.find({ platform: 'win32', toolsVersion: toolsVersion, windir: windir });

    var expectMSBuildVersion = constants.MSBUILD_VERSIONS[toolsVersion];
    var expectedResult = path.join(windir, 'Microsoft.Net', 'Framework', expectMSBuildVersion, 'MSBuild.exe');

    expect(result).to.be.equal(expectedResult);
  });

  it('should use 64bit msbuild on 64bit windows', function () {
    var defaults = JSON.parse(JSON.stringify(constants.DEFAULTS));

    var windir = 'WINDIR';
    var toolsVersion = 3.5;
    var result = msbuildFinder.find(_.extend(defaults, { platform: 'win32', toolsVersion: toolsVersion, windir: windir }));

    var expectMSBuildVersion = constants.MSBUILD_VERSIONS[toolsVersion];
    var expectedResult = path.join(windir, 'Microsoft.Net', 'Framework64', expectMSBuildVersion, 'MSBuild.exe');

    expect(result).to.be.equal(expectedResult);
  });

  it('should use 64bit msbuild on windows with provided x64 architecture', function () {
    var windir = 'WINDIR';
    var toolsVersion = 3.5;
    var result = msbuildFinder.find({ platform: 'win32', toolsVersion: toolsVersion, windir: windir, architecture: 'x64' });

    var expectMSBuildVersion = constants.MSBUILD_VERSIONS[toolsVersion];
    var expectedResult = path.join(windir, 'Microsoft.Net', 'Framework64', expectMSBuildVersion, 'MSBuild.exe');

    expect(result).to.be.equal(expectedResult);
  });

  it('should use msbuild 12 on windows with visual studio 2013 project', function () {
    var toolsVersion = 12.0;
    var result = msbuildFinder.find({ platform: 'win32', toolsVersion: toolsVersion, architecture: 'x86' });

    var expectMSBuildVersion = constants.MSBUILD_VERSIONS[toolsVersion];

    var pathRoot = process.env['ProgramFiles'] || path.join('C:', 'Program Files');
    var expectedResult = path.join(pathRoot, 'MSBuild', expectMSBuildVersion, 'Bin', 'MSBuild.exe');

    expect(result).to.be.equal(expectedResult);
  });

  it('should use 64bit msbuild 12 on windows x64 with visual studio 2013 project', function () {
    var toolsVersion = 12.0;
    var result = msbuildFinder.find({ platform: 'win32', toolsVersion: toolsVersion, architecture: 'x64' });

    var expectMSBuildVersion = constants.MSBUILD_VERSIONS[toolsVersion];
    var pathRoot = process.env['ProgramFiles(x86)'] || path.join('C:', 'Program Files (x86)');
    var expectedResult = path.join(pathRoot, 'MSBuild', expectMSBuildVersion, 'Bin/amd64', 'MSBuild.exe');

    expect(result).to.be.equal(expectedResult);
  });

  it('should use msbuild 14 on windows with visual studio 2015 project', function () {
    var toolsVersion = 14.0;
    var result = msbuildFinder.find({ platform: 'win32', toolsVersion: toolsVersion, architecture: 'x86' });

    var expectMSBuildVersion = constants.MSBUILD_VERSIONS[toolsVersion];

    var pathRoot = process.env['ProgramFiles'] || path.join('C:', 'Program Files');
    var expectedResult = path.join(pathRoot, 'MSBuild', expectMSBuildVersion, 'Bin', 'MSBuild.exe');

    expect(result).to.be.equal(expectedResult);
  });

  it('should use 64bit msbuild 14 on windows x64 with visual studio 2015 project', function () {
    var toolsVersion = 14.0;
    var result = msbuildFinder.find({ platform: 'win32', toolsVersion: toolsVersion, architecture: 'x64' });

    var expectMSBuildVersion = constants.MSBUILD_VERSIONS[toolsVersion];
    var pathRoot = process.env['ProgramFiles(x86)'] || path.join('C:', 'Program Files (x86)');
    var expectedResult = path.join(pathRoot, 'MSBuild/', expectMSBuildVersion, 'Bin/amd64', 'MSBuild.exe');

    expect(result).to.be.equal(expectedResult);
  });

  it('should use msbuild 15 on windows with visual studio 2017 project', function () {
    var toolsVersion = 15.0;
    var result = msbuildFinder.find({ platform: 'win32', toolsVersion: toolsVersion, architecture: 'x86' });

    var expectMSBuildVersion = constants.MSBUILD_VERSIONS[toolsVersion];

    var pathRoot = process.env['ProgramFiles'] || path.join('C:', 'Program Files');
    var expectedResult = path.join(pathRoot, 'Microsoft Visual Studio','2017','Professional', 'MSBuild', expectMSBuildVersion, 'Bin', 'MSBuild.exe');

    expect(result).to.be.equal(expectedResult);
  });

  it('should use 64bit msbuild 15 on windows x64 with visual studio 2017 project', function () {
    var toolsVersion = 15.0;
    var result = msbuildFinder.find({ platform: 'win32', toolsVersion: toolsVersion, architecture: 'x64' });

    var expectMSBuildVersion = constants.MSBUILD_VERSIONS[toolsVersion];
    var pathRoot = process.env['ProgramFiles(x86)'] || path.join('C:', 'Program Files (x86)');
    var expectedResult = path.join(pathRoot, 'Microsoft Visual Studio','2017','Professional', 'MSBuild', expectMSBuildVersion, 'Bin/amd64', 'MSBuild.exe');

    expect(result).to.be.equal(expectedResult);
  });


  it('should throw error with invalid toolsVersion', function () {
    var func = function () {
      return msbuildFinder.find({ platform: 'win32', toolsVersion: -1 });
    };

    expect(func).to.throw('No MSBuild Version was supplied!');
  });

  describe('when toolsVersion is \'auto\'', function() {
    var fs = require('fs');
    var mock;

    before(function() {
      process.env['ProgramFiles'] = path.join('C:', 'Program Files');
    });

    it('should fall back to 4.0 when Visual Studio 2013 and 2015 are not installed', function() {
      var windir = 'WINDIR';
      var toolsVersion = 'auto';

      var expectMSBuildVersion = constants.MSBUILD_VERSIONS[4.0];
      var expectedResult = path.join(windir, 'Microsoft.Net', 'Framework', expectMSBuildVersion, 'MSBuild.exe');

      mock = this.sinon.mock(fs);
      mock.expects('statSync').throws();

      var result = msbuildFinder.find({ platform: 'win32', toolsVersion: toolsVersion, windir: windir });

      expect(result).to.be.equal(expectedResult);
    });

    it('should fall back to 4.0 when MSBuild dir exists in Program Files, but no versions installed', function () {
      var windir = 'WINDIR';
      var toolsVersion = 'auto';
      var expectMSBuildVersion = constants.MSBUILD_VERSIONS[4.0];
      var pathRoot = process.env['ProgramFiles'] || path.join('C:', 'Program Files');
      var msbuildDir = path.join(pathRoot, 'MSBuild');
      var expectedResult = path.join(windir, 'Microsoft.Net', 'Framework', expectMSBuildVersion, 'MSBuild.exe');

      mock = this.sinon.mock(fs);
      mock.expects('statSync').returns({});
      mock.expects('readdirSync').withArgs(msbuildDir).returns(['padding', 'dir']);

      var result = msbuildFinder.find({ platform: 'win32', toolsVersion: toolsVersion, windir: windir });

      expect(result).to.be.equal(expectedResult);
    });

    it('should use msbuild 14 on windows with visual studio 2015 project', function () {
      var toolsVersion = 'auto';
      var expectMSBuildVersion = constants.MSBUILD_VERSIONS[14.0];
      var pathRoot = process.env['ProgramFiles'] || path.join('C:', 'Program Files');
      var msbuildDir = path.join(pathRoot, 'MSBuild');
      var expectedResult = path.join(pathRoot, 'MSBuild', expectMSBuildVersion, 'Bin', 'MSBuild.exe');

      mock = this.sinon.mock(fs);
      mock.expects('readdirSync').withArgs(msbuildDir).returns(['padding', 'dir', '14.0']);
      mock.expects('statSync').withArgs(msbuildDir).returns({});
      mock.expects('statSync').withArgs(path.join(msbuildDir, '14.0', 'Bin')).returns({});

      var result = msbuildFinder.find({ platform: 'win32', toolsVersion: toolsVersion, architecture: 'x86' });

      expect(result).to.be.equal(expectedResult);
    });

    it('should use msbuild 12 on windows with visual studio 2013 project and an incomplete visual studio 2015 install', function () {
      var toolsVersion = 'auto';
      var expectMSBuildVersion = constants.MSBUILD_VERSIONS[12.0];
      var pathRoot = process.env['ProgramFiles'] || path.join('C:', 'Program Files');
      var msbuildDir = path.join(pathRoot, 'MSBuild');
      var expectedResult = path.join(pathRoot, 'MSBuild', expectMSBuildVersion, 'Bin', 'MSBuild.exe');

      mock = this.sinon.mock(fs);
      mock.expects('readdirSync').withArgs(msbuildDir).returns(['padding', 'dir', '12.0', '14.0', '15.0']);
      mock.expects('statSync').withArgs(msbuildDir).returns({});
      mock.expects('statSync').withArgs(path.join(msbuildDir, '12.0', 'Bin')).returns({});
      mock.expects('statSync').withArgs(path.join(msbuildDir, '14.0', 'Bin')).throws();
      mock.expects('statSync').withArgs(path.join(msbuildDir, '15.0', 'Bin')).throws();

      var result = msbuildFinder.find({ platform: 'win32', toolsVersion: toolsVersion, architecture: 'x86' });

      expect(result).to.be.equal(expectedResult);
    });

    afterEach(function() {
      mock.restore();
    });
  });
});
