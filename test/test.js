
var util   = require('util');
var ot 	   = require('jbb-profile-three');
var assert = require('assert');
var common = require('./common');

////////////////////////////////////////////////////////////////
// Generator helpers
////////////////////////////////////////////////////////////////

/**
 * Sequential array generator
 */
function gen_array_seq( typeName, length, min, step ) {
	var arr = new global[typeName](length);
	var rarr = new global[typeName](1); // For type safety just in case we did something wrong here
	for (var i=0, v=min; i<length; i++) {
		rarr[0] = v;
		arr[i] = rarr[0];
		v+=step;
	}
	return arr;
}

/**
 * Random array generator
 */
function gen_array_rand( typeName, length, min, max ) {
	var arr = new global[typeName](length), range = max-min;
	var rarr = new global[typeName](1); // For type safety just in case we did something wrong here
	for (var i=0; i<length; i++) {
		rarr[0] = Math.random() * range + min;
		arr[i] = rarr[0];
	}
	return arr;
}

/**
 * Repeated array generator
 */
function gen_array_rep( typeName, length, value ) {
	var arr = new global[typeName](length);
	var rarr = new global[typeName](1); // For type safety just in case we did something wrong here
	rarr[0] = value;
	for (var i=0; i<length; i++) {
		arr[i] = rarr[0];
	}
	return arr;
}

////////////////////////////////////////////////////////////////
// Test helpers
////////////////////////////////////////////////////////////////

/**
 * Accelerator function for primitive checking
 */
function it_should_return(primitive, repr) {
	var text = repr || util.inspect(primitive,{'depth':0});
	it('should return `'+text+'`, as encoded', function () {
		var ans = common.encode_decode( primitive, ot );
		if (isNaN(ans) && isNaN(primitive)) return;
		assert.deepEqual( primitive, ans );
	});
}

/**
 * Accelerator function for sequential array checking
 */
function it_should_return_array_seq( typeName, length, min, step ) {
	var array = gen_array_seq(typeName, length, min, step);
	it('should return `'+typeName+'('+length+') = ['+array[0]+'..'+array[1]+'/'+step+']`, as encoded', function () {
		var ans = common.encode_decode( array, ot );
		// Perform strong type checks on typed arrays
		if (typeName != 'Array')
			assert.equal( array.constructor, ans.constructor );
		// Otherwise just check values
		assert.deepEqual( array, ans );
	});
}

/**
 * Accelerator function for random array checking
 */
function it_should_return_array_rand( typeName, length, min, max ) {
	var array = gen_array_rand(typeName, length, min, max);
	it('should return `'+typeName+'('+length+') = [rand('+min+'..'+max+')]`, as encoded', function () {
		var ans = common.encode_decode( array, ot );
		// Perform strong type checks on typed arrays
		if (typeName != 'Array')
			assert.equal( array.constructor, ans.constructor );
		// Otherwise just check values
		assert.deepEqual( array, ans );
	});
}

/**
 * Accelerator function for repeared array checking
 */
function it_should_return_array_rep( typeName, length, value ) {
	var array = gen_array_rep(typeName, length, value);
	it('should return `'+typeName+'('+length+') = [... ('+util.inspect(value,{'depth':1})+' x '+length+') ...]`, as encoded', function () {
		var ans = common.encode_decode( array, ot );
		// Perform strong type checks on typed arrays
		if (typeName != 'Array')
			assert.equal( array.constructor, ans.constructor );
		// Otherwise just check values
		assert.deepEqual( array, ans );
	});
}

////////////////////////////////////////////////////////////////
// Test entry point
////////////////////////////////////////////////////////////////

describe('[Encoding/Decoding]', function() {

	describe('Simple Primitives', function () {

		// Test the core primitives
		it_should_return(undefined);
		it_should_return(null);
		it_should_return(true);
		it_should_return(false);
		it_should_return(NaN);

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
		it_should_return_array_rand('Uint8Array',	255, 0,				255);
		it_should_return_array_rand('Int8Array', 	255, -127,			127);
		it_should_return_array_rand('Uint16Array',	255, 0,				65535);
		it_should_return_array_rand('Int16Array', 	255, -32768,		32767);
		it_should_return_array_rand('Uint32Array',	255, 0,				4294967296);
		it_should_return_array_rand('Int32Array',	255, -2147483648,	2147483648);
		it_should_return_array_rand('Float32Array',	255, 0,				2147483648);
		it_should_return_array_rand('Float64Array',	255, 0,				17179869184);

	});

	describe('Repeated Arrays', function () {

		// Test the preference of repeated arrays instead of (short) 
		it_should_return_array_seq('Array',100,1,0);

		// Possibly short-sized, but with repeated values
		it_should_return_array_seq('Array',256,1,0); 					// < 8bit
		it_should_return_array_seq('Array',256,255,0);					// = 8bit
		it_should_return_array_seq('Array',256,65535,0);				// = 16bit
		it_should_return_array_seq('Array',256,4294967295,0);			// = 32bit
		it_should_return_array_seq('Array',256,9.22337203685478E18,0);	// close to 64-bit

		// Long repeated possiblities
		it_should_return_array_seq('Array',1024,1,0);					// <<16 bit
		it_should_return_array_seq('Array',65535,1,0);					// >16 bit

		// Typed repeated possibilities
		it_should_return_array_seq('Uint8Array',256,255,0);				// = 8bit
		it_should_return_array_seq('Int8Array',256,255,0);				// = 8bit
		it_should_return_array_seq('Uint16Array',256,255,0);			// = 8bit
		it_should_return_array_seq('Int16Array',256,255,0);				// = 8bit
		it_should_return_array_seq('Uint32Array',256,255,0);			// = 8bit
		it_should_return_array_seq('Int32Array',256,255,0);				// = 8bit
		it_should_return_array_seq('Float32Array',256,4123.123,0);		// = 8bit
		it_should_return_array_seq('Float64Array',256,4123.123,0);		// = 8bit

		// Repeated tricky and simple primitives
		it_should_return_array_rep('Array', 255, undefined);
		it_should_return_array_rep('Array', 255, false);
		it_should_return_array_rep('Array', 255, {'simple':'object'});

	});

	describe('Delta-Encoded Arrays', function () {

		//// Integer delta-encoding ////

		// UINT16	-> INT8
		it_should_return_array_seq('Uint16Array',256,	256,	1);
		// INT16	-> INT8
		it_should_return_array_seq('Int16Array', 256,	-127,	1);
		// UINT32	-> INT8
		it_should_return_array_seq('Uint32Array',256,	65535,	1);	
		// INT32	-> INT8
		it_should_return_array_seq('Int32Array', 256,	-32768,	1);

		// UINT32	-> INT16
		it_should_return_array_seq('Uint32Array',256,	0,		256);
		// INT32	-> INT16
		it_should_return_array_seq('Int32Array',256,	-1024,	256);

		//// Float delta-encoding ////

		// FLOAT32	-> INT8
		it_should_return_array_seq('Float32Array',256,	0,	1);	
		// FLOAT32	-> INT16
		it_should_return_array_seq('Float32Array',256,	0,	256);

		//// Incomplete types ////

		// FLOAT64	-> (Should opt out from Delta-Encoding without issues)
		it_should_return_array_seq('Float64Array',256,	0,	256);

		//// Test if the 32-bit index works ////

		it_should_return_array_seq('Uint16Array',65536,	0, 		1);

	});

	describe('Downscaled Arrays', function () {	

		//// Integer downscaling ////

		// UINT16	-> UINT8
		it_should_return_array_rand('Uint16Array',1024,	0,	255);
		// INT16	-> INT8
		it_should_return_array_rand('Int16Array', 1024,	-127, 127);

		// INT16	-> UINT8 (Shout opt-out from downscaling)
		it_should_return_array_rand('Int16Array', 1024,	0,	255);

		// UINT32	-> UINT8
		it_should_return_array_rand('Uint32Array',1024,	0,	255);
		// INT32	-> INT8
		it_should_return_array_rand('Int32Array', 1024,	-127, 127);

		// INT32	-> UINT8 (Should opt-out from downscaling)
		it_should_return_array_rand('Int32Array', 1024,	0,	255);

		// UINT32	-> UINT16
		it_should_return_array_rand('Uint32Array',1024,	0,	65535);
		// INT32	-> INT16
		it_should_return_array_rand('Int32Array',1024,	-32768, 32768);

		//// Float downscaling ////

		// FLOAT32	-> INT8
		it_should_return_array_rand('Float32Array',1024,	0,	127);
		// FLOAT32	-> INT16
		it_should_return_array_rand('Float32Array',1024,	0,	32768);

	});

	describe('Chunked Arrays', function () {
		var values;

		// Simple composite case
		values = [].concat(
			gen_array_seq( 'Array', 100, 0, 1 ),
			'Break',
			gen_array_seq( 'Array', 100, 0, 1 ),
			'Break',
			gen_array_seq( 'Array', 100, 0, 1 ),
			'Break'
		);
		it_should_return( values, '[ 100 x NUM, \'Break\', 100 x NUM, \'Break\', 100 x NUM, \'Break\' ]' );

		// Repeated composites (Ideally future-optimised)
		values = [];
		var rep = [true, false, undefined, 255, 65535, 4294967295, {'plain':'object'}];
		for (var i=0; i<100; i++)
			values = values.concat(rep);
		it_should_return( values, '[ (true, false, undefined, 255, 65535, 4294967295, {\'plain\':\'object\'} ) x 100 ]' );

		// Create multi-chunked array
		values = [].concat(
			gen_array_rep( 'Array', 100, false ),
			gen_array_rep( 'Array', 50, true ),
			gen_array_rep( 'Array', 5, undefined ),
			gen_array_rep( 'Array', 128, {'object':'with_a_simple','structure':4} ),
			gen_array_rep( 'Array', 255, {'limit_of_objects':255} ),
			gen_array_rep( 'Array', 1024, {'too_many':123,'objects':4123} )
		);
		it_should_return( values, '[ 100 x false, 50 x true, 5 x undefined, 128 x [Object#1], 255 x [Object#2], 1024 x [Object#3] ]' );

	});

	describe('Objects', function () {

		// Internal referencing of objects
		var obj1 = { 'plain': 1, 'object': 2 },
			obj2 = { 'complex': [1,2,3], 'object': obj1 },
			obj3 = { 'multi': obj2, 'object': obj2, 'with': obj2, 'iref': obj1 },
			obj4 = { 'many': gen_array_rep('Array', 1000, obj3), 'length': 1000 };

		// Try to encode simple object
		it_should_return( obj1 );
		it_should_return( obj2 );
		it_should_return( obj3, "{ multi: [Object], object: [Object], with: [Object], iref: [Object] }" );
		it_should_return( obj4 );

	});


});
