"use strict";
/**
 * JBB - Javascript Binary Bundles - Decoder Multi-Profile Drop-in replacement
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

/**
 * Encoder profile
 */
var DecodeProfile = function() {
	this.size = 0;
	this._lib = [];
	this._profiles = [];
	this._offset = 0;
	this._foffset = 0;
};

/**
 * Combine current profile with the given one
 */
DecodeProfile.prototype.add = function( profile ) {
	// Add in the library. They will be used
	// only when explicitly requested.
	this._lib.push( profile );
}

/**
 * From the profiles added, use the ones specified in the list,
 * in the order they were given.
 */
DecodeProfile.prototype.use = function( ids ) {

	// Pick the profiles of interest
	for (var i=0, l=ids.length; i<l; i++) {
		var profile = null, id = ids[i];

		// Find profile
		for (var j=0, ll=this._lib.length; j<ll; j++) {
			var p = this._lib[j];
			if (p.id === id) {
				profile = p;
				break;
			}
		}

		// Throw an exception if not found
		if (profile === null) {
			var pid = (id & 0xFFF0) >> 4, rev = id & 0xF;
			throw {
				'name' 		: 'DecodingError',
				'message'	: 'The bundle uses profile 0x'+pid.toString(16)+', rev '+rev+' but it was not loaded!',
				toString 	: function(){return this.name + ": " + this.message;}
			}
		}

		// Update size
		this.size += profile.size;

		// Keep profiles and bounds for fast segment lookup
		this._profiles.push([ profile, 
			this._foffset, this._foffset + profile.frequent,
			this._offset, this._offset + profile.size - profile.frequent ]);

		// Update offsets
		this._offset += profile.size - profile.frequent;
		this._foffset += profile.frequent;

	}

}

/**
 * Drop-in replacement for the profile decode function
 */
DecodeProfile.prototype.decode = function( eid ) {
	if (eid < 32) {
		for (var i=0, l=this._profiles.length; i<l; ++i) {
			var e = this._profiles[i], p = e[0], ofs = e[1], end = e[2];
			if ((eid >= ofs) && (eid < end))
				return p.decode( eid - ofs );
		}
	} else {
		eid -= 32;
		for (var i=0, l=this._profiles.length; i<l; ++i) {
			var e = this._profiles[i], p = e[0], ofs = e[3], end = e[4];
			if ((eid >= ofs) && (eid < end))
				return p.decode( eid - ofs + 32 );
		}
	}
};

// Export profile
module.exports = DecodeProfile;
