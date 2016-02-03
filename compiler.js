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
 * Apply full path by replacing the ${BUNDLE} macro or
 * by prepending the path to the path if config is only a string
 */
function applyFullPath( baseDir, config ) {
	if (typeof(config) == "string") {
		// Check for full path
		if (config.substr(0,1) != "/")
			return path.join(baseDir, config);
		// Check for macros
		if (config.indexOf('${') > 0) {
			config = config.replace(/\${(.+?)}/g, function(match, contents, offset, s)
				{
					var key = contents.toLowerCase();
					if (key == "bundle") {
						return baseDir
					} else {
						console.warn("Unknown macro '"+key+"' encountered in: "+config);
						return "";
					}
				});
		}
		// Otherwise we are good
		return config;
	} else {
		if (config.constructor == ({}).constructor) {
			var ans = {};
			for (var k in config)
				ans[k] = applyFullPath( config[k] );
			return ans;
		} else if (config.length !== undefined) {
			var ans = [];
			for (var k in config)
				ans.push(applyFullPath( config[k] ));
			return ans;
		} else {
			return config;
		}
	}
}

/**
 * Compile the specifie bundle data to the specified bundle file.
 * Additional information, such as profile or other compile-time parameters
 * can be specified through the config object.
 */
function compile( bundleData, bundleFile, config, callback ) {
	var baseDir = config['path'] || path.dirname(bundleFile);
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
						'log'			: config['log'] || 0x00,
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

			// Create a new binary loader
			var binaryLoader = new BinaryLoader( profileTable );

			// Synchronously load all buffers 
			for (var i=0; i<imports.length; i++) {

				// Get full path
				var fullPath = applyFullPath( baseDir, imports[i] );
				console.log("Loading", fullPath);

				// Read file
				var file = fs.readFileSync( fullPath ),
					u8 = new Uint8Array(file),
					buf = u8.buffer;

				// Push buffer
				binaryLoader.loadBuffer(buf);
			}

			// Parse all buffers
			binaryLoader.parse();

			// Update encoder db
			encoder.setDatabase( binaryLoader.database );

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
					loader = item[0], key = item[1],
					loaderConfig = applyFullPath( baseDir, item[2] );

				console.log("Loading '"+key+"':", loaderConfig);

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
					profileCompiler.load( loader, loaderConfig, key, 
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
