<h1> <img src="https://raw.githubusercontent.com/wavesoft/jbb/master/doc/jbb-logo.png" align="absmiddle" /> Javascript Binary Bundles</h1>

[![JBB Version](https://img.shields.io/npm/v/jbb.svg?label=version&maxAge=2592000)](https://www.npmjs.com/package/jbb) [![Build Status](https://travis-ci.org/wavesoft/jbb.svg?branch=master)](https://travis-ci.org/wavesoft/jbb) [![Join the chat at https://gitter.im/wavesoft/jbb](https://badges.gitter.im/wavesoft/jbb.svg)](https://gitter.im/wavesoft/jbb?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

**Why Binary Bundles?** For *faster* loading time due to *fewer* requests and an *optimised* binary format, closely compatible with Javascript internals. It is optimised in balance between size and performance, preferring performance when in doubt.

<img src="https://raw.githubusercontent.com/wiki/wavesoft/jbb/img/jbb-desc.png" />

With JBB you can load all of your project's resources in a `node.js` instance and then serialize them in a single file. You can then load this file instead. 

[Examples](https://github.com/wavesoft/jbb/wiki#examples) — [Documentation](https://github.com/wavesoft/jbb/wiki) — [Tutorials](https://github.com/wavesoft/jbb/wiki#tutorials) — [Help](https://gitter.im/wavesoft/jbb)

## Usage - Loading Bundles

Download the [minified run-time library](https://raw.githubusercontent.com/wavesoft/jbb/master/dist/jbb.min.js) and include it in your project:

```html
<script src="js/jbb.min.js"></script>
```

You can then load your bundles like this:

```js
var loader = new JBB.BinaryLoader("path/to/bundles");
loader.add("bundle_name.jbb");
loader.load(function(error, database) {
    // Handle your data 
});
```

### Using npm

JBB is also available on npm. Both compiler and run-time library is available in the same package:

```
npm install --save jbb
```

You can then load your bundles like this:

```js
var JBBBinaryLoader = require('jbb/decoder');

var loader = new JBBBinaryLoader("path/to/bundles");
loader.add("bundle_name.jbb");
loader.load(function(error, database) {
    // Handle your data 
});
```

## Usage - Creating Bundles

After you have [collected your resources in a source bundle](https://github.com/wavesoft/jbb/wiki/Creating-a-Simple-Source-Bundle-%26-Compiling-it) you can then compile it using the `gulp-jbb` plugin.

In your `gulpfile.js`:

```js
var gulp = require('gulp');
var jbb  = require('gulp-jbb');

// Compile jbb task
gulp.task('jbb', function() {
  return gulp
    .src([ "your_bundle.jbbsrc" ])
    .pipe(jbb({
      profile: [ "profile-1", "profile-2" ]
    }))
    .pipe(gulp.dest( "build/bundles" ));
});
```

# License

```
Copyright (C) 2015-2016 Ioannis Charalampidis <ioannis.charalampidis@cern.ch>

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```
