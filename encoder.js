"use strict";
/**
 * JBB - Javascript Binary Bundles - Binary Encoder
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

var bst 		= require("binary-search-tree");
var fs 			= require("fs");
var util		= require("util");
var MockBrowser = require("mock-browser");
var colors 		= require("colors");
var mime 		= require("mime");

/*

Known Limitations

* A TypedArray cannot have more than 4,294,967,296 items 
* There cannot be more than 65,536 string literals in the bundle (dictionary keys, import/export labels)

*/

/**
 * Fake DOM environment when from node
 */
if (typeof(document) == "undefined") {

	// Prepare a fake browser
	var MockBrowser = require('mock-browser').mocks.MockBrowser;
	var mock = new MockBrowser();

	// Fake 'self', 'document' and 'window'
	global.document = mock.getDocument(),
	global.self = MockBrowser.createWindow(),
	global.window = global.self;

	// Fake 'XMLHttpRequest' (shall not be used)
	global.XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

}

// Get references to DOM element classes
var ImageElement = document.createElement('img').constructor;
var ScriptElement = document.createElement('script').constructor;

/**
 * Binary Search Tree Helpers
 */
var BinarySearchTree = bst.BinarySearchTree,
	objectBstComparison = function(a,b) {
		for (var i=0; i<a.length; i++) {
			if (a[i] < b[i]) return -1;
			if (a[i] > b[i]) return 1;
			if (a[i] !== b[i]) return 1;
		  /*if (a[i] == b[i]) continue;*/
		}
		return 0;
	},
	objectBstEquals = function(a,b) {
		for (var i=0; i<a.length; i++) {
			if (a[i] !== b[i]) return false;
		}
		return true;
	};

/**
 * Numerical types
 */
var NUMTYPE = {
	// For protocol use
	UINT8: 	 0, INT8:    1,
	UINT16:  2, INT16:   3,
	UINT32:  4, INT32:   5,
	FLOAT32: 6, FLOAT64: 7,
	// For internal use
	UNKNOWN: 8, NAN: 9
};

/**
 * Log flags
 */
var LOG = {
	PRM: 	0x0001, // Primitive messages
	ARR: 	0x0002, // Array messages
	CHU: 	0x0004, // Array Chunk
	STR: 	0x0008, // String buffer
	IREF: 	0x0010, // Internal reference
	XREF: 	0x0020, // External reference
	OBJ: 	0x0040, // Object messages
	EMB: 	0x0080, // Embedded resource
	PLO: 	0x0100, // Simple objects
	BULK: 	0x0200, // Bulk-encoded objects
	SUMM: 	0x2000,	// Log summary
	WRT: 	0x4000, // Debug writes
	PDBG: 	0x8000, // Protocol debug messages
};

/**
 * Log prefix chunks
 */
var LOG_PREFIX_STR = {
	0x0001 	: 'PRM',
	0x0002 	: 'ARR',
	0x0004 	: 'CHU',
	0x0008 	: 'STR',
	0x0010 	: 'IRF',
	0x0020 	: 'XRF',
	0x0040 	: 'OBJ',
	0x0080	: 'EMB',
	0x0100  : 'PLO',
	0x0200  : 'BLK',
	0x2000  : 'SUM',
	0x8000 	: 'DBG',
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
 * Downscaling numtype conversion table from/to
 *
 *  FROM	TO_DWS	TO_DELTA
 *  ------- ------- --------
 *  UINT16	UINT8	INT8
 *  INT16	INT8	INT8
 *  UINT32	UINT8	INT8
 *  INT32	INT8	INT8
 *  UINT32	UINT16	INT16
 *  INT32	INT16	INT16
 *  FLOAT32	INT8	INT8
 *  FLOAT32	INT16	INT16
 *
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
 * Control Op-Codes
 */
var CTRL_OP = {
	ATTRIB 	: 0x80,		// Attribute
	EXPORT	: 0xF8, 	// External Export
	EMBED 	: 0xF9, 	// Embedded resource
};

/**
 * Primitive Op-Codes
 */
var PRIM_OP = {
	ARRAY: 		0x00, 	// Array
	OBJECT: 	0x80, 	// Object / Plain Object [ID=0]
	BUFFER: 	0xC0, 	// Buffer
	REF: 		0xE0, 	// Internal Reference
	NUMBER: 	0xF0, 	// Number
	SIMPLE: 	0xF8, 	// Simple
	SIMPLE_EX:	0xFC,	// Extended simple primitive
	IMPORT: 	0xFE, 	// External Import
};

/**
 * Array Op-Codes
 */
var ARR_OP = {
	DELTA:		0x00,	// Delta-Encoded TypedArray
	RAW:		0x40,	// RAW Typed Array
	REPEATED:	0x50,	// Repeated TypedArray
	DOWNSCALED:	0x60,	// Downscaled TypedArray
	SHORT:		0x70,	// Short TypedArray (0-255)
	PRIM_FLAG:	0x78,	// A flag when processing a primitive array
	PRIMITIVE:	0x7C,	// Primitive Array
	EMPTY:		0x7E,	// Empty Array
};

/**
 * Array chunk types
 */
var ARR_CHUNK = {
	// For protocol use
	REPEAT: 	0, 	// Repeat the next primitive 1-254 times
	NUMERIC: 	1, 	// There are 1-254 consecutive numerical items
	BULK_PLAIN:	2,	// A bulk of many objects of same type
	// For internal use
	PRIMITIVE: 	4, 	// No chunking available, encode individual primitive
	PRIM_IREF:  5, 	// Internal reference primitive (speed optimisation)
	PRIM_XREF:  6, 	// Internal reference primitive (speed optimisation)
};

/**
 * Simple primitives
 */
var PRIM_SIMPLE = {
	UNDEFINED: 	0,
	NULL: 		1,
	FALSE: 		2,
	TRUE: 		3
};

/**
 * Extended simple primitives
 */
var PRIM_SIMPLE_EX = {
	NAN: 	0,
};

/**
 * Buffer primitive MIME Types
 */
var PRIM_BUFFER_TYPE = {
	STRING_LATIN: 	 0,
	STRING_UTF8: 	 1,
	BUF_IMAGE: 		 2,
	BUF_SCRIPT: 	 3,
	RESOURCE: 		 7,
};

/**
 * String representation of numerical type for debug messages
 */
var _NUMTYPE = [
	'UINT8',
	'INT8',
	'UINT16',
	'INT16',
	'UINT32',
	'INT32',
	'FLOAT32',
	'FLOAT64',
	'UNKNOWN',
	'NaN',
];
var _NUMTYPE_DOWNSCALE_DWS = [
	'UINT16 -> UINT8',
	'INT16 -> INT8',
	'UINT32 -> UINT8',
	'INT32 -> INT8',
	'UINT32 -> UINT16',
	'INT32 -> INT16',
	'FLOAT32 -> INT8',
	'FLOAT32 -> INT16'
];
var _NUMTYPE_DOWNSCALE_DELTA = [
	'UINT16 -> INT8',
	'INT16 -> INT8',
	'UINT32 -> INT8',
	'INT32 -> INT8',
	'UINT32 -> INT16',
	'INT32 -> INT16',
	'FLOAT32 -> INT8',
	'FLOAT32 -> INT16'
];

/**
 * Pack accelerators
 */
var packBuffer = new ArrayBuffer(8),
	packViewU8 = new Uint8Array(packBuffer),
	packViewI8 = new Int8Array(packBuffer),
	packViewU16 = new Uint16Array(packBuffer),
	packViewI16 = new Int16Array(packBuffer),
	packViewU32 = new Uint32Array(packBuffer),
	packViewI32 = new Int32Array(packBuffer),
	packViewF32 = new Float32Array(packBuffer),
	packViewF64 = new Float64Array(packBuffer),
	pack1b = function( num, signed ) {
		var n = new Buffer(1);
		if (signed) packViewI8[0] = num;
		else packViewU8[0] = num;
		n[0] = packViewU8[0];
		return n;
	},
	pack2b = function( num, signed ) {
		var n = new Buffer(2);
		if (signed) packViewI16[0] = num;
		else packViewU16[0] = num;
		for (var i=0; i<2; i++) n[i]=packViewU8[i];
		return n;
	},
	pack4b = function( num, signed ) {
		var n = new Buffer(4);
		if (signed) packViewI32[0] = num;
		else packViewU32[0] = num;
		for (var i=0; i<4; i++) n[i]=packViewU8[i];
		return n;
	},
	pack4f = function( num ) {
		var n = new Buffer(4);
		packViewF32[0] = num;
		for (var i=0; i<4; i++) n[i]=packViewU8[i];
		return n;
	},
	pack8f = function( num ) {
		var n = new Buffer(8);
		packViewF64[0] = num;
		for (var i=0; i<8; i++) n[i]=packViewU8[i];
		return n;
	},
	packTypedArray = function( arr ) {
		return new Buffer(arr.buffer);
	},
	packByNumType = [
		pack1b, function(v) { return pack1b(v, true) },
		pack2b, function(v) { return pack2b(v, true) },
		pack4b, function(v) { return pack4b(v, true) },
		pack4f, pack8f
	];

//////////////////////////////////////////////////////////////////
// Binary Stream
//////////////////////////////////////////////////////////////////

/**
 * Binary Stream
 */
var BinaryStream = function( filename, alignSize, logWrites ) {

	// Local properties
	this.offset = 0;
	this.blockSize = 1024 * 16;
	this.logWrites = logWrites;

	// Private properties
	this.__writeChunks = [];
	this.__syncOffset = 0;
	this.__fd = null;
	this.__alignSize = 0;

	// Initialize
	this.__alignSize = alignSize || 8;
	this.__fd = fs.openSync( filename, 'w+' );

}

/**
 * Prototype constructor
 */
BinaryStream.prototype = {

	'constructor': BinaryStream,

	/**
	 * Finalise and close stream
	 */
	'close': function() {
		// Close
		fs.closeSync( this.__fd );
	},

	/**
	 * Finalize the stream
	 */
	'finalize': function() {
		// Write alignment padding
		var alignOffset = this.offset % this.__alignSize;
		if (alignOffset > 0) 
			this.write( new Buffer(new Uint8Array( this.__alignSize - alignOffset )) );
		// Synchronize
		this.__sync( true );
	},

	/**
	 * Write a number using the compile function
	 */
	'write': function( buffer ) {
		if (this.logWrites) {
			var bits = String(this.__alignSize*8);
			if (bits.length == 1) bits=" "+bits;
			console.log((bits+"b ").yellow+("@"+this.offset/this.__alignSize).bold.yellow+": "+util.inspect(buffer));
		}
		this.__writeChunks.push( buffer );
		this.offset += buffer.length;
		this.__sync();
	},

	/**
	 * Merge that stream with the current stream
	 */
	'merge': function( otherStream ) {
		var BLOCK_SIZE = this.blockSize,
			buffer = new Buffer( BLOCK_SIZE ),
			offset = 0, readBytes = 0;

		// Sync
		this.__sync( true );

		// console.log("THIS".magenta+" "+this.offset+" == "+this.__syncOffset);

		// Start iterating
		while (offset < otherStream.offset) {

			// Pick size of bytes to read
			readBytes = Math.min( BLOCK_SIZE, otherStream.offset - offset );

			// Read and write
			// console.log("MERGE".magenta+" from["+otherStream.__fd+"]="+offset+", to["+this.__fd+"]="+this.offset+", range="+readBytes);
			fs.readSync( otherStream.__fd, buffer, 0, readBytes, offset );
			fs.writeSync( this.__fd, buffer, 0, readBytes, this.offset );

			// Forward offsets
			offset += readBytes;
			this.offset += readBytes;
			this.__syncOffset += readBytes;

		}

	},

	/**
	 * Synchronize write chunks to the file
	 */
	'__sync': function( flush ) {
		var BLOCK_SIZE = this.blockSize;
		
		// Write chunks
		while (true) {
			// Proceeed only with enough data
			var dataLength = this.offset - this.__syncOffset;
			if (dataLength < BLOCK_SIZE) break;
		
			// Concat buffers
			var buf = Buffer.concat( this.__writeChunks );

			// Put buffer tail back so we always flush up to BLOCK_SIZE bytes
			this.__writeChunks = [];
			if (dataLength > BLOCK_SIZE) this.__writeChunks.push(buf.slice(BLOCK_SIZE));

			// Write buffer
			fs.writeSync( this.__fd, buf, 0, BLOCK_SIZE, this.__syncOffset );
			this.__syncOffset += BLOCK_SIZE;

			// Check if done
			if (this.__syncOffset >= this.offset) break;
		}

		// Flush remaining bytes if requested
		if (flush && (this.offset > this.__syncOffset)) {
			var buf = Buffer.concat( this.__writeChunks );
			this.__writeChunks = [];

			// Write whatever remains
			fs.writeSync( this.__fd, buf, 0, buf.length, this.__syncOffset );
			this.__syncOffset += buf.length;
		}

	},

}

//////////////////////////////////////////////////////////////////
// Analysis and Encoding helper functions
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
	if (scale == DELTASCALE.S_1)
		return 1.0;
	else if (scale == DELTASCALE.S_001)
		return 0.01;
	else {
		var multiplier = 1.0;
		if (scale == DELTASCALE.S_R00) multiplier = 100.0;
		// Check for INT8 target
		if ( ((t >= 0) && (t <= 3)) || (t == 6) ) {
			return multiplier * 127;
		} else {
			return multiplier * 32768;
		}
	}
}

/**
 * Check if the specified object is an empty array
 */
function isEmptyArray(v) {
	if ((v instanceof Uint8Array) || (v instanceof Int8Array) ||
		(v instanceof Uint16Array) || (v instanceof Int16Array) ||
		(v instanceof Uint32Array) || (v instanceof Int32Array) ||
		(v instanceof Float32Array) || (v instanceof Float64Array) ||
		(v instanceof Array) ) {
		return (v.length == 0);
	}
	return false;
}

/**
 * Check if the specified type is float
 *
 * Works also on downscaled types because the last two 'FROM' 
 * conversions are FLOAT32.
 *
 * @param {int} t - The NUMTYPE or NUMTYPE_DOWNSCALE type to check
 * @returns {boolean} - True if it's a float type (or float source type)
 */
function isFloatType(t) {
	return (t >= NUMTYPE.FLOAT32);
}

/**
 * Return the array size in bytes of the specified type
 *
 * @param {int} t - The NUMTYPE type to check
 * @returns {int} - Returns the size in bytes to hold this type
 */
function sizeOfType(t) {
	switch (t) {
		case NUMTYPE.UINT8:
		case NUMTYPE.INT8:
			return 1;
		case NUMTYPE.UINT16:
		case NUMTYPE.INT16:
			return 2;
		case NUMTYPE.UINT32:
		case NUMTYPE.INT32:
		case NUMTYPE.FLOAT32:
			return 4;
		case NUMTYPE.FLOAT64:
			return 8;
	}
	return 0;
}

/**
 * Get the numerical type of a typed array
 *
 * @param {array} v - The TypedArray to check
 * @returns {int} - Returns the NUMTYPE type for the specified array or NUMTYPE.UNKNOWN if not a TypedArray
 */
function getTypedArrayType( v ) {
	if (v instanceof Float32Array) {
		return NUMTYPE.FLOAT32;
	} else if (v instanceof Float64Array) {
		return NUMTYPE.FLOAT64;
	} else if (v instanceof Uint8Array) {
		return NUMTYPE.UINT8;
	} else if (v instanceof Int8Array) {
		return NUMTYPE.INT8;
	} else if (v instanceof Uint16Array) {
		return NUMTYPE.UINT16;
	} else if (v instanceof Int16Array) {
		return NUMTYPE.INT16;
	} else if (v instanceof Uint32Array) {
		return NUMTYPE.UINT32;
	} else if (v instanceof Int32Array) {
		return NUMTYPE.INT32;
	} else  {
		return NUMTYPE.UNKNOWN;
	}
}

/**
 * Get the smallest possible numeric type fits this number
 *
 * @param {number} - The number to test
 * @return {NUMTYPE} - The numerical type to rerutn
 */
function getNumType( v ) {
	if (typeof v != "number") return NUMTYPE.NAN;
	if (isNaN(v)) return NUMTYPE.NAN;

	if (v % 1 !== 0) {
		// Check for Float32 or Float64
		if (Math.abs(v) < 3.40282e+38) {
			return NUMTYPE.FLOAT32;
		} else {
			return NUMTYPE.FLOAT64;
		}
	} else {
		// Check for signed or unsigned
		if (v < 0) {
			if (v >= -128) {
				return NUMTYPE.INT8;
			} else if (v >= -32768) {
				return NUMTYPE.INT16;
			} else if (v >= -2147483648) {
				return NUMTYPE.INT32;
			} else {
				return NUMTYPE.FLOAT64;
			}
		} else {
			if (v < 256) {
				return NUMTYPE.UINT8;
			} else if (v < 65536) {
				return NUMTYPE.UINT16;
			} else if (v < 4294967296) {
				return NUMTYPE.UINT32;
			} else {
				return NUMTYPE.FLOAT64;
			}
		}
	}
}

/**
 * Pick a matching downscaling type
 */
function downscaleType( fromType, toType ) {
	// Lookup conversion on the downscale table
	for (var i=0; i<NUMTYPE_DOWNSCALE.FROM.length; i++) {
		if ( (NUMTYPE_DOWNSCALE.FROM[i] == fromType) && 
			 (NUMTYPE_DOWNSCALE.TO_DWS[i] == toType) )
			return i;
	}
	// Nothing found
	return undefined;
}

/**
 * Pick a matching delta encoding downlscale type
 */
function deltaEncType( fromType, toType ) {
	// Lookup conversion on the downscale table
	for (var i=0; i<NUMTYPE_DOWNSCALE.FROM.length; i++) {
		if ( (NUMTYPE_DOWNSCALE.FROM[i] == fromType) && 
			 (NUMTYPE_DOWNSCALE.TO_DELTA[i] == toType) )
			return i;
	}
	// Nothing found
	return undefined;
}

/**
 * Calculate the possibility to use delta encoding to downscale
 * the array if we have the specified maximum delta
 */
function analyzeDeltaBounds( min_delta, max_delta, is_float, precisionOverSize ) {
	if (is_float) {

		if (max_delta < 0.01) { // 0.0 - 0.01 Scale
			return [ DELTASCALE.S_R00, precisionOverSize ? NUMTYPE.INT16 : NUMTYPE.INT8 ];
		} else if (max_delta <= 1.0) { // 0.0 - 1.0 scale
			return [ DELTASCALE.S_R, precisionOverSize ? NUMTYPE.INT16 : NUMTYPE.INT8 ];
		} else if ((min_delta >= 100.0) && (max_delta <= 32767.0)) { // 100.0 - 32767.0
			return [ DELTASCALE.S_001, NUMTYPE.INT16 ];
		}

	} else {

		// We have integer delta, so check 
		if (max_delta < 127) {
			// A value between 0 and INT8 bounds
			return [ DELTASCALE.S_1, NUMTYPE.INT8 ];
		} else if ((max_delta < 12700) && !precisionOverSize) {
			// A value between 0 and INT8 bounds scaled down by factor 100  (loosing in precision)
			return [ DELTASCALE.S_001, NUMTYPE.INT8 ];
		} else if (max_delta < 32767) {
			// A value between 0 and INT16 bounds
			return [ DELTASCALE.S_1, NUMTYPE.INT16 ];
		} else if ((max_delta < 3276700) && !precisionOverSize) {
			// A value between 0 and INT16 bounds scaled down by factor 100  (loosing in precision)
			return [ DELTASCALE.S_001, NUMTYPE.INT16 ];
		}

	}

	// Nothing found or not efficient to use delta encoding
	return undefined;
}

/**
 * Analyze numeric array and return the smallest numerical type
 * that will fit the specified array
 *
 * Returns an array with three elements:
 * [
 *   NUMARR, 	// What kind of numeric encoding is recommended
 *   TYPE, 		// What kind of underlaying numeric type to use (or downscaled type if appiable)
 *  (SCALE), 	// When downscaling float with delta encoding, this holds the scale used
 * ]
 *
 * @param {array} - The array to analyze
 * @param {boolean} allowMixFloats - Allow mixing of floats and integers (not always good)
 * @param {boolean} precisionOverSize - Prefer precision over size
 */
function analyzeNumArray( array, allowMixFloats, precisionOverSize ) {
	var min = array[0], max = array[0], // Bounds
		is_integer = false,	is_float = false, // Types
		is_repeated = true, rep_v = array[0], // Same values
		last_v = array[0], min_delta = null, max_delta = null; // Deltas

	// Bypass alloxMixFloats when we have FloatXX arrays
	if ((array instanceof Float32Array) || (array instanceof Float64Array)) {
		allowMixFloats = true;
	}

	// Iterate over array entries
	for (var i=0; i<array.length; i++) {
		var n = array[i], d=0;
		// Update bounds
		if (n > max) max = n;
		if (n < min) min = n;
		// Update delta
		if (i>0) {
			d = Math.abs(last_v - n);
			if (i ==1) {
				min_delta = d;
				max_delta = d;
			} else {
				if (d > max_delta) max_delta = d;
				if (d < min_delta) min_delta = d;
			}
		}
		last_v = n;
		// Same values
		if (is_repeated && (n != rep_v)) is_repeated = false;
		// Skip zeros from type detection
		if (n == 0) continue;
		// Check for float
		if (n % 1 === 0) {
			// Mark integer fields
			if (!is_integer) is_integer=true;
			// Do not mix integers and floats (unless that's zero)
			if (is_float && !allowMixFloats) return undefined;
		} else {
			// Float
			if (!is_float) is_float=true;
			// Do not mix integers and floats (unless that's zero)
			if (is_integer && !allowMixFloats) return undefined;
		}
	}

	// If neither integer or float, it's zero (just a fallback case)
	if (!is_integer && !is_float) {
		return [ ARR_OP.REPEATED, NUMTYPE.UINT8 ];
	}

	// Pick a numerical type according to bounds
	var type = null;
	if (is_float) {
		// Check Float bounds
		if (Math.max( Math.abs(max), Math.abs(min) ) >= 3.40282e+38) {
			type = NUMTYPE.FLOAT64;
		} else {
			type = NUMTYPE.FLOAT32;
		}
	} else {
		if (min < 0) {
			// Check signed bounds
			if ((min >= -128) && (max <= 127)) {
				type = NUMTYPE.INT8;
			} else if ((min >= -32768) && (max <= 32767)) {
				type = NUMTYPE.INT16;
			} else if ((min >= -2147483648) && (max <= 2147483647)) {
				type = NUMTYPE.INT32;
			} else {
				type = NUMTYPE.FLOAT64;
			}
		} else {
			// Check unsigned bounds
			if (max < 256) {
				type = NUMTYPE.UINT8;
			} else if (max < 65536) {
				type = NUMTYPE.UINT16;
			} else if (max < 4294967296) {
				type = NUMTYPE.UINT32;
			} else {
				type = NUMTYPE.FLOAT64;
			}
		}
	}

	// Get original type (if typed array) of the array
	var originalType = getTypedArrayType( array );
	if (originalType == NUMTYPE.UNKNOWN) originalType = type;

	// If same value repeated, that's a repeated array
	if (is_repeated) {
		return [ ARR_OP.REPEATED, originalType ];
	}

	// Calculate original vs downscaled size
	var originalSize = sizeOfType( originalType ) * array.length,
		downscaleSize = sizeOfType( type ) * array.length + 2;

	// If length is small enough and downscaling is not really
	// helping much, prefer chunking and/or downscaling
	if ((array.length < 256) && (downscaleSize >= originalSize)) {
		return [ ARR_OP.SHORT, originalType ]; 
	}

	// Check if we can apply delta encoding with better type than the current
	var delta = analyzeDeltaBounds( min_delta, max_delta, is_float, precisionOverSize );
	if ((delta !== undefined) && (delta[1] < originalType)) {

		// Find a matching delta encoding type
		var delta_type = deltaEncType( originalType, delta[1] );
		if (delta_type == undefined) {
			console.warn("Consider protocol revision: No compact type match for delta from="+_NUMTYPE[originalType]+", to="+_NUMTYPE[delta[1]]);
		} else {

			// Calculate downscaled size
			var deltaSize = sizeOfType( NUMTYPE_DOWNSCALE.TO_DELTA[delta_type] ) * array.length 
							+ sizeOfType( originalType );

			// Prefer delta encoding only if it optimises for size, since
			// downscaling can be faster!
			if (deltaSize < originalSize)
				return [ ARR_OP.DELTA, delta_type, delta[0] ];

		}

	}

	// Check for downscaling
	if (originalType != type) {
		if (type < originalType) {

			// Find a matching downscale type
			var dws_type = downscaleType( originalType, type );
			if (dws_type == undefined) {
				console.warn("Consider protocol revision: No compact type match for downscaling from="+_NUMTYPE[originalType]+", to="+_NUMTYPE[type]);
				type = originalType;
			} else {
				// We are downscaling
				return [ ARR_OP.DOWNSCALED, dws_type ];
			}

		} else {
			// Assert - We are upscaling?!!! Something's wrong!
			throw {
				'name' 		: 'AssertError',
				'message'	: 'A type was upscaled instead of downscaled! This should never happen!',
				toString 	: function(){return this.name + ": " + this.message;}
			};
		}
	} 

	// Nothing else works? Keep it as a raw array
	return [ ARR_OP.RAW, type ];

}

/**
 * Encode an integer array with delta encoding
 *
 * @param {array} - Source Array
 * @param {Class} - The class of the underlaying numeric array (ex. Uint8Array)
 *
 * @return {array} - An array with the initial value and the delta-encoded payload
 */
function deltaEncodeIntegers( array, arrayClass ) {
	var delta = new arrayClass( array.length - 1 ), l = array[0];
	for (var i=1; i<array.length; i++) {
		var v = array[i]; delta[i-1] = v - l; l = v;
	}
	return delta;
}

/**
 * Encode a float array with delta encoding
 *
 * @param {array} - Source Array
 * @param {Class} - The class of the underlaying numeric array (ex. Uint8Array)
 * @param {float} - Difference scale
 *
 * @return {array} - An array with the initial value and the delta-encoded payload
 */
function deltaEncodeFloats( array, arrayClass, scale ) {
	var delta = new arrayClass( array.length - 1 ), l = array[0];
	for (var i=1; i<array.length; i++) {
		var v = array[i]; delta[i-1] = ((v - l) * scale) | 0; l = v;
	}
	return delta;
}

/**
 * Convert input array to the type specified
 * 
 * @param {array} array - The source array
 * @param {int} downscale_type - The downscaling conversion
 */
function convertArray( array, numType ) {

	// Skip matching cases
	if ( ((array instanceof Uint8Array) && (numType == NUMTYPE.UINT8)) ||
		 ((array instanceof Int8Array) && (numType == NUMTYPE.INT8)) ||
		 ((array instanceof Uint16Array) && (numType == NUMTYPE.UINT16)) ||
		 ((array instanceof Int16Array) && (numType == NUMTYPE.INT16)) ||
		 ((array instanceof Uint32Array) && (numType == NUMTYPE.UINT32)) ||
		 ((array instanceof Int32Array) && (numType == NUMTYPE.INT32)) ||
		 ((array instanceof Float32Array) && (numType == NUMTYPE.FLOAT32)) ||
		 ((array instanceof Float64Array) && (numType == NUMTYPE.FLOAT64)) ) {

		// Return as-is
		return array;
	}

	// Convert
	var ans = new NUMTYPE_CLASS[numType]( array.length );
	for (var i=0, len=array.length; i<len; i++) ans[i] = array[i];
	return ans;
}

/**
 * Pick MIME type according to filename and known MIME Types
 */
function mimeTypeFromFilename( filename ) {
	var ext = filename.split(".").pop().toLowerCase();
	return mime.lookup(filename) || "application/octet-stream";
}

/**
 * Load a Uint8Array buffer from file
 */
function bufferFromFile( filename ) {
	console.info( ("Loading "+filename).grey );
	var buf = fs.readFileSync( filename ),	// Load Buffer
    	ab = new ArrayBuffer( buf.length ),	// Create an ArrayBuffer to fit the data
    	view = new Uint8Array(ab);			// Create an Uint8Array view

    // Copy buffer into view
    for (var i = 0; i < buf.length; ++i)
        view[i] = buf[i];

    // Return buffer view
    return view;
}

//////////////////////////////////////////////////////////////////
// Encoding function
//////////////////////////////////////////////////////////////////

var FOR_NUMTYPE = 0,
	FOR_DWS_TO = 1,
	FOR_DELTA_TO = 2,
	FOR_DELTA_FROM = 3;

/**
 * Select an encoder according to bit size
 */
function pickStream(encoder, t, encType) {

	// If we have an encoded type, change type now
	if (encType == FOR_DWS_TO) { // Downscale type
		t = NUMTYPE_DOWNSCALE.TO_DWS[t];
	} else if (encType == FOR_DELTA_TO) { // Delta type
		t = NUMTYPE_DOWNSCALE.TO_DELTA[t];
	} else if (encType == FOR_DELTA_FROM) { // From downscale
		t = NUMTYPE_DOWNSCALE.FROM[t];
	}

	// Handle type
	switch (t) {
		case NUMTYPE.UINT8:
		case NUMTYPE.INT8:
			return encoder.stream8;
		case NUMTYPE.UINT16:
		case NUMTYPE.INT16:
			return encoder.stream16;
		case NUMTYPE.UINT32:
		case NUMTYPE.INT32:
		case NUMTYPE.FLOAT32:
			return encoder.stream32;
		case NUMTYPE.FLOAT64:
			return encoder.stream64;
	}

}

/**
 * Write a numerical array header + length
 */
function encodeNumArrayHeader( encoder, array, op ) {
	// Write header
	if ((op & 0xF8) == ARR_OP.SHORT) { // 8-bit length prefix
		encoder.stream8.write( pack1b( op ) );
		encoder.stream8.write( pack1b( array.length, false ) );
		encoder.counters.arr_hdr+=2;
	} else if (array.length < 65536) { // 16-bit length prefix
		encoder.stream8.write( pack1b( op ) );
		encoder.stream16.write( pack2b( array.length, false ) );
		encoder.counters.arr_hdr+=3;
	// } else if (array.length < 256) { // 16-bit length prefix
	// 	encoder.stream8.write( pack1b( op ) );
	// 	encoder.stream8.write( pack1b( array.length, false ) );
	// 	encoder.counters.arr_hdr+=2;
	} else if (array.length < 4294967296) { // 32-bit length prefix
		encoder.stream8.write( pack1b( op | 0x08 ) );
		encoder.stream32.write( pack4b( array.length, false ) );
		encoder.counters.arr_hdr+=5;
	} else {
		throw {
			'name' 		: 'RangeError',
			'message'	: 'Array length does not fit in 32-bits!',
			toString 	: function(){return this.name + ": " + this.message;}
		};
	}
}

/**
 * Isolate the next chunk of interest in a primitive array
 *
 * Returns an array with the following items:
 * [
 *   ARR_CHUNK, 	// The Type of the chunk
 *   LENGTH,		// The lengh of relevant items
 *   NUM_TYPE,		// The numerical type of the repeated item
 * ]
 *
 * @param {BinaryEncoder} encoder - The encoder to use
 * @param {array} array - The source array to analyze
 * @param {int} start - The stating index of the analysis
 * @param {boolean} enableBulkDetection - Enable the detection of bulk objects
 * @return {array} - Returns an array with [ CHUNK_TYPE, LENGTH ]
 *
 */
function chunkForwardAnalysis( encoder, array, start, enableBulkDetection ) {
	var last_v = array[start], rep_val = 0,
		last_t = getNumType( last_v ), rep_typ = 0,
		plain_rep = 0, plain_keys = [],
		ref_list = [];

	// console.log(("-- CFWA BEGIN ofs="+start).red);
	// console.log(("-- CFWA last_t="+last_t+", last_v="+last_v).red);

	// Prepare signature 
	if (enableBulkDetection && (last_v != null) && (last_v.constructor === ({}).constructor)) {
		plain_keys = Object.keys( last_v );
	}

	// Analyze array			
	for (var i=start+1; i<array.length; i++) {
		var v = array[i], break_candidate = true;

		// Check for same value
		if ( (v === last_v) || (isEmptyArray(last_v) && isEmptyArray(v)) ) {
			// We are not breaking
			break_candidate = false;
			// Increment up to 255
			if (++rep_val == 255) break;
		}

		// Check for same constructor
		if (typeof v == "number") {

			// Check for same type
			var t = getNumType( v );
			// console.log(("-- CFWA array["+i+"]="+v+", t="+t).red);
			if (last_t != NUMTYPE.NAN) { // Check for numeric type repetition only
				if (t <= last_t) {
					// Make sure we are not mixing floats with integers
					if ((last_t >= NUMTYPE.FLOAT32) && (t < NUMTYPE.FLOAT32)) break;
					// We are not breaking
					break_candidate = false;
					// Increment up to 255
					if (++rep_typ == 255) break;
				}
			}

		} else if (enableBulkDetection && break_candidate && (v != null) && (v.constructor === ({}).constructor)) {

			// Check if signature is still the same
			var v_keys = Object.keys(v), new_keys = [];
			for (var i=0, llen=v_keys.length; i<llen; i++) {
				// Inject new keys (and count them)
				if (plain_keys.indexOf(v_keys[i]) < 0)
					new_keys.push( v_keys[i] );
			}

			// Break if we have added more than 25% of the original
			var nk = new_keys.length;
			if (nk < plain_keys.length * 0.25) {
				// Merge new keys
				if (nk>0) plain_keys = plain_keys.concat( new_keys );
				// We are not breaking
				break_candidate = false;
				// Increment up to 65535
				if (++plain_rep == 65535) break;
			}

		}

		// Break if we have a break candidate
		if (break_candidate) break;

	}

	// console.log(("-- CFWA ofs="+start+", rep_typ="+rep_typ+", rep_val="+rep_val).red);

	// Return appropriate chunk
	if ((plain_rep > 0) && (rep_val == 0)) {
		// Multiple plain objects are bulked
		return [ ARR_CHUNK.BULK_PLAIN, plain_rep+1, plain_keys ];

	} else if ((rep_val == 0) && (rep_typ ==0)) {
		// Do not use chunks, rather use a single primitive for representing zero value
		return [ ARR_CHUNK.PRIMITIVE, 1, last_t ];

	} else if ((rep_val == 0) && (rep_typ > 0)) {
		// We have repeated type (numeric)
		return [ ARR_CHUNK.NUMERIC, rep_typ+1, last_t ];

	} else if ((rep_val > 0) && (rep_typ == 0)) {
		// We have repeated type
		return [ ARR_CHUNK.REPEAT, rep_val+1, last_t ];

	} else {
		// Prefer repetition of value
		return [ ARR_CHUNK.REPEAT, rep_val+1, last_t ];
	}

}

/**
 * Encode numeric-only array
 */
function encodeNumArray( encoder, data ) {

	// Run analysis on the numbers and return false if not numbers
	var numAnalysis = analyzeNumArray( data, /* optimisation flags -> */ false, true );
	if (numAnalysis == undefined)
		return false;

	// Cache properties
	var arrOp = numAnalysis[0], arrType = numAnalysis[1], floatScale = numAnalysis[2] || 0, stream;

	// Write header & array
	encodeNumArrayHeader( encoder, data, arrOp | arrType | ((floatScale & 0x3) << 4) );
	switch (arrOp) {

		// Write a downscaled array
		case ARR_OP.DOWNSCALED:
			encoder.log(LOG.ARR, "downscaled, from="+_NUMTYPE[NUMTYPE_DOWNSCALE.FROM[arrType]]+", to="+_NUMTYPE[NUMTYPE_DOWNSCALE.TO_DWS[arrType]]+", len="+data.length);
			pickStream( encoder, arrType, FOR_DWS_TO)
				.write( packTypedArray( convertArray(data, NUMTYPE_DOWNSCALE.TO_DWS[arrType] ) ) );
			break;

		// Write a delta-encoded array
		case ARR_OP.DELTA:

			// Write first value
			pickStream( encoder, arrType, FOR_DELTA_FROM )
				.write( packByNumType[ NUMTYPE_DOWNSCALE.FROM[arrType] ]( data[0] ) );

			// Floats have also scale
			if (isFloatType(arrType)) {
				encoder.log(LOG.ARR, "delta, from="+_NUMTYPE[NUMTYPE_DOWNSCALE.FROM[arrType]]+", to="+_NUMTYPE[NUMTYPE_DOWNSCALE.TO_DELTA[arrType]]+", scale="+getFloatDeltaScale(arrType,numAnalysis[2])+", len="+data.length);
				pickStream( encoder, arrType, FOR_DELTA_TO)
					.write( packTypedArray( 
						deltaEncodeFloats(
							data,
							NUMTYPE_DOWNSCALE_DELTA_CLASS[arrType],
							getFloatDeltaScale(
								arrType,
								numAnalysis[2]
							))
					) );
			} else {
				encoder.log(LOG.ARR, "delta, from="+_NUMTYPE[NUMTYPE_DOWNSCALE.FROM[arrType]]+", to="+_NUMTYPE[NUMTYPE_DOWNSCALE.TO_DELTA[arrType]]+", len="+data.length);
				pickStream( encoder, arrType, FOR_DELTA_TO)
					.write( packTypedArray( 
						deltaEncodeIntegers(
							data,
							NUMTYPE_DOWNSCALE_DELTA_CLASS[arrType]
							) 
					) );
			}
			break;

		// An array of repeated single number
		case ARR_OP.REPEATED:

			// Write first element
			encoder.log(LOG.ARR, "repeated, type="+_NUMTYPE[arrType]+", value="+data[0]+", len="+data.length);
			pickStream( encoder, arrType )
				.write( packByNumType[arrType]( data[0] ) );
			break;

		// Raw typed array
		case ARR_OP.RAW:

			// Write first element
			encoder.log(LOG.ARR, "raw, type="+_NUMTYPE[arrType]+", len="+data.length);
			pickStream( encoder, arrType )
				.write( packTypedArray( convertArray(data, arrType) ) );
			break;

		// A short array
		case ARR_OP.SHORT:

			// Write index
			encoder.log(LOG.ARR, "short, type="+_NUMTYPE[arrType]+", len="+data.length+", data="+data);
			pickStream( encoder, arrType )
				.write( packTypedArray( convertArray(data, arrType) ) );
			break;

	}

	// We are good
	return true;

}

/**
 * Encode a bulk of entities by weaving their properties
 */
function encodeBulkArray( encoder, entities, eid ) {
	var PROPERTIES = encoder.objectTable.PROPERTIES[eid],
		weaveArrays = [];

	// Write entity ID
	encoder.stream16.write( pack2b( eid, true ) );

	// Write bulked properties
	for (var i=0, pl=PROPERTIES.length; i<pl; i++) {

		// Read property of all entities
		var prop = [], p = PROPERTIES[i];
		for (var j=0, el=entities.length; j<el; j++) {
			prop.push( entities[j][p] );
		}

		// Write optimised properties of all entities
		encodeArray( encoder, prop );

		// // Read property of all entities
		// var p = PROPERTIES[i];
		// for (var j=0, el=entities.length; j<el; j++) {
		// 	weaveArrays.push( entities[j][p] );
		// }

	}

	// encodeArray( encoder, weaveArrays );

}

/**
 * Encode a bulk of plain objects with weaved properties
 */
function encodePlainBulkArray_v1( encoder, entities, properties ) {

	// Weave all properties
	var props = [], pl = properties.length;
	for (var i=0, il=entities.length; i<il; i++)
		for (var j=0; j<pl; j++)
			props.push( entities[i][properties[j]] );

	// Write down the keys
	encoder.stream8.write( pack1b( pl , false ) );
	for (var i=0; i<pl; i++)
		encoder.stream16.write( pack2b( encoder.stringID(properties[i]) ) );

	// Encode array
	encoder.log( LOG.BULK, "Bulk len="+entities.length+", signature="+properties.join("+") );
	encodePrimitive( encoder, props );

}


/**
 * Encode a bulk of plain objects with weaved properties
 */
function encodePlainBulkArray( encoder, entities, properties ) {

	// Write down the keys
	encoder.stream8.write( pack1b( pl , false ) );
	for (var i=0; i<pl; i++)
		encoder.stream16.write( pack2b( encoder.stringID(properties[i]) ) );

	// Encode array
	encoder.log( LOG.BULK, "Bulk len="+entities.length+", signature="+properties.join("+") );

	// Write bulked properties
	for (var i=0, pl=properties.length; i<pl; i++) {

		// Read property of all entities
		var prop = [], p = properties[i];
		for (var j=0, el=entities.length; j<el; j++) {
			prop.push( entities[j][p] );
		}

		// Write optimised properties of all entities
		encodeArray( encoder, prop );

	}

}

/**
 * Encode the specified array
 */
function encodeArray( encoder, data ) {

	// Check for empty array
	if (data.length == 0) {
		encoder.log(LOG.ARR, "empty");
		encoder.stream8.write( pack1b( ARR_OP.EMPTY ) );
		encoder.counters.op_prm+=1;
		return;
	}

	// Check for numerical array
	if ((data instanceof Uint8Array) || (data instanceof Int8Array) ||
		(data instanceof Uint16Array) || (data instanceof Int16Array) ||
		(data instanceof Uint32Array) || (data instanceof Int32Array) ||
		(data instanceof Float32Array) || (data instanceof Float64Array) ||
		((data instanceof Array) && (data.every(function(v){ return typeof v === 'number'; }))) ) {

		// Encode numeric array
		if (encodeNumArray(encoder, data))
			return;

	}

	// If not numeric, process array in chunks of up to 255 items
	// that share a characteristic
	encoder.log(LOG.ARR, "primitive, len="+data.length+", [");
	encoder.logIndent(1);

	// Write header & array
	encodeNumArrayHeader( encoder, data, ARR_OP.PRIMITIVE );

	// Write chunks with forward analysis
	for (var i=0, llen=data.length; i<llen;) {

		// Forward chunk analysis
		var chunk = chunkForwardAnalysis( encoder, data, i, true ),
			chunkType = chunk[0], chunkSize = chunk[1], chunkSubType = chunk[2];

		// Handle chunk data
		switch (chunkType) {
			case ARR_CHUNK.REPEAT:

				// Write header
				encoder.log(LOG.CHU, "repeated x"+chunkSize);
				encoder.stream8.write( pack1b( ARR_OP.PRIM_FLAG | ARR_CHUNK.REPEAT ) );
				encoder.stream8.write( pack1b( chunkSize-1 ) );
				encoder.counters.arr_chu+=2;

				// Write the repeated primitive
				encodePrimitive( encoder, data[i] );
				break;

			case ARR_CHUNK.NUMERIC:

				// Write header
				encoder.log(LOG.CHU, "numeric x"+chunkSize+", type="+_NUMTYPE[chunkSubType]);
				encoder.stream8.write( pack1b( ARR_OP.PRIM_FLAG | ARR_CHUNK.NUMERIC ) );
				encoder.counters.arr_chu+=1;

				// Write the numeric array
				if (!encodeNumArray(encoder, data.slice(i, i+chunkSize))) {
					throw {
						'name' 		: 'AssertError',
						'message'	: 'Forward analysis reported numeric chunk but numeric encoding failed! Data:'+util.inspect(data.slice(i, i+chunkSize)),
						toString 	: function(){return this.name + ": " + this.message;}
					}
				}					
				break;

			case ARR_CHUNK.BULK_PLAIN:

				// Write header
				encoder.log(LOG.CHU, "bulk x"+chunkSize+", signature="+chunkSubType.join("+"));
				encoder.stream8.write( pack1b( ARR_OP.PRIM_FLAG | ARR_CHUNK.BULK_PLAIN ) );
				encoder.stream16.write( pack2b( chunkSize, false ) );
				encoder.counters.arr_chu+=3;

				encodePlainBulkArray( encoder, data.slice(i, i+chunkSize), chunkSubType );
				break;

			case ARR_CHUNK.PRIM_IREF:

				// Write the iref
				encoder.log(LOG.CHU, "iref x"+chunkSize+", id="+chunkSubType);
				encodeIREF( encoder, chunkSubType );
				break;

			case ARR_CHUNK.PRIM_XREF:

				// Write the iref
				encoder.log(LOG.CHU, "xref x"+chunkSize+", id="+chunkSubType);
				encodeXREF( encoder, chunkSubType );
				break;

			case ARR_CHUNK.PRIMITIVE:

				// Write the actual primitive
				encoder.log(LOG.CHU, "primitive x"+chunkSize);
				encodePrimitive( encoder, data[i] );
				break;

		}

		// Next chunk
		i += chunkSize;

	}

	encoder.logIndent(-1);
	encoder.log(LOG.ARR, "]");

}

/**
 * Encode buffer in the array
 */
function encodeBuffer( encoder, buffer_type, mime_type, buffer ) {

	// Write buffer header according to buffer length
	if (buffer.length < 256) {
		encoder.stream8.write( pack1b( PRIM_OP.BUFFER | buffer_type | 0x00 ) );
		encoder.stream8.write( pack1b( buffer.length ) );
		encoder.counters.dat_hdr+=2;
	} else if (buffer.length < 65536) {
		encoder.stream8.write( pack1b( PRIM_OP.BUFFER | buffer_type | 0x08 ) );
		encoder.stream16.write( pack2b( buffer.length ) );
		encoder.counters.dat_hdr+=3;
	} else if (buffer.length < 4294967296) {
		encoder.stream8.write( pack1b( PRIM_OP.BUFFER | buffer_type | 0x10 ) );
		encoder.stream32.write( pack4b( buffer.length ) );
		encoder.counters.dat_hdr+=5;
	} else {
		// 4 Gigs? Are you serious? Of course we can fit it in a Float64, but WHY?
		throw {
			'name' 		: 'RangeError',
			'message'	: 'The buffer you are trying to encode is bigger than the supported size!',
			toString 	: function(){return this.name + ": " + this.message;}
		};
	}

	// Write MIME Type (from string lookup table)
	if (mime_type != null) {
		encoder.stream16.write( pack2b( mime_type ) );
		encoder.counters.dat_hdr+=2;
	}

	// Write buffer
	if (buffer_type == PRIM_BUFFER_TYPE.STRING_UTF8) {

		// NOTE: UTF-8 is a special case. For optimisation
		// purposes it's better to use the 16-bit stream
		// rather than downcasting to 8-bit and then 
		// re-constructing the 16-bit stream at decoding time.
		encoder.stream16.write( packTypedArray(buffer) );

	} else {
		encoder.stream8.write( packTypedArray(buffer) );
	}

}

/**
 * Enbode a file as an embedded buffer
 */
function encodeEmbeddedFileBuffer( encoder, buffer_type, filename, mime_type ) {
	// Get MIME And payload
	var mime = mime_type || mimeTypeFromFilename( filename ),
		mime_id = encoder.stringID( mime ),
		buffer = bufferFromFile( filename );

	// Write buffer header
	encoder.log(LOG.EMB,"file='"+filename+"', mime="+mime+", len="+buffer.length);
	encodeBuffer( encoder, buffer_type, mime_id, buffer );

}

/**
 * Enbod a blob as an embedded buffer
 */
function encodeEmbeddedBlobBuffer( encoder, buffer_type, buffer, mime_type ) {
	// Get MIME And payload
	var mime_id = encoder.stringID( mime_type );

	// Write buffer header
	encoder.log(LOG.EMB,"file=[blob]', mime="+mime+", len="+buffer.length);
	encodeBuffer( encoder, buffer_type, mime_id, buffer );

}

/**
 * Encode a string as buffer
 */
function encodeStringBuffer( encoder, str, utf8 ) {

	// If we do not have an explicit utf8 or not decision, pick one now
	if (utf8 === undefined) {
		utf8 = false; // Assume false
		for (var i=0, strLen=str.length; i<strLen; i++) {
			if (str.charCodeAt(i) > 255) {
				utf8 = true; break;
			}
		}
	}

	// Allocate buffer
	var buf, bufView, bufType;
	if (utf8) {
		buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
		bufView = new Uint16Array(buf);
		bufType = PRIM_BUFFER_TYPE.STRING_UTF8;
		encoder.log(LOG.STR,"string='"+str+"', encoding=utf-8, len="+str.length);
	} else {
		buf = new ArrayBuffer(str.length); // 1 byte for each char
		bufView = new Uint8Array(buf);
		bufType = PRIM_BUFFER_TYPE.STRING_LATIN;
		encoder.log(LOG.STR,"string='"+str+"', encoding=latin, len="+str.length);
	}

	// Copy into buffer
	for (var i=0, strLen=str.length; i<strLen; i++) {
		bufView[i] = str.charCodeAt(i);
	}

	// Write down
	encodeBuffer( encoder, bufType, null, bufView );

}

/**
 * Encode an 20-bit I-REF opcode
 */
function encodeIREF( encoder, id ) {
	var hi = (id & 0xF0000) >> 16,
		lo = (id & 0xFFFF)

	// Write opcode splitted inti 8-bit and 16-bit 
	encoder.log(LOG.IREF, "iref="+id);
	encoder.stream8.write( pack1b( PRIM_OP.REF | hi, false ) );
	encoder.stream16.write( pack2b( lo, false ) );
	encoder.counters.op_iref+=3;

}

/**
 * Encode an 16-bit X-REF opcode
 */
function encodeXREF( encoder, id ) {

	// Write opcode for 16-bit lookup 
	encoder.log(LOG.XREF, "xref="+id+" [" + encoder.stringLookup[id] + "]")
	encoder.stream8.write( pack1b( PRIM_OP.IMPORT, false ) );
	encoder.stream16.write( pack2b( id, false ) );
	encoder.counters.op_xref+=3;

}

/**
 * Encode a javascript object
 */
function encodeObject( encoder, object ) {

	// Check ByRef internally
	var id = encoder.lookupIRef( object );
	if (id > -1) { encodeIREF( encoder, id ); return; }

	// Check ByRef externally
	id = encoder.lookupXRef( object );
	if (id > -1) { encodeXREF( encoder, id); return }

	// Lookup object type
	var ENTITIES = encoder.objectTable.ENTITIES, eid = -1;
	try {
	for (var i=0, len=ENTITIES.length; i<len; i++)
		if ((ENTITIES[i].length > 0) && (object instanceof ENTITIES[i][0]))
			{ eid = i; break; }
	} catch (e) {
		console.log("Error on item #",i,":",ENTITIES[i]);
	}

	// If no such entity exists, raise exception
	if (eid < 0) {
		console.log(Object);
		console.log(object);
		throw {
			'name' 		: 'EncodingError',
			'message'	: 'An object trying to encode was not declared in the object table!',
			toString 	: function(){return this.name + ": " + this.message;}
		};
	}

	// Populate property table
	var	PROPERTIES = encoder.objectTable.PROPERTIES[eid],
		propertyTable = new Array( PROPERTIES.length );
	for (var i=0, len=PROPERTIES.length; i<len; i++) {
		propertyTable[i] = object[ PROPERTIES[i] ];
	}

	// Check ByVal ref
	id = encoder.lookupIVal( propertyTable, eid );
	if (id > -1) 
		{ encodeIREF( encoder, id ); return; }

	// Keep this object for internal cross-refferencing
	encoder.log(LOG.OBJ,"eid="+eid+", properties="+propertyTable.length);
	encoder.keepIRef( object, propertyTable, eid );

	// Check if we should use 13-bit or 5-bit index
	if (eid < 16) {

		// Write entity opcode
		encoder.stream8.write( pack1b( PRIM_OP.OBJECT | eid ) );
		encoder.counters.op_prm+=1;

	} else {

		// Split 12-bit number
		var eid_hi = (eid & 0xF00) >> 8,
			eid_lo = eid & 0xFF;

		// Write entity
		encoder.stream8.write( pack1b( PRIM_OP.OBJECT | 0x10 | eid_hi ) );
		encoder.stream8.write( pack1b( eid_lo ) );
		encoder.counters.op_prm+=2;

	}

	// Write property table as an array
	encodeArray( encoder, propertyTable );

}

/**
 * Encode plain object
 */
function encodePlainObject( encoder, object ) {

	// Extract plain object signature
	var o_keys =Object.keys(object),
		signature = o_keys.join("+"),
		sid = encoder.getSignatureID( signature );

	// Prepare values
	var values = [];
	for (var i=0, len=o_keys.length; i<len; i++) values.push( object[o_keys[i]] );

	// If not found, allocate new
	if (sid === undefined) {

		// Register signature
		sid = encoder.defineSignature( signature );
		encoder.log(LOG.PLO, "plain(new), signature="+signature+", sid="+sid);

		// Write entity opcode
		encoder.stream8.write( pack1b( PRIM_OP.OBJECT | 0x30 ) );
		encoder.counters.op_prm+=1;

		// Write length
		encoder.stream16.write( pack2b( o_keys.length, false ) );

		// Write key IDs
		for (var i=0, len=o_keys.length; i<len; i++)
			encoder.stream16.write( pack2b( encoder.stringID(o_keys[i]) ) );
		encoder.counters.ref_str += o_keys.length * 2;

	} else {

		encoder.log(LOG.PLO, "plain["+sid+"], signature="+signature+", sid="+sid);

		// Split entity ID in a 12-bit number
		var sid_hi = (sid & 0xF00) >> 8,
			sid_lo =  sid & 0xFF;

		// We have a known entity ID, re-use it				
		encoder.stream8.write( pack1b( PRIM_OP.OBJECT | 0x20 | sid_hi ) );
		encoder.stream8.write( pack1b( sid_lo ) );
		encoder.counters.op_prm+=2;

	}

	// Keep iref and encode
	encodeArray( encoder, values );

}

/**
 * Encode the specified primitive
 */
function encodePrimitive( encoder, data ) {

	// ===============================
	//  Plain Objects
	// ===============================

	if (data === false) {

		// Write simple primitive
		encoder.log(LOG.PRM, "simple[false]");
		encoder.stream8.write( pack1b( PRIM_OP.SIMPLE | PRIM_SIMPLE.FALSE ) );
		encoder.counters.op_prm+=1;

	} else if (data === true) {

		// Write simple primitive
		encoder.log(LOG.PRM, "simple[true]");
		encoder.stream8.write( pack1b( PRIM_OP.SIMPLE | PRIM_SIMPLE.TRUE ) );
		encoder.counters.op_prm+=1;

	} else if (data === undefined) {

		// Write simple primitive
		encoder.log(LOG.PRM, "simple[undefined]");
		encoder.stream8.write( pack1b( PRIM_OP.SIMPLE | PRIM_SIMPLE.UNDEFINED ) );
		encoder.counters.op_prm+=1;

	} else if (data === null) {

		// Write simple primitive
		encoder.log(LOG.PRM, "simple[null]");
		encoder.stream8.write( pack1b( PRIM_OP.SIMPLE | PRIM_SIMPLE.NULL ) );
		encoder.counters.op_prm+=1;

	// ===============================
	//  Number
	// ===============================

	} else if (typeof data == "number") {

		if (isNaN(data)) {

			// Write extended simple primitive
			encoder.log(LOG.PRM, "simple[NaN]");
			encoder.stream8.write( pack1b( PRIM_OP.SIMPLE_EX | PRIM_SIMPLE_EX.NAN ));
			encoder.counters.op_prm+=1;

		} else {

			// Get type
			var numType = getNumType( data );
			if (numType > NUMTYPE.FLOAT64) {
				throw {
					'name' 		: 'AssertError',
					'message'	: 'A primitive was identified as number but getNumType failed!',
					toString 	: function(){return this.name + ": " + this.message;}
				}
			}

			// Write header
			encoder.log(LOG.PRM, "number, type="+_NUMTYPE[numType]+", n="+data);
			encoder.stream8.write( pack1b( PRIM_OP.NUMBER | numType ) );
			encoder.counters.op_prm+=1;

			// Write data
			pickStream( encoder, numType )
				.write( packByNumType[numType]( data ) );

		}

	// ===============================
	//  Array
	// ===============================

	} else if  ((data instanceof Uint8Array) || (data instanceof Int8Array) ||
				(data instanceof Uint16Array) || (data instanceof Int16Array) ||
				(data instanceof Uint32Array) || (data instanceof Int32Array) ||
				(data instanceof Float32Array) || (data instanceof Float64Array) ||
				(data instanceof Array)) {

		// Write array
		encoder.log(LOG.PRM, "array, len="+data.length+", peek="+data[0]);
		encodeArray( encoder, data );

	// ===============================
	//  Buffers
	// ===============================

	} else if (typeof data == "string") {

		// Write a string buffer primitive
		encoder.log(LOG.PRM, "buffer[string], len="+data.length);
		encodeStringBuffer( encoder, data );

	} else if (data instanceof FileResource) {

		// Embed file resource
		encoder.log(LOG.PRM, "buffer[resource], file="+data.src+", mime="+data.mime);
		encodeEmbeddedFileBuffer( encoder, PRIM_BUFFER_TYPE.RESOURCE, data.src, data.mime );

	} else if (data instanceof BlobResource) {

		// Embed file resource
		encoder.log(LOG.PRM, "buffer[blob], mime="+data.mime);
		encodeEmbeddedBlobBuffer( encoder, PRIM_BUFFER_TYPE.RESOURCE, data.buffer, data.mime );

	} else if (data instanceof ImageElement) {

		// Create a buffer from image
		encoder.log(LOG.PRM, "buffer[image], file="+data.src);
		encodeEmbeddedFileBuffer( encoder, PRIM_BUFFER_TYPE.BUF_IMAGE, data.src );

	} else if (data instanceof ScriptElement) {

		// Create a buffer from image
		encoder.log(LOG.PRM, "buffer[script], file="+data.src);
		encodeEmbeddedFileBuffer( encoder, PRIM_BUFFER_TYPE.BUF_SCRIPT, data.src );

	// ===============================
	//  Objects
	// ===============================

	} else if (data.constructor === ({}).constructor) {

		// Encode plain object
		encoder.log(LOG.PRM, "object[plain]");
		encodePlainObject( encoder, data );

	} else {

		// Encode object
		encoder.log(LOG.PRM, "object[entity]");
		encodeObject( encoder, data );

	}

}


//////////////////////////////////////////////////////////////////
// A Proxy Class for sotring buffers
//////////////////////////////////////////////////////////////////

/**
 * A reference to a local file embedded in the bundle during build time
 */
var FileResource = function( filename, mime_type ) {
	this.src = filename;
	this.mime = mime_type;
}

/**
 * A reference to a blob, embedded in the bundle during build time
 */
var BlobResource = function( buffer, mime_type ) {
	this.buffer = buffer;
	this.mime = mime_type;
}

//////////////////////////////////////////////////////////////////
// Binary Encoder
//////////////////////////////////////////////////////////////////

/**
 * Binary Bundles Encoder
 *
 * @param {string} filename - The output filename
 * @param {object} config - Configurtion parameters for the binary encoder
 */
var BinaryEncoder = function( filename, config ) {

	// Setup config
	this.config = config || {};

	// Debug
	this.logPrefix = "";
	this.logFlags = this.config['log'] || 0x00;

	// Open parallel streams in order to avoid memory exhaustion.
	// The final file is assembled from these chunks
	this.filename = filename;
	this.stream64 = new BinaryStream( filename + '_b64.tmp', 8, ((this.logFlags & LOG.WRT) != 0) );
	this.stream32 = new BinaryStream( filename + '_b32.tmp', 4, ((this.logFlags & LOG.WRT) != 0) );
	this.stream16 = new BinaryStream( filename + '_b16.tmp', 2, ((this.logFlags & LOG.WRT) != 0) );
	this.stream8  = new BinaryStream( filename + '_b8.tmp' , 1, ((this.logFlags & LOG.WRT) != 0) );

	// Counters for optimising the protocol
	this.counters = {
		op_ctr:  0, arr_chu: 0,
		op_prm:  0, dat_hdr: 0,
		ref_str: 0, op_iref: 0,
		arr_hdr: 0, op_xref: 0,
	};

	// Get base dir
	this.baseDir = this.config['base_dir'] || false;
	if (!this.baseDir) {
		// Get base dir
		var parts = this.filename.split("/");
		parts.pop(); this.baseDir = parts.join("/");
		// Add trailing slash
		if (this.baseDir[this.baseDir.length-1] != "/")
			this.baseDir += "/";
	}

	// Get bundle name
	this.bundleName = this.config['name'] || filename.split("/").pop().replace(".3bd","");

	// Get object table
	this.objectTable = this.config['object_table'];

	// Database properties
	this.dbTags = [];
	this.dbObjects = [];
	this.database = {};

	// By-Reference and By-Value lookup tables
	this.indexRef = [];
	this.indexVal = new Array( this.objectTable.ENTITIES.length );

	// String lookup table
	this.stringLookup = [];
	this.stringLookupQuick = {};

	// Plain object signatures lookup table
	this.plainObjectSignatureID = 0;
	this.plainObjectSignatureLookup = {};

}

/**
 * Prototype constructor
 */
BinaryEncoder.prototype = {

	'constructor': BinaryEncoder,

	/**
	 * Fuse parallel streams and close
	 */
	'close': function() {

		// Finalize individual streams
		this.stream64.finalize();
		this.stream32.finalize();
		this.stream16.finalize();
		this.stream8.finalize();

		// Open final stream
		var finalStream = new BinaryStream( this.filename, 8 );
		finalStream.write( pack2b( 0x4233 ) );  				 // Magic header
		finalStream.write( pack2b( this.objectTable.ID ) ); 	 // Object Table ID
		finalStream.write( pack4b( this.stream64.offset ) );     // 64-bit buffer lenght
		finalStream.write( pack4b( this.stream32.offset ) );     // 32-bit buffer lenght
		finalStream.write( pack4b( this.stream16.offset ) );     // 16-bit buffer length
		finalStream.write( pack4b( this.stream8.offset ) );      // 8-bit buffer length
		finalStream.write( pack4b( this.stringLookup.length ) ); // String lookup table length

		// Merge individual streams
		finalStream.merge( this.stream64 );
		finalStream.merge( this.stream32 );
		finalStream.merge( this.stream16 );
		finalStream.merge( this.stream8 );

		// Write down null-terminated string lookup table in the end
		for (var i=0; i<this.stringLookup.length; i++) {
			finalStream.write( new Buffer( this.stringLookup[i] ) );
			finalStream.write( new Buffer( [0] ) );
		}

		// Close
		finalStream.finalize();
		finalStream.close();

		// Close and delete helper stream files
		this.stream8.close();  fs.unlink( this.filename + '_b8.tmp' );
		this.stream16.close(); fs.unlink( this.filename + '_b16.tmp' );
		this.stream32.close(); fs.unlink( this.filename + '_b32.tmp' );
		this.stream64.close(); fs.unlink( this.filename + '_b64.tmp' );

		// Write summar header
		if ((this.logFlags & LOG.SUMM)) {
			console.info("Encoding size =",finalStream.offset,"bytes");
		}

		// Write protocol overhead table
		if ((this.logFlags & LOG.PDBG) != 0) {
			console.info("-----------------------------------");
			console.info(" Binary Protocol Overhead Analysis");
			console.info("-----------------------------------");
			console.info(" 64-bit Stream      : ", this.stream64.offset, "b");
			console.info(" 32-bit Stream      : ", this.stream32.offset, "b");
			console.info(" 16-bit Stream      : ", this.stream16.offset, "b");
			console.info("  8-bit Stream      : ", this.stream8.offset, "b");
			console.info("-----------------------------------");
			console.info(" Control Op-Codes   : ", this.counters.op_ctr, "b");
			console.info(" Primitive Op-Codes : ", this.counters.op_prm, "b");
			console.info(" String References  : ", this.counters.ref_str, "b");
			console.info(" I-Refs             : ", this.counters.op_iref, "b");
			console.info(" X-Refs             : ", this.counters.op_xref, "b");
			console.info(" Array Headers      : ", this.counters.arr_hdr, "b");
			console.info(" Array Chunks       : ", this.counters.arr_chu, "b");
			console.info(" Buffer Headers     : ", this.counters.dat_hdr, "b");
			var sum = this.counters.op_ctr + this.counters.op_prm +
					  this.counters.ref_str + this.counters.op_iref + this.counters.op_xref +
					  this.counters.arr_hdr + this.counters.arr_chu + this.counters.dat_hdr;
			console.info("-----------------------------------");
			var perc = ((sum / finalStream.offset) * 100).toFixed(2);
			console.info(" Total Overhead     : ",sum,"b ("+perc+" %)");
		}

	},

	/**
	 * Allocate new ID to return the ID of an existring
	 * string from file string lookup table.
	 */
	'stringID': function(string) {
		var index = this.stringLookupQuick[string];
		// If missing, allocate now
		if (index == undefined) {
			index = this.stringLookup.length;
			this.stringLookup.push( string );
			this.stringLookupQuick[string]= index;
		}
		return index;
	},

	/**
	 * Lookup if that object already exits in the i-ref table
	 * and return it's ID.
	 */
	'lookupIRef': function( object ) {
		return this.indexRef.indexOf( object );
	},

	/**
	 * Lookup if that object already exits in the x-ref table
	 * and return the ID of it's string on the string lookup table
	 */
	'lookupXRef': function( object ) {

		// Lookup object on xref table
		var id = this.dbObjects.indexOf( object );
		if (id < 0) return -1;

		// Get string ID of the db tag
		return this.stringID( this.dbTags[id] );

	},

	/**
	 * Lookup if that object already exits in the i-ref table
	 * and return it's ID, using it's values and not it's contents.
	 */
	'lookupIVal': function( propertyTable, eid ) {
		// Check if we have a BST for this type
		if (this.indexVal[eid] !== undefined) {
			var id = this.indexVal[eid].search( propertyTable );
			if (id.length > 0) return id[0];
		}
		// We don't have the item or the BST
		return -1;
	},

	/**
	 * Keep the specified object in the lookup tables
	 */
	'keepIRef': function( object, propertyTable, eid ) {

		// Create a new BST for this entity type if missing
		if (this.indexVal[eid] == undefined)
			this.indexVal[eid] = new BinarySearchTree({
				compareKeys: objectBstComparison,
				checkValueEquality: objectBstEquals,
				unique: true,
			});

		// Keep object references
		this.indexVal[eid].insert( propertyTable, this.indexRef.length );
		this.indexRef.push( object );

	},

	/**
	 * Create and/or return the property signature with the given ID
	 */
	'getSignatureID': function( signature ) {
		return this.plainObjectSignatureLookup[signature];			
	},

	/**
	 * Allocate a new signature ID of a signature and return it
	 */
	'defineSignature': function( signature ) {
		// Allocate an entry with new ID
		var id = this.plainObjectSignatureID++;
		this.plainObjectSignatureLookup[signature] = id;
		// Return ID
		return id;
	},

	/**
	 * Define an external database of tagged objects to use
	 * for cross-referencing external entities.
	 */
	'setDatabase': function( db, prefix ) {
		if (!prefix) prefix="";
		// Import into an easy-to-process format
		var keys = Object.keys(db);
		for (var i=0; i<keys.length; i++) {
			var k = keys[i];
			if (!db.hasOwnProperty(k)) continue;
			this.dbTags.push( prefix+k );
			this.dbObjects.push( db[k] );
		}
		// Keep reference of database
		this.database = db;
	},

	/**
	 * Encode entity
	 */
	'encode': function( entity, name ) {

		// Write control operation
		this.stream8.write( pack1b( CTRL_OP.EXPORT ) );
		this.counters.op_ctr++;
		// Write string ID from the string lookup table
		this.stream16.write( pack2b( this.stringID(name) ) );
		this.counters.ref_str+=2;

		// Encode primitive
		encodePrimitive( this, entity );

		// Keep on xref database
		var tn = this.bundleName + "/" + name;
		this.dbTags.push(tn);
		this.dbObjects.push(entity);
		this.database[tn] = entity;

	},

	/**
	 * Embed specified resource
	 */
	'embed': function( filename, mime_type ) {

		// Calculate relative path
		var relPath = filename;
		if (relPath.substr(0,this.baseDir.length) == this.baseDir)
			relPath = relPath.substr( this.baseDir.lengh );

		// Write control operation
		this.stream8.write( pack1b( CTRL_OP.EMBED ) );
		this.counters.op_ctr++;
		// Write string ID from the string lookup table
		this.stream16.write( pack2b( this.stringID(relPath) ) );
		this.counters.ref_str+=2;
		// Encode primitive
		encodePrimitive( this, new FileResource( filename, mime_type) );
		
	},

	/**
	 * Embed specified blob
	 */
	'embedBlob': function( buffer, name, mime_type ) {

		// Write control operation
		this.stream8.write( pack1b( CTRL_OP.EMBED ) );
		this.counters.op_ctr++;
		// Write string ID from the string lookup table
		this.stream16.write( pack2b( this.stringID(name) ) );
		this.counters.ref_str+=2;
		// Encode primitive
		encodePrimitive( this, new BlobResource( buffer, mime_type) );
		
	},

	/**
	 * Set log flags
	 */
	'setLogFlags': function(flags) {

		// Set log flags
		this.logFlags = flags;

		// Update flags on streams
		this.stream64.logWrites = ((this.logFlags & LOG.WRT) != 0);
		this.stream32.logWrites = ((this.logFlags & LOG.WRT) != 0);
		this.stream16.logWrites = ((this.logFlags & LOG.WRT) != 0);
		this.stream8.logWrites  = ((this.logFlags & LOG.WRT) != 0);

	},

	/**
	 * Logging function
	 */
	'log': function(subsystem, text) {

		// Don't log subsystems we don't track
		if ((subsystem & this.logFlags) == 0) return;

		// Log
		console.log(
			LOG_PREFIX_STR[subsystem].blue + 
			(" @"+this.stream8.offset).bold.blue + ":" + this.logPrefix + " " + text 
		);

	},

	/**
	 * Log identation modification
	 */
	'logIndent': function(indent, c) {
		var iChar = c || ">";
		if (indent > 0) {
			for (var i=0; i<indent; i++) this.logPrefix+=iChar;
		} else {
			this.logPrefix = this.logPrefix.substr(0,this.logPrefix.length+indent*iChar.length);
		}
	}

};

/**
 * Expose FileResource class 
 */
BinaryEncoder.FileResource = FileResource;
BinaryEncoder.BlobResource = BlobResource;

/**
 * Expose log flags
 */
BinaryEncoder.LogFlags = LOG;

/**
 * Export binary encoder
 */
module.exports = BinaryEncoder;	
