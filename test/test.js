
var util   = require('util');
var assert = require('assert');
var common = require('./common');

// A coule of local objects, part of Object Table
var ObjectA = function() {
	this.propA = 125;
	this.propB = 65532;
	this.propC = "A string";
};
var ObjectB = function( propA, propB ) {
	this.propA = propA;
	this.propB = propB;
	this.propC = [ 1, 4, 120, 4123 ]
};
var ObjectC = function( propA, propB ) {
	this.propA = propA;
	this.propB = propB;
	this.propC = { 'some': { 'sub': 'object' } };
	this.propD = "I am ignored :(";
};
var ObjectD = function() {
	this.propA = 0;
	this.propB = 1;
	this.propC = "Not part of ObjectTable";
};

// Default & Unconstructed factories
var DefaultFactory = function(ClassName) {
	return new ClassName();
}
var UnconstructedFactory = function(ClassName) {
	return Object.create(ClassName.prototype);
}

// Default init
var DefaultInit = function( instance, properties, values ) {
	for (var i=0; i<properties.length; i++) {
		instance[properties[i]] = values[i];
	}
}
var ObjectCInit = function( instance, properties, values ) {
	DefaultInit( instance, properties, values );
	instance.constructor.call(
			instance, instance.propA,
					  instance.propB
		);
}

// Local object table for tests
var ot 	   = {
	'ID' 		: 0,
	'ENTITIES' 	: [
		[ ObjectA, DefaultFactory, DefaultInit ],
		[ ObjectB, UnconstructedFactory, DefaultInit ],
		[ ObjectC, UnconstructedFactory, ObjectCInit ]
	],
	'PROPERTIES': [
		[ 'propA', 'propB', 'propC' ],
		[ 'propA', 'propB', 'propC' ],
		[ 'propA', 'propB', 'propC' ]
	],
};

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
 * Accelerator function for comparing primitives checking
 */
function it_should_match(a, b, repr) {
	var text = repr || util.inspect(a,{'depth':0});
	it('should match `'+text+'`, as encoded', function () {
		assert.deepEqual( a, b );
	});
}

/**
 * Accelerator function for checking exceptions
 */
function it_should_throw(primitive, repr, isCorrectException) {
	var text = repr || util.inspect(primitive,{'depth':0});
	it('should except when encoding `'+text+'`', function () {
		assert.throws(function() {
			var ans = common.encode_decode( primitive, ot );
			assert(isNaN(ans) || (ans == undefined), 'encoder return an error after exception');
		}, isCorrectException)
	});
}

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

		// Create bulk array
		var bulkrep = [];
		for (var i=0; i<65535; i++)
			bulkrep.push({
				'value': Math.floor(Math.random() * 255),
				'same': 4,
				'string': 'This is a string'
			});
		it_should_return( bulkrep, '[ 65,535 x { value: [random] } ]' );

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

		// Try to encode known object instances
		var obj5 = new ObjectA(),
			obj6 = new ObjectB( 12345, "check" ),
			obj7 = new ObjectC( 23456, "check-too" ),
			obj8 = new ObjectD();

		// Try to encode objects part of OT
		it_should_return( obj5, '[ObjectA] (DefaultFactory, DefaultInit)' );
		it_should_return( obj6, '[ObjectB] (UnconstructedFactory, DefaultInit)' );
		it_should_return( obj7, '[ObjectC] (UnconstructedFactory, CustomInit)' );
		it_should_throw ( obj8, '[ObjectD] (Not part of OT)', function(err) {
			return (err.name == 'EncodingError');
		});

	});

	describe('External References (XRef)', function () {

		// Create some objects
		var obj1 = new ObjectA(),
			obj2 = new ObjectB( 12345, "check" ),
			obj3 = new ObjectC( obj1, "part-object-1" ),
			obj4 = new ObjectC( obj2, "part-object-2" ),
			obj5 = new ObjectB( obj2, "nested" ),
			obj6 = new ObjectC( obj5, "part-object-3" );

		// Create an encoder with 2 objects
		var encoder1 = common.open_encoder( ot );
		var db1 = {
			'x/obj1': obj1,
			'x/obj2': obj2
		};
		encoder1.setDatabase( db1 );
		encoder1.encode( obj3, 'obj3' );
		encoder1.encode( obj4, 'obj4' );
		encoder1.close();

		// Create an encoder with 2 objects with nested depencencies
		var encoder2 = common.open_encoder( ot );
		var db2 = {
			'x/obj1': obj1,
			'x/obj2': obj2,
			'x/obj5': obj5
		};
		encoder2.setDatabase( db2 );
		encoder2.encode( obj3, 'obj3' );
		encoder2.encode( obj6, 'obj6' );
		encoder2.close();

		it('should except when oppening a bundle with xrefs, but with undefined db', function() {
			assert.throws(function() {
				var openBundle = common.open_decoder( encoder1, ot );
			}, function(err) {
				return (err.name == 'ImportError');
			}, 'bundle decoder did not thorw an ImportError while loading');
		});

		it('should properly import the correct XRef dependencies', function() {
			// Open bundle with xref table
			var openBundle = common.open_decoder( encoder1, ot, {
				'x/obj1': "yes-imported-1",
				"x/obj2": "yes-imported-2"
			});

			// Make sure xrefs are correct
			assert( openBundle.database['test/obj3'].propA == "yes-imported-1" );
			assert( openBundle.database['test/obj4'].propA == "yes-imported-2" );
		});

		it('should properly import the correct nested XRef dependencies', function() {

			// Open bundle with xref table
			delete db2['test/obj3']; delete db2['test/obj6'];
			var openBundle = common.open_decoder( encoder2, ot, db2);

			// Make sure xrefs are correct
			assert( openBundle.database['test/obj3'].propA.propA == obj1.propA );
			assert( openBundle.database['test/obj6'].propA.propA.propA == obj2.propA );
		});

		// Cleanup at the end
		after(function() {
			common.cleanup_encoder( encoder1 );
			common.cleanup_encoder( encoder2 );
		});

	});

	describe('Sparse Bundles', function () {

		// Create some objects
		var obj1 = new ObjectA(),
			obj2 = new ObjectB( 128, "some-string" ),
			obj3 = new ObjectC( 1024, 4.212E+40 );
			obj4 = new ObjectC( 31247123, 0.6764000058174133 );

		// Create a sparse encoder with few objects
		var encoder1 = common.open_encoder( ot, true );
		encoder1.encode( obj1, 'obj1' );
		encoder1.encode( obj2, 'obj2' );
		encoder1.encode( obj3, 'obj3' );
		encoder1.encode( obj4, 'obj4' );
		encoder1.close();

		// Load the sparse file
		var decoder1 = common.open_decoder_sparse( encoder1, ot );
		it_should_match( obj1, decoder1.database['test/obj1'], '[ObjectA]' );
		it_should_match( obj2, decoder1.database['test/obj2'], '[ObjectB( 128, "some-string" )]');
		it_should_match( obj3, decoder1.database['test/obj3'], '[ObjectC( 1024, 4.212E+40 )]');
		it_should_match( obj4, decoder1.database['test/obj4'], '[ObjectD( 31247123, 0.6764000058174133 )]' );

		// Cleanup at the end
		after(function() {
			common.cleanup_encoder( encoder1 );
		});

	});


});