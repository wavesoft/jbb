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

	var _legacy = __webpack_require__(5);

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

	var ar_float = [];
	var ar_bigint = [];
	var ar_int = [];
	var ar_same = [];
	var ar_zero = [];

	for (var i = 0; i < 10000; i++) {
	  ar_float.push(i * 1024 * Math.random());
	  ar_int.push(1024 * Math.random() | 0);
	  ar_bigint.push(Math.round(0xFFFFFFFFFFFFFFF * Math.random()));
	  ar_zero.push(0);
	  ar_same.push(4.124512);
	}

	// ar_int[5000] = 3.14;

	// console.log('wat=', ArrayAnalyser.isFloat32( 3 ));
	// console.log('is=', ArrayAnalyser.isFloat32( 3.14 ));
	// console.log('isNot=', ArrayAnalyser.isFloat32( Math.PI ));

	// console.time('analyzeNumericArray [float 1x]');
	// console.log( ArrayAnalyser.analyzeNumericArray(ar_float) );
	// console.timeEnd('analyzeNumericArray [float 1x]');
	// console.time('analyzeNumericArray [int 1x]');
	// console.log( ArrayAnalyser.analyzeNumericArray(ar_int) );
	// console.timeEnd('analyzeNumericArray [int 1x]');
	// console.time('analyzeNumericArray [zero 1x]');
	// console.log( ArrayAnalyser.analyzeNumericArray(ar_zero) );
	// console.timeEnd('analyzeNumericArray [zero 1x]');
	// console.time('analyzeNumericArray [same 1x]');
	// console.log( ArrayAnalyser.analyzeNumericArray(ar_same) );
	// console.timeEnd('analyzeNumericArray [same 1x]');

	// console.time('benchmark');
	// var counter = 100000;
	// while (counter--) {
	//   ArrayAnalyser.analyzeNumericArrayX(ar_int);
	// };
	// console.timeEnd('benchmark');

	// console.time('getNumericArrayMinType');
	// var count16 = 100000;
	// var isFloat;
	// while (count16--) {
	//   ArrayAnalyser.getNumericArrayMinType(ar);
	// };
	// console.timeEnd('getNumericArrayMinType');

	// console.time('getNumericArrayMinType');
	// var count16 = 100000;
	// while (count16--) {
	//   ArrayAnalyser.getNumericArrayMinType(ar_float);
	// };
	// console.timeEnd('getNumericArrayMinType');

	console.time('analyzeNumericArray [float]');
	var count16 = 100000;
	while (count16--) {
	  _ArrayAnalyser2.default.analyzeNumericArray(ar_float);
	};
	console.timeEnd('analyzeNumericArray [float]');

	console.time('analyzeNumericArray [int]');
	var count16 = 100000;
	while (count16--) {
	  _ArrayAnalyser2.default.analyzeNumericArray(ar_int);
	};
	console.timeEnd('analyzeNumericArray [int]');

	console.time('analyzeNumericArray [bigint]');
	var count16 = 100000;
	while (count16--) {
	  _ArrayAnalyser2.default.analyzeNumericArray(ar_bigint);
	};
	console.timeEnd('analyzeNumericArray [bigint]');

	console.time('analyzeNumericArray [zero]');
	var count16 = 100000;
	while (count16--) {
	  _ArrayAnalyser2.default.analyzeNumericArray(ar_zero);
	};
	console.timeEnd('analyzeNumericArray [zero]');

	console.time('analyzeNumericArray [same]');
	var count16 = 100000;
	while (count16--) {
	  _ArrayAnalyser2.default.analyzeNumericArray(ar_same);
	};
	console.timeEnd('analyzeNumericArray [same]');

	// console.time('old_analyzeNumericArray');
	// var count16 = 100000;
	// var isFloat;
	// while (count16--) {
	//   analyzeNumericArray(ar_float, true);
	// };
	// console.timeEnd('old_analyzeNumericArray');

	// console.time('analyzeNumericArray(false)');
	// var count16 = 100000;
	// var isFloat;
	// while (count16--) {
	//   ArrayAnalyser.analyzeNumericArray(ar, false);
	// };
	// console.timeEnd('analyzeNumericArray(false)');


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

	var _NumericTypes = __webpack_require__(4);

	var _NumericTypes2 = _interopRequireDefault(_NumericTypes);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	/**
	 * Local helper to cast a value to 32-bit float
	 */
	var float32_value = new Float32Array(1);

	/**
	 * Result object used by the `analyzeNumericArray` function when analyzing
	 * the input data. Instead of using a plain object, creating a class actually
	 * helps the compiler optimize the object even further.
	 */

	var AnalysisResults = function () {

	  /**
	   * Analysis results constructor.
	   *
	   * @param {Number} value0 - The first value in the array
	   */
	  function AnalysisResults(value0) {
	    _classCallCheck(this, AnalysisResults);

	    this._prev = value0;
	    this._same = 1;

	    // Note: The 0.1 is used to make javascript engine assume this is a float
	    //       type and therefore do not de-optimize when it becomes float
	    //       during finalizing phase.
	    this.average = 0.1;

	    this.dmin = 0;
	    this.dmax = 0;
	    this.min = +value0;
	    this.max = +value0;
	    this.sameMax = 0;

	    this.isZero = false;
	    this.isSame = false;
	    this.isFloat = ArrayAnalyser.isFloat(value0);
	    this.isInt = !this.isFloat && value0 !== 0;
	    this.isMixed = false;
	  }

	  /**
	   * Finalize metrics by calculating average, isSame and isZero flags.
	   *
	   * @param {Number} itemCount - The number of items processed
	   */


	  _createClass(AnalysisResults, [{
	    key: 'finalize',
	    value: function finalize(itemCount) {
	      this.average = (this.average - 0.1) / itemCount;
	      this.isZero = !this.isInt && !this.isFloat;
	      this.isSame = this.sameMax === itemCount;
	    }
	  }]);

	  return AnalysisResults;
	}();

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
	    key: 'analyzeNumericArrayX',
	    value: function analyzeNumericArrayX(numericArray) {
	      var value0 = numericArray[0];
	      var result = {
	        min: value0,
	        max: value0,
	        delta: 0,
	        _prev: value0
	      };

	      for (var i = 1; i < numericArray.length; ++i) {
	        var value = numericArray[i];
	        var isInt = ArrayAnalyser.isFloat(value);

	        // Calculate bounds
	        if (value < result.min) result.min = value;
	        if (value > result.max) result.max = value;

	        // Absolute difference
	        var delta = Math.abs(value - result._prev);
	        if (delta > result.delta) {
	          result.delta = delta;
	        }

	        result._prev = value;
	      }

	      return result;
	    }

	    /**
	     * Optimised function to test if a number is float.
	     * It exploits a quirk for numbers smaller than 32-bit.
	     *
	     * @param {Number} number - The number to test
	     * @return {Boolean} Returns true if the number is float
	     */

	  }, {
	    key: 'isFloat',
	    value: function isFloat(number) {
	      if (number > 0x7FFFFFFF || number < -0x7FFFFFFE) {
	        return number % 1 !== 0;
	      } else {
	        return number !== (number | 0);
	      }
	    }

	    /**
	     * Test if the given float number fits in a 32-bit number representation.
	     * if not it's assumed to fit in 64-bit number.
	     *
	     * @param {Number} floatNumber - A float number to test
	     * @param {Number} [tollerance] - The acceptable difference between original and casted number
	     * @returns {Boolean} Returns true if the number can fit in 32-bits
	     */

	  }, {
	    key: 'isFloat32',
	    value: function isFloat32(floatNumber) {
	      var tollerance = arguments.length <= 1 || arguments[1] === undefined ? _NumericBounds2.default.FLOAT32_ACCEPTED_LOSS : arguments[1];

	      // Cast number info float32 and then read it back in order
	      // to calculate the loss value
	      float32_value[0] = floatNumber;

	      // If the loss is acceptable, assume we can use Float32 for representing it
	      return Math.abs(floatNumber - float32_value[0]) < tollerance;
	    }

	    /**
	     * Process the given numeric array and return it's metrics, including:
	     *
	     * - average : Average value
	     * - dmin    : Minimum difference between consecutive numbers
	     * - dmax    : Maximum difference between consecutive numbers
	     * - min     : Minimum value
	     * - max     : Maximum value
	     * - sameMax : The maximum number of consecutively same items encountered
	     * - isFloat : true if it contains at least 1 float number
	     * - isInt   : ture if all items are integer
	     * - isMixed : true if contains both float and integer items
	     * - isSame  : true if all items are the same
	     * - isZero  : true if all items are zero
	     *
	     * @param {Array} numericArray - A numeric array to process
	     * @returns {Object} The array metrics (see above for the fields)
	     */

	  }, {
	    key: 'analyzeNumericArray',
	    value: function analyzeNumericArray(numericArray) {
	      var itemCount = +numericArray.length;
	      var results = new AnalysisResults(numericArray[0]);

	      for (var i = 1; i < itemCount; ++i) {
	        var value = numericArray[i];

	        // Float/Integer/Mixed type detection
	        if (results.isMixed === false) {
	          // if (value !== (value|0)) {
	          if (ArrayAnalyser.isFloat(value)) {
	            results.isFloat = true;
	            results.isMixed = results.isInt;
	          } else {
	            if (!results.isInt && value !== 0) {
	              results.isInt = true;
	              results.isMixed = results.isFloat;
	            }
	          }
	        }

	        // Check for similarity
	        if (results._prev === value) {
	          ++results._same;
	        } else {
	          var same = results._same;
	          if (same > results.sameMax) {
	            results.sameMax = same;
	          }
	          results._same = 1;
	        }

	        // Update bounds
	        if (value < results.min) results.min = value;
	        if (value > results.max) results.max = value;

	        // Update delta bounds
	        var diff = value - results._prev;
	        if (diff < results.dmin) results.dmin = diff;
	        if (diff > results.dmax) results.dmax = diff;

	        // Update average
	        results.average += value;

	        // Keep track of previous value
	        // (This is faster than accessing the previous element of the array)
	        results._prev = value;
	      }

	      // Finalize and clean-up results
	      results.finalize(itemCount);
	      return results;
	    }

	    /**
	     * Get the minimum possible type that can hold the numerical values
	     * of all items in the given array.
	     *
	     *
	     */

	  }, {
	    key: 'getNumericArrayMinType',
	    value: function getNumericArrayMinType(numericArray) {
	      var type = _NumericTypes2.default.UNKNOWN;

	      for (var i = 0; i < numericArray.length; ++i) {
	        var value = numericArray[i];

	        // Check if this is a float, or if the float type needs to be upgraded
	        if (type === _NumericTypes2.default.FLOAT32 || value % 1 !== 0) {
	          if (!ArrayAnalyser.isFloat32(value)) return _NumericTypes2.default.FLOAT64;
	          type = _NumericTypes2.default.FLOAT32;
	          continue;
	        }

	        // Check if number is within bounds
	        if (type !== _NumericTypes2.default.UNKNOWN && value >= type.min && value <= type.max) {
	          continue;
	        }

	        // Check for type upgrade
	        for (var j = 0; j < type.upscale.length; ++j) {
	          var nextType = type.upscale[j];
	          if (value >= nextType.min && value <= nextType.max) {
	            type = nextType;
	            break;
	          }
	        }
	      }

	      return type;
	    }

	    /**
	     * @param {TypedArray} typedArray - The typed array to get the
	     */

	  }, {
	    key: 'getNumericType',
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

/***/ },
/* 4 */
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

	var _NumericBounds = __webpack_require__(3);

	var _NumericBounds2 = _interopRequireDefault(_NumericBounds);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	/**
	 * Shorthand to create an integer type object
	 *
	 * @param {Number} id - The encoded type ID
	 * @param {String} name - The encoded type ID
	 * @param {Boolean} signed - The number is signed
	 * @param {Number} min - The minimum number
	 * @param {Number} max - The maximum possible number
	 */
	function integerType(id, name) {
	  var signed = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];
	  var min = arguments.length <= 3 || arguments[3] === undefined ? -Infinity : arguments[3];
	  var max = arguments.length <= 4 || arguments[4] === undefined ? Infinity : arguments[4];

	  return {
	    id: id, signed: signed, min: min, max: max,
	    upscale: [],
	    toJSON: function toJSON() {
	      return name;
	    }
	  };
	}

	/**
	 * Constants specific to the JBB file format
	 */
	var NumericTypes = {

	  UINT8: integerType(0, 'UINT8', false, _NumericBounds2.default.UINT8_MIN, _NumericBounds2.default.UINT8_MAX),
	  INT8: integerType(1, 'INT8', false, _NumericBounds2.default.INT8_MIN, _NumericBounds2.default.INT8_MAX),
	  UINT16: integerType(2, 'UINT16', false, _NumericBounds2.default.UINT16_MIN, _NumericBounds2.default.UINT16_MAX),
	  INT16: integerType(3, 'INT16', false, _NumericBounds2.default.INT16_MIN, _NumericBounds2.default.INT16_MAX),
	  UINT32: integerType(4, 'UINT32', false, _NumericBounds2.default.UINT32_MIN, _NumericBounds2.default.UINT32_MAX),
	  INT32: integerType(5, 'INT32', false, _NumericBounds2.default.INT32_MIN, _NumericBounds2.default.INT32_MAX),
	  FLOAT32: integerType(6, 'FLOAT32', false),
	  FLOAT64: integerType(7, 'FLOAT64', false),

	  NUMERIC: integerType(8, 'NUMERIC'),
	  UNKNOWN: integerType(9, 'UNKNOWN'),
	  NAN: integerType(10, 'NAN')

	};

	/**
	 * Define upscaling candidates
	 */
	NumericTypes.UNKNOWN.upscale = [NumericTypes.UINT8, NumericTypes.INT8, NumericTypes.UINT16, NumericTypes.INT16, NumericTypes.UINT32, NumericTypes.INT32, NumericTypes.FLOAT32, NumericTypes.FLOAT64];

	NumericTypes.NUMERIC.upscale = [NumericTypes.UINT8, NumericTypes.INT8, NumericTypes.UINT16, NumericTypes.INT16, NumericTypes.UINT32, NumericTypes.INT32, NumericTypes.FLOAT32, NumericTypes.FLOAT64];

	NumericTypes.UINT8.upscale = [NumericTypes.INT8, NumericTypes.UINT16, NumericTypes.INT16, NumericTypes.UINT32, NumericTypes.INT32, NumericTypes.FLOAT64];

	NumericTypes.INT8.upscale = [NumericTypes.INT16, NumericTypes.INT32, NumericTypes.FLOAT64];

	NumericTypes.UINT16.upscale = [NumericTypes.INT16, NumericTypes.UINT32, NumericTypes.INT32, NumericTypes.FLOAT64];

	NumericTypes.INT16.upscale = [NumericTypes.INT32, NumericTypes.FLOAT64];

	NumericTypes.UINT32.upscale = [NumericTypes.INT32, NumericTypes.FLOAT64];

	NumericTypes.INT32.upscale = [NumericTypes.FLOAT64];

	exports.default = NumericTypes;

/***/ },
/* 5 */
/***/ function(module, exports) {

	"use strict";
	/**
	 * DELETE ME - DELETE ME - DELETE ME - DELETE ME - DELETE ME - DELETE ME
	 */

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.analyzeNumericArray = analyzeNumericArray;
	var FLOAT32_POS = 3.40282347e+38; // largest positive number in float32
	var FLOAT32_NEG = -3.40282346e+38; // largest negative number in float32
	var FLOAT32_SMALL = 1.175494350e-38; // smallest number in float32

	/* Note that all these values are exclusive, for positive test (ex v < UING8_MAX) */

	var UINT8_MAX = 256; // largest positive unsigned integer on 8-bit
	var UINT16_MAX = 65536; // largest positive unsigned integer on 16-bit
	var UINT32_MAX = 4294967296; // largest positive unsigned integer on 32-bit

	var INT8_MIN = -129; // largest negative signed integer on 8-bit
	var INT8_MAX = 128; // largest positive signed integer on 8-bit
	var INT16_MIN = -32769; // largest negative signed integer on 16-bit
	var INT16_MAX = 32768; // largest positive signed integer on 16-bit
	var INT32_MIN = -2147483649; // largest negative signed integer on 16-bit
	var INT32_MAX = 2147483648; // largest positive signed integer on 16-bit

	/* Version of binary bundle */

	var VERSION = 1 /* Major */ << 8 | 2 /* Minor */;

	/**
	 * If this constant is true, the packing functions will do sanity checks,
	 * which might increase the build time.
	 */
	var SAFE = 1;

	/**
	 * Numerical types
	 */
	var NUMTYPE = {
	  // For protocol use
	  UINT8: 0, INT8: 1,
	  UINT16: 2, INT16: 3,
	  UINT32: 4, INT32: 5,
	  FLOAT32: 6, FLOAT64: 7,
	  // For internal use
	  NUMERIC: 8, UNKNOWN: 9, NAN: 10
	};

	/**
	 * Numerical length types
	 */
	var NUMTYPE_LN = {
	  UINT16: 0,
	  UINT32: 1
	};
	var NUMTYPE_LEN = {
	  UINT8: 0,
	  UINT16: 1,
	  UINT32: 2,
	  FLOAT64: 3
	};

	/**
	 * Log flags
	 */
	var LOG = {
	  PRM: 0x0001, // Primitive messages
	  ARR: 0x0002, // Array messages
	  CHU: 0x0004, // Array Chunk
	  STR: 0x0008, // String buffer
	  IREF: 0x0010, // Internal reference
	  XREF: 0x0020, // External reference
	  OBJ: 0x0040, // Object messages
	  EMB: 0x0080, // Embedded resource
	  PLO: 0x0100, // Simple objects
	  BULK: 0x0200, // Bulk-encoded objects
	  SUMM: 0x2000, // Log summary
	  WRT: 0x4000, // Debug writes
	  PDBG: 0x8000 };

	/**
	 * Log prefix chunks
	 */
	var LOG_PREFIX_STR = {
	  0x0001: 'PRM',
	  0x0002: 'ARR',
	  0x0004: 'CHU',
	  0x0008: 'STR',
	  0x0010: 'IRF',
	  0x0020: 'XRF',
	  0x0040: 'OBJ',
	  0x0080: 'EMB',
	  0x0100: 'PLO',
	  0x0200: 'BLK',
	  0x2000: 'SUM',
	  0x8000: 'DBG'
	};

	/**
	 * Numerical type classes
	 */
	var NUMTYPE_CLASS = [Uint8Array, Int8Array, Uint16Array, Int16Array, Uint32Array, Int32Array, Float32Array, Float64Array];

	/**
	 * Downscaling numtype conversion table from/to
	 */
	var NUMTYPE_DOWNSCALE = {
	  FROM: [NUMTYPE.UINT16, NUMTYPE.INT16, NUMTYPE.UINT32, NUMTYPE.INT32, NUMTYPE.UINT32, NUMTYPE.INT32, NUMTYPE.FLOAT32, NUMTYPE.FLOAT32, NUMTYPE.FLOAT32, NUMTYPE.FLOAT32, NUMTYPE.FLOAT64, NUMTYPE.FLOAT64, NUMTYPE.FLOAT64, NUMTYPE.FLOAT64, NUMTYPE.FLOAT64],
	  TO: [NUMTYPE.UINT8, NUMTYPE.INT8, NUMTYPE.UINT8, NUMTYPE.INT8, NUMTYPE.UINT16, NUMTYPE.INT16, NUMTYPE.UINT8, NUMTYPE.INT8, NUMTYPE.UINT16, NUMTYPE.INT16, NUMTYPE.UINT8, NUMTYPE.INT8, NUMTYPE.UINT16, NUMTYPE.INT16, NUMTYPE.FLOAT32]
	};

	/**
	 * Delta-Encoding for integers
	 */
	var NUMTYPE_DELTA_INT = {
	  FROM: [NUMTYPE.UINT16, NUMTYPE.INT16, NUMTYPE.UINT32, NUMTYPE.INT32, NUMTYPE.UINT32, NUMTYPE.INT32],
	  TO: [NUMTYPE.INT8, NUMTYPE.INT8, NUMTYPE.INT8, NUMTYPE.INT8, NUMTYPE.INT16, NUMTYPE.INT16]
	};

	/**
	 * Delta-Encoding for floats
	 */
	var NUMTYPE_DELTA_FLOAT = {
	  FROM: [NUMTYPE.FLOAT32, NUMTYPE.FLOAT32, NUMTYPE.FLOAT64, NUMTYPE.FLOAT64],
	  TO: [NUMTYPE.INT8, NUMTYPE.INT16, NUMTYPE.INT8, NUMTYPE.INT16]
	};

	/**
	 * Delta encoding scale factor
	 */
	var DELTASCALE = {
	  S_001: 1, // Divide by 100 the value
	  S_1: 2, // Keep value as-is
	  S_R: 3, // Multiply by 127 on 8-bit and by 32768 on 16-bit
	  S_R00: 4 };

	/**
	 * Control Op-Codes
	 */
	var CTRL_OP = {
	  ATTRIB: 0x80, // Attribute
	  EXPORT: 0xF8, // External Export
	  EMBED: 0xF9 };

	/**
	 * Primitive Op-Codes
	 */
	var PRIM_OP = {
	  ARRAY: 0x00, // Array
	  OBJECT: 0x80, // Object / Plain Object [ID=0]
	  BUFFER: 0xC0, // Buffer
	  REF: 0xE0, // Internal Reference
	  NUMBER: 0xF0, // Number
	  SIMPLE: 0xF8, // Simple
	  SIMPLE_EX: 0xFC, // Extended simple primitive
	  IMPORT: 0xFE };

	/**
	 * Object Op-Codes
	 */
	var OBJ_OP = {
	  KNOWN_5: 0x00, // Known object (5-bit)
	  KNOWN_12: 0x20, // Known object (12-bit)
	  PLAIN_LOOKUP: 0x30, // A plain object from lookup table
	  PLAIN_NEW: 0x3F, // A new plain object that will define a lookup entry
	  PRIMITIVE: 0x38, // Primitive object
	  PRIM_DATE: 0x38
	};

	/**
	 * Primitive object op-codes
	 */
	var OBJ_PRIM = {
	  DATE: 0x00 };

	/**
	 * Array Op-Codes
	 */
	var ARR_OP = {
	  NUM_DWS: 0x00, // Downscaled Numeric Type
	  NUM_DELTA_INT: 0x20, // Delta-Encoded Integer Array
	  NUM_DELTA_FLOAT: 0x30, // Delta-Encoded Float Array
	  NUM_REPEATED: 0x40, // Repeated Numeric Value
	  NUM_RAW: 0x50, // Raw Numeric Value
	  NUM_SHORT: 0x60, // Short Numeric Value
	  PRIM_REPEATED: 0x68, // Repeated Primitive Value
	  PRIM_RAW: 0x6A, // Raw Primitive Array
	  PRIM_BULK_PLAIN: 0x6E, // Bulk Array of Plain Objects
	  PRIM_SHORT: 0x6F, // Short Primitive Array
	  PRIM_CHUNK: 0x78, // Chunked Primitive ARray
	  PRIM_BULK_KNOWN: 0x7C, // Bulk Array of Known Objects
	  EMPTY: 0x7E, // Empty Array
	  PRIM_CHUNK_END: 0x7F };

	/**
	 * Array chunk types
	 */
	var ARR_CHUNK = {
	  PRIMITIVES: 1, // Two or more primitives
	  REPEAT: 2, // Repeated of the same primitive
	  NUMERIC: 3, // A numeric TypedArray
	  BULK_PLAIN: 4, // A bulk of many plain objects
	  BULK_KNOWN: 5 };

	var _ARR_CHUNK = [undefined, 'PRIMITIVES', 'REPEAT', 'NUMERIC', 'BULK_PLAIN', 'BULK_KNOWN'];

	/**
	 * Simple primitives
	 */
	var PRIM_SIMPLE = {
	  UNDEFINED: 0,
	  NULL: 1,
	  FALSE: 2,
	  TRUE: 3
	};

	/**
	 * Extended simple primitives
	 */
	var PRIM_SIMPLE_EX = {
	  NAN: 0
	};

	/**
	 * Buffer primitive MIME Types
	 */
	var PRIM_BUFFER_TYPE = {
	  STRING_LATIN: 0,
	  STRING_UTF8: 1,
	  BUF_IMAGE: 2,
	  BUF_SCRIPT: 3,
	  BUF_AUDIO: 4,
	  BUF_VIDEO: 5,
	  RESOURCE: 7
	};

	/**
	 * BULK_KNOWN Array encoding operator codes
	 */
	var PRIM_BULK_KNOWN_OP = {
	  LREF_7: 0x00, // Local reference up to 7bit
	  LREF_11: 0xF0, // Local reference up to 11bit
	  LREF_16: 0xFE, // Local reference up to 16bit
	  IREF: 0xE0, // Internal reference up to 20bit
	  XREF: 0xFF, // External reference
	  DEFINE: 0x80, // Definition up to 5bit
	  REPEAT: 0xC0 };

	/**
	 * String representation of numerical type for debug messages
	 */
	var _NUMTYPE = ['UINT8', 'INT8', 'UINT16', 'INT16', 'UINT32', 'INT32', 'FLOAT32', 'FLOAT64', 'NUMERIC', 'UNKNOWN', 'NaN'];
	var _NUMTYPE_DOWNSCALE_DWS = ['UINT16 -> UINT8', 'INT16 -> INT8', 'UINT32 -> UINT8', 'INT32 -> INT8', 'UINT32 -> UINT16', 'INT32 -> INT16', 'FLOAT32 -> UINT8', 'FLOAT32 -> INT8', 'FLOAT32 -> UINT16', 'FLOAT32 -> INT16', 'FLOAT64 -> UINT8', 'FLOAT64 -> INT8', 'FLOAT64 -> UINT16', 'FLOAT64 -> INT16', 'FLOAT64 -> FLOAT32'];
	var _NUMTYPE_DOWNSCALE_DELTA_INT = ['UINT16 -> INT8', 'INT16 -> INT8', 'UINT32 -> INT8', 'INT32 -> INT8', 'UINT32 -> INT16', 'INT32 -> INT16'];
	var _NUMTYPE_DOWNSCALE_DELTA_FLOAT = ['FLOAT32 -> INT8', 'FLOAT32 -> INT16', 'FLOAT64 -> INT8', 'FLOAT64 -> INT16 '];

	/**
	 * Calculate and return the numerical type and the scale to
	 * apply to the float values given in order to minimize the error.
	 */
	function getFloatScale(values, min, max, error) {
	  var mid = (min + max) / 2,
	      range = mid - min,
	      norm_8 = range / INT8_MAX,
	      norm_16 = range / INT16_MAX,
	      ok_8 = true,
	      ok_16 = true,
	      er_8 = 0,
	      er_16 = 0,
	      v,
	      uv,
	      er;

	  // For the values given, check if 8-bit or 16-bit
	  // scaling brings smaller error value
	  for (var i = 0, l = values.length; i < l; ++i) {

	    // Test 8-bit scaling
	    if (ok_8) {
	      v = Math.round((values[i] - mid) / norm_8);
	      uv = v * norm_8 + mid;
	      er = (uv - v) / v;
	      if (er > er_8) er_8 = er;
	      if (er >= error) {
	        ok_8 = false;
	      }
	    }

	    // Test 16-bit scaling
	    if (ok_16) {
	      v = Math.round((values[i] - mid) / norm_16);
	      uv = v * norm_16 + mid;
	      er = (uv - v) / v;
	      if (er > er_16) er_16 = er;
	      if (er >= error) {
	        ok_16 = false;
	      }
	    }

	    if (!ok_8 && !ok_16) return [0, NUMTYPE.UNKNOWN];
	  }

	  // Pick most appropriate normalization factor
	  if (ok_8 && ok_16) {
	    if (er_8 < er_16) {
	      return [norm_8, NUMTYPE.INT8];
	    } else {
	      return [norm_16, NUMTYPE.INT16];
	    }
	  } else if (ok_8) {
	    return [norm_8, NUMTYPE.INT8];
	  } else if (ok_16) {
	    return [norm_16, NUMTYPE.INT16];
	  } else {
	    return [0, NUMTYPE.UNKNOWN];
	  }
	}

	/**
	 * Get the smallest possible numeric type fits this numberic bounds
	 *
	 * @param {number} vmin - The minimum number to check
	 * @param {number} vmax - The maximum number to check
	 * @param {boolean} is_float - Set to 'true' to assume that the numbers are float
	 * @return {NUMTYPE} - The numerical type to rerutn
	 */
	function getNumType(vmin, vmax, is_float) {
	  if (typeof vmin !== "number") return NUMTYPE.NAN;
	  if (typeof vmax !== "number") return NUMTYPE.NAN;
	  if (isNaN(vmin) || isNaN(vmax)) return NUMTYPE.NAN;

	  // If float, test only-floats
	  if (is_float) {

	    // Try to find smallest value for float32 minimum tests
	    var smallest;
	    if (vmin === 0) {
	      // vmin is 0, which makes vmax positive, so
	      // test vmax for smallest
	      smallest = vmax;
	    } else if (vmax === 0) {
	      // if vmax is 0, it makes vmin negative, which
	      // means we should test it's positive version
	      smallest = -vmax;
	    } else {
	      // if vmin is positive, both values are positive
	      // so get the smallest for small test (vmin)
	      if (vmin > 0) {
	        smallest = vmin;

	        // if vmax is negative, both values are negative
	        // so get the biggest for small test (vmax)
	      } else if (vmax < 0) {
	        smallest = -vmax;

	        // if vmin is negative and vmax positive, get the
	        // smallest of their absolute values
	      } else if (vmin < 0 && vmax > 0) {
	        smallest = -vmin;
	        if (vmax < smallest) smallest = vmax;
	      }
	    }

	    // Test if float number fits on 32 or 64 bits
	    if (vmin > FLOAT32_NEG && vmax < FLOAT32_POS && smallest > FLOAT32_SMALL) {
	      return NUMTYPE.FLOAT32;
	    } else {
	      return NUMTYPE.FLOAT64;
	    }
	  }

	  // If we have a negative value, switch to signed tests
	  if (vmax < 0 || vmin < 0) {

	    // Get absolute maximum of bound values
	    var amax = -vmin;
	    if (vmax < 0) {
	      if (-vmax > amax) amax = -vmax;
	    } else {
	      if (vmax > amax) amax = vmax;
	    }

	    // Test for integer bounds
	    if (amax < INT8_MAX) {
	      return NUMTYPE.INT8;
	    } else if (amax < INT16_MAX) {
	      return NUMTYPE.INT16;
	    } else if (amax < INT32_MAX) {
	      return NUMTYPE.INT32;
	    } else {
	      return NUMTYPE.FLOAT64;
	    }

	    // Otherwise perform unsigned tests
	  } else {

	    // Check for unsigned cases
	    if (vmax < UINT8_MAX) {
	      return NUMTYPE.UINT8;
	    } else if (vmax < UINT16_MAX) {
	      return NUMTYPE.UINT16;
	    } else if (vmax < UINT32_MAX) {
	      return NUMTYPE.UINT32;
	    } else {
	      return NUMTYPE.FLOAT64;
	    }
	  }
	}

	/**
	 * Analyze the specified numeric array and return analysis details
	 *
	 * @param {Array} v - The array to analyze
	 * @param {Boolean} include_costly - Include additional (costly) operations
	 * @return {object} - Return an object with the analysis results
	 */
	function analyzeNumericArray(v, include_costly) {
	  var min = v[0],
	      max = min,
	      is_int = false,
	      is_float = false,
	      is_same = true,
	      dmin = 0,
	      dmax = 0,
	      is_dfloat = false,
	      mean = 0,
	      n_type = 0,
	      d_mode = 0,
	      f_type = [0, NUMTYPE.UNKNOWN],
	      c_same = 0,
	      same = 0,
	      s_min = [min, min, min, min, min],
	      s_min_i = 0,
	      s_max = [min, min, min, min, min],
	      s_max_i = 0,
	      samples,
	      a,
	      b,
	      d_type,
	      cd,
	      cv,
	      lv = v[0];

	  // Anlyze array items
	  for (var i = 0, l = v.length; i < l; ++i) {
	    cv = v[i];

	    // Exit on non-numeric cases
	    if (typeof cv !== 'number') return null;

	    // Update mean
	    mean += cv;

	    // Include costly calculations if enabled
	    if (include_costly) {

	      // Update delta
	      if (i !== 0) {
	        cd = lv - cv;if (cd < 0) cd = -cd;
	        if (i === 1) {
	          dmin = cd;
	          dmax = cd;
	        } else {
	          if (cd < dmin) dmin = cd;
	          if (cd > dmax) dmax = cd;
	        }

	        // Check if delta is float
	        if (cd !== 0 && cd % 1 !== 0) is_dfloat = true;
	      }

	      // Update bounds & Keep samples
	      if (cv < min) {
	        min = cv;
	        s_min[s_min_i] = cv;
	        if (++s_min_i > 5) s_min_i = 0;
	      }
	      if (cv > max) {
	        max = cv;
	        s_max[s_max_i] = cv;
	        if (++s_max_i > 5) s_max_i = 0;
	      }
	    } else {

	      // Update bounds
	      if (cv < min) min = cv;
	      if (cv > max) max = cv;
	    }

	    // Check for same values
	    if (cv === lv) {
	      c_same++;
	    } else {
	      if (c_same > same) same = c_same;
	      is_same = false;
	      c_same = 0;
	    }

	    // Keep last value
	    lv = cv;

	    // Skip zeros from further analysis
	    if (cv === 0) continue;

	    // Update integer/float
	    if (cv % 1 !== 0) {
	      is_float = true;
	    } else {
	      is_int = true;
	    }
	  }

	  // Finalize counters
	  if (c_same > same) same = c_same;
	  mean /= v.length;

	  // Guess numerical type
	  n_type = getNumType(min, max, is_float);

	  // Calculate delta-encoding details
	  d_type = NUMTYPE.UNKNOWN;
	  if (include_costly) {
	    if (!is_float && is_int) {

	      // INTEGERS : Use Delta-Encoding (d_mode=1)

	      if (dmin > INT8_MIN && dmax < INT8_MAX) {
	        d_type = NUMTYPE.INT8;
	        d_mode = 1;
	      } else if (dmin > INT16_MIN && dmax < INT16_MAX) {
	        d_type = NUMTYPE.INT16;
	        d_mode = 1;
	      } else if (dmin > INT32_MIN && dmax < INT32_MAX) {
	        d_type = NUMTYPE.INT32;
	        d_mode = 1;
	      }
	    } else if (is_float) {

	      // FLOATS : Use Rebase Encoding (d_mode=2)

	      // Get a couple more samples
	      samples = [].concat(s_min, s_max, [v[Math.floor(Math.random() * v.length)], v[Math.floor(Math.random() * v.length)], v[Math.floor(Math.random() * v.length)], v[Math.floor(Math.random() * v.length)], v[Math.floor(Math.random() * v.length)]]);

	      // Calculate float scale
	      f_type = getFloatScale(v, min, max, 0.01);
	      if (f_type[1] != NUMTYPE.UNKNOWN) {
	        d_type = f_type[1];
	        d_mode = 2;
	      }
	    }
	  }

	  // Based on information detected so far, populate
	  // the analysis results
	  return {

	    // Get numeric type
	    'type': n_type,
	    'delta_type': d_type,

	    // Percentage of same items
	    'psame': same / v.length,

	    // Log numeric bounds
	    'min': min,
	    'max': max,
	    'mean': mean,

	    // Log delta bounds
	    'dmin': dmin,
	    'dmax': dmax,

	    // Delta mode
	    'dmode': d_mode,
	    'fscale': f_type[0],

	    // Expose information details
	    'integer': is_int && !is_float,
	    'float': is_float && !is_int,
	    'mixed': is_float && is_int,
	    'same': is_same && v.length > 1

	  };
	}

/***/ }
/******/ ]);