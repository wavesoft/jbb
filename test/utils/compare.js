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

var assert 	= require('assert');

/**
 * assert.equal with deep comparion only on some objects 
 */
function explicitDeepEqual( actual, expected, message, config, path ) {
	var path = path || "object",
		config = config || {};
	if (typeof actual == "object") {
		for (var k in actual) {
			// Skip ignored keys and classes
			if (config.ignoreKeys.indexOf(k) >= 0) continue;
			for (var i=0; i<config.ignoreClasses.length; i++)
				if (actual[k] instanceof config.ignoreClasses[i])
					continue;
			// Deep comparison
			explicitDeepEqual( actual[k], expected[k], message, config, path+"["+k+"]" );
		}
	} else if (typeof actual == "number") {
		if (Math.abs(actual - expected) > config.numericTollerance) {
			assert.equal( actual, expected, path + ': ' + message );
		}
	} else {
		assert.equal( actual, expected, path + ' mismatch ' + message );
	}
}

// Export functions
var exports = module.exports = {
	'explicitDeepEqual': explicitDeepEqual,
};
module.exports.static = function(scope) {
	Object.keys(exports).forEach(function(key,index) {
		scope[key] = exports[key];
	});
};

