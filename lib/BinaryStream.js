"use strict";
/**
 * JBB - Javascript Binary Bundles - Binary Stream Class
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

var fs 			= require("fs");
var util		= require("util");

//////////////////////////////////////////////////////////////////
// Binary Stream
//////////////////////////////////////////////////////////////////

/**
 * Binary Stream
 */
var BinaryStream = function( filename, alignSize, logWrites ) {

	// Local properties
	this.offset = 0;
	this.blockSize = 1024 * 16;
	this.logWrites = logWrites;

	// Private properties
	this.__writeChunks = [];
	this.__syncOffset = 0;
	this.__fd = null;
	this.__alignSize = 0;

	// Initialize
	this.__alignSize = alignSize || 8;
	this.__fd = fs.openSync( filename, 'w+' );

}

/**
 * Prototype constructor
 */
BinaryStream.prototype = {

	'constructor': BinaryStream,

	/**
	 * Finalise and close stream
	 */
	'close': function() {
		// Close
		fs.closeSync( this.__fd );
	},

	/**
	 * Finalize the stream
	 */
	'finalize': function() {
		// Write alignment padding
		var alignOffset = this.offset % this.__alignSize;
		if (alignOffset > 0) 
			this.write( new Buffer(new Uint8Array( this.__alignSize - alignOffset )) );
		// Synchronize
		this.__sync( true );
	},

	/**
	 * Write a buffer using the compile function
	 */
	'write': function( buffer ) {
		if (this.logWrites) {
			var bits = String(this.__alignSize*8);
			if (bits.length === 1) bits=" "+bits;
			console.log((bits+"b ").yellow+("@"+this.offset/this.__alignSize).bold.yellow+": "+util.inspect(buffer));
		}
		this.__writeChunks.push( buffer );
		this.offset += buffer.length;
		this.__sync();
	},

	/**
	 * Write an array of buffers
	 */
	'writeMany': function( buffers ) {
		var bits;
		for (var i=0, bl=buffers.length; i<bl; ++i) {
			this.__writeChunks.push( buffers[i] );
			if (this.logWrites) {
				bits = String(this.__alignSize*8);
				if (bits.length === 1) bits=" "+bits;
				console.log((bits+"b ").yellow+("@"+this.offset/this.__alignSize).bold.yellow+": "+util.inspect(buffers[i]));
			}
			this.offset += buffers[i].length;
		}
		this.__sync();
	},

	/**
	 * Write a buffer at a particular offset, bypassing counters
	 */
	'writeAt': function( offset, buffer ) {
		if (this.logWrites) {
			var bits = String(this.__alignSize*8);
			if (bits.length === 1) bits=" "+bits;
			console.log((bits+"b ").yellowBG+("@"+offset).bold.yellowBG+": "+util.inspect(buffer));
		}

		// Write at the specified offset
		fs.writeSync( this.__fd, buffer, 0, buffer.length, offset );
	},

	/**
	 * Merge that stream with the current stream
	 */
	'merge': function( otherStream ) {
		var BLOCK_SIZE = this.blockSize,
			buffer = new Buffer( BLOCK_SIZE ),
			offset = 0, readBytes = 0;

		// Sync
		this.__sync( true );

		// console.log("THIS".magenta+" "+this.offset+" == "+this.__syncOffset);

		// Start iterating
		while (offset < otherStream.offset) {

			// Pick size of bytes to read
			readBytes = Math.min( BLOCK_SIZE, otherStream.offset - offset );

			// Read and write
			// console.log("MERGE".magenta+" from["+otherStream.__fd+"]="+offset+", to["+this.__fd+"]="+this.offset+", range="+readBytes);
			fs.readSync( otherStream.__fd, buffer, 0, readBytes, offset );
			fs.writeSync( this.__fd, buffer, 0, readBytes, this.offset );

			// Forward offsets
			offset += readBytes;
			this.offset += readBytes;
			this.__syncOffset += readBytes;

		}

	},

	/**
	 * Synchronize write chunks to the file
	 */
	'__sync': function( flush ) {
		var BLOCK_SIZE = this.blockSize;
		
		// Write chunks
		while (true) {
			// Proceeed only with enough data
			var dataLength = this.offset - this.__syncOffset;
			if (dataLength < BLOCK_SIZE) break;
		
			// Concat buffers
			var buf = Buffer.concat( this.__writeChunks );

			// Put buffer tail back so we always flush up to BLOCK_SIZE bytes
			this.__writeChunks = [];
			if (dataLength > BLOCK_SIZE) this.__writeChunks.push(buf.slice(BLOCK_SIZE));

			// Write buffer
			fs.writeSync( this.__fd, buf, 0, BLOCK_SIZE, this.__syncOffset );
			this.__syncOffset += BLOCK_SIZE;

			// Check if done
			if (this.__syncOffset >= this.offset) break;
		}

		// Flush remaining bytes if requested
		if (flush && (this.offset > this.__syncOffset)) {
			var buf = Buffer.concat( this.__writeChunks );
			this.__writeChunks = [];

			// Write whatever remains
			fs.writeSync( this.__fd, buf, 0, buf.length, this.__syncOffset );
			this.__syncOffset += buf.length;
		}

	},

}

// Export binary stream
module.exports = BinaryStream;
