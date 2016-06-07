/* JBB Source Bundle Loader - https://github.com/wavesoft/jbb */
var JBB = JBB || {}; JBB["SourceLoader"] =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

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

	var toposort 	= __webpack_require__(1);
	var path 		= __webpack_require__(2);
	var mime 		= __webpack_require__(4);

	var IS_BROWSER  = true && (new Function("try {return this===window;}catch(e){ return false;}")());

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
	const STATE_FAILED 		= 4;

	/**
	 * Apply full path by replacing the ${BUNDLE} macro or
	 * by prepending the path to the path if config is only a string
	 */
	function applyFullPath( baseDir, suffix, config, skipRelative ) {
		if (typeof(config) == "string") {
			// Check for macros
			if (config.indexOf('${') >= 0) {
				config = config.replace(/\${(.+?)}/g, function(match, contents, offset, s)
					{
						var key = contents.toLowerCase();
						if (key === "bundle") {
							return baseDir
						} else if (key === "suffix") {
							return suffix;
						} else {
							console.warn("Unknown macro '"+key+"' encountered in: "+config);
							return "";
						}
					});
			// Check for full path
			} else if (!skipRelative && config.substr(0,1) != "/") {
				return path.join(baseDir, config) + suffix;
			}
			// Otherwise we are good
			return config;
		} else {
			if (config.constructor == ({}).constructor) {
				var ans = {};
				for (var k in config) 
					ans[k] = applyFullPath( baseDir, suffix, config[k], true );
				return ans;
			} else if (config.length !== undefined) {
				var ans = [];
				for (var i=0; i<config.length; i++)
					ans.push(applyFullPath( baseDir, suffix, config[i], true ));
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
		 * Suffix to append to bundle files
		 */
		this.bundleURLSuffix = "";

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
		if (suffix) this.bundleURLSuffix = "?"+suffix;

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
		loadFn( this.bundleURL + '/bundle.json' + this.bundleURLSuffix, false, function( err, fileBufer ) {
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
				// Callback
				callback( self );
			}
		}).bind(context);

		// Mark as loading
		this.state = STATE_LOADING;

		// Load all items in parallel
		for (var i=0; i<items.length; i++) {
			var item = items[i],
				loaderClass = item[0], key = item[1],
				loaderConfig = applyFullPath( this.bundleURL, this.bundleURLSuffix, item[2] );

			// If this is a binary blob, don't go through the profile compiler
			if (loaderClass.toLowerCase() == "blob") {

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

					// Handle errors
					if (err) {

						// Mark as failed
						self.state = STATE_FAILED;
						self.error = err;

					} else {

						// Expose blob
						self.blobs[key] = [fileBufer, mime];

						// Expose blobs to the database only if accessing from the browser
						if (IS_BROWSER) {
							var blob = new Blob([ fileBufer ], { type: mime });
							self.bundles.database[self.name+'/'+key] = URL.createObjectURL(blob);
						}

						// Mark as loaded
						self.state = STATE_LOADED;

					}

					// Decrement counter
					setTimeout(load_callback, 1);

				});

			} else {

				// Try all loaded profile loaders until something works ount
				var loaders = this.bundles.profileLoaders, loaded = false;
				for (var j=0, l=loaders.length; j<l; j++) {

					// Try this bundle loader to load the specified resources
					loaded = loaders[j].load( loaderClass, loaderConfig, key,
						function(err, objects) {
							// Handle errors
							if (err) {

								// Mark as failed
								self.state = STATE_FAILED;
								self.error = err;

							} else {

								// Collect resources
								for (var k in objects) {

									// Expose resources
									self.resources[k] = objects[k];
									self.bundles.database[self.name+'/'+k] = objects[k];

								}

								// Mark as loaded
								self.state = STATE_LOADED;

							}

							// Decrement counter
							setTimeout(load_callback, 1);

						}
					);

					// If this worked, don't try other loader
					if (loaded) break;
				}

				// Check if this could't be loaded
				if (!loaded) {

					// Mark as failed
					self.state = STATE_FAILED;
					self.error = "The load class '"+loaderClass+"' is not handled by any profile(s)";

					// Decrement counter
					setTimeout(load_callback, 1);

				}

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

		// If loaded or failed trigger right away
		if (this.state == STATE_LOADED) {
			cb( null, this );
			return;
		} else if (this.state == STATE_FAILED) {
			cb( this.error, null );
			return;
		}

		// Otherwise put in queue
		this.callbacks.push(cb);

	}

	/**
	 * Trigger all the pending callbacks
	 */
	QueuedBundle.prototype.triggerCallbacks = function() {

		// Trigger callbacks
		if (this.state == STATE_FAILED) {
			for (var i=0; i<this.callbacks.length; i++) {
				this.callbacks[i]( this.error, null );
			}
		} else if (this.state == STATE_LOADED) {
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
	var BundlesLoader = function( baseURL ) {

		/**
		 * Queued bundles
		 */
		this.queue = [];

		/**
		 * Loaded bundles
		 */
		this.bundles = {};

		/**
		 * Failed bundles
		 */
		this.failedBundles = [];

		/**
		 * Database of all loaded resources
		 */
		this.database = {};

		/**
		 * Keep profile loader reference
		 */
		this.profileLoaders = [];

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
	 * Include a loader profile
	 */
	BundlesLoader.prototype.addProfileLoader = function( profileLoader ) {

		// Include this profile loader on stack
		this.profileLoaders.push( profileLoader );

	}

	/**
	 * Put a bundle in the queue, by it's name
	 */
	BundlesLoader.prototype.add = function( url, callback ) {

		// Extract bundle name from URL
		var urlparts = url.split("?"), suffix="",
			name = path.basename(urlparts[0]);
		var nameParts = name.split(".");
		if (nameParts.length > 1) nameParts.pop();
		name = nameParts.join(".");
		if (urlparts.length > 1) suffix="?"+urlparts[1];
		url = urlparts[0];

		// Get/Create bundle queue item
		var item = this.__queuedBundle( name );
		if (item.state == STATE_REQUESTED) {

			// Add prefix if needed
			if (this.baseURL)
				url = this.baseURL + '/' + url;

			// Set URL
			item.setURL( url + this.bundleSuffix + suffix );

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
		if (!IS_BROWSER /* browser exclude */) {
			// Node Code
			var fs = __webpack_require__(5);
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
			return;
		}

		// Broswer code
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
					// Collect failed bundles
					if (bundle.state == STATE_FAILED) {
						self.failedBundles.push(bundle);
					}
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
					self.loadCallbacks[i]( this.database, this.failedBundles );
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


/***/ },
/* 1 */
/***/ function(module, exports) {

	
	/**
	 * Topological sorting function
	 *
	 * @param {Array} edges
	 * @returns {Array}
	 */

	module.exports = exports = function(edges){
	  return toposort(uniqueNodes(edges), edges)
	}

	exports.array = toposort

	function toposort(nodes, edges) {
	  var cursor = nodes.length
	    , sorted = new Array(cursor)
	    , visited = {}
	    , i = cursor

	  while (i--) {
	    if (!visited[i]) visit(nodes[i], i, [])
	  }

	  return sorted

	  function visit(node, i, predecessors) {
	    if(predecessors.indexOf(node) >= 0) {
	      throw new Error('Cyclic dependency: '+JSON.stringify(node))
	    }

	    if (!~nodes.indexOf(node)) {
	      throw new Error('Found unknown node. Make sure to provided all involved nodes. Unknown node: '+JSON.stringify(node))
	    }

	    if (visited[i]) return;
	    visited[i] = true

	    // outgoing edges
	    var outgoing = edges.filter(function(edge){
	      return edge[0] === node
	    })
	    if (i = outgoing.length) {
	      var preds = predecessors.concat(node)
	      do {
	        var child = outgoing[--i][1]
	        visit(child, nodes.indexOf(child), preds)
	      } while (i)
	    }

	    sorted[--cursor] = node
	  }
	}

	function uniqueNodes(arr){
	  var res = []
	  for (var i = 0, len = arr.length; i < len; i++) {
	    var edge = arr[i]
	    if (res.indexOf(edge[0]) < 0) res.push(edge[0])
	    if (res.indexOf(edge[1]) < 0) res.push(edge[1])
	  }
	  return res
	}


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	// resolves . and .. elements in a path array with directory names there
	// must be no slashes, empty elements, or device names (c:\) in the array
	// (so also no leading and trailing slashes - it does not distinguish
	// relative and absolute paths)
	function normalizeArray(parts, allowAboveRoot) {
	  // if the path tries to go above the root, `up` ends up > 0
	  var up = 0;
	  for (var i = parts.length - 1; i >= 0; i--) {
	    var last = parts[i];
	    if (last === '.') {
	      parts.splice(i, 1);
	    } else if (last === '..') {
	      parts.splice(i, 1);
	      up++;
	    } else if (up) {
	      parts.splice(i, 1);
	      up--;
	    }
	  }

	  // if the path is allowed to go above the root, restore leading ..s
	  if (allowAboveRoot) {
	    for (; up--; up) {
	      parts.unshift('..');
	    }
	  }

	  return parts;
	}

	// Split a filename into [root, dir, basename, ext], unix version
	// 'root' is just a slash, or nothing.
	var splitPathRe =
	    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
	var splitPath = function(filename) {
	  return splitPathRe.exec(filename).slice(1);
	};

	// path.resolve([from ...], to)
	// posix version
	exports.resolve = function() {
	  var resolvedPath = '',
	      resolvedAbsolute = false;

	  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
	    var path = (i >= 0) ? arguments[i] : process.cwd();

	    // Skip empty and invalid entries
	    if (typeof path !== 'string') {
	      throw new TypeError('Arguments to path.resolve must be strings');
	    } else if (!path) {
	      continue;
	    }

	    resolvedPath = path + '/' + resolvedPath;
	    resolvedAbsolute = path.charAt(0) === '/';
	  }

	  // At this point the path should be resolved to a full absolute path, but
	  // handle relative paths to be safe (might happen when process.cwd() fails)

	  // Normalize the path
	  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
	    return !!p;
	  }), !resolvedAbsolute).join('/');

	  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
	};

	// path.normalize(path)
	// posix version
	exports.normalize = function(path) {
	  var isAbsolute = exports.isAbsolute(path),
	      trailingSlash = substr(path, -1) === '/';

	  // Normalize the path
	  path = normalizeArray(filter(path.split('/'), function(p) {
	    return !!p;
	  }), !isAbsolute).join('/');

	  if (!path && !isAbsolute) {
	    path = '.';
	  }
	  if (path && trailingSlash) {
	    path += '/';
	  }

	  return (isAbsolute ? '/' : '') + path;
	};

	// posix version
	exports.isAbsolute = function(path) {
	  return path.charAt(0) === '/';
	};

	// posix version
	exports.join = function() {
	  var paths = Array.prototype.slice.call(arguments, 0);
	  return exports.normalize(filter(paths, function(p, index) {
	    if (typeof p !== 'string') {
	      throw new TypeError('Arguments to path.join must be strings');
	    }
	    return p;
	  }).join('/'));
	};


	// path.relative(from, to)
	// posix version
	exports.relative = function(from, to) {
	  from = exports.resolve(from).substr(1);
	  to = exports.resolve(to).substr(1);

	  function trim(arr) {
	    var start = 0;
	    for (; start < arr.length; start++) {
	      if (arr[start] !== '') break;
	    }

	    var end = arr.length - 1;
	    for (; end >= 0; end--) {
	      if (arr[end] !== '') break;
	    }

	    if (start > end) return [];
	    return arr.slice(start, end - start + 1);
	  }

	  var fromParts = trim(from.split('/'));
	  var toParts = trim(to.split('/'));

	  var length = Math.min(fromParts.length, toParts.length);
	  var samePartsLength = length;
	  for (var i = 0; i < length; i++) {
	    if (fromParts[i] !== toParts[i]) {
	      samePartsLength = i;
	      break;
	    }
	  }

	  var outputParts = [];
	  for (var i = samePartsLength; i < fromParts.length; i++) {
	    outputParts.push('..');
	  }

	  outputParts = outputParts.concat(toParts.slice(samePartsLength));

	  return outputParts.join('/');
	};

	exports.sep = '/';
	exports.delimiter = ':';

	exports.dirname = function(path) {
	  var result = splitPath(path),
	      root = result[0],
	      dir = result[1];

	  if (!root && !dir) {
	    // No dirname whatsoever
	    return '.';
	  }

	  if (dir) {
	    // It has a dirname, strip trailing slash
	    dir = dir.substr(0, dir.length - 1);
	  }

	  return root + dir;
	};


	exports.basename = function(path, ext) {
	  var f = splitPath(path)[2];
	  // TODO: make this comparison case-insensitive on windows?
	  if (ext && f.substr(-1 * ext.length) === ext) {
	    f = f.substr(0, f.length - ext.length);
	  }
	  return f;
	};


	exports.extname = function(path) {
	  return splitPath(path)[3];
	};

	function filter (xs, f) {
	    if (xs.filter) return xs.filter(f);
	    var res = [];
	    for (var i = 0; i < xs.length; i++) {
	        if (f(xs[i], i, xs)) res.push(xs[i]);
	    }
	    return res;
	}

	// String.prototype.substr - negative index don't work in IE8
	var substr = 'ab'.substr(-1) === 'b'
	    ? function (str, start, len) { return str.substr(start, len) }
	    : function (str, start, len) {
	        if (start < 0) start = str.length + start;
	        return str.substr(start, len);
	    }
	;

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(3)))

/***/ },
/* 3 */
/***/ function(module, exports) {

	// shim for using process in browser

	var process = module.exports = {};
	var queue = [];
	var draining = false;
	var currentQueue;
	var queueIndex = -1;

	function cleanUpNextTick() {
	    if (!draining || !currentQueue) {
	        return;
	    }
	    draining = false;
	    if (currentQueue.length) {
	        queue = currentQueue.concat(queue);
	    } else {
	        queueIndex = -1;
	    }
	    if (queue.length) {
	        drainQueue();
	    }
	}

	function drainQueue() {
	    if (draining) {
	        return;
	    }
	    var timeout = setTimeout(cleanUpNextTick);
	    draining = true;

	    var len = queue.length;
	    while(len) {
	        currentQueue = queue;
	        queue = [];
	        while (++queueIndex < len) {
	            if (currentQueue) {
	                currentQueue[queueIndex].run();
	            }
	        }
	        queueIndex = -1;
	        len = queue.length;
	    }
	    currentQueue = null;
	    draining = false;
	    clearTimeout(timeout);
	}

	process.nextTick = function (fun) {
	    var args = new Array(arguments.length - 1);
	    if (arguments.length > 1) {
	        for (var i = 1; i < arguments.length; i++) {
	            args[i - 1] = arguments[i];
	        }
	    }
	    queue.push(new Item(fun, args));
	    if (queue.length === 1 && !draining) {
	        setTimeout(drainQueue, 0);
	    }
	};

	// v8 likes predictible objects
	function Item(fun, array) {
	    this.fun = fun;
	    this.array = array;
	}
	Item.prototype.run = function () {
	    this.fun.apply(null, this.array);
	};
	process.title = 'browser';
	process.browser = true;
	process.env = {};
	process.argv = [];
	process.version = ''; // empty string to avoid regexp issues
	process.versions = {};

	function noop() {}

	process.on = noop;
	process.addListener = noop;
	process.once = noop;
	process.off = noop;
	process.removeListener = noop;
	process.removeAllListeners = noop;
	process.emit = noop;

	process.binding = function (name) {
	    throw new Error('process.binding is not supported');
	};

	process.cwd = function () { return '/' };
	process.chdir = function (dir) {
	    throw new Error('process.chdir is not supported');
	};
	process.umask = function() { return 0; };


/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {var path = __webpack_require__(2);
	var fs = __webpack_require__(5);

	function Mime() {
	  // Map of extension -> mime type
	  this.types = Object.create(null);

	  // Map of mime type -> extension
	  this.extensions = Object.create(null);
	}

	/**
	 * Define mimetype -> extension mappings.  Each key is a mime-type that maps
	 * to an array of extensions associated with the type.  The first extension is
	 * used as the default extension for the type.
	 *
	 * e.g. mime.define({'audio/ogg', ['oga', 'ogg', 'spx']});
	 *
	 * @param map (Object) type definitions
	 */
	Mime.prototype.define = function (map) {
	  for (var type in map) {
	    var exts = map[type];
	    for (var i = 0; i < exts.length; i++) {
	      if (process.env.DEBUG_MIME && this.types[exts]) {
	        console.warn(this._loading.replace(/.*\//, ''), 'changes "' + exts[i] + '" extension type from ' +
	          this.types[exts] + ' to ' + type);
	      }

	      this.types[exts[i]] = type;
	    }

	    // Default extension is the first one we encounter
	    if (!this.extensions[type]) {
	      this.extensions[type] = exts[0];
	    }
	  }
	};

	/**
	 * Load an Apache2-style ".types" file
	 *
	 * This may be called multiple times (it's expected).  Where files declare
	 * overlapping types/extensions, the last file wins.
	 *
	 * @param file (String) path of file to load.
	 */
	Mime.prototype.load = function(file) {
	  this._loading = file;
	  // Read file and split into lines
	  var map = {},
	      content = fs.readFileSync(file, 'ascii'),
	      lines = content.split(/[\r\n]+/);

	  lines.forEach(function(line) {
	    // Clean up whitespace/comments, and split into fields
	    var fields = line.replace(/\s*#.*|^\s*|\s*$/g, '').split(/\s+/);
	    map[fields.shift()] = fields;
	  });

	  this.define(map);

	  this._loading = null;
	};

	/**
	 * Lookup a mime type based on extension
	 */
	Mime.prototype.lookup = function(path, fallback) {
	  var ext = path.replace(/.*[\.\/\\]/, '').toLowerCase();

	  return this.types[ext] || fallback || this.default_type;
	};

	/**
	 * Return file extension associated with a mime type
	 */
	Mime.prototype.extension = function(mimeType) {
	  var type = mimeType.match(/^\s*([^;\s]*)(?:;|\s|$)/)[1].toLowerCase();
	  return this.extensions[type];
	};

	// Default instance
	var mime = new Mime();

	// Define built-in types
	mime.define(__webpack_require__(6));

	// Default type
	mime.default_type = mime.lookup('bin');

	//
	// Additional API specific to the default instance
	//

	mime.Mime = Mime;

	/**
	 * Lookup a charset based on mime type.
	 */
	mime.charsets = {
	  lookup: function(mimeType, fallback) {
	    // Assume text types are utf8
	    return (/^text\//).test(mimeType) ? 'UTF-8' : fallback;
	  }
	};

	module.exports = mime;

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(3)))

/***/ },
/* 5 */
/***/ function(module, exports) {

	

/***/ },
/* 6 */
/***/ function(module, exports) {

	module.exports = {
		"application/andrew-inset": [
			"ez"
		],
		"application/applixware": [
			"aw"
		],
		"application/atom+xml": [
			"atom"
		],
		"application/atomcat+xml": [
			"atomcat"
		],
		"application/atomsvc+xml": [
			"atomsvc"
		],
		"application/ccxml+xml": [
			"ccxml"
		],
		"application/cdmi-capability": [
			"cdmia"
		],
		"application/cdmi-container": [
			"cdmic"
		],
		"application/cdmi-domain": [
			"cdmid"
		],
		"application/cdmi-object": [
			"cdmio"
		],
		"application/cdmi-queue": [
			"cdmiq"
		],
		"application/cu-seeme": [
			"cu"
		],
		"application/dash+xml": [
			"mdp"
		],
		"application/davmount+xml": [
			"davmount"
		],
		"application/docbook+xml": [
			"dbk"
		],
		"application/dssc+der": [
			"dssc"
		],
		"application/dssc+xml": [
			"xdssc"
		],
		"application/ecmascript": [
			"ecma"
		],
		"application/emma+xml": [
			"emma"
		],
		"application/epub+zip": [
			"epub"
		],
		"application/exi": [
			"exi"
		],
		"application/font-tdpfr": [
			"pfr"
		],
		"application/font-woff": [
			"woff"
		],
		"application/font-woff2": [
			"woff2"
		],
		"application/gml+xml": [
			"gml"
		],
		"application/gpx+xml": [
			"gpx"
		],
		"application/gxf": [
			"gxf"
		],
		"application/hyperstudio": [
			"stk"
		],
		"application/inkml+xml": [
			"ink",
			"inkml"
		],
		"application/ipfix": [
			"ipfix"
		],
		"application/java-archive": [
			"jar"
		],
		"application/java-serialized-object": [
			"ser"
		],
		"application/java-vm": [
			"class"
		],
		"application/javascript": [
			"js"
		],
		"application/json": [
			"json",
			"map"
		],
		"application/json5": [
			"json5"
		],
		"application/jsonml+json": [
			"jsonml"
		],
		"application/lost+xml": [
			"lostxml"
		],
		"application/mac-binhex40": [
			"hqx"
		],
		"application/mac-compactpro": [
			"cpt"
		],
		"application/mads+xml": [
			"mads"
		],
		"application/marc": [
			"mrc"
		],
		"application/marcxml+xml": [
			"mrcx"
		],
		"application/mathematica": [
			"ma",
			"nb",
			"mb"
		],
		"application/mathml+xml": [
			"mathml"
		],
		"application/mbox": [
			"mbox"
		],
		"application/mediaservercontrol+xml": [
			"mscml"
		],
		"application/metalink+xml": [
			"metalink"
		],
		"application/metalink4+xml": [
			"meta4"
		],
		"application/mets+xml": [
			"mets"
		],
		"application/mods+xml": [
			"mods"
		],
		"application/mp21": [
			"m21",
			"mp21"
		],
		"application/mp4": [
			"mp4s",
			"m4p"
		],
		"application/msword": [
			"doc",
			"dot"
		],
		"application/mxf": [
			"mxf"
		],
		"application/octet-stream": [
			"bin",
			"dms",
			"lrf",
			"mar",
			"so",
			"dist",
			"distz",
			"pkg",
			"bpk",
			"dump",
			"elc",
			"deploy",
			"buffer"
		],
		"application/oda": [
			"oda"
		],
		"application/oebps-package+xml": [
			"opf"
		],
		"application/ogg": [
			"ogx"
		],
		"application/omdoc+xml": [
			"omdoc"
		],
		"application/onenote": [
			"onetoc",
			"onetoc2",
			"onetmp",
			"onepkg"
		],
		"application/oxps": [
			"oxps"
		],
		"application/patch-ops-error+xml": [
			"xer"
		],
		"application/pdf": [
			"pdf"
		],
		"application/pgp-encrypted": [
			"pgp"
		],
		"application/pgp-signature": [
			"asc",
			"sig"
		],
		"application/pics-rules": [
			"prf"
		],
		"application/pkcs10": [
			"p10"
		],
		"application/pkcs7-mime": [
			"p7m",
			"p7c"
		],
		"application/pkcs7-signature": [
			"p7s"
		],
		"application/pkcs8": [
			"p8"
		],
		"application/pkix-attr-cert": [
			"ac"
		],
		"application/pkix-cert": [
			"cer"
		],
		"application/pkix-crl": [
			"crl"
		],
		"application/pkix-pkipath": [
			"pkipath"
		],
		"application/pkixcmp": [
			"pki"
		],
		"application/pls+xml": [
			"pls"
		],
		"application/postscript": [
			"ai",
			"eps",
			"ps"
		],
		"application/prs.cww": [
			"cww"
		],
		"application/pskc+xml": [
			"pskcxml"
		],
		"application/rdf+xml": [
			"rdf"
		],
		"application/reginfo+xml": [
			"rif"
		],
		"application/relax-ng-compact-syntax": [
			"rnc"
		],
		"application/resource-lists+xml": [
			"rl"
		],
		"application/resource-lists-diff+xml": [
			"rld"
		],
		"application/rls-services+xml": [
			"rs"
		],
		"application/rpki-ghostbusters": [
			"gbr"
		],
		"application/rpki-manifest": [
			"mft"
		],
		"application/rpki-roa": [
			"roa"
		],
		"application/rsd+xml": [
			"rsd"
		],
		"application/rss+xml": [
			"rss"
		],
		"application/rtf": [
			"rtf"
		],
		"application/sbml+xml": [
			"sbml"
		],
		"application/scvp-cv-request": [
			"scq"
		],
		"application/scvp-cv-response": [
			"scs"
		],
		"application/scvp-vp-request": [
			"spq"
		],
		"application/scvp-vp-response": [
			"spp"
		],
		"application/sdp": [
			"sdp"
		],
		"application/set-payment-initiation": [
			"setpay"
		],
		"application/set-registration-initiation": [
			"setreg"
		],
		"application/shf+xml": [
			"shf"
		],
		"application/smil+xml": [
			"smi",
			"smil"
		],
		"application/sparql-query": [
			"rq"
		],
		"application/sparql-results+xml": [
			"srx"
		],
		"application/srgs": [
			"gram"
		],
		"application/srgs+xml": [
			"grxml"
		],
		"application/sru+xml": [
			"sru"
		],
		"application/ssdl+xml": [
			"ssdl"
		],
		"application/ssml+xml": [
			"ssml"
		],
		"application/tei+xml": [
			"tei",
			"teicorpus"
		],
		"application/thraud+xml": [
			"tfi"
		],
		"application/timestamped-data": [
			"tsd"
		],
		"application/vnd.3gpp.pic-bw-large": [
			"plb"
		],
		"application/vnd.3gpp.pic-bw-small": [
			"psb"
		],
		"application/vnd.3gpp.pic-bw-var": [
			"pvb"
		],
		"application/vnd.3gpp2.tcap": [
			"tcap"
		],
		"application/vnd.3m.post-it-notes": [
			"pwn"
		],
		"application/vnd.accpac.simply.aso": [
			"aso"
		],
		"application/vnd.accpac.simply.imp": [
			"imp"
		],
		"application/vnd.acucobol": [
			"acu"
		],
		"application/vnd.acucorp": [
			"atc",
			"acutc"
		],
		"application/vnd.adobe.air-application-installer-package+zip": [
			"air"
		],
		"application/vnd.adobe.formscentral.fcdt": [
			"fcdt"
		],
		"application/vnd.adobe.fxp": [
			"fxp",
			"fxpl"
		],
		"application/vnd.adobe.xdp+xml": [
			"xdp"
		],
		"application/vnd.adobe.xfdf": [
			"xfdf"
		],
		"application/vnd.ahead.space": [
			"ahead"
		],
		"application/vnd.airzip.filesecure.azf": [
			"azf"
		],
		"application/vnd.airzip.filesecure.azs": [
			"azs"
		],
		"application/vnd.amazon.ebook": [
			"azw"
		],
		"application/vnd.americandynamics.acc": [
			"acc"
		],
		"application/vnd.amiga.ami": [
			"ami"
		],
		"application/vnd.android.package-archive": [
			"apk"
		],
		"application/vnd.anser-web-certificate-issue-initiation": [
			"cii"
		],
		"application/vnd.anser-web-funds-transfer-initiation": [
			"fti"
		],
		"application/vnd.antix.game-component": [
			"atx"
		],
		"application/vnd.apple.installer+xml": [
			"mpkg"
		],
		"application/vnd.apple.mpegurl": [
			"m3u8"
		],
		"application/vnd.aristanetworks.swi": [
			"swi"
		],
		"application/vnd.astraea-software.iota": [
			"iota"
		],
		"application/vnd.audiograph": [
			"aep"
		],
		"application/vnd.blueice.multipass": [
			"mpm"
		],
		"application/vnd.bmi": [
			"bmi"
		],
		"application/vnd.businessobjects": [
			"rep"
		],
		"application/vnd.chemdraw+xml": [
			"cdxml"
		],
		"application/vnd.chipnuts.karaoke-mmd": [
			"mmd"
		],
		"application/vnd.cinderella": [
			"cdy"
		],
		"application/vnd.claymore": [
			"cla"
		],
		"application/vnd.cloanto.rp9": [
			"rp9"
		],
		"application/vnd.clonk.c4group": [
			"c4g",
			"c4d",
			"c4f",
			"c4p",
			"c4u"
		],
		"application/vnd.cluetrust.cartomobile-config": [
			"c11amc"
		],
		"application/vnd.cluetrust.cartomobile-config-pkg": [
			"c11amz"
		],
		"application/vnd.commonspace": [
			"csp"
		],
		"application/vnd.contact.cmsg": [
			"cdbcmsg"
		],
		"application/vnd.cosmocaller": [
			"cmc"
		],
		"application/vnd.crick.clicker": [
			"clkx"
		],
		"application/vnd.crick.clicker.keyboard": [
			"clkk"
		],
		"application/vnd.crick.clicker.palette": [
			"clkp"
		],
		"application/vnd.crick.clicker.template": [
			"clkt"
		],
		"application/vnd.crick.clicker.wordbank": [
			"clkw"
		],
		"application/vnd.criticaltools.wbs+xml": [
			"wbs"
		],
		"application/vnd.ctc-posml": [
			"pml"
		],
		"application/vnd.cups-ppd": [
			"ppd"
		],
		"application/vnd.curl.car": [
			"car"
		],
		"application/vnd.curl.pcurl": [
			"pcurl"
		],
		"application/vnd.dart": [
			"dart"
		],
		"application/vnd.data-vision.rdz": [
			"rdz"
		],
		"application/vnd.dece.data": [
			"uvf",
			"uvvf",
			"uvd",
			"uvvd"
		],
		"application/vnd.dece.ttml+xml": [
			"uvt",
			"uvvt"
		],
		"application/vnd.dece.unspecified": [
			"uvx",
			"uvvx"
		],
		"application/vnd.dece.zip": [
			"uvz",
			"uvvz"
		],
		"application/vnd.denovo.fcselayout-link": [
			"fe_launch"
		],
		"application/vnd.dna": [
			"dna"
		],
		"application/vnd.dolby.mlp": [
			"mlp"
		],
		"application/vnd.dpgraph": [
			"dpg"
		],
		"application/vnd.dreamfactory": [
			"dfac"
		],
		"application/vnd.ds-keypoint": [
			"kpxx"
		],
		"application/vnd.dvb.ait": [
			"ait"
		],
		"application/vnd.dvb.service": [
			"svc"
		],
		"application/vnd.dynageo": [
			"geo"
		],
		"application/vnd.ecowin.chart": [
			"mag"
		],
		"application/vnd.enliven": [
			"nml"
		],
		"application/vnd.epson.esf": [
			"esf"
		],
		"application/vnd.epson.msf": [
			"msf"
		],
		"application/vnd.epson.quickanime": [
			"qam"
		],
		"application/vnd.epson.salt": [
			"slt"
		],
		"application/vnd.epson.ssf": [
			"ssf"
		],
		"application/vnd.eszigno3+xml": [
			"es3",
			"et3"
		],
		"application/vnd.ezpix-album": [
			"ez2"
		],
		"application/vnd.ezpix-package": [
			"ez3"
		],
		"application/vnd.fdf": [
			"fdf"
		],
		"application/vnd.fdsn.mseed": [
			"mseed"
		],
		"application/vnd.fdsn.seed": [
			"seed",
			"dataless"
		],
		"application/vnd.flographit": [
			"gph"
		],
		"application/vnd.fluxtime.clip": [
			"ftc"
		],
		"application/vnd.framemaker": [
			"fm",
			"frame",
			"maker",
			"book"
		],
		"application/vnd.frogans.fnc": [
			"fnc"
		],
		"application/vnd.frogans.ltf": [
			"ltf"
		],
		"application/vnd.fsc.weblaunch": [
			"fsc"
		],
		"application/vnd.fujitsu.oasys": [
			"oas"
		],
		"application/vnd.fujitsu.oasys2": [
			"oa2"
		],
		"application/vnd.fujitsu.oasys3": [
			"oa3"
		],
		"application/vnd.fujitsu.oasysgp": [
			"fg5"
		],
		"application/vnd.fujitsu.oasysprs": [
			"bh2"
		],
		"application/vnd.fujixerox.ddd": [
			"ddd"
		],
		"application/vnd.fujixerox.docuworks": [
			"xdw"
		],
		"application/vnd.fujixerox.docuworks.binder": [
			"xbd"
		],
		"application/vnd.fuzzysheet": [
			"fzs"
		],
		"application/vnd.genomatix.tuxedo": [
			"txd"
		],
		"application/vnd.geogebra.file": [
			"ggb"
		],
		"application/vnd.geogebra.tool": [
			"ggt"
		],
		"application/vnd.geometry-explorer": [
			"gex",
			"gre"
		],
		"application/vnd.geonext": [
			"gxt"
		],
		"application/vnd.geoplan": [
			"g2w"
		],
		"application/vnd.geospace": [
			"g3w"
		],
		"application/vnd.gmx": [
			"gmx"
		],
		"application/vnd.google-earth.kml+xml": [
			"kml"
		],
		"application/vnd.google-earth.kmz": [
			"kmz"
		],
		"application/vnd.grafeq": [
			"gqf",
			"gqs"
		],
		"application/vnd.groove-account": [
			"gac"
		],
		"application/vnd.groove-help": [
			"ghf"
		],
		"application/vnd.groove-identity-message": [
			"gim"
		],
		"application/vnd.groove-injector": [
			"grv"
		],
		"application/vnd.groove-tool-message": [
			"gtm"
		],
		"application/vnd.groove-tool-template": [
			"tpl"
		],
		"application/vnd.groove-vcard": [
			"vcg"
		],
		"application/vnd.hal+xml": [
			"hal"
		],
		"application/vnd.handheld-entertainment+xml": [
			"zmm"
		],
		"application/vnd.hbci": [
			"hbci"
		],
		"application/vnd.hhe.lesson-player": [
			"les"
		],
		"application/vnd.hp-hpgl": [
			"hpgl"
		],
		"application/vnd.hp-hpid": [
			"hpid"
		],
		"application/vnd.hp-hps": [
			"hps"
		],
		"application/vnd.hp-jlyt": [
			"jlt"
		],
		"application/vnd.hp-pcl": [
			"pcl"
		],
		"application/vnd.hp-pclxl": [
			"pclxl"
		],
		"application/vnd.ibm.minipay": [
			"mpy"
		],
		"application/vnd.ibm.modcap": [
			"afp",
			"listafp",
			"list3820"
		],
		"application/vnd.ibm.rights-management": [
			"irm"
		],
		"application/vnd.ibm.secure-container": [
			"sc"
		],
		"application/vnd.iccprofile": [
			"icc",
			"icm"
		],
		"application/vnd.igloader": [
			"igl"
		],
		"application/vnd.immervision-ivp": [
			"ivp"
		],
		"application/vnd.immervision-ivu": [
			"ivu"
		],
		"application/vnd.insors.igm": [
			"igm"
		],
		"application/vnd.intercon.formnet": [
			"xpw",
			"xpx"
		],
		"application/vnd.intergeo": [
			"i2g"
		],
		"application/vnd.intu.qbo": [
			"qbo"
		],
		"application/vnd.intu.qfx": [
			"qfx"
		],
		"application/vnd.ipunplugged.rcprofile": [
			"rcprofile"
		],
		"application/vnd.irepository.package+xml": [
			"irp"
		],
		"application/vnd.is-xpr": [
			"xpr"
		],
		"application/vnd.isac.fcs": [
			"fcs"
		],
		"application/vnd.jam": [
			"jam"
		],
		"application/vnd.jcp.javame.midlet-rms": [
			"rms"
		],
		"application/vnd.jisp": [
			"jisp"
		],
		"application/vnd.joost.joda-archive": [
			"joda"
		],
		"application/vnd.kahootz": [
			"ktz",
			"ktr"
		],
		"application/vnd.kde.karbon": [
			"karbon"
		],
		"application/vnd.kde.kchart": [
			"chrt"
		],
		"application/vnd.kde.kformula": [
			"kfo"
		],
		"application/vnd.kde.kivio": [
			"flw"
		],
		"application/vnd.kde.kontour": [
			"kon"
		],
		"application/vnd.kde.kpresenter": [
			"kpr",
			"kpt"
		],
		"application/vnd.kde.kspread": [
			"ksp"
		],
		"application/vnd.kde.kword": [
			"kwd",
			"kwt"
		],
		"application/vnd.kenameaapp": [
			"htke"
		],
		"application/vnd.kidspiration": [
			"kia"
		],
		"application/vnd.kinar": [
			"kne",
			"knp"
		],
		"application/vnd.koan": [
			"skp",
			"skd",
			"skt",
			"skm"
		],
		"application/vnd.kodak-descriptor": [
			"sse"
		],
		"application/vnd.las.las+xml": [
			"lasxml"
		],
		"application/vnd.llamagraphics.life-balance.desktop": [
			"lbd"
		],
		"application/vnd.llamagraphics.life-balance.exchange+xml": [
			"lbe"
		],
		"application/vnd.lotus-1-2-3": [
			"123"
		],
		"application/vnd.lotus-approach": [
			"apr"
		],
		"application/vnd.lotus-freelance": [
			"pre"
		],
		"application/vnd.lotus-notes": [
			"nsf"
		],
		"application/vnd.lotus-organizer": [
			"org"
		],
		"application/vnd.lotus-screencam": [
			"scm"
		],
		"application/vnd.lotus-wordpro": [
			"lwp"
		],
		"application/vnd.macports.portpkg": [
			"portpkg"
		],
		"application/vnd.mcd": [
			"mcd"
		],
		"application/vnd.medcalcdata": [
			"mc1"
		],
		"application/vnd.mediastation.cdkey": [
			"cdkey"
		],
		"application/vnd.mfer": [
			"mwf"
		],
		"application/vnd.mfmp": [
			"mfm"
		],
		"application/vnd.micrografx.flo": [
			"flo"
		],
		"application/vnd.micrografx.igx": [
			"igx"
		],
		"application/vnd.mif": [
			"mif"
		],
		"application/vnd.mobius.daf": [
			"daf"
		],
		"application/vnd.mobius.dis": [
			"dis"
		],
		"application/vnd.mobius.mbk": [
			"mbk"
		],
		"application/vnd.mobius.mqy": [
			"mqy"
		],
		"application/vnd.mobius.msl": [
			"msl"
		],
		"application/vnd.mobius.plc": [
			"plc"
		],
		"application/vnd.mobius.txf": [
			"txf"
		],
		"application/vnd.mophun.application": [
			"mpn"
		],
		"application/vnd.mophun.certificate": [
			"mpc"
		],
		"application/vnd.mozilla.xul+xml": [
			"xul"
		],
		"application/vnd.ms-artgalry": [
			"cil"
		],
		"application/vnd.ms-cab-compressed": [
			"cab"
		],
		"application/vnd.ms-excel": [
			"xls",
			"xlm",
			"xla",
			"xlc",
			"xlt",
			"xlw"
		],
		"application/vnd.ms-excel.addin.macroenabled.12": [
			"xlam"
		],
		"application/vnd.ms-excel.sheet.binary.macroenabled.12": [
			"xlsb"
		],
		"application/vnd.ms-excel.sheet.macroenabled.12": [
			"xlsm"
		],
		"application/vnd.ms-excel.template.macroenabled.12": [
			"xltm"
		],
		"application/vnd.ms-fontobject": [
			"eot"
		],
		"application/vnd.ms-htmlhelp": [
			"chm"
		],
		"application/vnd.ms-ims": [
			"ims"
		],
		"application/vnd.ms-lrm": [
			"lrm"
		],
		"application/vnd.ms-officetheme": [
			"thmx"
		],
		"application/vnd.ms-pki.seccat": [
			"cat"
		],
		"application/vnd.ms-pki.stl": [
			"stl"
		],
		"application/vnd.ms-powerpoint": [
			"ppt",
			"pps",
			"pot"
		],
		"application/vnd.ms-powerpoint.addin.macroenabled.12": [
			"ppam"
		],
		"application/vnd.ms-powerpoint.presentation.macroenabled.12": [
			"pptm"
		],
		"application/vnd.ms-powerpoint.slide.macroenabled.12": [
			"sldm"
		],
		"application/vnd.ms-powerpoint.slideshow.macroenabled.12": [
			"ppsm"
		],
		"application/vnd.ms-powerpoint.template.macroenabled.12": [
			"potm"
		],
		"application/vnd.ms-project": [
			"mpp",
			"mpt"
		],
		"application/vnd.ms-word.document.macroenabled.12": [
			"docm"
		],
		"application/vnd.ms-word.template.macroenabled.12": [
			"dotm"
		],
		"application/vnd.ms-works": [
			"wps",
			"wks",
			"wcm",
			"wdb"
		],
		"application/vnd.ms-wpl": [
			"wpl"
		],
		"application/vnd.ms-xpsdocument": [
			"xps"
		],
		"application/vnd.mseq": [
			"mseq"
		],
		"application/vnd.musician": [
			"mus"
		],
		"application/vnd.muvee.style": [
			"msty"
		],
		"application/vnd.mynfc": [
			"taglet"
		],
		"application/vnd.neurolanguage.nlu": [
			"nlu"
		],
		"application/vnd.nitf": [
			"ntf",
			"nitf"
		],
		"application/vnd.noblenet-directory": [
			"nnd"
		],
		"application/vnd.noblenet-sealer": [
			"nns"
		],
		"application/vnd.noblenet-web": [
			"nnw"
		],
		"application/vnd.nokia.n-gage.data": [
			"ngdat"
		],
		"application/vnd.nokia.radio-preset": [
			"rpst"
		],
		"application/vnd.nokia.radio-presets": [
			"rpss"
		],
		"application/vnd.novadigm.edm": [
			"edm"
		],
		"application/vnd.novadigm.edx": [
			"edx"
		],
		"application/vnd.novadigm.ext": [
			"ext"
		],
		"application/vnd.oasis.opendocument.chart": [
			"odc"
		],
		"application/vnd.oasis.opendocument.chart-template": [
			"otc"
		],
		"application/vnd.oasis.opendocument.database": [
			"odb"
		],
		"application/vnd.oasis.opendocument.formula": [
			"odf"
		],
		"application/vnd.oasis.opendocument.formula-template": [
			"odft"
		],
		"application/vnd.oasis.opendocument.graphics": [
			"odg"
		],
		"application/vnd.oasis.opendocument.graphics-template": [
			"otg"
		],
		"application/vnd.oasis.opendocument.image": [
			"odi"
		],
		"application/vnd.oasis.opendocument.image-template": [
			"oti"
		],
		"application/vnd.oasis.opendocument.presentation": [
			"odp"
		],
		"application/vnd.oasis.opendocument.presentation-template": [
			"otp"
		],
		"application/vnd.oasis.opendocument.spreadsheet": [
			"ods"
		],
		"application/vnd.oasis.opendocument.spreadsheet-template": [
			"ots"
		],
		"application/vnd.oasis.opendocument.text": [
			"odt"
		],
		"application/vnd.oasis.opendocument.text-master": [
			"odm"
		],
		"application/vnd.oasis.opendocument.text-template": [
			"ott"
		],
		"application/vnd.oasis.opendocument.text-web": [
			"oth"
		],
		"application/vnd.olpc-sugar": [
			"xo"
		],
		"application/vnd.oma.dd2+xml": [
			"dd2"
		],
		"application/vnd.openofficeorg.extension": [
			"oxt"
		],
		"application/vnd.openxmlformats-officedocument.presentationml.presentation": [
			"pptx"
		],
		"application/vnd.openxmlformats-officedocument.presentationml.slide": [
			"sldx"
		],
		"application/vnd.openxmlformats-officedocument.presentationml.slideshow": [
			"ppsx"
		],
		"application/vnd.openxmlformats-officedocument.presentationml.template": [
			"potx"
		],
		"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
			"xlsx"
		],
		"application/vnd.openxmlformats-officedocument.spreadsheetml.template": [
			"xltx"
		],
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
			"docx"
		],
		"application/vnd.openxmlformats-officedocument.wordprocessingml.template": [
			"dotx"
		],
		"application/vnd.osgeo.mapguide.package": [
			"mgp"
		],
		"application/vnd.osgi.dp": [
			"dp"
		],
		"application/vnd.osgi.subsystem": [
			"esa"
		],
		"application/vnd.palm": [
			"pdb",
			"pqa",
			"oprc"
		],
		"application/vnd.pawaafile": [
			"paw"
		],
		"application/vnd.pg.format": [
			"str"
		],
		"application/vnd.pg.osasli": [
			"ei6"
		],
		"application/vnd.picsel": [
			"efif"
		],
		"application/vnd.pmi.widget": [
			"wg"
		],
		"application/vnd.pocketlearn": [
			"plf"
		],
		"application/vnd.powerbuilder6": [
			"pbd"
		],
		"application/vnd.previewsystems.box": [
			"box"
		],
		"application/vnd.proteus.magazine": [
			"mgz"
		],
		"application/vnd.publishare-delta-tree": [
			"qps"
		],
		"application/vnd.pvi.ptid1": [
			"ptid"
		],
		"application/vnd.quark.quarkxpress": [
			"qxd",
			"qxt",
			"qwd",
			"qwt",
			"qxl",
			"qxb"
		],
		"application/vnd.realvnc.bed": [
			"bed"
		],
		"application/vnd.recordare.musicxml": [
			"mxl"
		],
		"application/vnd.recordare.musicxml+xml": [
			"musicxml"
		],
		"application/vnd.rig.cryptonote": [
			"cryptonote"
		],
		"application/vnd.rim.cod": [
			"cod"
		],
		"application/vnd.rn-realmedia": [
			"rm"
		],
		"application/vnd.rn-realmedia-vbr": [
			"rmvb"
		],
		"application/vnd.route66.link66+xml": [
			"link66"
		],
		"application/vnd.sailingtracker.track": [
			"st"
		],
		"application/vnd.seemail": [
			"see"
		],
		"application/vnd.sema": [
			"sema"
		],
		"application/vnd.semd": [
			"semd"
		],
		"application/vnd.semf": [
			"semf"
		],
		"application/vnd.shana.informed.formdata": [
			"ifm"
		],
		"application/vnd.shana.informed.formtemplate": [
			"itp"
		],
		"application/vnd.shana.informed.interchange": [
			"iif"
		],
		"application/vnd.shana.informed.package": [
			"ipk"
		],
		"application/vnd.simtech-mindmapper": [
			"twd",
			"twds"
		],
		"application/vnd.smaf": [
			"mmf"
		],
		"application/vnd.smart.teacher": [
			"teacher"
		],
		"application/vnd.solent.sdkm+xml": [
			"sdkm",
			"sdkd"
		],
		"application/vnd.spotfire.dxp": [
			"dxp"
		],
		"application/vnd.spotfire.sfs": [
			"sfs"
		],
		"application/vnd.stardivision.calc": [
			"sdc"
		],
		"application/vnd.stardivision.draw": [
			"sda"
		],
		"application/vnd.stardivision.impress": [
			"sdd"
		],
		"application/vnd.stardivision.math": [
			"smf"
		],
		"application/vnd.stardivision.writer": [
			"sdw",
			"vor"
		],
		"application/vnd.stardivision.writer-global": [
			"sgl"
		],
		"application/vnd.stepmania.package": [
			"smzip"
		],
		"application/vnd.stepmania.stepchart": [
			"sm"
		],
		"application/vnd.sun.xml.calc": [
			"sxc"
		],
		"application/vnd.sun.xml.calc.template": [
			"stc"
		],
		"application/vnd.sun.xml.draw": [
			"sxd"
		],
		"application/vnd.sun.xml.draw.template": [
			"std"
		],
		"application/vnd.sun.xml.impress": [
			"sxi"
		],
		"application/vnd.sun.xml.impress.template": [
			"sti"
		],
		"application/vnd.sun.xml.math": [
			"sxm"
		],
		"application/vnd.sun.xml.writer": [
			"sxw"
		],
		"application/vnd.sun.xml.writer.global": [
			"sxg"
		],
		"application/vnd.sun.xml.writer.template": [
			"stw"
		],
		"application/vnd.sus-calendar": [
			"sus",
			"susp"
		],
		"application/vnd.svd": [
			"svd"
		],
		"application/vnd.symbian.install": [
			"sis",
			"sisx"
		],
		"application/vnd.syncml+xml": [
			"xsm"
		],
		"application/vnd.syncml.dm+wbxml": [
			"bdm"
		],
		"application/vnd.syncml.dm+xml": [
			"xdm"
		],
		"application/vnd.tao.intent-module-archive": [
			"tao"
		],
		"application/vnd.tcpdump.pcap": [
			"pcap",
			"cap",
			"dmp"
		],
		"application/vnd.tmobile-livetv": [
			"tmo"
		],
		"application/vnd.trid.tpt": [
			"tpt"
		],
		"application/vnd.triscape.mxs": [
			"mxs"
		],
		"application/vnd.trueapp": [
			"tra"
		],
		"application/vnd.ufdl": [
			"ufd",
			"ufdl"
		],
		"application/vnd.uiq.theme": [
			"utz"
		],
		"application/vnd.umajin": [
			"umj"
		],
		"application/vnd.unity": [
			"unityweb"
		],
		"application/vnd.uoml+xml": [
			"uoml"
		],
		"application/vnd.vcx": [
			"vcx"
		],
		"application/vnd.visio": [
			"vsd",
			"vst",
			"vss",
			"vsw"
		],
		"application/vnd.visionary": [
			"vis"
		],
		"application/vnd.vsf": [
			"vsf"
		],
		"application/vnd.wap.wbxml": [
			"wbxml"
		],
		"application/vnd.wap.wmlc": [
			"wmlc"
		],
		"application/vnd.wap.wmlscriptc": [
			"wmlsc"
		],
		"application/vnd.webturbo": [
			"wtb"
		],
		"application/vnd.wolfram.player": [
			"nbp"
		],
		"application/vnd.wordperfect": [
			"wpd"
		],
		"application/vnd.wqd": [
			"wqd"
		],
		"application/vnd.wt.stf": [
			"stf"
		],
		"application/vnd.xara": [
			"xar"
		],
		"application/vnd.xfdl": [
			"xfdl"
		],
		"application/vnd.yamaha.hv-dic": [
			"hvd"
		],
		"application/vnd.yamaha.hv-script": [
			"hvs"
		],
		"application/vnd.yamaha.hv-voice": [
			"hvp"
		],
		"application/vnd.yamaha.openscoreformat": [
			"osf"
		],
		"application/vnd.yamaha.openscoreformat.osfpvg+xml": [
			"osfpvg"
		],
		"application/vnd.yamaha.smaf-audio": [
			"saf"
		],
		"application/vnd.yamaha.smaf-phrase": [
			"spf"
		],
		"application/vnd.yellowriver-custom-menu": [
			"cmp"
		],
		"application/vnd.zul": [
			"zir",
			"zirz"
		],
		"application/vnd.zzazz.deck+xml": [
			"zaz"
		],
		"application/voicexml+xml": [
			"vxml"
		],
		"application/widget": [
			"wgt"
		],
		"application/winhlp": [
			"hlp"
		],
		"application/wsdl+xml": [
			"wsdl"
		],
		"application/wspolicy+xml": [
			"wspolicy"
		],
		"application/x-7z-compressed": [
			"7z"
		],
		"application/x-abiword": [
			"abw"
		],
		"application/x-ace-compressed": [
			"ace"
		],
		"application/x-apple-diskimage": [
			"dmg"
		],
		"application/x-authorware-bin": [
			"aab",
			"x32",
			"u32",
			"vox"
		],
		"application/x-authorware-map": [
			"aam"
		],
		"application/x-authorware-seg": [
			"aas"
		],
		"application/x-bcpio": [
			"bcpio"
		],
		"application/x-bittorrent": [
			"torrent"
		],
		"application/x-blorb": [
			"blb",
			"blorb"
		],
		"application/x-bzip": [
			"bz"
		],
		"application/x-bzip2": [
			"bz2",
			"boz"
		],
		"application/x-cbr": [
			"cbr",
			"cba",
			"cbt",
			"cbz",
			"cb7"
		],
		"application/x-cdlink": [
			"vcd"
		],
		"application/x-cfs-compressed": [
			"cfs"
		],
		"application/x-chat": [
			"chat"
		],
		"application/x-chess-pgn": [
			"pgn"
		],
		"application/x-chrome-extension": [
			"crx"
		],
		"application/x-conference": [
			"nsc"
		],
		"application/x-cpio": [
			"cpio"
		],
		"application/x-csh": [
			"csh"
		],
		"application/x-debian-package": [
			"deb",
			"udeb"
		],
		"application/x-dgc-compressed": [
			"dgc"
		],
		"application/x-director": [
			"dir",
			"dcr",
			"dxr",
			"cst",
			"cct",
			"cxt",
			"w3d",
			"fgd",
			"swa"
		],
		"application/x-doom": [
			"wad"
		],
		"application/x-dtbncx+xml": [
			"ncx"
		],
		"application/x-dtbook+xml": [
			"dtb"
		],
		"application/x-dtbresource+xml": [
			"res"
		],
		"application/x-dvi": [
			"dvi"
		],
		"application/x-envoy": [
			"evy"
		],
		"application/x-eva": [
			"eva"
		],
		"application/x-font-bdf": [
			"bdf"
		],
		"application/x-font-ghostscript": [
			"gsf"
		],
		"application/x-font-linux-psf": [
			"psf"
		],
		"application/x-font-otf": [
			"otf"
		],
		"application/x-font-pcf": [
			"pcf"
		],
		"application/x-font-snf": [
			"snf"
		],
		"application/x-font-ttf": [
			"ttf",
			"ttc"
		],
		"application/x-font-type1": [
			"pfa",
			"pfb",
			"pfm",
			"afm"
		],
		"application/x-freearc": [
			"arc"
		],
		"application/x-futuresplash": [
			"spl"
		],
		"application/x-gca-compressed": [
			"gca"
		],
		"application/x-glulx": [
			"ulx"
		],
		"application/x-gnumeric": [
			"gnumeric"
		],
		"application/x-gramps-xml": [
			"gramps"
		],
		"application/x-gtar": [
			"gtar"
		],
		"application/x-hdf": [
			"hdf"
		],
		"application/x-install-instructions": [
			"install"
		],
		"application/x-iso9660-image": [
			"iso"
		],
		"application/x-java-jnlp-file": [
			"jnlp"
		],
		"application/x-latex": [
			"latex"
		],
		"application/x-lua-bytecode": [
			"luac"
		],
		"application/x-lzh-compressed": [
			"lzh",
			"lha"
		],
		"application/x-mie": [
			"mie"
		],
		"application/x-mobipocket-ebook": [
			"prc",
			"mobi"
		],
		"application/x-ms-application": [
			"application"
		],
		"application/x-ms-shortcut": [
			"lnk"
		],
		"application/x-ms-wmd": [
			"wmd"
		],
		"application/x-ms-wmz": [
			"wmz"
		],
		"application/x-ms-xbap": [
			"xbap"
		],
		"application/x-msaccess": [
			"mdb"
		],
		"application/x-msbinder": [
			"obd"
		],
		"application/x-mscardfile": [
			"crd"
		],
		"application/x-msclip": [
			"clp"
		],
		"application/x-msdownload": [
			"exe",
			"dll",
			"com",
			"bat",
			"msi"
		],
		"application/x-msmediaview": [
			"mvb",
			"m13",
			"m14"
		],
		"application/x-msmetafile": [
			"wmf",
			"wmz",
			"emf",
			"emz"
		],
		"application/x-msmoney": [
			"mny"
		],
		"application/x-mspublisher": [
			"pub"
		],
		"application/x-msschedule": [
			"scd"
		],
		"application/x-msterminal": [
			"trm"
		],
		"application/x-mswrite": [
			"wri"
		],
		"application/x-netcdf": [
			"nc",
			"cdf"
		],
		"application/x-nzb": [
			"nzb"
		],
		"application/x-pkcs12": [
			"p12",
			"pfx"
		],
		"application/x-pkcs7-certificates": [
			"p7b",
			"spc"
		],
		"application/x-pkcs7-certreqresp": [
			"p7r"
		],
		"application/x-rar-compressed": [
			"rar"
		],
		"application/x-research-info-systems": [
			"ris"
		],
		"application/x-sh": [
			"sh"
		],
		"application/x-shar": [
			"shar"
		],
		"application/x-shockwave-flash": [
			"swf"
		],
		"application/x-silverlight-app": [
			"xap"
		],
		"application/x-sql": [
			"sql"
		],
		"application/x-stuffit": [
			"sit"
		],
		"application/x-stuffitx": [
			"sitx"
		],
		"application/x-subrip": [
			"srt"
		],
		"application/x-sv4cpio": [
			"sv4cpio"
		],
		"application/x-sv4crc": [
			"sv4crc"
		],
		"application/x-t3vm-image": [
			"t3"
		],
		"application/x-tads": [
			"gam"
		],
		"application/x-tar": [
			"tar"
		],
		"application/x-tcl": [
			"tcl"
		],
		"application/x-tex": [
			"tex"
		],
		"application/x-tex-tfm": [
			"tfm"
		],
		"application/x-texinfo": [
			"texinfo",
			"texi"
		],
		"application/x-tgif": [
			"obj"
		],
		"application/x-ustar": [
			"ustar"
		],
		"application/x-wais-source": [
			"src"
		],
		"application/x-web-app-manifest+json": [
			"webapp"
		],
		"application/x-x509-ca-cert": [
			"der",
			"crt"
		],
		"application/x-xfig": [
			"fig"
		],
		"application/x-xliff+xml": [
			"xlf"
		],
		"application/x-xpinstall": [
			"xpi"
		],
		"application/x-xz": [
			"xz"
		],
		"application/x-zmachine": [
			"z1",
			"z2",
			"z3",
			"z4",
			"z5",
			"z6",
			"z7",
			"z8"
		],
		"application/xaml+xml": [
			"xaml"
		],
		"application/xcap-diff+xml": [
			"xdf"
		],
		"application/xenc+xml": [
			"xenc"
		],
		"application/xhtml+xml": [
			"xhtml",
			"xht"
		],
		"application/xml": [
			"xml",
			"xsl",
			"xsd"
		],
		"application/xml-dtd": [
			"dtd"
		],
		"application/xop+xml": [
			"xop"
		],
		"application/xproc+xml": [
			"xpl"
		],
		"application/xslt+xml": [
			"xslt"
		],
		"application/xspf+xml": [
			"xspf"
		],
		"application/xv+xml": [
			"mxml",
			"xhvml",
			"xvml",
			"xvm"
		],
		"application/yang": [
			"yang"
		],
		"application/yin+xml": [
			"yin"
		],
		"application/zip": [
			"zip"
		],
		"audio/adpcm": [
			"adp"
		],
		"audio/basic": [
			"au",
			"snd"
		],
		"audio/midi": [
			"mid",
			"midi",
			"kar",
			"rmi"
		],
		"audio/mp4": [
			"mp4a",
			"m4a"
		],
		"audio/mpeg": [
			"mpga",
			"mp2",
			"mp2a",
			"mp3",
			"m2a",
			"m3a"
		],
		"audio/ogg": [
			"oga",
			"ogg",
			"spx"
		],
		"audio/s3m": [
			"s3m"
		],
		"audio/silk": [
			"sil"
		],
		"audio/vnd.dece.audio": [
			"uva",
			"uvva"
		],
		"audio/vnd.digital-winds": [
			"eol"
		],
		"audio/vnd.dra": [
			"dra"
		],
		"audio/vnd.dts": [
			"dts"
		],
		"audio/vnd.dts.hd": [
			"dtshd"
		],
		"audio/vnd.lucent.voice": [
			"lvp"
		],
		"audio/vnd.ms-playready.media.pya": [
			"pya"
		],
		"audio/vnd.nuera.ecelp4800": [
			"ecelp4800"
		],
		"audio/vnd.nuera.ecelp7470": [
			"ecelp7470"
		],
		"audio/vnd.nuera.ecelp9600": [
			"ecelp9600"
		],
		"audio/vnd.rip": [
			"rip"
		],
		"audio/webm": [
			"weba"
		],
		"audio/x-aac": [
			"aac"
		],
		"audio/x-aiff": [
			"aif",
			"aiff",
			"aifc"
		],
		"audio/x-caf": [
			"caf"
		],
		"audio/x-flac": [
			"flac"
		],
		"audio/x-matroska": [
			"mka"
		],
		"audio/x-mpegurl": [
			"m3u"
		],
		"audio/x-ms-wax": [
			"wax"
		],
		"audio/x-ms-wma": [
			"wma"
		],
		"audio/x-pn-realaudio": [
			"ram",
			"ra"
		],
		"audio/x-pn-realaudio-plugin": [
			"rmp"
		],
		"audio/x-wav": [
			"wav"
		],
		"audio/xm": [
			"xm"
		],
		"chemical/x-cdx": [
			"cdx"
		],
		"chemical/x-cif": [
			"cif"
		],
		"chemical/x-cmdf": [
			"cmdf"
		],
		"chemical/x-cml": [
			"cml"
		],
		"chemical/x-csml": [
			"csml"
		],
		"chemical/x-xyz": [
			"xyz"
		],
		"font/opentype": [
			"otf"
		],
		"image/bmp": [
			"bmp"
		],
		"image/cgm": [
			"cgm"
		],
		"image/g3fax": [
			"g3"
		],
		"image/gif": [
			"gif"
		],
		"image/ief": [
			"ief"
		],
		"image/jpeg": [
			"jpeg",
			"jpg",
			"jpe"
		],
		"image/ktx": [
			"ktx"
		],
		"image/png": [
			"png"
		],
		"image/prs.btif": [
			"btif"
		],
		"image/sgi": [
			"sgi"
		],
		"image/svg+xml": [
			"svg",
			"svgz"
		],
		"image/tiff": [
			"tiff",
			"tif"
		],
		"image/vnd.adobe.photoshop": [
			"psd"
		],
		"image/vnd.dece.graphic": [
			"uvi",
			"uvvi",
			"uvg",
			"uvvg"
		],
		"image/vnd.djvu": [
			"djvu",
			"djv"
		],
		"image/vnd.dvb.subtitle": [
			"sub"
		],
		"image/vnd.dwg": [
			"dwg"
		],
		"image/vnd.dxf": [
			"dxf"
		],
		"image/vnd.fastbidsheet": [
			"fbs"
		],
		"image/vnd.fpx": [
			"fpx"
		],
		"image/vnd.fst": [
			"fst"
		],
		"image/vnd.fujixerox.edmics-mmr": [
			"mmr"
		],
		"image/vnd.fujixerox.edmics-rlc": [
			"rlc"
		],
		"image/vnd.ms-modi": [
			"mdi"
		],
		"image/vnd.ms-photo": [
			"wdp"
		],
		"image/vnd.net-fpx": [
			"npx"
		],
		"image/vnd.wap.wbmp": [
			"wbmp"
		],
		"image/vnd.xiff": [
			"xif"
		],
		"image/webp": [
			"webp"
		],
		"image/x-3ds": [
			"3ds"
		],
		"image/x-cmu-raster": [
			"ras"
		],
		"image/x-cmx": [
			"cmx"
		],
		"image/x-freehand": [
			"fh",
			"fhc",
			"fh4",
			"fh5",
			"fh7"
		],
		"image/x-icon": [
			"ico"
		],
		"image/x-mrsid-image": [
			"sid"
		],
		"image/x-pcx": [
			"pcx"
		],
		"image/x-pict": [
			"pic",
			"pct"
		],
		"image/x-portable-anymap": [
			"pnm"
		],
		"image/x-portable-bitmap": [
			"pbm"
		],
		"image/x-portable-graymap": [
			"pgm"
		],
		"image/x-portable-pixmap": [
			"ppm"
		],
		"image/x-rgb": [
			"rgb"
		],
		"image/x-tga": [
			"tga"
		],
		"image/x-xbitmap": [
			"xbm"
		],
		"image/x-xpixmap": [
			"xpm"
		],
		"image/x-xwindowdump": [
			"xwd"
		],
		"message/rfc822": [
			"eml",
			"mime"
		],
		"model/iges": [
			"igs",
			"iges"
		],
		"model/mesh": [
			"msh",
			"mesh",
			"silo"
		],
		"model/vnd.collada+xml": [
			"dae"
		],
		"model/vnd.dwf": [
			"dwf"
		],
		"model/vnd.gdl": [
			"gdl"
		],
		"model/vnd.gtw": [
			"gtw"
		],
		"model/vnd.mts": [
			"mts"
		],
		"model/vnd.vtu": [
			"vtu"
		],
		"model/vrml": [
			"wrl",
			"vrml"
		],
		"model/x3d+binary": [
			"x3db",
			"x3dbz"
		],
		"model/x3d+vrml": [
			"x3dv",
			"x3dvz"
		],
		"model/x3d+xml": [
			"x3d",
			"x3dz"
		],
		"text/cache-manifest": [
			"appcache",
			"manifest"
		],
		"text/calendar": [
			"ics",
			"ifb"
		],
		"text/coffeescript": [
			"coffee"
		],
		"text/css": [
			"css"
		],
		"text/csv": [
			"csv"
		],
		"text/hjson": [
			"hjson"
		],
		"text/html": [
			"html",
			"htm"
		],
		"text/jade": [
			"jade"
		],
		"text/jsx": [
			"jsx"
		],
		"text/less": [
			"less"
		],
		"text/n3": [
			"n3"
		],
		"text/plain": [
			"txt",
			"text",
			"conf",
			"def",
			"list",
			"log",
			"in",
			"ini"
		],
		"text/prs.lines.tag": [
			"dsc"
		],
		"text/richtext": [
			"rtx"
		],
		"text/sgml": [
			"sgml",
			"sgm"
		],
		"text/stylus": [
			"stylus",
			"styl"
		],
		"text/tab-separated-values": [
			"tsv"
		],
		"text/troff": [
			"t",
			"tr",
			"roff",
			"man",
			"me",
			"ms"
		],
		"text/turtle": [
			"ttl"
		],
		"text/uri-list": [
			"uri",
			"uris",
			"urls"
		],
		"text/vcard": [
			"vcard"
		],
		"text/vnd.curl": [
			"curl"
		],
		"text/vnd.curl.dcurl": [
			"dcurl"
		],
		"text/vnd.curl.mcurl": [
			"mcurl"
		],
		"text/vnd.curl.scurl": [
			"scurl"
		],
		"text/vnd.dvb.subtitle": [
			"sub"
		],
		"text/vnd.fly": [
			"fly"
		],
		"text/vnd.fmi.flexstor": [
			"flx"
		],
		"text/vnd.graphviz": [
			"gv"
		],
		"text/vnd.in3d.3dml": [
			"3dml"
		],
		"text/vnd.in3d.spot": [
			"spot"
		],
		"text/vnd.sun.j2me.app-descriptor": [
			"jad"
		],
		"text/vnd.wap.wml": [
			"wml"
		],
		"text/vnd.wap.wmlscript": [
			"wmls"
		],
		"text/vtt": [
			"vtt"
		],
		"text/x-asm": [
			"s",
			"asm"
		],
		"text/x-c": [
			"c",
			"cc",
			"cxx",
			"cpp",
			"h",
			"hh",
			"dic"
		],
		"text/x-component": [
			"htc"
		],
		"text/x-fortran": [
			"f",
			"for",
			"f77",
			"f90"
		],
		"text/x-handlebars-template": [
			"hbs"
		],
		"text/x-java-source": [
			"java"
		],
		"text/x-lua": [
			"lua"
		],
		"text/x-markdown": [
			"markdown",
			"md",
			"mkd"
		],
		"text/x-nfo": [
			"nfo"
		],
		"text/x-opml": [
			"opml"
		],
		"text/x-pascal": [
			"p",
			"pas"
		],
		"text/x-sass": [
			"sass"
		],
		"text/x-scss": [
			"scss"
		],
		"text/x-setext": [
			"etx"
		],
		"text/x-sfv": [
			"sfv"
		],
		"text/x-uuencode": [
			"uu"
		],
		"text/x-vcalendar": [
			"vcs"
		],
		"text/x-vcard": [
			"vcf"
		],
		"text/yaml": [
			"yaml",
			"yml"
		],
		"video/3gpp": [
			"3gp"
		],
		"video/3gpp2": [
			"3g2"
		],
		"video/h261": [
			"h261"
		],
		"video/h263": [
			"h263"
		],
		"video/h264": [
			"h264"
		],
		"video/jpeg": [
			"jpgv"
		],
		"video/jpm": [
			"jpm",
			"jpgm"
		],
		"video/mj2": [
			"mj2",
			"mjp2"
		],
		"video/mp2t": [
			"ts"
		],
		"video/mp4": [
			"mp4",
			"mp4v",
			"mpg4"
		],
		"video/mpeg": [
			"mpeg",
			"mpg",
			"mpe",
			"m1v",
			"m2v"
		],
		"video/ogg": [
			"ogv"
		],
		"video/quicktime": [
			"qt",
			"mov"
		],
		"video/vnd.dece.hd": [
			"uvh",
			"uvvh"
		],
		"video/vnd.dece.mobile": [
			"uvm",
			"uvvm"
		],
		"video/vnd.dece.pd": [
			"uvp",
			"uvvp"
		],
		"video/vnd.dece.sd": [
			"uvs",
			"uvvs"
		],
		"video/vnd.dece.video": [
			"uvv",
			"uvvv"
		],
		"video/vnd.dvb.file": [
			"dvb"
		],
		"video/vnd.fvt": [
			"fvt"
		],
		"video/vnd.mpegurl": [
			"mxu",
			"m4u"
		],
		"video/vnd.ms-playready.media.pyv": [
			"pyv"
		],
		"video/vnd.uvvu.mp4": [
			"uvu",
			"uvvu"
		],
		"video/vnd.vivo": [
			"viv"
		],
		"video/webm": [
			"webm"
		],
		"video/x-f4v": [
			"f4v"
		],
		"video/x-fli": [
			"fli"
		],
		"video/x-flv": [
			"flv"
		],
		"video/x-m4v": [
			"m4v"
		],
		"video/x-matroska": [
			"mkv",
			"mk3d",
			"mks"
		],
		"video/x-mng": [
			"mng"
		],
		"video/x-ms-asf": [
			"asf",
			"asx"
		],
		"video/x-ms-vob": [
			"vob"
		],
		"video/x-ms-wm": [
			"wm"
		],
		"video/x-ms-wmv": [
			"wmv"
		],
		"video/x-ms-wmx": [
			"wmx"
		],
		"video/x-ms-wvx": [
			"wvx"
		],
		"video/x-msvideo": [
			"avi"
		],
		"video/x-sgi-movie": [
			"movie"
		],
		"video/x-smv": [
			"smv"
		],
		"x-conference/x-cooltalk": [
			"ice"
		]
	};

/***/ }
/******/ ]);