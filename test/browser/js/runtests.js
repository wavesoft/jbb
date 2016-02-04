

// Import the three profile
var profileTable = require("jbb-profile-three");
var profileLoader = require("jbb-profile-three/loader");

// Use BundlesLoader for loading the source bundle
var BundlesLoader = require("../../../loader");
var BinaryDecoder = require("../../../decoder");

/**
 * Run test by trying to load the source and the binary
 */
function run_test( bundle ) {

	// Instantiate a new bundles loader
	var sourceLoader = new BundlesLoader( profileLoader, 'bundles' );
	// Instantiate a new binary decoder
	var binaryLoader = new BinaryDecoder( profileTable );

	// First load from source
	console.time("source["+bundle+"]");
	sourceLoader.add( bundle );
	sourceLoader.load( function() {
		console.timeEnd("source["+bundle+"]");

		// Then load the binary
		console.time("binary["+bundle+"]");
		binaryLoader.add( 'build/bundles/'+bundle+'.jbb', function() {
			binaryLoader.load(function() {
				console.timeEnd("binary["+bundle+"]");
			});
		});

	});

}

global.run_test = run_test;
