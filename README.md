# Javascript Binary Bundles (.jbb)

[![JBB Logo](https://raw.githubusercontent.com/wavesoft/jbb/master/doc/jbb-logo.png)](https://github.com/wavesoft) [![JBB Version](https://img.shields.io/npm/v/jbb.svg?label=version&maxAge=2592000)](https://www.npmjs.com/package/jbb) [![Build Status](https://travis-ci.org/wavesoft/jbb.svg?branch=master)](https://travis-ci.org/wavesoft/jbb) [![Join the chat at https://gitter.im/wavesoft/jbb](https://badges.gitter.im/wavesoft/jbb.svg)](https://gitter.im/wavesoft/jbb?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Javascript Binary Bundle is a binary bundle format for packaging data structures and resources for the web. It is optimised in balance between size and performance, preferring performance when in doubt.

**Why Binary Bundles?** For *faster* loading time due to *fewer* requests and an *optimised* binary format, closely compatible with Javascript internals. If you want to learn more, check [the specifications document](https://github.com/wavesoft/jbb/blob/master/doc/Bundle%20Format.md), [the FAQ](#frequently-asked-questions) in the end of this document or [this nice blog entry](http://wavesoft.github.io/javascript-binary-bundles/) that explains my reasoning for this project.

:thumbsup: This is NOT a plain archiving format for binary blobs! Even though it can store arbitrary binary data, it is designed to optimally serialize javascript structures!

:warning: This format is Architecture-Dependant: This means if you are compiling a binary bundle in little-endian machine it will *only* work on little-endian machines! _(We are not using `DataView`, but rather raw TypedArrays for performance purposes)._

:warning: This project is still in development. Some protocol features might be buggy or might change in the future without prior notice. Also the build time in some cases might be very slow. 

Curious to see some tests? [Timing Example](https://cdn.rawgit.com/wavesoft/jbb-tests/7d71eb26378860d4059097f3ee6d41fb0940299b/jbb_test_timing.html) - [Example 1](http://cdn.rawgit.com/wavesoft/jbb-tests/7d71eb26378860d4059097f3ee6d41fb0940299b/jbb_test_loader_1.html) - [Example 2](http://cdn.rawgit.com/wavesoft/jbb-tests/7d71eb26378860d4059097f3ee6d41fb0940299b/jbb_test_loader_2.html)

Or you can read the [Using JBB with THREE.js](https://github.com/wavesoft/jbb/blob/master/doc/Tutorial%201%20-%20THREEjs/Using%20with%20THREEjs.md) tutoral.

## Installation

JBB is available as npm module, so you can install it globally like so:

```
npm install -g jbb
```

Or make it part of your project like so:

```
npm install --save jbb
```

You will also need a jbb profile according to the resources you are going to bundle. For example, if you are bundling resources for a three.js project you will **also** need:

```
npm install jbb-profile-three
```

### Non-NPM Builds

You can also use `jbb` without npm. You can find the stand-alone builds in the `dist` directory. For example:

```html
<script src="build/jbb.min.js"></script>
<script src="build/jbb-profile-three.min.js"></script>
<script>
var jbbLoader = new JBBBinaryLoader( "base/dir/to/bundles" );

// Specify which profile to use
jbbLoader.addProfile(JBBProfileThree);

// Specify bundles to load
jbbLoader.add("bundle.jbb");

// Load bundle
jbbLoader.load(function() {

});
</script>
```


## Creating a Bundle

Create a new directory with the name of your bundle, for example `mybundle.jbbsrc` and place all your resources there.

In the root of the folder, create a `bundle.json` file and specify what resources are exported by this bundle:
```js
{
    "name" : "mybundle",
    "exports": {
        "blob": {
            "images/background" : "background_image.jpg",
            "audio/beep" : "sounds/beep.mp3"
        }
    }
}
```

_For more details on how to use the `bundle.json` check the [complete reference](https://github.com/wavesoft/jbb/blob/master/doc/bundle.json.md)._

However the real benefit comes when you have resources that can be properly serialized in a JBB bundle. For example, if you are bundling resources for a `THREE.js` project, you will most probably have meshes, textures, materials etc. 

To properly describe these resources you will need to specify the correct loader class for each type, for example:

```js
{
    "name" : "mybundle",
    "exports": {
        "blob": {
            "images/background" : "background_image.jpg",
            "audio/beep" : "sounds/beep.mp3"
        },
        "THREE.JSONLoader": {
            "mesh/monster" : "models/monster/monster.js"
        }
    }
}
```

*NOTE:* You don't need to include any depending resources, such as images (unless you explicitly need to refer to them). Whichever resources are referenced by the structures being created, will be automatically detected and collected at compile-time (including some DOM elements, such as `<img>` and `<script>`).

### Compiling with CLI

A `jbb` bundle contains serialized javascript data structures. This means that they must first be loaded in memory before dumped in the file. The `jbb` compiler can help you on this task. 

In order for the compiler to know how to handle your resources, you will need to specify a particular `jbb` profile. Each *profile* contains a Table of Known Objects, along with parsing and encoding instructions for the compiler.

In case of a `three.js` project, you can use the `jbb-profile-three`:

```
npm install -g jbb jbb-profile-three
```

This will make the `jbb` compiler and the `jbb-profile-three` available to your system. You can then compile your bundles like so:

```
jbb -p three -o mybundle.jbb /path/to/mybundle.jbbsrc
```

Note that the files passed to the jbb compiler must be supported by the profile, otherwise you will get errors. For more details have a look on your profile description, for example of [jbb-profile-three](https://github.com/wavesoft/jbb-profile-three).

### Compiling with Gulp

You can also use the [gulp-jbb](https://github.com/wavesoft/gulp-jbb) plugin to create binary bundles with Gulp.

```javascript
var gulp  = require('gulp');
var jbb   = require('gulp-jbb');

gulp.task('bundles', function() {
    return gulp
        .src([
            'mybundle.jbbsrc'
        ])
        .pipe(jbb({
            'profile': 'three'
        }))
        .pipe(gulp.dest('build'));
});
```

### Compiling with API

If you want more fine-grained control on the creation of your bundle, you can use the API version. You will still need to install `jbb` and your profile:

```
~$ npm install -g jbb jbb-profile-three
```

But you can now do something like this:

```javascript
var BinaryEncoder = require("jbb").BinaryEncoder;

// You will need to load a releavant object table
var THREEObjectTable = require("jbb-profile-three");

// Create a new bundle
var bundle = new BinaryEncoder('path/to/bundle', {
    'name': 'bundle',                 // Bundle Name (For x-ref)
    'object_table': THREEObjectTable, // Object Table to Use
})

// Encode your objects
bundle.encode( new THREE.Vector3(0,0,0), "scene/zero" );
bundle.encode( { "scene_name": "Test Scene" }, "scene/config" );

// Finalize and close
bundle.close();
```

## Loading a Bundle

The following snippet demonstrates how to load a binary bundle in your project:

```javascript
var BinaryDecoder = require("jbb/decoder");
var profile = require("jbb-profile-three");

// Create a decoder
var loader = new BinaryDecoder( "bundle/base/dir" );

// Specify the decoding profile
loader.addProfile( profile );

// Schedule one or more budles to load
binaryLoader.add( 'bundle1.jbb');
binaryLoader.add( 'bundle2.jbbp'); // Sparse bundles (multiple files)

// Load everything and call back
binaryLoader.load(function() {
    // All resources are now loaded in the database
    console.log( binaryLoader.database );
});
```

You can use [Webpack](https://webpack.github.io/) to compile the above example for the browser.

# Frequently Asked Questions

**Q. What's the benefit from using JBB?**

A. JBB helps you organise your resources in reusable bundles, while in the same time can optimally compact them in binary bundles. These bundles are faster to load (about 30% faster) and easier to share and reuse.

**Q. Is this like .tar for web?**

A. No! JBB is not an archive format, but a _data serialization_ format with some bundling _additions_. This means that JBB aims to encode data structures in the most efficient manner possible, and if needed, it embeds resource blobs that cannot be further optimised. So please don't start packing only binary blobs in it.. it can do so much more :)

**Q. How JBB compares to Binary-JSON (BSON)?**

A. BSON can only encode primitive javascript data structures, such as arrays and plain objects. JBB on the other hand is aware of the objects being encoded, it preserves their type and encodes them more optimally.

**Q. How JBB compares to MessagePack?**

A. Both try to solve the same problem: to encode data structures. However JBB sticks closer to the native Javascript data types, making it faster to process in the browser, while in the same time provides an additional layer of type information and arbitrary resource embedding. Furthermore, JBB is optimised for size, performing data de-duplication and numeric downscaling when possible.

# License

```
Copyright (C) 2015 Ioannis Charalampidis <ioannis.charalampidis@cern.ch>

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
