
var util = require('util');
var common = require('./common');
var ot = require('jbb-profile-three');

////////////////////////////////////////////////////////////////
// Generator helpers
////////////////////////////////////////////////////////////////

/**
 * Sequential array generator
 */
function gen_array_seq( typeName, length, min, step ) {
	var arr = new global[typeName](length);
	for (var i=0, v=min; i<length; i++) {
		arr[i] = v; v+=step;
	}
	return arr;
}

/**
 * Random array generator
 */
function gen_array_rand( typeName, length, min, max ) {
	var arr = new global[typeName](length), range = max-min;
	if (typeName.substr(0,5) == 'Float') {
		// To avoid rounding errors
		var rarr = new global[typeName](1);
		// Create array
		for (var i=0; i<length; i++) {
			rarr[0] = Math.random() * range;
			arr[i] = rarr[0];
		}
	} else {
		for (var i=0; i<length; i++) {
			arr[i] = parseInt(Math.random() * range) + min;
		}
	}
	return arr;
}

////////////////////////////////////////////////////////////////
// Test helpers
////////////////////////////////////////////////////////////////

/**
 * Accelerator function for primitive checking
 */
function it_should_return(primitive) {
	it('should return `'+util.inspect(primitive,{'depth':1})+'`, as encoded', function () {
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

////////////////////////////////////////////////////////////////
// Test entry point
////////////////////////////////////////////////////////////////

var assert = require('assert');
describe('BinaryEncoder -> BinaryLoader', function() {

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

	});

	describe('Delta-Encoded Arrays', function () {

		// Min-max bounds of 16-bit index with 8-bit delta
		it_should_return_array_seq('Array',256	,256,1);					// Smallest of 16-bit
		it_should_return_array_seq('Array',65535,256,1);					// Smallest of 16-bit

	});

});
