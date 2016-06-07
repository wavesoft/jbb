"use strict";
/**
 * JBB - Javascript Binary Bundles - Binary Decoder
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
 * A partial progress item
 */
var ProgressManagerPart = function(parent) {
	this.parent = parent;
	this.objectLookup = [];
	this.objects = [];
	this.value = 0;
};

/**
 * Update sub-object progress
 */
ProgressManagerPart.prototype.update = function( obj, progress, total ) {

	// Get/Create new object for tracking this object
	var id = this.objectLookup.indexOf(obj);
	if (id === -1) {
		id = this.objectLookup.length;
		this.objectLookup.push(obj);
		this.objects.push([ progress, total ])
	} else {
		this.objects[id][0] = progress;
		this.objects[id][1] = total;
	}

	// Update summary
	var prog=0, tot=0;
	for (var i=0; i<this.objects.length; i++) {
		prog += this.objects[i][0];
		tot += this.objects[i][1];
	}

	// Update value
	this.value = prog / tot;
	this.parent.update();

};

/**
 * Complete item progress
 */
ProgressManagerPart.prototype.complete = function() {
	this.value = 1;
	this.parent.update();

	// Remove me from parent
	var id = this.parent.parts.indexOf(this);
	if (id === -1) return;
	this.parent.parts.splice(id,1);
}

/**
 * Progress logic manager
 */
var ProgressManager = function() {

	/**
	 * Progress handlers
	 */
	this.handlers = [];

	/**
	 * Progress parts
	 */
	this.parts = [];

	/**
	 * Indicator if a progress is active
	 */
	this.active = false;

};

/**
 * Start managing a new part
 */
ProgressManager.prototype.part = function() {

	// Create and return new part
	var part = new ProgressManagerPart(this);
	this.parts.push(part);

	// Update
	this.update();

	// Return part
	return part;

};

/**
 * Update state and trigger callbacks
 */
ProgressManager.prototype.update = function() {

	// Calculate aggregated progress
	var progress = 0, eventID = 0;

	// No items means full progress 
	if (this.parts.length === 0) {
		progress = 1.0;
	} else {
		for (var i=0; i<this.parts.length; i++) {
			progress += this.parts[i].value;
		}
		progress /= this.parts.length;
	}


	// Check for start
	if (!this.active && (progress != 1.0)) {
		this.active = true;
		eventID = 1;

	// Check for complete
	} else if (this.active && (progress == 1.0)) {
		this.active = false;
		eventID = 2;

	}

	// Trigger update
	if (this.active || (eventID === 2)) {
		for (var i=0; i<this.handlers.length; i++) {
			this.handlers[i]( progress, eventID );
		}
	}

};

/**
 * Add a progress handler function
 */
ProgressManager.prototype.addHandler = function( fn ) {
	this.handlers.push(fn);
};

/**
 * Remove a progress handler function
 */
ProgressManager.prototype.removeHandler = function( fn ) {
	var id = this.handlers.indexOf(fn);
	if (id === -1) return;
	this.handlers.splice(id,1);
};

// Expose progress logic
module.exports = ProgressManager;
