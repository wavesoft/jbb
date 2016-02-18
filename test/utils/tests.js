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

require('./common').static(global);
require('./ot').static(global);

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
	var mid = (min + max) / 2;
	var smallest = Math.min(Math.abs(min), Math.abs(max));
	for (var i=0; i<length; i++) {
		rarr[0] = (Math.random() * range) + min;
		arr[i] = rarr[0];
		if (Math.abs(arr[i]) < smallest)
			arr[i] = ( arr[i] < mid ) ? min : max;
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
			var ans = encode_decode( primitive, SimpleOT );
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
		var ans = encode_decode( primitive, SimpleOT );
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
		var ans = encode_decode( array, SimpleOT );
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
		var ans = encode_decode( array, SimpleOT );
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
		var ans = encode_decode( array, SimpleOT );
		// Perform strong type checks on typed arrays
		if (typeName != 'Array')
			assert.equal( array.constructor, ans.constructor );
		// Otherwise just check values
		assert.deepEqual( array, ans );
	});
}

// Export functions
var exports = module.exports = {
	'gen_array_seq': gen_array_seq,
	'gen_array_rand': gen_array_rand,
	'gen_array_rep': gen_array_rep,
	'it_should_match': it_should_match,
	'it_should_throw': it_should_throw,
	'it_should_return': it_should_return,
	'it_should_return_array_seq': it_should_return_array_seq,
	'it_should_return_array_rand': it_should_return_array_rand,
	'it_should_return_array_rep': it_should_return_array_rep,
};
module.exports.static = function(scope) {
	Object.keys(exports).forEach(function(key,index) {
		scope[key] = exports[key];
	});
};

