

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

	// Run timing tests for source
	var load_source = function( cb ){
		console.time("source["+bundle+"]");
		sourceLoader.add( bundle );
		sourceLoader.load(function() {
			console.timeEnd("source["+bundle+"]");
			cb();
		});
	};

	// Run timing tests for binary
	var load_binary = function( cb ){
		console.time("binary["+bundle+"]");
		binaryLoader.add( 'build/bundles/'+bundle+'.jbb', function() {
			binaryLoader.load(function() {
				console.timeEnd("binary["+bundle+"]");
				cb();
			});
		});
	}


	// Run binary first
	load_binary(function() {
		// Wait a sec
		setTimeout(function() {
			// Load source
			load_source(function() {
				console.log("-- test completed --");
			});
		}, 1000);
	});

}

global.run_test = run_test;
