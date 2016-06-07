"use strict";
/**
 * JBB - Javascript Binary Bundles - Binary Compiler
 * Copyright (C) 2015 Ioannis Charalampidis <ioannis.charalampidis@cern.ch>
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @author Ioannis Charalampidis / https://github.com/wavesoft
 */

var BinaryEncoder = require("./encoder");
var BinaryDecoder = require("./decoder");
var BundlesLoader = require("./loader");
var path = require('path');
var fs = require('fs');

/**
 * Wrapper function for the compile function, that first loads the
 * bundle specs from the source bundle file specified.
 */
function compileFile( sourceBundle, bundleFile, config, callback ) {
	var fname = sourceBundle + "/bundle.json";
	fs.readFile(fname, 'utf8', function (err,data) {
		if (err) {
			console.error("Unable to load file",fname);
			if (callback) callback( err, null );
			return;
		}

		// Update path if missing
		if (!config['path'])
			config['path'] = path.dirname( sourceBundle );

		// Compile
		compile( JSON.parse(data), bundleFile, config, callback );

	});
}

/**
 * Compile the specifie bundle data to the specified bundle file.
 * Additional information, such as profile or other compile-time parameters
 * can be specified through the config object.
 */
function compile( bundleData, bundleFile, config, callback ) {
	var baseDir = config['path'] || path.dirname(bundleFile);
	var encoder, profileEncoder = [], profileLoader = [], bundleLoader;

	// Compile stages
	var openBundle = function( cb ) {
		return function() {

			// Create encoder
			encoder = new BinaryEncoder(
					bundleFile,
					{
						'name' 			: bundleData['name'],
						'base_dir' 		: baseDir,
						'log'			: config['log'] || 0x00,
						'sparse'		: config['sparse'],
					}
				);

			// Add profiles
			for (var i=0; i<profileEncoder.length; i++) {
				encoder.addProfile( profileEncoder[i] );
			}

			// We are ready
			cb();
		}
	}

	var loadBundles = function( cb ) {
		return function() {
			// Load a bundle by specs
			bundleLoader.addBySpecs( bundleData );
			// Solve dependencies and load resources
			bundleLoader.load( cb );
		}
	}

	var compileExports = function( cb ) {
		return function() {
			// Get the bundle to encode
			var bundle = bundleLoader.bundles[ bundleData['name'] ];

			// Encode resources
			for (var k in bundle.resources) {
				encoder.encode( bundle.resources[k], k );
			}

			// Embed blobs
			for (var k in bundle.blobs) {
				encoder.embedBlob( bundle.blobs[k][0], k, bundle.blobs[k][1] );
			}

			// We are done
			cb();
		}
	}

	var closeBundle = function( cb ) {
		return function() {
			// Close & Complete
			encoder.close();
			cb();
		}
	}

	// Check for profileTable/profileLoader
	if (config['profileEncoder'] || config['profileLoader']) {

		// Check for missing arguments
		if (!config['profileEncoder']) {
			callback( "Got 'profileLoader' but missing 'profileEncoder' in the arguments" );
			return;
		}
		if (!config['profileLoader']) {
			callback( "Got 'profileEncoder' but missing 'profileLoader' in the arguments" );
			return;
		}

		// Fetch
		profileEncoder = config['profileEncoder'];
		profileLoader = config['profileLoader'];

		// Make sure it's array
		if (typeof profileEncoder === 'string')
			profileEncoder = [ profileEncoder ];
		if (typeof profileLoader === 'string')
			profileLoader = [ profileLoader ];

	} else {

		// Identify some important information
		var profile = config['profile'] || bundleData['profile'];
		if (!profile) {
			callback( "No jbb profile was specified!");
			return;
		}

		// Make sure it's array
		if (typeof profile === 'string')
			profile = [ profile ];

		// Require
		for (var i=0; i<profile.length; i++) {
			var pname = profile[i];
			if (pname[0] == ".") {
				profileEncoder.push( require( path.join(process.cwd(), pname, '/profile-encode') ) );
				profileLoader.push( require( path.join(process.cwd(), pname, "/profile-loader") ) );
			} else {
				profileEncoder.push( require('jbb-profile-'+pname+'/profile-encode') );
				profileLoader.push( require('jbb-profile-'+pname+"/profile-loader") );
			}
		}

	}

	// Load profile table and compiler helper
	bundleLoader = new BundlesLoader( baseDir );
	for (var i=0; i<profileLoader.length; i++) {
		bundleLoader.addProfileLoader( profileLoader[i] );
	}

	// Chained initialization of profile loaders
	var context = { 'remaining': profileLoader.length }
	var init_callback = (function() {
		if (--this.remaining == 0) {
			openBundle(
				loadBundles(
					compileExports(
						closeBundle( callback || function(){} )
						) 
					) 
			)();
		}
	}).bind(context);

	// Initialize profile compiler with the specs file
	for (var i=0; i<profileLoader.length; i++) {
		if (!profileLoader[i].initialize) {
			init_callback();
		} else {
			profileLoader[i].initialize( init_callback, bundleData );
		}
	}

}

/**
 * Export the 'compile' function
 */
module.exports = {
	'compile': compile,
	'compileFile': compileFile,
};
