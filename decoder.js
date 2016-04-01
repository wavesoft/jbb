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
var Errors = require('./lib/Errors');

/* Production optimisations and debug metadata flags */
if (typeof PROD === 'undefined') var PROD = false;
if (typeof DEBUG === 'undefined') var DEBUG = !PROD;

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
}

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
	DEFINE 	: 0x00,		// Define a new object for IREF
	IREF 	: 0x40,		// Refer to an IREF object
	XREF 	: 0x80,		// Refer to an XREF object
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
	var lnType = [ NUMTYPE.UINT8, NUMTYPE.UINT16, NUMTYPE.UINT32, NUMTYPE.FLOAT64 ][ len ],
		length = bundle.readTypedNum( lnType ), ans;

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
		if (op & 0x20) eid = bundle.readTypedNum( NUMTYPE.UINT8 ) | ((op & 0x0F) << 8);

		// Fetch object class
		var ENTITY = bundle.ot.ENTITIES[eid];
		if (ENTITY === undefined) {
			throw new Errors.AssertError('Could not found known object entity #'+eid+'!');
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
				var date = bundle.readTypedNum( NUMTYPE.FLOAT64 ),
					tzOffset = bundle.readTypedNum( NUMTYPE.INT8 ) * 10;

				// Return date
				return DEBUG 
						? __debugMeta( new Date( date ), 'object.date', {} )
						: new Date( date );

			default:
				throw new Errors.AssertError('Unknown primitive object with POID #'+poid+'!');
		}

	} else if ((op & 0x38) === 0x30) { // Simple object with known signature
		var eid = ((op & 0x07) << 8) | bundle.readTypedNum( NUMTYPE.UINT8 ),
			factory = bundle.factory_plain[ eid ];
		if (factory === undefined) {
			throw new Errors.AssertError('Could not found simple object signature with id #'+eid+'!');
		}

		// Create object
		var values = decodePrimitive( bundle, database );
		return DEBUG
			? __debugMeta( factory( values ), 'object.plain', { 'eid': eid } )
			: factory( values );

	} else {
		throw new Errors.AssertError('Unexpected object opcode 0x'+op.toString(16)+'!');
	}

}

/**
 * Decode pivot-encoded float array
 */
function decodePivotArrayFloat( bundle, database, len, num_type ) {
	var ans = new NUMTYPE_CLASS[ NUMTYPE_DELTA_FLOAT.FROM[ num_type ] ]( len ),
		num_type_to = NUMTYPE_DELTA_FLOAT.TO[ num_type ],
		pivot = bundle.readTypedNum( NUMTYPE_DELTA_FLOAT.FROM[ num_type ] ),
		scale = bundle.readTypedNum( NUMTYPE.FLOAT64 ),
		values = bundle.readTypedArray( num_type_to , len );

	// console.log(">> DELTA_FLOAT len=",len,"type=",num_type,"scale=",scale,"pivot=",pivot);

	// Decode
	for (var i=0; i<len; ++i) {
		ans[i] = pivot + (values[i] * scale);
		console.log("<<<", values[i],"->", ans[i]);
	}

	return DEBUG
		? __debugMeta( ans, 'array.delta.float', {} )
		: ans;
}

/**
 * Decode delta-encoded float array
 */
function decodeDeltaArrayInt( bundle, database, len, num_type ) {
	var ans = new NUMTYPE_CLASS[ NUMTYPE_DELTA_INT.FROM[ num_type ] ]( len ),
		v = bundle.readTypedNum( NUMTYPE_DELTA_INT.FROM[ num_type ] ),
		values = bundle.readTypedArray( NUMTYPE_DELTA_INT.TO[ num_type ] , len - 1 );

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
	var sid = bundle.readTypedNum( NUMTYPE.UINT16 ),
		properties = bundle.signature_table[sid],
		objectFactory = bundle.factory_plain_bulk[sid];
	if (!properties) {
		throw new Errors.AssertError('Unknown plain object with signature #'+sid+'!');
	}

	// Read property arrays
	var values = [];
	for (var i=0, l=properties.length; i<l; ++i)
		values.push(decodePrimitive( bundle, database ));

	// Create objects
	var ans = [], len=values[0].length;
	for (var i=0; i<len; ++i)
		ans.push( objectFactory(values, i) );
		// ans.push( objectFactory(values, values.length / properties.length, i) );

	return DEBUG
		? __debugMeta( ans, 'array.primitive.bulk_plain', { 'sid': sid } )
		: ans;
	
}

/**
 * Decode bulk array of entities
 */
function decodeKnownBulkArray( bundle, database, len ) {
	var eid = bundle.readTypedNum( NUMTYPE.UINT16 ),
		PROPERTIES = bundle.ot.PROPERTIES[ eid ],
		ENTITY = bundle.ot.ENTITIES[ eid ],
		plen = PROPERTIES.length, 
		getProperties = bundle.getWeavePropertyFunction( plen );

	// Get bulk operators
	var ops = [], locals = [];
	for (let i =0; i<len;) {
		let op = bundle.readTypedNum( NUMTYPE.UINT8 );
		let dat = op & 0x3F;
		op = op & 0xC0;

		// console.log("- @"+(bundle.i8-bundle.ofs8)+" OP: 0x"+op.toString(16))
		switch (op) {
			case PRIM_BULK_KNOWN_OP.DEFINE:
				for (let j=0; j<dat; j++) {
					// Create entity & Keep it in the iref table
					let obj = ENTITY[1]( ENTITY[0] );
					bundle.iref_table.push(obj);
					locals.push(obj);
				}
				ops.push([ op, dat ]);
				i += dat; 
				break;

			case PRIM_BULK_KNOWN_OP.IREF:
				ops.push([ op, (dat << 16) | bundle.readTypedNum( NUMTYPE.UINT16 ) ]);
				i += 1; 
				break;

			case PRIM_BULK_KNOWN_OP.XREF:
				ops.push([ op, bundle.readStringLT() ]);
				i += 1; 
				break;

			default:
				throw new Errors.AssertError('Unknown bulk array op-code 0x'+op.toString(16)+'!');
		}
	}

	// Get property arrays
	var propTable = [];
	for (let i=0; i<plen; ++i) {
		propTable.push( decodePrimitive( bundle, database ) );
	}

	// console.log("------");
	// console.log(" Ofs:", bundle.i8-bundle.ofs8);
	// console.log(" Eid:", eid);
	// console.log(" Len:", len);
	// console.log(" Properties:", PROPERTIES.toString());
	// console.log(" PropTable:", propTable);
	// console.log("------");

	// Start processing operators
	var ans = [], obji = 0;
	for (let i=0, k=0; k<ops.length; k++) {
		let op = ops[k][0];
		let dat = ops[k][1];
		switch (op) {
			case PRIM_BULK_KNOWN_OP.DEFINE:
				// Construct & Export to IREF table
				for (let j=0; j<dat; j++) {
					// Initialize object properties and keep it on the answer array 
					let obj = locals[obji];
					ENTITY[2]( obj, PROPERTIES, getProperties(propTable, obji) );
					// ans[i++] = obj;
					ans.push(obj);
					// Forward object index
					obji++;
				}
				break;

			case PRIM_BULK_KNOWN_OP.IREF:
				// Import from IREF
				if (dat >= bundle.iref_table.length)
					throw new Errors.IRefError('Invalid IREF #'+dat+'!');
				ans.push(bundle.iref_table[ dat ]);
				// ans[i++] = bundle.iref_table[ dat ];
				break;

			case PRIM_BULK_KNOWN_OP.XREF:
				// Import from XREF
				if (database[dat] === undefined) 
					throw new Errors.XRefError('Cannot import undefined external reference '+dat+'!');
				ans.push(database[dat]);
				// ans[i++] = database[dat];
				break;

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
function decodeChunkedArray( bundle, database ) {
	var op = bundle.readTypedNum( NUMTYPE.UINT8 ),
		chunk, chunk_meta = [],	ans =[], first = true;

	// Process chunks till PRIM_CHUNK_END
	while (op !== 0x7F) {

		// Collect chunk ops
		chunk = decodeArray( bundle, database, op );
		if (DEBUG) {
			chunk_meta.push({
				type: op,
				len: chunk.length
			});
		}
		// console.log("<<< =",chunk);

		// Test for non-arrays
		if (chunk.length === undefined)
			throw new Errors.AssertError('Encountered non-array chunk as part of chunked array!');

		// Collect
		ans.push.apply( ans, chunk );

		// Get next op-code
		op = bundle.readTypedNum( NUMTYPE.UINT8 );
	}

	// console.log("-----------");
	// console.log(ans);

	// Return chunked array
	return DEBUG
		? __debugMeta( ans, 'array.primitive.chunked', { 'chunks': chunk_meta } )
		: ans;
}

/**
 * Read an array from the bundle
 */
function decodeArray( bundle, database, op ) {
	var i=0, type=0, ln=0, len=0, nArr = [];
	op = op & 0xFF;

	if (op === 0x6C) { // PRIM_BULK_PLAIN

		// Decode and return plain bulk array
		// console.log("<<< @"+(bundle.i8-bundle.ofs8)+" Plain Bulk Plain");
		return decodePlainBulkArray( bundle, database );

	} else if (op === 0x6E) { // PRIM_SHORT

		// Collect up to 255 primitives
		// console.log("<<< @"+(bundle.i8-bundle.ofs8)+" Prim Short");
		len = bundle.readTypedNum( NUMTYPE.UINT8 );
		for (i=0; i<len; ++i)
			nArr.push( decodePrimitive( bundle, database ) );

		// Return
		return DEBUG
			? __debugMeta( nArr, 'array.primitive.short', {} )
			: nArr;

	} else if (op === 0x6F) { // PRIM_CHUNK

		// Return chunked array
		// console.log("<<< @"+(bundle.i8-bundle.ofs8)+" Prim Chunk");
		return decodeChunkedArray( bundle, database );

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
		len = bundle.readTypedNum( ln ? NUMTYPE.UINT32 : NUMTYPE.UINT16 );

		// Read from and encode to
		// console.log("Reading NUM_DWS len="+len+", ln="+ln);
		let vArr = bundle.readTypedArray( NUMTYPE_DOWNSCALE.TO[type] , len );
		nArr = new NUMTYPE_CLASS[ NUMTYPE_DOWNSCALE.FROM[type] ]( vArr );

		// Return
		return DEBUG
			? __debugMeta( nArr, 'array.numeric.downscaled', { 'type': type } )
			: nArr;

	} else if ((op & 0xF0) === 0x20) { // NUM_DELTA_INT

		// console.log("<<< @"+(bundle.i8-bundle.ofs8)+" Numeric Delta Int");
		ln = op & 0x01;
		type = (op >> 1) & 0x07;
		len = bundle.readTypedNum( ln ? NUMTYPE.UINT32 : NUMTYPE.UINT16 );

		// Return delta-encoded integers
		return decodeDeltaArrayInt( bundle, database, len, type );

	} else if ((op & 0xF0) === 0x30) { // NUM_DELTA_FLOAT

		// console.log("<<< @"+(bundle.i8-bundle.ofs8)+" Numeric Delta Float");
		ln = op & 0x01;
		type = (op >> 1) & 0x07;
		len = bundle.readTypedNum( ln ? NUMTYPE.UINT32 : NUMTYPE.UINT16 );

		// Return pivot-encoded floats
		return decodePivotArrayFloat( bundle, database, len, type );

	} else if ((op & 0xF0) === 0x40) { // NUM_REPEATED

		// console.log("<<< @"+(bundle.i8-bundle.ofs8)+" Numeric Repeated");
		ln = op & 0x01;
		type = (op >> 1) & 0x07;
		len = bundle.readTypedNum( ln ? NUMTYPE.UINT32 : NUMTYPE.UINT16 );

		// Repeat value
		let vArr = bundle.readTypedNum( type );
		nArr = new NUMTYPE_CLASS[ type ]( len );
		nArr.fill(vArr);
		// for (i=0; i<len; ++i) nArr[i]=vArr;

		// Return
		return DEBUG
			? __debugMeta( nArr, 'array.numeric.repeated', { 'type': type } )
			: nArr;

	} else if ((op & 0xF0) === 0x50) { // NUM_RAW

		// console.log("<<< @"+(bundle.i8-bundle.ofs8)+" Numeric Raw");
		ln = op & 0x01;
		type = (op >> 1) & 0x07;
		len = bundle.readTypedNum( ln ? NUMTYPE.UINT32 : NUMTYPE.UINT16 );

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
		len = bundle.readTypedNum( NUMTYPE.UINT8 ) | 0;

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
		len = bundle.readTypedNum( ln ? NUMTYPE.UINT32 : NUMTYPE.UINT16 );

		// Repeat value
		let vArr = decodePrimitive( bundle, database );
		nArr = new Array( len );
		nArr.fill( vArr );
		// for (i=0; i<len; i++) nArr[i]=vArr;

		// Return
		return DEBUG
			? __debugMeta( nArr, 'array.primitive.repeated', { 'type': type } )
			: nArr;


	} else if ((op & 0xFE) === 0x6A) { // PRIM_RAW

		// console.log("<<< @"+(bundle.i8-bundle.ofs8)+" Prim Raw");
		ln = op & 0x01;
		len = bundle.readTypedNum( ln ? NUMTYPE.UINT32 : NUMTYPE.UINT16 );

		// Compile primitives
		for (i=0; i<len; ++i)
			nArr.push( decodePrimitive( bundle, database ) );

		// Return
		return DEBUG
			? __debugMeta( nArr, 'array.primitive.raw', {} )
			: nArr;

	} else if ((op & 0xFE) === 0x7C) { // PRIM_BULK_KNOWN

		// console.log("<<< @"+(bundle.i8-bundle.ofs8)+" Prim Bulk Known");
		ln = op & 0x01;
		len = bundle.readTypedNum( ln ? NUMTYPE.UINT32 : NUMTYPE.UINT16 );

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
	var op = bundle.readTypedNum( NUMTYPE.UINT8 );
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
		var id = bundle.readTypedNum( NUMTYPE.UINT16 ) | 0;
		id = ((op & 0x0F) << 16) | id;
		if (id >= bundle.iref_table.length)
			throw new Errors.IRefError('Invalid IREF #'+id+'!');
		return DEBUG
			? __debugMeta( bundle.iref_table[id], 'object.iref', { 'id': id } )
			: bundle.iref_table[id];

	} else if ((op & 0xF8) === 0xF0) { // Number
		return bundle.readTypedNum( op & 0x07 );

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
		var op = bundle.readTypedNum( NUMTYPE.UINT8 );
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

		for (var i=0; i<this.queuedRequests.length; ++i) {
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
