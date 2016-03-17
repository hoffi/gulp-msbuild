import test from 'ava';
import commandBuilder from '../lib/msbuild-command-builder';
import constants from '../lib/constants';

test('correctly processes default options', t => {
  var options = constants.DEFAULTS;
  var result = commandBuilder.buildArguments(options);
  t.same(result,
         ['/target:Rebuild', '/verbosity:normal',
          '/toolsversion:4.0', '/nologo', '/maxcpucount',
          '/property:Configuration=Release']);
});

test('can handle multiple targets', t => {
  var options = { targets: ['Clean', 'Build'] };
  var result = commandBuilder.buildArguments(options);
  t.same(result, ['/target:Clean;Build']);
});

test('can handle integer tools version', t => {
  var options = { toolsVersion: 1 };
  var result = commandBuilder.buildArguments(options);
  t.same(result, ['/toolsversion:1.0']);
});

test('adds nologo if set to true', t => {
  var options = { nologo: true };
  var result = commandBuilder.buildArguments(options);
  t.same(result, ['/nologo']);
});

test('does not add nologo if set to false', t => {
  var options = { nologo: false };
  var result = commandBuilder.buildArguments(options);
  t.same(result, []);
});

test('does not add maxcpucount if using xbuild', t => {
  var options = { msbuildPath: 'xbuild', maxcpucount: 0 };
  var result = commandBuilder.buildArguments(options);
  t.same(result, []);
});

test('uses the automatic maxcpucount when set to zero', t => {
  var options = { maxcpucount: 0 };
  var result = commandBuilder.buildArguments(options);
  t.same(result, ['/maxcpucount']);
});

test('adds the maxcpucount', t => {
  var options = { maxcpucount: 2 };
  var result = commandBuilder.buildArguments(options);
  t.same(result, ['/maxcpucount:2']);
});

test('can disable node reuse', t => {
  var options = { nodeReuse: false };
  var result = commandBuilder.buildArguments(options);
  t.same(result, ['/nodeReuse:False']);
});

test('adds configuration as property', t => {
  var options = { configuration: 'Test' };
  var result = commandBuilder.buildArguments(options);
  t.same(result, ['/property:Configuration=Test']);
});

test('does not add configuration as property if it is empty', t => {
  var options = { configuration: null };
  var result = commandBuilder.buildArguments(options);
  t.same(result, []);
});

test('adds a single custom property', t => {
  var options = { properties: { WarningLevel: 2 } };
  var result = commandBuilder.buildArguments(options);
  t.same(result, ['/property:WarningLevel=2']);
});

test('adds multiple custom properties', t => {
  var options = { properties: { Test: 'x', WarningLevel: 2 } };
  var result = commandBuilder.buildArguments(options);
  t.same(result, ['/property:Test=x', '/property:WarningLevel=2']);
});

test('throws error when no options are given', t => {
  t.throws(commandBuilder.construct, 'No options specified!');
});

test('throws error when empty options are given', t => {
  t.throws(_ => { commandBuilder.construct(null, {}) }, 'No options specified!');
});

test('uses provided msbuild path', t => {
  var result = commandBuilder.construct(
    { path: 'test.sln' },
    { targets: ['Rebuild'], msbuildPath: 'xbuild' }
  );
  t.same(result, {
    executable: 'xbuild',
    args: ['test.sln', '/target:Rebuild']
  });
});

test('tries to find msbuild when not provided', t => {
  var result = commandBuilder.construct(
    { path: 'test.sln' },
    { targets: ['Rebuild'], platform: 'win', toolsVersion: 1.0, windir: '.' }
  );

  t.same(result, {
    executable: 'Microsoft.Net/Framework/v1.0.3705/MSBuild.exe',
    args: ['test.sln', '/target:Rebuild', '/toolsversion:1.0']
  });
});
