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
	PRIM_BULK_KNOWN: 0x6D, // Bulk Array of Known Objects
	PRIM_SHORT: 	 0x6E, // Short Primitive Array
	PRIM_CHUNK: 	 0x6F, // Chunked Primitive ARray
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
	BULK_OBJECT: 5, // A bulk of many objects
};

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
			if (num < INT8_MIN) throw {
				'name' 		: 'PackError',
				'message'	: 'Packing number bigger than 8-bits ('+num+')!',
				toString 	: function(){return this.name + ": " + this.message;}
			};
			else if (num > INT8_MAX) throw {
				'name' 		: 'PackError',
				'message'	: 'Packing number bigger than 8-bits ('+num+')!',
				toString 	: function(){return this.name + ": " + this.message;}
			};
		} else {
			if (num < 0) throw {
				'name' 		: 'PackError',
				'message'	: 'Packing negative number on unsigned 8-bit ('+num+')!',
				toString 	: function(){return this.name + ": " + this.message;}
			};
			else if (num > UINT8_MAX) throw {
				'name' 		: 'PackError',
				'message'	: 'Packing number bigger than 8-bits ('+num+')!',
				toString 	: function(){return this.name + ": " + this.message;}
			};
		} }
		if (signed) packViewI8[0] = num;
		else packViewU8[0] = num;
		n[0] = packViewU8[0];
		return n;
	},
	pack2b = function( num, signed ) {
		var n = new Buffer(2);
		if (SAFE) { if (signed) {
			if (num < INT16_MIN) throw {
				'name' 		: 'PackError',
				'message'	: 'Packing integer bigger than 16-bits ('+num+')!',
				toString 	: function(){return this.name + ": " + this.message;}
			};
			else if (num > INT16_MAX) throw {
				'name' 		: 'PackError',
				'message'	: 'Packing integer bigger than 16-bits ('+num+')!',
				toString 	: function(){return this.name + ": " + this.message;}
			};
		} else {
			if (num < 0) throw {
				'name' 		: 'PackError',
				'message'	: 'Packing negative integer on unsigned 16-bit ('+num+')!',
				toString 	: function(){return this.name + ": " + this.message;}
			};
			else if (num > UINT16_MAX) throw {
				'name' 		: 'PackError',
				'message'	: 'Packing integer bigger than 16-bits ('+num+')!',
				toString 	: function(){return this.name + ": " + this.message;}
			};
		} }
		if (signed) packViewI16[0] = num;
		else packViewU16[0] = num;
		for (var i=0; i<2; i++) n[i]=packViewU8[i];
		return n;
	},
	pack4b = function( num, signed ) {
		var n = new Buffer(4);
		if (SAFE) { if (signed) {
			if (num < INT32_MIN) throw {
				'name' 		: 'PackError',
				'message'	: 'Packing integer bigger than 32-bits ('+num+')!',
				toString 	: function(){return this.name + ": " + this.message;}
			};
			else if (num > INT32_MAX) throw {
				'name' 		: 'PackError',
				'message'	: 'Packing integer bigger than 32-bits ('+num+')!',
				toString 	: function(){return this.name + ": " + this.message;}
			};
		} else {
			if (num < 0) throw {
				'name' 		: 'PackError',
				'message'	: 'Packing negative integer on unsigned 32-bit ('+num+')!',
				toString 	: function(){return this.name + ": " + this.message;}
			};
			else if (num > UINT32_MAX) throw {
				'name' 		: 'PackError',
				'message'	: 'Packing integer bigger than 32-bits ('+num+')!',
				toString 	: function(){return this.name + ": " + this.message;}
			};
		} }
		if (signed) packViewI32[0] = num;
		else packViewU32[0] = num;
		for (var i=0; i<4; i++) n[i]=packViewU8[i];
		return n;
	},
	pack4f = function( num ) {
		var n = new Buffer(4);
		if (SAFE) { if (num == 0.0) { }
		else if ((Math.abs(num) < FLOAT32_SMALL) || (num < FLOAT32_NEG) || (num > FLOAT32_POS)) throw {
			'name' 		: 'PackError',
			'message'	: 'Packing float bigger than 32-bits ('+num+')!',
			toString 	: function(){return this.name + ": " + this.message;}
		} };
		packViewF32[0] = num;
		for (var i=0; i<4; i++) n[i]=packViewU8[i];
		return n;
	},
	pack8f = function( num ) {
		var n = new Buffer(8);
		if (SAFE) { if (num == 0.0) { }
		else if (Math.abs(num) < 1.7E-108) throw {
			'name' 		: 'PackError',
			'message'	: 'Packing float bigger than 64-bits ('+num+')!',
			toString 	: function(){return this.name + ": " + this.message;}
		};
		else if (Math.abs(num) > 1.7E+108) throw {
			'name' 		: 'PackError',
			'message'	: 'Packing float bigger than 64-bits ('+num+')!',
			toString 	: function(){return this.name + ": " + this.message;}
		} };
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
	 * Write a buffer using the compile function
	 */
	'write': function( buffer ) {
		if (this.logWrites) {
			var bits = String(this.__alignSize*8);
			if (bits.length === 1) bits=" "+bits;
			console.log((bits+"b ").yellow+("@"+this.offset/this.__alignSize).bold.yellow+": "+util.inspect(buffer));
		}
		this.__writeChunks.push( buffer );
		this.offset += buffer.length;
		this.__sync();
	},

	/**
	 * Write a buffer at a particular offset, bypassing counters
	 */
	'writeAt': function( offset, buffer ) {
		if (this.logWrites) {
			var bits = String(this.__alignSize*8);
			if (bits.length === 1) bits=" "+bits;
			console.log((bits+"b ").yellowBG+("@"+offset).bold.yellowBG+": "+util.inspect(buffer));
		}

		// Write at the specified offset
		fs.writeSync( this.__fd, buffer, 0, buffer.length, offset );
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
	for (var i=0, l=values.length; i<l; i++) {

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
		s_min = [min,min,min,min,min], s_min_i=0, s_max = [min,min,min,min,min], s_max_i=0, samples,
		a, b, d_type, cd, cv, lv = v[0];

	// Anlyze array items
	for (var i=0, l=v.length; i<l; i++) {
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
		if (is_same && (cv !== lv))
			is_same = false;

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

	// Finalize mean calculation
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
		'same'		: is_same,

	};

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
 * @return {array} - Returns an array with [ CHUNK_TYPE, LENGTH ]
 *
 */
function chunkForwardAnalysis( encoder, array, start ) {

	const TEST_NUMBER = 0,
		  TEST_PLAIN = 1,
		  TEST_PRIMITIVE = 2;

	var v, v_type, numtype, test_mode, break_candidate,	// Temporary variables
		keys, is_positive, new_keys, old_keys, is_numeric, some_overlap,
		have_optimised_items = false,
		c_same = 0, c_numeric = 0, c_plain = 0,			// Counters of individually optimisied items
		c_unoptimised = 0,
		last_test_mode, last_value, last_numtype, first_value, // Last state variables
		last_keys = [], all_positive = false, type_oscilating = false,
		min_num, max_num;

	// Get test mode of first value
	v = array[start];
	v_type = typeof v;
	last_numtype = NUMTYPE.NAN;
	if (v_type === 'number') {
		last_test_mode = TEST_NUMBER;
		last_numtype = getNumType( v, v, ((v % 1) !== 0) );
		all_positive = (v>0);
		min_num = max_num = v;
	} else if (v_type === 'string' ) {
		last_test_mode = TEST_PRIMITIVE;
	} else if (v_type === 'boolean' ) {
		last_test_mode = TEST_PRIMITIVE;
	} else if (v_type === 'undefined' ) {
		last_test_mode = TEST_PRIMITIVE;
	} else if (v === null) {
		last_test_mode = TEST_PRIMITIVE;
	} else if (v.constructor === ({}).constructor) {
		last_test_mode = TEST_PLAIN;
		last_keys = Object.keys( v ).sort();
	} else { /* Other objects */
		last_test_mode = TEST_PRIMITIVE;
	}
	last_value = v;

	// First values
	first_value = v;

	// Scan items
	for (var i=start+1, il=array.length; i<il; i++) {

		// Get test mode of the current value
		v = array[i];
		v_type = typeof v;
		numtype = NUMTYPE.NAN;
		is_positive = false;
		is_numeric = false;
		if (v_type === 'number') {
			test_mode = TEST_NUMBER;
			numtype = getNumType( v, v, ((v % 1) !== 0) );
			is_positive = (v>0);
			is_numeric = true;
		} else if (v_type === 'string' ) {
			test_mode = TEST_PRIMITIVE;
		} else if (v_type === 'boolean' ) {
			test_mode = TEST_PRIMITIVE;
		} else if (v_type === 'undefined' ) {
			test_mode = TEST_PRIMITIVE;
		} else if (v === null) {
			test_mode = TEST_PRIMITIVE;
		} else if (v.constructor === ({}).constructor) {
			test_mode = TEST_PLAIN;
		} else { /* Other objects */
			test_mode = TEST_PRIMITIVE;
		}

		// console.log("v=",v,"last_value=",last_value,"test_mode=",test_mode,"last_test_mode=",last_test_mode);

		// If test mode is the same, check if values remain the same
		if (test_mode === last_test_mode) {
			break_candidate = true;

			// If we have been oscilating on types that cannot be optimised
			// but now we have at least 2 consecutive optimisable items,
			// just break and let next call do the optimisation.
			if (type_oscilating) {
				// console.log(">> "+("Breaking due to type oscilating").yellow);
				break;
			}

			// Check optimisations
			switch (test_mode) {
				case TEST_NUMBER:
					if (last_value === v) {
						if (first_value !== v) {
							if (c_numeric) c_numeric--;
							break_candidate = true;
							break;
						}
						c_same++;
						have_optimised_items = true;
						break_candidate = false;
					}

					// Check for numeric subclass
					if (!isFloatMixing(last_numtype, numtype)) {
						// Allow type upscale
						if (isNumericSubclass(last_numtype, min_num, max_num, numtype)) {
							// console.log(">> " + ("Expanding numeric class from "+_NUMTYPE[last_numtype]+" to "+_NUMTYPE[numtype]).cyan);
							last_numtype = numtype;
						}
						// Accept only numeric subclasses
						if (isNumericSubclass(numtype, v, v, last_numtype)) {
							c_numeric++;
							have_optimised_items = true;
							break_candidate = false;
						// } else {
							// console.log(">> " + ("No subclass "+_NUMTYPE[numtype]+" (" + ((v>0)?">0":"<0") + ") of "+_NUMTYPE[last_numtype]).red);
						}
					// } else {
						// console.log(">> " + "Mixing floats".red);
					}

					break;

				case TEST_PLAIN:
					if ( encoder.optimize.cfwa_object_byval 
							? deepEqual( v, last_value )
							: (v === last_value) 
						) {
						if ( encoder.optimize.cfwa_object_byval 
							? !deepEqual( v, first_value )
							: (v !== first_value) ) {
							if (c_plain) c_plain--;
							break_candidate = true;
							break;
						}
						c_same++;
						have_optimised_items = true;
						break_candidate = false;
					}

					// Calculate key differences
					keys = Object.keys( v ).sort();
					new_keys = 0; some_overlap = false;
					old_keys = last_keys.length;
					for (var ja=0, jb=0, jl=last_keys.length; (ja<jl) && (jb<jl) ;) {
						if (keys[ja] < last_keys[jb]) {
							jb++;
							new_keys++;
							last_keys.push( keys[ja] )
						} else if (keys[ja] > last_keys[jb]) {
							ja++;
						} else {
							ja++;
							jb++;
							some_overlap = true;
						}
					}

					// Allow up to 25% extension of the key set
					if (some_overlap && (new_keys === 0) /*|| (new_keys < old_keys * 0.25)*/) {
						c_plain++;
						have_optimised_items = true;
						break_candidate = false;
					}

					break;

				case TEST_PRIMITIVE:
					if (last_value === v) {

						if (first_value !== v) {
							if (c_unoptimised) c_unoptimised--;
							break_candidate = true;
							break;
						}

						// If we have oscillating primitive values but sudently we have
						// a stable, continuous stream, roll back the last optimised value
						// and exit
						if (c_unoptimised) {
							c_unoptimised--;
						} else {
							c_same++;
							have_optimised_items = true;
							break_candidate = false;
						}

					} else {

						// This is a break candidate only if there were no
						// optimised items collected so far.
						// console.log(">",last_value,"!=",v);
						if (!have_optimised_items) {
							c_unoptimised++;
							break_candidate = false;
						}

					}
					break;
			}

			// If we couldn't optimise anything, break
			if (break_candidate) {
				// console.log(">> "+("Breaking due to a break candidate").yellow);
				break;
			}

		} else {

			// If we didn't have any optimised item and we are
			// oscilating between types, count them as primitive
			// objects in order to chunk them together.
			if (!have_optimised_items) {
				c_unoptimised++;
				type_oscilating = true;
			} else {
				// Otherwise break
				// console.log(">> "+("Breaking due to type oscilating towards unoptimised").yellow);
				break;
			}
		}

		// Keep current state as last
		all_positive = all_positive && is_positive;
		last_test_mode = test_mode;
		last_value = v;

		// Update min/max on numeric values
		if (is_numeric) {
			if (v < min_num)
				min_num = v;
			if (v > max_num)
				max_num = v;
		}

	}

	// Find maximum for best fit
	// console.log(">> same",c_same,", numeric", c_numeric, ", plain", c_plain,", unoptimised", c_unoptimised);
	var max = Math.max( c_same, c_numeric, c_plain, c_unoptimised );

	// [0] Nothing found? That's a single primitive
	if (max === 0) {
		return [ ARR_CHUNK.PRIMITIVES, 1, null ];

	// [1] Prefer repeated values
	} else if ( c_same === max ) {
		return [ ARR_CHUNK.REPEAT, c_same+1, null ];

	// [2] Then prefer numeric arrays
	} else if ( c_numeric === max ) {
		return [ ARR_CHUNK.NUMERIC, c_numeric+1, last_numtype ];

	// [3] Then prefer numeric arrays
	} else if ( c_plain === max ) {
		return [ ARR_CHUNK.BULK_PLAIN, c_plain+1, last_keys ];

	// [4] Finally, bulked, unoptimised primitives
	} else {
		return [ ARR_CHUNK.PRIMITIVES, c_unoptimised, null ];

	}

}

/**
 * Pick a matching downscaling type
 */
function downscaleType( fromType, toType ) {
	// Lookup conversion on the downscale table
	for (var i=0; i<NUMTYPE_DOWNSCALE.FROM.length; i++) {
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
	for (var i=0; i<NUMTYPE_DELTA_INT.FROM.length; i++) {
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
	for (var i=0; i<NUMTYPE_DELTA_FLOAT.FROM.length; i++) {
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
	for (var i=1; i<array.length; i++) {
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

	if (data.length < UINT16_MAX) { // 16-bit length prefix
		encoder.stream8.write( pack1b( ARR_OP.NUM_DWS | NUMTYPE_LN.UINT16 | (n_dws_type << 1) ) );
		encoder.stream16.write( pack2b( data.length, false ) );
		encoder.counters.arr_hdr+=3;
	} else { // 32-bit length prefix
		encoder.stream8.write( pack1b( ARR_OP.NUM_DWS | NUMTYPE_LN.UINT32 | (n_dws_type << 1) ) );
		encoder.stream32.write( pack4b( data.length, false ) );
		encoder.counters.arr_hdr+=5;
	}

	encoder.log(LOG.ARR, "array.numeric.downscaled, len="+data.length+
		", from="+_NUMTYPE[n_from]+", to="+_NUMTYPE[n_to]+
		", type="+_NUMTYPE_DOWNSCALE_DWS[n_dws_type]+" ("+n_dws_type+")");

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
		throw {
			'name' 		: 'EncodeError',
			'message'	: 'Non-viable float delta value from '+_NUMTYPE[n_from]+' to '+_NUMTYPE[n_to]+'!',
			toString 	: function(){return this.name + ": " + this.message;}
		};
	}

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
	for (var i=1; i<data.length; i++) {
		pivot_array[i] = (data[i] - pivot) / f_scale;
		// console.log(">>>", data[i],"->", pivot_array[i]);
	}

	encoder.log(LOG.ARR, "array.numeric.delta.float, len="+data.length+
		", from="+_NUMTYPE[n_from]+", to="+_NUMTYPE[n_to]+
		", type="+_NUMTYPE_DOWNSCALE_DELTA_FLOAT[n_delta_type]+" ("+n_delta_type+")"+
		", pivot="+pivot+", scale="+f_scale);

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
		throw {
			'name' 		: 'EncodeError',
			'message'	: 'Non-viable integer delta value from '+_NUMTYPE[n_from]+' to '+_NUMTYPE[n_to]+'!',
			toString 	: function(){return this.name + ": " + this.message;}
		};
	}

	if (data.length < UINT16_MAX) { // 16-bit length prefix
		encoder.stream8.write( pack1b( ARR_OP.NUM_DELTA_INT | NUMTYPE_LN.UINT16 | (n_delta_type << 1) ) );
		encoder.stream16.write( pack2b( data.length, false ) );
		encoder.counters.arr_hdr+=3;
	} else { // 32-bit length prefix
		encoder.stream8.write( pack1b( ARR_OP.NUM_DELTA_INT | NUMTYPE_LN.UINT32 | (n_delta_type << 1) ) );
		encoder.stream32.write( pack4b( data.length, false ) );
		encoder.counters.arr_hdr+=5;
	}

	encoder.log(LOG.ARR, "array.numeric.delta.int, len="+data.length+
		", from="+_NUMTYPE[n_from]+", to="+_NUMTYPE[n_to]+
		", type="+_NUMTYPE_DOWNSCALE_DELTA_INT[n_delta_type]+" ("+n_delta_type+")");

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

	if (data.length < UINT16_MAX) { // 16-bit length prefix
		encoder.stream8.write( pack1b( ARR_OP.NUM_REPEATED | NUMTYPE_LN.UINT16 | (n_type << 1) ) );
		encoder.stream16.write( pack2b( data.length, false ) );
		encoder.counters.arr_hdr+=3;
	} else { // 32-bit length prefix
		encoder.stream8.write( pack1b( ARR_OP.NUM_REPEATED | NUMTYPE_LN.UINT32 | (n_type << 1) ) );
		encoder.stream32.write( pack4b( data.length, false ) );
		encoder.counters.arr_hdr+=5;
	}

	encoder.log(LOG.ARR, "array.numeric.repeated, len="+data.length+
		", type="+_NUMTYPE[n_type]+" ("+n_type+")");

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

	if (data.length < UINT16_MAX) { // 16-bit length prefix
		encoder.stream8.write( pack1b( ARR_OP.NUM_RAW | NUMTYPE_LN.UINT16 | (n_type << 1) ) );
		encoder.stream16.write( pack2b( data.length, false ) );
		encoder.counters.arr_hdr+=3;
	} else { // 32-bit length prefix
		encoder.stream8.write( pack1b( ARR_OP.NUM_RAW | NUMTYPE_LN.UINT32 | (n_type << 1) ) );
		encoder.stream32.write( pack4b( data.length, false ) );
		encoder.counters.arr_hdr+=5;
	}

	encoder.log(LOG.ARR, "array.numeric.raw, len="+data.length+
		", type="+_NUMTYPE[n_type]+" ("+n_type+")");

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

	// Encode primitives one after the other
	encoder.stream8.write( pack1b( ARR_OP.NUM_SHORT | n_type ) );
	encoder.stream8.write( pack1b( data.length, false ) );
	encoder.counters.arr_hdr+=2;

	encoder.log(LOG.ARR, "array.numeric.short, len="+data.length+
		", type="+_NUMTYPE[n_type]+" ("+n_type+")");

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
	for (var i=0, pl=properties.length; i<pl; i++) {

		// Read property of all entries
		var prop = [], p = properties[i];
		for (var j=0, el=data.length; j<el; j++) {
			prop.push( data[j][p] );
			// weaveArrays.push( data[j][p] );
		}

		// Align values of same property for optimal encoding
		encodeArray( encoder, prop );

	}

	// Close log group
	encoder.logIndent(-1);
	encoder.log(LOG.ARR, "]");

}

/**
 * Encode array data as bulk of known objects
 */
function encodeArray_PRIM_BULK_KNOWN( encoder, data ) {

	//
	// Bulk Array for Known Object (PRIM_BULK_KNOWN)
	//
	// ........
	// 01111001
	//

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

	// Encode primitives one after the other
	encoder.stream8.write( pack1b( ARR_OP.PRIM_SHORT ) );
	encoder.stream8.write( pack1b( data.length, false ) );
	encoder.counters.arr_hdr+=2;

	// Open log group
	encoder.log(LOG.ARR, "array.prim.short, len="+data.length+
		", peek="+data[0]+" [");
	encoder.logIndent(1);

	// Encode each primitive individually
	for (var i=0, llen=data.length; i<llen; i++) {
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

	if (data.length < UINT16_MAX) { // 16-bit length prefix
		encoder.stream8.write( pack1b( ARR_OP.PRIM_REPEATED | NUMTYPE_LN.UINT16 ) );
		encoder.stream16.write( pack2b( data.length, false ) );
		encoder.counters.arr_hdr+=3;
	} else { // 32-bit length prefix
		encoder.stream8.write( pack1b( ARR_OP.PRIM_REPEATED | NUMTYPE_LN.UINT32 ) );
		encoder.stream32.write( pack4b( data.length, false ) );
		encoder.counters.arr_hdr+=5;
	}

	encoder.log(LOG.ARR, "array.prim.repeated, len="+data.length+
		", peek="+data[0]);

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

	if (data.length < UINT16_MAX) { // 16-bit length prefix
		encoder.stream8.write( pack1b( ARR_OP.PRIM_RAW | NUMTYPE_LN.UINT16 ) );
		encoder.stream16.write( pack2b( data.length, false ) );
		encoder.counters.arr_hdr+=3;
	} else { // 32-bit length prefix
		encoder.stream8.write( pack1b( ARR_OP.PRIM_RAW | NUMTYPE_LN.UINT32 ) );
		encoder.stream32.write( pack4b( data.length, false ) );
		encoder.counters.arr_hdr+=5;
	}

	// Write chunk header
	encoder.log(LOG.ARR, "array.prim.raw, len="+data.length+
		", peek="+data[0]+" [");
	encoder.logIndent(1);

	// Write primitives
	for (var i=0, l=data.length; i<l; i++)
		encodePrimitive( encoder, data[i] );

	// Close log group
	encoder.logIndent(-1);
	encoder.log(LOG.ARR, "]");

}

/**
 * Encode array data as one or more chunks of other types
 */
function encodeArray_PRIM_CHUNK( encoder, data, first_chunk ) {

	//
	// Chunked Primitive Array (PRIM_CHUNK)
	//
	// ........
	// 01111101
	//

	var chunk, chunkType, chunkSize, chunkSubType, part;

	// Write chunk header
	encoder.stream8.write( pack1b( ARR_OP.PRIM_CHUNK ) );
	encoder.log(LOG.ARR, "array.prim.chunk, len="+data.length+
		", peek="+data[0]+" [");
	encoder.logIndent(1);

	// Write first chunk
	encodeArray_Chunk( encoder, data.slice(0, first_chunk[1]), first_chunk );

	// Write chunks with forward analysis
	for (var i=first_chunk[1], llen=data.length; i<llen;) {

		// Forward chunk analysis
		chunk = chunkForwardAnalysis( encoder, data, i );
		// Encode Chunk
		encodeArray_Chunk( encoder, data.slice(i,i+chunk[1]), chunk );
		// Next chunk
		i += chunk[1];
	}

	// Write chunk termination
	encoder.stream8.write( pack1b( ARR_OP.PRIM_CHUNK_END ) );

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

	encoder.log(LOG.ARR, "array.empty");
	encoder.stream8.write( pack1b( ARR_OP.EMPTY ) );
	encoder.counters.op_prm+=1;

}

/**
 * Encode an array chunk, previously constructed
 * by chunkForwardanalysis
 */
function encodeArray_Chunk( encoder, data, chunk ) {
	var chunkType = chunk[0],
		chunkSize = chunk[1],
		chunkSubType = chunk[2],
		n_type, na;

	// console.log(">>> CFWA Chunk=", chunk,":",data);

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

		// Just precaution
		default:
			throw {
				'name' 		: 'EncodeError',
				'message'	: 'Trying to encode an unknown chunk (type='+chunkType+')!',
				toString 	: function(){return this.name + ": " + this.message;}
			};

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
			for (var i=1, len=data.length; i<len; i++) {
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

		}

	}

}

/**
 * Encode an array that is already classified as primitive
 */
function encodeArray_Primitive( encoder, data ) {

	// Check for small primitive array
	if (data.ength < 256) {

		// Test if these 255 values are the same
		var v, lv=data[0], same=true;
		for (var i=0, len=data.length; i<l; i++) {
			if ( encoder.optimize.cfwa_object_byval 
					? !deepEqual( v, lv )
					: (v !== lv) 
				) {
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

	// Perform a chunk forward analysis to classify the whole
	// or part of the current array
	var chunk = chunkForwardAnalysis( encoder, data, 0 );

	// Check if this is the whole array
	if (chunk[1] === data.length) {

		// Just encode a single chunk as array component
		encodeArray_Chunk( encoder, data, chunk );

	} else {

		// We have more than one chunk, start encoding chunked array
		encodeArray_PRIM_CHUNK( encoder, data, chunk );

	}

}

/**
 * Encode the specified array
 */
function encodeArray( encoder, data ) {
	
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
		console.error("Unknown object:", object);
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
	for (var i=0, len=o_keys.length; i<len; i++)
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
	};

	// Optimisation flags
	this.optimize = {
		cfwa_object_byval: true,	// By-value de-duplication of objects in chunk forward analysis
		float_int_downscale: false,	// Downscale floats to integers multiplied by scale
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
		for (var i=0; i<this.stringLookup.length; i++) {
			this.stream8.write( new Buffer( this.stringLookup[i] ) );
			this.stream8.write( new Buffer( [0] ) );
		}
		// console.log("ST: len="+(this.stream8.offset - stream8offset)+", sl=", this.stringLookup );

		// Encode the object signature table
		var stream16offset = this.stream16.offset;
		for (var i=0; i<this.plainObjectSignatureTable.length; i++)
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
			this.stream8.writeAt( 2,  pack2b( this.objectTable.ID ) );  // Update object table ID
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
			finalStream.write( pack2b( this.objectTable.ID ) );  // Object Table ID
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
		// return this.indexRefLookup[ object.__iref ];

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
		this.indexVal[eid].insert( propertyTable, this.indexRef.length );
		this.indexRef.push( object );

		// Keep ID on the object itself so we have a faster lookup,
		// and do it in a non-enumerable property so it doesn't pollute the objects.
		Object.defineProperty(
			object, "__iref__", {
				enumerable: false,
				value: this.indexRef.length,
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
		for (var i=0; i<keys.length; i++) {
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
		for (var i=0; i<keys.length; i++) {
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
			for (var i=0; i<lVals.length; i++) {
				sigbuf.push( pack2b( this.stringID(lVals[i]) ) );
			}
			sigbuf.push( pack2b( lArrays.length ) );
			for (var i=0; i<lArrays.length; i++) {
				sigbuf.push( pack2b( this.stringID(lArrays[i]) ) );
			}
			sigbuf.push( pack2b( lObjects.length ) );
			for (var i=0; i<lObjects.length; i++) {
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
			for (var i=0, l=keys.length; i<l; i++) {
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
		for (var i=0; i<keys.length; i++) {
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
