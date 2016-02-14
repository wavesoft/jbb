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
