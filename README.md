# gulp-msbuild
[![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url]  [![Coverage Status][coveralls-image]][coveralls-url] [![Dependency Status][depstat-image]][depstat-url]

> msbuild plugin for [gulp](https://github.com/wearefractal/gulp).
> Inspired by [grunt-msbuild](https://github.com/stevewillcock/grunt-msbuild)

## Usage

First, install `gulp-msbuild` as a development dependency:

```shell
npm install --save-dev gulp-msbuild
```

Then, add it to your `gulpfile.js`:

```javascript
var gulp = require("gulp");
var msbuild = require("gulp-msbuild");

gulp.task("default", function() {
	gulp.src("./project.sln")
		.pipe(msbuild());
});
```

### Options

__Example__

```javascript
var gulp = require("gulp");
var msbuild = require("gulp-msbuild");

gulp.task("default", function() {
	gulp.src("./project.sln")
		.pipe(msbuild({
			targets: ['Clean', 'Build'],
			toolsVersion: 3.5
			})
		);
});
```

#### stdout

> Show output of msbuild

**Default:** false

#### stderr

> Show errors of msbuild

**Default:** true

#### errorOnFail

> If the MSBuild job fails with an error, this will cause the gulp-msbuild stream to return an error thus causing the gulp task to fail. This is useful if using an automated build server such as [Jenkins](http://jenkins-ci.org/) where a failing MSBuild should also cause the overall build job to fail.

**Default:** false


#### maxBuffer

> Specifies the largest amount of data allowed on stdout or stderr - if this value is exceeded then the msbuild child process is killed.

**Default:** 500*1024

#### targets

> Specifiy Build Targets

**Default:**
```javascript
['Rebuild']
```

#### configuration

> Specifiy Build Configuration (Release or Debug)

**Default:** Release

#### toolsVersion

> Specifiy the .NET Tools-Version

**Default:** 4.0

**Possible Values:** 1.0, 1.1, 2.0, 3.5, 4.0

#### properties

> Specifiy Custom Build Properties

**Default:** none

**Example:**
```javascript
msbuild({ properties: { WarningLevel: 2 } })
```

#### verbosity

> Specifiy the Build Verbosity

**Default:** normal

#### maxcpucount

> Specifiy Maximal CPU-Count to use

**Default:** 0 = MSBuild Default

#### nologo

> Should Startup Banner or Copyright Message be shown?

**Default:** false

## License

[MIT License](http://en.wikipedia.org/wiki/MIT_License)

[npm-url]: https://npmjs.org/package/gulp-msbuild
[npm-image]: https://badge.fury.io/js/gulp-msbuild.png

[travis-url]: http://travis-ci.org/hoffi/gulp-msbuild
[travis-image]: https://secure.travis-ci.org/hoffi/gulp-msbuild.png?branch=master

[coveralls-url]: https://coveralls.io/r/hoffi/gulp-msbuild
[coveralls-image]: https://coveralls.io/repos/hoffi/gulp-msbuild/badge.png

[depstat-url]: https://david-dm.org/hoffi/gulp-msbuild
[depstat-image]: https://david-dm.org/hoffi/gulp-msbuild.png
