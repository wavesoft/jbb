
# Using `jbb` with `THREE.js`

The JBB Project was initially started in order to optimally store resources for THREE.js scenes. Therefore it's only natural to have a dedicated guide on how to use it with three.js.

You can integrate jbb in your pipeline in various ways. In this tutorial we are going to use `gulp-jbb` for steering the creation of bundles, but we are not going to create a gulp-based binary project.

## 1. Getting Started

For the bare minimum requirements you will need to install `node` and a few packages. Start by creating a new directory for our project and install the following packages locally:

```
npm install jbb jbb-profile-three gulp gulp-jbb three
```

Then create two directories:
 * `bundles` - Were the bundle sources are located.
 * `build` - Were the built files will be placed.

```
mkdir bundles build
```

## 3. Creating a THREE.js scene

Let's start by creating a new page for our three.js scene. Create a new file `index.html` in the root directory with the following contents:

```html
<!DOCTYPE html>
<html lang="en">
    <head>
        <title>three.js + jbb.js</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0">
        <style>
            body {
                font-family: Monospace;
                background-color: #000000;
                margin: 0px;
                overflow: hidden;
            }
        </style>
    </head>

    <body>
        <script src="node_modules/three/three.min.js"></script>
        <script src="node_modules/jbb/dist/jbb.min.js"></script>
        <script src="node_modules/jbb-profile-three/dist/jbb-profile-three.min.js"></script>

        <script>
            var container;
            var camera, scene, renderer;
            var pointLight;

            init();
            animate();

            function init() {

                container = document.createElement( 'div' );
                document.body.appendChild( container );

                camera = new THREE.PerspectiveCamera( 35, window.innerWidth / window.innerHeight, 1, 2000 );
                camera.position.set( 2, 4, 5 );

                scene = new THREE.Scene();
                scene.fog = new THREE.FogExp2( 0x000000, 0.035 );

                // Lights
                scene.add( new THREE.AmbientLight( 0xcccccc ) );
                pointLight = new THREE.PointLight( 0xffffff, 5, 30 );
                pointLight.position.set( 15, 15, 0 );
                scene.add( pointLight );

                // Renderer
                renderer = new THREE.WebGLRenderer();
                renderer.setPixelRatio( window.devicePixelRatio );
                renderer.setSize( window.innerWidth, window.innerHeight );
                container.appendChild( renderer.domElement );

                // Events
                window.addEventListener( 'resize', onWindowResize, false );

                // TODO : Add something on the scene
            }

            function onWindowResize( event ) {
                renderer.setSize( window.innerWidth, window.innerHeight );
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
            }

            function animate() {
                render();
                requestAnimationFrame( animate );
            }

            function render() {
                // Rotate camera around center
                var timer = Date.now() * 0.0005;
                camera.position.x = Math.cos( timer ) * 10;
                camera.position.y = 4;
                camera.position.z = Math.sin( timer ) * 10;
                camera.lookAt( scene.position );
                renderer.render( scene, camera );
            }

        </script>
    </body>
</html>
```

Open your `index.html` file and check your javascript console. If you see no errors you are ready to continue. Don't worry about the empty black content for now...

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
            "crate"  : "crate.json",
        }
    }
}
```

This is the _index_ file of the bundle and instructs jbb to first load `crate.json` using the `THREE.JSONLoader` and to export it under the name `crate/crate`. The first, `name` argument should be the same as the bundle folder name (without the extension).

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
            profile: 'three'
        }))
        .pipe(gulp.dest('build/bundles'));
});

// By default build bundles
gulp.task('default', ['bundles' ]);
```

Note the `profile` parameter in the `jbb` group. It instructs jbb to use the [jbb-profile-three](github.com/wavesoft/jbb-profile-three) in order to correctly handle THREE.js objects. Without it `jbb` will complain about unknown object instances.  

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

You can confirm that `crate.jbb` exists in your `build/bundles` directory.

## 4. Loading the bundle in the scene

Now that we have our bundle, it's time to load it into our THREE.js scene. To do so, we are going to use the `JBBBundleLoader` that was made available when we included the `jbb.min.js` file.

Change the last part of the init() function like this:

```javascript
                // TODO : Add something on the scene

                var bundleLoader = new JBBBinaryLoader();
                bundleLoader.addProfile( JBBProfileThree );

                // Get model from bundle
                bundleLoader.add("build/bundles/crate.jbb");
                bundleLoader.load( function(error, database) {

                    var geometry = database['crate/crate'];
                    var materials = database['crate/crate:extra'];

                    var mesh = new THREE.Mesh( geometry, materials[0] );
                    scene.add(mesh);

                });
```

Let's see this step-by-step: First, we are creating a new instance to the `JBBBinaryLoader` class. This is responsible for loading and parsing the bundles. 

```javascript
                var bundleLoader = new JBBBinaryLoader();
```

Right after, we are adding a decoding profile to the loader using the `.addProfile()` method. Similar to the encoding process, a profile contains the decoding information for the objects. 

We have already loaded `jbb-profile-three.min.js`, that exposes the `JBBProfileThree` global variable, so we can use it right-away:

```javascript
                bundleLoader.addProfile( JBBProfileThree );
```

Then, we request jbb loader to load our crate bundle. We can add more bundles if needed. Additional bundles might also be loaded if a dependency is encountered.

```javascript
                bundleLoader.add("build/bundles/crate.jbb");
```

To actually start loading the bundle we are calling the `.load` function. This will trigger a callback when the operation has completed.

```javascript
                bundleLoader.load( function(error, database) {
                    ...
                });
```

If there was no error while loading the bundle, the `error` argument will be `null` and the `database` argument will be a dictionary-like object with all the loaded objects. 

Therefore, we can easily access the encoded crate like this:

```javascript
                    var geometry = database['crate/crate'];
```

Since the cube stored in `crate.json` file is not an object, but just the geometry to the cube, the `THREE.JSONLoader` will create a `THREE.Geometry` object. Since that's the loader's default return value, this geometry will be accessible as `<bundle name>/<export name>`.

However `THREE.JSONLoader` also returns an array of `THREE.Material` instances as a separate argument. Such 'extra' information is available under the `<bundle name>/<export name>:extra` name. 

Therefore we have enough information to create a new textured mesh:

```javascript
                    var materials = database['crate/crate:extra'];

                    var mesh = new THREE.Mesh( geometry, materials[0] );
                    scene.add(mesh);
```

If everything went as expected, you will see something like this:

<img src="https://raw.githubusercontent.com/wavesoft/jbb/master/doc/Tutorial 1 - THREEjs/img/2-result.png" />

If you are using `Chrome` you will need to see this page over `http:`. You can use the minimalistic http server from node to serve your resources locally:

```
~$ npm install http-server
~$ ./node_modules/http-server/bin/http-server 
Starting up http-server, serving ./
Available on:
  http://127.0.0.1:8080
```

And you can now see your results on [http://127.0.0.1:8080](http://127.0.0.1:8080).

