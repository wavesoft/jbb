"use strict";
/**
 * JBB - Javascript Binary Bundles - Encoder Multi-Profile Drop-in replacement
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

var Errors = require("./Errors");

/**
 * Encoder profile
 */
var EncodeProfile = function() {
	this.size = 0;
	this.id = 0;
	this.count = 0;
	this._profiles = [];
	this._ioffset = 0;
	this._foffset = 0;
};

/**
 * Combine current profile with the given one
 */
EncodeProfile.prototype.add = function( profile ) {

	// Update size
	this.size += profile.size;

	// Keep profiles and their offsets
	this._profiles.push([ this._ioffset, this._foffset, profile ]);
	this._ioffset += profile.size - profile.frequent;
	this._foffset += profile.frequent;

	// Keep the first ID
	if (this.id === 0)
		this.id = profile.id;

	// Test for overflow
	if (this._foffset > 31) {
		throw new Errors.AssertError("Exceeded maximum number of frequent profile items");
	}

	// Increment counter
	this.count++;

}

/**
 * Drop-in replacement for the profile encode function
 */
EncodeProfile.prototype.encode = function( entity ) {
	for (var i=0, l=this._profiles.length; i<l; ++i) {
		var e = this._profiles[i], p = e[2], o;

		// Try to encode & return correct entity ID
		o = p.encode( entity );
		if (o !== undefined) {
			if (o[0] < 32) {
				return [ o[0] + e[1], o[1] ]; // Add frequent offset
			} else {
				return [ o[0] + e[0], o[1] ]; // Add infrequent offset
			}
		}

	}
};


// Export profile
module.exports = EncodeProfile;
