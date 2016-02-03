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
 * Browser-tailored function for loading non-compiled bundles
 */
function loadBundle( url, profileLoader, callback ) {

	// Perform an XMLHttpRequest to get the specifications of the bundle specified
	var req = new XMLHttpRequest(),
		scope = this;

	// Place request
	req.open('GET', url);
	req.responseType = "text";
	req.send();

	// Wait until the bundle specifications are loaded
	req.onreadystatechange = function () {
		if (req.readyState !== 4) return;
		try {

			// Parse description
			var bundleSpec = JSON.parse(req.response);

			// Initialize profile loader
			profileLoader.initialize();

			// Load imports
			var imports = bundleSpec['imports']
			if (imports !== undefined) {
				for (var i=0; i<imports.length; i++) {

				}
			}

		} catch (e) {

			// Fire error callback
			if (callback) callback("Error parsing bundle "+url+": "+e.toString(), null);

		}
	}


};

/**
 * Export functions
 */
module.exports = {
	'load': loadBundle
};
