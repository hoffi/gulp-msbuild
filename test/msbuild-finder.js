import test from 'ava';
import msbuildFinder from '../lib/msbuild-finder';

test('returns xbuild on non windows platforms', t => {
  var result = msbuildFinder.find({ platform: 'linux' });
  t.is(result, 'xbuild');
});

test('throws error when no version is specified', t => {
  t.throws(_ => {
    msbuildFinder.find({ toolsVersion: null, platform: 'win' });
  }, 'No MSBuild Version was supplied!');
});

test('throws error when an unknown version was specified', t => {
  t.throws(_ => {
    msbuildFinder.find({ toolsVersion: 0.6, platform: 'win' });
  }, 'No MSBuild Version was supplied!');
});

test('generates correct path for msbuild versions < 12 on 32bit', t => {
  var result = msbuildFinder.find({
    toolsVersion: 3.5, windir: '.', platform: 'win'
  });

  t.is(result, 'Microsoft.Net/Framework/v3.5/MSBuild.exe')
});

test('generates correct path for msbuild versions > 12 on 64bit', t => {
  var result = msbuildFinder.find({
    toolsVersion: 3.5, windir: '.', platform: 'win', architecture: 'x64'
  });

  t.is(result, 'Microsoft.Net/Framework64/v3.5/MSBuild.exe')
});

test('generates correct path for msbuild versions > 12 on 32bit', t => {
  var result = msbuildFinder.find({
    toolsVersion: 12.0, platform: 'win'
  });

  t.is(result, 'C:/Program Files/MSBuild/12.0/Bin/MSBuild.exe')
});

test('generates correct path for msbuild versions > 12 on 64bit', t => {
  var result = msbuildFinder.find({
    toolsVersion: 12.0, platform: 'win', architecture: 'x64'
  });

  t.is(result, 'C:/Program Files (x86)/MSBuild/12.0/Bin/amd64/MSBuild.exe')
});
