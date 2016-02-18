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

var BinaryEncoder = require("../../encoder.js");
var BinaryLoader = require("../../decoder.js");
var temp = require("temp").track();
var fs   = require('fs');

/**
 * Read filename to buffer
 */
function readChunk( filename ) {
	// Read into buffer
	var file = fs.readFileSync(filename),
		u8 = new Uint8Array(file);
	// Return buffer
	return u8.buffer;
}

/**
 * Create a binary encoder pointing to a random file
 */
function open_encoder( ot, sparse ) {
	// Create a temporary file
	var tempName = temp.path({suffix: '.tmp'});

	// Create an encoder
	var encoder = new BinaryEncoder(tempName, {
		'name' 			: 'test',
		'log'			: 0,
		'object_table' 	: ot,
		'sparse'		: sparse || false
	});

	// Return encoder
	return encoder;
}

/**
 * Create a binary decoder to read something created with open_encoder
 */
function open_decoder( encoder, ot, db ) {
	// Read into buffer
	var file = fs.readFileSync(encoder.filename),
		u8 = new Uint8Array(file),
		buf = u8.buffer;

	// Create a decoder & Parse
	var decoder = new BinaryLoader( ot, db );
	decoder.addByBuffer(buf);
	decoder.load();

	// Rerturn
	return decoder;
}

/**
 * Create a binary decoder to read something created with open_encoder
 */
function open_decoder_sparse( encoder, ot, db ) {

	// Load chunk buffers
	var chunks = [
		readChunk( encoder.filename ),
		readChunk( encoder.filename.replace(".jbbp", "_b16.jbbp") ),
		readChunk( encoder.filename.replace(".jbbp", "_b32.jbbp") ),
		readChunk( encoder.filename.replace(".jbbp", "_b64.jbbp") )
	];

	// Create a decoder & Parse
	var decoder = new BinaryLoader( ot, db );
	decoder.addByBuffer( chunks );
	decoder.load();

	// Rerturn
	return decoder;
}

/**
 * Cleanup 
 */
function cleanup_encoder( encoder ) {

	// Remove bundle
	fs.unlink( encoder.filename );

	// Remove sparse bundle chunks
	if (encoder.filename.substr(encoder.filename.length-5) == ".jbbp") {
		fs.unlink( encoder.filename.replace(".jbbp", "_b16.jbbp") ),
		fs.unlink( encoder.filename.replace(".jbbp", "_b32.jbbp") ),
		fs.unlink( encoder.filename.replace(".jbbp", "_b64.jbbp") )
	}

}

/**
 * Load the buffer from 
 */
function open_encoder_buffer( encoder ) {

	// Check if this is sparse
	if (encoder.filename.substr(encoder.filename.length-5) == ".jbbp") {

		// Load chunk buffers
		return [
			readChunk( encoder.filename ),
			readChunk( encoder.filename.replace(".jbbp", "_b16.jbbp") ),
			readChunk( encoder.filename.replace(".jbbp", "_b32.jbbp") ),
			readChunk( encoder.filename.replace(".jbbp", "_b64.jbbp") )
		];

	} else {

		// Load entire bundle
		return [
			readChunk( encoder.filename )
		];

	}

}

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
	var tempName = temp.path({suffix: '.tmp'});

	// ===[ ENCODE ]=====================

	// Create an encoder
	var encoder = new BinaryEncoder(tempName, {
		'name' 			: 'test',
		'log'			: 0,
		'object_table' 	: ot
	});

	// Encode object
	encoder.encode( structure, 'test' );
	// Close
	encoder.close();

	// ===[ LOAD ]=======================
	// (Since XHRLoader does not work on node.js)

	// Read into buffer
	var file = fs.readFileSync(encoder.filename),
		u8 = new Uint8Array(file),
		buf = u8.buffer;

	// Remove bundle
	fs.unlink( encoder.filename );

	// ===[ DECODE ]=====================

	// Create a decoder & Parse
	var decoder = new BinaryLoader( ot );
	decoder.addByBuffer(buf);
	decoder.load();

	// Enable logging
	console.log = c_log;
	console.info = c_info;

	// Return decoded structure
	return decoder.database['test/test'];

}

// Export functions
var exports = module.exports = {
	'readChunk': readChunk,
	'encode_decode': encode_decode,
	'open_encoder': open_encoder,
	'open_decoder': open_decoder,
	'open_decoder_sparse': open_decoder_sparse,
	'open_encoder_buffer': open_encoder_buffer,
	'cleanup_encoder': cleanup_encoder,
};
module.exports.static = function(scope) {
	Object.keys(exports).forEach(function(key,index) {
		scope[key] = exports[key];
	});
};
