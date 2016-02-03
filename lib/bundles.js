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

const STATE_REQUESTED = 0;
const STATE_SPECS = 1;
const STATE_SATISFIED = 2;
const STATE_LOADED = 3;

/**
 * Repository of loaded bundles for cross-referencing while loading
 */
var bundleRepository = {};

/**
 * Shared object store of all loaded bundles
 */
var bundleObjects = {};

/**
 * Bundle is a wrapping class around module specification
 */
function Bundle( spec ) {

	// Parse details
	if (!spec['name']) {
		throw "Missing 'name' from bundle specifications!";
	}

	// Keep specifications
	this.spec = spec;

	// Overridable functions for loading resources
	// and other bundles
	this.fnImport = function( url, callback ) {
		callback( "Not implemented", null );
	};
	this.fnExport = function( url, callback ) {
		callback( "Not implemented", null );
	};

}

/**
 * Handle module imports
 */
Bundle.prototype.loadImports = function( callback ) {

	// If we have no imports fire callback right away
	if (!this.spec['imports']) callback( null, [] );
	
	// 	

}

/**
 * Put a bundle specs in the loading queues
 */
function queueBundle( specs, callback ) {

	// Get bundle name
	var name = specs['name'];
	if (!name) {
		callback( "Missing 'name' in the bundle specs" , null );
		return;
	}

	// Check if this bundle is already in the list
	if (bundleRepository[name]) {
		var bundle = bundleRepository[name];

		// If already loaded, trigger callback
		if (bundle.state == STATE_LOADED) {
			if (callback) callback( null, bundle.exports );
		}
		// Otherwise schedule to be called when loaded
		else {
			bundle.callbacks.push( callback );
		}
		return;
	}

	// Check for imports and queue them along


	bundleRepository[specs['name']]
}

/**
 * Load the contents of the specified URL and call queueBundle
 */
function loadAndQueue( url, callback ) {

	// Use different approaches when loading from browser or from node.js
	var isBrowser=new Function("try {return this===window;}catch(e){ return false;}"); // browser exclude
	if (!isBrowser() /* browser exclude */) {
		try {

			// Load file contents
			var file = fs.readFileSync( url ),
				u8 = new Uint8Array(file),
				buf = u8.buffer;

			// Call QueueBundle
			queueBundle( JSON.parse(buf), callback );

		} catch (e) {

			// Fire error callback
			if (callback) callback("Error parsing bundle "+url+": "+e.toString(), null);

		}

		// Do not continue to browser-only version
		return;
	}

	// Perform an XMLHttpRequest to get the specifications of the bundle specified
	var req = new XMLHttpRequest(),
		scope = this;

	// Place request
	req.open('GET', url);
	req.responseType = "text";
	req.send();

	// Wait until the bundle specifications are loaded
	req.onreadystatechange = function () {
		if (req.readyState !== 4) return;
		try {

			// Parse description
			var bundleSpec = JSON.parse(req.response);

			// Call QueueBundle
			queueBundle( bundleSpec, callback );

		} catch (e) {

			// Fire error callback
			if (callback) callback("Error parsing bundle "+url+": "+e.toString(), null);

		}
	}

}

var BundleQueueItem = function( name ) {

	/**
	 * The bundle name
	 */
	this.name = name;

	/**
	 * The bundle URL
	 */
	this.url = null;

	/**
	 * State of the bundle item in queue
	 *
	 * 0 - Requested
	 * 1 - Specs loaded
	 * 2 - Imports satisfied
	 * 3 - Loaded
	 */ 
	this.state = 0;

	/**
	 * The bundle specifications
	 */
	this.specs = null;

	/**
	 * Callbacks of interested parties
	 */
	this.callbacks = [];

	/**
	 * The loaded bundle item
	 */
	this.bundle = null;

}

/**
 * Update file specifications
 */
BundleQueueItem.prototype.setSpecs = function( sepcs ) {
	this.state = STATE_SPECS;
	this.specs = specs;
};

/**
 * Load specs from the url specified 
 */
BundleQueueItem.prototype.loadSpecs = function( loadFn, callback ) {
	var self = this;

	// Use the load function specified to load the specs
	// from the URL we have stored.
	loadFn( this.url, function(specs) {

		// Update specs
		self.setSpecs( specs );

		// Trigger callback
		if (callback) callback();

	});

};

/**
 * Bundle manager
 */
var Bundles = function() {

	/**
	 * Queued bundles
	 */
	this.queued = [];

	/**
	 * Loaded bundles
	 */
	this.bundles = {};

	/**
	 * Overridable functions
	 */
	this.fnLoadFileContents = null;

};

/**
 * Load next item from the bundle queue
 */
Bundles.prototype.loadNext = function( callback ) {

	// Pop item from the queued list
	var item = this.queued.shift();
	if (!item) callback( null, true ); // This was the last item

	// 

};

/**
 * Get an item from the queue or express interest for a new item
 */
Bundles.prototype.__queuedBundle = function( name ) {

	// Get/Create bundle queue item
	var item = this.bundles[name];
	if (!item) {

		// Create new item
		item = new BundleQueueItem( name );

		// Put on queue
		this.bundles[name] = item;
		this.queue.push( item );

	}

	// Return item
	return item;

}

/**
 * Load and queue the specified bundle
 */
Bundles.prototype.loadAndQueue = function( name, url, callback, _relativePath ) {

}

/**
 * Put bundle specs in the queue
 */
Bundles.prototype.queue = function( specs, callback, _relativePath ) {

	// Get bundle name
	var name = specs['name'];
	if (!name) {
		callback( "Name is required!", null );
		return;
	}

	// Get/Create bundle queue item
	item = this.__queuedBundle( name );
	if (item.state == STATE_REQUESTED) {
		item.setSpecs( specs );
	}

	// If this item is already loaded, fire callback
	if (item.state == STATE_LOADED) {
		callback( null, item.bundle );
		return;
	}
	// Otherwise schedule callback to be fired when loaded
	else {
		item.callbacks.push( callback );
	}

	// Calculate relative path if specified
	if (!_relativePath) {
		_relativePath = "";
	} else {
		_relativePath += "/";
	}

	// Express interest of importing the specified modules
	var imports = specs['imports'] || [];
	if (imports.constructor === Array) {
		for (var i=0; i<imports.length; i++) {
			var moduleName = imports[i],
				moduleFile = _relativePath + moduleName + '.jbb';

			// Express interest for loading the specified module
			item = this.__queuedBundle( moduleName );
			if (item.state == STATE_REQUESTED)
				item.url = moduleFile;

		}
	} else {
		var keys = Object.keys( imports );
		for (var i=0; i<keys.length; i++) {
			var moduleName = keys[i],
				moduleFile = imports[moduleName];

			// Check for relative/full path
			if ((moduleFile.substr(0,1) != "/") && (moduleFile.indexOf("://") == -1))
				moduleFile = _relativePath + moduleFile;

			// Express interest for loading the specified module
			item = this.__queuedBundle( moduleName );
			if (item.state == STATE_REQUESTED)
				item.url = moduleFile;

		}
	}

}

/**
 * Process queue
 */
Bundles.prototype.__process = function() {

	// Check if we have at least one item in 'requested' state
	var pendingRequested = false;
	for (var i=0; i<this.queue.length; i++) {
		if (this.queue[i].state == STATE_REQUESTED) {
			pendingRequested = true;
			break;
		}
	}

	// If there are items pending request, download
	// them aggressively
	if (pendingRequested) {

		// Load all items pending
		for (var i=0; i<this.queue.length; i++) {
			var queue = this.queue[i];
		}

	}

	// Otherwise start loding bundles aggressively
	else {

	}

}

// Export functions
module.exports = {

	'queue': queueBundle,

};
