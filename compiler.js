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

	// Identify some important information
	var profile = config['profile'] || bundleData['profile'];
	if (!profile) {
		callback( "No jbb profile was specified!");
		return;
	}

	// Compile stages
	var loadImports = function( cb ) {
		return function() {
			var imports = bundleData['imports'];
			if (!imports) { cb(); return; };

			// TODO: Import imports

			// Keep keys to ignore and continue
			ignoreKeys = Object.keys(database);
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
					loader = item[0], key = item[1], file = item[2];

				// Convert relative path to full-path
				if (file.substr(0,1) != "/") {
					file = path.join(baseDir, file);
				}

				// Use profile loader to load this
				profileCompiler.load( file, key, exportDB, 
					function(err) {
						// Schedule next item
						setTimeout(getNext, 1);
					}
				);
			}

			// Start loading exports
			getNext();

		}
	}

	var createBundle = function( cb ) {
		return function() {

			// Create encoder
			var encoder = new BinaryEncoder(
					bundleFile,
					{
						'name' 			: bundleData['name'],
						'base_dir' 		: baseDir,
						'object_table' 	: profileTable,
						'log'			: config['log'] || 0x2000,
					}
				);

			// Set import database
			encoder.setDatabase(importDB);

			// Export items
			var keys = Object.keys(exportDB);
			for (var i=0; i<keys.length; i++) {
				var o = exportDB[keys[i]];
				encoder.encode( exportDB[keys[i]], keys[i] );
			}

			// Close & Complete
			encoder.close();
			cb();
		}
	}

	// Load profile table and compiler helper
	var profileTable = require('jbb-profile-'+profile);
	var profileCompiler = require('jbb-profile-'+profile+"/compiler");

	// Initialize profile compiler
	profileCompiler.initialize( 
		loadImports( compileExports ( createBundle( callback ) ) ) 
	);

}

/**
 * Export the 'compile' function
 */
module.exports = {
	'compile': compile
};
