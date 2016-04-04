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
const NUMTYPE = {
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
		code += "p["+i+"][i]";
	}
	return new Function( "p", "i", "return ["+code+"]" );
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

	// Expand version
	this.ver_major = this.version & 0x00ff;
	this.ver_minor = (this.version & 0xff00) >> 8;

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

	// Validate object table id
	if (this.table_id != this.profile.id) {
		throw {
			'name' 		: 'DecodingError',
			'message'	: 'The profile ID (0x'+this.profile.id.toString(16)+') does not match the object table in the binary bundle (0x'+this.table_id.toString(16)+')',
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
	this.readTypedNum = function( t ) {
		switch (t) {
			case 0: return this.u8[this.i8++];
			case 1: return this.s8[this.i8++];
			case 2: return this.u16[this.i16++];
			case 3: return this.s16[this.i16++];
			case 4: return this.u32[this.i32++];
			case 5: return this.s32[this.i32++];
			case 6: return this.f32[this.i32++];
			case 7: return this.f64[this.i64++];
		}
	}

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
		var factoryPlain = "return {", factoryBulk = factoryPlain,
			props = this.signature_table[i], llen = props.length;
		for (var j=0; j<llen; ++j) {
			factoryPlain += "'"+props[j]+"': values["+j+"],";
			factoryBulk +=  "'"+props[j]+"': values["+j+"][i],";
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
 * Print the index offsets
 */
BinaryBundle.prototype.getWeavePropertyFunction = function( d ) {
	// Check if we already have this function
	if (this.factory_weave[d] !== undefined) {
		return this.factory_weave[d];
	}

	// Otherwise generate and return
	this.factory_weave[d] = genWeavePropFn(d);
	return this.factory_weave[d];
}

/**
 * Read a 16-bit string lookup table ID and translate to it's string
 */
BinaryBundle.prototype.readStringLT = function() {
	var id = this.readTypedNum( NUMTYPE.UINT16 );
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
