/* JBB Binary Bundle Loader - https://github.com/wavesoft/jbb */
var JBB = JBB || {}; JBB["BinaryLoader"] =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

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

	var _Header = __webpack_require__(1);

	var _Header2 = _interopRequireDefault(_Header);

	var _ArrayAnalyser = __webpack_require__(2);

	var _ArrayAnalyser2 = _interopRequireDefault(_ArrayAnalyser);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	// import BundleReader from './bundles/BundleReader';
	// import BundleWriter from './bundles/BundleWriter';

	// import WriteTypedBuffer from './buffers/WriteTypedBuffer';
	// import BufferedTypeWriter from './streams/BufferedTypeWriter';

	// class ClassAccess {
	//   constructor() {
	//     this.i = 0;
	//   }
	//   next() {
	//     return this.i++;
	//   }
	// }

	// function functionAccss() {
	//   var i = 0;
	//   return {
	//     next() {
	//       return i++;
	//     }
	//   }
	// }

	// console.time('classAccess');
	// var c1 = new ClassAccess();
	// while (c1.next() < 100000000) { };
	// console.timeEnd('classAccess');

	// console.time('functionAccss');
	// var c2 = functionAccss();
	// while (c2.next() < 100000000) { };
	// console.timeEnd('functionAccss');

	// var i8 = new TypeIndex(1);
	// var w8 = new BufferedTypeWriter( Uint8Array, i8 );

	// console.time('writeUint8');
	// var count8 = 100000000;
	// while (count8--) {
	//   w8.put( 0xBABA );
	// };
	// console.timeEnd('writeUint8');
	// console.log('Length:', w8.buffer.byteLength, '/ Actual:', w8.byteLength);

	// var i16 = new TypeIndex(2);
	// var w16 = new BufferedTypeWriter( Uint16Array, i16 );

	// console.time('writeUint16');
	// var count16 = 100000000;
	// while (count16--) {
	//   w16.put( 0xCACAD1D1 );
	// };
	// console.timeEnd('writeUint16');
	// console.log('Length:', w16.buffer.byteLength, '/ Actual:', w16.byteLength);

	// function test_16() {
	//   var buf = new WriteTypedBuffer(2);
	//   var view = buf.openView(Uint16Array);

	//   console.time('writeBuffer[16]');
	//   var count16 = 100000000;
	//   while (count16--) {
	//     view.put( 0xAABBCCDD );
	//   };
	//   console.timeEnd('writeBuffer[16]');
	//   console.log('Length:', buf.buffer.byteLength, '/ Actual:', buf.byteOffset);

	// }

	// test_16();

	console.log('wat=', _ArrayAnalyser2.default.isFloat32(3));
	console.log('is=', _ArrayAnalyser2.default.isFloat32(3.14));
	console.log('isNot=', _ArrayAnalyser2.default.isFloat32(Math.PI));

	console.time('isFloat32');
	var count16 = 100000000;
	var isFloat;
	while (count16--) {
	  // isFloat = ArrayAnalyser.isFloat32( 3.14159265 );
	};
	console.timeEnd('isFloat32');

	// export {
	//   BundleReader,
	//   BundleWriter
	// }

/***/ },
/* 1 */
/***/ function(module, exports) {

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

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var Header =

	/**
	 * Bare minimum header object. Additional fields might be introduced
	 * with different header versions.
	 */
	function Header() {
	  _classCallCheck(this, Header);

	  this.mime = 0;
	  this.version = 0;

	  // NOTE: Other fields might be present, look at `header_versions/*``
	};

	;

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

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

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	var _NumericBounds = __webpack_require__(3);

	var _NumericBounds2 = _interopRequireDefault(_NumericBounds);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	/**
	 * Local helper to cast a value to 32-bit float
	 */
	var float32_value = new Float32Array(1);

	/**e
	 * Analysis functions for detecting the nature of arrays and extracting
	 * useful information for optimized encoding.
	 *
	 * NOTE: Since we are going to receive any number of different function
	 *       arguments, we have separated the functions in smaller chunks in order
	 *       to benefit from the V8 type optimizer.
	 */

	var ArrayAnalyser = function () {
	  function ArrayAnalyser() {
	    _classCallCheck(this, ArrayAnalyser);
	  }

	  _createClass(ArrayAnalyser, null, [{
	    key: "isFloat32",


	    /**
	     * Test if the given float number fits in a 32-bit number representation.
	     * if not it's assumed to fit in 64-bit number.
	     */
	    value: function isFloat32(floatNumber) {
	      var loss = 0.0;

	      // Cast number info float32 and get the absolute of the difference
	      float32_value[0] = floatNumber;
	      loss = floatNumber - float32_value[0];
	      if (loss < 0) loss = -loss;

	      // If the loss is acceptable, assume it can fit on 32 bits
	      return loss < _NumericBounds2.default.FLOAT32_ACCEPTED_LOSS;
	    }

	    /**
	     * @param {TypedArray} typedArray - The typed array to get the
	     */

	  }, {
	    key: "getNumericType",
	    value: function getNumericType(typedArray) {}
	  }]);

	  return ArrayAnalyser;
	}();

	exports.default = ArrayAnalyser;

/***/ },
/* 3 */
/***/ function(module, exports) {

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

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	var NumericBounds = {

	  UINT8_MIN: 0,
	  UINT8_MAX: 256,
	  INT8_MIN: -129,
	  INT8_MAX: 128,

	  UINT16_MIN: 0,
	  UINT16_MAX: 65536,
	  INT16_MIN: -32769,
	  INT16_MAX: 32768,

	  UINT32_MIN: 0,
	  UINT32_MAX: 4294967296,
	  INT32_MIN: -2147483649,
	  INT32_MAX: 2147483648,

	  //
	  // A Float32 number can store approximately 7.225 decimal digits,
	  // therefore the minimum accepted loss must be within this range
	  //
	  FLOAT32_ACCEPTED_LOSS: 1.0E-7

	};

	exports.default = NumericBounds;

/***/ }
/******/ ]);