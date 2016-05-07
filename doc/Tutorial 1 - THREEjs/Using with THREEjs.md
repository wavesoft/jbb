
# Using `jbb` with `THREE.js`

The JBB Project was initially started in order to optimally store resources for THREE.js scenes. Therefore it's only natural to have a dedicated guide on how to use it with three.js.

You can integrate jbb in your pipeline in various ways. In this tutorial we are going to use `gulp-jbb` for steering the creation of bundles, but we are not going to create a gulp-based binary project.

## 1. Getting Started

For the bare minimum requirements you will need to install `node` and a few packages. Start by creating a new directory for our project and install the following packages locally:

```
npm install jbb jbb-profile-three gulp gulp-jbb
```

Then create two directories:
 * `bundles` - Were the bundle sources are located.
 * `build` - Were the built files will be placed.

```
mkdir bundles build
```

## 2. Creating a bundle

For our example we are going to bundle a textured cube. We used [Blender](https://www.blender.org/) and [THREE.js exporter](https://github.com/mrdoob/three.js/tree/master/utils/exporters/blender) to create a very simple crate:

<img src="https://raw.githubusercontent.com/wavesoft/jbb/master/doc/Tutorial 1 - THREEjs/img/1-blender.png" />

After exporting the cube, we have two files: `crate.json` and `crate.png`. The first contains the cube mesh and the second the diffuse map for the texture. You can find the files [here](https://github.com/wavesoft/jbb/tree/master/doc/Tutorial 1 - THREEjs/files).

To create a new bundle, we are going to create a new bundle directory in the `bundles` folder and a new specifications file.

```
mkdir bundles/crate.jbbsrc
```

Move the two files in the `crate.jbbsrc` directory and create an additional new file called `bundle.json` with the following contents:

```json
{
    "name": "crate",
    "exports": {
        "THREE.JSONLoader": {
            "object.crate"  : "crate.json",
        }
    }
}
```

This is the _index_ file of the bundle and instructs jbb to first load `crate.json` using the `THREE.JSONLoader` and to export it under the name `object.crate`. The first, `name` argument should be the same as the bundle folder name (without the extension).

## 3. Creating a Gulpfile.js

In order to build our bundles we can either use the `jbb` command-line, or we can create a gulpfile to automate the build process using `gulp`.

Create a new file called `gulpfile.js` in your root directory with the following contents:

```javascript
var gulp  = require('gulp');
var jbb   = require('gulp-jbb');

//
// Compile the binary bundles
//
gulp.task('bundles', function() {
    return gulp
        .src([ "bundles/*.jbbsrc" ])
        .pipe(jbb({
            profile: 'three',
            sparse: false
        }))
        .pipe(gulp.dest('build/bundles'));
});

// By default build bundles
gulp.task('default', ['bundles' ]);
```

You can now build your bundle just by running `gulp`

```
$ gulp
[21:07:10] Using gulpfile .. /gulpfile.js
[21:07:10] Starting 'bundles'...
Loader.createMaterial: Unsupported colorAmbient [ 0.64, 0.64, 0.64 ]
Loading .. /bundles/crate.jbbsrc/crate.png
[21:07:10] Finished 'bundles' after 
[21:07:10] Starting 'default'...
[21:07:10] Finished 'default' after 115 μs
```

## 4. Loading 

