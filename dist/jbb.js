/* JBB Binary Bundle Loader - https://github.com/wavesoft/jbb */
var JBB = JBB || {}; JBB["BinaryLoader"] =
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

	/* WEBPACK VAR INJECTION */(function(process) {"use strict";
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
	var BinaryBundle = __webpack_require__(2);
	var DecodeProfile = __webpack_require__(3);
	var ProgressManager = __webpack_require__(4);
	var Errors = __webpack_require__(5);

	/* Production optimisations and debug metadata flags */
	if (false) var GULP_BUILD = false;
	const IS_NODE =  false ? false : (typeof window === "undefined");
	const PROD =  false ? true : (!process.env.JBB_DEBUG);
	const DEBUG =  false ? false : (!PROD);

	/* Additional includes on node builds */
	if (IS_NODE) {
		var fs = __webpack_require__(6);
	}

	/* Size constants */
	const INT8_MAX 		= 128; // largest positive signed integer on 8-bit
	const INT16_MAX 	= 32768; // largest positive signed integer on 16-bit

	/**
	 * Bundle loading states
	 */
	const PBUND_REQUESTED = 0,
		PBUND_LOADED = 1,
		PBUND_PARSED = 2,
		PBUND_ERROR = 3;

	/**
	 * Numerical types
	 */
	const NUMTYPE = {
		UINT8: 	 0, INT8:    1,
		UINT16:  2, INT16:   3,
		UINT32:  4, INT32:   5,
		FLOAT32: 6, FLOAT64: 7
	};

	/**
	 * Downscaling numtype conversion table
	 */
	const NUMTYPE_DOWNSCALE = {
		// Source conversion type (actual)
		FROM: [
			NUMTYPE.UINT16,
			NUMTYPE.INT16 ,
			NUMTYPE.UINT32,
			NUMTYPE.INT32 ,
			NUMTYPE.UINT32,
			NUMTYPE.INT32 ,

			NUMTYPE.FLOAT32,
			NUMTYPE.FLOAT32,
			NUMTYPE.FLOAT32,
			NUMTYPE.FLOAT32,

			NUMTYPE.FLOAT64,
			NUMTYPE.FLOAT64,
			NUMTYPE.FLOAT64,
			NUMTYPE.FLOAT64,

			NUMTYPE.FLOAT64,
		],
		// Destination conversion type (for downscaling)
		TO: [
			NUMTYPE.UINT8  ,
			NUMTYPE.INT8   ,
			NUMTYPE.UINT8  ,
			NUMTYPE.INT8   ,
			NUMTYPE.UINT16 ,
			NUMTYPE.INT16  ,

			NUMTYPE.UINT8  ,
			NUMTYPE.INT8   ,
			NUMTYPE.UINT16 ,
			NUMTYPE.INT16  ,

			NUMTYPE.UINT8  ,
			NUMTYPE.INT8   ,
			NUMTYPE.UINT16 ,
			NUMTYPE.INT16  ,

			NUMTYPE.FLOAT32
		],
	};

	/**
	 * Delta-Encoding for integers
	 */
	const NUMTYPE_DELTA_INT = {
		FROM: [
			NUMTYPE.UINT16,
			NUMTYPE.INT16 ,
			NUMTYPE.UINT32,
			NUMTYPE.INT32 ,
			NUMTYPE.UINT32,
			NUMTYPE.INT32 ,
		],
		TO: [
			NUMTYPE.INT8 ,
			NUMTYPE.INT8 ,
			NUMTYPE.INT8 ,
			NUMTYPE.INT8 ,
			NUMTYPE.INT16,
			NUMTYPE.INT16,
		]
	};

	/**
	 * Delta-Encoding for floats
	 */
	const NUMTYPE_DELTA_FLOAT = {
		FROM: [
			NUMTYPE.FLOAT32,
			NUMTYPE.FLOAT32,
			NUMTYPE.FLOAT64,
			NUMTYPE.FLOAT64,
		],
		TO: [
			NUMTYPE.INT8 ,
			NUMTYPE.INT16,
			NUMTYPE.INT8 ,
			NUMTYPE.INT16,
		]
	};

	/**
	 * Numerical type classes
	 */
	const NUMTYPE_CLASS = [
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
	 * Lookup table of numerical type for NL (1-but) length fields
	 */
	const LN_NUMTYPE = [
		NUMTYPE.UINT16,
		NUMTYPE.UINT32
	];

	/**
	 * Lookup table of numerical type for LEN (2-but) length fields
	 */
	const LEN_NUMTYPE = [
		NUMTYPE.UINT8,
		NUMTYPE.UINT16,
		NUMTYPE.UINT32,
		NUMTYPE.FLOAT64,
	];

	/**
	 * Delta encoding scale factor
	 */
	const DELTASCALE = {
		S_001 : 1, 	// Divide by 100 the value
		S_1	  : 2, 	// Keep value as-is
		S_R   : 3, 	// Multiply by 127 on 8-bit and by 32768 on 16-bit
		S_R00 : 4,  // Multiply by 12700 on 8-bit and by 3276800 on 16-bit
	};

	/**
	 * BULK_KNOWN Array encoding operator codes
	 */
	const PRIM_BULK_KNOWN_OP = {
		LREF_7:	0x00, // Local reference up to 7bit
		LREF_11:0xF0, // Local reference up to 11bit
		LREF_16:0xFE, // Local reference up to 16bit
		IREF:	0xE0, // Internal reference up to 20bit
		XREF:	0xFF, // External reference
		DEFINE:	0x80, // Definition up to 5bit
		REPEAT:	0xC0, // Repeat up to 4bit
	};

	/**
	 * Simple primitive translation
	 */
	const PRIM_SIMPLE = [ undefined, null, false, true ],
		PRIM_SIMPLE_EX = [ NaN, /* Reserved */ ];

	//////////////////////////////////////////////////////////////////
	// Debug Helper Functions
	//////////////////////////////////////////////////////////////////

	/**
	 * Inject protocol metadata information in the object
	 */
	function __debugMeta( object, type, meta ) {
		// Dont' re-define meta
		if ((object !== undefined) && (object.__meta === undefined)) {
			if (typeof object === 'object')
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
			blob = new Blob([ bundle.readTypedArray(NUMTYPE.UINT8, length ) ], { type: mimeType });
		return DEBUG
			? __debugMeta( URL.createObjectURL(blob), 'buffer', { 'mime': mimeType, 'size': length } )
			: URL.createObjectURL(blob);
	}

	/**
	 * Read a buffer from the bundle
	 */
	function decodeBuffer( bundle, len, buf_type ) {
		var length=0, ans="";
		switch (len) {
			case 0: length = bundle.u8[bundle.i8++]; break;
			case 1: length = bundle.u16[bundle.i16++]; break;
			case 2: length = bundle.u32[bundle.i32++]; break;
			case 3: length = bundle.f64[bundle.i64++]; break;
		}

		// Process buffer according to type
		if (buf_type === 0) { // STRING_LATIN
			ans = String.fromCharCode.apply(null, bundle.readTypedArray( NUMTYPE.UINT8 , length ) );
			return DEBUG
				? __debugMeta( ans, 'string.latin', {} )
				: ans;

		} else if (buf_type === 1) { // STRING_UTF8
			ans = String.fromCharCode.apply(null, bundle.readTypedArray( NUMTYPE.UINT16 , length ) );
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
			throw new Errors.AssertError('Unknown buffer type #'+buf_type+'!');
		}

	}

	/**
	 * Read an object from the bundle
	 */
	function decodeObject( bundle, database, op ) {
		if ( !(op & 0x20) || ((op & 0x30) === 0x20) ) { // Predefined objects
			var eid = op;
			if (op & 0x20) eid = bundle.u8[bundle.i8++] | ((op & 0x0F) << 8);

			// Fetch object class
			var FACTORY = bundle.profile.decode(eid);
			if (FACTORY === undefined) {
				throw new Errors.AssertError('Could not found known object entity #'+eid+'!');
			}

			// Call entity factory
			var instance = FACTORY.create();
			// Keep on irefs
			bundle.iref_table.push( instance );
			// Fetch property table
			// console.assert(eid != 50);
			var prop_table = decodePrimitive( bundle, database );

			// Run initializer
			FACTORY.init( instance, prop_table, 1, 0 );

			// Append debug metadata
			DEBUG && __debugMeta( instance, 'object.known', { 'eid': eid } );
			return instance;

		} else if ((op & 0x3C) === 0x38) { // Primitive object
			var poid = (op & 0x03);
			switch (poid) {
				case 0:
					var date = bundle.f64[bundle.i64++];
					var tzOffset = bundle.s8[bundle.i8++] * 10;

					// Return date
					return DEBUG 
							? __debugMeta( new Date( date ), 'object.date', {} )
							: new Date( date );

				default:
					throw new Errors.AssertError('Unknown primitive object with POID #'+poid+'!');
			}

		} else if ((op & 0x38) === 0x30) { // Simple object with known signature
			// Get values
			var eid = ((op & 0x07) << 8) | bundle.u8[bundle.i8++],
				values = decodePrimitive( bundle, database ),
				factory = bundle.factory_plain[eid];

			// Check for invalid objects
			if (factory === undefined)
				throw new Errors.AssertError('Could not found simple object signature with id #'+eid+'!');

			// Create object
			return DEBUG
				? __debugMeta( factory(values), 'object.plain', { 'eid': eid } )
				: factory(values);

		} else {
			throw new Errors.AssertError('Unexpected object opcode 0x'+op.toString(16)+'!');
		}

	}

	/**
	 * Decode pivot-encoded float array
	 */
	function decodePivotArrayFloat( bundle, database, len, num_type ) {
		var ans = new NUMTYPE_CLASS[ NUMTYPE_DELTA_FLOAT.FROM[ num_type ] ]( len ),
			// pivot = bundle.readTypedNum( NUMTYPE_DELTA_FLOAT.FROM[ num_type ] ), 
			scale = bundle.readFloat64(),
			values = bundle.readTypedArray( NUMTYPE_DELTA_FLOAT.TO[ num_type ] , len );

		// console.log(">> DELTA_FLOAT len=",len,"type=",num_type,"scale=",scale,"pivot=",pivot);

		// Decode
		for (var i=0; i<len; ++i) {
			ans[i] = pivot + (values[i] * scale);
			// console.log("<<<", values[i],"->", ans[i]);
		}

		return DEBUG
			? __debugMeta( ans, 'array.delta.float', {} )
			: ans;
	}

	/**
	 * Decode delta-encoded float array
	 */
	function decodeDeltaArrayInt( bundle, database, len, num_type ) {
		var fromType = NUMTYPE_DELTA_INT.FROM[ num_type ],
			ans = new NUMTYPE_CLASS[ fromType ]( len ), v=0;

		// readTypedNum(fromType)
		switch (fromType) {
			case 0: v = bundle.u8[bundle.i8++]; break;
			case 1: v = bundle.s8[bundle.i8++]; break;
			case 2: v = bundle.u16[bundle.i16++]; break;
			case 3: v = bundle.s16[bundle.i16++]; break;
			case 4: v = bundle.u32[bundle.i32++]; break;
			case 5: v = bundle.s32[bundle.i32++]; break;
			case 6: v = bundle.f32[bundle.i32++]; break;
			case 7: v = bundle.f64[bundle.i64++]; break;
		}

		var values = bundle.readTypedArray( NUMTYPE_DELTA_INT.TO[ num_type ] , len - 1 );

		// Decode array
		ans[0] = v;
		for (var i=0, llen=values.length; i<llen; ++i) {
			v += values[i];
			ans[i+1] = v;
		}

		// Return
		return DEBUG
			? __debugMeta( ans, 'array.delta.int', {} )
			: ans;
	}

	/**
	 * Decode plain bulk array
	 */
	function decodePlainBulkArray( bundle, database ) {

		// Get signature ID
		var sid = bundle.u16[bundle.i16++],
			properties = bundle.signature_table[sid],
			factory = bundle.factory_plain_bulk[sid];

		// Check for invalid objects
		if (factory === undefined)
			throw new Errors.AssertError('Could not found simple object signature with id #'+sid+'!');

		// Read property arrays
		var values = decodePrimitive( bundle, database );

		// Create objects
		var len=values.length/properties.length, ans = new Array(len);
		for (var i=0; i<len; ++i)
			ans[i] = factory(values, i);

		return DEBUG
			? __debugMeta( ans, 'array.primitive.bulk_plain', { 'sid': sid } )
			: ans;
		
	}

	/**
	 * Decode bulk array of entities
	 */
	function decodeKnownBulkArray( bundle, database, len ) {
		const DEBUG_THIS = false;
		// console.log("<-- @"+(bundle.i16 - bundle.ofs16/2),"EID:",bundle.u16[bundle.i16],"LEN:", len);
		var eid = bundle.u16[bundle.i16++],
			FACTORY = bundle.profile.decode( eid ), 
			proplen = FACTORY.props, itemlen=0,
			ops = [], locals = [], i = 0, op = 0, dat = 0, iref_count = 0,
			obj = null, j = 0, k = 0, weaved_props = [], lref_objects = [];

		// Read number of irefs
		if (len < 65536) {
			iref_count = bundle.u16[bundle.i16++];
			if (DEBUG_THIS) console.log("-<- HINT16="+iref_count);
		} else {
			iref_count = bundle.u32[bundle.i32++];
			if (DEBUG_THIS) console.log("-<- HINT32="+iref_count);
		}

		// Initialize irefs
		locals = Array(iref_count);
		for (i=0; i<iref_count; ++i) {
			bundle.iref_table.push( locals[i] = FACTORY.create() );
		}

		// Get property arrays
		if (iref_count) {
			weaved_props = decodePrimitive( bundle, database );
			if (weaved_props.length === undefined)
				throw new Errors.AssertError('Decoded known bulk primitive is not array!');
			itemlen = weaved_props.length / proplen;
		}

		// Process op-codes
		var ans = new Array(len), obji=0, last=undefined;
		i=0; while (i<len) {
			k = bundle.u8[bundle.i8++];
			if ((k & 0x80) === PRIM_BULK_KNOWN_OP.LREF_7) {
				dat = k & 0x7F;
				if (DEBUG_THIS) console.log("-<- LREF_7(",dat,"), i=",i);
				ans[i++] = last = lref_objects[ dat ];

			} else if ((k & 0xC0) === PRIM_BULK_KNOWN_OP.DEFINE) {
				dat = (k & 0x3F)+1;
				if (DEBUG_THIS) console.log("-<- DEFINE(",dat,"), i=",i);

				for (j=0; j<dat; j++) {
					// Initialize object properties and keep it on the answer array 
					obj = locals[obji];
					FACTORY.init( obj, weaved_props, itemlen, obji );
					ans[i++] = obj;
					// Forward object index
					obji++;
				}
				last = obj;

			} else if ((k & 0xE0) === PRIM_BULK_KNOWN_OP.REPEAT) {
				dat = (k & 0x1F)+1;
				if (DEBUG_THIS) console.log("-<- REPEAT(",dat,"), i=",i);
				for (j=0; j<dat; j++) {
					ans[i++] = last;
				}

			} else if ((k & 0xF0) === PRIM_BULK_KNOWN_OP.IREF) {
				dat = ((k & 0x0F) << 16) | bundle.u16[bundle.i16++];
				if (DEBUG_THIS) console.log("-<- IREF(",dat,"), i=",i);

				// Import from IREF
				if (dat >= bundle.iref_table.length)
					throw new Errors.IRefError('Invalid IREF #'+dat+'!');
				ans[i++] = last = bundle.iref_table[ dat ];
				lref_objects.push( bundle.iref_table[ dat ] );

			} else if ((k & 0xF8) === PRIM_BULK_KNOWN_OP.LREF_11) {
				dat = ((k & 0x07) << 8) | bundle.u8[bundle.i8++];
				if (DEBUG_THIS) console.log("-<- LREF_11(",dat,"), i=",i);
				ans[i++] = last = lref_objects[ dat ];

			} else if (k === PRIM_BULK_KNOWN_OP.LREF_16) {
				dat = bundle.u16[bundle.i16++];
				if (DEBUG_THIS) console.log("-<- LREF_16(",dat,"), i=",i);
				ans[i++] = last = lref_objects[ dat ];

			} else if (k === PRIM_BULK_KNOWN_OP.XREF) {
				dat = bundle.readStringLT();
				if (DEBUG_THIS) console.log("-<- XREF(",dat,"), i=",i);

				// Import from XREF
				if (database[dat] === undefined) 
					throw new Errors.XRefError('Cannot import undefined external reference '+dat+'!');
				ans[i++] = last = database[dat];

			}

		}

		// Free proprty tables and return objects
		return DEBUG
			? __debugMeta( ans, 'array.bulk', { 'eid': eid } )
			: ans;

	}

	/**
	 * Read an array from the bundle
	 */
	function decodeChunkedArray( bundle, database, size, is_numeric ) {
		var op = bundle.u8[bundle.i8++],
			chunk, chunk_meta = [],	nans, vans=[], i=0, first = true, j=0, l=0,
			splicefn, peekOp, ln=0, type=0, len=0, val=0;

		// Process chunks till PRIM_CHUNK_END
		while (i < size) {
			if (is_numeric) {

				//
				// Use an optimised version of NUM_REPEATED when
				// operating on a numeric array in order to avoid
				// intermediate casting to Array()
				//

				if ((op & 0xF0) === 0x40) { // NUM_REPEATED

					ln = op & 0x01;
					type = (op >> 1) & 0x07;
					len = ln ? bundle.u32[bundle.i32++] : bundle.u16[bundle.i16++];

					// Collect meta
					if (DEBUG) {
						chunk_meta.push({
							type: op,
							len: len
						});
					}

					// Init first value
					if (first) {
						nans = new NUMTYPE_CLASS[ type ]( size );
						first = false;
					}

					// readTypedNum(type)
					switch (type) {
						case 0: val = bundle.u8[bundle.i8++]; break;
						case 1: val = bundle.s8[bundle.i8++]; break;
						case 2: val = bundle.u16[bundle.i16++]; break;
						case 3: val = bundle.s16[bundle.i16++]; break;
						case 4: val = bundle.u32[bundle.i32++]; break;
						case 5: val = bundle.s32[bundle.i32++]; break;
						case 6: val = bundle.f32[bundle.i32++]; break;
						case 7: val = bundle.f64[bundle.i64++]; break;
					}
					nans.fill( val, i, i+len );
					i+= len;

				} else {

					// Collect chunk ops
					chunk = decodeArray( bundle, database, op );
					if (DEBUG) {
						chunk_meta.push({
							type: op,
							len: chunk.length
						});
					}

					// Test for non-arrays
					if (chunk.length === undefined)
						throw new Errors.AssertError('Encountered non-array chunk as part of chunked array!');

					// Init first value
					if (first) {
						nans = new chunk.constructor( size );
						first = false;
					}

					// Test for type mismatch
					if (!(chunk instanceof nans.constructor)) {
						throw new Errors.AssertError("Got is_numeric flag, but chunks are not of the same type (op was "+op+"!");
					}

					// Merge
					nans.set( chunk, i );
					i += chunk.length;

				}

			} else {

				// Collect chunk ops
				chunk = decodeArray( bundle, database, op );
				if (DEBUG) {
					chunk_meta.push({
						type: op,
						len: chunk.length
					});
				}

				// Test for non-arrays
				if (chunk.length === undefined)
					throw new Errors.AssertError('Encountered non-array chunk as part of chunked array!');

				// Init first
				if (first) {
					vans = new Array(size);
					first = false;
				}

				// Merge
				for (j=0, l=chunk.length; j<l; j++, i++) {
					vans[i] = chunk[j];
				}

			}

			// Get next op-code
			if (i < size) {
				op = bundle.u8[bundle.i8++];
			} else {
				break;
			}
		}

		// console.log("-----------");
		// console.log(ans);

		// Return chunked array
		if (is_numeric) {
			return DEBUG
				? __debugMeta( nans, 'array.primitive.chunked', { 'chunks': chunk_meta, 'numeric': true } )
				: nans;
		} else {
			return DEBUG
				? __debugMeta( vans, 'array.primitive.chunked', { 'chunks': chunk_meta, 'numeric': false } )
				: vans;
		}
	}

	/**
	 * Read an array from the bundle
	 */
	function decodeArray( bundle, database, op ) {
		var i=0, type=0, ln=0, len=0, nArr = [], vArr;
		op = op & 0xFF;

		if (op === 0x6E) { // PRIM_BULK_PLAIN

			// Decode and return plain bulk array
			// console.log("<<< @"+(bundle.i8-bundle.ofs8)+" Plain Bulk Plain");
			return decodePlainBulkArray( bundle, database );

		} else if (op === 0x6F) { // PRIM_SHORT

			// Collect up to 255 primitives
			// console.log("<<< @"+(bundle.i8-bundle.ofs8)+" Prim Short");
			len = bundle.u8[bundle.i8++];
			nArr[len-1] = null;
			for (i=0; i<len; ++i)
				nArr[i] = decodePrimitive( bundle, database );

			// Return
			return DEBUG
				? __debugMeta( nArr, 'array.primitive.short', {} )
				: nArr;

		} else if (op === 0x7E) { // EMPTY

			// Return empty array
			// console.log("<<< @"+(bundle.i8-bundle.ofs8)+" Empty");
			return DEBUG
				? __debugMeta( [], 'array.empty', {} )
				: [];

		} else if (op === 0x7F) { // PRIM_CHUNK_END
			throw new Errors.AssertError('Encountered PRIM_CHUNK_END outside of chunked array!');

		} else if ((op & 0xE0) === 0x00) { // NUM_DWS

			// console.log("<<< @"+(bundle.i8-bundle.ofs8)+" Numeric DWS");
			ln = op & 0x01;
			type = (op >> 1) & 0x0F;
			len = ln ? bundle.u32[bundle.i32++] : bundle.u16[bundle.i16++];

			// Read from and encode to
			// console.log("Reading NUM_DWS len="+len+", ln="+ln);
			vArr = bundle.readTypedArray( NUMTYPE_DOWNSCALE.TO[type] , len );
			var tArr = new NUMTYPE_CLASS[ NUMTYPE_DOWNSCALE.FROM[type] ]( vArr );

			// Return
			return DEBUG
				? __debugMeta( tArr, 'array.numeric.downscaled', { 'type': type } )
				: tArr;

		} else if ((op & 0xF0) === 0x20) { // NUM_DELTA_INT

			// console.log("<<< @"+(bundle.i8-bundle.ofs8)+" Numeric Delta Int");
			ln = op & 0x01;
			type = (op >> 1) & 0x07;
			len = ln ? bundle.u32[bundle.i32++] : bundle.u16[bundle.i16++];

			// Return delta-encoded integers
			return decodeDeltaArrayInt( bundle, database, len, type );

		} else if ((op & 0xF0) === 0x30) { // NUM_DELTA_FLOAT

			// console.log("<<< @"+(bundle.i8-bundle.ofs8)+" Numeric Delta Float");
			ln = op & 0x01;
			type = (op >> 1) & 0x07;
			len = ln ? bundle.u32[bundle.i32++] : bundle.u16[bundle.i16++];

			// Return pivot-encoded floats
			return decodePivotArrayFloat( bundle, database, len, type );

		} else if ((op & 0xF0) === 0x40) { // NUM_REPEATED

			// console.log("<<< @"+(bundle.i8-bundle.ofs8)+" Numeric Repeated");
			ln = op & 0x01;
			type = (op >> 1) & 0x07;
			len = ln ? bundle.u32[bundle.i32++] : bundle.u16[bundle.i16++];

			// Repeat value
			switch (type) {
				case 0: vArr = bundle.u8[bundle.i8++]; break;
				case 1: vArr = bundle.s8[bundle.i8++]; break;
				case 2: vArr = bundle.u16[bundle.i16++]; break;
				case 3: vArr = bundle.s16[bundle.i16++]; break;
				case 4: vArr = bundle.u32[bundle.i32++]; break;
				case 5: vArr = bundle.s32[bundle.i32++]; break;
				case 6: vArr = bundle.f32[bundle.i32++]; break;
				case 7: vArr = bundle.f64[bundle.i64++]; break;
			}
			var tArr = new NUMTYPE_CLASS[ type ]( len );
			// tArr.fill(vArr);
			for (i=0; i<len; ++i) tArr[i]=vArr;

			// Return
			return DEBUG
				? __debugMeta( tArr, 'array.numeric.repeated', { 'type': type } )
				: tArr;

		} else if ((op & 0xF0) === 0x50) { // NUM_RAW

			// console.log("<<< @"+(bundle.i8-bundle.ofs8)+" Numeric Raw");
			ln = op & 0x01;
			type = (op >> 1) & 0x07;
			len = ln ? bundle.u32[bundle.i32++] : bundle.u16[bundle.i16++];

			// Read raw array
			// console.log("Reading NUM_RAW len="+len+", ln="+ln);
			nArr = bundle.readTypedArray( type , len );

			// Return
			return DEBUG
				? __debugMeta( nArr, 'array.numeric.raw', { 'type': type } )
				: nArr;

		} else if ((op & 0xF8) === 0x60) { // NUM_SHORT

			// console.log("<<< @"+(bundle.i8-bundle.ofs8)+" Numeric Short");
			type = op & 0x07;
			len = bundle.u8[bundle.i8++];

			// Read raw array
			// console.log("Reading NUM_DWS len="+len+", ln="+ln);
	  		nArr = bundle.readTypedArray( type , len );

			// Return
			return DEBUG
				? __debugMeta( nArr, 'array.numeric.short', { 'type': type } )
				: nArr;

		} else if ((op & 0xFE) === 0x68) { // PRIM_REPEATED

			// console.log("<<< @"+(bundle.i8-bundle.ofs8)+" Prim Repeated");
			ln = op & 0x01;
			len = ln ? bundle.u32[bundle.i32++] : bundle.u16[bundle.i16++];

			// Repeat value
			vArr = decodePrimitive( bundle, database );
			nArr[len-1] = null;
			// nArr.fill( vArr );
			for (i=0; i<len; i++) nArr[i]=vArr;

			// Return
			return DEBUG
				? __debugMeta( nArr, 'array.primitive.repeated', { 'type': type } )
				: nArr;


		} else if ((op & 0xFE) === 0x6A) { // PRIM_RAW

			// console.log("<<< @"+(bundle.i8-bundle.ofs8)+" Prim Raw");
			ln = op & 0x01;
			len = ln ? bundle.u32[bundle.i32++] : bundle.u16[bundle.i16++];

			// Compile primitives
			nArr[len-1] = null;
			for (i=0; i<len; ++i)
				nArr[i] = decodePrimitive( bundle, database );

			// Return
			return DEBUG
				? __debugMeta( nArr, 'array.primitive.raw', {} )
				: nArr;

		} else if ((op & 0xFC) === 0x78) { // PRIM_CHUNK

			// Get length and numeric flag
			ln = op & 0x01;
			type = (op >> 1) & 0x01;
			len = ln ? bundle.u32[bundle.i32++] : bundle.u16[bundle.i16++];

			// Return chunked array
			// console.log("<<< @"+(bundle.i8-bundle.ofs8)+" Prim Chunk");
			return decodeChunkedArray( bundle, database, len, type );

		} else if ((op & 0xFE) === 0x7C) { // PRIM_BULK_KNOWN

			// console.log("<<< @"+(bundle.i8-bundle.ofs8)+" Prim Bulk Known");
			ln = op & 0x01;
			len = ln ? bundle.u32[bundle.i32++] : bundle.u16[bundle.i16++];

			// Decode and return primitive bulk array
			return decodeKnownBulkArray( bundle, database, len );

		} else {
			throw new Errors.AssertError('Unknown array op-code 0x'+op.toString(16)+' at offset @'+(bundle.i8 - bundle.ofs8)+'!');

		}
	}

	/**
	 * Read a primitive from the bundle
	 */
	function decodePrimitive( bundle, database ) {
		var op = bundle.u8[bundle.i8++];
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
			var id = bundle.u16[bundle.i16++];
			id = ((op & 0x0F) << 16) | id;
			if (id >= bundle.iref_table.length)
				throw new Errors.IRefError('Invalid IREF #'+id+'!');
			return DEBUG
				? __debugMeta( bundle.iref_table[id], 'object.iref', { 'id': id } )
				: bundle.iref_table[id];

		} else if ((op & 0xF8) === 0xF0) { // Number
			switch (op & 0x07) {
				case 0: return bundle.u8[bundle.i8++];
				case 1: return bundle.s8[bundle.i8++];
				case 2: return bundle.u16[bundle.i16++];
				case 3: return bundle.s16[bundle.i16++];
				case 4: return bundle.u32[bundle.i32++];
				case 5: return bundle.s32[bundle.i32++];
				case 6: return bundle.f32[bundle.i32++];
				case 7: return bundle.f64[bundle.i64++];
			}

		} else if ((op & 0xFC) === 0xF8) { // Simple
			return PRIM_SIMPLE[ op & 0x03 ];

		} else if ((op & 0xFE) === 0xFC) { // Simple_EX
			return PRIM_SIMPLE_EX[ op & 0x02 ];

		} else if ((op & 0xFF) === 0xFE) { // Import
			var name = bundle.readStringLT();
			if (database[name] === undefined) 
				throw new Errors.XRefError('Cannot import undefined external reference '+name+'!');
			return DEBUG
				? __debugMeta( database[name], 'object.string', { 'key': name } )
				: database[name];

		} else if ((op & 0xFF) === 0xFF) { // Extended
			throw new Errors.AssertError('Encountered RESERVED primitive operator!');

		}
	}

	/**
	 * Pare the entire bundle
	 */
	function parseBundle( bundle, database ) {
		while (!bundle.eof()) {
			var op = bundle.u8[bundle.i8++];
			switch (op) {
				case 0xF8: // Export
					var export_name = bundle.prefix + bundle.readStringLT();
					database[ export_name ] = decodePrimitive( bundle, database );
					break;

				default:
					throw new Errors.AssertError('Unknown control operator 0x'+op.toString(16)+' at @'+bundle.i8+'!');
			}
		}
	}

	/**
	 * Download helper
	 */
	function downloadArrayBuffers( urls, progressPart, callback ) {

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

			// Listen for progress events & end updates
			req.addEventListener('progress', function(e) {
				if (e.lengthComputable) {
					progressPart.update( req, e.loaded, e.total );
				}
			});

			// Wait until the bundle is loaded
			req.addEventListener('readystatechange', function () {
				if (req.readyState !== 4) return;
				if (req.status === 200) {  
					// Continue loading
					buffers[index] = req.response;
					if (--pending === 0) {
						progressPart.complete();
						callback( null );
					}
				} else {
					// Trigger callback only once
					if (triggeredError) return;
					triggeredError = true;
					progressPart.complete();
					callback( "Error loading "+urls[index]+": "+req.statusText );
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
	var BinaryLoader = function( baseDir, database ) {

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
		this.profile = new DecodeProfile();

		// Progress manager
		this.progressManager = new ProgressManager();

	};

	/**
	 * 
	 */
	BinaryLoader.prototype = {

		'constructor': BinaryLoader,

		/**
		 * Add profile information to the decoder
		 */
		'addProfile': function( profile ) {
			this.profile.add( profile );
		},

		/**
		 * Load the specified bundle from URL and call the onsuccess callback.
		 * If an error occures, call the onerror callback.
		 *
		 * @param {string} url - The URL to load
		 * @param {function} callback - The callback to fire when the bundle is loaded
		 */
		'add': function( url, callback ) {

			// Node quick, not present on browser builds
			if (IS_NODE) {

				// Helper function
				var readChunk = function ( filename ) {
					// Read into buffer
					var file = fs.readFileSync(filename),
						u8 = new Uint8Array(file);
					// Return buffer
					return u8.buffer;
				}

				// Read by chunks
				if (url.substr(-5) === ".jbbp") {

					// Add by buffer
					var base = url.substr(0,url.length-5);
					this.addByBuffer( [
						readChunk(base + '.jbbp'),
						readChunk(base + '_b16.jbbp'),
						readChunk(base + '_b32.jbbp'),
						readChunk(base + '_b64.jbbp'),
					], callback );

				} else {

					// Add by buffer
					this.addByBuffer( readChunk(url), callback );

				}

				// Don't continue on browser builds
				return;

			}

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
					base + '.jbbp' + suffix,
					base + '_b16.jbbp' + suffix,
					base + '_b32.jbbp' + suffix,
					base + '_b64.jbbp' + suffix
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
		'addByBuffer': function( buffer, callback ) {

			// Prepare pending bundle
			var pendingBundle = {
				'callback': callback,
				'status': PBUND_LOADED,
				'buffer': buffer,
				'url': undefined,
			};

			// Keep this pending action
			this.queuedRequests.push( pendingBundle );

		},

		/**
		 * Add a progress handler
		 */
		'addProgressHandler': function(fn) {
			this.progressManager.addHandler( fn );
		},

		/**
		 * Remove a progress handler
		 */
		'removeProgressHandler': function(fn) {
			this.progressManager.removeHandler( fn );
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
				callback( null, this.database );
				return;
			}

			// First make sure that there are no bundles pending loading
			var pendingLoading = false;
			for (var i=0; i<this.queuedRequests.length; ++i) {
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
				for (var i=0; i<this.queuedRequests.length; ++i) {
					var req = this.queuedRequests[i], part = this.progressManager.part();
					if (req.status === PBUND_REQUESTED) {

						// Download bundle from URL(s)
						state.counter++;
						req.buffer = downloadArrayBuffers(req.url, part,
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

			for (var i=0; i<this.queuedRequests.length; ++i) {
				var req = this.queuedRequests[i];
				if (req.status === PBUND_LOADED) {
					// try {

					// Create bundle from sparse or compact format
					var bundle;
					if (req.buffer.length === 1) {
						bundle = new BinaryBundle( req.buffer[0], self.profile );
					} else {
						bundle = new BinaryBundle( req.buffer, self.profile );
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
			callback( null, this.database );

		}


	};

	// Export the binary loader
	module.exports = BinaryLoader;

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(1)))

/***/ },
/* 1 */
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
/* 2 */
/***/ function(module, exports) {

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
	// Local Helper Functions
	//////////////////////////////////////////////////////////////////

	/**
	 * Create a weave property factory
	 */
	function genWeavePropFn( d ) {
		var code = "";
		for (var i=0; i<d; ++i) {
			if (i !== 0) code += ",";
			code += "p[i+c*"+i+"]";
		}
		return new Function( "p", "i", "var c=p.length/"+d+";return ["+code+"]" );
	}

	//////////////////////////////////////////////////////////////////
	// Binary Bundle Representation
	//////////////////////////////////////////////////////////////////

	/**
	 * Representation of the binary bundle from buffer
	 */
	var BinaryBundle = function( b, profile ) {

		// The object table to use
		this.profile = profile;

		// Exported properties prefix
		this.prefix = "";

		// If we are given an array as buffer, it means
		// that we loaded separate chunks rather than a 
		// single, unifide buffer.
		this.sparse = (b instanceof Array);
		var hv16, hv32, primBufLen, header_size = 32;
		if (this.sparse) {

			// Setup views to the buffer
			this.u8  = new Uint8Array(b[0]);
			this.s8  = new Int8Array(b[0]);
			this.u16 = new Uint16Array(b[1]);
			this.s16 = new Int16Array(b[1]);
			this.u32 = new Uint32Array(b[2]);
			this.s32 = new Int32Array(b[2]);
			this.f32 = new Float32Array(b[2]);
			this.f64 = new Float64Array(b[3]);

			// Header views
			hv16 = new Uint16Array(b[0], 0, header_size/2);
			hv32 = new Uint32Array(b[0], 0, header_size/4);

			// Length of the primary buffer
			primBufLen = b[0].byteLength;

		} else {

			// Setup views to the buffer
			this.u8  = new Uint8Array(b);
			this.s8  = new Int8Array(b);
			this.u16 = new Uint16Array(b);
			this.s16 = new Int16Array(b);
			this.u32 = new Uint32Array(b);
			this.s32 = new Int32Array(b);
			this.f32 = new Float32Array(b);
			this.f64 = new Float64Array(b);

			// Header views
			hv16 = new Uint16Array(b);
			hv32 = new Uint32Array(b);

			// Length of the primary buffer
			primBufLen = b.byteLength;

		}

		// Read header
		this.magic  	= hv16[0];
		this.table_id  	= hv16[1];
		this.version 	= hv16[2];
		this.table_count= hv16[3];

		// Expand version
		this.ver_major = this.version & 0x00ff;
		this.ver_minor = (this.version & 0xff00) >> 8;

		// Calculate upper bounds
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

		// Validate bundle version number
		if (this.version != 0x0102) {
			throw {
				'name' 		: 'DecodingError',
				'message'	: 'Unsupported bundle version v'+this.ver_minor+'.'+this.ver_minor,
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

		// Load object tables
		var ots = [];
		if (this.table_count <= 1) {

			// The bundle can have no profile if needed
			if (this.table_id !== 0x00)

				ots.push( this.table_id );
		} else if (this.table_id !== 0x00) {
			throw {
				'name' 		: 'DecodingError',
				'message'	: 'Invalid header data',
				toString 	: function(){return this.name + ": " + this.message;}
			}
		} else {
			// Read known table IDs
			for (var i=0; i<this.table_count; ++i) {
				ots.push( this.u16[ this.i16++ ] );
			}
		}

		// Activate the correct object IDs
		this.profile.use( ots );		

		// Internal reference table
		this.iref_table = [];

		// Populate string lookup table
		var str = "", parsing = false;
		this.string_table = [];
		if (this.lenST > 0) {
			for (var l=this.i8+this.max8, i=l-this.lenST; i<l; ++i) {
				var c = this.u8[i];
				if (c === 0) {
					this.string_table.push(str);
					str = "";
					parsing = false;
				} else {
					str += String.fromCharCode(c);
					parsing = true;
				}
			}
			if (parsing) this.string_table.push(str);
		}

		// Populate object signature lookup table
		var obj = [], keysPending = 0, active = false;
		this.signature_table = [];
		if (this.lenOT > 0) {
			for (var l=this.i16*2+this.max16, i=l-this.lenOT; i<l; i+=2) {
				var c = this.u16[i/2];
				if (keysPending--) {
					obj.push( this.string_table[c] );
				} else {
					if (active) this.signature_table.push(obj);
					obj = []; keysPending = c;
					active = true;
				}
			}
			if (active) this.signature_table.push(obj);
		}


		// NOTE: The follwing functions *MUST* have a body smaller than 600
		//       bytes in order to be inlined by the compiler.

		// Create fast numerical read functions
		var scope = this;

		// Create fast typed array read function
		if (this.sparse) {
			this.readTypedArray = function( t, l ) 
			{ var o8=this.i8,o16=2*this.i16,o32=4*this.i32,o64=8*this.i64;
			  switch (t) {
					case 0:this.i8+=l;return new Uint8Array(b[0],o8,l);
					case 1:this.i8+=l;return new Int8Array(b[0],o8,l);
					case 2:this.i16+=l;return new Uint16Array(b[1],o16,l);
					case 3:this.i16+=l;return new Int16Array(b[1],o16,l);
					case 4:this.i32+=l;return new Uint32Array(b[2],o32,l);
					case 5:this.i32+=l;return new Int32Array(b[2],o32,l);
					case 6:this.i32+=l;return new Float32Array(b[2],o32,l);
					case 7:this.i64+=l;return new Float64Array(b[3],o64,l);
				}
			}
		} else {
			this.readTypedArray = function( t, l )
			{ var o8=this.i8,o16=2*this.i16,o32=4*this.i32,o64=8*this.i64;
			  switch (t) {
					case 0:this.i8+=l;return new Uint8Array(b,o8,l);
					case 1:this.i8+=l;return new Int8Array(b,o8,l);
					case 2:this.i16+=l;return new Uint16Array(b,o16,l);
					case 3:this.i16+=l;return new Int16Array(b,o16,l);
					case 4:this.i32+=l;return new Uint32Array(b,o32,l);
					case 5:this.i32+=l;return new Int32Array(b,o32,l);
					case 6:this.i32+=l;return new Float32Array(b,o32,l);
					case 7:this.i64+=l;return new Float64Array(b,o64,l);
				}
			}
		}

		// Create simple object factories from the object table
		this.factory_plain = [];
		this.factory_plain_bulk = [];
		for (var i=0; i<this.signature_table.length; ++i) {

			// Build factory funtion
			var props = this.signature_table[i], llen = props.length,
				factoryPlain = "return {", factoryBulk = "var c=values.length/"+llen+";"+factoryPlain;
			for (var j=0; j<llen; ++j) {
				factoryPlain += "'"+props[j]+"': values["+j+"],";
				factoryBulk +=  "'"+props[j]+"': values[i+c*"+j+"],";
				// factoryBulk +=  "'"+props[j]+"': values[("+j+"*len)+i],";
			}
			factoryPlain += "}";
			factoryBulk += "}";

			// Compile factory function
			this.factory_plain.push( new Function("values", factoryPlain) );
			this.factory_plain_bulk.push( new Function("values", "i", factoryBulk) );
			// this.factory_plain_bulk.push( new Function("values", "len", "i", factoryBulk) );

		}

		// Generate property de-weaving functions for some 
		// widely used dimentions
		this.factory_weave = [
			function(a,b) { return [] }
		];
		for (var i=1; i<16; ++i) {
			this.factory_weave.push( genWeavePropFn(i) );
		}

	}

	/**
	 * Read a 16-bit string lookup table ID and translate to it's string
	 */
	BinaryBundle.prototype.readStringLT = function() {
		var id = this.u16[this.i16++];
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
/* 3 */
/***/ function(module, exports) {

	"use strict";
	/**
	 * JBB - Javascript Binary Bundles - Decoder Multi-Profile Drop-in replacement
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

	/**
	 * Encoder profile
	 */
	var DecodeProfile = function() {
		this.size = 0;
		this._lib = [];
		this._profiles = [];
		this._offset = 0;
		this._foffset = 0;
	};

	/**
	 * Combine current profile with the given one
	 */
	DecodeProfile.prototype.add = function( profile ) {
		// Add in the library. They will be used
		// only when explicitly requested.
		this._lib.push( profile );
	}

	/**
	 * From the profiles added, use the ones specified in the list,
	 * in the order they were given.
	 */
	DecodeProfile.prototype.use = function( ids ) {

		// If empty profile, return
		if (ids.length == 0)
			return;

		// Pick the profiles of interest
		for (var i=0, l=ids.length; i<l; i++) {
			var profile = null, id = ids[i];

			// Find profile
			for (var j=0, ll=this._lib.length; j<ll; j++) {
				var p = this._lib[j];
				if (p.id === id) {
					profile = p;
					break;
				}
			}

			// Throw an exception if not found
			if (profile === null) {
				var pid = (id & 0xFFF0) >> 4, rev = id & 0xF;
				throw {
					'name' 		: 'DecodingError',
					'message'	: 'The bundle uses profile 0x'+pid.toString(16)+', rev '+rev+' but it was not loaded!',
					toString 	: function(){return this.name + ": " + this.message;}
				}
			}

			// Update size
			this.size += profile.size;

			// Keep profiles and bounds for fast segment lookup
			this._profiles.push([ profile, 
				this._foffset, this._foffset + profile.frequent,
				this._offset, this._offset + profile.size - profile.frequent ]);

			// Update offsets
			this._offset += profile.size - profile.frequent;
			this._foffset += profile.frequent;

		}

	}

	/**
	 * Drop-in replacement for the profile decode function
	 */
	DecodeProfile.prototype.decode = function( eid ) {
		if (eid < 32) {
			for (var i=0, l=this._profiles.length; i<l; ++i) {
				var e = this._profiles[i], p = e[0], ofs = e[1], end = e[2];
				if ((eid >= ofs) && (eid < end))
					return p.decode( eid - ofs );
			}
		} else {
			eid -= 32;
			for (var i=0, l=this._profiles.length; i<l; ++i) {
				var e = this._profiles[i], p = e[0], ofs = e[3], end = e[4];
				if ((eid >= ofs) && (eid < end))
					return p.decode( eid - ofs + 32 );
			}
		}
	};

	// Export profile
	module.exports = DecodeProfile;


/***/ },
/* 4 */
/***/ function(module, exports) {

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

	/**
	 * A partial progress item
	 */
	var ProgressManagerPart = function(parent) {
		this.parent = parent;
		this.objectLookup = [];
		this.objects = [];
		this.value = 0;
	};

	/**
	 * Update sub-object progress
	 */
	ProgressManagerPart.prototype.update = function( obj, progress, total ) {

		// Get/Create new object for tracking this object
		var id = this.objectLookup.indexOf(obj);
		if (id === -1) {
			id = this.objectLookup.length;
			this.objectLookup.push(obj);
			this.objects.push([ progress, total ])
		} else {
			this.objects[id][0] = progress;
			this.objects[id][1] = total;
		}

		// Update summary
		var prog=0, tot=0;
		for (var i=0; i<this.objects.length; i++) {
			prog += this.objects[i][0];
			tot += this.objects[i][1];
		}

		// Update value
		this.value = prog / tot;
		this.parent.update();

	};

	/**
	 * Complete item progress
	 */
	ProgressManagerPart.prototype.complete = function() {
		this.value = 1;
		this.parent.update();

		// Remove me from parent
		var id = this.parent.parts.indexOf(this);
		if (id === -1) return;
		this.parent.parts.splice(id,1);
	}

	/**
	 * Progress logic manager
	 */
	var ProgressManager = function() {

		/**
		 * Progress handlers
		 */
		this.handlers = [];

		/**
		 * Progress parts
		 */
		this.parts = [];

		/**
		 * Indicator if a progress is active
		 */
		this.active = false;

	};

	/**
	 * Start managing a new part
	 */
	ProgressManager.prototype.part = function() {

		// Create and return new part
		var part = new ProgressManagerPart(this);
		this.parts.push(part);

		// Update
		this.update();

		// Return part
		return part;

	};

	/**
	 * Update state and trigger callbacks
	 */
	ProgressManager.prototype.update = function() {

		// Calculate aggregated progress
		var progress = 0, eventID = 0;

		// No items means full progress 
		if (this.parts.length === 0) {
			progress = 1.0;
		} else {
			for (var i=0; i<this.parts.length; i++) {
				progress += this.parts[i].value;
			}
			progress /= this.parts.length;
		}


		// Check for start
		if (!this.active && (progress != 1.0)) {
			this.active = true;
			eventID = 1;

		// Check for complete
		} else if (this.active && (progress == 1.0)) {
			this.active = false;
			eventID = 2;

		}

		// Trigger update
		if (this.active || (eventID === 2)) {
			for (var i=0; i<this.handlers.length; i++) {
				this.handlers[i]( progress, eventID );
			}
		}

	};

	/**
	 * Add a progress handler function
	 */
	ProgressManager.prototype.addHandler = function( fn ) {
		this.handlers.push(fn);
	};

	/**
	 * Remove a progress handler function
	 */
	ProgressManager.prototype.removeHandler = function( fn ) {
		var id = this.handlers.indexOf(fn);
		if (id === -1) return;
		this.handlers.splice(id,1);
	};

	// Expose progress logic
	module.exports = ProgressManager;


/***/ },
/* 5 */
/***/ function(module, exports) {

	"use strict";
	/**
	 * JBB - Javascript Binary Bundles - Binary Stream Class
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

	/**
	 * Helper to reduce a few bytes on the minified version
	 */
	function _define(inst, message, type) {
	    var temp = Error.call(inst, message);
	    temp.name = inst.name = type;
	    inst.stack = temp.stack;
	    inst.message = temp.message;
	}

	/**
	 * Encode error is a generic error emmited during encoding
	 */
	var EncodeError = function(message) { 
	    _define(this, message, "EncodeError");
	}
	EncodeError.prototype = Object.create(Error.prototype);

	/**
	 * Assert error is generated by integrity checks
	 */
	var AssertError = function(message) { 
	    _define(this, message, "AssertError");
	}
	AssertError.prototype = Object.create(Error.prototype);

	/**
	 * Assert error generated by the packing functions
	 */
	var PackError = function(message) { 
	    _define(this, message, "PackError");
	}
	PackError.prototype = Object.create(Error.prototype);

	/**
	 * Assert error generated by the loading functions
	 */
	var LoadError = function(message) { 
	    _define(this, message, "LoadError");
	}
	LoadError.prototype = Object.create(Error.prototype);

	/**
	 * A value is out of range
	 */
	var RangeError = function(message) { 
	    _define(this, message, "RangeError");
	}
	RangeError.prototype = Object.create(Error.prototype);

	/**
	 * Internal referrence error
	 */
	var IRefError = function(message) { 
	    _define(this, message, "IRefError");
	}
	IRefError.prototype = Object.create(Error.prototype);

	/**
	 * External referrence error
	 */
	var XRefError = function(message) { 
	    _define(this, message, "XRefError");
	}
	XRefError.prototype = Object.create(Error.prototype);

	module.exports = {
		'EncodeError': EncodeError,
		'AssertError': AssertError,
		'PackError': PackError,
		'RangeError': RangeError,
		'IRefError': IRefError,
		'XRefError': XRefError,
	};

/***/ },
/* 6 */
/***/ function(module, exports) {

	

/***/ }
/******/ ]);