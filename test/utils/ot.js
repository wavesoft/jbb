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
var SimpleOT = {
	'ID' 		: 0x1E51,
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

// Export modules
var exports = module.exports = {
	'ObjectA': ObjectA,
	'ObjectB': ObjectB,
	'ObjectC': ObjectC,
	'ObjectD': ObjectD,
	'SimpleOT': SimpleOT,
};
module.exports.static = function(scope) {
	Object.keys(exports).forEach(function(key,index) {
		scope[key] = exports[key];
	});
};
