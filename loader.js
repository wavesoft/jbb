"use strict";
/**
 * JBB - Javascript Binary Bundles - Binary Decoder
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

var toposort 	= require('toposort');
var path 		= require('path');
var mime 		= require('mime');

/**
 * Pick MIME type according to filename and known MIME Types
 */
function mimeTypeFromFilename( filename ) {
	var ext = filename.split(".").pop().toLowerCase();
	return mime.lookup(filename) || "application/octet-stream";
}

/**
 * State constants for the 
 */
const STATE_REQUESTED 	= 0;
const STATE_SPECS 		= 1;
const STATE_LOADING		= 2;
const STATE_LOADED 		= 3;

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
 * A bundle description pending in the loading queue,
 * waiting to be processed at loading time.
 */
var QueuedBundle = function( parent, name ) {

	/**
	 * State of the bundle item in queue
	 *
	 * 0 - Requested
	 * 1 - Specs loaded
	 * 2 - Imports satisfied
	 * 3 - Loaded
	 */ 
	this.state = STATE_REQUESTED;

	/**
	 * Reference to the Bundles instance
	 */
	this.bundles = parent;

	/**
	 * The bundle name
	 */
	this.name = name;

	/**
	 * The bundle base directory
	 */
	this.bundleURL = null;

	/**
	 * Bundle-specific resources
	 */
	this.resources = {};
	this.blobs = {};

	/**
	 * The bundle specifications
	 */
	this.specs = null;

	/**
	 * Callbacks of interested parties
	 */
	this.callbacks = [];

	/**
	 * Dependencies of this node
	 */
	this.depends = [];

	/**
	 * The loaded bundle item
	 */
	this.bundle = null;

}

/**
 * Update bundle location
 */
QueuedBundle.prototype.setURL = function( url ) {

	// Discard hash
	url = url.split("#")[0];

	// Separate suffix
	var parts = url.split("?"),
		suffix = parts[1] || "";
		url = parts[0];

	// Separate to base dir and filename
	this.bundleURL = url;

}

/**
 * Update file specifications
 */
QueuedBundle.prototype.setSpecs = function( specs ) {

	// Update state
	this.state = STATE_SPECS;
	this.specs = specs;

	// Update url if missing
	if (this.bundleURL == null) {
		this.bundleURL = this.bundles.baseURL;
		if (this.bundleURL) this.bundleURL += "/";
		this.bundleURL += specs['name'] + this.bundles.bundleSuffix;
	}

	// Lookup the depending nodes
	this.depends = [];

	// Express interest of importing the specified bundles
	var imports = specs['imports'] || [];
	if (imports.constructor === Array) {
		for (var i=0; i<imports.length; i++) {
			var bundleName = imports[i],
				bundleFile = bundleName + this.bundles.bundleSuffix;

			// Optionally add prefix
			if (this.bundles.baseURL)
				bundleFile = path.join(this.bundles.baseURL, bundleFile);

			// Express interest for loading the specified bundle
			var item = this.bundles.__queuedBundle( bundleName );
			if (item.state == STATE_REQUESTED)
				item.setURL( bundleFile );

			// Keep this on dependencies
			this.depends.push( item );

		}
	} else {
		var keys = Object.keys( imports );
		for (var i=0; i<keys.length; i++) {
			var bundleName = keys[i],
				bundleFile = imports[bundleName] + this.bundles.bundleSuffix;

			// Check for relative/full path
			if ((bundleFile.substr(0,1) != "/") && (bundleFile.indexOf("://") == -1)) {
				// Optionally add prefix
				if (this.bundles.baseURL) {
					bundleFile = path.join(this.bundles.baseURL, bundleFile);
				} else {
					bundleFile = path.join(this.bundleURL, bundleFile);
				}
			}

			// Express interest for loading the specified bundle
			var item = this.bundles.__queuedBundle( bundleName );
			if (item.state == STATE_REQUESTED)
				item.setURL( bundleFile );

			// Keep this on dependencies
			this.depends.push( item );

		}
	}

};

/**
 * Load specs from the url specified 
 */
QueuedBundle.prototype.loadSpecs = function( loadFn, callback ) {
	var self = this;

	//
	// Use the load function specified to load the specs
	// from the URL we have stored (as text, not as blob)
	//
	loadFn( this.bundleURL + '/bundle.json', false, function( err, fileBufer ) {
		// Update specs
		var specs = JSON.parse(fileBufer);
		self.setSpecs( specs );
		// Trigger callback
		if (callback) callback( null, self );
	});

};

/**
 * Load the actual bundle according to the specs 
 */
QueuedBundle.prototype.loadBundle = function( loadFn, callback ) {
	var self = this;

	// Serialize items/loaders
	var exports = this.specs['exports'],
		loaders = Object.keys(exports),
		items = [];
	for (var i=0; i<loaders.length; i++) {
		var keys = Object.keys(exports[loaders[i]]);
		for (var j=0; j<keys.length; j++) {
			items.push([ loaders[i], keys[j], exports[loaders[i]][keys[j]] ]);
		}
	}

	// Prepare completion callback
	var context = { 'counter': items.length };
	var load_callback = (function() {
		// When we reached 0, call process again
		if (--this.counter == 0) {
			// Mark as loaded
			this.state = STATE_LOADED;
			// Callback
			callback( self );
		}
	}).bind(context);

	// Mark as loading
	this.state = STATE_LOADING;

	// Load all items in parallel
	for (var i=0; i<items.length; i++) {
		var item = items[i],
			loader = item[0], key = item[1],
			loaderConfig = applyFullPath( this.bundleURL, item[2] );

		// If this is a binary blob, don't go through the profile compiler
		if (loader.toLowerCase() == "blob") {

			// Check if we have mime details
			var file = null, mime = null;
			if (typeof(loaderConfig) == "string") {
				file = loaderConfig;
				mime = mimeTypeFromFilename(loaderConfig);
			} else {
				file = loaderConfig[0];
				mime = loaderConfig[1];
			}

			// Use loader function to load file contents
			loadFn( file, true, function( err, fileBufer ) {

				// Expose blob
				self.blobs[key] = [fileBufer, mime];
				self.bundles.blobs[self.name+'/'+key] = [fileBufer, mime];

				// Decrement counter
				setTimeout(load_callback, 1);

			});

		} else {

			// Use profile loader to load this
			this.bundles.profileLoader.load( loaderConfig, key, loader,
				function(err, objects) {
					// Collect resources
					for (var k in objects) {

						// Expose resources
						self.resources[k] = objects[k];
						self.bundles.resources[self.name+'/'+k] = objects[k];

					}
					// Decrement counter
					setTimeout(load_callback, 1);
				}
			);

		}

	}

};

/**
 * Get edges in a format compatible for topological sorting
 * using the toposort bundle - Used for dependency resolution.
 */
QueuedBundle.prototype.getEdges = function() {
	var ans = [];

	// Collect dependencies
	for (var i=0; i<this.depends.length; i++) {
		ans.push([ this, this.depends[i] ]);
	}

	return ans;
}

/**
 * Push the callback function in the list of callbacks
 */
QueuedBundle.prototype.addCallback = function( cb ) {

	// If not really a callback, return
	if (!cb) return;

	// If loaded trigger right away
	if (this.state == STATE_LOADED) {
		cb( null, this );
		return;
	}

	// Otherwise put in queue
	this.callbacks.push(cb);

}

/**
 * Trigger all the pending callbacks
 */
QueuedBundle.prototype.triggerCallbacks = function( error ) {

	// Trigger callbacks
	if (error) {
		for (var i=0; i<this.callbacks.length; i++) {
			this.callbacks[i]( error, null );
		}
	} else {
		for (var i=0; i<this.callbacks.length; i++) {
			this.callbacks[i]( null, this );
		}
	}

	// Reset callbacks
	this.callbacks = [];

}


/**
 * Bundle manager
 */
var BundlesLoader = function( profileLoader, baseURL ) {

	/**
	 * Queued bundles
	 */
	this.queue = [];

	/**
	 * Loaded bundles
	 */
	this.bundles = {};

	/**
	 * Loaded resources and blobs of all bundles
	 */
	this.resources = {};
	this.blobs = {};

	/**
	 * Keep profile loader reference
	 */
	this.profileLoader = profileLoader;

	/**
	 * Load callbacks
	 */
	this.loadCallbacks = [];

	/**
	 * Base URL for everything else
	 */
	this.baseURL = baseURL || "";

	/**
	 * Default suffix for the bundles
	 */
	this.bundleSuffix = ".jbbsrc";

};

/**
 * Put a bundle in the queue, by it's name
 */
BundlesLoader.prototype.add = function( url, callback ) {

	// Extract bundle name from URL
	var name = path.basename(url.split("?")[0]);
	var nameParts = name.split(".");
	if (nameParts.length > 1) nameParts.pop();
	name = nameParts.join(".");

	// Get/Create bundle queue item
	var item = this.__queuedBundle( name );
	if (item.state == STATE_REQUESTED) {

		// Add prefix if needed
		if (this.baseURL)
			url = this.baseURL + '/' + url;

		// Set URL
		item.setURL( url );

	}

	// Register callback
	item.addCallback( callback );

}

/**
 * Put a bundle in the queue, by it's specifiactions
 */
BundlesLoader.prototype.addBySpecs = function( specs, callback ) {

	// Get/Create bundle queue item
	var item = this.__queuedBundle( specs['name'] );
	if (item.state == STATE_REQUESTED) {
		item.setSpecs( specs );
	}

	// Register callback
	item.addCallback( callback );

}

/**
 * Load all bundles in queue
 */
BundlesLoader.prototype.load = function( callback ) {
	// Keep callback in loadCallbacks
	this.loadCallbacks.push(callback);
	// Start loading
	this.__process();
}

/**
 * Load file contents
 */
BundlesLoader.prototype.__loadFileContents = function( url, asBlob, callback ) {
	var isBrowser=new Function("try {return this===window;}catch(e){ return false;}"); // browser exclude
	if (!isBrowser() /* browser exclude */) {
		// Load file contents
		var fs = require('fs');
		if (asBlob) {
			var buf = fs.readFileSync( url ),		// Load Buffer
				ab = new ArrayBuffer( buf.length ),	// Create an ArrayBuffer to fit the data
				view = new Uint8Array(ab);			// Create an Uint8Array view

			// Copy buffer into view
			for (var i = 0; i < buf.length; ++i)
			    view[i] = buf[i];
			callback(null, view );
		} else {
			fs.readFile(url, {encoding: 'utf8'}, callback);
		}
	} else {
		var req = new XMLHttpRequest(),
			scope = this;

		// Place request
		req.open('GET', url);
		if (asBlob) {
			req.responseType = "arraybuffer";
		} else {
			req.responseType = "text";
		}
		req.send();

		// Wait until the file is loaded
		req.onreadystatechange = function () {
			if (req.readyState !== 4) return;
			callback(null, req.response);
		}
	}
};

/**
 * Get an item from the queue or express interest for a new item
 */
BundlesLoader.prototype.__queuedBundle = function( name ) {

	// Get/Create bundle queue item
	var item = this.bundles[name];
	if (!item) {

		// Create new item
		item = new QueuedBundle( this, name );

		// Put on queue
		this.bundles[name] = item;
		this.queue.push( item );

	}

	// Return item
	return item;

}

/**
 * Process queue
 */
BundlesLoader.prototype.__process = function() {
	var self = this;

	// Check if we have at least one item in 'requested' state
	var pendingRequested = false;
	for (var i=0; i<this.queue.length; i++) {
		if (this.queue[i].state == STATE_REQUESTED) {
			pendingRequested = true;
			break;
		}
	}

	////////////////////////////////////////////////////////
	// Iteration 1 - STATE_REQUESTED -> STATE_SPECS
	// ----------------------------------------------------
	// Download bundle specifications for every bundle
	// in pending state. 
	////////////////////////////////////////////////////////

	// If there are items pending request, download them in parallel
	if (pendingRequested) {

		var context = { 'counter': 0 };
		var load_callback = (function( err ) {
			// Check fo errors
			if (err) {
				console.error("Error loading bundle", err);
				return;
			}

			// When we reached 0, call process again
			if (--this.counter == 0) {
				setTimeout( self.__process.bind(self), 1 );
			}
		}).bind(context);

		// Load all items pending
		for (var i=0; i<this.queue.length; i++) {
			var item = this.queue[i];

			// Download pending requests in parallel
			if (item.state == STATE_REQUESTED) {
				context.counter++;
				item.loadSpecs( this.__loadFileContents, load_callback );
			}
		}

		// We are done for this iteration
		return;
	}

	// Collect edges
	var edges = [];
	for (var i=0; i<this.queue.length; i++) {
		edges = edges.concat( this.queue[i].getEdges() );
	}

	// Collect the bundles that are part of a dependency graph
	var depBundles = toposort(edges).reverse();

	// Collect bundles outside the dependency graph
	var nodepBundles = [];
	for (var i=0; i<this.queue.length; i++) {
		var item = this.queue[i];
		if (depBundles.indexOf(item) == -1) {
			if (item.state == STATE_SPECS)
				nodepBundles.push( item );
		}
	}

	////////////////////////////////////////////////////////
	// Iteration 2 - STATE_SPECS -> STATE_LOADED
	// ----------------------------------------------------
	// Download bundles that are not part of a dependency
	// graph in parallel.
	////////////////////////////////////////////////////////

	// If we have bundles without dependencies, load them in parallel
	if (nodepBundles.length > 0) {

		var context = { 'counter': 0 };
		var load_callback = (function() {
			// When we reached 0, call process again
			if (--this.counter == 0) {
				setTimeout( self.__process.bind(self), 1 );
			}
		}).bind(context);

		// Load all items pending
		for (var i=0; i<nodepBundles.length; i++) {
			var item = nodepBundles[i];
			// Download pending requests in parallel
			context.counter++;
			item.loadBundle( this.__loadFileContents, function(bundle) {
				// Callback bundle callbacks
				bundle.triggerCallbacks();
				// Decrement counter
				setTimeout(load_callback,1);
			});
		}

		// We are done for this iteration
		return;

	}

	////////////////////////////////////////////////////////
	// Iteration 3 - STATE_SPECS -> STATE_LOADED
	// ----------------------------------------------------
	// Download cross-referenced bundles in the order they
	// appear in the dependency graph.
	////////////////////////////////////////////////////////

	var context = { 'bundles': depBundles };
	var load_step = (function() {

		// Get next item
		var item = this.bundles.shift();
		if (!item) {
			// We are done loading the bundle chain, fire callbacks
			for (var i=0; i<self.loadCallbacks.length; i++)
				self.loadCallbacks[i]();
			// And reset them
			self.loadCallbacks = [];
			return;
		}

		// Skip items that are already loaded
		if (item.state != STATE_SPECS) {
			setTimeout(load_step,1);
			return;
		}

		// Load bundle
		item.loadBundle( self.__loadFileContents, function(bundle) {
			// Callback bundle callbacks
			bundle.triggerCallbacks();
			// Decrement counter
			setTimeout(load_step,1);
		});

	}).bind(context);

	// Start loading
	load_step();

}

// Export bundles class
module.exports = BundlesLoader;
