# Javascript Binary Bundles (.jbb)

[![Build Status](https://travis-ci.org/wavesoft/jbb.svg?branch=master)](https://travis-ci.org/wavesoft/jbb)

Javascript Binary Bundle is a binary bundle format for packaging data structures and resources for the web. It is optimised in balance between size and performance, preferring performance when in doubt.

__IMPORTANT:__ This is NOT an archiving format! Even though you *could* pack binary blobs in a `jbb `bundle, it's designed  to optimally store serialized javascript structures!

__WARNING:__ This format is Architecture-Dependant. This means if you are compiling a binary bundle in little-endian machine it will *only* work on little-endian machines! _(We are not using `DataView`, but rather raw TypedArrays for performance purposes)._

## Creating a Bundle

First, collect all your resources in a folder and then create a `bundle.json` in it's base. This file describes what resources to pack and has the following format:

```js
{
    //
    // The name of the bundle [Required]
    //
    "name"      : "bundle-name",

    //
    // Which JBB Profile (Object Table) to use [Optional]
    //
    "profile"   : "three",

    //
    // Depending modules [Optional]
    //
    "imports"   : [ 'dependant-module-1', 'dependant-module-2' ],

    //
    // What does this module export [Required]
    //
    "exports"   : {
    
        //
        // Specify the loader to use
        //
        "THREE.JSONLoader": {

            //
            // Specify for each export the parameters the loader expects.
            // In most of the cases it's just the path to the resource,
            // but other loaders (see below) might require more complex
            // configuration.
            //
            // The macro ${BUNDLE} is provided for convenience, and it
            // expands to the base directory of the bundle.
            //
            "test-model": "${BUNDLE}/models/test.json",

            //
            // You can specify multiple models unter the same loader
            //
            "another-model": "modeuls/world.json"

        },

        //
        // Other loaders require more complex configuration
        // rather than just a filename.
        //
        "THREE.MD2CharacterLoader": {
            
            //
            // For example, the MD2CharacterLoader requires detailed
            // configuration for various parts:
            //
            "ratamahatta": {
                baseUrl: "${BUNDLE}/mesh/ratamahatta/",
                body: "ratamahatta.md2",
                skins: [ "ratamahatta.png", "ctf_b.png", "ctf_r.png", "dead.png", "gearwhore.png" ],
                weapons:  [  [ "weapon.md2", "weapon.png" ],
                             [ "w_bfg.md2", "w_bfg.png" ],
                             [ "w_blaster.md2", "w_blaster.png" ],
                             [ "w_chaingun.md2", "w_chaingun.png" ],
                             [ "w_glauncher.md2", "w_glauncher.png" ],
                             [ "w_hyperblaster.md2", "w_hyperblaster.png" ],
                             [ "w_machinegun.md2", "w_machinegun.png" ],
                             [ "w_railgun.md2", "w_railgun.png" ],
                             [ "w_rlauncher.md2", "w_rlauncher.png" ],
                             [ "w_shotgun.md2", "w_shotgun.png" ],
                             [ "w_sshotgun.md2", "w_sshotgun.png" ]
                          ]
            }

        },

        //
        // And of course you can also pack binary blobs
        //
        "blob": {

            //
            // For each binary resource the MIME type will be
            // automatically detected base on the extension
            //
            "background-audio": "sounds/background.mp3",

            //
            // You can also override the automatic MIME detection
            // by specifying the MIME type yourself
            //
            "player-sound": [ "sounds/player.mp3", "audio/mpeg" ]

        }

    }
}
```

### Compiling with CLI

A `jbb` bundle contains serialized javascript data structures. This means that they must first be loaded in memory before dumped in the file. The `jbb` compiler can help you on this task. 

In order for the compiler to know how to handle your resources, you will need to specify a particular `jbb` profile. Each *profile* contains a Table of Known Objects, along with parsing and encoding instructions for the compiler.

In case of a `three.js` project, you can use the `jbb-profile-three`:

```
~$ npm install -g jbb jbb-profile-three
```

This will make the `jbb` compiler and the `jbb-profile-three` available to your system. You can then compile your bundles like so:

```
~$ jbb -p three -o bundle.jbb /path/to/resource.js ...
```

Note that the files passed to the jbb compiler must be supported by the profile, otherwise you will get errors. For more details have a look on your profile description, for example of [jbb-profile-three](https://github.com/wavesoft/jbb-profile-three).

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
var bundle = new BinaryEncoder('path/to/bundle.jbb', {
    'name': 'bundle',                 // Bundle Name (For x-ref)
    'object_table': THREEObjectTable, // Object Table to Use
})

// Encode your objects
bundle.encode( new THREE.Vector3(0,0,0), "scene/zero" );
bundle.encode( { "scene_name": "Test Scene" }, "scene/config" );

// Finalize and close
bundle.close();
```

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
