/* JBB Binary Bundle Loader - https://github.com/wavesoft/jbb-profile-three */
var JBBBinaryLoader =
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

	var BinaryBundle = __webpack_require__(1);

	var PBUND_REQUESTED = 0,
		PBUND_LOADED = 1,
		PBUND_PARSED = 2,
		PBUND_ERROR = 3;

	/**
	 * Numerical types
	 */
	var NUMTYPE = {
		UINT8: 	 0, INT8:    1,
		UINT16:  2, INT16:   3,
		UINT32:  4, INT32:   5,
		FLOAT32: 6, FLOAT64: 7
	}

	/**
	 * Downscaling numtype conversion table
	 */
	var NUMTYPE_DOWNSCALE = {
		// Source conversion type (actual)
		FROM: [
			NUMTYPE.UINT16,
			NUMTYPE.INT16,
			NUMTYPE.UINT32,
			NUMTYPE.INT32,
			NUMTYPE.UINT32,
			NUMTYPE.INT32,
			NUMTYPE.FLOAT32,
			NUMTYPE.FLOAT32,
		],
		// Destination conversion type (for downscaling)
		TO_DWS: [
			NUMTYPE.UINT8,
			NUMTYPE.INT8,
			NUMTYPE.UINT8,
			NUMTYPE.INT8,
			NUMTYPE.UINT16,
			NUMTYPE.INT16,
			NUMTYPE.INT8,
			NUMTYPE.INT16,
		],
		// Destination conversion type (for delta encoding)
		TO_DELTA: [
			NUMTYPE.INT8,
			NUMTYPE.INT8,
			NUMTYPE.INT8,
			NUMTYPE.INT8,
			NUMTYPE.INT16,
			NUMTYPE.INT16,
			NUMTYPE.INT8,
			NUMTYPE.INT16,
		]
	};

	/**
	 * Numerical type classes
	 */
	var NUMTYPE_CLASS = [
		Uint8Array,
		Int8Array,
		Uint16Array,
		Int16Array,
		Uint32Array,
		Int32Array,
		Float32Array,
		Float64Array
	];

	/**
	 * Numerical downscale classes
	 */
	var NUMTYPE_DOWNSCALE_DWS_CLASS = [
		Uint8Array,
		Int8Array,
		Uint8Array,
		Int8Array,
		Uint16Array,
		Int16Array,
		Int8Array,
		Int16Array
	];

	/**
	 * Numerical delta encoded classes
	 */
	var NUMTYPE_DOWNSCALE_DELTA_CLASS = [
		Int8Array,
		Int8Array,
		Int8Array,
		Int8Array,
		Int16Array,
		Int16Array,
		Int8Array,
		Int16Array
	];

	/**
	 * Delta encoding scale factor
	 */
	var DELTASCALE = {
		S_001 : 1, 	// Divide by 100 the value
		S_1	  : 2, 	// Keep value as-is
		S_R   : 3, 	// Multiply by 127 on 8-bit and by 32768 on 16-bit
		S_R00 : 4,  // Multiply by 12700 on 8-bit and by 3276800 on 16-bit
	};

	/**
	 * Simple primitive translation
	 */
	var PRIM_SIMPLE = [ undefined, null, false, true ],
		PRIM_SIMPLE_EX = [ NaN, /* Reserved */ ];

	//////////////////////////////////////////////////////////////////
	// Decoding Functions
	//////////////////////////////////////////////////////////////////

	/**
	 * Get the scale factor for the specified float-based delta encoding
	 * using the NUMTYPE_DOWNSCALE and DELTASCALE provided.
	 * 
	 * @param {int} t - The NUMTYPE_DOWNSCALE used in the encoding
	 * @param {int} scale - The DELTASCALE used in the encoding
	 * @return {float} - Return the scale factor
	 */
	function getFloatDeltaScale(t, scale) {
		if (scale === DELTASCALE.S_1)
			return 1.0;
		else if (scale === DELTASCALE.S_001)
			return 0.01;
		else {
			var multiplier = 1.0;
			if (scale === DELTASCALE.S_R00) multiplier = 100.0;
			// Check for INT8 target
			if ( ((t >= 0) && (t <= 3)) || (t === 6) ) {
				return multiplier * 127;
			} else {
				return multiplier * 32768;
			}
		}
	}

	/**
	 * Create a blob url from the given buffer
	 */
	function decodeBlobURL( bundle, length ) {
		var mimeType = bundle.readStringLT(),
			blob = new Blob([ bundle.readTypedArray[NUMTYPE.UINT8]( length ) ], { type: mimeType });
		return URL.createObjectURL(blob);
	}

	/**
	 * Read a buffer from the bundle
	 */
	function decodeBuffer( bundle, len, buf_type ) {
		var lnType = [ NUMTYPE.UINT8, NUMTYPE.UINT16, NUMTYPE.UINT32, NUMTYPE.FLOAT64 ][ len ],
			length = bundle.readTypedNum[ lnType ]();

		// Process buffer according to type
		if (buf_type === 0) { // STRING_LATIN
			return String.fromCharCode.apply(null, bundle.readTypedArray[ NUMTYPE.UINT8 ]( length ) );

		} else if (buf_type === 1) { // STRING_UTF8
			return String.fromCharCode.apply(null, bundle.readTypedArray[ NUMTYPE.UINT16 ]( length ) );

		} else if (buf_type === 2) { // IMAGE
			var img = document.createElement('img');
			img.src = decodeBlobURL( bundle, length );
			return img;

		} else if (buf_type === 4) { // SCRIPT
			var img = document.createElement('script');
			img.src = decodeBlobURL( bundle, length );
			return img;

		} else if (buf_type === 7) { // RESOURCE
			return decodeBlobURL( bundle, length );

		} else {
			throw {
				'name' 		: 'AssertError',
				'message'	: 'Unknown buffer type #'+buf_type+'!',
				toString 	: function(){return this.name + ": " + this.message;}
			}
		}

	}

	/**
	 * Read an object from the bundle
	 */
	function decodeObject( bundle, database, op ) {
		if ( !(op & 0x20) || ((op & 0x30) === 0x20) ) { // Predefined objects
			var eid = op;
			if (op & 0x20) eid = bundle.readTypedNum[ NUMTYPE.UINT8 ]() | ((op & 0x0F) << 8);

			// Fetch object class
			var ENTITY = bundle.ot.ENTITIES[eid];
			if (ENTITY === undefined) {
				throw {
					'name' 		: 'AssertError',
					'message'	: 'Could not found known object entity #'+eid+'!',
					toString 	: function(){return this.name + ": " + this.message;}
				}
			}

			// Call entity factory
			var instance = ENTITY[1]( ENTITY[0] );
			// Keep on irefs
			bundle.iref_table.push( instance );
			// Fetch property table
			// console.assert(eid != 50);
			var prop_table = decodePrimitive( bundle, database );

			// Run initializer
			ENTITY[2]( instance, bundle.ot.PROPERTIES[eid], prop_table );
			return instance;

		} else if ((op & 0x3C) === 0x38) { // Primitive object
			var poid = (op & 0x03);
			switch (poid) {
				case 0:
					var date = bundle.readTypedNum[ NUMTYPE.FLOAT64 ](),
						tzOffset = bundle.readTypedNum[ NUMTYPE.INT8 ]() * 10;

					// Return date
					return new Date( date );

				default:
					throw {
						'name' 		: 'AssertError',
						'message'	: 'Unknown primitive object with POID #'+poid+'!',
						toString 	: function(){return this.name + ": " + this.message;}
					}
			}

		} else if ((op & 0x38) === 0x30) { // Simple object with known signature
			var eid = ((op & 0x07) << 8) | bundle.readTypedNum[ NUMTYPE.UINT8 ](),
				factory = bundle.factory_plain[ eid ];
			if (factory === undefined) {
				throw {
					'name' 		: 'AssertError',
					'message'	: 'Could not found simple object signature with id #'+eid+'!',
					toString 	: function(){return this.name + ": " + this.message;}
				}
			}

			// Create object
			var values = decodePrimitive( bundle, database );
			return factory( values );

		} else if (op === 0x3F) { // New simple object, keep signature

			// Build factory funtion
			var factoryFn = "return {", llen = bundle.readTypedNum[ NUMTYPE.UINT16 ]();
			for (var i=0; i<llen; i++) {
				factoryFn += "'"+bundle.readStringLT()+"': values["+i+"],";
			}
			factoryFn += "}";

			// Compile factory function
			var factory = Function("values", factoryFn);
			bundle.plain_factory_table.push( factory );

			// Create object
			var values = decodePrimitive( bundle, database );
			return factory( values );

		}

	}

	/**
	 * Decode delta-encoded float array
	 */
	function decodeDeltaArrayFloat( bundle, value_0, values, scale ) {
		var ans = new Float32Array( values.length + 1 ),
			v = value_0;
		ans[0] = v;
		for (var i=0, llen=values.length; i<llen; i++) {
			v += values[i] / scale;
			ans[i+1] = v;
		}
		return ans;
	}

	/**
	 * Decode delta-encoded float array
	 */
	function decodeDeltaArrayInt( bundle, value_0, values, array_class ) {
		var ans = new array_class( values.length + 1 ),
			v = value_0;
		ans[0] = v;
		for (var i=0, llen=values.length; i<llen; i++) {
			v += values[i];
			ans[i+1] = v;
		}
		return ans;
	}

	/**
	 * Decode plain bulk array
	 */
	function decodePlainBulkArray( bundle, database, len ) {

		// // Read plain object keys and create object
		// // factory class for faster parsing
		// var numKeys = bundle.readTypedNum[ NUMTYPE.UINT8 ](),
		// 	keys = [], factoryFn = "return {";
		// for (var i=0; i<numKeys; i++) {
		// 	var k = bundle.readStringLT(); keys.push( k );
		// 	factoryFn += "'"+k+"': props["+i+"][i],";
		// }
		// factoryFn += "}";

		// Get signature ID
		var sid = bundle.readTypedNum[ NUMTYPE.UINT16 ](),
			properties = bundle.signature_table[sid],
			objectFactory = bundle.factory_plain_bulk[sid];
		if (!properties) {
			throw {
				'name' 		: 'AssertError',
				'message'	: 'Unknown plain object with signature #'+sid+'!',
				toString 	: function(){return this.name + ": " + this.message;}
			}
		}

		// Read property arrays
		var props = [];
		for (var i=0, l=properties.length; i<l; i++)
			props.push(decodePrimitive( bundle, database ));

		// // Create factory function
		// var makeObject = Function("props","i", factoryFn);

		// Create objects
		var ans = [];
		for (var i=0; i<len; i++)
			ans.push( objectFactory(props, i) );
		return ans;
		
	}

	/**
	 * Decode bulk array of entities
	 */
	function decodeBulkArray( bundle, database, len ) {
		var eid = bundle.readTypedNum[ NUMTYPE.UINT16 ](),
			PROPERTIES = bundle.ot.PROPERTIES[ eid ],
			ENTITY = bundle.ot.ENTITIES[ eid ];

		// Fabricate all objects
		var ans = [], prop_tables=[];
		for (var i=0; i<len; i++) {
			// Call entity factory
			ans.push( ENTITY[1]( ENTITY[0] ) );
			prop_tables.push( [] );
		}

		// Weave-create property tables
		for (var j=0, pl=PROPERTIES.length; j<pl; j++) {
			var props = decodePrimitive( bundle, database );
			for (var i=0; i<len; i++)
				prop_tables[i].push( props[i] );
		}

		// Run initializers
		for (var i=0; i<len; i++) {
			// Run initializers
			ENTITY[2]( ans[i], PROPERTIES, prop_tables[i] );
		}

		// Free proprty tables and return objects
		prop_tables = [];
		return ans;

	}

	/**
	 * Decode primitive array
	 */
	function decodePrimitiveArray( bundle, database, length ) {
		var i=0, ans = [], size=0, flag=10, flen=0;

		// Collect primitives
		while (size<length) {
			// Peek on the operator
			var op = bundle.u8[ bundle.i8 ];
			if ((op & 0xFC) === 0x78) { // Primitive Flag
				// If the next opcode seems like a flag, pop it (otherwise
				// that's an opcode that defines a primitive)
				bundle.i8++;
				// Keep flag
				flag = op & 0x03;
				switch (flag) {
					case 0: // REPEAT
						flen = bundle.readTypedNum[ NUMTYPE.UINT8 ]() + 1;
						break;
					case 1: // NUMERIC
						break;
					case 2: // PLAIN_BULK
						flen = bundle.readTypedNum[ NUMTYPE.UINT16 ](); 

						// This is a special case. We have a bit more complex
						// parsing mechanism. The next object is NOT primitive
						// TODO: Perhaps MAKE it primtive?
						ans = ans.concat( decodePlainBulkArray( bundle, database, flen ) );
						size += flen;

						// Reset flag
						flag = 10;

						break;
					default:
						throw {
							'name' 		: 'AssertError',
							'message'	: 'Unknown primitive array flag #'+flag+'!',
							toString 	: function(){return this.name + ": " + this.message;}
						}
				}
			} else { // Primitive
				var prim = decodePrimitive( bundle, database );
				if (flag !== 10) {
					// Apply flags to primitive
					switch (flag) {
						case 0: // REPEAT (Repeat primitive)
							for (var i=0; i<flen; i++) ans.push(prim);
							size += flen;
							break;
						case 1: // NUMERIC (Merge numeric values from primitive)
							ans = ans.concat( Array.prototype.slice.call(prim) );
							size += prim.length;
							break;
						case 2: // BULK (Multiple entities with weaved property arrays)
							break;

					}
					// Reset flag
					flag = 10;
				} else {
					// Keep primitive
					ans.push(prim);
					size += 1;
				}
			}
		}

		// Return array
		return ans;

	}

	/**
	 * Read an array from the bundle
	 */
	function decodeArray( bundle, database, op ) {
		var ln3 = (((op & 0x8) >> 3) === 0) ? NUMTYPE.UINT16 : NUMTYPE.UINT32, 
			ln0 = ((op & 0x1) === 0) ? NUMTYPE.UINT16 : NUMTYPE.UINT32,
			scl = (op & 0x30) >> 4,
			typ = (op & 0x7);

		if ((op & 0x40) === 0x00) { // Delta-Encoded
			var l = bundle.readTypedNum[ ln3 ](),
				v0 = bundle.readTypedNum[ NUMTYPE_DOWNSCALE.FROM[typ] ](),
				vArr = bundle.readTypedArray[ NUMTYPE_DOWNSCALE.TO_DELTA[typ] ]( l - 1 );

			if (typ < 6) {
				// Return delta-decoded integer array
				return decodeDeltaArrayInt(bundle,
					v0,
					vArr,
					NUMTYPE_CLASS[ NUMTYPE_DOWNSCALE.FROM[typ] ] );
			} else {
				// Return delta-decoded float array
				return decodeDeltaArrayFloat(bundle,
					v0,
					vArr,
					getFloatDeltaScale(typ, scl) );
			}


		} else if ((op & 0x70) === 0x40) { // Raw
			var l = bundle.readTypedNum[ ln3 ]();

			// Return raw array
			return bundle.readTypedArray[ typ ]( l );

		} else if ((op & 0x70) === 0x50) { // Repeated
			var l = bundle.readTypedNum[ ln3 ](),
				v0 = bundle.readTypedNum[ typ ](),
				arr = new NUMTYPE_CLASS[ typ ]( l );

			// Repeat value
			for (var i=0; i<l; i++) arr[i]=v0;
			return arr;

		} else if ((op & 0x70) === 0x60) { // Downscaled
			var l = bundle.readTypedNum[ ln3 ](),
				v0 = bundle.readTypedNum[ NUMTYPE_DOWNSCALE.FROM[typ] ](),
				vArr = bundle.readTypedArray[ NUMTYPE_DOWNSCALE.TO_DWS[typ] ]( l ),
				// Type-cast constructor
				nArr = new NUMTYPE_CLASS[ NUMTYPE_DOWNSCALE.FROM[typ] ]( vArr );

			return nArr;

		} else if ((op & 0x78) === 0x70) { // Short
			var l = bundle.readTypedNum[ NUMTYPE.UINT8 ](),
				vArr = bundle.readTypedArray[ typ ]( l );

			// Return short array
			return vArr;

		} else if ((op & 0x7C) === 0x78) { // Flag
			// This operator is used ONLY as indicator when parsing a primitive array
			throw {
				'name' 		: 'AssertError',
				'message'	: 'Encountered FLAG operator outside a primitive array!',
				toString 	: function(){return this.name + ": " + this.message;}
			}

		} else if ((op & 0x7E) === 0x7C) { // Primitive
			var l = bundle.readTypedNum[ ln0 ]();

			// Return decoded primitive array
			return decodePrimitiveArray( bundle, database, l );

		} else if ((op & 0x7F) === 0x7E) { // Empty

			// Return empty array
			return [];

		} else if ((op & 0x7F) === 0x7F) { // Extended
			// Currently unused
		}
	}

	/**
	 * Read a primitive from the bundle
	 */
	function decodePrimitive( bundle, database ) {
		var op = bundle.readTypedNum[ NUMTYPE.UINT8 ]();
		if ((op & 0x80) === 0x00) { // Array
			return decodeArray(bundle, database,
				(op & 0x7F) );

		} else if ((op & 0xC0) === 0x80) { // Object
			return decodeObject(bundle, database,
				(op & 0x3F) );

		} else if ((op & 0xE0) === 0xC0) { // Buffer
			return decodeBuffer(bundle,
				(op & 0x18) >> 3,
				(op & 0x07) );

		} else if ((op & 0xF0) === 0xE0) { // I-Ref
			var id = ((op & 0x0F) << 16) | bundle.readTypedNum[ NUMTYPE.UINT16 ]();
			return bundle.iref_table[id];

		} else if ((op & 0xF8) === 0xF0) { // Number
			return bundle.readTypedNum[ op & 0x07 ]();

		} else if ((op & 0xFC) === 0xF8) { // Simple
			return PRIM_SIMPLE[ op & 0x03 ];

		} else if ((op & 0xFE) === 0xFC) { // Simple_EX
			return PRIM_SIMPLE_EX[ op & 0x02 ];

		} else if ((op & 0xFF) === 0xFE) { // Import
			var name = bundle.readStringLT();
			if (database[name] === undefined) throw {
				'name' 		: 'ImportError',
				'message'	: 'Cannot import undefined external reference '+name+'!',
				toString 	: function(){return this.name + ": " + this.message;}
			};
			return database[name];

		} else if ((op & 0xFF) === 0xFF) { // Extended
			// Currently unused
		}
	}

	/**
	 * Pare the entire bundle
	 */
	function parseBundle( bundle, database ) {
		while (!bundle.eof()) {
			var op = bundle.readTypedNum[ NUMTYPE.UINT8 ]();
			switch (op) {
				case 0xF8: // Export
					var export_name = bundle.prefix + bundle.readStringLT();
					database[ export_name ] = decodePrimitive( bundle, database );
					break;

				default:
					throw {
						'name' 		: 'AssertError',
						'message'	: 'Unknown control operator #'+op+' at @'+bundle.i8+'!',
						toString 	: function(){return this.name + ": " + this.message;}
					}
			}
		}
	}

	/**
	 * Download helper
	 */
	function downloadArrayBuffers( urls, callback ) {

		// Prepare the completion calbacks
		var pending = urls.length, buffers = Array(pending);
		var continue_callback = function( response, index ) {
			buffers[index] = response;
			if (--pending === 0) callback( null, buffers );
		};

		// Start loading each url in parallel
		var triggeredError = false;
		for (var i=0; i<urls.length; i++) {
			(function(index) {
				// Request binary bundle
				var req = new XMLHttpRequest(),
					scope = this;

				// Place request
				req.open('GET', urls[index]);
				req.responseType = "arraybuffer";
				req.send();

				// Wait until the bundle is loaded
				req.onreadystatechange = function () {
					if (req.readyState !== 4) return;
					if (req.status === 200) {  
						// Continue loading
						continue_callback( req.response, index );
					} else {
						// Trigger callback only once
						if (triggeredError) return;
						callback( "Error loading "+urls[index]+": "+req.statusText, null );
						triggeredError = true;
					}
				};
			})(i);
		}

	}

	//////////////////////////////////////////////////////////////////
	// Binary Loader
	//////////////////////////////////////////////////////////////////

	/**
	 * Binary bundle loader
	 */
	var BinaryLoader = function( objectTable, baseDir, database ) {

		// Check for missing baseDir
		if (typeof(baseDir) === "object") {
			database = baseDir;
			baseDir = "";
		}

		// Initialize properties
		this.database = database || {};

		// Keep the base dir
		this.baseDir = baseDir || "";

		// Queued requests pending loading
		this.queuedRequests = [];

		// Keep object table
		this.objectTable = objectTable;

	};

	/**
	 * 
	 */
	BinaryLoader.prototype = {

		'constructor': BinaryLoader,

		/**
		 * Load the specified bundle from URL and call the onsuccess callback.
		 * If an error occures, call the onerror callback.
		 *
		 * @param {string} url - The URL to load
		 * @param {function} callback - The callback to fire when the bundle is loaded
		 */
		'add': function( url, callback ) {

			// Check for base dir
			var prefix = "";
			if (this.baseDir)
				prefix = this.baseDir + "/";

			// Check for sparse bundle
			var parts = url.split("?"), suffix = "", reqURL = [];
			if (parts.length > 1) suffix = "?"+parts[1];
			if (parts[0].substr(parts[0].length - 5).toLowerCase() === ".jbbp") {
				var base = prefix + parts[0].substr(0, parts[0].length - 5);
				reqURL = [
					base + '.jbbp',
					base + '_b16.jbbp',
					base + '_b32.jbbp',
					base + '_b64.jbbp'
				];
			} else {
				// Assume .jbb if missing (TODO: not a good idea)
				var url = parts[0];
				if (url.substr(url.length-4) != ".jbb") url += ".jbb";
				reqURL = [ prefix + url + suffix ];
			}

			// Load bundle header and keep a callback
			// for the remainging loading operations
			var pendingBundle = {
				'callback': callback,
				'status': PBUND_REQUESTED,
				'buffer': undefined,
				'url': reqURL
			};

			// Keep this pending action
			this.queuedRequests.push( pendingBundle );

		},

		/**
		 * Load from buffer
		 */
		'addByBuffer': function( buffer ) {

			// Prepare pending bundle
			var pendingBundle = {
				'callback': undefined,
				'status': PBUND_LOADED,
				'buffer': buffer,
				'url': undefined,
			};

			// Keep this pending action
			this.queuedRequests.push( pendingBundle );

		},

		/**
		 * Load the bundle
		 */
		'load': function( callback ) {
			this.__process( callback );
		},

		/**
		 * Parse the stack of bundles currently loaded
		 */
		'__process': function( callback ) {
			var self = this;
			if (!callback) callback = function(){};

			// If there are no queued requests, fire callback as-is
			if (this.queuedRequests.length === 0) {
				callback( null, this );
				return;
			}

			// First make sure that there are no bundles pending loading
			var pendingLoading = false;
			for (var i=0; i<this.queuedRequests.length; i++) {
				if (this.queuedRequests[i].status === PBUND_REQUESTED) {
					pendingLoading = true;
					break;
				}
			}

			////////////////////////////////////////////////////////
			// Iteration 1 - PBUND_REQUESTED -> PBUND_LOADED
			// ----------------------------------------------------
			// Download all bundles in pending state.
			////////////////////////////////////////////////////////

			if (pendingLoading) {

				// Prepare the callbacks for when this is finished
				var state = { 'counter': 0 }
				var continue_callback = (function() {
					// When reached 0, continue loading
					if (--this.counter === 0)
						self.__process( callback );
				}).bind(state);

				// Place all requests in parallel
				var triggeredError = false;
				for (var i=0; i<this.queuedRequests.length; i++) {
					var req = this.queuedRequests[i];
					if (req.status === PBUND_REQUESTED) {

						// Download bundle from URL(s)
						state.counter++;
						downloadArrayBuffers(req.url, 
							(function(req) {
								return function( err, response ) {

									// Handle errors
									if (err) {
										if (triggeredError) return;
										var errMsg = "Error downloading bundle: "+err;
										if (req.callback) req.callback( errMsg, null);
										if (callback) callback(errMsg, null);
										triggeredError = true;
										return;
									}

									// Discard array if only 1 item
									req.buffer = response;
									if (response.length === 1) req.buffer = response[0];
									// Keep buffer and mark as loaded
									req.status = PBUND_LOADED;
									// Continue
									continue_callback();
								}
							})(req)
						);

					}
				}

				// Do not continue, we ar asynchronous
				return;
			}

			////////////////////////////////////////////////////////
			// Iteration 2 - PBUND_LOADED -> PBUND_PARSED
			// ----------------------------------------------------
			// Parse all loaded bundles (synchronous)
			////////////////////////////////////////////////////////

			for (var i=0; i<this.queuedRequests.length; i++) {
				var req = this.queuedRequests[i];
				if (req.status === PBUND_LOADED) {
					// try {

					// Create & parse bundle
					var bundle = new BinaryBundle( req.buffer, self.objectTable );
					parseBundle( bundle, self.database );

					// Trigger bundle callback
					if (req.callback) req.callback( null, req.bundle );

					// } catch (e) {

					// 	// Update bundle status
					// 	req.status = PBUND_ERROR;

					// 	// Fire error callbacks and exit
					// 	var errMsg = "Error parsing bundle: "+e.toString();
					// 	if (req.callback) req.callback( errMsg, null);
					// 	if (callback) callback(errMsg, null);
					// 	return;

					// }
				}
			}

			// We are ready
			this.queuedRequests = [];
			callback( null, this );

		}


	};

	// Export the binary loader
	module.exports = BinaryLoader;


/***/ },
/* 1 */
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

	var hexy = __webpack_require__(2);

	/**
	 * Numerical types
	 */
	var NUMTYPE = {
		UINT8: 	 0, INT8:    1,
		UINT16:  2, INT16:   3,
		UINT32:  4, INT32:   5,
		FLOAT32: 6, FLOAT64: 7
	}

	//////////////////////////////////////////////////////////////////
	// Binary Bundle Representation
	//////////////////////////////////////////////////////////////////

	/**
	 * Representation of the binary bundle from buffer
	 */
	var BinaryBundle = function( buffer, objectTable ) {

		// The object table to use
		this.ot = objectTable;

		// Exported properties prefix
		this.prefix = "";

		// If we are given an array as buffer, it means
		// that we loaded separate chunks rather than a 
		// single, unifide buffer.
		this.sparse = (buffer instanceof Array);
		var hv16, hv32, primBufLen, header_size = 32;
		if (this.sparse) {

			// Setup views to the buffer
			this.u8  = new Uint8Array(buffer[0]);
			this.s8  = new Int8Array(buffer[0]);
			this.u16 = new Uint16Array(buffer[1]);
			this.s16 = new Int16Array(buffer[1]);
			this.u32 = new Uint32Array(buffer[2]);
			this.s32 = new Int32Array(buffer[2]);
			this.f32 = new Float32Array(buffer[2]);
			this.f64 = new Float64Array(buffer[3]);

			// Header views
			hv16 = new Uint16Array(buffer[0], 0, header_size);
			hv32 = new Uint32Array(buffer[0], 0, header_size);

			// Length of the primary buffer
			primBufLen = buffer[0].byteLength;

		} else {

			// Setup views to the buffer
			this.u8  = new Uint8Array(buffer);
			this.s8  = new Int8Array(buffer);
			this.u16 = new Uint16Array(buffer);
			this.s16 = new Int16Array(buffer);
			this.u32 = new Uint32Array(buffer);
			this.s32 = new Int32Array(buffer);
			this.f32 = new Float32Array(buffer);
			this.f64 = new Float64Array(buffer);

			// Header views
			hv16 = new Uint16Array(buffer);
			hv32 = new Uint32Array(buffer);

			// Length of the primary buffer
			primBufLen = buffer.byteLength;

		}

		// Read header
		this.magic  	= hv16[0];
		this.table_id  	= hv16[1];
		this.revision 	= hv16[2];

		this.max64  	= hv32[2];
		this.max32 		= hv32[3];
		this.max16 		= hv32[4];
		this.max8  		= hv32[5];
		this.lenST 		= hv32[6];
		this.lenOT 		= hv32[7];

		// Validate magic
		if (this.magic == 0x3142) {
			throw {
				'name' 		: 'EndianessError',
				'message'	: 'Unfortunately the JBB format is currently only compatible with Little-Endian CPUs',
				toString 	: function(){return this.name + ": " + this.message;}
			}
		} else if (this.magic != 0x4231) {
			throw {
				'name' 		: 'DecodingError',
				'message'	: 'This does not look like a JBB archive! (Magic is 0x'+this.magic.toString(16)+')',
				toString 	: function(){return this.name + ": " + this.message;}
			}
		}

		// Validate object table id
		if (this.table_id != this.ot.ID) {
			throw {
				'name' 		: 'DecodingError',
				'message'	: 'The object table specified does not match the object table in the binary bundle (0x'+this.table_id.toString(16)+')',
				toString 	: function(){return this.name + ": " + this.message;}
			}
		}

		// Setup indices
		if (this.sparse) {

			// Setup indices
			this.i64 = 0;
			this.i32 = 0;
			this.i16 = 0;
			this.i8  = header_size;
			this.iEnd= this.i8 + this.max8 - this.lenST;

			// Offsets of array beginning (for getting array portions)
			this.ofs8  = this.i8;
			this.ofs16 = this.i16;
			this.ofs32 = this.i32;
			this.ofs64 = this.i64;

		} else {

			// Setup indices
			this.i64 = header_size;
			this.i32 = this.i64 + this.max64;
			this.i16 = this.i32 + this.max32;
			this.i8  = this.i16 + this.max16;
			this.iEnd= this.i8 + this.max8 - this.lenST;

			// Offsets of array beginning (for getting array portions)
			this.ofs8  = this.i8;
			this.ofs16 = this.i16;
			this.ofs32 = this.i32;
			this.ofs64 = this.i64;

			// Convert to element index
			this.i16 /= 2;
			this.i32 /= 4;
			this.i64 /= 8;

		}

		// Internal reference table
		this.iref_table = [];

		// String lookup table
		this.string_table = [];

		// Signature table
		this.signature_table = [];

		// Populate string lookup table
		var str = "";
		for (var l=this.i8+this.max8, i=l-this.lenST; i<l; i++) {
			var c = this.u8[i];
			if (c === 0) {
				this.string_table.push(str);
				str = "";
			} else {
				str += String.fromCharCode(c);
			}
		}
		if (str) this.string_table.push(str);

		// Populate object signature lookup table
		var obj = [], keysPending = 0;
		for (var l=this.i16*2+this.max16, i=l-this.lenOT; i<l; i+=2) {
			var c = this.u16[i/2];
			if (keysPending--) {
				obj.push( this.string_table[c] );
			} else {
				if (obj.length > 0) this.signature_table.push(obj);
				obj = []; keysPending = c;
				if (c == 0) break;
			}
		}
		if (obj.length > 0) this.signature_table.push(obj);

		// Create fast numerical read functions
		var scope = this;
		this.readTypedNum = [
			function() { return scope.u8[scope.i8++]; },
			function() { return scope.s8[scope.i8++]; },
			function() { return scope.u16[scope.i16++]; },
			function() { return scope.s16[scope.i16++]; },
			function() { return scope.u32[scope.i32++]; },
			function() { return scope.s32[scope.i32++]; },
			function() { return scope.f32[scope.i32++]; },
			function() { return scope.f64[scope.i64++]; },
		];
		// this.readTypedNum = [
		// 	function() { var v = scope.u8[scope.i8++];   console.log("8U@",scope.i8-1 -scope.ofs8/1,"=",  v,"[0x"+v.toString(16)+"]");  return v; },
		// 	function() { var v = scope.s8[scope.i8++];   console.log("8S@",scope.i8-1 -scope.ofs8/1,"=",  v,"[0x"+v.toString(16)+"]");  return v; },
		// 	function() { var v = scope.u16[scope.i16++]; console.log("16U@",scope.i16-1-scope.ofs16/2,"=",v,"[0x"+v.toString(16)+"]"); return v; },
		// 	function() { var v = scope.s16[scope.i16++]; console.log("16S@",scope.i16-1-scope.ofs16/2,"=",v,"[0x"+v.toString(16)+"]"); return v; },
		// 	function() { var v = scope.u32[scope.i32++]; console.log("32U@",scope.i32-1-scope.ofs32/4,"=",v,"[0x"+v.toString(16)+"]"); return v; },
		// 	function() { var v = scope.s32[scope.i32++]; console.log("32S@",scope.i32-1-scope.ofs32/4,"=",v,"[0x"+v.toString(16)+"]"); return v; },
		// 	function() { var v = scope.f32[scope.i32++]; console.log("32F@",scope.i32-1-scope.ofs32/4,"=",v,"[0x"+v.toString(16)+"]"); return v; },
		// 	function() { var v = scope.f64[scope.i64++]; console.log("64F@",scope.i64-1-scope.ofs64/8,"=",v,"[0x"+v.toString(16)+"]"); return v; },
		// ];

		// Create fast typed array read function
		if (this.sparse) {
			this.readTypedArray = [
				function (l) { var o = scope.i8;  	scope.i8  += l; return new Uint8Array(buffer[0], o, l); },
				function (l) { var o = scope.i8;  	scope.i8  += l; return new Int8Array(buffer[0], o, l); },
				function (l) { var o = 2*scope.i16; scope.i16 += l; return new Uint16Array(buffer[1], o, l); },
				function (l) { var o = 2*scope.i16; scope.i16 += l; return new Int16Array(buffer[1], o, l); },
				function (l) { var o = 4*scope.i32; scope.i32 += l; return new Uint32Array(buffer[2], o, l); },
				function (l) { var o = 4*scope.i32; scope.i32 += l; return new Int32Array(buffer[2], o, l); },
				function (l) { var o = 4*scope.i32; scope.i32 += l; return new Float32Array(buffer[2], o, l); },
				function (l) { var o = 8*scope.i64; scope.i64 += l; return new Float64Array(buffer[3], o, l); },
			];
		} else {
			this.readTypedArray = [
				function (l) { var o = scope.i8;  	scope.i8  += l; return new Uint8Array(buffer, o, l); },
				function (l) { var o = scope.i8;  	scope.i8  += l; return new Int8Array(buffer, o, l); },
				function (l) { var o = 2*scope.i16; scope.i16 += l; return new Uint16Array(buffer, o, l); },
				function (l) { var o = 2*scope.i16; scope.i16 += l; return new Int16Array(buffer, o, l); },
				function (l) { var o = 4*scope.i32; scope.i32 += l; return new Uint32Array(buffer, o, l); },
				function (l) { var o = 4*scope.i32; scope.i32 += l; return new Int32Array(buffer, o, l); },
				function (l) { var o = 4*scope.i32; scope.i32 += l; return new Float32Array(buffer, o, l); },
				function (l) { var o = 8*scope.i64; scope.i64 += l; return new Float64Array(buffer, o, l); },
			];
		}

		// Create simple object factories from the object table
		this.factory_plain = [];
		this.factory_plain_bulk = [];
		for (var i=0; i<this.signature_table.length; i++) {

			// Build factory funtion
			var factoryPlain = "return {", factoryBulk = factoryPlain,
				props = this.signature_table[i], llen = props.length;
			for (var j=0; j<llen; j++) {
				factoryPlain += "'"+props[j]+"': values["+j+"],";
				factoryBulk +=  "'"+props[j]+"': values["+j+"][i],";
			}
			factoryPlain += "}";
			factoryBulk += "}";

			// Compile factory function
			this.factory_plain.push( new Function("values", factoryPlain) );
			this.factory_plain_bulk.push( new Function("values", "i", factoryPlain) );

		}

	}

	/**
	 * Read a 16-bit string lookup table ID and translate to it's string
	 */
	BinaryBundle.prototype.readStringLT = function() {
		var id = this.readTypedNum[ NUMTYPE.UINT16 ]();
		if (id >= this.string_table.length) throw {
			'name' 		: 'RangeError',
			'message'	: 'String ID is outside than the range of the string lookup table!',
			toString 	: function(){return this.name + ": " + this.message;}
		}
		return this.string_table[id];
	}

	/**
	 * Check if we ran out of opcodes
	 */
	BinaryBundle.prototype.eof = function() {
		return (this.i8 >= this.iEnd);
	}

	/**
	 * Print the index offsets
	 */
	BinaryBundle.prototype.where = function() {
		console.log( "i8=",  this.i8 - this.ofs8,  " [U:",this.u8[this.i8], "0x"+this.u8[this.i8].toString(16),"/ S:",this.s8[this.i8],"]" );
		console.log( "i16=", this.i16 - this.ofs16/2, " [U:",this.u16[this.i16], "/ S:",this.s16[this.i16],"]" );
		console.log( "i32=", this.i32 - this.ofs32/4, " [U:",this.u32[this.i32], "/ S:",this.s32[this.i32],"/ F:",this.f32[this.i32],"]" );
		console.log( "i64=", this.i64 - this.ofs64/8, " [F:",this.f64[this.i64], "]");
	}

	module.exports = BinaryBundle;


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {//= hexy.js -- utility to create hex dumps 
	//
	// `hexy` is a javascript (node) library that's easy to use to create hex
	// dumps from within node. It contains a number of options to configure
	// how the hex dump will end up looking.
	//
	// It should create a pleasant looking hex dumb by default:
	//    
	//    var hexy = require('hexy'),
	//           b = new Buffer("\000\001\003\005\037\012\011bcdefghijklmnopqrstuvwxyz0123456789")
	//    
	//    console.log(hexy.hexy(b))
	//
	// results in this dump:
	//
	//    00000000: 0001 0305 1f0a 0962 6364 6566 6768 696a  .......bcdefghij
	//    00000010: 6b6c 6d6e 6f70 7172 7374 7576 7778 797a  klmnopqrstuvwxyz
	//    00000020: 3031 3233 3435 3637 3839                 0123456789
	//
	// but it's also possible to configure:
	//
	//  * Line numbering
	//  * Line width
	//  * Format of byte grouping
	//  * Case of hex decimals
	//  * Presence of the ASCII annotation in the right column.
	//
	// This mean it's easy to generate exciting dumps like:
	//
	//    0000000: 0001 0305 1f0a 0962  .... ...b 
	//    0000008: 6364 6566 6768 696a  cdef ghij 
	//    0000010: 6b6c 6d6e 6f70 7172  klmn opqr 
	//    0000018: 7374 7576 7778 797a  stuv wxyz 
	//    0000020: 3031 3233 3435 3637  0123 4567 
	//    0000028: 3839                 89
	//
	// or even:
	//
	//    0000000: 00 01 03 05 1f 0a 09 62   63 64 65 66 67 68 69 6a 
	//    0000010: 6b 6c 6d 6e 6f 70 71 72   73 74 75 76 77 78 79 7a 
	//    0000020: 30 31 32 33 34 35 36 37   38 39
	//
	// with hexy!
	// 
	// Formatting options are configured by passing a `format` object to the `hexy` function:
	//
	//    var format = {}
	//        format.width = width  // how many bytes per line, default 16
	//        format.numbering = n  // ["hex_bytes" | "none"],  default "hex_bytes"
	//        format.format = f     // ["fours"|"twos"|"none"], how many nibbles per group
	//                              //                          default "fours"
	//        format.caps = c       // ["lower"|"upper"],       default lower
	//        format.annotate=a     // ["ascii"|"none"], ascii annotation at end of line?
	//                              //                          default "ascii"
	//        format.prefix=p       // <string> something pretty to put in front of each line
	//                              //                          default ""
	//        format.indent=i       // <num> number of spaces to indent
	//                              //                          default 0
	//        format.offset         // offset into the buffer to start
	//        format.length         // number of bytes to display
	//        format.display_offset // modifiy the starting address by the indicated
	//                              // number of bytes
	//        format.html=true      // funky html divs 'n stuff! experimental.
	//                              //                          default: false
	//
	//    console.log(hexy.hexy(buffer, format))
	//
	// In case you're really nerdy, you'll have noticed that the defaults correspond
	// to how `xxd` formats it's output.
	//           
	//
	//== Installing
	//
	// Either use `npm`:
	//  
	//    npm install hexy
	//
	// This will install the lib which you'll be able to use like so:
	//    
	//    var hexy = require("hexy"),
	//        buf  = // get Buffer from somewhere,
	//        str  = hexy.hexy(buf)
	//
	// It will also install `hexy` into your path in case you're totally fed up
	// with using `xxd`.
	//        
	// 
	// If you don't like `npm`, grab the source from github:
	//
	//    http://github.com/a2800276/hexy.js
	//
	//== TODOS
	//
	// The current version only pretty prints node Buffer and JS Strings. This
	// should be expanded to also do typed arrays, Streams/series of Buffers
	// which would be nice so you don't have to collect the whole things you
	// want to pretty print in memory, and such.
	//
	// I'd like to improve html rendering, e.g. to be able to mouse over the
	// ascii annotation and highlight the hex byte and vice versa, improve
	// browser integration and set up a proper build & packaging system.
	//
	// 
	//== Thanks
	//
	//* Thanks to Isaac Schlueter [isaacs] for gratiously lending a hand and
	//cheering me up.
	//* dodo (http://coderwall.com/dodo)
	//
	//
	//== History
	//
	// This is a fairly straightforward port of `hexy.rb` which does more or less the
	// same thing. You can find it here: 
	// 
	//    http://github.com/a2800276/hexy
	// 
	// in case these sorts of things interest you.
	//
	//== Mail
	//
	// In case you discover bugs, spelling errors, offer suggestions for
	// improvements or would like to help out with the project, you can contact
	// me directly (tim@kuriositaet.de). 


	(function (arg) {

	var hexy = function (buffer, config) {
	  var h = new Hexy(buffer, config)
	  return h.toString()
	}

	var Hexy = function (buffer, config) {
	  var self = this

	  buffer = (Buffer.isBuffer(buffer) && buffer) || (typeof buffer === 'string' && new Buffer(buffer)) || new Buffer(0)
	  config = config || {}
	 
	  self.buffer    = buffer // magic string conversion here?
	  self.width     = config.width || 16
	  self.numbering = config.numbering == "none"  ? "none" : "hex_bytes"
	   
	  switch (config.format) {
	    case "none":
	    case "twos":
	      self.format = config.format
	      break
	    default:
	      self.format = "fours"
	  }
	  
	  self.caps        = config.caps        == "upper" ? "upper" : "lower"
	  self.annotate    = config.annotate    == "none"  ? "none"  : "ascii"
	  self.prefix      = config.prefix      || ""
	  self.indent      = config.indent      || 0
	  self.html        = config.html        || false
	  self.offset      = config.offset      || 0
	  self.length      = config.length      || -1
	  
	  self.display_offset = config.display_offset || 0

	  if (self.offset) {
	    if (self.offset < self.buffer.length) {
	      self.buffer = self.buffer.slice(self.offset)
	    }
	  }

	  if (self.length !== -1) {
	    if (self.length <= self.buffer.length) {
	      self.buffer = self.buffer.slice(0,self.length)
	    }
	  }

	  for (var i = 0; i!=self.indent; ++i) {
	    self.prefix = " "+self.prefix
	  }

	  var pos = 0

	  this.toString = function () {
	    var str = ""
	    
	    if (self.html) { str += "<div class='hexy'>\n"}
	    //split up into line of max `self.width`
	    var line_arr = lines()
	    
	    //lines().forEach(function(hex_raw, i)
	    for (var i = 0; i!= line_arr.length; ++i) {
	      var hex_raw = line_arr[i],
	          hex = hex_raw[0],
	          raw = hex_raw[1]
	      //insert spaces every `self.format.twos` or fours
	      var howMany = hex.length
	      if (self.format === "fours") {
	        howMany = 4
	      } else if (self.format === "twos") {
	        howMany = 2
	      }

	      var hex_formatted = ""


	      for (var j =0; j< hex.length; j+=howMany) {
	        var s = hex.substr(j, howMany)
	        hex_formatted += s + " "
	      } 

	      var addr = (i*self.width)+self.offset+self.display_offset;
	      if (self.html) {
	        odd = i%2 == 0 ? " even" : "  odd"
	        str += "<div class='"+pad(addr, 8)+odd+"'>"
	      }
	      str += self.prefix 

	      if (self.numbering === "hex_bytes") {
	        str += pad(addr, 8) // padding...
	        str += ": "
	      }
	      
	      var padlen = 0
	      switch(self.format) {
	        case "fours":
	          padlen = self.width*2 + self.width/2
	          break
	        case "twos":
	          padlen = self.width*3 + 2
	          break
	        default:
	          padlen = self.width * 2 + 1
	      }

	      str += rpad(hex_formatted, padlen)
	      if (self.annotate === "ascii") {
	        str+=" "
	        var ascii = raw.replace(/[\000-\040\177-\377]/g, ".")
	        if (self.html) {str += escape(ascii)}
	        else { str += ascii }
	      }
	      if (self.html) {
	        str += "</div>\n"
	      } else {
	      str += "\n"
	      } 
	    }
	    if (self.html) { str += "</div>\n"}
	    return str
	  }

	  var lines = function() {
	    var hex_raw = []
	    for (var i = 0; i<self.buffer.length ; i+=self.width) {
	      var begin = i,
	          end   = i+self.width >= self.buffer.length ? self.buffer.length : i+self.width,
	          slice = self.buffer.slice(begin, end),
	          hex   = self.caps === "upper" ? hexu(slice) : hexl(slice),
	          raw   = slice.toString('ascii')

	      hex_raw.push([hex,raw])
	    }
	    return hex_raw

	  }

	  var hexl = function (buffer) {
	    var str = ""
	    for (var i=0; i!=buffer.length; ++i) {
	      if (buffer.constructor == String) {
	        str += pad(buffer.charCodeAt(i), 2)
	      } else {
	        str += pad(buffer[i], 2)
	      }
	    }
	    return str
	  }
	  var hexu = function (buffer) {
	    return hexl(buffer).toUpperCase()
	  }

	  var pad = function(b, len) {
	    var s = b.toString(16)
	    
	    while (s.length < len) {
	      s = "0" + s
	    }
	    return s
	  } 
	  var rpad = function(s, len) {
	    for (var n = len - s.length; n!=0; --n) {
	      if (self.html) {
	        s += "&nbsp;"
	      } else {
	        s += " "
	      }
	    
	    }
	    return s
	  }

	  var escape = function (str) {
	    str = str.split("&").join("&amp;")
	    str = str.split("<").join("&lt;")
	    str = str.split(">").join("&gt;")
	    return str
	  }
	  

	}


	// This is probably not the prettiest or coolest way to to determine runtime
	// environment. It seems to work and Im not up to the task figuring out what
	// the module system du jour is and how to interface with it ...

	// If anyone wants to fix this to include this module "properly", I'm more than
	// happy to incorporate any fixes...

	var _exp
	if (true) {
	  _exp = exports
	} else if (arg === window) {
	  _exp = window
	} else {
	  // who knows?
	  _exp = arg // or this or somethings. ...
	}
	_exp.hexy = hexy
	_exp.Hexy = Hexy

	})(this)

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(3).Buffer))

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer, global) {/*!
	 * The buffer module from node.js, for the browser.
	 *
	 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
	 * @license  MIT
	 */
	/* eslint-disable no-proto */

	'use strict'

	var base64 = __webpack_require__(4)
	var ieee754 = __webpack_require__(5)
	var isArray = __webpack_require__(6)

	exports.Buffer = Buffer
	exports.SlowBuffer = SlowBuffer
	exports.INSPECT_MAX_BYTES = 50
	Buffer.poolSize = 8192 // not used by this implementation

	var rootParent = {}

	/**
	 * If `Buffer.TYPED_ARRAY_SUPPORT`:
	 *   === true    Use Uint8Array implementation (fastest)
	 *   === false   Use Object implementation (most compatible, even IE6)
	 *
	 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
	 * Opera 11.6+, iOS 4.2+.
	 *
	 * Due to various browser bugs, sometimes the Object implementation will be used even
	 * when the browser supports typed arrays.
	 *
	 * Note:
	 *
	 *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
	 *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
	 *
	 *   - Safari 5-7 lacks support for changing the `Object.prototype.constructor` property
	 *     on objects.
	 *
	 *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
	 *
	 *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
	 *     incorrect length in some situations.

	 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
	 * get the Object implementation, which is slower but behaves correctly.
	 */
	Buffer.TYPED_ARRAY_SUPPORT = global.TYPED_ARRAY_SUPPORT !== undefined
	  ? global.TYPED_ARRAY_SUPPORT
	  : typedArraySupport()

	function typedArraySupport () {
	  function Bar () {}
	  try {
	    var arr = new Uint8Array(1)
	    arr.foo = function () { return 42 }
	    arr.constructor = Bar
	    return arr.foo() === 42 && // typed array instances can be augmented
	        arr.constructor === Bar && // constructor can be set
	        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
	        arr.subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
	  } catch (e) {
	    return false
	  }
	}

	function kMaxLength () {
	  return Buffer.TYPED_ARRAY_SUPPORT
	    ? 0x7fffffff
	    : 0x3fffffff
	}

	/**
	 * Class: Buffer
	 * =============
	 *
	 * The Buffer constructor returns instances of `Uint8Array` that are augmented
	 * with function properties for all the node `Buffer` API functions. We use
	 * `Uint8Array` so that square bracket notation works as expected -- it returns
	 * a single octet.
	 *
	 * By augmenting the instances, we can avoid modifying the `Uint8Array`
	 * prototype.
	 */
	function Buffer (arg) {
	  if (!(this instanceof Buffer)) {
	    // Avoid going through an ArgumentsAdaptorTrampoline in the common case.
	    if (arguments.length > 1) return new Buffer(arg, arguments[1])
	    return new Buffer(arg)
	  }

	  if (!Buffer.TYPED_ARRAY_SUPPORT) {
	    this.length = 0
	    this.parent = undefined
	  }

	  // Common case.
	  if (typeof arg === 'number') {
	    return fromNumber(this, arg)
	  }

	  // Slightly less common case.
	  if (typeof arg === 'string') {
	    return fromString(this, arg, arguments.length > 1 ? arguments[1] : 'utf8')
	  }

	  // Unusual.
	  return fromObject(this, arg)
	}

	function fromNumber (that, length) {
	  that = allocate(that, length < 0 ? 0 : checked(length) | 0)
	  if (!Buffer.TYPED_ARRAY_SUPPORT) {
	    for (var i = 0; i < length; i++) {
	      that[i] = 0
	    }
	  }
	  return that
	}

	function fromString (that, string, encoding) {
	  if (typeof encoding !== 'string' || encoding === '') encoding = 'utf8'

	  // Assumption: byteLength() return value is always < kMaxLength.
	  var length = byteLength(string, encoding) | 0
	  that = allocate(that, length)

	  that.write(string, encoding)
	  return that
	}

	function fromObject (that, object) {
	  if (Buffer.isBuffer(object)) return fromBuffer(that, object)

	  if (isArray(object)) return fromArray(that, object)

	  if (object == null) {
	    throw new TypeError('must start with number, buffer, array or string')
	  }

	  if (typeof ArrayBuffer !== 'undefined') {
	    if (object.buffer instanceof ArrayBuffer) {
	      return fromTypedArray(that, object)
	    }
	    if (object instanceof ArrayBuffer) {
	      return fromArrayBuffer(that, object)
	    }
	  }

	  if (object.length) return fromArrayLike(that, object)

	  return fromJsonObject(that, object)
	}

	function fromBuffer (that, buffer) {
	  var length = checked(buffer.length) | 0
	  that = allocate(that, length)
	  buffer.copy(that, 0, 0, length)
	  return that
	}

	function fromArray (that, array) {
	  var length = checked(array.length) | 0
	  that = allocate(that, length)
	  for (var i = 0; i < length; i += 1) {
	    that[i] = array[i] & 255
	  }
	  return that
	}

	// Duplicate of fromArray() to keep fromArray() monomorphic.
	function fromTypedArray (that, array) {
	  var length = checked(array.length) | 0
	  that = allocate(that, length)
	  // Truncating the elements is probably not what people expect from typed
	  // arrays with BYTES_PER_ELEMENT > 1 but it's compatible with the behavior
	  // of the old Buffer constructor.
	  for (var i = 0; i < length; i += 1) {
	    that[i] = array[i] & 255
	  }
	  return that
	}

	function fromArrayBuffer (that, array) {
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    // Return an augmented `Uint8Array` instance, for best performance
	    array.byteLength
	    that = Buffer._augment(new Uint8Array(array))
	  } else {
	    // Fallback: Return an object instance of the Buffer class
	    that = fromTypedArray(that, new Uint8Array(array))
	  }
	  return that
	}

	function fromArrayLike (that, array) {
	  var length = checked(array.length) | 0
	  that = allocate(that, length)
	  for (var i = 0; i < length; i += 1) {
	    that[i] = array[i] & 255
	  }
	  return that
	}

	// Deserialize { type: 'Buffer', data: [1,2,3,...] } into a Buffer object.
	// Returns a zero-length buffer for inputs that don't conform to the spec.
	function fromJsonObject (that, object) {
	  var array
	  var length = 0

	  if (object.type === 'Buffer' && isArray(object.data)) {
	    array = object.data
	    length = checked(array.length) | 0
	  }
	  that = allocate(that, length)

	  for (var i = 0; i < length; i += 1) {
	    that[i] = array[i] & 255
	  }
	  return that
	}

	if (Buffer.TYPED_ARRAY_SUPPORT) {
	  Buffer.prototype.__proto__ = Uint8Array.prototype
	  Buffer.__proto__ = Uint8Array
	} else {
	  // pre-set for values that may exist in the future
	  Buffer.prototype.length = undefined
	  Buffer.prototype.parent = undefined
	}

	function allocate (that, length) {
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    // Return an augmented `Uint8Array` instance, for best performance
	    that = Buffer._augment(new Uint8Array(length))
	    that.__proto__ = Buffer.prototype
	  } else {
	    // Fallback: Return an object instance of the Buffer class
	    that.length = length
	    that._isBuffer = true
	  }

	  var fromPool = length !== 0 && length <= Buffer.poolSize >>> 1
	  if (fromPool) that.parent = rootParent

	  return that
	}

	function checked (length) {
	  // Note: cannot use `length < kMaxLength` here because that fails when
	  // length is NaN (which is otherwise coerced to zero.)
	  if (length >= kMaxLength()) {
	    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
	                         'size: 0x' + kMaxLength().toString(16) + ' bytes')
	  }
	  return length | 0
	}

	function SlowBuffer (subject, encoding) {
	  if (!(this instanceof SlowBuffer)) return new SlowBuffer(subject, encoding)

	  var buf = new Buffer(subject, encoding)
	  delete buf.parent
	  return buf
	}

	Buffer.isBuffer = function isBuffer (b) {
	  return !!(b != null && b._isBuffer)
	}

	Buffer.compare = function compare (a, b) {
	  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
	    throw new TypeError('Arguments must be Buffers')
	  }

	  if (a === b) return 0

	  var x = a.length
	  var y = b.length

	  var i = 0
	  var len = Math.min(x, y)
	  while (i < len) {
	    if (a[i] !== b[i]) break

	    ++i
	  }

	  if (i !== len) {
	    x = a[i]
	    y = b[i]
	  }

	  if (x < y) return -1
	  if (y < x) return 1
	  return 0
	}

	Buffer.isEncoding = function isEncoding (encoding) {
	  switch (String(encoding).toLowerCase()) {
	    case 'hex':
	    case 'utf8':
	    case 'utf-8':
	    case 'ascii':
	    case 'binary':
	    case 'base64':
	    case 'raw':
	    case 'ucs2':
	    case 'ucs-2':
	    case 'utf16le':
	    case 'utf-16le':
	      return true
	    default:
	      return false
	  }
	}

	Buffer.concat = function concat (list, length) {
	  if (!isArray(list)) throw new TypeError('list argument must be an Array of Buffers.')

	  if (list.length === 0) {
	    return new Buffer(0)
	  }

	  var i
	  if (length === undefined) {
	    length = 0
	    for (i = 0; i < list.length; i++) {
	      length += list[i].length
	    }
	  }

	  var buf = new Buffer(length)
	  var pos = 0
	  for (i = 0; i < list.length; i++) {
	    var item = list[i]
	    item.copy(buf, pos)
	    pos += item.length
	  }
	  return buf
	}

	function byteLength (string, encoding) {
	  if (typeof string !== 'string') string = '' + string

	  var len = string.length
	  if (len === 0) return 0

	  // Use a for loop to avoid recursion
	  var loweredCase = false
	  for (;;) {
	    switch (encoding) {
	      case 'ascii':
	      case 'binary':
	      // Deprecated
	      case 'raw':
	      case 'raws':
	        return len
	      case 'utf8':
	      case 'utf-8':
	        return utf8ToBytes(string).length
	      case 'ucs2':
	      case 'ucs-2':
	      case 'utf16le':
	      case 'utf-16le':
	        return len * 2
	      case 'hex':
	        return len >>> 1
	      case 'base64':
	        return base64ToBytes(string).length
	      default:
	        if (loweredCase) return utf8ToBytes(string).length // assume utf8
	        encoding = ('' + encoding).toLowerCase()
	        loweredCase = true
	    }
	  }
	}
	Buffer.byteLength = byteLength

	function slowToString (encoding, start, end) {
	  var loweredCase = false

	  start = start | 0
	  end = end === undefined || end === Infinity ? this.length : end | 0

	  if (!encoding) encoding = 'utf8'
	  if (start < 0) start = 0
	  if (end > this.length) end = this.length
	  if (end <= start) return ''

	  while (true) {
	    switch (encoding) {
	      case 'hex':
	        return hexSlice(this, start, end)

	      case 'utf8':
	      case 'utf-8':
	        return utf8Slice(this, start, end)

	      case 'ascii':
	        return asciiSlice(this, start, end)

	      case 'binary':
	        return binarySlice(this, start, end)

	      case 'base64':
	        return base64Slice(this, start, end)

	      case 'ucs2':
	      case 'ucs-2':
	      case 'utf16le':
	      case 'utf-16le':
	        return utf16leSlice(this, start, end)

	      default:
	        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
	        encoding = (encoding + '').toLowerCase()
	        loweredCase = true
	    }
	  }
	}

	Buffer.prototype.toString = function toString () {
	  var length = this.length | 0
	  if (length === 0) return ''
	  if (arguments.length === 0) return utf8Slice(this, 0, length)
	  return slowToString.apply(this, arguments)
	}

	Buffer.prototype.equals = function equals (b) {
	  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
	  if (this === b) return true
	  return Buffer.compare(this, b) === 0
	}

	Buffer.prototype.inspect = function inspect () {
	  var str = ''
	  var max = exports.INSPECT_MAX_BYTES
	  if (this.length > 0) {
	    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
	    if (this.length > max) str += ' ... '
	  }
	  return '<Buffer ' + str + '>'
	}

	Buffer.prototype.compare = function compare (b) {
	  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
	  if (this === b) return 0
	  return Buffer.compare(this, b)
	}

	Buffer.prototype.indexOf = function indexOf (val, byteOffset) {
	  if (byteOffset > 0x7fffffff) byteOffset = 0x7fffffff
	  else if (byteOffset < -0x80000000) byteOffset = -0x80000000
	  byteOffset >>= 0

	  if (this.length === 0) return -1
	  if (byteOffset >= this.length) return -1

	  // Negative offsets start from the end of the buffer
	  if (byteOffset < 0) byteOffset = Math.max(this.length + byteOffset, 0)

	  if (typeof val === 'string') {
	    if (val.length === 0) return -1 // special case: looking for empty string always fails
	    return String.prototype.indexOf.call(this, val, byteOffset)
	  }
	  if (Buffer.isBuffer(val)) {
	    return arrayIndexOf(this, val, byteOffset)
	  }
	  if (typeof val === 'number') {
	    if (Buffer.TYPED_ARRAY_SUPPORT && Uint8Array.prototype.indexOf === 'function') {
	      return Uint8Array.prototype.indexOf.call(this, val, byteOffset)
	    }
	    return arrayIndexOf(this, [ val ], byteOffset)
	  }

	  function arrayIndexOf (arr, val, byteOffset) {
	    var foundIndex = -1
	    for (var i = 0; byteOffset + i < arr.length; i++) {
	      if (arr[byteOffset + i] === val[foundIndex === -1 ? 0 : i - foundIndex]) {
	        if (foundIndex === -1) foundIndex = i
	        if (i - foundIndex + 1 === val.length) return byteOffset + foundIndex
	      } else {
	        foundIndex = -1
	      }
	    }
	    return -1
	  }

	  throw new TypeError('val must be string, number or Buffer')
	}

	// `get` is deprecated
	Buffer.prototype.get = function get (offset) {
	  console.log('.get() is deprecated. Access using array indexes instead.')
	  return this.readUInt8(offset)
	}

	// `set` is deprecated
	Buffer.prototype.set = function set (v, offset) {
	  console.log('.set() is deprecated. Access using array indexes instead.')
	  return this.writeUInt8(v, offset)
	}

	function hexWrite (buf, string, offset, length) {
	  offset = Number(offset) || 0
	  var remaining = buf.length - offset
	  if (!length) {
	    length = remaining
	  } else {
	    length = Number(length)
	    if (length > remaining) {
	      length = remaining
	    }
	  }

	  // must be an even number of digits
	  var strLen = string.length
	  if (strLen % 2 !== 0) throw new Error('Invalid hex string')

	  if (length > strLen / 2) {
	    length = strLen / 2
	  }
	  for (var i = 0; i < length; i++) {
	    var parsed = parseInt(string.substr(i * 2, 2), 16)
	    if (isNaN(parsed)) throw new Error('Invalid hex string')
	    buf[offset + i] = parsed
	  }
	  return i
	}

	function utf8Write (buf, string, offset, length) {
	  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
	}

	function asciiWrite (buf, string, offset, length) {
	  return blitBuffer(asciiToBytes(string), buf, offset, length)
	}

	function binaryWrite (buf, string, offset, length) {
	  return asciiWrite(buf, string, offset, length)
	}

	function base64Write (buf, string, offset, length) {
	  return blitBuffer(base64ToBytes(string), buf, offset, length)
	}

	function ucs2Write (buf, string, offset, length) {
	  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
	}

	Buffer.prototype.write = function write (string, offset, length, encoding) {
	  // Buffer#write(string)
	  if (offset === undefined) {
	    encoding = 'utf8'
	    length = this.length
	    offset = 0
	  // Buffer#write(string, encoding)
	  } else if (length === undefined && typeof offset === 'string') {
	    encoding = offset
	    length = this.length
	    offset = 0
	  // Buffer#write(string, offset[, length][, encoding])
	  } else if (isFinite(offset)) {
	    offset = offset | 0
	    if (isFinite(length)) {
	      length = length | 0
	      if (encoding === undefined) encoding = 'utf8'
	    } else {
	      encoding = length
	      length = undefined
	    }
	  // legacy write(string, encoding, offset, length) - remove in v0.13
	  } else {
	    var swap = encoding
	    encoding = offset
	    offset = length | 0
	    length = swap
	  }

	  var remaining = this.length - offset
	  if (length === undefined || length > remaining) length = remaining

	  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
	    throw new RangeError('attempt to write outside buffer bounds')
	  }

	  if (!encoding) encoding = 'utf8'

	  var loweredCase = false
	  for (;;) {
	    switch (encoding) {
	      case 'hex':
	        return hexWrite(this, string, offset, length)

	      case 'utf8':
	      case 'utf-8':
	        return utf8Write(this, string, offset, length)

	      case 'ascii':
	        return asciiWrite(this, string, offset, length)

	      case 'binary':
	        return binaryWrite(this, string, offset, length)

	      case 'base64':
	        // Warning: maxLength not taken into account in base64Write
	        return base64Write(this, string, offset, length)

	      case 'ucs2':
	      case 'ucs-2':
	      case 'utf16le':
	      case 'utf-16le':
	        return ucs2Write(this, string, offset, length)

	      default:
	        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
	        encoding = ('' + encoding).toLowerCase()
	        loweredCase = true
	    }
	  }
	}

	Buffer.prototype.toJSON = function toJSON () {
	  return {
	    type: 'Buffer',
	    data: Array.prototype.slice.call(this._arr || this, 0)
	  }
	}

	function base64Slice (buf, start, end) {
	  if (start === 0 && end === buf.length) {
	    return base64.fromByteArray(buf)
	  } else {
	    return base64.fromByteArray(buf.slice(start, end))
	  }
	}

	function utf8Slice (buf, start, end) {
	  end = Math.min(buf.length, end)
	  var res = []

	  var i = start
	  while (i < end) {
	    var firstByte = buf[i]
	    var codePoint = null
	    var bytesPerSequence = (firstByte > 0xEF) ? 4
	      : (firstByte > 0xDF) ? 3
	      : (firstByte > 0xBF) ? 2
	      : 1

	    if (i + bytesPerSequence <= end) {
	      var secondByte, thirdByte, fourthByte, tempCodePoint

	      switch (bytesPerSequence) {
	        case 1:
	          if (firstByte < 0x80) {
	            codePoint = firstByte
	          }
	          break
	        case 2:
	          secondByte = buf[i + 1]
	          if ((secondByte & 0xC0) === 0x80) {
	            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
	            if (tempCodePoint > 0x7F) {
	              codePoint = tempCodePoint
	            }
	          }
	          break
	        case 3:
	          secondByte = buf[i + 1]
	          thirdByte = buf[i + 2]
	          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
	            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
	            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
	              codePoint = tempCodePoint
	            }
	          }
	          break
	        case 4:
	          secondByte = buf[i + 1]
	          thirdByte = buf[i + 2]
	          fourthByte = buf[i + 3]
	          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
	            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
	            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
	              codePoint = tempCodePoint
	            }
	          }
	      }
	    }

	    if (codePoint === null) {
	      // we did not generate a valid codePoint so insert a
	      // replacement char (U+FFFD) and advance only 1 byte
	      codePoint = 0xFFFD
	      bytesPerSequence = 1
	    } else if (codePoint > 0xFFFF) {
	      // encode to utf16 (surrogate pair dance)
	      codePoint -= 0x10000
	      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
	      codePoint = 0xDC00 | codePoint & 0x3FF
	    }

	    res.push(codePoint)
	    i += bytesPerSequence
	  }

	  return decodeCodePointsArray(res)
	}

	// Based on http://stackoverflow.com/a/22747272/680742, the browser with
	// the lowest limit is Chrome, with 0x10000 args.
	// We go 1 magnitude less, for safety
	var MAX_ARGUMENTS_LENGTH = 0x1000

	function decodeCodePointsArray (codePoints) {
	  var len = codePoints.length
	  if (len <= MAX_ARGUMENTS_LENGTH) {
	    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
	  }

	  // Decode in chunks to avoid "call stack size exceeded".
	  var res = ''
	  var i = 0
	  while (i < len) {
	    res += String.fromCharCode.apply(
	      String,
	      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
	    )
	  }
	  return res
	}

	function asciiSlice (buf, start, end) {
	  var ret = ''
	  end = Math.min(buf.length, end)

	  for (var i = start; i < end; i++) {
	    ret += String.fromCharCode(buf[i] & 0x7F)
	  }
	  return ret
	}

	function binarySlice (buf, start, end) {
	  var ret = ''
	  end = Math.min(buf.length, end)

	  for (var i = start; i < end; i++) {
	    ret += String.fromCharCode(buf[i])
	  }
	  return ret
	}

	function hexSlice (buf, start, end) {
	  var len = buf.length

	  if (!start || start < 0) start = 0
	  if (!end || end < 0 || end > len) end = len

	  var out = ''
	  for (var i = start; i < end; i++) {
	    out += toHex(buf[i])
	  }
	  return out
	}

	function utf16leSlice (buf, start, end) {
	  var bytes = buf.slice(start, end)
	  var res = ''
	  for (var i = 0; i < bytes.length; i += 2) {
	    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
	  }
	  return res
	}

	Buffer.prototype.slice = function slice (start, end) {
	  var len = this.length
	  start = ~~start
	  end = end === undefined ? len : ~~end

	  if (start < 0) {
	    start += len
	    if (start < 0) start = 0
	  } else if (start > len) {
	    start = len
	  }

	  if (end < 0) {
	    end += len
	    if (end < 0) end = 0
	  } else if (end > len) {
	    end = len
	  }

	  if (end < start) end = start

	  var newBuf
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    newBuf = Buffer._augment(this.subarray(start, end))
	  } else {
	    var sliceLen = end - start
	    newBuf = new Buffer(sliceLen, undefined)
	    for (var i = 0; i < sliceLen; i++) {
	      newBuf[i] = this[i + start]
	    }
	  }

	  if (newBuf.length) newBuf.parent = this.parent || this

	  return newBuf
	}

	/*
	 * Need to make sure that buffer isn't trying to write out of bounds.
	 */
	function checkOffset (offset, ext, length) {
	  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
	  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
	}

	Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
	  offset = offset | 0
	  byteLength = byteLength | 0
	  if (!noAssert) checkOffset(offset, byteLength, this.length)

	  var val = this[offset]
	  var mul = 1
	  var i = 0
	  while (++i < byteLength && (mul *= 0x100)) {
	    val += this[offset + i] * mul
	  }

	  return val
	}

	Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
	  offset = offset | 0
	  byteLength = byteLength | 0
	  if (!noAssert) {
	    checkOffset(offset, byteLength, this.length)
	  }

	  var val = this[offset + --byteLength]
	  var mul = 1
	  while (byteLength > 0 && (mul *= 0x100)) {
	    val += this[offset + --byteLength] * mul
	  }

	  return val
	}

	Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 1, this.length)
	  return this[offset]
	}

	Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 2, this.length)
	  return this[offset] | (this[offset + 1] << 8)
	}

	Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 2, this.length)
	  return (this[offset] << 8) | this[offset + 1]
	}

	Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length)

	  return ((this[offset]) |
	      (this[offset + 1] << 8) |
	      (this[offset + 2] << 16)) +
	      (this[offset + 3] * 0x1000000)
	}

	Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length)

	  return (this[offset] * 0x1000000) +
	    ((this[offset + 1] << 16) |
	    (this[offset + 2] << 8) |
	    this[offset + 3])
	}

	Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
	  offset = offset | 0
	  byteLength = byteLength | 0
	  if (!noAssert) checkOffset(offset, byteLength, this.length)

	  var val = this[offset]
	  var mul = 1
	  var i = 0
	  while (++i < byteLength && (mul *= 0x100)) {
	    val += this[offset + i] * mul
	  }
	  mul *= 0x80

	  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

	  return val
	}

	Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
	  offset = offset | 0
	  byteLength = byteLength | 0
	  if (!noAssert) checkOffset(offset, byteLength, this.length)

	  var i = byteLength
	  var mul = 1
	  var val = this[offset + --i]
	  while (i > 0 && (mul *= 0x100)) {
	    val += this[offset + --i] * mul
	  }
	  mul *= 0x80

	  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

	  return val
	}

	Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 1, this.length)
	  if (!(this[offset] & 0x80)) return (this[offset])
	  return ((0xff - this[offset] + 1) * -1)
	}

	Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 2, this.length)
	  var val = this[offset] | (this[offset + 1] << 8)
	  return (val & 0x8000) ? val | 0xFFFF0000 : val
	}

	Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 2, this.length)
	  var val = this[offset + 1] | (this[offset] << 8)
	  return (val & 0x8000) ? val | 0xFFFF0000 : val
	}

	Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length)

	  return (this[offset]) |
	    (this[offset + 1] << 8) |
	    (this[offset + 2] << 16) |
	    (this[offset + 3] << 24)
	}

	Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length)

	  return (this[offset] << 24) |
	    (this[offset + 1] << 16) |
	    (this[offset + 2] << 8) |
	    (this[offset + 3])
	}

	Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length)
	  return ieee754.read(this, offset, true, 23, 4)
	}

	Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length)
	  return ieee754.read(this, offset, false, 23, 4)
	}

	Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 8, this.length)
	  return ieee754.read(this, offset, true, 52, 8)
	}

	Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 8, this.length)
	  return ieee754.read(this, offset, false, 52, 8)
	}

	function checkInt (buf, value, offset, ext, max, min) {
	  if (!Buffer.isBuffer(buf)) throw new TypeError('buffer must be a Buffer instance')
	  if (value > max || value < min) throw new RangeError('value is out of bounds')
	  if (offset + ext > buf.length) throw new RangeError('index out of range')
	}

	Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
	  value = +value
	  offset = offset | 0
	  byteLength = byteLength | 0
	  if (!noAssert) checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)

	  var mul = 1
	  var i = 0
	  this[offset] = value & 0xFF
	  while (++i < byteLength && (mul *= 0x100)) {
	    this[offset + i] = (value / mul) & 0xFF
	  }

	  return offset + byteLength
	}

	Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
	  value = +value
	  offset = offset | 0
	  byteLength = byteLength | 0
	  if (!noAssert) checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)

	  var i = byteLength - 1
	  var mul = 1
	  this[offset + i] = value & 0xFF
	  while (--i >= 0 && (mul *= 0x100)) {
	    this[offset + i] = (value / mul) & 0xFF
	  }

	  return offset + byteLength
	}

	Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
	  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
	  this[offset] = (value & 0xff)
	  return offset + 1
	}

	function objectWriteUInt16 (buf, value, offset, littleEndian) {
	  if (value < 0) value = 0xffff + value + 1
	  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; i++) {
	    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
	      (littleEndian ? i : 1 - i) * 8
	  }
	}

	Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value & 0xff)
	    this[offset + 1] = (value >>> 8)
	  } else {
	    objectWriteUInt16(this, value, offset, true)
	  }
	  return offset + 2
	}

	Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value >>> 8)
	    this[offset + 1] = (value & 0xff)
	  } else {
	    objectWriteUInt16(this, value, offset, false)
	  }
	  return offset + 2
	}

	function objectWriteUInt32 (buf, value, offset, littleEndian) {
	  if (value < 0) value = 0xffffffff + value + 1
	  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; i++) {
	    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
	  }
	}

	Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset + 3] = (value >>> 24)
	    this[offset + 2] = (value >>> 16)
	    this[offset + 1] = (value >>> 8)
	    this[offset] = (value & 0xff)
	  } else {
	    objectWriteUInt32(this, value, offset, true)
	  }
	  return offset + 4
	}

	Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value >>> 24)
	    this[offset + 1] = (value >>> 16)
	    this[offset + 2] = (value >>> 8)
	    this[offset + 3] = (value & 0xff)
	  } else {
	    objectWriteUInt32(this, value, offset, false)
	  }
	  return offset + 4
	}

	Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) {
	    var limit = Math.pow(2, 8 * byteLength - 1)

	    checkInt(this, value, offset, byteLength, limit - 1, -limit)
	  }

	  var i = 0
	  var mul = 1
	  var sub = value < 0 ? 1 : 0
	  this[offset] = value & 0xFF
	  while (++i < byteLength && (mul *= 0x100)) {
	    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
	  }

	  return offset + byteLength
	}

	Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) {
	    var limit = Math.pow(2, 8 * byteLength - 1)

	    checkInt(this, value, offset, byteLength, limit - 1, -limit)
	  }

	  var i = byteLength - 1
	  var mul = 1
	  var sub = value < 0 ? 1 : 0
	  this[offset + i] = value & 0xFF
	  while (--i >= 0 && (mul *= 0x100)) {
	    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
	  }

	  return offset + byteLength
	}

	Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
	  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
	  if (value < 0) value = 0xff + value + 1
	  this[offset] = (value & 0xff)
	  return offset + 1
	}

	Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value & 0xff)
	    this[offset + 1] = (value >>> 8)
	  } else {
	    objectWriteUInt16(this, value, offset, true)
	  }
	  return offset + 2
	}

	Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value >>> 8)
	    this[offset + 1] = (value & 0xff)
	  } else {
	    objectWriteUInt16(this, value, offset, false)
	  }
	  return offset + 2
	}

	Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value & 0xff)
	    this[offset + 1] = (value >>> 8)
	    this[offset + 2] = (value >>> 16)
	    this[offset + 3] = (value >>> 24)
	  } else {
	    objectWriteUInt32(this, value, offset, true)
	  }
	  return offset + 4
	}

	Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
	  if (value < 0) value = 0xffffffff + value + 1
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value >>> 24)
	    this[offset + 1] = (value >>> 16)
	    this[offset + 2] = (value >>> 8)
	    this[offset + 3] = (value & 0xff)
	  } else {
	    objectWriteUInt32(this, value, offset, false)
	  }
	  return offset + 4
	}

	function checkIEEE754 (buf, value, offset, ext, max, min) {
	  if (value > max || value < min) throw new RangeError('value is out of bounds')
	  if (offset + ext > buf.length) throw new RangeError('index out of range')
	  if (offset < 0) throw new RangeError('index out of range')
	}

	function writeFloat (buf, value, offset, littleEndian, noAssert) {
	  if (!noAssert) {
	    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
	  }
	  ieee754.write(buf, value, offset, littleEndian, 23, 4)
	  return offset + 4
	}

	Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
	  return writeFloat(this, value, offset, true, noAssert)
	}

	Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
	  return writeFloat(this, value, offset, false, noAssert)
	}

	function writeDouble (buf, value, offset, littleEndian, noAssert) {
	  if (!noAssert) {
	    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
	  }
	  ieee754.write(buf, value, offset, littleEndian, 52, 8)
	  return offset + 8
	}

	Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
	  return writeDouble(this, value, offset, true, noAssert)
	}

	Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
	  return writeDouble(this, value, offset, false, noAssert)
	}

	// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
	Buffer.prototype.copy = function copy (target, targetStart, start, end) {
	  if (!start) start = 0
	  if (!end && end !== 0) end = this.length
	  if (targetStart >= target.length) targetStart = target.length
	  if (!targetStart) targetStart = 0
	  if (end > 0 && end < start) end = start

	  // Copy 0 bytes; we're done
	  if (end === start) return 0
	  if (target.length === 0 || this.length === 0) return 0

	  // Fatal error conditions
	  if (targetStart < 0) {
	    throw new RangeError('targetStart out of bounds')
	  }
	  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
	  if (end < 0) throw new RangeError('sourceEnd out of bounds')

	  // Are we oob?
	  if (end > this.length) end = this.length
	  if (target.length - targetStart < end - start) {
	    end = target.length - targetStart + start
	  }

	  var len = end - start
	  var i

	  if (this === target && start < targetStart && targetStart < end) {
	    // descending copy from end
	    for (i = len - 1; i >= 0; i--) {
	      target[i + targetStart] = this[i + start]
	    }
	  } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
	    // ascending copy from start
	    for (i = 0; i < len; i++) {
	      target[i + targetStart] = this[i + start]
	    }
	  } else {
	    target._set(this.subarray(start, start + len), targetStart)
	  }

	  return len
	}

	// fill(value, start=0, end=buffer.length)
	Buffer.prototype.fill = function fill (value, start, end) {
	  if (!value) value = 0
	  if (!start) start = 0
	  if (!end) end = this.length

	  if (end < start) throw new RangeError('end < start')

	  // Fill 0 bytes; we're done
	  if (end === start) return
	  if (this.length === 0) return

	  if (start < 0 || start >= this.length) throw new RangeError('start out of bounds')
	  if (end < 0 || end > this.length) throw new RangeError('end out of bounds')

	  var i
	  if (typeof value === 'number') {
	    for (i = start; i < end; i++) {
	      this[i] = value
	    }
	  } else {
	    var bytes = utf8ToBytes(value.toString())
	    var len = bytes.length
	    for (i = start; i < end; i++) {
	      this[i] = bytes[i % len]
	    }
	  }

	  return this
	}

	/**
	 * Creates a new `ArrayBuffer` with the *copied* memory of the buffer instance.
	 * Added in Node 0.12. Only available in browsers that support ArrayBuffer.
	 */
	Buffer.prototype.toArrayBuffer = function toArrayBuffer () {
	  if (typeof Uint8Array !== 'undefined') {
	    if (Buffer.TYPED_ARRAY_SUPPORT) {
	      return (new Buffer(this)).buffer
	    } else {
	      var buf = new Uint8Array(this.length)
	      for (var i = 0, len = buf.length; i < len; i += 1) {
	        buf[i] = this[i]
	      }
	      return buf.buffer
	    }
	  } else {
	    throw new TypeError('Buffer.toArrayBuffer not supported in this browser')
	  }
	}

	// HELPER FUNCTIONS
	// ================

	var BP = Buffer.prototype

	/**
	 * Augment a Uint8Array *instance* (not the Uint8Array class!) with Buffer methods
	 */
	Buffer._augment = function _augment (arr) {
	  arr.constructor = Buffer
	  arr._isBuffer = true

	  // save reference to original Uint8Array set method before overwriting
	  arr._set = arr.set

	  // deprecated
	  arr.get = BP.get
	  arr.set = BP.set

	  arr.write = BP.write
	  arr.toString = BP.toString
	  arr.toLocaleString = BP.toString
	  arr.toJSON = BP.toJSON
	  arr.equals = BP.equals
	  arr.compare = BP.compare
	  arr.indexOf = BP.indexOf
	  arr.copy = BP.copy
	  arr.slice = BP.slice
	  arr.readUIntLE = BP.readUIntLE
	  arr.readUIntBE = BP.readUIntBE
	  arr.readUInt8 = BP.readUInt8
	  arr.readUInt16LE = BP.readUInt16LE
	  arr.readUInt16BE = BP.readUInt16BE
	  arr.readUInt32LE = BP.readUInt32LE
	  arr.readUInt32BE = BP.readUInt32BE
	  arr.readIntLE = BP.readIntLE
	  arr.readIntBE = BP.readIntBE
	  arr.readInt8 = BP.readInt8
	  arr.readInt16LE = BP.readInt16LE
	  arr.readInt16BE = BP.readInt16BE
	  arr.readInt32LE = BP.readInt32LE
	  arr.readInt32BE = BP.readInt32BE
	  arr.readFloatLE = BP.readFloatLE
	  arr.readFloatBE = BP.readFloatBE
	  arr.readDoubleLE = BP.readDoubleLE
	  arr.readDoubleBE = BP.readDoubleBE
	  arr.writeUInt8 = BP.writeUInt8
	  arr.writeUIntLE = BP.writeUIntLE
	  arr.writeUIntBE = BP.writeUIntBE
	  arr.writeUInt16LE = BP.writeUInt16LE
	  arr.writeUInt16BE = BP.writeUInt16BE
	  arr.writeUInt32LE = BP.writeUInt32LE
	  arr.writeUInt32BE = BP.writeUInt32BE
	  arr.writeIntLE = BP.writeIntLE
	  arr.writeIntBE = BP.writeIntBE
	  arr.writeInt8 = BP.writeInt8
	  arr.writeInt16LE = BP.writeInt16LE
	  arr.writeInt16BE = BP.writeInt16BE
	  arr.writeInt32LE = BP.writeInt32LE
	  arr.writeInt32BE = BP.writeInt32BE
	  arr.writeFloatLE = BP.writeFloatLE
	  arr.writeFloatBE = BP.writeFloatBE
	  arr.writeDoubleLE = BP.writeDoubleLE
	  arr.writeDoubleBE = BP.writeDoubleBE
	  arr.fill = BP.fill
	  arr.inspect = BP.inspect
	  arr.toArrayBuffer = BP.toArrayBuffer

	  return arr
	}

	var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g

	function base64clean (str) {
	  // Node strips out invalid characters like \n and \t from the string, base64-js does not
	  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
	  // Node converts strings with length < 2 to ''
	  if (str.length < 2) return ''
	  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
	  while (str.length % 4 !== 0) {
	    str = str + '='
	  }
	  return str
	}

	function stringtrim (str) {
	  if (str.trim) return str.trim()
	  return str.replace(/^\s+|\s+$/g, '')
	}

	function toHex (n) {
	  if (n < 16) return '0' + n.toString(16)
	  return n.toString(16)
	}

	function utf8ToBytes (string, units) {
	  units = units || Infinity
	  var codePoint
	  var length = string.length
	  var leadSurrogate = null
	  var bytes = []

	  for (var i = 0; i < length; i++) {
	    codePoint = string.charCodeAt(i)

	    // is surrogate component
	    if (codePoint > 0xD7FF && codePoint < 0xE000) {
	      // last char was a lead
	      if (!leadSurrogate) {
	        // no lead yet
	        if (codePoint > 0xDBFF) {
	          // unexpected trail
	          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
	          continue
	        } else if (i + 1 === length) {
	          // unpaired lead
	          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
	          continue
	        }

	        // valid lead
	        leadSurrogate = codePoint

	        continue
	      }

	      // 2 leads in a row
	      if (codePoint < 0xDC00) {
	        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
	        leadSurrogate = codePoint
	        continue
	      }

	      // valid surrogate pair
	      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
	    } else if (leadSurrogate) {
	      // valid bmp char, but last char was a lead
	      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
	    }

	    leadSurrogate = null

	    // encode utf8
	    if (codePoint < 0x80) {
	      if ((units -= 1) < 0) break
	      bytes.push(codePoint)
	    } else if (codePoint < 0x800) {
	      if ((units -= 2) < 0) break
	      bytes.push(
	        codePoint >> 0x6 | 0xC0,
	        codePoint & 0x3F | 0x80
	      )
	    } else if (codePoint < 0x10000) {
	      if ((units -= 3) < 0) break
	      bytes.push(
	        codePoint >> 0xC | 0xE0,
	        codePoint >> 0x6 & 0x3F | 0x80,
	        codePoint & 0x3F | 0x80
	      )
	    } else if (codePoint < 0x110000) {
	      if ((units -= 4) < 0) break
	      bytes.push(
	        codePoint >> 0x12 | 0xF0,
	        codePoint >> 0xC & 0x3F | 0x80,
	        codePoint >> 0x6 & 0x3F | 0x80,
	        codePoint & 0x3F | 0x80
	      )
	    } else {
	      throw new Error('Invalid code point')
	    }
	  }

	  return bytes
	}

	function asciiToBytes (str) {
	  var byteArray = []
	  for (var i = 0; i < str.length; i++) {
	    // Node's code seems to be doing this and not & 0x7F..
	    byteArray.push(str.charCodeAt(i) & 0xFF)
	  }
	  return byteArray
	}

	function utf16leToBytes (str, units) {
	  var c, hi, lo
	  var byteArray = []
	  for (var i = 0; i < str.length; i++) {
	    if ((units -= 2) < 0) break

	    c = str.charCodeAt(i)
	    hi = c >> 8
	    lo = c % 256
	    byteArray.push(lo)
	    byteArray.push(hi)
	  }

	  return byteArray
	}

	function base64ToBytes (str) {
	  return base64.toByteArray(base64clean(str))
	}

	function blitBuffer (src, dst, offset, length) {
	  for (var i = 0; i < length; i++) {
	    if ((i + offset >= dst.length) || (i >= src.length)) break
	    dst[i + offset] = src[i]
	  }
	  return i
	}

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(3).Buffer, (function() { return this; }())))

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

	;(function (exports) {
		'use strict';

	  var Arr = (typeof Uint8Array !== 'undefined')
	    ? Uint8Array
	    : Array

		var PLUS   = '+'.charCodeAt(0)
		var SLASH  = '/'.charCodeAt(0)
		var NUMBER = '0'.charCodeAt(0)
		var LOWER  = 'a'.charCodeAt(0)
		var UPPER  = 'A'.charCodeAt(0)
		var PLUS_URL_SAFE = '-'.charCodeAt(0)
		var SLASH_URL_SAFE = '_'.charCodeAt(0)

		function decode (elt) {
			var code = elt.charCodeAt(0)
			if (code === PLUS ||
			    code === PLUS_URL_SAFE)
				return 62 // '+'
			if (code === SLASH ||
			    code === SLASH_URL_SAFE)
				return 63 // '/'
			if (code < NUMBER)
				return -1 //no match
			if (code < NUMBER + 10)
				return code - NUMBER + 26 + 26
			if (code < UPPER + 26)
				return code - UPPER
			if (code < LOWER + 26)
				return code - LOWER + 26
		}

		function b64ToByteArray (b64) {
			var i, j, l, tmp, placeHolders, arr

			if (b64.length % 4 > 0) {
				throw new Error('Invalid string. Length must be a multiple of 4')
			}

			// the number of equal signs (place holders)
			// if there are two placeholders, than the two characters before it
			// represent one byte
			// if there is only one, then the three characters before it represent 2 bytes
			// this is just a cheap hack to not do indexOf twice
			var len = b64.length
			placeHolders = '=' === b64.charAt(len - 2) ? 2 : '=' === b64.charAt(len - 1) ? 1 : 0

			// base64 is 4/3 + up to two characters of the original data
			arr = new Arr(b64.length * 3 / 4 - placeHolders)

			// if there are placeholders, only get up to the last complete 4 chars
			l = placeHolders > 0 ? b64.length - 4 : b64.length

			var L = 0

			function push (v) {
				arr[L++] = v
			}

			for (i = 0, j = 0; i < l; i += 4, j += 3) {
				tmp = (decode(b64.charAt(i)) << 18) | (decode(b64.charAt(i + 1)) << 12) | (decode(b64.charAt(i + 2)) << 6) | decode(b64.charAt(i + 3))
				push((tmp & 0xFF0000) >> 16)
				push((tmp & 0xFF00) >> 8)
				push(tmp & 0xFF)
			}

			if (placeHolders === 2) {
				tmp = (decode(b64.charAt(i)) << 2) | (decode(b64.charAt(i + 1)) >> 4)
				push(tmp & 0xFF)
			} else if (placeHolders === 1) {
				tmp = (decode(b64.charAt(i)) << 10) | (decode(b64.charAt(i + 1)) << 4) | (decode(b64.charAt(i + 2)) >> 2)
				push((tmp >> 8) & 0xFF)
				push(tmp & 0xFF)
			}

			return arr
		}

		function uint8ToBase64 (uint8) {
			var i,
				extraBytes = uint8.length % 3, // if we have 1 byte left, pad 2 bytes
				output = "",
				temp, length

			function encode (num) {
				return lookup.charAt(num)
			}

			function tripletToBase64 (num) {
				return encode(num >> 18 & 0x3F) + encode(num >> 12 & 0x3F) + encode(num >> 6 & 0x3F) + encode(num & 0x3F)
			}

			// go through the array every three bytes, we'll deal with trailing stuff later
			for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
				temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
				output += tripletToBase64(temp)
			}

			// pad the end with zeros, but make sure to not forget the extra bytes
			switch (extraBytes) {
				case 1:
					temp = uint8[uint8.length - 1]
					output += encode(temp >> 2)
					output += encode((temp << 4) & 0x3F)
					output += '=='
					break
				case 2:
					temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1])
					output += encode(temp >> 10)
					output += encode((temp >> 4) & 0x3F)
					output += encode((temp << 2) & 0x3F)
					output += '='
					break
			}

			return output
		}

		exports.toByteArray = b64ToByteArray
		exports.fromByteArray = uint8ToBase64
	}( false ? (this.base64js = {}) : exports))


/***/ },
/* 5 */
/***/ function(module, exports) {

	exports.read = function (buffer, offset, isLE, mLen, nBytes) {
	  var e, m
	  var eLen = nBytes * 8 - mLen - 1
	  var eMax = (1 << eLen) - 1
	  var eBias = eMax >> 1
	  var nBits = -7
	  var i = isLE ? (nBytes - 1) : 0
	  var d = isLE ? -1 : 1
	  var s = buffer[offset + i]

	  i += d

	  e = s & ((1 << (-nBits)) - 1)
	  s >>= (-nBits)
	  nBits += eLen
	  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

	  m = e & ((1 << (-nBits)) - 1)
	  e >>= (-nBits)
	  nBits += mLen
	  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

	  if (e === 0) {
	    e = 1 - eBias
	  } else if (e === eMax) {
	    return m ? NaN : ((s ? -1 : 1) * Infinity)
	  } else {
	    m = m + Math.pow(2, mLen)
	    e = e - eBias
	  }
	  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
	}

	exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
	  var e, m, c
	  var eLen = nBytes * 8 - mLen - 1
	  var eMax = (1 << eLen) - 1
	  var eBias = eMax >> 1
	  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
	  var i = isLE ? 0 : (nBytes - 1)
	  var d = isLE ? 1 : -1
	  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

	  value = Math.abs(value)

	  if (isNaN(value) || value === Infinity) {
	    m = isNaN(value) ? 1 : 0
	    e = eMax
	  } else {
	    e = Math.floor(Math.log(value) / Math.LN2)
	    if (value * (c = Math.pow(2, -e)) < 1) {
	      e--
	      c *= 2
	    }
	    if (e + eBias >= 1) {
	      value += rt / c
	    } else {
	      value += rt * Math.pow(2, 1 - eBias)
	    }
	    if (value * c >= 2) {
	      e++
	      c /= 2
	    }

	    if (e + eBias >= eMax) {
	      m = 0
	      e = eMax
	    } else if (e + eBias >= 1) {
	      m = (value * c - 1) * Math.pow(2, mLen)
	      e = e + eBias
	    } else {
	      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
	      e = 0
	    }
	  }

	  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

	  e = (e << mLen) | m
	  eLen += mLen
	  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

	  buffer[offset + i - d] |= s * 128
	}


/***/ },
/* 6 */
/***/ function(module, exports) {

	var toString = {}.toString;

	module.exports = Array.isArray || function (arr) {
	  return toString.call(arr) == '[object Array]';
	};


/***/ }
/******/ ]);