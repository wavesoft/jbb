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

var BinaryEncoder = require("../src/encoder.js");
var BinaryLoader = require("../src/decoder.js");
var temp = require("temp").track();
var fs   = require('fs');

/**
 * Perform encoding and decoding of the specified structure
 */
function encode_decode( structure, ot ) {

	// Disable logging
	var c_log = console.log,
		c_info = console.info;
	// console.log = function() {};
	// console.info = function() {};

	// Create a temporary file
	var tempName = temp.path({suffix: '.jbb.tmp'});

	// ===[ ENCODE ]=====================

	// Create an encoder
	var encoder = new BinaryEncoder(tempName, {
		'name' 			: 'test',
		'log'			: 0x3FFF,
		'object_table' 	: ot
	});

	// Encode object
	encoder.encode( structure, 'test' );
	// Close
	encoder.close();

	// ===[ LOAD ]=======================

	// Read into buffer
	var file = fs.readFileSync(tempName),
		u8 = new Uint8Array(file),
		buf = u8.buffer;

	// Remove bundle
	fs.unlink( tempName );

	// ===[ DECODE ]=====================

	// Create a decoder & Parse
	var decoder = new BinaryLoader( ot );
	decoder.loadBuffer(buf);
	decoder.parse();

	// Enable logging
	console.log = c_log;
	console.info = c_info;

	// Return decoded structure
	return decoder.database['test'];

}

/**
 * Check if two structures are equal
 */
function equals(a,b) {

	// Make sure both are of the same type
	if (typeof a != typeof b) {
		console.warn("EQUALS: Types mismatch!");
		return false;
	}

	// Check for simple cases
	switch (typeof a) {
		case 'undefined':
			return true;

		case 'string':
		case 'boolean':
			return a == b;

		case 'number':
			if ( (isNaN(a) && !isNaN(b)) || (!isNaN(a) && isNaN(b)) ) {
				return false;
			} else if (isNaN(a) && isNaN(b)) {
				return true;
			} else {
				return a == b;
			}

		case 'function':
			return true;

		case 'object':
			if (a.constructor !== b.constructor) {
				console.warn("EQUALS: Mismatching constructor!");
				return false;
			}

			// Check for array-like
			if (a['length'] !== undefined) {
				for (var i=0; i<a.length; i++) {
					if (!equals(a[i], b[i]))
						return false;
				}
				return true;
			} else {
				for (var k in a) {
					if (!equals(a[k], b[k]))
						return false;
				}
				return true;
			}

	}

}

/**
 * Test the encoding sanity of the specified structure
 */
function test_structure( struct, ot ) {

	// Encode/Decode and return resulting structure
	var ans_struct = encode_decode( struct, ot );

	// Return comparison results
	return equals( struct, ans_struct );

}

module.exports = {

	// Encode/Decode
	'encode_decode': encode_decode,

	// Check for equality of data structures
	'equals': equals,

	// Test the encoding/decoding of a structure
	'test_structure': test_structure,

};
