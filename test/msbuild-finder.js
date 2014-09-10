/*global describe, it*/
'use strict';

var chai          = require('chai'),
    constants     = require('../lib/constants'),
    expect        = chai.expect;

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
    var expectedResult = windir + '/Microsoft.Net/Framework/' + expectMSBuildVersion + '/MSBuild.exe';

    expect(result).to.be.equal(expectedResult);
  });

  it('should use 64bit msbuild on windows with x64', function () {
    var windir = 'WINDIR';
    var toolsVersion = 3.5;
    var result = msbuildFinder.find({ platform: 'win32', toolsVersion: toolsVersion, windir: windir, architecture: 'x64' });

    var expectMSBuildVersion = constants.MSBUILD_VERSIONS[toolsVersion];
    var expectedResult = windir + '/Microsoft.Net/Framework64/' + expectMSBuildVersion + '/MSBuild.exe';

    expect(result).to.be.equal(expectedResult);
  });

  it('should use msbuild 12 on windows with visual studio 2013 project', function () {
    var toolsVersion = 12.0;
    var result = msbuildFinder.find({ platform: 'win32', toolsVersion: toolsVersion });

    var expectMSBuildVersion = constants.MSBUILD_VERSIONS[toolsVersion];
    var expectedResult = 'C:/Program Files/MSBuild/' + expectMSBuildVersion + '/Bin/MSBuild.exe';

    expect(result).to.be.equal(expectedResult);
  });

  it('should use 64bit msbuild 12 on windows x64 with visual studio 2013 project', function () {
    var toolsVersion = 12.0;
    var result = msbuildFinder.find({ platform: 'win32', toolsVersion: toolsVersion, architecture: 'x64' });

    var expectMSBuildVersion = constants.MSBUILD_VERSIONS[toolsVersion];
    var expectedResult = 'C:/Program Files (x86)/MSBuild/' + expectMSBuildVersion + '/Bin/MSBuild.exe';

    expect(result).to.be.equal(expectedResult);
  });

  it('should throw error with invalid toolsVersion', function () {
    var func = function () {
      return msbuildFinder.find({ platform: 'win32', toolsVersion: -1 });
    };

    expect(func).to.throw('No MSBuild Version was supplied!');
  });

});
