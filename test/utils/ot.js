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
	this.objApropA = 125;
	this.objApropB = 65532;
	this.objApropC = "A string";
};
var ObjectB = function( propA, propB ) {
	this.objBpropA = propA;
	this.objBpropB = propB;
	this.objBpropC = new Uint16Array([ 1, 4, 120, 4123 ]);
};
var ObjectC = function( propA, propB ) {
	this.objCpropA = propA;
	this.objCpropB = propB;
	this.objCpropC = { 'some': { 'sub': 'object' } };
	this.objCpropD = "I am ignored :(";
};
var ObjectD = function() {
	this.objDpropA = 0;
	this.objDpropB = 1;
	this.objDpropC = "Not part of ObjectTable";
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
			instance, instance.objCpropA,
					  instance.objCpropB
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
		[ 'objApropA', 'objApropB', 'objApropC' ],
		[ 'objBpropA', 'objBpropB', 'objBpropC' ],
		[ 'objCpropA', 'objCpropB', 'objCpropC' ]
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
