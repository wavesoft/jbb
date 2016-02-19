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

/* Imports */
var BinaryBundle = require("./lib/BinaryBundle");

/* Production optimisations and debug metadata flags */
if (typeof PROD === 'undefined') var PROD = false;
if (typeof DEBUG === 'undefined') var DEBUG = !PROD;

/**
 * Bundle loading states
 */
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
 * Lookup table of numerical type for NL (1-but) length fields
 */
var LN_NUMTYPE = [
	NUMTYPE.UINT16,
	NUMTYPE.UINT32
];

/**
 * Lookup table of numerical type for LEN (2-but) length fields
 */
var LEN_NUMTYPE = [
	NUMTYPE.UINT8,
	NUMTYPE.UINT16,
	NUMTYPE.UINT32,
	NUMTYPE.FLOAT64,
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
// Debug Helper Functions
//////////////////////////////////////////////////////////////////

/**
 * Inject protocol metadata information in the object
 */
function __debugMeta( object, type, meta ) {
	// Dont' re-define meta
	if (object.__meta === undefined) {
		if (typeof object == 'object')
			Object.defineProperty(
				object, "__meta", {
					enumerable: false,
					value: {
						'type': type,
						'meta': meta,
					},
				}
			);
	}

	// Return object for return calls
	return object;
}

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
	return DEBUG
		? __debugMeta( URL.createObjectURL(blob), 'buffer', { 'mime': mimeType, 'size': length } )
		: URL.createObjectURL(blob);
}

/**
 * Read a buffer from the bundle
 */
function decodeBuffer( bundle, len, buf_type ) {
	var lnType = [ NUMTYPE.UINT8, NUMTYPE.UINT16, NUMTYPE.UINT32, NUMTYPE.FLOAT64 ][ len ],
		length = bundle.readTypedNum[ lnType ](), ans;

	// Process buffer according to type
	if (buf_type === 0) { // STRING_LATIN
		ans = String.fromCharCode.apply(null, bundle.readTypedArray[ NUMTYPE.UINT8 ]( length ) );
		return DEBUG
			? __debugMeta( ans, 'string.latin', {} )
			: ans;

	} else if (buf_type === 1) { // STRING_UTF8
		ans = String.fromCharCode.apply(null, bundle.readTypedArray[ NUMTYPE.UINT16 ]( length ) );
		return DEBUG
			? __debugMeta( ans, 'string.utf8', {} )
			: ans;

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

		// Append debug metadata
		DEBUG && __debugMeta( instance, 'object.known', { 'eid': eid } );
		return instance;

	} else if ((op & 0x3C) === 0x38) { // Primitive object
		var poid = (op & 0x03);
		switch (poid) {
			case 0:
				var date = bundle.readTypedNum[ NUMTYPE.FLOAT64 ](),
					tzOffset = bundle.readTypedNum[ NUMTYPE.INT8 ]() * 10;

				// Return date
				return DEBUG 
						? __debugMeta( new Date( date ), 'object.date', {} )
						: new Date( date );

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
		return DEBUG
			? __debugMeta( factory( values ), 'object.plain', { 'eid': eid } )
			: factory( values );

	} else {
		throw {
			'name' 		: 'AssertError',
			'message'	: 'Unexpected object opcode #'+op+'!',
			toString 	: function(){return this.name + ": " + this.message;}
		}
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
	return DEBUG
		? __debugMeta( ans, 'array.delta.float', {} )
		: ans;
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
	return DEBUG
		? __debugMeta( ans, 'array.delta.int', {} )
		: ans;
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
	var values = [];
	for (var i=0, l=properties.length; i<l; i++)
		values.push(decodePrimitive( bundle, database ));

	// Read weaved property array
	// var values = decodePrimitive( bundle, database );
	// console.log("<<WAVE<<", values);

	// // Create factory function
	// var makeObject = Function("props","i", factoryFn);

	// Create objects
	var ans = [];
	for (var i=0; i<len; i++)
		ans.push( objectFactory(values, i) );
		// ans.push( objectFactory(values, values.length / properties.length, i) );

	return DEBUG
		? __debugMeta( ans, 'array.plainbulk', { 'sid': sid } )
		: ans;
	
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
	return DEBUG
		? __debugMeta( ans, 'array.bulk', { 'eid': eid } )
		: ans;

}

/**
 * Decode chunked array
 */
function decodeChunkedArray( bundle, database, length ) {
	var i=0, ans = [], size=0, flag=10, flen=0, prim=null,
		chunks_meta = [], op, op_sz;

	// Collect chunks
	while (size<length) {
		// Get the chunk operator
		op = bundle.readTypedNum[ NUMTYPE.UINT8 ]();
		op_sz = op & 0x03;
		switch (op & 0xFC) {
			case 0x10: // REPEAT

				// Get size and primitive
				flen = bundle.readTypedNum[ LEN_NUMTYPE[op_sz] ]();
				prim = decodePrimitive( bundle, database );
				// console.log("<< CHU[repeat] x"+flen+" @", bundle.i8);

				// Update debug
				DEBUG && chunks_meta.push({ 'len':flen, 'type':'repeat', 'value': prim });

				// Repeat and update size
				for (var i=0; i<flen; i++) ans.push(prim);
				size += flen;
				break;

			case 0x20: // PRIMITIVES

				// Read primitives
				flen = bundle.readTypedNum[ LEN_NUMTYPE[op_sz] ]();
				for (var i=0; i<flen; i++)
					ans.push( decodePrimitive( bundle, database ) );
				// console.log("<< CHU[primitives] x"+flen+" @", bundle.i8);

				// Update debug
				DEBUG && chunks_meta.push({ 'len':flen, 'type':'primtives' });

				// Update size
				size += flen;
				break;

			case 0x30: // NUMERIC

				// Decode numeric array and merge
				prim = decodePrimitive( bundle, database );
				ans = ans.concat( Array.prototype.slice.call(prim) );
				// console.log("<< CHU[numeric] x"+prim.length+" @", bundle.i8);
				size += prim.length;

				// Update debug
				DEBUG && chunks_meta.push({ 'len':prim.length, 'type':'numeric' });
				break;

			case 0x40: // BULK_PLAIN

				// Decode plain bulk array
				flen = bundle.readTypedNum[ LEN_NUMTYPE[op_sz] ]();
				// console.log("<< CHU[bulk.plain] x"+flen+" @", bundle.i8);
				prim = decodePlainBulkArray( bundle, database, flen );
				ans = ans.concat( prim );
				size += prim.length;

				// Update debug
				DEBUG && chunks_meta.push({ 'len':flen, 'type':'bulk.plain' });
				break;

			case 0x50: // BULK_OBJECT

				// Decode plain bulk array
				flen = bundle.readTypedNum[ LEN_NUMTYPE[op_sz] ]();
				// console.log("<< CHU[bulk.object] x"+flen+" @", bundle.i8);
				prim = decodeBulkArray( bundle, database, flen );
				ans = ans.concat( prim );
				size += prim.length;

				// Update debug
				DEBUG && chunks_meta.push({ 'len':flen, 'type':'bulk.known' });
				break;

			default:
				throw {
					'name' 		: 'AssertError',
					'message'	: 'Unknown chunk operator #'+op+' at offset='+bundle.i8+'!',
					toString 	: function(){return this.name + ": " + this.message;}
				}

		}
	}

	// Return array
	return DEBUG
		? __debugMeta( ans, 'array.chunked', { 'chunks': chunks_meta } )
		: ans;
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
		return DEBUG
			? __debugMeta( bundle.readTypedArray[ typ ]( l ), 'array.raw', { } )
			: bundle.readTypedArray[ typ ]( l );

	} else if ((op & 0x70) === 0x50) { // Repeated
		var l = bundle.readTypedNum[ ln3 ](),
			v0 = bundle.readTypedNum[ typ ](),
			arr = new NUMTYPE_CLASS[ typ ]( l );

		// Repeat value
		for (var i=0; i<l; i++) arr[i]=v0;
		return DEBUG
			? __debugMeta( arr, 'array.repeated', { 'value':v0 } )
			: arr;

	} else if ((op & 0x70) === 0x60) { // Downscaled
		var l = bundle.readTypedNum[ ln3 ](),
			v0 = bundle.readTypedNum[ NUMTYPE_DOWNSCALE.FROM[typ] ](),
			vArr = bundle.readTypedArray[ NUMTYPE_DOWNSCALE.TO_DWS[typ] ]( l ),
			// Type-cast constructor
			nArr = new NUMTYPE_CLASS[ NUMTYPE_DOWNSCALE.FROM[typ] ]( vArr );

		return DEBUG
			? __debugMeta( nArr, 'array.downscaled', { 'typ': typ } )
			: nArr;

	} else if ((op & 0x78) === 0x70) { // Short
		var l = bundle.readTypedNum[ NUMTYPE.UINT8 ](),
			vArr = bundle.readTypedArray[ typ ]( l );

		// Return short array
		return DEBUG
			? __debugMeta( vArr, 'array.short', { } )
			: vArr;

	} else if ((op & 0x7C) === 0x78) { // Flag
		// This operator is used ONLY as indicator when parsing a primitive array
		throw {
			'name' 		: 'AssertError',
			'message'	: 'Encountered FLAG operator outside a primitive array!',
			toString 	: function(){return this.name + ": " + this.message;}
		}

	} else if ((op & 0x7E) === 0x7C) { // Chunked
		var l = bundle.readTypedNum[ ln0 ]() | 0;

		// Return decoded chunked array
		return decodeChunkedArray( bundle, database, l );

	} else if ((op & 0x7F) === 0x7E) { // Empty

		// Return empty array
		return DEBUG
			? __debugMeta( [], 'array.empty', {} )
			: [];

	} else if ((op & 0x7F) === 0x7F) { // Extended
		throw {
			'name' 		: 'AssertError',
			'message'	: 'Encountered RESERVED array operator!',
			toString 	: function(){return this.name + ": " + this.message;}
		}

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
		return DEBUG
			? __debugMeta( bundle.iref_table[id], 'object.iref', { 'id': id } )
			: bundle.iref_table[id];

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
		return DEBUG
			? __debugMeta( database[name], 'object.string', { 'key': name } )
			: database[name];

	} else if ((op & 0xFF) === 0xFF) { // Extended
		throw {
			'name' 		: 'AssertError',
			'message'	: 'Encountered RESERVED primtive operator!',
			toString 	: function(){return this.name + ": " + this.message;}
		}

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

	// Start loading each url in parallel
	var triggeredError = false;
	urls.forEach(function(url, index) {
		// Request binary bundle
		var req = new XMLHttpRequest(),
			scope = this;

		// Place request
		req.open('GET', urls[index]);
		req.responseType = "arraybuffer";
		req.send();

		// Wait until the bundle is loaded
		req.addEventListener('readystatechange', function () {
			if (req.readyState !== 4) return;
			if (req.status === 200) {  
				// Continue loading
				buffers[index] = req.response;
				if (--pending === 0) callback( null );
			} else {
				// Trigger callback only once
				if (triggeredError) return;
				callback( "Error loading "+urls[index]+": "+req.statusText );
				triggeredError = true;
			}
		});
	});

	// Return pointer to buffers
	return buffers;
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

	// References for delayed GC
	this.__delayGC = [];

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
					req.buffer = downloadArrayBuffers(req.url,
						(function(req) {
							return function( err ) {

								// Handle errors
								if (err) {
									if (triggeredError) return;
									var errMsg = "Error downloading bundle: "+err;
									if (req.callback) req.callback( errMsg, null);
									if (callback) callback(errMsg, null);
									triggeredError = true;
									return;
								}

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

				// Create bundle from sparse or compact format
				var bundle;
				if (req.buffer.length === 1) {
					bundle = new BinaryBundle( req.buffer[0], self.objectTable );
				} else {
					bundle = new BinaryBundle( req.buffer, self.objectTable );
				}

				// Parse bundle
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

		// GC After a delay
		setTimeout((function() {

			// Release delayed GC References
			this.__delayGC = [];

		}).bind(this), 500);

	}


};

// Export the binary loader
module.exports = BinaryLoader;
