/**
 * THREE Bundles - Binary Encoder/Decoder Test Suite
 * Copyright (C) 2015 Ioannis Charalampidis <ioannis.charalampidis@cern.ch>
 * 
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License along
 * with this program; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 *
 * @author Ioannis Charalampidis / https://github.com/wavesoft
 */

var util = require('util');
var assert = require('assert');
var seed = require('seed-random');
var random = seed('jbbtests');
var BinaryBundle = require("../lib/BinaryBundle");
var Errors = require("../lib/Errors");

// Static import of utility functions
require('./utils/common').static(global);
require('./utils/tests').static(global);
require('./simple-profile/objects').static(global);

var EncodeProfile = require('./simple-profile/specs-encode');
var DecodeProfile = require('./simple-profile/specs-decode');
var DecodeCombProfile = require('../lib/DecodeProfile');

const FLOAT32_POS = 3.40282346e+38; // largest positive number in float32
const FLOAT32_NEG = -3.40282346e+38; // largest negative number in float32
const FLOAT32_SMALL = 1.175494350e-38; // smallest number in float32

/**
 * Numerical types
 */
const NUMTYPE = {
	// For protocol use
	UINT8: 	 0, INT8:    1,
	UINT16:  2, INT16:   3,
	UINT32:  4, INT32:   5,
	FLOAT32: 6, FLOAT64: 7
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
	PRIM_BULK_PLAIN: 0x6E, // Bulk Array of Plain Objects
	PRIM_SHORT: 	 0x6F, // Short Primitive Array
	PRIM_CHUNK: 	 0x78, // Chunked Primitive ARray
	PRIM_BULK_KNOWN: 0x7C, // Bulk Array of Known Objects
	EMPTY: 			 0x7E, // Empty Array
	PRIM_CHUNK_END:  0x7F, // End of primary chunk
};


////////////////////////////////////////////////////////////////
// Test Entry Point
////////////////////////////////////////////////////////////////

// Basic encoding/decoding
describe('[Core Tests]', function() {

	describe('Binary Protocol', function() {
		var header_size = 32;

		// Encode stream
		var encode_stream = function( sparse ) {

			// Encode object
			var encoder = open_encoder( EncodeProfile, sparse );
			encoder.encode({
				'plain'	: 152,
				'32bit'	: 545406996,
				'64bit' : 71468257902672,
				'object': false
			}, 'export_name');
			encoder.close();

			// Cleanup when this is done
			after(function() {
				cleanup_encoder( encoder );
			});

			// Open raw contents
			return open_encoder_buffer( encoder );

		}

		// Run tests for sparse and not
		var header_test = function( sparse ) {

			// Get parts
			var p = encode_stream( sparse );
			var u16 = new Uint16Array(p[0], 0, header_size/2);
			var u32 = new Uint32Array(p[0], 0, header_size/4);

			// Header field
			assert.equal( u16[0], 0x4231, 		'Magic number should be 0x4231');
			assert.equal( u16[1], EncodeProfile.id, 'Object table should be 0x'+EncodeProfile.id.toString(16));
			assert.equal( u16[2], 0x0102,		'Protocol version should be v1.2');
			assert.equal( u16[3], 1,			'Profile table size field should be 1');

			// Check table
			assert.equal( u32[2], 8,			'64-bit table size');
			assert.equal( u32[3], 8,			'32-bit table size');
			assert.equal( u32[4], 14,			'16-bit table size');
			assert.equal( u32[5], 52,			'8-bit table size');
			assert.equal( u32[6], 42,			'String table size');
			assert.equal( u32[7], 10,			'Plain Object Signature table size');

		}

		// Validate header
		it('should validate the header of compact bundle', function() { header_test(false) });
		it('should validate the header of sparse bundle', function() { header_test(true) });

		// Run tests for sparse and not
		var parse_test = function( sparse ) {

			// Get parts
			var p = encode_stream( sparse );
			var decodeProfile = new DecodeCombProfile();
			decodeProfile.add( DecodeProfile );
			var bundle = new BinaryBundle( (p.length == 1) ? p[0] : p, decodeProfile );

			// Validate string table
			assert.deepEqual( bundle.string_table, 
				[ 'test/export_name', 'plain', '32bit', '64bit', 'object' ],'string table');
			assert.deepEqual( bundle.signature_table, 
				[ ['plain', '32bit', '64bit', 'object'] ],'plain object signature table');
		}

		// Validate signature table
		it('should validate string & signature table of compact bundle', function() { parse_test(false) });
		it('should validate string & signature table of sparse bundle', function() { parse_test(true) });

		// Run tests for sparse and not
		var factory_tests = function( sparse ) {

			// Get parts
			var p = encode_stream( sparse );
			var decodeProfile = new DecodeCombProfile();
			decodeProfile.add( DecodeProfile );
			var bundle = new BinaryBundle( (p.length == 1) ? p[0] : p, decodeProfile );

			// Validate string table
			var plain_values = [ 1, 2, 3, 4 ];
			var weave_values = [ 1, 10, 
								 2, 20, 
								 3, 30, 
								 4, 40 ];

			// Two test objects
			var test_object_1 = {
				'plain': plain_values[0],
				'32bit': plain_values[1],
				'64bit': plain_values[2],
				'object': plain_values[3],
			};
			var test_object_2 = {
				'plain': weave_values[1],
				'32bit': weave_values[3],
				'64bit': weave_values[5],
				'object': weave_values[7],
			};

			assert.deepEqual( bundle.factory_plain[0]( plain_values ), test_object_1, 'plain object factory' );
			assert.deepEqual( bundle.factory_plain_bulk[0]( weave_values, 0 ), test_object_1, 'bulk object factory (idx=0)' );
			assert.deepEqual( bundle.factory_plain_bulk[0]( weave_values, 1 ), test_object_2, 'bulk object factory (idx=1)' );
		}

		// Validate signature table
		it('should properly create factory objects of compact bundle', function() { factory_tests(false) });
		it('should properly create factory objects of sparse bundle', function() { factory_tests(true) });

	});

	describe('Simple Primitives', function () {

		// Test the core primitives
		it_should_return(undefined);
		it_should_return(null);
		it_should_return(true);
		it_should_return(false);
		it_should_return(NaN);

		// Simple objects
		it_should_return(new Date(), null, [match_metaType('object.date')] );

	});

	describe('Numbers', function () {

		// Check if the file types are detected appropriately
		it_should_return(0);
		it_should_return(255);
		it_should_return(-127);
		it_should_return(65535);
		it_should_return(-32768);
		it_should_return(4294967296);
		it_should_return(-2147483648);
		it_should_return(3.1415927410125732);

	});

	describe('Strings', function () {

		// Test automatic selection of UTF8 encoding
		it_should_return("LATIN-1 Mostly for code");
		it_should_return("UTF-8 Κωδικοποιημένο 本文 mostly für text buffers");

	});

	describe('Short Arrays', function () {

		// Test empty array
		it_should_return([]);

		// Test all possible typed array data for the maximum possible size of the short array
		it_should_return_array_rand('Uint8Array',	255, 0,				255, 		[match_metaType('array.numeric.short')]);
		it_should_return_array_rand('Int8Array', 	255, -127,			127, 		[match_metaType('array.numeric.short')]);
		it_should_return_array_rand('Uint16Array',	255, 0,				65535, 		[match_metaType('array.numeric.short')]);
		it_should_return_array_rand('Int16Array', 	255, -32768,		32767, 		[match_metaType('array.numeric.short')]);
		it_should_return_array_rand('Uint32Array',	255, 0,				4294967296, [match_metaType('array.numeric.short')]);
		it_should_return_array_rand('Int32Array',	255, -2147483648,	2147483648, [match_metaType('array.numeric.short')]);
		it_should_return_array_rand('Float32Array',	255, 0,				2147483648, [match_metaType('array.numeric.short')]);
		it_should_return_array_rand('Float64Array',	255, 0,				17179869184,[match_metaType('array.numeric.short')]);

		// Short primitives
		var values = [];
		for (var i=0; i<255; ++i) values.push( [true,false,null,undefined][i%4] );
		it_should_return(values, 'Array(255) = [ RANDOM(true, false, null, undefined) ] ' ,[match_metaType('array.primitive.short')]);

	});

	describe('Repeated Arrays', function () {

		// Test the preference of repeated arrays instead of (short) 
		it_should_return_array_seq('Array',100,1,0, [match_metaType('array.numeric.repeated')]);

		// Possibly short-sized, but with repeated values
		it_should_return_array_seq('Array',256,1,0, [match_metaType('array.numeric.repeated')]); 					// < 8bit
		it_should_return_array_seq('Array',256,255,0, [match_metaType('array.numeric.repeated')]);					// = 8bit
		it_should_return_array_seq('Array',256,65535,0, [match_metaType('array.numeric.repeated')]);				// = 16bit
		it_should_return_array_seq('Array',256,4294967295,0, [match_metaType('array.numeric.repeated')]);			// = 32bit
		it_should_return_array_seq('Array',256,9.22337203685478E18,0, [match_metaType('array.numeric.repeated')]);	// close to 64-bit

		// Long repeated possiblities
		it_should_return_array_seq('Array',1024,1,0, [match_metaType('array.numeric.repeated')]);					// <<16 bit
		it_should_return_array_seq('Array',65535,1,0, [match_metaType('array.numeric.repeated')]);					// >16 bit

		// Typed repeated possibilities
		it_should_return_array_seq('Uint8Array',256,255,0, [match_metaType('array.numeric.repeated')]);				// = 8bit
		it_should_return_array_seq('Int8Array',256,255,0, [match_metaType('array.numeric.repeated')]);				// = 8bit
		it_should_return_array_seq('Uint16Array',256,255,0, [match_metaType('array.numeric.repeated')]);			// = 8bit
		it_should_return_array_seq('Int16Array',256,255,0, [match_metaType('array.numeric.repeated')]);				// = 8bit
		it_should_return_array_seq('Uint32Array',256,255,0, [match_metaType('array.numeric.repeated')]);			// = 8bit
		it_should_return_array_seq('Int32Array',256,255,0, [match_metaType('array.numeric.repeated')]);				// = 8bit
		it_should_return_array_seq('Float32Array',256,4123.123,0, [match_metaType('array.numeric.repeated')]);		// = 8bit
		it_should_return_array_seq('Float64Array',256,4123.123,0, [match_metaType('array.numeric.repeated')]);		// = 8bit

		// Repeated tricky and simple primitives
		it_should_return_array_rep('Array', 255, undefined, [match_metaType('array.primitive.repeated')]);
		it_should_return_array_rep('Array', 255, false, [match_metaType('array.primitive.repeated')]);
		it_should_return_array_rep('Array', 255, {'simple':'object'}, [match_metaType('array.primitive.repeated')]);

		// Test bigger indices in a single chunk
		it_should_return_array_rep('Array', 1024, {'simple':'object'}, [match_metaType('array.primitive.repeated')]);
		it_should_return_array_rep('Array', 65536, {'simple':'object'}, [match_metaType('array.primitive.repeated')]);

	});

	describe('Delta-Encoded Arrays', function () {

		//// Integer delta-encoding ////

		// UINT8	-> No delta-encoding
		it_should_return_array_seq('Uint8Array', 256,	256,	1,	 [match_metaType('array.numeric.raw')]);

		// UINT16	-> INT8
		it_should_return_array_seq('Uint16Array',256,	256,	1,	 [match_metaType('array.delta.int')]);
		// INT16	-> INT8
		it_should_return_array_seq('Int16Array', 256,	-127,	1,	 [match_metaType('array.delta.int')]);
		// UINT32	-> INT8
		it_should_return_array_seq('Uint32Array',256,	65535,	1,	 [match_metaType('array.delta.int')]);	
		// INT32	-> INT8
		it_should_return_array_seq('Int32Array', 256,	-32768,	1,	 [match_metaType('array.delta.int')]);

		// UINT32	-> INT16
		it_should_return_array_seq('Uint32Array',2048,	0,		256, [match_metaType('array.delta.int')]);
		// INT32	-> INT16
		it_should_return_array_seq('Int32Array',256,	-1024,	256, [match_metaType('array.delta.int')]);

		//// Float delta-encoding ////

		// Until we have a better idea this is disabled through
		// optimisation flags.

		// FLOAT32	-> INT8
		// it_should_return_array_seq_almost('Float32Array',256,	0,	0.5, 	0.01, [match_metaType('array.delta.float')]);	
		// FLOAT32	-> INT16
		// it_should_return_array_seq_almost('Float32Array',256,	0,	0.125,  0.01, [match_metaType('array.delta.float')]);

		//// Incomplete types ////

		// FLOAT64	-> (Should opt out from Delta-Encoding without issues)
		it_should_return_array_seq('Float64Array',256,	0,	256, [match_metaType('array.numeric.downscaled')]);

		//// Test if the 32-bit index works ////

		it_should_return_array_seq('Uint16Array',65536,	0, 1, [match_metaType('array.delta.int')]);

	});

	describe('Downscaled Arrays', function () {	

		//// Integer downscaling ////

		// UINT16	-> UINT8
		it_should_return_array_rand('Uint16Array',1024,	0,	255,		[match_metaType('array.numeric.downscaled')]);
		// INT16	-> INT8
		it_should_return_array_rand('Int16Array', 1024,	-127, 127,		[match_metaType('array.numeric.downscaled')]);

		// INT16	-> UINT8 (Shout opt-out from downscaling)
		it_should_return_array_rand('Int16Array', 1024,	0,	255,		[match_metaType('array.numeric.raw')]);

		// UINT32	-> UINT8
		it_should_return_array_rand('Uint32Array',1024,	0,	255,		[match_metaType('array.numeric.downscaled')]);
		// INT32	-> INT8
		it_should_return_array_rand('Int32Array', 1024,	-127, 127,		[match_metaType('array.numeric.downscaled')]);

		// INT32	-> INT16
		it_should_return_array_rand('Int32Array', 1024,	0,	255,		[match_metaType('array.numeric.downscaled')]);

		// UINT32	-> UINT16
		it_should_return_array_rand('Uint32Array',1024,	0,	65535,		[match_metaType('array.numeric.downscaled')]);
		// INT32	-> INT16
		it_should_return_array_rand('Int32Array',1024,	-32768, 32768,	[match_metaType('array.numeric.downscaled')]);

		//// Float downscaling ////

		// FLOAT32	-> INT8
		it_should_return_array_rand('Float32Array',1024,	0,	127,	[match_metaType('array.numeric.downscaled')]);
		// FLOAT32	-> INT16
		it_should_return_array_rand('Float32Array',1024,	0,	32768,	[match_metaType('array.numeric.downscaled')]);

	});

	describe('Float Arrays', function () {	

		// Float32 extremes
		it_should_return_array_rand('Float32Array',256,	0.0, FLOAT32_POS, 	[match_rawArrayType( NUMTYPE.FLOAT32 )]);	
		it_should_return_array_rand('Float32Array',256,	FLOAT32_NEG, 0.0, 	[match_rawArrayType( NUMTYPE.FLOAT32 )]);	
		it_should_return_array_rand('Float32Array',256,	0.0, FLOAT32_SMALL, [match_rawArrayType( NUMTYPE.FLOAT32 )]);

		// Float64 extremes
		it_should_return_array_rand('Float64Array',256,	1.7E-108, 1.7E-107,	[match_rawArrayType( NUMTYPE.FLOAT64 )]);
		it_should_return_array_rand('Float64Array',256,	1.7E+107, 1.7E+108, [match_rawArrayType( NUMTYPE.FLOAT64 )]);

		// Element detail on half-float decimals
		it_should_return_array_rand('Float32Array',256,		-1e+18,	1e-18, [match_rawArrayType( NUMTYPE.FLOAT32 )]);
		it_should_return_array_rand('Float32Array',1024,	-1e+18,	1e-18, [match_rawArrayType( NUMTYPE.FLOAT32 )]);
		it_should_return_array_rand('Float32Array',65535,	-1e+18,	1e-18, [match_rawArrayType( NUMTYPE.FLOAT32 )]);

		// Auto-identified arrays
		var arr1 = Array.prototype.slice.call(gen_array_rand( 'Float32Array', 10000, FLOAT32_SMALL, FLOAT32_POS )),
			arr2 = Array.prototype.slice.call(gen_array_rand( 'Float64Array', 10000, 1.7E-108, 1.7E-107 ));
		it_should_return( arr1, 'Array(10,000) = [rand('+FLOAT32_SMALL+'..'+FLOAT32_POS+')]', [match_rawArrayType( NUMTYPE.FLOAT32 )] );
		it_should_return( arr2, 'Array(10,000) = [rand(1.7E-108..1.7E-107)]', [match_rawArrayType( NUMTYPE.FLOAT64 )] );

	});

	describe('Object Bulks', function () {

		// Compile some plain object arrays
		const variants = [ true, undefined, false, 148, null, 64473, 40.1927375793457, 12847612, "String" ];
		var plain01 = [], plain02 = [], plain03 = [], plain04 = [], f = new Float32Array(1);
		for (var i=0; i<1000; i++) {
			f[0] = random();

			plain01.push({
				"a": f[0], "b": i, "c": false, "d": null, "e": undefined
			});
			plain02.push({
				"same": "everywhere"
			});
			plain03.push({
				"unmergable": variants[ i%9 ]
			});
			plain04.push({
				"some_mergable": variants[ Math.floor(random()*9) ]
			});
		}

		// Plain objects
		it_should_return( plain01, 'Plain Buk of [ 10,000 x { "a": num, "b": num, "c": false, "d": null, "e": undefined } ]' );
		it_should_return( plain02, 'Plain Buk of [ 10,000 x { "same": "everywhere" } ]' );
		it_should_return( plain03, 'Plain Buk of [ 10,000 x { "unmergable": [varies] } ]' );
		it_should_return( plain04, 'Plain Buk of [ 10,000 x { "some_mergable": [varies] } ]' );

		// Random with interception of continuous
		// var with_repeated = [];
		// for (var i=0; i<100; i++) with_repeated.push({ "unmergable": variants[ i%9 ] });
		// for (var i=0; i<2; i++) with_repeated.push({ "unmergable": null });
		// for (var i=0; i<4; i++) with_repeated.push({ "unmergable": variants[i%9] });
		// for (var i=0; i<10; i++) with_repeated.push({ "unmergable": 'String' });
		// for (var i=0; i<5; i++) with_repeated.push({ "unmergable": variants[i%9] });
		// for (var i=0; i<5; i++) with_repeated.push({ "unmergable": undefined });
		// for (var i=0; i<20; i++) with_repeated.push({ "unmergable": variants[i%9] });
		// for (var i=0; i<100; i++) {
		// 	with_repeated.push({
		// 		"unmergable": variants[ i%9 ]
		// 	});
		// }
		// it_should_return( with_repeated, 'Plain Buk of [ 100 x {}, 60 x SAME, 100 x {} ]' );

		// Compile some known objects
		var known01 = [], known02 = [], known03 = [],
			inst_set = [
				new ObjectB("first",1), new ObjectB("second", 2), new ObjectB("third", 3),
				new ObjectB("fourth",4), new ObjectB("fifth", 5), new ObjectB("sixth", 6),
			];
		for (var i=0; i<100; i++) {
			known01.push( inst_set[Math.floor(random() * inst_set.length)] ); // IREF In first occurance
			known02.push( new ObjectA() ); // All IREF by value
			known03.push( new ObjectB(i, "object-"+i) ); // All different
		}

		// Known objects
		// it_should_return( known01, 'Known Bulk of [ 10,000 x [ Variety of x'+inst_set.length+' ] ]' );
		// it_should_return( known02, 'Known Bulk of [ 10,000 x ObjectA() ]' );
		// it_should_return( known03, 'Known Bulk of [ 10,000 x ObjectB( [varies], [varies] ) ]' );

	});

	describe('Chunked Arrays', function () {
		var values, matchTypes;
		var CHUNK_COMPOSITE = [true, false, undefined, 255, 128, 67, 65535, 32535, 4294967295, {'plain':'object'}];
		var SEQ_PRIM = [ true, undefined, false, 148, null, 64473, 12847612, 40.1927375793457, "String" ];

		// This is not correct on newer version
		// // Short is prioritized against chunked
		// values = [].concat(
		// 	false,
		// 	gen_array_rep( 'Array', 100, 104 ),
		// 	true,
		// 	gen_array_seq( 'Array', 100, 0,1 ),
		// 	null
		// );
		// it_should_return( values, '[ false, 100 x NUM, true, 100 x NUM, null ]', [match_metaType('array.primitive.short')]);

		// Simple composite case
		values = [].concat(
			gen_array_seq( 'Array', 100, 0, 1 ),
			'Break',
			gen_array_seq( 'Array', 100, 0, 1 ),
			'Break',
			gen_array_seq( 'Array', 100, 0, 1 ),
			'Break'
		);
		it_should_return( values, '[ 100 x NUM, \'Break\', 100 x NUM, \'Break\', 100 x NUM, \'Break\' ]', 
			[/*function(meta) { console.log(meta.meta.chunks); },*/ match_chunkTypes([
				[ ARR_OP.NUM_SHORT, 0xF8 ],		// 100 numeric items
				[ ARR_OP.PRIM_SHORT, 0xFF ],	// 'Break'
				[ ARR_OP.NUM_SHORT, 0xF8 ],		// 100 numeric items
				[ ARR_OP.PRIM_SHORT, 0xFF ],	// 'Break'
				[ ARR_OP.NUM_SHORT, 0xF8 ],		// 100 numeric items
				[ ARR_OP.PRIM_SHORT, 0xFF ], 	// 'Break'
			])] );

		// Make sure analyzePrimitiveArray is preferring repeated arrays given the chance
		values = [].concat(
			false, // Make this array chunked
			gen_array_rep( 'Array', 200, 104 ),
			gen_array_seq( 'Array', 200, 0,1 )
		);
		it_should_return( values, '[ false, 200 x SAME, 200 x NUM ]', 
			[match_chunkTypes([
				[ ARR_OP.PRIM_SHORT, 0xFF ],	// 1 primitive
				[ ARR_OP.NUM_REPEATED, 0xF0 ],	// Repeated numbers
				[ ARR_OP.NUM_SHORT, 0xF8 ],		// Final numbers
			])] );

		// Items than 50% of same-value 
		values = [].concat(
			gen_array_rep( 'Array', 10000, 104 ),
			gen_array_seq( 'Array', 10000, 0,1 )
		);
		it_should_return( values, '[ 10,000 SAME , 10,000 NUMERIC ]', 
			[match_chunkTypes([
				[ ARR_OP.NUM_REPEATED, 0xF0 ],	// Repeated numbers
				[ ARR_OP.NUM_DELTA_INT, 0xF0 ],	// Final numbers
			])] );

		// Repeated composites (Ideally future-optimised)
		values = [];
		var matchTypes = [
			[ ARR_OP.PRIM_SHORT, 0xFF ],	// true, false, undefined
		],	repTypes = [
			[ ARR_OP.NUM_SHORT, 0xF8 ],		// 255, 128, 67, 65535, 32535, 4294967295
			[ ARR_OP.PRIM_SHORT, 0xFF ],	// {'plain':'object'}, true, false, undefined
		];
		for (var i=0; i<100; i++) {
			values = values.concat(CHUNK_COMPOSITE);
			matchTypes = matchTypes.concat(repTypes);
		}
		it_should_return( values, '[ (true, false, undefined, 255, 65535, 4294967295, {\'plain\':\'object\'} ) x 100 ]', 
			[/*function(meta) { console.log(meta.meta.chunks); },*/ match_chunkTypes(matchTypes)] );

		// Create multi-chunked array
		values = [].concat(
			gen_array_rep( 'Array', 100, false ),
			gen_array_rep( 'Array', 50, true ),
			gen_array_rep( 'Array', 5, undefined ),
			gen_array_rep( 'Array', 128, {'object':'with_a_simple','structure':4} ),
			gen_array_rep( 'Array', 255, {'limit_of_objects':255} ),
			gen_array_rep( 'Array', 1024, {'too_many':123,'objects':4123} )
		);
		it_should_return( values, '[ 100 x false, 50 x true, 5 x undefined, 128 x [Object#1], 255 x [Object#2], 1024 x [Object#3] ]',
			[ match_metaType('array.primitive.chunked') ] );

		// Check limits of repeated values
		values = [].concat(
			[ 'chunk_prefix' ],
			gen_array_rep( 'Array', 255, 'same' ),
			[ false ]
		);
		it_should_return( values, 'Repeated Chunk [ \'chunk_prefix\', 255 x \'same\', false ]', [match_metaType('array.primitive.chunked')] );
		values = [].concat(
			[ 'chunk_prefix' ],
			gen_array_rep( 'Array', 32767, 'same' ),
			[ false ]
		);
		it_should_return( values, 'Repeated Chunk [ \'chunk_prefix\', 32,767 x \'same\', false ]', [match_metaType('array.primitive.chunked')] );

		// Create bulk array
		var bulkrep = [];
		for (var i=0; i<65535; i++)
			bulkrep.push({
				'value': i,
				'same': 4,
				'string': 'This is a string'
			});
		it_should_return( bulkrep, '[ 65,535 x { value: [variable] } ]', [match_metaType('array.primitive.bulk_plain')] );

		// Corner-case of repeated objects
		values = [].concat(
			[2000],
			gen_array_rep( 'Array', 100, 20 ),
			gen_array_rep( 'Array', 100, 30 ),
			gen_array_rep( 'Array', 100, undefined )
		);
		it_should_return( values, '[ 2000, 20 x 100, 30 x 100, undefined x 100 ]', [match_metaType('array.primitive.chunked')] );
		values = [].concat(
			gen_array_rep( 'Array', 100, 20 ),
			gen_array_rep( 'Array', 100, 30 ),
			gen_array_rep( 'Array', 100, 20 ),
			gen_array_rep( 'Array', 100, 30 ),
			gen_array_rep( 'Array', 100, 20 ),
			gen_array_rep( 'Array', 100, 30 ),
			[undefined]
		);
		it_should_return( values, '[20 x 100, 30 x 100, 20 x 100, 30 x 100, 20 x 100, 30 x 100, undefined x 100 ]', [match_metaType('array.primitive.chunked')] );

		// Adoption of incremental/decremental numeric type in chunks
		var two_chunks = [
			[ ARR_OP.NUM_SHORT, 0xF8 ],
			[ ARR_OP.PRIM_SHORT, 0xFF ]
		];
		values = [].concat(
			gen_array_seq( 'Array', 32, 0, 1 ),
			gen_array_seq( 'Array', 32, 80, 1 ),
			gen_array_seq( 'Array', 32, 564, 1 ),
			gen_array_seq( 'Array', 32, 57890, 1 ),
			gen_array_seq( 'Array', 32, 451106, 1 ),
			gen_array_seq( 'Array', 32, 5693986, 1 ),
			gen_array_seq( 'Array', 32, 72802850, 1 ),
			gen_array_seq( 'Array', 31, 1146544674, 1 ),
			[ null ]
		);
		it_should_return( values, '[ 5, 34, 546, 57890, 451106, 5693986, 72802850, 1146544674, null ]', [match_chunkTypes(two_chunks)] );
		values = [].concat(
			gen_array_seq( 'Array', 32, 1146544674, 1 ),
			gen_array_seq( 'Array', 32, 72802850, 1 ),
			gen_array_seq( 'Array', 32, 5693986, 1 ),
			gen_array_seq( 'Array', 32, 451106, 1 ),
			gen_array_seq( 'Array', 32, 57890, 1 ),
			gen_array_seq( 'Array', 32, 564, 1 ),
			gen_array_seq( 'Array', 32, 80, 1 ),
			gen_array_seq( 'Array', 31, 0, 1 ),
			[ null ]
		);
		it_should_return( values, '[ 1146544674, 72802850, 5693986, 451106, 57890, 546, 34, 5, null ]', [match_chunkTypes(two_chunks)] );

		// Difficulty with non-continuous items
		var difficult = [];
		for (var i=0; i<2000; i++) {
			difficult.push(
				[ true, false, undefined, 148, 64473, 12847612, 40.1927375793457, "String",
				  { 'some': 'object', 'a': 1, 'b': 2 }, new ObjectA(), new ObjectB( null, "test" )
				][Math.floor(random()*12)]
			);
		}
		it_should_return( difficult, '[ 2,000 x [varying] ]' );

		// Error case encountered before
		var err1 = [];
		for (var i=0; i<100; i++) {
			err1.push(SEQ_PRIM[ i % SEQ_PRIM.length ]);
		}
		it_should_return( err1, '[ 100 x [varying] ]' );

	});

	describe('Bulks of Known Objects', function () {

		// Simple case: 1-chunked array with known objects
		var PICK_KO = [ new ObjectA(), new ObjectB(null, "test"), new ObjectB(false, true),
						new ObjectB(4.1230998039245605, 412.4100036621094), new ObjectB(undefined, false), 
						new ObjectC(51,44), new ObjectB(-41, -491826382) ];
		var bko1 = [];
		for (var i=0; i<2000; i++) {
			bko1.push(PICK_KO[Math.floor(random()*PICK_KO.length)]);
		}
		it_should_return( bko1, '[ 2,000 x Known Objects ]' );

		// Chunked case: 2 Chunks of known objects interrupted by another chunk
		var PICK_KO = [ new ObjectA(), new ObjectB(null, "test"), new ObjectB(false, true),
						new ObjectB(4.1230998039245605, 412.4100036621094), new ObjectB(undefined, false), 
						new ObjectC(51,44), new ObjectB(-41, -491826382) ];
		var bko2 = [], f = new Float32Array(1);
		for (var i=0; i<200; i++) { bko2.push(PICK_KO[Math.floor(random()*PICK_KO.length)]); }
		for (var i=0; i<50; i++)  {
			f[0] = random(); // Make sure number fits on Float32
			bko2.push({ 'key1': 'same', 'key2': f[0] }); 
		}
		for (var i=0; i<200; i++) { bko2.push(PICK_KO[Math.floor(random()*PICK_KO.length)]); }
		it_should_return( bko2, '[ 100 x Known Object, 50 x Plain, 100 x Known Object ]' );

		// Order of IRef : Referencing to an object created inside the array
		var bko3 = [], bko3_ref = new ObjectA();
		for (var i=0; i<256; i++) {
			bko3.push( new ObjectB( bko3_ref, new ObjectA() ) );
		}
		it_should_return( bko3, '[ 256 x ObjectB( ObjectA(), ObjectA() ) ]' );

	});

	describe('Objects', function () {

		// Internal referencing of objects
		var obj1 = { 'plain': 1, 'object': 2 },
			obj2 = { 'complex': [1,2,3], 'object': obj1 },
			obj3 = { 'multi': obj2, 'object': obj2, 'with': obj2, 'iref': obj1 },
			obj4 = { 'many': gen_array_rep('Array', 1000, obj3), 'length': 1000 };

		// Try to encode simple object
		it_should_return( obj1, null, [match_metaType('object.plain')] );
		it_should_return( obj2, null, [match_metaType('object.plain')] );
		it_should_return( obj3, "{ multi: [Object], object: [Object], with: [Object], iref: [Object] }", [match_metaType('object.plain')] );
		it_should_return( obj4 , null, [match_metaType('object.plain')] );

		// Try to encode known object instances
		var obj5 = new ObjectA(),
			obj6 = new ObjectB( 12345, "check" ),
			obj7 = new ObjectC( 23456, "check-too" ),
			obj8 = new ObjectD();

		// Try to encode objects part of OT
		it_should_return( obj5, '[ObjectA] (DefaultFactory, DefaultInit)', [match_metaType('object.known')] );
		it_should_return( obj6, '[ObjectB] (UnconstructedFactory, DefaultInit)', [match_metaType('object.known')] );
		it_should_return( obj7, '[ObjectC] (UnconstructedFactory, CustomInit)', [match_metaType('object.known')] );
		it_should_throw ( obj8, '[ObjectD] (Not part of OT)', function(err) {
			return (err instanceof Errors.XRefError);
		});

		// Simple nested object case
		var obj9 = new ObjectA(), // Target
			obj10 = new ObjectB( obj9,  "first" ), // First reference
			obj11 = new ObjectC( [obj10, obj9], "complex" ); // Second, nested reference
		it_should_return( obj11, '[ Nested object references ]', [match_metaType('object.known')] );

		// Deep, complicated nesting scenarios with objects from OT
		var obj9 = new ObjectA(),
			obj10 = new ObjectB( obj9,  "first" ),
			obj11 = new ObjectB( obj10, 2.3192379474639893 ),
			obj12 = new ObjectB( obj11, { "index": "third", "num": 3, "o": { "at": 3 } } ),
			obj13 = new ObjectB( obj12, new ObjectA() ),
			obj14 = new ObjectC( [obj10, obj11, obj12, obj13], "complex" ),
			obj15 = new ObjectB( [obj10, obj14], "further-nesting" ),
			obj16 = new ObjectB( [obj11, obj12, obj13], "another-turn" ),
			obj17 = new ObjectC( [obj13, obj15, obj16], "complex" );
		it_should_return( obj17, '[ Complicated nested objects ]', [match_metaType('object.known')] );

		// Byval de-duplication
		var obj20 = [];
		for (var i=0; i<256; ++i) {
			obj20.push(new ObjectB( 5123, "good" ));
		}
		it_should_return( obj20, '[ 256 x new ObjectB(5123, "good") ]', [match_metaType('array.primitive.repeated')] );

		// Multiple object tables
		var obj21 = new ObjectE(),
			obj22 = new ObjectA(),
			obj23 = new ObjectF( obj21, "simple" ),
			obj24 = new ObjectF( obj22, "simple-cross" );
			obj25 = new ObjectC( [obj22, obj23, obj24], "combined" );
		it_should_return_combined( obj24, "[ Objects from 2 Object Tables ]" );

	});

	describe('External References (XRef)', function () {

		it('should except when oppening a bundle with xrefs, but with undefined db', function() {

			// Create some objects
			var obj1 = new ObjectA(),
				obj2 = new ObjectB( 12345, "check" ),
				obj3 = new ObjectC( obj1, "part-object-1" ),
				obj4 = new ObjectC( obj2, "part-object-2" );

			// Create an encoder with 2 objects
			var encoder = open_encoder( EncodeProfile );
			var db = {
				'x/obj1': obj1,
				'x/obj2': obj2
			};
			encoder.setDatabase( db );
			encoder.encode( obj3, 'obj3' );
			encoder.encode( obj4, 'obj4' );
			encoder.close();

			// Try to load a bundle with xrefs
			assert.throws(function() {
				var openBundle = open_decoder( encoder, DecodeProfile );
			}, function(err) {
				return (err instanceof Errors.XRefError);
			}, 'bundle decoder did not thorw an ImportError while loading');

			// Cleanup
			cleanup_encoder( encoder );

		});

		it('should properly import the correct XRef dependencies', function() {

			// Create some objects
			var obj1 = new ObjectA(),
				obj2 = new ObjectB( 12345, "check" ),
				obj3 = new ObjectC( obj1, "part-object-1" ),
				obj4 = new ObjectC( obj2, "part-object-2" );

			// Create an encoder with 2 objects
			var encoder = open_encoder( EncodeProfile );
			var db = {
				'x/obj1': obj1,
				'x/obj2': obj2
			};
			encoder.setDatabase( db );
			encoder.encode( obj3, 'obj3' );
			encoder.encode( obj4, 'obj4' );
			encoder.close();

			// Open bundle with xref table
			var openBundle = open_decoder( encoder, DecodeProfile, {
				'x/obj1': "yes-imported-1",
				"x/obj2": "yes-imported-2"
			});

			// Make sure xrefs are correct
			assert( openBundle.database['test/obj3'].objCpropA == "yes-imported-1" );
			assert( openBundle.database['test/obj4'].objCpropA == "yes-imported-2" );

			// Cleanup
			cleanup_encoder( encoder );

		});

		it('should properly import the correct nested XRef dependencies', function() {

			// Create some objects
			var obj1 = new ObjectA(),
				obj2 = new ObjectB( 12345, "check" ),
				obj3 = new ObjectC( obj1, "part-object-1" ),
				obj4 = new ObjectC( obj2, "part-object-2" ),
				obj5 = new ObjectB( obj2, "nested" ),
				obj6 = new ObjectC( obj5, "part-object-3" );

			// Create an encoder with 2 objects with nested depencencies
			var encoder = open_encoder( EncodeProfile );
			var db = {
				'x/obj1': obj1,
				'x/obj2': obj2,
				'x/obj4': obj4,
				'x/obj5': obj5
			};
			encoder.setDatabase( db );
			encoder.encode( obj3, 'obj3' );
			encoder.encode( obj6, 'obj6' );
			encoder.close();

			// Open bundle with xref table
			delete db['test/obj3']; delete db['test/obj6'];
			var openBundle = open_decoder( encoder, DecodeProfile, db);

			// Make sure xrefs are correct
			assert( openBundle.database['test/obj3'].objCpropA.objApropA == obj1.objApropA );
			assert( openBundle.database['test/obj6'].objCpropA.objBpropA.objBpropA == obj2.objBpropA );

			// Cleanup
			cleanup_encoder( encoder );

		});

	});

	describe('Sparse Bundles', function () {

		// Create some objects
		var obj1 = new ObjectA(),
			obj2 = new ObjectB( 128, "some-string" ),
			obj3 = new ObjectC( 1024, 4.212E+40 );
			obj4 = new ObjectC( 31247123, 0.6764000058174133 );

		// Create a sparse encoder with few objects
		var encoder1 = open_encoder( EncodeProfile, true );
		encoder1.encode( obj1, 'obj1' );
		encoder1.encode( obj2, 'obj2' );
		encoder1.encode( obj3, 'obj3' );
		encoder1.encode( obj4, 'obj4' );
		encoder1.close();

		// Load the sparse file
		var decoder1 = open_decoder_sparse( encoder1, DecodeProfile );
		it_should_match( obj1, decoder1.database['test/obj1'], '[ObjectA]' );
		it_should_match( obj2, decoder1.database['test/obj2'], '[ObjectB( 128, "some-string" )]');
		it_should_match( obj3, decoder1.database['test/obj3'], '[ObjectC( 1024, 4.212E+40 )]');
		it_should_match( obj4, decoder1.database['test/obj4'], '[ObjectD( 31247123, 0.6764000058174133 )]' );

		// Cleanup at the end
		after(function() {
			cleanup_encoder( encoder1 );
		});

	});


});
