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
var deepEqual 	= require('deep-equal');
var BinaryStream = require("./lib/BinaryStream");
var Errors 		= require("./lib/Errors");

const FLOAT32_POS 	= 3.40282347e+38; // largest positive number in float32
const FLOAT32_NEG 	= -3.40282347e+38; // largest negative number in float32
const FLOAT32_SMALL = 1.175494351e-38; // smallest number in float32

/* Note that all these values are exclusive, for positive test (ex v < UING8_MAX) */

const UINT8_MAX 	= 256; // largest positive unsigned integer on 8-bit
const UINT16_MAX	= 65536; // largest positive unsigned integer on 16-bit
const UINT32_MAX	= 4294967296;  // largest positive unsigned integer on 32-bit

const INT8_MIN 		= -129; // largest negative signed integer on 8-bit
const INT8_MAX 		= 128; // largest positive signed integer on 8-bit
const INT16_MIN 	= -32769; // largest negative signed integer on 16-bit
const INT16_MAX 	= 32768; // largest positive signed integer on 16-bit
const INT32_MIN 	= -2147483649; // largest negative signed integer on 16-bit
const INT32_MAX 	= 2147483648; // largest positive signed integer on 16-bit

/* Version of binary bundle */

const VERSION 		= (( 1 /* Major */ )<<8)|( 2 /* Minor */ );

/*

Known Limitations

* A TypedArray cannot have more than 4,294,967,296 items 
* There cannot be more than 65,536 string literals in the bundle (dictionary keys, import/export labels)

*/

/**
 * If this constant is true, the packing functions will do sanity checks,
 * which might increase the build time.
 */
const SAFE = 1;

/**
 * Fake DOM environment when from node
 */
if (typeof(document) === "undefined") {

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
		var tA, tB, i;
		for (i=0; i<a.length; ++i) {
			tA = typeof a[i]; tB = typeof b[i];
			if (tA === tB) {
				if ((tA === 'number') || (tA === 'string') || (tA === 'boolean')) {
					if (a[i] < b[i]) return -1;
					if (a[i] > b[i]) return 1;
					if (a[i] !== b[i]) return 1;
				  /*if (a[i] == b[i]) continue;*/
				} else {
					if (a[i] === b[i]) continue;
					return 1;
				}
			} else {
				return 1;
			}
		}
		return 0;
	},
	objectBstEquals = function(a,b) {
		for (var i=0; i<a.length; ++i) {
			if (a[i] !== b[i]) return false;
		}
		return true;
	};

/**
 * Numerical types
 */
const NUMTYPE = {
	// For protocol use
	UINT8: 	 0, INT8:    1,
	UINT16:  2, INT16:   3,
	UINT32:  4, INT32:   5,
	FLOAT32: 6, FLOAT64: 7,
	// For internal use
	NUMERIC: 8, UNKNOWN: 9, NAN: 10
};

/**
 * Numerical length types
 */
const NUMTYPE_LN = {
	UINT16: 0,
	UINT32 : 1
};
const NUMTYPE_LEN = {
	UINT8: 	 0,
	UINT16:  1,
	UINT32:  2,
	FLOAT64: 3
};

/**
 * Log flags
 */
const LOG = {
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
const LOG_PREFIX_STR = {
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
 * Downscaling numtype conversion table from/to
 */
const NUMTYPE_DOWNSCALE = {
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
	]
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
 * Delta encoding scale factor
 */
const DELTASCALE = {
	S_001 : 1, 	// Divide by 100 the value
	S_1	  : 2, 	// Keep value as-is
	S_R   : 3, 	// Multiply by 127 on 8-bit and by 32768 on 16-bit
	S_R00 : 4,  // Multiply by 12700 on 8-bit and by 3276800 on 16-bit
};

/**
 * Control Op-Codes
 */
const CTRL_OP = {
	ATTRIB 	: 0x80,		// Attribute
	EXPORT	: 0xF8, 	// External Export
	EMBED 	: 0xF9, 	// Embedded resource
};

/**
 * Primitive Op-Codes
 */
const PRIM_OP = {
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
 * Object Op-Codes
 */
const OBJ_OP = {
	KNOWN_5:		0x00,	// Known object (5-bit)
	KNOWN_12: 		0x20,	// Known object (12-bit)
	PLAIN_LOOKUP:	0x30,	// A plain object from lookup table
	PLAIN_NEW: 		0x3F,	// A new plain object that will define a lookup entry
	PRIMITIVE: 		0x38, 	// Primitive object
	PRIM_DATE: 		0x38
};

/**
 * Primitive object op-codes
 */
const OBJ_PRIM = {
	DATE: 			0x00, 	// A DATE primitive
};

/**
 * Array Op-Codes
 */
const ARR_OP = {
	NUM_DWS: 		 0x00, // Downscaled Numeric Type
	NUM_DELTA_INT:	 0x20, // Delta-Encoded Integer Array
	NUM_DELTA_FLOAT: 0x30, // Delta-Encoded Float Array
	NUM_REPEATED: 	 0x40, // Repeated Numeric Value
	NUM_RAW: 		 0x50, // Raw Numeric Value
	NUM_SHORT: 		 0x60, // Short Numeric Value
	PRIM_REPEATED: 	 0x68, // Repeated Primitive Value
	PRIM_RAW: 		 0x6A, // Raw Primitive Array
	PRIM_BULK_PLAIN: 0x6C, // Bulk Array of Plain Objects
	PRIM_SHORT: 	 0x6E, // Short Primitive Array
	PRIM_CHUNK: 	 0x6F, // Chunked Primitive ARray
	PRIM_BULK_KNOWN: 0x7C, // Bulk Array of Known Objects
	EMPTY: 			 0x7E, // Empty Array
	PRIM_CHUNK_END:  0x7F, // End of primary chunk
};

/**
 * Array chunk types
 */
const ARR_CHUNK = {
	PRIMITIVES:  1, // Two or more primitives
	REPEAT: 	 2, // Repeated of the same primitive
	NUMERIC: 	 3, // A numeric TypedArray
	BULK_PLAIN:  4, // A bulk of many plain objects
	BULK_KNOWN:  5, // A bulk of known objects
};

const _ARR_CHUNK = [
	undefined,
	'PRIMITIVES',
	'REPEAT',
	'NUMERIC',
	'BULK_PLAIN',
	'BULK_KNOWN'
];

/**
 * Simple primitives
 */
const PRIM_SIMPLE = {
	UNDEFINED: 	0,
	NULL: 		1,
	FALSE: 		2,
	TRUE: 		3
};

/**
 * Extended simple primitives
 */
const PRIM_SIMPLE_EX = {
	NAN: 	0,
};

/**
 * Buffer primitive MIME Types
 */
const PRIM_BUFFER_TYPE = {
	STRING_LATIN: 	 0,
	STRING_UTF8: 	 1,
	BUF_IMAGE: 		 2,
	BUF_SCRIPT: 	 3,
	RESOURCE: 		 7,
};

/**
 * BULK_KNOWN Array encoding operator codes
 */
const PRIM_BULK_KNOWN_OP = {
	DEFINE 	: 0x00,		// Define a new object for IREF
	IREF 	: 0x40,		// Refer to an IREF object
	XREF 	: 0x80,		// Refer to an XREF object
};

/**
 * String representation of numerical type for debug messages
 */
const _NUMTYPE = [
	'UINT8',
	'INT8',
	'UINT16',
	'INT16',
	'UINT32',
	'INT32',
	'FLOAT32',
	'FLOAT64',
	'NUMERIC',
	'UNKNOWN',
	'NaN',
];
const _NUMTYPE_DOWNSCALE_DWS = [
	'UINT16 -> UINT8',
	'INT16 -> INT8',
	'UINT32 -> UINT8',
	'INT32 -> INT8',
	'UINT32 -> UINT16',
	'INT32 -> INT16',
	'FLOAT32 -> UINT8',
	'FLOAT32 -> INT8',
	'FLOAT32 -> UINT16',
	'FLOAT32 -> INT16',
	'FLOAT64 -> UINT8',
	'FLOAT64 -> INT8',
	'FLOAT64 -> UINT16',
	'FLOAT64 -> INT16',
	'FLOAT64 -> FLOAT32'
];
const _NUMTYPE_DOWNSCALE_DELTA_INT = [
	'UINT16 -> INT8',
	'INT16 -> INT8',
	'UINT32 -> INT8',
	'INT32 -> INT8',
	'UINT32 -> INT16',
	'INT32 -> INT16'
];
const _NUMTYPE_DOWNSCALE_DELTA_FLOAT = [
	'FLOAT32 -> INT8',
	'FLOAT32 -> INT16',
	'FLOAT64 -> INT8',
	'FLOAT64 -> INT16 '
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
		if (SAFE) { if (signed) {
			if (num < INT8_MIN) 
				throw new Errors.PackError('Packing number bigger than 8-bits ('+num+')!');
			else if (num > INT8_MAX) 
				throw new Errors.PackError('Packing number bigger than 8-bits ('+num+')!');
		} else {
			if (num < 0) throw  new Errors.PackError('Packing negative number on unsigned 8-bit ('+num+')!');
			else if (num > UINT8_MAX) 
				throw new Errors.PackError('Packing number bigger than 8-bits ('+num+')!');
		} }
		if (signed) packViewI8[0] = num;
		else packViewU8[0] = num;
		n[0] = packViewU8[0];
		return n;
	},
	pack2b = function( num, signed ) {
		var n = new Buffer(2);
		if (SAFE) { if (signed) {
			if (num < INT16_MIN) 
				throw new Errors.PackError('Packing integer bigger than 16-bits ('+num+')!');
			else if (num > INT16_MAX) 
				throw new Errors.PackError('Packing integer bigger than 16-bits ('+num+')!');
		} else {
			if (num < 0) 
				throw new Errors.PackError('Packing negative integer on unsigned 16-bit ('+num+')!');
			else if (num > UINT16_MAX) 
				throw new Errors.PackError('Packing integer bigger than 16-bits ('+num+')!');
		} }
		if (signed) packViewI16[0] = num;
		else packViewU16[0] = num;
		for (var i=0; i<2; ++i) n[i]=packViewU8[i];
		return n;
	},
	pack4b = function( num, signed ) {
		var n = new Buffer(4);
		if (SAFE) { if (signed) {
			if (num < INT32_MIN) 
				throw new Errors.PackError('Packing integer bigger than 32-bits ('+num+')!');
			else if (num > INT32_MAX) 
				throw new Errors.PackError('Packing integer bigger than 32-bits ('+num+')!');
		} else {
			if (num < 0) 
				throw new Errors.PackError('Packing negative integer on unsigned 32-bit ('+num+')!');
			else if (num > UINT32_MAX) 
				throw new Errors.PackError('Packing integer bigger than 32-bits ('+num+')!');
		} }
		if (signed) packViewI32[0] = num;
		else packViewU32[0] = num;
		for (var i=0; i<4; ++i) n[i]=packViewU8[i];
		return n;
	},
	pack4f = function( num ) {
		var n = new Buffer(4);
		if (SAFE) { if (num == 0.0) { }
		else if ((Math.abs(num) < FLOAT32_SMALL) || (num < FLOAT32_NEG) || (num > FLOAT32_POS)) 
			throw new Errors.PackError('Packing float bigger than 32-bits ('+num+')!');
		}
		packViewF32[0] = num;
		for (var i=0; i<4; ++i) n[i]=packViewU8[i];
		return n;
	},
	pack8f = function( num ) {
		var n = new Buffer(8);
		if (SAFE) { if (num == 0.0) { }
		else if (Math.abs(num) < 1.7E-108) 
			throw new Errors.PackError('Packing float bigger than 64-bits ('+num+')!');
		else if (Math.abs(num) > 1.7E+108) 
			throw new Errors.PackError('Packing float bigger than 64-bits ('+num+')!');
		}
		packViewF64[0] = num;
		for (var i=0; i<8; ++i) n[i]=packViewU8[i];
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
// Analysis and Encoding helper functions
//////////////////////////////////////////////////////////////////

/**
 * Get a new unique object ID
 */
var __objectID = 0;
function __newObjectID() {
	return '_'+(++__objectID);
}

function fds( v_min, v_max ) {

	var d_min = Math.log10(v_min),
		d_max = Math.log10(v_max);

}

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
			return multiplier * INT8_MAX;
		} else {
			return multiplier * INT16_MAX;
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
		return (v.length === 0);
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
 * Check if the specified number is a subclass of an other
 */
function isNumericSubclass( t, t_min, t_max, of_t ) {
	if ((t === NUMTYPE.NAN) || (of_t === NUMTYPE.NAN)) return false;
	switch (of_t) { // Parent
		case NUMTYPE.UINT8:
			switch (t) {
				case NUMTYPE.UINT8:
					return true;
				case NUMTYPE.INT8:
					return (t_min > 0);
				default:
					return false;
			}

		case NUMTYPE.INT8:
			switch (t) {
				case NUMTYPE.UINT8:
					return (t_max < INT8_MAX);
				case NUMTYPE.INT8:
					return true;
				default:
					return false;
			}

		case NUMTYPE.UINT16:
			switch (t) {
				case NUMTYPE.UINT8:
				case NUMTYPE.UINT16:
					return true;
				case NUMTYPE.INT8:
				case NUMTYPE.INT16:
					return (t_min > 0);
				default:
					return false;
			}

		case NUMTYPE.INT16:
			switch (t) {
				case NUMTYPE.UINT8:
				case NUMTYPE.INT8:
				case NUMTYPE.INT16:
					return true;
				case NUMTYPE.UINT16:
					return (t_max < INT16_MAX);
				default:
					return false;
			}

		case NUMTYPE.UINT32:
			switch (t) {
				case NUMTYPE.UINT8:
				case NUMTYPE.UINT16:
				case NUMTYPE.UINT32:
					return true;
				case NUMTYPE.INT8:
				case NUMTYPE.INT16:
				case NUMTYPE.INT32:
					return (t_min > 0);
				default:
					return false;
			}

		case NUMTYPE.INT32:
			switch (t) {
				case NUMTYPE.UINT8:
				case NUMTYPE.INT8:
				case NUMTYPE.UINT16:
				case NUMTYPE.INT16:
				case NUMTYPE.INT32:
					return true;
				case NUMTYPE.UINT32:
					return (t_max < INT32_MAX);
				default:
					return false;
			}

		case NUMTYPE.FLOAT32:
			switch (t) {
				case NUMTYPE.UINT8:
				case NUMTYPE.INT8:
				case NUMTYPE.UINT16:
				case NUMTYPE.INT16:
				case NUMTYPE.FLOAT32:
					return true;
				case NUMTYPE.UINT32:
				case NUMTYPE.INT32:
					return (t_min > FLOAT32_NEG) && (t_max < FLOAT32_POS);
				default:
					return false;
			}

		case NUMTYPE.FLOAT64:
			return true;

	}
	return false;
}

/**
 * Check if we are mixing floats
 */
function isFloatMixing( a, b ) {
	return (
		((a < NUMTYPE.FLOAT32 ) && (b >= NUMTYPE.FLOAT32 )) ||
		((a >= NUMTYPE.FLOAT32 ) && (b < NUMTYPE.FLOAT32 ))
	);
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
	return 255;
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
	} else if (v instanceof Array) {

		// Sneaky but fast way to check if array is 100% numeric
		// by testing the first, last and middle elemnet

		var a=0,b=v.length-1,c=Math.floor((b-a)/2);
		if((typeof v[a] === "number") &&
		   (typeof v[b] === "number") &&
		   (typeof v[c] === "number")) {
		   	return NUMTYPE.NUMERIC;
		} else {
			return NUMTYPE.UNKNOWN;
		}

	} else {
		return NUMTYPE.UNKNOWN;
	}
}

/**
 * Get the smallest possible numeric type fits this numberic bounds
 *
 * @param {number} vmin - The minimum number to check
 * @param {number} vmax - The maximum number to check
 * @param {boolean} is_float - Set to 'true' to assume that the numbers are float
 * @return {NUMTYPE} - The numerical type to rerutn
 */
function getNumType( vmin, vmax, is_float ) {
	if (typeof vmin !== "number") return NUMTYPE.NAN;
	if (typeof vmax !== "number") return NUMTYPE.NAN;
	if (isNaN(vmin) || isNaN(vmax)) return NUMTYPE.NAN;

	// If float, test only-floats
	if (is_float) {

		// Try to find smallest value for float32 minimum tests
		var smallest;
		if (vmin === 0) {
			// vmin is 0, which makes vmax positive, so 
			// test vmax for smallest
			smallest = vmax;
		} else if (vmax === 0) {
			// if vmax is 0, it makes vmin negative, which
			// means we should test it's positive version
			smallest = -vmax;
		} else {
			// if vmin is positive, both values are positive
			// so get the smallest for small test (vmin)
			if (vmin > 0) {
				smallest = vmin;

			// if vmax is negative, both values are negative
			// so get the biggest for small test (vmax)
			} else if (vmax < 0) {
				smallest = -vmax;

			// if vmin is negative and vmax positive, get the
			// smallest of their absolute values
			} else if ((vmin < 0) && (vmax > 0)) {
				smallest = -vmin;
				if (vmax < smallest) smallest = vmax;
			}
		}

		// Test if float number fits on 32 or 64 bits
		if ((vmin > FLOAT32_NEG) && (vmax < FLOAT32_POS) && (smallest > FLOAT32_SMALL)) {
			return NUMTYPE.FLOAT32;
		} else {
			return NUMTYPE.FLOAT64;
		}

	}

	// If we have a negative value, switch to signed tests
	if ((vmax < 0) || (vmin < 0)) {

		// Get absolute maximum of bound values
		var amax = -vmin;
		if (vmax < 0) {
			if (-vmax > amax) amax = -vmax;
		} else {
			if (vmax > amax) amax = vmax;
		}

		// Test for integer bounds
		if (amax < INT8_MAX) {
			return NUMTYPE.INT8;

		} else if (amax < INT16_MAX) {
			return NUMTYPE.INT16;

		} else if (amax < INT32_MAX) {
			return NUMTYPE.INT32;

		} else {
			return NUMTYPE.FLOAT64;

		}

	// Otherwise perform unsigned tests
	} else {

		// Check for unsigned cases
		if (vmax < UINT8_MAX) {
			return NUMTYPE.UINT8;

		} else if (vmax < UINT16_MAX) {
			return NUMTYPE.UINT16;

		} else if (vmax < UINT32_MAX) {
			return NUMTYPE.UINT32;

		} else {
			return NUMTYPE.FLOAT64;

		}

	}

}

/**
 * Calculate and return the numerical type and the scale to
 * apply to the float values given in order to minimize the error.
 */
function getFloatScale( values, min, max, error ) {
	var mid = (min + max) / 2, range = mid - min,
		norm_8 = (range / INT8_MAX),
		norm_16 = (range / INT16_MAX),
		ok_8 = true, ok_16 = true,
		er_8 = 0, er_16 = 0,
		v, uv, er;

	// For the values given, check if 8-bit or 16-bit
	// scaling brings smaller error value
	for (var i=0, l=values.length; i<l; ++i) {

		// Test 8-bit scaling
		if (ok_8) {
			v = Math.round((values[i] - mid) / norm_8);
			uv = v * norm_8 + mid;
			er = (uv-v)/v;
			if (er > er_8) er_8 = er;
			if (er >= error) {
				ok_8 = false;
			}
		}

		// Test 16-bit scaling
		if (ok_16) {
			v = Math.round((values[i] - mid) / norm_16);
			uv = v * norm_16 + mid;
			er = (uv-v)/v;
			if (er > er_16) er_16 = er;
			if (er >= error) {
				ok_16 = false;
			}
		}

		if (!ok_8 && !ok_16)
			return [ 0, NUMTYPE.UNKNOWN ];
	}

	// Pick most appropriate normalization factor
	if (ok_8 && ok_16) {
		if (er_8 < er_16) {
			return [ norm_8, NUMTYPE.INT8 ];
		} else {
			return [ norm_16, NUMTYPE.INT16 ];
		}
	} else if (ok_8) {
		return [ norm_8, NUMTYPE.INT8 ];
	} else if (ok_16) {
		return [ norm_16, NUMTYPE.INT16 ];
	} else {
		return [ 0, NUMTYPE.UNKNOWN ];
	}

}

/**
 * Get the possible downscale type based on the specified analysis
 */
function getDownscaleType( n_type, analysis ) {
	switch (n_type) {

		// Not possible to downscale from 1-byte
		case NUMTYPE.UINT8:
		case NUMTYPE.INT8:
			return NUMTYPE.UNKNOWN;

		case NUMTYPE.UINT16:
			switch (analysis.type) {

				// UINT16 -> (U)INT8 = UINT8
				case NUMTYPE.INT8: // Unsigned, so always positive
				case NUMTYPE.UINT8:
					return NUMTYPE.UINT8;

				// Anything else is equal to or bigger than 2 bytes
				default:
					return NUMTYPE.UNKNOWN;					
			}

		case NUMTYPE.INT16:
			switch (analysis.type) {

				// INT16 -> UINT8 = INT8 (if v < INT8_MAX)
				case NUMTYPE.UINT8:
					if (analysis.max < INT8_MAX) {
						return NUMTYPE.INT8;
					} else {
						return NUMTYPE.UNKNOWN;
					}

				// INT16 -> INT8
				case NUMTYPE.INT8:
					return NUMTYPE.INT8;

				// Anything else is equal to or bigger than 2 bytes
				default:
					return NUMTYPE.UNKNOWN;					
			}

		case NUMTYPE.UINT32:
			switch (analysis.type) {

				// UINT32 -> (U)INT8 [= UINT8]
				case NUMTYPE.INT8:
				case NUMTYPE.UINT8:
					return NUMTYPE.UINT8;

				// UINT32 -> (U)INT16 = UINT16
				case NUMTYPE.INT16:
				case NUMTYPE.UINT16:
					return NUMTYPE.UINT16;

				// Anything else is equal to or bigger than 4 bytes
				default:
					return NUMTYPE.UNKNOWN;					

			}

		case NUMTYPE.INT32:
			switch (analysis.type) {

				// INT32 -> UINT8 = INT8/INT16 (if v < INT8_MAX)
				case NUMTYPE.UINT8:
					if (analysis.max < INT8_MAX) {
						return NUMTYPE.INT8;
					} else {
						return NUMTYPE.INT16;
					}

				// INT32 -> INT8
				case NUMTYPE.INT8:
					return NUMTYPE.INT8;

				// INT32 -> UINT16 = INT16 (if v < INT16_MAX)
				case NUMTYPE.UINT16:
					if (analysis.max < INT16_MAX) {
						return NUMTYPE.INT16;
					} else {
						return NUMTYPE.UNKNOWN;
					}

				// INT32 -> INT16
				case NUMTYPE.INT16:
					return NUMTYPE.INT16;

				// Anything else is equal to or bigger than 4 bytes
				default:
					return NUMTYPE.UNKNOWN;					

			}

		case NUMTYPE.FLOAT32:
			switch (analysis.type) {

				// FLOAT32 -> Anything 1-2 bytes
				case NUMTYPE.UINT8:
					return NUMTYPE.UINT8;
				case NUMTYPE.INT8:
					return NUMTYPE.INT8;
				case NUMTYPE.UINT16:
					return NUMTYPE.UINT16
				case NUMTYPE.INT16:
					return NUMTYPE.INT16

				// Everything else is discarded
				default:
					return NUMTYPE.UNKNOWN;
			}

		case NUMTYPE.FLOAT64:
			switch (analysis.type) {

				// FLOAT64 -> Anything 1-2 bytes
				case NUMTYPE.UINT8:
					return NUMTYPE.UINT8;
				case NUMTYPE.INT8:
					return NUMTYPE.INT8;
				case NUMTYPE.UINT16:
					return NUMTYPE.UINT16
				case NUMTYPE.INT16:
					return NUMTYPE.INT16

				// FLOAT64 -> FLOAT32
				case NUMTYPE.FLOAT32:
					return NUMTYPE.FLOAT32

				// Everything else is discarded
				default:
					return NUMTYPE.UNKNOWN;
			}

	}
}

/**
 * Analyze the specified numeric array and return analysis details
 *
 * @param {Array} v - The array to analyze
 * @param {Boolean} include_costly - Include additional (costly) operations
 * @return {object} - Return an object with the analysis results
 */
function analyzeNumericArray( v, include_costly ) {
	var min = v[0], max = min, is_int = false, is_float = false, is_same = true,
		dmin=0, dmax=0, is_dfloat = false,
		mean=0, n_type=0, d_mode=0, f_type=[0, NUMTYPE.UNKNOWN], 
		c_same=0, same=0,
		s_min = [min,min,min,min,min], s_min_i=0, s_max = [min,min,min,min,min], s_max_i=0, samples,
		a, b, d_type, cd, cv, lv = v[0];

	// Anlyze array items
	for (var i=0, l=v.length; i<l; ++i) {
		cv = v[i];

		// Exit on non-numeric cases
		if (typeof cv !== 'number')
			return null;

		// Update mean
		mean += cv;

		// Include costly calculations if enabled
		if (include_costly) {

			// Update delta
			if (i !== 0) {
				cd = lv - cv; if (cd < 0) cd = -cd;
				if (i === 1) {
					dmin = cd;
					dmax = cd;
				} else {
					if (cd < dmin) dmin = cd;
					if (cd > dmax) dmax = cd;
				}

				// Check if delta is float
				if ((cd !== 0) && (cd % 1 !== 0))
					is_dfloat = true;
			}

			// Update bounds & Keep samples
			if (cv < min) {
				min = cv;
				s_min[s_min_i] = cv;
				if (++s_min_i>5) s_min_i=0;
			}
			if (cv > max) {
				max = cv;
				s_max[s_max_i] = cv;
				if (++s_max_i>5) s_max_i=0;
			}

		} else {

			// Update bounds
			if (cv < min) min = cv;
			if (cv > max) max = cv;

		}

		// Check for same values
		if (cv === lv) {
			c_same++;
		} else {
			if (c_same > same)
				same = c_same;
			is_same = false;
			c_same = 0;
		}

		// Keep last value
		lv = cv;

		// Skip zeros from further analysis
		if (cv === 0) continue;

		// Update integer/float
		if (cv % 1 !== 0) {
			is_float = true;
		} else {
			is_int = true;
		}

	}

	// Finalize counters
	if (c_same > same) same = c_same;
	mean /= v.length;

	// Guess numerical type
	n_type = getNumType( min, max, is_float );

	// Calculate delta-encoding details
	d_type = NUMTYPE.UNKNOWN;
	if (include_costly) {
		if (!is_float && is_int) {

			// INTEGERS : Use Delta-Encoding (d_mode=1)

			if ((dmin > INT8_MIN) && (dmax < INT8_MAX)) {
				d_type = NUMTYPE.INT8;
				d_mode = 1;
			} else if ((dmin > INT16_MIN) && (dmax < INT16_MAX)) {
				d_type = NUMTYPE.INT16;
				d_mode = 1;
			} else if ((dmin > INT32_MIN) && (dmax < INT32_MAX)) {
				d_type = NUMTYPE.INT32;
				d_mode = 1;
			}

		} else if (is_float) {

			// FLOATS : Use Rebase Encoding (d_mode=2)

			// Get a couple more samples
			samples = [].concat(
				s_min, s_max,
				[
					v[Math.floor(Math.random()*v.length)],
					v[Math.floor(Math.random()*v.length)],
					v[Math.floor(Math.random()*v.length)],
					v[Math.floor(Math.random()*v.length)],
					v[Math.floor(Math.random()*v.length)],
				]
			);

			// Calculate float scale
			f_type = getFloatScale( v, min, max, 0.01 );
			if (f_type[1] != NUMTYPE.UNKNOWN) {
				d_type = f_type[1];
				d_mode = 2;
			}

		}
	}

	// Based on information detected so far, populate
	// the analysis results
	return {

		// Get numeric type
		'type'		: n_type,
		'delta_type': d_type,

		// Percentage of same items
		'psame'		: same / v.length,

		// Log numeric bounds
		'min'		: min,
		'max'		: max,
		'mean'		: mean,

		// Log delta bounds
		'dmin'		: dmin,
		'dmax' 		: dmax,

		// Delta mode
		'dmode'		: d_mode,
		'fscale' 	: f_type[0],

		// Expose information details
		'integer' 	: is_int && !is_float,
		'float' 	: is_float && !is_int,
		'mixed' 	: is_float && is_int,
		'same'		: is_same && (v.length > 1),

	};

}

/**
 * Pack the specified number of bins to the specified bounds
 */
function getBestBinFit( start, len, blocks ) {
	var b, s, e, end = start + len, found = false,
		c, last_c = 0, last_s = 0, last_i = -1, last_bin = null;

	// Find the biggest chunk that can fit on these data
	for (var bi=0, bl=blocks.length; bi<bl; ++bi) {
		b = blocks[bi]; found = false;
		for (var i=0, il=b.length; i<il; ++i) {
			s = b[i][0]; e = s + b[i][1];

			// Find the common region of block-scan frame
			if ( ((s >= start) && (s < end-1)) ||	// Start in bounds
				 ((e >= start) && (e < end-1)) ||	// End in bounds
				 ((s <= start) && (e >= end)) )		// 
			{

				// Check bounds
				if (s < start) s = start;
				if (s > end-2) continue;
				if (e > end) e = end;
				if (s === e) continue;

				// Test coverage
				c = e - s;
				if (c > last_c) {
					last_c = c;
					last_s = s;
					last_bin = b[i];
					found = true;
				}

			}

		}

		// Prefer priority to length across different blocks
		// on the first block (repeated)
		if ((bi === 0) && found)
			return last_bin;

	}

	// Update bounds
	if (last_bin) {
		last_bin = last_bin.slice();
		last_bin[0] = last_s;
		last_bin[1] = last_c;
	}

	// Return last bin
	return last_bin;
}

function arrangeBlocks( start, len, blocks ) {
	var bin, sbin, l, r, end = start + len, ans;

	// Find which block fits best
	bin = getBestBinFit( start, len, blocks );
	if (bin === null) {
		ans = [ [start, len, ARR_CHUNK.PRIMITIVES, null] ];

	} else {

		// Prepare ans
		ans = [ bin ];
		l = bin[0]; r = l + bin[1];

		// Fill left blank
		if (l > start) {
			sbin = arrangeBlocks( start, l-start, blocks );
			ans = sbin.concat( ans );
		}

		// Fill right blank
		if (r < end) {
			sbin = arrangeBlocks( r, end-r, blocks );
			ans = ans.concat( sbin );
		}

	}

	return ans;
}

/**
 * Analyze primitive array and return useful information
 */
function analyzePrimitiveArray( encoder, array ) {

	const DEBUG_THIS = 0;

	const TEST_NUMBER = 0,
		  TEST_PLAIN = 1,
		  TEST_OBJECT = 2,
		  TEST_PRIMITIVE = 3;

	const BF_PRIM 	= 0x01,
		  BF_REP	= 0x02,
		  BF_NUM 	= 0x04,
		  BF_PLAIN 	= 0x08,	
		  BF_KNOWN  = 0x10;

	var v, v_type, handled, id, ans, debug_str, enc,
		
		t_mode, t_numtype, t_constr, t_keys,

		new_keys, old_keys, some_overlap, n_repeat=0,

		b_prim = null, 	blocks_prim = [],
		b_rep = null,	blocks_rep = [],
		b_num = null,	blocks_num = [],
		b_plain = null,	blocks_plain = [],
		b_known = null,	blocks_known = [];

	// Start scanning array elements
	for (var i=0, l=array.length; i<l; ++i) {

		// Reset test flags
		t_numtype = NUMTYPE.NAN;

		// Get test mode of the current value
		v = array[i];
		switch (typeof v) {

			case 'number':
				t_mode = TEST_NUMBER;
				t_numtype = getNumType( v, v, ((v % 1) !== 0) );

				if (DEBUG_THIS) debug_str = 'NUM';
				break;

			case 'string':
			case 'boolean':
			case 'undefined':
				t_mode = TEST_PRIMITIVE;
				if (DEBUG_THIS) debug_str = 'PRM';
				break;

			case 'object':
				if (v === null) {
					t_mode = TEST_PRIMITIVE;
					if (DEBUG_THIS) debug_str = 'PRM';
				} else if (v.constructor === ({}).constructor) {
					t_mode = TEST_PLAIN;
					if (DEBUG_THIS) debug_str = 'PLN';
				} else { /* Other objects */
					t_constr = v.constructor;
					t_mode = TEST_OBJECT;
					if (DEBUG_THIS) debug_str = 'OBJ';
				}
				break;

		}

		//
		// [BLOCK #1] - Test for same value
		//

		if (b_rep === null) {
			b_rep = [i, 1, ARR_CHUNK.REPEAT, v];
			if (DEBUG_THIS) debug_str += ', rep[new]';
		} else {
			if (v===b_rep[3]) {
				b_rep[1]++;
				if (DEBUG_THIS) debug_str += ', rep[++](ref)';
			} else if (encoder.optimize.cfwa_object_byval
				&& ((t_mode === TEST_OBJECT) || (t_mode === TEST_PLAIN))
				&& deepEqual(b_rep[3], v, {strict:true})) {
				b_rep[1]++;
				if (DEBUG_THIS) debug_str += ', rep[++](val)';
			} else {
				if (b_rep[1]>1) {
					n_repeat += b_rep[1];
					blocks_rep.push(b_rep);
				}
				b_rep = [i, 1, ARR_CHUNK.REPEAT, v];
				if (DEBUG_THIS) debug_str += ', rep[new]';
			}
		}

		//
		// [BLOCK #2] - Test for numbers
		//
		if (t_mode !== TEST_NUMBER) {
			// Stopped being a number
			if (b_num !== null) {
				if (b_num[1]>1) {
					blocks_num.push( b_num );
				}
				b_num = null;
			} 
		} else {

			// Check for first encounter
			if (b_num === null) {
				if (DEBUG_THIS) debug_str += ', num[new]';
				b_num = [i, 1, ARR_CHUNK.NUMERIC, t_numtype, v, v];

			} else {
				handled = false;

				// Check for numeric subclass
				if (!isFloatMixing(b_num[3], t_numtype)) {

					// Allow type upscale of numtype
					if (isNumericSubclass(b_num[3], b_num[4], b_num[5], t_numtype)) {
						// console.log(">> " + ("Expanding numeric class from "+_NUMTYPE[b_num[3]]+" to "+_NUMTYPE[t_numtype]).cyan);
						b_num[3] = t_numtype;
						if (DEBUG_THIS) debug_str += ', num[upscale]';
					}

					// Accept only numeric subclasses
					if (isNumericSubclass(t_numtype, v, v, b_num[3])) {
						handled = true;
						b_num[1]++;
						if (DEBUG_THIS) debug_str += ', num[++]';

						// Update bounds (for subclass testing)
						if (v < b_num[4]) b_num[4] = v;
						if (v > b_num[5]) b_num[5] = v;
					}
				}

				// Stopped being an acceptable number (but still a number)
				if (!handled) {
					if (DEBUG_THIS) debug_str += ', num[new]';
					if (b_num[1]>1) {
						blocks_num.push( b_num );
					}
					b_num = [i, 1, ARR_CHUNK.NUMERIC, t_numtype, v, v];
				}

			}
		}

		//
		// [BLOCK #3] - Test for plain objects
		//

		if (t_mode !== TEST_PLAIN) {
			// Stopped being a plain object
			if (b_plain !== null) {
				if (b_plain[1]>1) {
					blocks_plain.push( b_plain );
				}
				b_plain = null;
			}
		} else {

			// Check for first encounter
			if (b_plain===null) {
				if (DEBUG_THIS) debug_str += ', blk[new]';
				b_plain = [i, 1, ARR_CHUNK.BULK_PLAIN, Object.keys(v).sort()];

			} else {

				// Calculate key differences
				t_keys = Object.keys( v ).sort();
				new_keys = 0; some_overlap = false;
				old_keys = b_plain[3].length;
				for (var ja=0, jb=0, jl=b_plain[3].length; (ja<jl) && (jb<jl) ;) {
					if (t_keys[ja] < b_plain[3][jb]) {
						jb++;
						new_keys++;
						b_plain[3].push( t_keys[ja] )
					} else if (t_keys[ja] > b_plain[3][jb]) {
						ja++;
					} else {
						ja++;
						jb++;
						some_overlap = true;
					}
				}

				// Allow up to 25% extension of the key set
				if (some_overlap && (new_keys === 0) /*|| (new_keys < old_keys * 0.25)*/) {
					b_plain[1]++;
					if (DEBUG_THIS) debug_str += ', blk[++]';
				} else {

					// Stopped being a compatible plain object number (but still a plain object)
					if (!handled) {
						if (DEBUG_THIS) debug_str += ', blk[new]';
						if (b_plain[1]>1) {
							blocks_plain.push( b_plain );
						}
						b_plain = [i, 1, ARR_CHUNK.BULK_PLAIN, Object.keys(v).sort()];
					}

				}

			}
		}

		//
		// [BLOCK #4] - Test for possibly known objects
		//

		if (t_mode !== TEST_OBJECT) {
			// Stopped being a known object
			if (b_known !== null) {
				if (b_known[1]>1) {
					blocks_known.push( b_known );
				}
				b_known = null;
			}
		} else {

			// Check for first encounter
			if (b_known===null) {

				// Lookup constructor
				id = -1;
				enc = encoder.profile.encode(v);
				if (enc) {
					id = enc[0];
				}

				// Check if this is a known object
				if (id > -1) {
					b_known = [i, 1, ARR_CHUNK.BULK_KNOWN, enc, v.constructor];
					if (DEBUG_THIS) debug_str += ', obj[new]';
				} else {
					// Make this behave like a primitive
					t_mode = TEST_PRIMITIVE;
				}

			} else {

				// Check if we remain the same object
				if (v.constructor === b_known[4]) {
					b_known[1]++;
					if (DEBUG_THIS) debug_str += ', obj[++]';
				} else {

					// Stopped being a compatible known object number (but still a known object)
					blocks_known.push( b_known );

					// Lookup constructor
					id = -1;
					enc = encoder.profile.encode(v);
					if (enc) {
						id = enc[0];
					}

					// Check if we are indeed a known object
					if (id > -1) {
						b_known = [i, 1, ARR_CHUNK.BULK_KNOWN, enc, v.constructor];
						if (DEBUG_THIS) debug_str += ', obj[new]';
					} else {
						// Make this behave like a primitive
						t_mode = TEST_PRIMITIVE;
					}

				}

			}

		}

		//
		// [BLOCK #5] - Test for primitives
		//

		if (t_mode !== TEST_PRIMITIVE) {
			// Stopped being a known object
			if (b_prim !== null) {
				blocks_prim.push( b_prim );
				b_prim = null;
			}
		} else {

			// Collect block
			if (b_prim === null) {
				b_prim = [i, 1, ARR_CHUNK.PRIMITIVES, null];
				if (DEBUG_THIS) debug_str += ', prm[new]';
			} else {
				b_prim[1]++;
				if (DEBUG_THIS) debug_str += ', prm[++]';
			}
		}

		if (DEBUG_THIS) console.log("### v=",v,":",debug_str);

	}

	// Finalize blocks
	if (b_rep && (b_rep[1]>1)) {
		n_repeat += b_rep[1];
		blocks_rep.push(b_rep);
	}
	if (b_plain && (b_plain[1]>1)) blocks_plain.push(b_plain);
	if (b_known && (b_known[1]>1)) blocks_known.push(b_known);
	if (b_num) blocks_num.push(b_num);
	if (b_prim) blocks_prim.push(b_prim);

	// Calculate repeat ratio
	var rep_ratio = n_repeat / array.length;
	// console.log("==== Percent:", rep_ratio*100)

	// Check if we have a complete block
	if ((blocks_plain.length === 1) && (blocks_plain[0][1] === array.length)) {
		// If repeat isn't going to help us, dont increase complexity
		if ( rep_ratio < encoder.optimize.repeat_thresshold ) {
			return blocks_plain;
		}
	} else if ((blocks_known.length === 1) && (blocks_known[0][1] === array.length)) {
		// If repeat isn't going to help us, dont increase complexity
		if ( rep_ratio < encoder.optimize.repeat_thresshold ) {
			return blocks_known;
		}
	} else if ((blocks_num.length === 1) && (blocks_num[0][1] === array.length)) {
		// If repeat isn't going to help us, dont increase complexity
		if ( rep_ratio < encoder.optimize.repeat_thresshold ) {
			return blocks_num;
		}
	} else if ((blocks_prim.length === 1) && (blocks_prim[0][1] === array.length)) {
		// If repeat isn't going to help us, dont increase complexity
		if ( rep_ratio < encoder.optimize.repeat_thresshold ) {
			return blocks_prim;
		}
	}

	// Perform bucket-fitting in order to use the smallest
	// number of different combinations, ordered by priority
	ans = arrangeBlocks( 0, array.length, [
		blocks_rep, blocks_num, blocks_prim, blocks_plain, blocks_known
	] );

	// Merge consecutive bocks of exact type
	for (var i=1, l=ans.length; i<l; ++i) {
		if ( (ans[i-1][2] === ans[i][2]) &&  // Same Type
			 (ans[i-1][3] === ans[i][3]) ) { // Same Sub-Type
			
			// Left engulfs right
			ans[i-1][1] += ans[i][1];
			ans.splice(i,1);
			i--; l--;

		}
	}

	if (DEBUG_THIS) {
		// console.log("-----------------------");
		// console.log("IN: ", array);
		console.log("-----------------------");
		console.log("B[REP]  :", blocks_rep);
		console.log("B[NUM]  :", blocks_num);
		console.log("B[PRIM] :", blocks_prim);
		console.log("B[PLAIN]:", blocks_plain);
		console.log("B[KNOWN]:", blocks_known);
		console.log("-----------------------");
		console.log("PICK:", ans);
		console.log("-----------------------");
	}

	// Return
	return ans;

}


/**
 * Pick a matching downscaling type
 */
function downscaleType( fromType, toType ) {
	// Lookup conversion on the downscale table
	for (var i=0; i<NUMTYPE_DOWNSCALE.FROM.length; ++i) {
		if ( (NUMTYPE_DOWNSCALE.FROM[i] === fromType) && 
			 (NUMTYPE_DOWNSCALE.TO[i] === toType) )
			return i;
	}
	// Nothing found
	return undefined;
}

/**
 * Pick a matching delta encoding delta for integers
 */
function deltaEncTypeInt( fromType, toType ) {
	// Lookup conversion on the downscale table
	for (var i=0; i<NUMTYPE_DELTA_INT.FROM.length; ++i) {
		if ( (NUMTYPE_DELTA_INT.FROM[i] === fromType) && 
			 (NUMTYPE_DELTA_INT.TO[i] === toType) )
			return i;
	}
	// Nothing found
	return undefined;
}

/**
 * Pick a matching delta encoding delta for floats
 */
function deltaEncTypeFloat( fromType, toType ) {
	// Lookup conversion on the downscale table
	for (var i=0; i<NUMTYPE_DELTA_FLOAT.FROM.length; ++i) {
		if ( (NUMTYPE_DELTA_FLOAT.FROM[i] === fromType) && 
			 (NUMTYPE_DELTA_FLOAT.TO[i] === toType) )
			return i;
	}
	// Nothing found
	return undefined;
}

/**
 * Encode an integer array with delta encoding
 *
 * @param {array} - Source Array
 * @param {Class} - The class of the underlaying numeric array (ex. Uint8Array)
 *
 * @return {array} - An array with the initial value and the delta-encoded payload
 */
function deltaEncodeIntegers( array, numType ) {
	var delta = new NUMTYPE_CLASS[numType]( array.length - 1 ), l = array[0];
	for (var i=1; i<array.length; ++i) {
		var v = array[i]; delta[i-1] = v - l; l = v;
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
	if ( ((array instanceof Uint8Array) && (numType === NUMTYPE.UINT8)) ||
		 ((array instanceof Int8Array) && (numType === NUMTYPE.INT8)) ||
		 ((array instanceof Uint16Array) && (numType === NUMTYPE.UINT16)) ||
		 ((array instanceof Int16Array) && (numType === NUMTYPE.INT16)) ||
		 ((array instanceof Uint32Array) && (numType === NUMTYPE.UINT32)) ||
		 ((array instanceof Int32Array) && (numType === NUMTYPE.INT32)) ||
		 ((array instanceof Float32Array) && (numType === NUMTYPE.FLOAT32)) ||
		 ((array instanceof Float64Array) && (numType === NUMTYPE.FLOAT64)) ) {

		// Return as-is
		return array;
	}

	// Convert
	return new NUMTYPE_CLASS[numType]( array );
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
function pickStream(encoder, t) {

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
 * Encode array data as downscaled
 */
function encodeArray_NUM_DWS( encoder, data, n_from, n_to ) {

	//
	// Downscaled Numeric Array (NUM_DWS)
	//
	// ...  ....       .   +   Data Length
	// 000 [DWS_TYPE] [LN]    [16bit/32bit]
	//

	// Get downscale type
	var n_dws_type = downscaleType( n_from, n_to );
	// console.log(">>>",data.constructor,":",_NUMTYPE[n_from],"->",_NUMTYPE[n_to],":",n_dws_type);

	encoder.counters.arr_dws+=1;
	encoder.log(LOG.ARR, "array.numeric.downscaled, len="+data.length+
		", from="+_NUMTYPE[n_from]+", to="+_NUMTYPE[n_to]+
		", type="+_NUMTYPE_DOWNSCALE_DWS[n_dws_type]+" ("+n_dws_type+")");

	if (data.length < UINT16_MAX) { // 16-bit length prefix
		encoder.stream8.write( pack1b( ARR_OP.NUM_DWS | NUMTYPE_LN.UINT16 | (n_dws_type << 1) ) );
		encoder.stream16.write( pack2b( data.length, false ) );
		encoder.counters.arr_hdr+=3;
	} else { // 32-bit length prefix
		encoder.stream8.write( pack1b( ARR_OP.NUM_DWS | NUMTYPE_LN.UINT32 | (n_dws_type << 1) ) );
		encoder.stream32.write( pack4b( data.length, false ) );
		encoder.counters.arr_hdr+=5;
	}

	// Encode value
	pickStream( encoder, n_to )
		.write( packTypedArray( convertArray( data, n_to ) ) );

}

/**
 * Pivot-encode float array
 */
function encodeArray_NUM_DELTA_FLOAT( encoder, data, n_from, n_to, pivot, f_scale ) {

	//
	// Pivot Float Numeric Array (NUM_DELTA_FLOAT)
	//
	// ...  ....       .   +   Data Length  +   Mean Value  +  Scale
	// 001 [DWS_TYPE] [LN]    [16bit/32bit]      [F32/F64]     [F32]
	//

	// Get downscale type
	var n_delta_type = deltaEncTypeFloat( n_from, n_to );
	if (n_delta_type === undefined) {
		throw new Errors.EncodeError('Non-viable float delta value from '+_NUMTYPE[n_from]+' to '+_NUMTYPE[n_to]+'!');
	}

	encoder.counters.arr_delta_float+=1;
	encoder.log(LOG.ARR, "array.numeric.delta.float, len="+data.length+
		", from="+_NUMTYPE[n_from]+", to="+_NUMTYPE[n_to]+
		", type="+_NUMTYPE_DOWNSCALE_DELTA_FLOAT[n_delta_type]+" ("+n_delta_type+")"+
		", pivot="+pivot+", scale="+f_scale);

	if (data.length < UINT16_MAX) { // 16-bit length prefix
		encoder.stream8.write( pack1b( ARR_OP.NUM_DELTA_FLOAT | NUMTYPE_LN.UINT16 | (n_delta_type << 1) ) );
		encoder.stream16.write( pack2b( data.length, false ) );
		encoder.counters.arr_hdr+=3;
	} else { // 32-bit length prefix
		encoder.stream8.write( pack1b( ARR_OP.NUM_DELTA_FLOAT | NUMTYPE_LN.UINT32 | (n_delta_type << 1) ) );
		encoder.stream32.write( pack4b( data.length, false ) );
		encoder.counters.arr_hdr+=5;
	}

	// Write pivot value
	pickStream( encoder, n_from )
		.write( packByNumType[n_from]( pivot ) );

	// Write scale
	encoder.stream64.write( pack8f( f_scale ) );

	// Pivot-encode floats
	var pivot_array = new NUMTYPE_CLASS[n_to]( data.length );
	for (var i=1; i<data.length; ++i) {
		pivot_array[i] = (data[i] - pivot) / f_scale;
		// console.log(">>>", data[i],"->", pivot_array[i]);
	}

	// Envode pivot array
	pickStream( encoder, n_to)
		.write( packTypedArray( pivot_array ) );

}

/**
 * Encode array data as delta
 */
function encodeArray_NUM_DELTA_INT( encoder, data, n_from, n_to ) {

	//
	// Delta Numeric Array (NUM_DELTA_INT)
	//
	// ...  ....       .   +   Data Length   +   Initial Value
	// 001 [DWS_TYPE] [LN]    [16bit/32bit]    [8bit/16bit/32bit]
	//

	// Get downscale type
	var n_delta_type = deltaEncTypeInt( n_from, n_to );
	if (n_delta_type === undefined) {
		throw new Errors.EncodeError('Non-viable integer delta value from '+_NUMTYPE[n_from]+' to '+_NUMTYPE[n_to]+'!');
	}

	encoder.counters.arr_delta_int+=1;
	encoder.log(LOG.ARR, "array.numeric.delta.int, len="+data.length+
		", from="+_NUMTYPE[n_from]+", to="+_NUMTYPE[n_to]+
		", type="+_NUMTYPE_DOWNSCALE_DELTA_INT[n_delta_type]+" ("+n_delta_type+")");


	if (data.length < UINT16_MAX) { // 16-bit length prefix
		encoder.stream8.write( pack1b( ARR_OP.NUM_DELTA_INT | NUMTYPE_LN.UINT16 | (n_delta_type << 1) ) );
		encoder.stream16.write( pack2b( data.length, false ) );
		encoder.counters.arr_hdr+=3;
	} else { // 32-bit length prefix
		encoder.stream8.write( pack1b( ARR_OP.NUM_DELTA_INT | NUMTYPE_LN.UINT32 | (n_delta_type << 1) ) );
		encoder.stream32.write( pack4b( data.length, false ) );
		encoder.counters.arr_hdr+=5;
	}

	// Write initial value
	pickStream( encoder, n_from )
		.write( packByNumType[n_from]( data[0] ) );

	// Delta-encode integers
	pickStream( encoder, n_to)
		.write( packTypedArray( deltaEncodeIntegers( data, n_to ) ) );

}

/**
 * Encode array data as repeated
 */
function encodeArray_NUM_REPEATED( encoder, data, n_type ) {

	//
	// Repeated Numeric Array (NUM_REPEATED)
	//
	// ....  ...    .   +   Data Length
	// 0100 [TYPE] [LN]    [16bit/32bit]
	//

	encoder.counters.arr_num_repeated+=1;		
	encoder.log(LOG.ARR, "array.numeric.repeated, len="+data.length+
		", type="+_NUMTYPE[n_type]+" ("+n_type+")");

	if (data.length < UINT16_MAX) { // 16-bit length prefix
		encoder.stream8.write( pack1b( ARR_OP.NUM_REPEATED | NUMTYPE_LN.UINT16 | (n_type << 1) ) );
		encoder.stream16.write( pack2b( data.length, false ) );
		encoder.counters.arr_hdr+=3;
	} else { // 32-bit length prefix
		encoder.stream8.write( pack1b( ARR_OP.NUM_REPEATED | NUMTYPE_LN.UINT32 | (n_type << 1) ) );
		encoder.stream32.write( pack4b( data.length, false ) );
		encoder.counters.arr_hdr+=5;
	}

	// Write initial value
	pickStream( encoder, n_type )
		.write( packByNumType[n_type]( data[0] ) );

}

/**
 * Encode array data as raw
 */
function encodeArray_NUM_RAW( encoder, data, n_type ) {

	//
	// RAW Numeric Array (NUM_RAW)
	//
	// ....  ...    .   +   Data Length
	// 0101 [TYPE] [LN]    [16bit/32bit]
	//

	encoder.counters.arr_num_raw+=1;
	encoder.log(LOG.ARR, "array.numeric.raw, len="+data.length+
		", type="+_NUMTYPE[n_type]+" ("+n_type+")");

	if (data.length < UINT16_MAX) { // 16-bit length prefix
		encoder.stream8.write( pack1b( ARR_OP.NUM_RAW | NUMTYPE_LN.UINT16 | (n_type << 1) ) );
		encoder.stream16.write( pack2b( data.length, false ) );
		encoder.counters.arr_hdr+=3;
	} else { // 32-bit length prefix
		encoder.stream8.write( pack1b( ARR_OP.NUM_RAW | NUMTYPE_LN.UINT32 | (n_type << 1) ) );
		encoder.stream32.write( pack4b( data.length, false ) );
		encoder.counters.arr_hdr+=5;
	}

	// Encode the short array
	pickStream( encoder, n_type )
		.write( packTypedArray( convertArray( data, n_type ) ) );

}

/**
 * Encode array data as short typed
 */
function encodeArray_NUM_SHORT( encoder, data, n_type ) {

	//
	// Short Numeric Array (NUM_SHORT)
	//
	// .....  ...
	// 01110 [TYPE]
	//

	encoder.counters.arr_num_short+=1;
	encoder.log(LOG.ARR, "array.numeric.short, len="+data.length+
		", type="+_NUMTYPE[n_type]+" ("+n_type+")");

	// Encode primitives one after the other
	encoder.stream8.write( pack1b( ARR_OP.NUM_SHORT | n_type ) );
	encoder.stream8.write( pack1b( data.length, false ) );
	encoder.counters.arr_hdr+=2;

	// Encode the short array
	pickStream( encoder, n_type )
		.write( packTypedArray( convertArray( data, n_type ) ) );

}

/**
 * Encode array data as bulk of plain objects
 */
function encodeArray_PRIM_BULK_PLAIN( encoder, data, properties ) {

	//
	// Bulk Array of Primitives (PRIM_BULK_PLAIN)
	//
	// ........ + Signature ID
	// 01111000     [16-bit]
	//

	// Lookup signature
	var eid = encoder.getSignatureID( properties );
	encoder.counters.arr_prim_bulk_plain+=1;
	encoder.log(LOG.ARR, "array.prim.bulk_plain, len="+data.length+
		", signature="+properties.toString()+
		", eid="+eid+" [");
	encoder.logIndent(1);

	// Put header
	encoder.stream8.write( pack1b( ARR_OP.PRIM_BULK_PLAIN ) );
	encoder.stream16.write( pack2b( eid, false ) );
	encoder.counters.arr_hdr+=3;

	// Write bulked properties
	// var weaveArrays = [];
	for (var i=0, pl=properties.length; i<pl; ++i) {

		// Read property of all entries
		var prop = [], p = properties[i];
		for (var j=0, el=data.length; j<el; ++j) {
			prop.push( data[j][p] );
			// weaveArrays.push( data[j][p] );
		}

		// Align values of same property for optimal encoding
		// console.log("ENCODE["+p+"]:",prop);
		encodeArray( encoder, prop );

	}

	// Close log group
	encoder.logIndent(-1);
	encoder.log(LOG.ARR, "]");

}

/**
 * Encode array data as bulk of known objects
 */
function encodeArray_PRIM_BULK_KNOWN( encoder, data, meta ) {

	//
	// Bulk Array for Known Object (PRIM_BULK_KNOWN)
	//
	// .......  .   +   Data Length  +  Entity ID + Bulk Op-Codes
	// 0111110 [LN]    [16bit/32bit]     [16bit]     (IRef Meta)
	//

	// Lookup signature
	var object, id, i, c_export = 0, _x=0, eid=meta[0], getProps=meta[1], plen=-1,
		propertyTable = [], waveTable = [], op8 = [], op16 = [];
	encoder.counters.arr_prim_bulk_known+=1;
	encoder.log(LOG.ARR, "array.prim.known, len="+data.length+
		", eid="+eid+", [");
	encoder.logIndent(1);

	// Put header
	if (data.length < UINT16_MAX) { // 16-bit length prefix
		encoder.stream8.write( pack1b( ARR_OP.PRIM_BULK_KNOWN | NUMTYPE_LN.UINT16 ) );
		encoder.stream16.write( pack2b( data.length, false ) );
		encoder.counters.arr_hdr+=3;
	} else { // 32-bit length prefix
		encoder.stream8.write( pack1b( ARR_OP.PRIM_BULK_KNOWN | NUMTYPE_LN.UINT32 ) );
		encoder.stream32.write( pack4b( data.length, false ) );
		encoder.counters.arr_hdr+=5;
	}

	// Write EID
	encoder.stream16.write( pack2b( eid, false ) );
	encoder.counters.arr_hdr+=2;

	// Populate fields
	for (var j=0, el=data.length; j<el; ++j) {
		object = data[j];

		// Check ByRef internally
		id = encoder.lookupIRef( object );
		if (id > -1) {
			if (c_export > 0) {
				// console.log(">>[known="+c_export+" (ref)]>>");
				encoder.stream8.write( pack1b( PRIM_BULK_KNOWN_OP.DEFINE | c_export ) );
				encoder.counters.arr_hdr+=1;
				c_export = 0;
			}
			// console.log(">>[iref="+id+" (ref)]>>");
			encoder.stream8.write( pack1b( PRIM_BULK_KNOWN_OP.IREF | ((id << 16) & 0x0F) ) );
			encoder.stream16.write( pack2b( id & 0xFFFF ) );
			encoder.counters.arr_hdr+=3;
			continue;
		}

		// Check ByRef externally
		id = encoder.lookupXRef( object );
		if (id > -1) {
			if (c_export > 0) {
				// console.log(">>[known="+c_export+" (ref)]>>");
				encoder.stream8.write( pack1b( PRIM_BULK_KNOWN_OP.DEFINE | c_export ) );
				encoder.counters.arr_hdr+=1;
				c_export = 0;
			}
			// console.log(">>[xref="+id+"]>>");
			encoder.stream8.write( pack1b( PRIM_BULK_KNOWN_OP.XREF ) );
			encoder.stream16.write( pack2b( id & 0xFFFF ) );
			encoder.counters.arr_hdr+=3;
			continue;
		}

		// Populate property table (for byval lookup)
		propertyTable = getProps(object);
		if (!propertyTable) {
			throw new Errors.AssertError('Profile property encoder returned unexpected data!');
		}

		// Check ByVal ref
		id = encoder.lookupIVal( propertyTable, eid );
		if (id > -1) {
			if (c_export > 0) {
				// console.log(">>[known="+c_export+" (ref)]>>");
				encoder.stream8.write( pack1b( PRIM_BULK_KNOWN_OP.DEFINE | c_export ) );
				encoder.counters.arr_hdr+=1;
				c_export = 0;
			}
			// console.log(">>[iref="+id+" (val)]>>");
			encoder.stream8.write( pack1b( PRIM_BULK_KNOWN_OP.IREF | ((id << 16) & 0x0F) ) );
			encoder.stream16.write( pack2b( id & 0xFFFF ) );
			encoder.counters.arr_hdr+=3;
			continue;
		}

		// Keep IREF
		encoder.keepIRef( object, propertyTable, eid );

		// Init weave table if empty
		if (plen === -1) {
			plen = propertyTable.length;
			for (i=0; i<plen; ++i) {
				waveTable.push( [] );
			}
		}

		// Populate the weave table for the actual encoding.
		for (i=0; i<plen; ++i) {
			waveTable[i].push( propertyTable[i] );
		}

		// Count how many objects are exported in a bulk,
		// and flush every 63 items since that's how much
		// we can fit in a single 8-bit command
		c_export++;
		_x++;
		if (c_export > 62) {
			// console.log(">>[known="+c_export+" (bulk)]>>");
			encoder.stream8.write( pack1b( PRIM_BULK_KNOWN_OP.DEFINE | c_export ) );
			encoder.counters.arr_hdr+=1;
			c_export = 0;
		}

	}

	// Finalize export op-codes
	if (c_export > 0) {
		// console.log(">>[known="+c_export+" (end)]>>");
		encoder.stream8.write( pack1b( PRIM_BULK_KNOWN_OP.DEFINE | c_export ) );
		encoder.counters.arr_hdr+=1;
	}

	// Write weaved properties
	if (plen !== -1) {
		for (i=0; i<plen; ++i) {
			encodeArray( encoder, waveTable[i] );
		}
	}

	// Close log group
	encoder.logIndent(-1);
	encoder.log(LOG.ARR, "]");

}

/**
 * Encode array data as a short array of primitives
 */
function encodeArray_PRIM_SHORT( encoder, data ) {

	//
	// Short Primitive Array (PRIM_SHORT)
	//
	// ........
	// 01111100
	//

	// Open log group
	encoder.counters.arr_prim_short+=1;
	encoder.log(LOG.ARR, "array.prim.short, len="+data.length+
		", peek="+data[0]+" [");
	encoder.logIndent(1);

	// Encode primitives one after the other
	encoder.stream8.write( pack1b( ARR_OP.PRIM_SHORT ) );
	encoder.stream8.write( pack1b( data.length, false ) );
	encoder.counters.arr_hdr+=2;

	// Encode each primitive individually
	for (var i=0, llen=data.length; i<llen; ++i) {
		encodePrimitive( encoder, data[i] );
	}

	// Close log group
	encoder.logIndent(-1);
	encoder.log(LOG.ARR, "]");

}

/**
 * Encode array data as one repeated chunk
 */
function encodeArray_PRIM_REPEATED( encoder, data ) {

	//
	// Repeated Primitive Array (PRIM_REPEATED)
	//
	// .......  .   + Signature ID
	// 0111100 [LN]     [16-bit]
	//

	encoder.counters.arr_prim_repeated+=1;
	encoder.log(LOG.ARR, "array.prim.repeated, len="+data.length+
		", peek="+data[0]);

	if (data.length < UINT16_MAX) { // 16-bit length prefix
		encoder.stream8.write( pack1b( ARR_OP.PRIM_REPEATED | NUMTYPE_LN.UINT16 ) );
		encoder.stream16.write( pack2b( data.length, false ) );
		encoder.counters.arr_hdr+=3;
	} else { // 32-bit length prefix
		encoder.stream8.write( pack1b( ARR_OP.PRIM_REPEATED | NUMTYPE_LN.UINT32 ) );
		encoder.stream32.write( pack4b( data.length, false ) );
		encoder.counters.arr_hdr+=5;
	}

	// Encode the short array
	encodePrimitive( encoder, data[0] );

}

/**
 * Encode a number of consecutive primitives
 */
function encodeArray_PRIM_RAW( encoder, data ) {

	//
	// Raw Primitive Array (PRIM_RAW)
	//
	// .......  .   + Signature ID
	// 0110101 [LN]     [16-bit]
	//

	// Write chunk header
	encoder.counters.arr_prim_raw+=1;
	encoder.log(LOG.ARR, "array.prim.raw, len="+data.length+
		", peek="+data[0]+" [");
	encoder.logIndent(1);

	if (data.length < UINT16_MAX) { // 16-bit length prefix
		encoder.stream8.write( pack1b( ARR_OP.PRIM_RAW | NUMTYPE_LN.UINT16 ) );
		encoder.stream16.write( pack2b( data.length, false ) );
		encoder.counters.arr_hdr+=3;
	} else { // 32-bit length prefix
		encoder.stream8.write( pack1b( ARR_OP.PRIM_RAW | NUMTYPE_LN.UINT32 ) );
		encoder.stream32.write( pack4b( data.length, false ) );
		encoder.counters.arr_hdr+=5;
	}

	// Write primitives
	for (var i=0, l=data.length; i<l; ++i)
		encodePrimitive( encoder, data[i] );

	// Close log group
	encoder.logIndent(-1);
	encoder.log(LOG.ARR, "]");

}

/**
 * Encode array data as one or more chunks of other types
 */
function encodeArray_PRIM_CHUNK( encoder, data, chunks ) {

	//
	// Chunked Primitive Array (PRIM_CHUNK)
	//
	// ........
	// 01111101
	//

	var chunk, chunkType, chunkSize, chunkSubType, part;

	// Write chunk header
	encoder.stream8.write( pack1b( ARR_OP.PRIM_CHUNK ) );
	encoder.counters.arr_hdr+=1;
	encoder.counters.arr_prim_chunk+=1;
	encoder.log(LOG.ARR, "array.prim.chunk, len="+data.length+
		", chunks="+chunks.length+", peek="+data[0]+" [");
	encoder.logIndent(1);

	// Encode individual chunks
	for (var i=0, ofs=0, llen=chunks.length; i<llen; ++i) {
		encodeArray_Chunk( encoder, data.slice(ofs, ofs+chunks[i][1]), chunks[i][2], chunks[i][3] );
		ofs += chunks[i][1];
	}

	// Write chunk termination
	encoder.stream8.write( pack1b( ARR_OP.PRIM_CHUNK_END ) );
	encoder.counters.arr_hdr+=1;

	encoder.logIndent(-1);
	encoder.log(LOG.ARR, "]");

}

/**
 * Encode array data as an empty array
 */
function encodeArray_EMPTY( encoder ) {

	//
	// Empty Array (EMPTY)
	//
	// ........
	// 01111110
	//

	encoder.counters.arr_empty+=1;
	encoder.log(LOG.ARR, "array.empty");
	encoder.stream8.write( pack1b( ARR_OP.EMPTY ) );
	encoder.counters.op_prm+=1;

}

/**
 * Encode an array chunk, previously constructed
 * by chunkForwardanalysis
 */
function encodeArray_Chunk( encoder, data, chunkType, chunkSubType ) {
	var n_type, na;

	// console.log(">>> CFWA Chunk=", _ARR_CHUNK[chunkType]);
	// console.log(">>> =",data);

	// Encode array component according to chunk type
	switch (chunkType) {

		// Encode as an array of primitives
		case ARR_CHUNK.PRIMITIVES:
			if (data.length < 255) {
				encodeArray_PRIM_SHORT( encoder, data );
			} else {
				encodeArray_PRIM_RAW( encoder, data );
			}
			break;

		// Encode as a repeated array
		case ARR_CHUNK.REPEAT:

			// Check if the repeated items are numeric or primitivie
			n_type = getTypedArrayType( data );
			if ( n_type <= NUMTYPE.NUMERIC ) {

				/* If that's numeric, perform fast numeric analysis to 
				   find it's type. */
				if (n_type === NUMTYPE.NUMERIC) {
					na = analyzeNumericArray( data, false );
					n_type = na.type;
				}

				// Encode numeric repeated array if number
				encodeArray_NUM_REPEATED( encoder, data, n_type );
			} else {
				// Encode primitive repeated array otherwise
				encodeArray_PRIM_REPEATED( encoder, data );
			}
			break;

		// encode as a numeric array
		case ARR_CHUNK.NUMERIC:
			encodeArray_Numeric( encoder, data, chunkSubType );
			break;

		// Encode as a bulk of plain objects
		case ARR_CHUNK.BULK_PLAIN:
			encodeArray_PRIM_BULK_PLAIN( encoder, data, chunkSubType );
			break;

		// Encode as a bulk of known objects
		case ARR_CHUNK.BULK_KNOWN:
			encodeArray_PRIM_BULK_KNOWN( encoder, data, chunkSubType );
			break;

		// Just precaution
		default:
			throw new Errors.EncodeError('Trying to encode an unknown chunk (type='+chunkType+')!');

	}
}

/**
 * Encode an array that is already classified as numeric
 */
function encodeArray_Numeric( encoder, data, n_type ) {
	var na, keep = true, v, lv, same = true;

	// Separate small array case
	if (data.length < 256) {

		// If the numeric type is unknown, try to find actual type
		if (n_type === NUMTYPE.NUMERIC) {

			// Perform fast numeric analysis (skip delta)
			na = analyzeNumericArray( data, false );

			// Check if this is not a numeric array (getTypedArrayType can fail
			// in Array cases since it's optimised for speed, not accuracy)
			if (na === null) {
				keep = false;
			} else {
				n_type = na.type;
				same = na.same;
			}

		} else {

			// Test for same
			lv = data[0];
			for (var i=1, len=data.length; i<len; ++i) {
				v = data[i]; if (v !== lv) {
					same = false; break;
				} lv = v;
			}

		}

		// If for any reason this array is not numeric, don't
		// try to encode it
		if (keep) {

			if (same) {
				// If all values are the same, prefer repeated instead of short
				// console.log(">ARR>",data.length,"itms as REPEATED");
				encodeArray_NUM_REPEATED( encoder, data, n_type );
			} else {
				// Encode small numeric array
				// console.log(">ARR>",data.length,"itms as SHORT");
				encodeArray_NUM_SHORT( encoder, data, n_type );
			}

		} else {

			// Pass it to primitive encoder
			encodeArray_Primitive( encoder, data );

		}

	} else {

		// Perform full numeric type analysis and encode numeric array
		na = analyzeNumericArray( data, true );

		// Check if this is not a numeric array (getTypedArrayType can fail
		// in Array cases since it's optimised for speed, not accuracy)
		if (na !== null) {

			// Define generic type
			if (n_type === NUMTYPE.NUMERIC) {
				n_type = na.type;
			}

			// If all values are the same, encode using same numeric encoding
			if (na.same) {
				// console.log(">ARR>",data.length,"itms as REPEATED");
				encodeArray_NUM_REPEATED( encoder, data, n_type );
				return;
			}

			// If we have more than <thresshold> items with the same
			// value, break into chunked array
			if (na.psame >= encoder.optimize.repeat_thresshold) {
				encodeArray_Primitive( encoder, data );
				return;
			}

			// Perform detailed analysis for downscaling and delta-encoding
			var n_dws = getDownscaleType( n_type, na );
			// console.log(">>[DWS]>> n_type="+_NUMTYPE[n_type]+", analysis=",na,":",_NUMTYPE[n_dws]);

			// Get sizes of different encoding approaches
			var b_raw = sizeOfType( n_type ),
				b_dws = sizeOfType( n_dws ),
				b_delta = sizeOfType( na.delta_type ),
				b_min = Math.min(b_raw, b_dws, b_delta);

			// Pick best, according to speed preference
			if (b_min === b_raw) {
				// Encode raw
				// console.log(">ARR>",data.length,"itms as RAW");
				encodeArray_NUM_RAW( encoder, data, n_type );
			} else if (b_min === b_dws) {
				// Encode downscaled
				// console.log(">ARR>",data.length,"itms as DOWNSCALED");
				encodeArray_NUM_DWS( encoder, data, n_type, n_dws );
			} else if (b_min === b_delta) {
				// Encode delta
				// console.log(">ARR>",data.length,"itms as DELTA");
				if (na.dmode == 1) {
					encodeArray_NUM_DELTA_INT( encoder, data, n_type, na.delta_type );
				} else if ((na.dmode == 2) && encoder.optimize.float_int_downscale) {
					encodeArray_NUM_DELTA_FLOAT( encoder, data, n_type, na.delta_type, na.mean, na.fscale );
				} else {
					encodeArray_NUM_RAW( encoder, data, n_type );
				}
			}

		} else {

			// Pass it to primitive encoder
			encodeArray_Primitive( encoder, data );

		}

	}

}

/**
 * Encode an array that is already classified as primitive
 */
function encodeArray_Primitive( encoder, data ) {

	// Check for small primitive array
	if (data.length < 256) {

		// Test if these 255 values are the same
		var v, lv=data[0], same=(data.length>1);
		for (var i=1, len=data.length; i<len; ++i) {
			v = data[i];
			if ( v !== lv ) {
				if ((typeof lv === 'object') && encoder.optimize.cfwa_object_byval
					&& deepEqual( v, lv, {strict:true} )) {
					continue;
				}
				same = false;
				break;
			}
		}

		// Encode short or repeated
		if (same) {
			encodeArray_PRIM_REPEATED( encoder, data );
		} else {
			encodeArray_PRIM_SHORT( encoder, data );
		}
		return;
	}

	// Analyze primitive array and return clusters of values
	// that can be efficiently merged (such as numbers, repeated values,
	// primitives etc.)
	var chunks = analyzePrimitiveArray( encoder, data );
	if (chunks.length === 1) {

		// Just check
		if (chunks[0][1] !== data.length) {
			throw new Errors.AssertError('Primitive array analysis reported single chunk but does not match array length!');
		}

		// Just encode a single chunk as array component
		encodeArray_Chunk( encoder, data, chunks[0][2], chunks[0][3] );

	} else {

		// We have more than one chunk, start encoding chunked array
		encodeArray_PRIM_CHUNK( encoder, data, chunks );

	}

}

/**
 * Encode the specified array
 */
function encodeArray( encoder, data ) {
	encoder.log(LOG.PRM, "array, len="+data.length+", peek="+data[0]);
	
	// Check for empty array
	if (data.length === 0) {
		encodeArray_EMPTY( encoder );
		return;
	}

	// Get typed array typed
	var tt = getTypedArrayType(data);

	// Check for numerical array
	if ( tt <= NUMTYPE.NUMERIC ) {
		encodeArray_Numeric( encoder, data, tt );
	} else {
		encodeArray_Primitive( encoder, data );
	}

}

/**
 * Encode buffer in the array
 */
function encodeBuffer( encoder, buffer_type, mime_type, buffer ) {

	// Write buffer header according to buffer length
	if (buffer.length < UINT8_MAX) {
		encoder.stream8.write( pack1b( PRIM_OP.BUFFER | buffer_type | 0x00 ) );
		encoder.stream8.write( pack1b( buffer.length ) );
		encoder.counters.dat_hdr+=2;
	} else if (buffer.length < UINT16_MAX) {
		encoder.stream8.write( pack1b( PRIM_OP.BUFFER | buffer_type | 0x08 ) );
		encoder.stream16.write( pack2b( buffer.length ) );
		encoder.counters.dat_hdr+=3;
	} else if (buffer.length < UINT32_MAX) {
		encoder.stream8.write( pack1b( PRIM_OP.BUFFER | buffer_type | 0x10 ) );
		encoder.stream32.write( pack4b( buffer.length ) );
		encoder.counters.dat_hdr+=5;
	} else {
		// 4 Gigs? Are you serious? Of course we can fit it in a Float64, but WHY?
		throw new Errors.RangeError('The buffer you are trying to encode is bigger than the supported size!');
	}

	// Write MIME Type (from string lookup table)
	if (mime_type != null) {
		encoder.stream16.write( pack2b( mime_type ) );
		encoder.counters.dat_hdr+=2;
	}

	// Write buffer
	if (buffer_type === PRIM_BUFFER_TYPE.STRING_UTF8) {

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
		for (var i=0, strLen=str.length; i<strLen; ++i) {
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
	for (var i=0, strLen=str.length; i<strLen; ++i) {
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
	var enc = encoder.profile.encode(object);
	if (!enc) {
		throw new Errors.XRefError('An object trying to encode was not declared in the object table!');
	}

	// Populate property table
	var eid = enc[0], propertyTable = enc[1]( object );

	// Check ByVal ref
	id = encoder.lookupIVal( propertyTable, eid );
	if (id > -1) 
		{ encodeIREF( encoder, id ); return; }

	// Keep this object for internal cross-refferencing
	encoder.log(LOG.OBJ,"eid="+eid+", properties="+propertyTable.length);
	encoder.keepIRef( object, propertyTable, eid );

	// Check if we should use 12-bit or 5-bit index
	if (eid < 32) {

		// Write entity opcode
		encoder.stream8.write( pack1b( PRIM_OP.OBJECT | OBJ_OP.KNOWN_5 | eid ) );
		encoder.counters.op_prm+=1;

	} else {

		// Split 12-bit number
		var eid_hi = (eid & 0xF00) >> 8,
			eid_lo = eid & 0xFF;

		// Write entity
		encoder.stream8.write( pack1b( PRIM_OP.OBJECT | OBJ_OP.KNOWN_12 | eid_hi ) );
		encoder.stream8.write( pack1b( eid_lo ) );
		encoder.counters.op_prm+=2;

	}

	// Write property table as an array
	encodeArray( encoder, propertyTable );

}

/**
 * Encode primitive date
 */
function encodePrimitiveDate( encoder, object ) {

	// We have a date primitive
	encoder.stream8.write( pack1b( PRIM_OP.OBJECT | OBJ_OP.PRIMITIVE | OBJ_PRIM.DATE ) );

	// Save date and timezone
	encoder.stream64.write( pack8f( Number(object) ) );
	encoder.stream16.write( pack1b( object.getTimezoneOffset() / 10, true ) );

}

/**
 * Encode plain object
 */
function encodePlainObject( encoder, object ) {

	// Extract plain object signature
	var o_keys =Object.keys(object);
		// signature = o_keys.join("+"),
	var sid = encoder.getSignatureID( o_keys );

	// Collect values of all properties
	var values = [];
	for (var i=0, len=o_keys.length; i<len; ++i)
		values.push( object[o_keys[i]] );

	encoder.log(LOG.PLO, "plain["+sid+"], signature="+o_keys.toString()+", sid="+sid);

	// Split entity ID in a 11-bit number
	var sid_hi = (sid & 0x700) >> 8,
		sid_lo =  sid & 0xFF;

	// We have a known entity ID, re-use it
	encoder.stream8.write( pack1b( PRIM_OP.OBJECT | OBJ_OP.PLAIN_LOOKUP | sid_hi ) );
	encoder.stream8.write( pack1b( sid_lo ) );
	encoder.counters.op_prm+=2;

	// Keep iref and encode
	encodeArray( encoder, values );

}

/**
 * Encode a primitive number
 */
function encodePrimitive_NUMBER(encoder, data, type) {

	// Write header
	encoder.log(LOG.PRM, "primitive.number, type="+_NUMTYPE[numType]+", n="+data);
	encoder.stream8.write( pack1b( PRIM_OP.NUMBER | numType ) );
	encoder.counters.op_prm+=1;

	// Write data
	pickStream( encoder, numType )
		.write( packByNumType[numType]( data ) );

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

	} else if (typeof data === "number") {

		if (isNaN(data)) {

			// Write extended simple primitive
			encoder.log(LOG.PRM, "simple[NaN]");
			encoder.stream8.write( pack1b( PRIM_OP.SIMPLE_EX | PRIM_SIMPLE_EX.NAN ));
			encoder.counters.op_prm+=1;

		} else {

			// Get type
			var numType = getNumType( data, data, (data % 1) !== 0 );
			if (numType > NUMTYPE.FLOAT64) {
				throw new Errors.AssertError('A primitive was identified as number but getNumType failed!');
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
		encodeArray( encoder, data );

	// ===============================
	//  Buffers
	// ===============================

	} else if (typeof data === "string") {

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

	} else if (data instanceof Date) {

		// Encode plain object
		encoder.log(LOG.PRM, "object[date]");
		encodePrimitiveDate( encoder, data );

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
	// The final file is assembled from these chunks, or kept as-is if
	// requested to separate into multiple bundles (sparse bundle).
	this.filename = filename;
	this.stream64 = new BinaryStream( filename + '_b64.jbbp', 8, ((this.logFlags & LOG.WRT) != 0) );
	this.stream32 = new BinaryStream( filename + '_b32.jbbp', 4, ((this.logFlags & LOG.WRT) != 0) );
	this.stream16 = new BinaryStream( filename + '_b16.jbbp', 2, ((this.logFlags & LOG.WRT) != 0) );
	this.stream8  = new BinaryStream( filename + '.jbbp', 	  1, ((this.logFlags & LOG.WRT) != 0) );

	// Counters for optimising the protocol
	this.counters = {
		op_ctr:  0, arr_chu: 0,
		op_prm:  0, dat_hdr: 0,
		ref_str: 0, op_iref: 0,
		arr_hdr: 0, op_xref: 0,

		arr_dws: 0,
		arr_delta_float: 0,
		arr_delta_int: 0,
		arr_num_repeated: 0,
		arr_num_raw : 0,
		arr_num_short: 0,
		arr_prim_bulk_plain: 0,
		arr_prim_bulk_known: 0,
		arr_prim_short: 0,
		arr_prim_repeated: 0,
		arr_prim_raw: 0,
		arr_prim_chunk: 0,
		arr_empty: 0,
	};

	// Optimisation flags
	this.optimize = {
		cfwa_object_byval: true,	 // By-value de-duplication of objects in chunk forward analysis
		repeat_thresshold: 0.25,	 // How many consecutive same items are enough for an array in order
									 // to break it as a chunked array.
		float_int_downscale: false,	 // Downscale floats to integers multiplied by scale
	};

	// If we are requested to use sparse bundless, add some space for header in the stream8
	this.sparse = (config['sparse'] === undefined) ? false : config['sparse'];
	if (this.sparse) {

		this.stream8.write( pack2b( 0x4231 ) ); 		// Magic header
		this.stream8.write( pack2b( 0 ) ); 				// Object Table ID
		this.stream8.write( pack2b( VERSION ) );	 	// Protocol Version
		this.stream8.write( pack2b( 0 ) ); 				// Reserved

		this.stream8.write( pack4b( 0 ) ); // 64-bit buffer lenght
		this.stream8.write( pack4b( 0 ) ); // 32-bit buffer lenght
		this.stream8.write( pack4b( 0 ) ); // 16-bit buffer length
		this.stream8.write( pack4b( 0 ) ); // 8-bit buffer length
		this.stream8.write( pack4b( 0 ) ); // Length (in bytes) of string lookup table
		this.stream8.write( pack4b( 0 ) ); // Length (in bytes) of plain object signature table

	}

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
	this.profile = this.config['profile'];

	// Database properties
	this.dbTags = [];
	this.dbObjects = [];
	this.database = {};

	// By-Reference and By-Value lookup tables
	this.indexRef = [];
	this.indexVal = new Array( this.profile.size );

	// String lookup table
	this.stringLookup = [];
	this.stringLookupQuick = {};

	// Plain object signatures lookup table
	this.plainObjectSignatureID = 0;
	this.plainObjectSignatureLookup = {};
	this.plainObjectSignatureTable = [];

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

		// Header length
		var header_length = 32;

		// Write down null-terminated string lookup table in the end
		var stream8offset = this.stream8.offset;
		for (var i=0; i<this.stringLookup.length; ++i) {
			this.stream8.write( new Buffer( this.stringLookup[i] ) );
			this.stream8.write( new Buffer( [0] ) );
		}
		// console.log("ST: len="+(this.stream8.offset - stream8offset)+", sl=", this.stringLookup );

		// Encode the object signature table
		var stream16offset = this.stream16.offset;
		for (var i=0; i<this.plainObjectSignatureTable.length; ++i)
			this.stream16.write( this.plainObjectSignatureTable[i] );
		// console.log("OT: len="+(this.stream16.offset - stream16offset)+", ot=", this.plainObjectSignatureTable );

		// Finalize individual streams
		this.stream64.finalize();
		this.stream32.finalize();
		this.stream16.finalize();
		this.stream8.finalize();

		// If sparse bundle update stream8
		var totalSize = 0;
		if (this.sparse) {

			// Overwrite header
			this.stream8.writeAt( 2,  pack2b( this.profile.id ) );  // Update object table ID
			this.stream8.writeAt( 8,  pack4b( this.stream64.offset ) ); // 64-bit buffer lenght
			this.stream8.writeAt( 12, pack4b( this.stream32.offset ) ); // 32-bit buffer lenght
			this.stream8.writeAt( 16, pack4b( this.stream16.offset ) ); // 16-bit buffer length
			this.stream8.writeAt( 20, pack4b( this.stream8.offset - header_length ) );  // 8-bit buffer length (exclude header)
			this.stream8.writeAt( 24, pack4b( this.stream8.offset - stream8offset ) ); // Length of string table
			this.stream8.writeAt( 28, pack4b( this.stream16.offset - stream16offset ) ); // Length of signature table

			// Close streams
			this.stream8.close();  this.stream16.close(); 
			this.stream32.close(); this.stream64.close(); 

			// Calculate total size
			totalSize = this.stream8.offset +  this.stream16.offset + 
						this.stream32.offset + this.stream64.offset;

			// Update filename
			this.filename += ".jbbp";

			// Write summar header
			if ((this.logFlags & LOG.SUMM)) {
				console.info("Encoding size =",totalSize,"bytes");
				console.info("     8b chunk =",this.stream8.offset,"bytes");
				console.info("    16b chunk =",this.stream16.offset,"bytes");
				console.info("    32b chunk =",this.stream32.offset,"bytes");
				console.info("    64b chunk =",this.stream64.offset,"bytes");

			}

		}

		// If not separating, merge everything
		else {

			// Open final stream
			var finalStream = new BinaryStream( this.filename + '.jbb', 8 );
			finalStream.write( pack2b( 0x4231 ) );  			 // Magic header
			finalStream.write( pack2b( this.profile.id ) );  // Object Table ID
			finalStream.write( pack2b( VERSION ) );	  			 // Version
			finalStream.write( pack2b( 0 ) );  					 // Reserved
			finalStream.write( pack4b( this.stream64.offset ) ); // 64-bit buffer lenght
			finalStream.write( pack4b( this.stream32.offset ) ); // 32-bit buffer lenght
			finalStream.write( pack4b( this.stream16.offset ) ); // 16-bit buffer length
			finalStream.write( pack4b( this.stream8.offset ) );  // 8-bit buffer length
			finalStream.write( pack4b( this.stream8.offset - stream8offset ) ); // Length of string table
			finalStream.write( pack4b( this.stream16.offset - stream16offset ) ); // Length of signature table

			// Merge individual streams
			finalStream.merge( this.stream64 ); finalStream.merge( this.stream32 );
			finalStream.merge( this.stream16 ); finalStream.merge( this.stream8 );

			// Close
			finalStream.finalize();
			finalStream.close();
			totalSize = finalStream.offset;

			// Close and delete helper stream files
			this.stream8.close();  fs.unlink( this.filename + '.jbbp' );
			this.stream16.close(); fs.unlink( this.filename + '_b16.jbbp' );
			this.stream32.close(); fs.unlink( this.filename + '_b32.jbbp' );
			this.stream64.close(); fs.unlink( this.filename + '_b64.jbbp' );

			// Update filename
			this.filename += ".jbb";

			// Write summar header
			if ((this.logFlags & LOG.SUMM)) {
				console.info("Encoding size =",finalStream.offset,"bytes");
			}

		}

		// Write protocol overhead table
		if ((this.logFlags & LOG.PDBG) != 0) {
			console.info("-----------------------------------");
			console.info(" Binary Protocol Overhead Analysis");
			console.info("-----------------------------------");
			console.info(" 64-bit Stream      : ", this.stream64.offset, "b");
			console.info(" 32-bit Stream      : ", this.stream32.offset, "b");
			console.info(" 16-bit Stream      : ", this.stream16.offset, "b");
			console.info("  8-bit Stream      : ", this.stream8.offset,  "b");
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
			console.info(" NUM_DWS            : ",this.counters.arr_dws);
			console.info(" NUM_DELTA_FLOAT    : ",this.counters.arr_delta_float);
			console.info(" NUM_DELTA_INT      : ",this.counters.arr_delta_int);
			console.info(" NUM_REPEATED       : ",this.counters.arr_num_repeated);
			console.info(" NUM_RAW            : ",this.counters.arr_num_raw );
			console.info(" NUM_SHORT          : ",this.counters.arr_num_short);
			console.info(" PRIM_BULK_PLAIN    : ",this.counters.arr_prim_bulk_plain);
			console.info(" PRIM_BULK_KNOWN    : ",this.counters.arr_prim_bulk_known);
			console.info(" PRIM_SHORT         : ",this.counters.arr_prim_short);
			console.info(" PRIM_REPEATED      : ",this.counters.arr_prim_repeated);
			console.info(" PRIM_RAW           : ",this.counters.arr_prim_raw);
			console.info(" PRIM_CHUNK         : ",this.counters.arr_prim_chunk);
			console.info(" EMPTY              : ",this.counters.arr_empty);
			console.info("-----------------------------------");
			console.info("");
			var perc = ((sum / totalSize) * 100).toFixed(2);
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
		if (index === undefined) {
			index = this.stringLookup.length;
			this.stringLookup.push( string );
			this.stringLookupQuick[string]= index;
		}
		return index;
	},

	/**
	 * Lookup if that object already exits in the x-ref table
	 * and return the ID of it's string on the string lookup table
	 */
	'lookupXRef': function( object ) {
		var key = object.__xref__;
		if (key === undefined) return -1;

		// Return stringID of the key
		return this.stringID( key );		

		// // Lookup object on xref table
		// var id = this.dbObjects.indexOf( object );
		// if (id < 0) return -1;

		// // Get string ID of the db tag
		// return this.stringID( this.dbTags[id] );

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
	 * Lookup if that object already exits in the i-ref table
	 * and return it's ID.
	 */
	'lookupIRef': function( object ) {
		if (object.__iref__ === undefined) return -1;
		return object.__iref__;
		// return this.indexRefLookup[ object.__iref__ ];

		// var idx = this.indexRefLookup[object];
		// if (idx === undefined) return -1;
		// return idx;

		// return this.indexRef.indexOf( object );
	},

	/**
	 * Keep the specified object in the lookup tables
	 */
	'keepIRef': function( object, propertyTable, eid ) {

		// Create a new BST for this entity for by-value matching
		if (this.indexVal[eid] === undefined)
			this.indexVal[eid] = new BinarySearchTree({
				compareKeys: objectBstComparison,
				checkValueEquality: objectBstEquals,
				unique: true,
			});

		// Keep object references
		var nid = this.indexRef.length;
		this.indexVal[eid].insert( propertyTable, nid );
		this.indexRef.push( object );

		// Keep ID on the object itself so we have a faster lookup,
		// and do it in a non-enumerable property so it doesn't pollute the objects.
		Object.defineProperty(
			object, "__iref__", {
				enumerable: false,
				value: nid,
			}
		);

	},

	/**
	 * Calculate object signature without registering it
	 */
	'calcObjectSignature': function( object ) {
		var keys = Object.keys(object), k, v,
			lVals = [], lArrays = [], lObjects = [];

		// Sort to values, arrays and objects
		var lookupString = "";
		for (var i=0; i<keys.length; ++i) {
			k = keys[i]; v = object[k];
			if ((v instanceof Uint8Array) || (v instanceof Int8Array) ||
				(v instanceof Uint16Array) || (v instanceof Int16Array) ||
				(v instanceof Uint32Array) || (v instanceof Int32Array) ||
				(v instanceof Float32Array) || (v instanceof Float64Array) ||
				(v instanceof Array) ) {
				lookupString += "@"+k;
			} else if (v.constructor === ({}).constructor) {
				lookupString += "%"+k;
			} else {
				lookupString += "$"+k;
			}
		}

		// Return lookup string
		return lookupString;
	},

	/**
	 * Get object signature
	 */
	'getObjectSignature': function( object ) {
		var keys = Object.keys(object), k, v, lookupString,
			lVals = [], lArrays = [], lObjects = [];

		// Sort to values, arrays and objects
		lookupString = "";
		for (var i=0; i<keys.length; ++i) {
			k = keys[i]; v = object[k];
			if ((v instanceof Uint8Array) || (v instanceof Int8Array) ||
				(v instanceof Uint16Array) || (v instanceof Int16Array) ||
				(v instanceof Uint32Array) || (v instanceof Int32Array) ||
				(v instanceof Float32Array) || (v instanceof Float64Array) ||
				(v instanceof Array) ) {
				lArrays.push(k);
				lookupString += "@"+k;
			} else if (v.constructor === ({}).constructor) {
				lObjects.push(k);
				lookupString += "%"+k;
			} else {
				lVals.push(k);
				lookupString += "$"+k;
			}
		}

		// Lookup or create signature
		i = this.plainObjectSignatureLookup[lookupString];
		if (i === undefined) {

			// Compile signature
			var sigbuf = [];
			sigbuf.push( pack2b( lVals.length ) );
			for (var i=0; i<lVals.length; ++i) {
				sigbuf.push( pack2b( this.stringID(lVals[i]) ) );
			}
			sigbuf.push( pack2b( lArrays.length ) );
			for (var i=0; i<lArrays.length; ++i) {
				sigbuf.push( pack2b( this.stringID(lArrays[i]) ) );
			}
			sigbuf.push( pack2b( lObjects.length ) );
			for (var i=0; i<lObjects.length; ++i) {
				sigbuf.push( pack2b( this.stringID(lObjects[i]) ) );
			}

			// Encode to the 16-bit stream
			this.plainObjectSignatureTable.push( Buffer.concat( sigbuf ) );
			this.plainObjectSignatureLookup[lookupString] 
				= i = this.plainObjectSignatureTable.length - 1;
		}

		// Return index
		return [i, lVals, lArrays, lObjects];
	},

	/**
	 * Create and/or return the property signature with the given ID
	 */
	'getSignatureID': function( keys ) {
		var lookupString = keys.toString();
		var id = this.plainObjectSignatureLookup[lookupString];			
		if (id === undefined) {

			// Create new signature buffer
			var sigbuf = [];
			sigbuf.push( pack2b( keys.length, false ) );
			for (var i=0, l=keys.length; i<l; ++i) {
				sigbuf.push( pack2b( this.stringID(keys[i]), false ) );
			}

			// Keep on table
			this.plainObjectSignatureTable.push( Buffer.concat( sigbuf ) );
			this.plainObjectSignatureLookup[lookupString] 
				= id = this.plainObjectSignatureTable.length - 1;

		}
		return id;
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
		var keys = Object.keys(db), k, v;
		for (var i=0; i<keys.length; ++i) {
			k = keys[i]; v = db[k];
			if (!db.hasOwnProperty(k)) continue;

			this.dbTags.push( prefix+k );
			this.dbObjects.push( db[k] );

			// Define the XRef property for faster lookup of the key
			Object.defineProperty(
				v, "__xref__", {
					enumerable: false,
					value: k,
				}
			);

		}
		// Keep reference of database
		this.database = db;
	},

	/**
	 * Encode entity
	 */
	'encode': function( entity, name ) {
		var tn = this.bundleName + "/" + name;

		// Write control operation
		this.stream8.write( pack1b( CTRL_OP.EXPORT ) );
		this.counters.op_ctr++;
		// Write string ID from the string lookup table
		this.stream16.write( pack2b( this.stringID(tn) ) );
		this.counters.ref_str+=2;

		// Encode primitive
		encodePrimitive( this, entity );

		// Keep on xref database
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
		if (relPath.substr(0,this.baseDir.length) === this.baseDir)
			relPath = relPath.substr( this.baseDir.lengh );

		// Write control operation
		this.stream8.write( pack1b( CTRL_OP.EMBED ) );
		this.counters.op_ctr++;
		// Write string ID from the string lookup table
		this.stream16.write( pack2b( this.stringID(this.bundleName + "/" + relPath) ) );
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
		this.stream16.write( pack2b( this.stringID(this.bundleName + "/" + name) ) );
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
		if ((subsystem & this.logFlags) === 0) return;

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
			for (var i=0; i<indent; ++i) this.logPrefix+=iChar;
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
