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

var util   			= require('util');
var assert 			= require('assert');
var BinaryBundle 	= require("../lib/BinaryBundle");

// Static import of utility functions
require('./utils/common').static(global);
require('./utils/ot').static(global);
require('./utils/tests').static(global);

const FLOAT32_POS = 3.40282346e+38; // largest positive number in float32
const FLOAT32_NEG = -3.40282346e+38; // largest negative number in float32
const FLOAT32_SMALL = 1.175494350e-38; // smallest number in float32

/**
 * Numerical types
 */
var NUMTYPE = {
	// For protocol use
	UINT8: 	 0, INT8:    1,
	UINT16:  2, INT16:   3,
	UINT32:  4, INT32:   5,
	FLOAT32: 6, FLOAT64: 7
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
			var encoder = open_encoder( SimpleOT, sparse );
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
			assert.equal( u16[1], SimpleOT.ID, 	'Object table should be 0x'+SimpleOT.ID.toString(16));
			assert.equal( u16[2], 0x0102,		'Protocol version should be v1.2');
			assert.equal( u16[3], 0,			'Reserved header field should be 0');

			// Check table
			assert.equal( u32[2], 8,			'64-bit table size');
			assert.equal( u32[3], 8,			'32-bit table size');
			assert.equal( u32[4], 14,			'16-bit table size');
			assert.equal( u32[5], 53,			'8-bit table size');
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
			var bundle = new BinaryBundle( (p.length == 1) ? p[0] : p, SimpleOT );

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
			var bundle = new BinaryBundle( (p.length == 1) ? p[0] : p, SimpleOT );

			// Validate string table
			var plain_values = [ 1, 2, 3, 4 ];
			var weave_values = [ [1, 10], 
								 [2, 20], 
								 [3, 30], 
								 [4, 40] ];

			// Two test objects
			var test_object_1 = {
				'plain': plain_values[0],
				'32bit': plain_values[1],
				'64bit': plain_values[2],
				'object': plain_values[3],
			};
			var test_object_2 = {
				'plain': weave_values[0][1],
				'32bit': weave_values[1][1],
				'64bit': weave_values[2][1],
				'object': weave_values[3][1],
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
		it_should_return_array_rand('Uint8Array',	255, 0,				255, 		[match_metaType('array.short')]);
		it_should_return_array_rand('Int8Array', 	255, -127,			127, 		[match_metaType('array.short')]);
		it_should_return_array_rand('Uint16Array',	255, 0,				65535, 		[match_metaType('array.short')]);
		it_should_return_array_rand('Int16Array', 	255, -32768,		32767, 		[match_metaType('array.short')]);
		it_should_return_array_rand('Uint32Array',	255, 0,				4294967296, [match_metaType('array.short')]);
		it_should_return_array_rand('Int32Array',	255, -2147483648,	2147483648, [match_metaType('array.short')]);
		it_should_return_array_rand('Float32Array',	255, 0,				2147483648, [match_metaType('array.short')]);
		it_should_return_array_rand('Float64Array',	255, 0,				17179869184,[match_metaType('array.short')]);

	});

	describe('Repeated Arrays', function () {

		// Test the preference of repeated arrays instead of (short) 
		it_should_return_array_seq('Array',100,1,0, [match_metaType('array.repeated')]);

		// Possibly short-sized, but with repeated values
		it_should_return_array_seq('Array',256,1,0, [match_metaType('array.repeated')]); 					// < 8bit
		it_should_return_array_seq('Array',256,255,0, [match_metaType('array.repeated')]);					// = 8bit
		it_should_return_array_seq('Array',256,65535,0, [match_metaType('array.repeated')]);				// = 16bit
		it_should_return_array_seq('Array',256,4294967295,0, [match_metaType('array.repeated')]);			// = 32bit
		it_should_return_array_seq('Array',256,9.22337203685478E18,0, [match_metaType('array.repeated')]);	// close to 64-bit

		// Long repeated possiblities
		it_should_return_array_seq('Array',1024,1,0, [match_metaType('array.repeated')]);					// <<16 bit
		it_should_return_array_seq('Array',65535,1,0, [match_metaType('array.repeated')]);					// >16 bit

		// Typed repeated possibilities
		it_should_return_array_seq('Uint8Array',256,255,0, [match_metaType('array.repeated')]);				// = 8bit
		it_should_return_array_seq('Int8Array',256,255,0, [match_metaType('array.repeated')]);				// = 8bit
		it_should_return_array_seq('Uint16Array',256,255,0, [match_metaType('array.repeated')]);			// = 8bit
		it_should_return_array_seq('Int16Array',256,255,0, [match_metaType('array.repeated')]);				// = 8bit
		it_should_return_array_seq('Uint32Array',256,255,0, [match_metaType('array.repeated')]);			// = 8bit
		it_should_return_array_seq('Int32Array',256,255,0, [match_metaType('array.repeated')]);				// = 8bit
		it_should_return_array_seq('Float32Array',256,4123.123,0, [match_metaType('array.repeated')]);		// = 8bit
		it_should_return_array_seq('Float64Array',256,4123.123,0, [match_metaType('array.repeated')]);		// = 8bit

		// Repeated tricky and simple primitives
		it_should_return_array_rep('Array', 255, undefined, [match_chunkTypes(['repeat'])]);
		it_should_return_array_rep('Array', 255, false, [match_chunkTypes(['repeat'])]);
		it_should_return_array_rep('Array', 255, {'simple':'object'}, [match_chunkTypes(['repeat'])]);

		// Test bigger indices in a single chunk
		it_should_return_array_rep('Array', 1024, {'simple':'object'}, [match_chunkTypes(['repeat'])]);
		it_should_return_array_rep('Array', 65536, {'simple':'object'}, [match_chunkTypes(['repeat'])]);

	});

	describe('Delta-Encoded Arrays', function () {

		//// Integer delta-encoding ////

		// UINT8	-> No delta-encoding
		it_should_return_array_seq('Uint8Array', 256,	256,	1,	 [match_metaType('array.raw')]);

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

		// FLOAT32	-> INT8
		it_should_return_array_seq('Float32Array',256,	0,	0.5, 	 [match_metaType('array.delta.float')]);	
		// FLOAT32	-> INT16
		it_should_return_array_seq('Float32Array',256,	0,	32.125,  [match_metaType('array.delta.float')]);

		//// Incomplete types ////

		// FLOAT64	-> (Should opt out from Delta-Encoding without issues)
		it_should_return_array_seq('Float64Array',256,	0,	256, [match_metaType('array.delta.float')]);

		//// Test if the 32-bit index works ////

		it_should_return_array_seq('Uint16Array',65536,	0, 1, [match_metaType('array.delta.int')]);

	});

	describe('Downscaled Arrays', function () {	

		//// Integer downscaling ////

		// UINT16	-> UINT8
		it_should_return_array_rand('Uint16Array',1024,	0,	255,		[match_metaType('array.downscaled')]);
		// INT16	-> INT8
		it_should_return_array_rand('Int16Array', 1024,	-127, 127,		[match_metaType('array.downscaled')]);

		// INT16	-> UINT8 (Shout opt-out from downscaling)
		it_should_return_array_rand('Int16Array', 1024,	0,	255,		[match_metaType('array.downscaled')]);

		// UINT32	-> UINT8
		it_should_return_array_rand('Uint32Array',1024,	0,	255,		[match_metaType('array.downscaled')]);
		// INT32	-> INT8
		it_should_return_array_rand('Int32Array', 1024,	-127, 127,		[match_metaType('array.downscaled')]);

		// INT32	-> UINT8 (Should opt-out from downscaling)
		it_should_return_array_rand('Int32Array', 1024,	0,	255,		[match_metaType('array.downscaled')]);

		// UINT32	-> UINT16
		it_should_return_array_rand('Uint32Array',1024,	0,	65535,		[match_metaType('array.downscaled')]);
		// INT32	-> INT16
		it_should_return_array_rand('Int32Array',1024,	-32768, 32768,	[match_metaType('array.downscaled')]);

		//// Float downscaling ////

		// FLOAT32	-> INT8
		it_should_return_array_rand('Float32Array',1024,	0,	127,	[match_metaType('array.downscaled')]);
		// FLOAT32	-> INT16
		it_should_return_array_rand('Float32Array',1024,	0,	32768,	[match_metaType('array.downscaled')]);

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

	});

	describe('Chunked Arrays', function () {
		var values, matchTypes;

		// Simple composite case
		values = [].concat(
			gen_array_seq( 'Array', 100, 0, 1 ),
			'Break',
			gen_array_seq( 'Array', 100, 0, 1 ),
			'Break',
			gen_array_seq( 'Array', 100, 0, 1 ),
			'Break'
		);
		// console.log(values);
		it_should_return( values, '[ 100 x NUM, \'Break\', 100 x NUM, \'Break\', 100 x NUM, \'Break\' ]', 
			[function(meta) { console.log(meta.meta.chunks); }, match_chunkTypes([
				'numeric',		// 100 numeric items
				'primitives',	// 'Break'
				'numeric',		// 100 numeric items
				'primitives',	// 'Break'
				'numeric',		// 100 numeric items
				'primitives'	// 'Break'
			])] );

		// Repeated composites (Ideally future-optimised)
		values = []; matchTypes = [];
		var rep = [true, false, undefined, 255, 128, 67, 65535, 32535, 4294967295, {'plain':'object'}];
		var repTypes = [
			'primitives',	// true, false, undefined
			'numeric',		// 255, 128, 67, 65535, 32535, 4294967295
			'primitives',	// {'plain':'object'}
		];
		for (var i=0; i<100; i++) {
			values = values.concat(rep);
			matchTypes = matchTypes.concat(repTypes);
		}
		it_should_return( values, '[ (true, false, undefined, 255, 65535, 4294967295, {\'plain\':\'object\'} ) x 100 ]', 
			[function(meta) { console.log(meta.meta.chunks); }, match_chunkTypes(matchTypes)] );

		// Create multi-chunked array
		values = [].concat(
			gen_array_rep( 'Array', 5/*100*/, false ),
			gen_array_rep( 'Array', 5/*50*/, true ),
			gen_array_rep( 'Array', 5/*5*/, undefined ),
			gen_array_rep( 'Array', 5/*128*/, {'object':'with_a_simple','structure':4} ),
			gen_array_rep( 'Array', 5/*255*/, {'limit_of_objects':255} ),
			gen_array_rep( 'Array', 5/*1024*/, {'too_many':123,'objects':4123} )
		);
		it_should_return( values, '[ 100 x false, 50 x true, 5 x undefined, 128 x [Object#1], 255 x [Object#2], 1024 x [Object#3] ]',
			[ match_metaType('array.chunked') ] );

		// Check limits of repeated values
		values = [].concat(
			[ 'chunk_prefix' ],
			gen_array_rep( 'Array', 10/*255*/, 'same' ),
			[ false ]
		);
		it_should_return( values, 'Repeated Chunk [ 255 x \'same\' ]', [match_metaType('array.chunked')] );
		values = [].concat(
			[ 'chunk_prefix' ],
			gen_array_rep( 'Array', 10/*32767*/, 'same' ),
			[ false ]
		);
		it_should_return( values, 'Repeated Chunk [ 32,767 x \'same\' ]', [match_metaType('array.chunked')] );
		// values = [].concat(
		// 	[ 'chunk_prefix' ],
		// 	gen_array_rep( 'Array', 65535, 'same' ),
		// 	[ false ]
		// );
		// it_should_return( values, 'Repeated Chunk [ 65,535 x \'same\' ]' );

		// Create bulk array
		var bulkrep = [];
		for (var i=0; i<10/*65535*/; i++)
			bulkrep.push({
				'value': Math.floor(Math.random() * 255),
				'same': 4,
				'string': 'This is a string'
			});
		it_should_return( bulkrep, '[ 65,535 x { value: [random] } ]', [match_metaType('array.chunked')] );

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
			return (err.name == 'EncodingError');
		});

	});

	describe('External References (XRef)', function () {

		it('should except when oppening a bundle with xrefs, but with undefined db', function() {

			// Create some objects
			var obj1 = new ObjectA(),
				obj2 = new ObjectB( 12345, "check" ),
				obj3 = new ObjectC( obj1, "part-object-1" ),
				obj4 = new ObjectC( obj2, "part-object-2" );

			// Create an encoder with 2 objects
			var encoder = open_encoder( SimpleOT );
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
				var openBundle = open_decoder( encoder, SimpleOT );
			}, function(err) {
				return (err.name == 'ImportError');
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
			var encoder = open_encoder( SimpleOT );
			var db = {
				'x/obj1': obj1,
				'x/obj2': obj2
			};
			encoder.setDatabase( db );
			encoder.encode( obj3, 'obj3' );
			encoder.encode( obj4, 'obj4' );
			encoder.close();

			// Open bundle with xref table
			var openBundle = open_decoder( encoder, SimpleOT, {
				'x/obj1': "yes-imported-1",
				"x/obj2": "yes-imported-2"
			});

			// Make sure xrefs are correct
			assert( openBundle.database['test/obj3'].propA == "yes-imported-1" );
			assert( openBundle.database['test/obj4'].propA == "yes-imported-2" );

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
			var encoder = open_encoder( SimpleOT );
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
			var openBundle = open_decoder( encoder, SimpleOT, db);

			// Make sure xrefs are correct
			assert( openBundle.database['test/obj3'].propA.propA == obj1.propA );
			assert( openBundle.database['test/obj6'].propA.propA.propA == obj2.propA );

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
		var encoder1 = open_encoder( SimpleOT, true );
		encoder1.encode( obj1, 'obj1' );
		encoder1.encode( obj2, 'obj2' );
		encoder1.encode( obj3, 'obj3' );
		encoder1.encode( obj4, 'obj4' );
		encoder1.close();

		// Load the sparse file
		var decoder1 = open_decoder_sparse( encoder1, SimpleOT );
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
