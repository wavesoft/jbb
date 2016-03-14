# bundle.json

The following example describes the full parameter set that you can use
in your own `bundle.json` file:

```javascript
{
    //
    // -= name =-
    //
    // The name of the bundle, used internally or tagging the contents of 
    // the bundle. This name SHOULD match the name of the bundle (without 
    // the extension)
    //
    // -----------------------------------------------------------------------
    //   Default : (required)
    //      Type : string
    //
    "name"      : "bundle-name",

    //
    // -= profile =-
    //
    // The name of jbb profile to use for compiling the contents of this bundle.
    // The profile provides the loader functions and the binary specifications
    // for the contents. Refer to the bundle you are interested in for more
    // details.
    //
    // The name of the bundle should not include the 'jbb-bndle-' prefix. For
    // example, specify 'three' for 'jbb-profile-three'.
    //
    // If this parameter is missing the profile must be specified at 
    // compile-time.
    //
    // -----------------------------------------------------------------------
    //   Default : ""
    //      Type : string
    //
    "profile"   : "three",

    //
    // -= imports =-
    //
    // Other bundles this bundle depends on. These bundles will be loaded
    // before loading the contents of this bundle.
    //
    // It's important to provide this information if your bundle has external
    // references, in order to properly resolve them at loading time.
    //
    // You can specify the bundle names as an array of strings. In this case,
    // the compiler will try to locate them in the 'path' directory specified
    // at compile-time:
    //
    //  "imports": [ "bundle-1", "bundle-2" ]
    //
    // If you want more control, you can provide the path to the bundle (without
    // the extension) yourself:
    //
    //  "imports": {
    //      "bundle-1": "../bundle-1",
    //      "bundle-2": "bundles/bundle-2"
    //  }
    //
    // -----------------------------------------------------------------------
    //   Default : []
    //      Type : array | object
    //
    "imports"   : [ "dependant-module-1", "dependant-module-2" ],

    //
    // -= exports =-
    //
    // This section contains the information for what resources are exposed
    // by this bundle. You will need to specify the loader class to use for
    // each class of resources.
    //
    // -----------------------------------------------------------------------
    //   Default : (required)
    //      Type : object
    //
    "exports"   : {

        //
        // -= (Blob Embeds) =-
        //
        // Resources that cannot be serialized by the JBB compiler (such as 
        // images, sounds or other binary resources) can be placed in the 
        // "blob" (case-insensitive) group.
        //
        // These files are just embedded as-is in the final bundle and do not
        // benefit by any optimisation.
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

        },

        //
        // -= (Loader Class) =-
        //
        // Specify the loader class that is capapble of loading the resources
        // in this group.
        //
        // This key is profile-specific, therefore you should refer to the
        // appropriate jbb profile documentation for more details.
        //
        "THREE.JSONLoader": {

            //
            // -= (Resources) =-
            //
            // Here you specify your actual resources and the key they will
            // be available in the bundle:
            //
            //   "key" : "path/to/resource"
            //
            // Each loader accepts different kind of parameters, so refer to
            // the jbb profile for more details. However in most of the cases
            // this is just a string pointing to the resources, relative to
            // the bundle folder.
            // 
            // On a more complicated scenarios, the macro ${BUNDLE} is
            // provided for convenience, and it expands to the base directory
            // of the bundle. Refer on the THREE.MD2CharacterLoader example
            // below for an example.
            //
            "test-model": "${BUNDLE}/models/test.json",

            //
            // If the ${BUNDLE} macro is not used, the path to the resources
            // should be relative to the bundle directory
            //
            "another-model": "modeuls/world.json",

            //
            // There is no limitation on how many resources you can export
            //
            "big-model": "models/big.json",
            "strong-model": "models/strong.json",
            "tall-model": "models/tall.json",
            "short-model": "models/short.json",
            "thin-model": "models/thin.json",
            ...

        },

        //
        // Other loaders require more complex configuration
        // rather than just a filename.
        //
        "THREE.MD2CharacterLoader": {
            
            //
            // For example, the MD2CharacterLoader requires detailed
            // configuration for various parts (hence the need for             // the ${BUNDLE} macro)
            //
            "ratamahatta": {
                "baseUrl": "${BUNDLE}/mesh/ratamahatta/",
                "body": "ratamahatta.md2",
                "skins": [ "ratamahatta.png", "ctf_b.png", "ctf_r.png", "dead.png", "gearwhore.png" ],
                "weapons": [  [ "weapon.md2", "weapon.png" ],
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

        }

    }
}
```