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
var path = require('path');

/**
 * Compile the specifie bundle data to the specified bundle file.
 * Additional information, such as profile or other compile-time parameters
 * can be specified through the config object.
 */
function compile( bundleData, bundleFile, config, callback ) {
	var baseDir = config['path'] || path.dirname(bundleFile);
	var importDB = {}, exportDB = {};
	var encoder, profileTable, profileCompiler;

	// Identify some important information
	var profile = config['profile'] || bundleData['profile'];
	if (!profile) {
		callback( "No jbb profile was specified!");
		return;
	}

	// Compile stages
	var openBundle = function( cb ) {
		return function() {

			// Create encoder
			encoder = new BinaryEncoder(
					bundleFile,
					{
						'name' 			: bundleData['name'],
						'base_dir' 		: baseDir,
						'object_table' 	: profileTable,
						'log'			: config['log'] || 0x2000,
					}
				);

			// We are ready
			cb();
		}
	}

	var loadImports = function( cb ) {
		return function() {
			var imports = bundleData['imports'];
			if (!imports) { cb(); return; };

			// TODO: Import imports

			// Update encoder db
			encoder.setDatabase(importDB);
			cb();
		}
	}

	var compileExports = function( cb ) {
		return function() {
			var exports = bundleData['exports'];
			if (!exports) { cb(); return; };

			// Serialize items/loaders
			var loaders = Object.keys(exports),
				items = [];
			for (var i=0; i<loaders.length; i++) {
				var keys = Object.keys(exports[loaders[i]]);
				for (var j=0; j<keys.length; j++) {
					items.push([ loaders[i], keys[j], exports[loaders[i]][keys[j]] ]);
				}
			}

			// Process items
			var getNext = function() {
				if (items.length == 0) { cb(); return; }
				var item = items.shift(),
					loader = item[0], key = item[1], loaderConfig = item[2];

				// Convert relative path to full-path
				if (typeof(loaderConfig) == "string") {
					if (loaderConfig.substr(0,1) != "/") {
						loaderConfig = path.join(baseDir, loaderConfig);
					}
				}

				// If this is a binary blob, don't go through the profile compiler
				if (loader.toLowerCase() == "blob") {

					// Check if we have mime details
					var file = null, mime = null;
					if (typeof(loaderConfig) == "string") {
						file = loaderConfig;
					} else {
						file = loaderConfig[0];
						mime = loaderConfig[1];
					}

					// Encode blob
					encoder.embed( file, mime );

				} else {

					// Use profile loader to load this
					profileCompiler.load( loaderConfig, key, 
						function(err, objects) {

							// Encode objects
							for (var k in objects) {
								encoder.encode( objects[k], k );
							}

							// Schedule next item
							setTimeout(getNext, 1);
						}
					);

				}
			}

			// Start loading exports
			getNext();

		}
	}

	var closeBundle = function( cb ) {
		return function() {
			// Close & Complete
			encoder.close();
			cb();
		}
	}

	// Load profile table and compiler helper
	profileTable = require('jbb-profile-'+profile);
	profileCompiler = require('jbb-profile-'+profile+"/compiler");

	// Initialize profile compiler
	profileCompiler.initialize( 
		openBundle(
			loadImports(
				compileExports(
					closeBundle( callback )
					) 
				) 
			)
	);

}

/**
 * Export the 'compile' function
 */
module.exports = {
	'compile': compile
};
