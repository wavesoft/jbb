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

var util   	= require('util');
var assert 	= require('assert');
var seed	= require('seed-random');
var compare = require('./compare');

require('./common').static(global);
require('../simple-profile/objects').static(global);

var EncodeProfile = require('../simple-profile/specs-encode');
var DecodeProfile = require('../simple-profile/specs-decode');

var random = seed('jbbtests');

////////////////////////////////////////////////////////////////
// Generator helpers
////////////////////////////////////////////////////////////////

/**
 * Sequential array generator
 */
function gen_array_seq( typeName, length, min, step ) {
	var arr = new global[typeName](length);
	for (var i=0, v=min; i<length; i++) {
		arr[i] = v;
		v+=step;
	}
	return arr;
}

/**
 * Random array generator
 */
function gen_array_rand( typeName, length, min, max ) {
	var arr = new global[typeName](length), range = max-min, v;
	var mid = (min + max) / 2;
	var smallest = Math.min(Math.abs(min), Math.abs(max)) % 1;
	var integers = (min % 1 === 0) && (max %1 === 0);
	// console.log(">> smallest ("+min+","+max+")=",smallest);
	for (var i=0; i<length; i++) {
		v = min + (random() * range);
		if (integers) v = Math.round(v);
		if (Math.abs(v % 1) < smallest) {
			// console.log("!!",v," < smallest");
			v = ( v < mid ) ? min : max;
		}
		arr[i] = v;
	}
	return arr;
}

/**
 * Repeated array generator
 */
function gen_array_rep( typeName, length, value ) {
	var arr = new global[typeName](length);
	for (var i=0; i<length; i++) {
		arr[i] = value;
	}
	return arr;
}

////////////////////////////////////////////////////////////////
// Meta matchinf unction
////////////////////////////////////////////////////////////////

/**
 * Match for type
 */
function match_metaType( matchType ) {
	return function(meta) {
		assert.equal( meta.type, matchType, 'expected types must match' );
	}
}

/**
 * Match for chunk type
 */
function match_chunkTypes( chunkTypes ) {
	return function(meta) {
		assert.equal( meta.type, 'array.primitive.chunked', 'array must be chunked' );
		assert.equal( meta.meta.chunks.length, chunkTypes.length, 'expected chunk count differ' );
		for (var i=0; i<meta.meta.chunks.length; i++) {
			assert.equal(
				meta.meta.chunks[i].type & chunkTypes[i][1],
				chunkTypes[i][0], 
				'mismatch chunk #'+i+' type: '+chunkTypes[i][0]+' (expected), '
				+(meta.meta.chunks[i].type & chunkTypes[i][1])+' (actual)'
			);
		}
	}
}

/**
 * Match for chunk type
 */
function match_rawArrayType( matchType ) {
	return function(meta) {
		assert.equal( meta.type, 'array.numeric.raw', 'array must be raw' );
		assert.equal( meta.meta.type, matchType, 'array types do not match' );
	}
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
		assert.deepEqual( a, b, "encoded and decoded values to not match" );
	});
}

/**
 * Accelerator function for checking exceptions
 */
function it_should_throw(primitive, repr, isCorrectException) {
	var text = repr || util.inspect(primitive,{'depth':0});
	it('should except when encoding `'+text+'`', function () {
		assert.throws(function() {
			var ans = encode_decode( primitive, EncodeProfile, DecodeProfile );
			assert(isNaN(ans) || (ans == undefined), 'encoder return an error after exception');
		}, isCorrectException)
	});
}

/**
 * Accelerator function for primitive checking
 */
function it_should_return(primitive, repr, metaMatchFn) {
	if (typeof repr === 'object') {
		metaMatchFn = repr;
		repr = undefined;
	}
	var text = repr || util.inspect(primitive,{'depth':0});
	it('should return `'+text+'`, as encoded', function () {
		var ans = encode_decode( primitive, EncodeProfile, DecodeProfile );
		if (typeof primitive == 'number') {
			if (isNaN(ans) && isNaN(primitive)) return;
			assert.equal( ans, primitive, 'encoded and decoded numbers to not match' );
		} else if (typeof primitive == 'object') {
			assert.deepEqual( ans, primitive, 'encoded and decoded objects to not match' );
			if (metaMatchFn) {
				if (!(metaMatchFn instanceof Array)) metaMatchFn = [metaMatchFn];
				for (var i=0; i<metaMatchFn.length; i++)
					metaMatchFn[i]( ans.__meta );
			}
		} else {
			assert.equal( ans, primitive, 'encoded and decoded primitives to not match' );
		}
	});
}

/**
 * Accelerator function for sequential array checking
 */
function it_should_return_array_seq( typeName, length, min, step, metaMatchFn ) {
	var array = gen_array_seq(typeName, length, min, step);
	it('should return `'+typeName+'('+length+') = ['+array[0]+'..'+array[array.length-1]+'/'+step+']`, as encoded', function () {
		var ans = encode_decode( array, EncodeProfile, DecodeProfile );
		// Perform strong type checks on typed arrays
		if (typeName != 'Array')
			assert.equal( array.constructor, ans.constructor );
		// Otherwise just check values
		assert.deepEqual( ans, array, "encoded and decoded arrays to not match" );
		if (metaMatchFn) {
			if (!(metaMatchFn instanceof Array)) metaMatchFn = [metaMatchFn];
			for (var i=0; i<metaMatchFn.length; i++)
				metaMatchFn[i]( ans.__meta );
		}
	});
}

/**
 * Accelerator function for sequential array checking
 */
function it_should_return_array_seq_almost( typeName, length, min, step, tollerance, metaMatchFn ) {
	var array = gen_array_seq(typeName, length, min, step);
	var config = {
		ignoreKeys: [],
		ignoreClasses: [],
		numericTollerance: tollerance
	};

	it('should return `'+typeName+'('+length+') = ['+array[0]+'..'+array[array.length-1]+'/'+step+'±'+tollerance+']`, as encoded', function () {
		var ans = encode_decode( array, EncodeProfile, DecodeProfile );
		// Perform strong type checks on typed arrays
		if (typeName != 'Array')
			assert.equal( array.constructor, ans.constructor );

		// Explicit deep equal comparison
		compare.explicitDeepEqual( ans, array, 
			"encoded and decoded arrays not within tollerance", config );

		// Check for meta-match function
		if (metaMatchFn) {
			if (!(metaMatchFn instanceof Array)) metaMatchFn = [metaMatchFn];
			for (var i=0; i<metaMatchFn.length; i++)
				metaMatchFn[i]( ans.__meta );
		}
	});
}

/**
 * Accelerator function for random array checking
 */
function it_should_return_array_rand( typeName, length, min, max, metaMatchFn ) {
	var array = gen_array_rand(typeName, length, min, max);
	it('should return `'+typeName+'('+length+') = [rand('+min+'..'+max+')]`, as encoded', function () {
		var ans = encode_decode( array, EncodeProfile, DecodeProfile );
		// Perform strong type checks on typed arrays
		if (typeName != 'Array')
			assert.equal( array.constructor, ans.constructor );
		// Otherwise just check values
		assert.strictDeepEqual( ans, array, "encoded and decoded arrays to not match" );
		if (metaMatchFn) {
			if (!(metaMatchFn instanceof Array)) metaMatchFn = [metaMatchFn];
			for (var i=0; i<metaMatchFn.length; i++)
				metaMatchFn[i]( ans.__meta );
		}
	});
}

/**
 * Accelerator function for repeared array checking
 */
function it_should_return_array_rep( typeName, length, value, metaMatchFn ) {
	var array = gen_array_rep(typeName, length, value);
	it('should return `'+typeName+'('+length+') = [... ('+util.inspect(value,{'depth':1})+' x '+length+') ...]`, as encoded', function () {
		var ans = encode_decode( array, EncodeProfile, DecodeProfile );
		// Perform strong type checks on typed arrays
		if (typeName != 'Array')
			assert.equal( array.constructor, ans.constructor );
		// Otherwise just check values
		assert.deepEqual( ans, array, "encoded and decoded arrays to not match" );
		if (metaMatchFn) {
			if (!(metaMatchFn instanceof Array)) metaMatchFn = [metaMatchFn];
			for (var i=0; i<metaMatchFn.length; i++)
				metaMatchFn[i]( ans.__meta );
		}

	});
}

// Export functions
var exports = module.exports = {
	'match_metaType': match_metaType,
	'match_chunkTypes': match_chunkTypes,
	'match_rawArrayType': match_rawArrayType,
	'gen_array_seq': gen_array_seq,
	'gen_array_rand': gen_array_rand,
	'gen_array_rep': gen_array_rep,
	'it_should_match': it_should_match,
	'it_should_throw': it_should_throw,
	'it_should_return': it_should_return,
	'it_should_return_array_seq': it_should_return_array_seq,
	'it_should_return_array_rand': it_should_return_array_rand,
	'it_should_return_array_rep': it_should_return_array_rep,
	'it_should_return_array_seq_almost': it_should_return_array_seq_almost,
};
module.exports.static = function(scope) {
	Object.keys(exports).forEach(function(key,index) {
		scope[key] = exports[key];
	});
};

