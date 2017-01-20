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

	var _PrimitiveArray = __webpack_require__(2);

	var _PrimitiveArray2 = _interopRequireDefault(_PrimitiveArray);

	var _NumericArray = __webpack_require__(17);

	var _NumericArray2 = _interopRequireDefault(_NumericArray);

	var _legacy = __webpack_require__(20);

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

	// console.log('wat=', NumericArray.isFloat32( 3 ));
	// console.log('is=', NumericArray.isFloat32( 3.14 ));
	// console.log('isNot=', NumericArray.isFloat32( Math.PI ));

	// console.time('analyzeNumericArray [float 1x]');
	// console.log( NumericArray.analyzeNumericArray(ar_float) );
	// console.timeEnd('analyzeNumericArray [float 1x]');
	// console.time('analyzeNumericArray [int 1x]');
	// console.log( NumericArray.analyzeNumericArray(ar_int) );
	// console.timeEnd('analyzeNumericArray [int 1x]');
	// console.time('analyzeNumericArray [zero 1x]');
	// console.log( NumericArray.analyzeNumericArray(ar_zero) );
	// console.timeEnd('analyzeNumericArray [zero 1x]');
	// console.time('analyzeNumericArray [same 1x]');
	// console.log( NumericArray.analyzeNumericArray(ar_same) );
	// console.timeEnd('analyzeNumericArray [same 1x]');

	// console.time('benchmark');
	// var counter = 100000;
	// while (counter--) {
	//   NumericArray.analyzeNumericArrayX(ar_int);
	// };
	// console.timeEnd('benchmark');

	// console.time('getNumericArrayMinType');
	// var count16 = 100000;
	// var isFloat;
	// while (count16--) {
	//   NumericArray.getNumericArrayMinType(ar);
	// };
	// console.timeEnd('getNumericArrayMinType');

	// console.time('getNumericArrayMinType');
	// var count16 = 100000;
	// while (count16--) {
	//   NumericArray.getNumericArrayMinType(ar_float);
	// };
	// console.timeEnd('getNumericArrayMinType');

	console.time('analyzeNumericArray [float]');
	var count16 = 100000;
	while (count16--) {
	  _NumericArray2.default.analyzeNumericArray(ar_float);
	};
	console.timeEnd('analyzeNumericArray [float]');

	console.time('analyzeNumericArray [int]');
	var count16 = 100000;
	while (count16--) {
	  _NumericArray2.default.analyzeNumericArray(ar_int);
	};
	console.timeEnd('analyzeNumericArray [int]');

	console.time('analyzeNumericArray [bigint]');
	var count16 = 100000;
	while (count16--) {
	  _NumericArray2.default.analyzeNumericArray(ar_bigint);
	};
	console.timeEnd('analyzeNumericArray [bigint]');

	console.time('analyzeNumericArray [zero]');
	var count16 = 100000;
	while (count16--) {
	  _NumericArray2.default.analyzeNumericArray(ar_zero);
	};
	console.timeEnd('analyzeNumericArray [zero]');

	console.time('analyzeNumericArray [same]');
	var count16 = 100000;
	while (count16--) {
	  _NumericArray2.default.analyzeNumericArray(ar_same);
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
	//   NumericArray.analyzeNumericArray(ar, false);
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

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	var _deepEqual = __webpack_require__(3);

	var _deepEqual2 = _interopRequireDefault(_deepEqual);

	var _ObjectUtil = __webpack_require__(6);

	var _ObjectUtil2 = _interopRequireDefault(_ObjectUtil);

	var _EncodingContext = __webpack_require__(7);

	var _EncodingContext2 = _interopRequireDefault(_EncodingContext);

	var _NumericGroup = __webpack_require__(10);

	var _SmallPrimitiveGroup = __webpack_require__(13);

	var _KnownObjectGroup = __webpack_require__(14);

	var _KnownObjectGroup2 = _interopRequireDefault(_KnownObjectGroup);

	var _PlainObjectGroup = __webpack_require__(15);

	var _PlainObjectGroup2 = _interopRequireDefault(_PlainObjectGroup);

	var _SameGroup = __webpack_require__(16);

	var _SameGroup2 = _interopRequireDefault(_SameGroup);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var TYPE_SAME = 1;
	var TYPE_NUMERIC = 2;
	var TYPE_SMALL_PRIMITIVE = 3;
	var TYPE_PLAIN_OBJECTS = 4;
	var TYPE_KNOWN_OBJECTS = 5;
	var TYPE_PRIMITIVES = 6;

	var AnalysisGroup = function AnalysisGroup() {
	  _classCallCheck(this, AnalysisGroup);

	  this.first = 0;
	  this.length = 0;
	};

	var GroupFragment = function GroupFragment(analysisGroup, type) {
	  _classCallCheck(this, GroupFragment);

	  this.type = type;
	  this.first = analysisGroup.first;
	  this.length = analysisGroup.length;
	};

	/**
	 * Analysis functions for detecting the nature of primitive arrays and extracting
	 * useful information for optimized encoding.
	 */


	var PrimitiveArray = function () {
	  function PrimitiveArray() {
	    _classCallCheck(this, PrimitiveArray);
	  }

	  _createClass(PrimitiveArray, null, [{
	    key: 'analyzePrimitiveArray',
	    value: function analyzePrimitiveArray(primitiveArray) {
	      var encodingContext = arguments.length <= 1 || arguments[1] === undefined ? _EncodingContext2.default.DEFAULT : arguments[1];

	      var itemCount = Number(primitiveArray.length);
	      var obj_byval_comparision = encodingContext.options.obj_byval_comparision;
	      // let results = new PrimitiveAnalysisResults();

	      // Piority  #1 : Same
	      // Priority #2 : Numeric
	      // Priority #3 : Small Primitives
	      // Priority #4 : Plain Objects
	      // Priority #5 : Known Objects
	      // Priority #6 : Primitives

	      var group = {
	        same: new AnalysisGroup()
	      };

	      var groupSame = new AnalysisGroup();
	      var groupNumV = new AnalysisGroup();
	      var groupSPrm = new AnalysisGroup();
	      var groupPObj = new AnalysisGroup();
	      var groupKObj = new AnalysisGroup();
	      var groupPPrm = new AnalysisGroup();

	      var groups = [];

	      var ctx = {
	        value: undefined,
	        valueType: undefined,
	        signature: '',
	        knownObject: null,
	        lastValue: undefined,
	        lastValueType: undefined,
	        lastSignature: '',
	        lastKnownObject: null
	      };

	      var stateRepeated = undefined /* Unknown inline function newStates */;

	      // Pass every element trough the primitive groupping rules in order to
	      // chunk together primitives that can be optimally encoded.
	      for (var i = 0; i < itemCount; ++i) {
	        ctx.value = primitiveArray[i];
	        ctx.valueType = typeof value === 'undefined' ? 'undefined' : _typeof(value);

	        //
	        // [Repeated]
	        //
	        if (ctx.value === ctx.lastValue || ctx.lastValue === undefined || ctx.valueType === 'object' && obj_byval_comparision && (0, _deepEqual2.default)(ctx.value, ctx.lastValue)) {
	          if (stateRepeated.length === 0) stateRepeated.first = i;
	          ++stateRepeated.length;;
	        } else {
	          stateRepeated.length = 0;;
	        }

	        //
	        // [Numeric value]
	        //
	        if (ctx.valueType === 'number') {
	          if (groupNumV.length === 0) groupNumV.first = i;
	          ++groupNumV.length;
	        } else {

	          groupNumV.length = 0;
	        }

	        //
	        // [Small primitives value]
	        //
	        if (ctx.value === null || ctx.valueType === 'boolean' || ctx.valueType === 'undefined') {
	          if (groupSPrm.length === 0) groupSPrm.first = i;
	          ++groupSPrm.length;
	          /* advance_sprim */
	        } else {

	          /* reset_sprim */

	          groupSPrm.length = 0;
	        }

	        //
	        // [Known or plain objects]
	        //
	        if (ctx.valueType === 'object') {

	          ctx.knownObject = encodingContext.knownObjects.lookup(ctx.value);
	          if (ctx.knownObject) {

	            /* reset_plain */

	            if (ctx.lastKnownObject === null || ctx.lastKnownObject === ctx.knownObject) {

	              /* advance_known */

	            } else {

	                /* reset_known */
	                /* advance_known */

	              }
	          } else {

	            /* reset_known */

	            ctx.signature = Object.key(ctx.value);
	            if (ctx.lastSignature === null || ctx.lastSignature === ctx.signature) {

	              /* advance_plain */

	            } else {

	                /* reset_plain */
	                /* advance_plain */

	              }
	          }
	        } else {}

	          /* reset_known */
	          /* reset_plain */

	          //
	          // [Known object]
	          //
	        if (ctx.valueType === 'object' && (value = encodingContext.knownObjects.lookup(ctx.value)) !== null) {
	          if (groupSPrm.length === 0) groupSPrm.first = i;
	          ++groupSPrm.length;
	        } else {

	          groupSPrm.length = 0;
	        }

	        //
	        // [Plain object]
	        //
	        if (ctx.valueType === 'object' && (value = encodingContext.knownObjects.lookup(ctx.value)) !== null) {
	          if (groupSPrm.length === 0) groupSPrm.first = i;
	          ++groupSPrm.length;
	        } else {

	          groupSPrm.length = 0;
	        }

	        // Keep last value
	        ctx.lastValue = ctx.value;
	        ctx.lastValueType = ctx.valueType;
	        ctx.lastSignature = ctx.signature;
	        ctx.lastKnownObject = ctx.knownObject;
	      }

	      results.finalize(itemCount);
	      return results;
	    }
	  }]);

	  return PrimitiveArray;
	}();

	exports.default = PrimitiveArray;

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	var pSlice = Array.prototype.slice;
	var objectKeys = __webpack_require__(4);
	var isArguments = __webpack_require__(5);

	var deepEqual = module.exports = function (actual, expected, opts) {
	  if (!opts) opts = {};
	  // 7.1. All identical values are equivalent, as determined by ===.
	  if (actual === expected) {
	    return true;

	  } else if (actual instanceof Date && expected instanceof Date) {
	    return actual.getTime() === expected.getTime();

	  // 7.3. Other pairs that do not both pass typeof value == 'object',
	  // equivalence is determined by ==.
	  } else if (!actual || !expected || typeof actual != 'object' && typeof expected != 'object') {
	    return opts.strict ? actual === expected : actual == expected;

	  // 7.4. For all other Object pairs, including Array objects, equivalence is
	  // determined by having the same number of owned properties (as verified
	  // with Object.prototype.hasOwnProperty.call), the same set of keys
	  // (although not necessarily the same order), equivalent values for every
	  // corresponding key, and an identical 'prototype' property. Note: this
	  // accounts for both named and indexed properties on Arrays.
	  } else {
	    return objEquiv(actual, expected, opts);
	  }
	}

	function isUndefinedOrNull(value) {
	  return value === null || value === undefined;
	}

	function isBuffer (x) {
	  if (!x || typeof x !== 'object' || typeof x.length !== 'number') return false;
	  if (typeof x.copy !== 'function' || typeof x.slice !== 'function') {
	    return false;
	  }
	  if (x.length > 0 && typeof x[0] !== 'number') return false;
	  return true;
	}

	function objEquiv(a, b, opts) {
	  var i, key;
	  if (isUndefinedOrNull(a) || isUndefinedOrNull(b))
	    return false;
	  // an identical 'prototype' property.
	  if (a.prototype !== b.prototype) return false;
	  //~~~I've managed to break Object.keys through screwy arguments passing.
	  //   Converting to array solves the problem.
	  if (isArguments(a)) {
	    if (!isArguments(b)) {
	      return false;
	    }
	    a = pSlice.call(a);
	    b = pSlice.call(b);
	    return deepEqual(a, b, opts);
	  }
	  if (isBuffer(a)) {
	    if (!isBuffer(b)) {
	      return false;
	    }
	    if (a.length !== b.length) return false;
	    for (i = 0; i < a.length; i++) {
	      if (a[i] !== b[i]) return false;
	    }
	    return true;
	  }
	  try {
	    var ka = objectKeys(a),
	        kb = objectKeys(b);
	  } catch (e) {//happens when one is a string literal and the other isn't
	    return false;
	  }
	  // having the same number of owned properties (keys incorporates
	  // hasOwnProperty)
	  if (ka.length != kb.length)
	    return false;
	  //the same set of keys (although not necessarily the same order),
	  ka.sort();
	  kb.sort();
	  //~~~cheap key test
	  for (i = ka.length - 1; i >= 0; i--) {
	    if (ka[i] != kb[i])
	      return false;
	  }
	  //equivalent values for every corresponding key, and
	  //~~~possibly expensive deep test
	  for (i = ka.length - 1; i >= 0; i--) {
	    key = ka[i];
	    if (!deepEqual(a[key], b[key], opts)) return false;
	  }
	  return typeof a === typeof b;
	}


/***/ },
/* 4 */
/***/ function(module, exports) {

	exports = module.exports = typeof Object.keys === 'function'
	  ? Object.keys : shim;

	exports.shim = shim;
	function shim (obj) {
	  var keys = [];
	  for (var key in obj) keys.push(key);
	  return keys;
	}


/***/ },
/* 5 */
/***/ function(module, exports) {

	var supportsArgumentsClass = (function(){
	  return Object.prototype.toString.call(arguments)
	})() == '[object Arguments]';

	exports = module.exports = supportsArgumentsClass ? supported : unsupported;

	exports.supported = supported;
	function supported(object) {
	  return Object.prototype.toString.call(object) == '[object Arguments]';
	};

	exports.unsupported = unsupported;
	function unsupported(object){
	  return object &&
	    typeof object == 'object' &&
	    typeof object.length == 'number' &&
	    Object.prototype.hasOwnProperty.call(object, 'callee') &&
	    !Object.prototype.propertyIsEnumerable.call(object, 'callee') ||
	    false;
	};


/***/ },
/* 6 */
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

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var ObjectSignature = function ObjectSignature() {
	  _classCallCheck(this, ObjectSignature);

	  this.keyIndex = {};
	};

	;

	/**
	 * Object-related utilities
	 */

	var ObjectUtil = function () {
	  function ObjectUtil() {
	    _classCallCheck(this, ObjectUtil);
	  }

	  _createClass(ObjectUtil, [{
	    key: "getSignature",
	    value: function getSignature(object) {}
	  }]);

	  return ObjectUtil;
	}();

	exports.default = ObjectUtil;

/***/ },
/* 7 */
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

	var _KnownObjects = __webpack_require__(8);

	var _KnownObjects2 = _interopRequireDefault(_KnownObjects);

	var _NumericBounds = __webpack_require__(9);

	var _NumericBounds2 = _interopRequireDefault(_NumericBounds);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	/**
	 * The context available to all encoding functions during encoding phase
	 */
	var EncodingContext = function () {
	  _createClass(EncodingContext, null, [{
	    key: 'DEFAULT',


	    /**
	     * Default encoding context
	     */
	    get: function get() {
	      return DEFAULT_INST;
	    }
	  }]);

	  /**
	   * Encoding context constructor
	   */
	  function EncodingContext() {
	    _classCallCheck(this, EncodingContext);

	    this.options = {
	      obj_byval_comparision: true,
	      num_float_tollerance: _NumericBounds2.default.FLOAT32_ACCEPTED_LOSS
	    };

	    this.knownObjects = new _KnownObjects2.default();
	  }

	  return EncodingContext;
	}();

	/**
	 * Create a singleton, used with the default encoding context
	 */


	exports.default = EncodingContext;
	var DEFAULT_INST = new EncodingContext();

/***/ },
/* 8 */
/***/ function(module, exports) {

	"use strict";
	/**
	 * JBB - Javascript Binary Bundles - Known Objects Utilities
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
	 * The shared known object information
	 */

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var KnownObjects = function () {

	  /**
	   * Table of known objects
	   */
	  function KnownObjects() {
	    _classCallCheck(this, KnownObjects);
	  }

	  /**
	   *
	   */


	  _createClass(KnownObjects, [{
	    key: "lookup",
	    value: function lookup(object) {
	      return 0;
	    }
	  }]);

	  return KnownObjects;
	}();

	exports.default = KnownObjects;

/***/ },
/* 9 */
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
/* 10 */
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
	exports.NumericGroup = exports.NumericChunk = undefined;

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	var _Group2 = __webpack_require__(11);

	var _Group3 = _interopRequireDefault(_Group2);

	var _Chunk2 = __webpack_require__(12);

	var _Chunk3 = _interopRequireDefault(_Chunk2);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

	var NumericChunk = exports.NumericChunk = function (_Chunk) {
	  _inherits(NumericChunk, _Chunk);

	  function NumericChunk() {
	    _classCallCheck(this, NumericChunk);

	    return _possibleConstructorReturn(this, (NumericChunk.__proto__ || Object.getPrototypeOf(NumericChunk)).call(this));
	  }

	  return NumericChunk;
	}(_Chunk3.default);

	/**
	 * A primitive group is an array of primitives that share some common
	 * optimization property.
	 *
	 * This is the base class without any functionality. Each individual group
	 * should implement it accordingly.
	 */


	var NumericGroup = exports.NumericGroup = function (_Group) {
	  _inherits(NumericGroup, _Group);

	  function NumericGroup() {
	    _classCallCheck(this, NumericGroup);

	    var _this2 = _possibleConstructorReturn(this, (NumericGroup.__proto__ || Object.getPrototypeOf(NumericGroup)).call(this));

	    _this2.startIndex = -1;
	    _this2.endIndex = -1;
	    return _this2;
	  }

	  _createClass(NumericGroup, [{
	    key: 'isValueEndingChunk',
	    value: function isValueEndingChunk(value, index) {
	      if (typeof value === 'number') {
	        if (this.startIndex === -1) {
	          this.startIndex = index;
	        }
	        this.endIndex = index;
	        return false;
	      } else if (this.startIndex !== -1) {
	        return true;
	      }
	    }
	  }, {
	    key: 'isActive',
	    value: function isActive(index) {
	      return this.startIndex !== -1;
	    }
	  }, {
	    key: 'getChunk',
	    value: function getChunk() {
	      return new NumericChunk(this.startIndex, this.endIndex);
	    }
	  }]);

	  return NumericGroup;
	}(_Group3.default);

/***/ },
/* 11 */
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

	/**
	 * A primitive group is an array of primitives that share some common
	 * optimization property.
	 *
	 * This is the base class without any functionality. Each individual group
	 * should implement it accordingly.
	 */

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var Group = function () {
	  function Group() {
	    _classCallCheck(this, Group);
	  }

	  _createClass(Group, [{
	    key: "isValueEndingChunk",
	    value: function isValueEndingChunk(value, index) {
	      return false;
	    }
	  }, {
	    key: "isActive",
	    value: function isActive(index) {
	      return false;
	    }
	  }, {
	    key: "getChunk",
	    value: function getChunk() {
	      return {};
	    }
	  }]);

	  return Group;
	}();

	exports.default = Group;

/***/ },
/* 12 */
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

	/**
	 * A chunk used by the primitive array analyser
	 */

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var Chunk = function Chunk() {
	  _classCallCheck(this, Chunk);
	};

	exports.default = Chunk;

/***/ },
/* 13 */
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
	exports.SmallPrimitiveGroup = exports.SmallPrimitiveChunk = undefined;

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	var _Group2 = __webpack_require__(11);

	var _Group3 = _interopRequireDefault(_Group2);

	var _Chunk2 = __webpack_require__(12);

	var _Chunk3 = _interopRequireDefault(_Chunk2);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

	var SmallPrimitiveChunk = exports.SmallPrimitiveChunk = function (_Chunk) {
	  _inherits(SmallPrimitiveChunk, _Chunk);

	  function SmallPrimitiveChunk() {
	    _classCallCheck(this, SmallPrimitiveChunk);

	    return _possibleConstructorReturn(this, (SmallPrimitiveChunk.__proto__ || Object.getPrototypeOf(SmallPrimitiveChunk)).call(this));
	  }

	  return SmallPrimitiveChunk;
	}(_Chunk3.default);

	/**
	 * A small primitive group (true, false, undefined, null) that can pack
	 * consecutive items in a much tighter space, using 2 bits per entry.
	 */


	var SmallPrimitiveGroup = exports.SmallPrimitiveGroup = function (_Group) {
	  _inherits(SmallPrimitiveGroup, _Group);

	  function SmallPrimitiveGroup() {
	    _classCallCheck(this, SmallPrimitiveGroup);

	    return _possibleConstructorReturn(this, (SmallPrimitiveGroup.__proto__ || Object.getPrototypeOf(SmallPrimitiveGroup)).call(this));
	  }

	  _createClass(SmallPrimitiveGroup, [{
	    key: 'isValueEndingChunk',
	    value: function isValueEndingChunk(value, index) {
	      return true;
	    }
	  }, {
	    key: 'isActive',
	    value: function isActive(index) {
	      return false;
	    }
	  }, {
	    key: 'getChunk',
	    value: function getChunk() {
	      return new SmallPrimitiveChunk(0, 0);
	    }
	  }]);

	  return SmallPrimitiveGroup;
	}(_Group3.default);

/***/ },
/* 14 */
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

	var _Group2 = __webpack_require__(11);

	var _Group3 = _interopRequireDefault(_Group2);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

	/**
	 *
	 */
	var KnownObjectGroup = function (_Group) {
	  _inherits(KnownObjectGroup, _Group);

	  function KnownObjectGroup() {
	    _classCallCheck(this, KnownObjectGroup);

	    return _possibleConstructorReturn(this, (KnownObjectGroup.__proto__ || Object.getPrototypeOf(KnownObjectGroup)).call(this));
	  }

	  _createClass(KnownObjectGroup, [{
	    key: "isValueEndingChunk",
	    value: function isValueEndingChunk(value, index) {
	      return false;
	    }
	  }, {
	    key: "isActive",
	    value: function isActive(index) {
	      return false;
	    }
	  }, {
	    key: "getChunk",
	    value: function getChunk() {
	      return {};
	    }
	  }]);

	  return KnownObjectGroup;
	}(_Group3.default);

	exports.default = KnownObjectGroup;

/***/ },
/* 15 */
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

	var _Group2 = __webpack_require__(11);

	var _Group3 = _interopRequireDefault(_Group2);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

	/**
	 *
	 */
	var PlainObjectGroup = function (_Group) {
	  _inherits(PlainObjectGroup, _Group);

	  function PlainObjectGroup() {
	    _classCallCheck(this, PlainObjectGroup);

	    return _possibleConstructorReturn(this, (PlainObjectGroup.__proto__ || Object.getPrototypeOf(PlainObjectGroup)).call(this));
	  }

	  _createClass(PlainObjectGroup, [{
	    key: "isValueEndingChunk",
	    value: function isValueEndingChunk(value, index) {
	      return false;
	    }
	  }, {
	    key: "isActive",
	    value: function isActive(index) {
	      return false;
	    }
	  }, {
	    key: "getChunk",
	    value: function getChunk() {
	      return {};
	    }
	  }]);

	  return PlainObjectGroup;
	}(_Group3.default);

	exports.default = PlainObjectGroup;

/***/ },
/* 16 */
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

	var _Group2 = __webpack_require__(11);

	var _Group3 = _interopRequireDefault(_Group2);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

	/**
	 *
	 */
	var SameGroup = function (_Group) {
	  _inherits(SameGroup, _Group);

	  function SameGroup() {
	    _classCallCheck(this, SameGroup);

	    return _possibleConstructorReturn(this, (SameGroup.__proto__ || Object.getPrototypeOf(SameGroup)).call(this));
	  }

	  _createClass(SameGroup, [{
	    key: "isValueEndingChunk",
	    value: function isValueEndingChunk(value, index) {
	      return false;
	    }
	  }, {
	    key: "isActive",
	    value: function isActive(index) {
	      return false;
	    }
	  }, {
	    key: "getChunk",
	    value: function getChunk() {
	      return {};
	    }
	  }]);

	  return SameGroup;
	}(_Group3.default);

	exports.default = SameGroup;

/***/ },
/* 17 */
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

	var _EncodingContext = __webpack_require__(7);

	var _EncodingContext2 = _interopRequireDefault(_EncodingContext);

	var _NumericTypes = __webpack_require__(18);

	var _NumericTypes2 = _interopRequireDefault(_NumericTypes);

	var _NumberUtil = __webpack_require__(19);

	var _NumberUtil2 = _interopRequireDefault(_NumberUtil);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	/**
	 * Result object used by the `analyzeNumericArray` function when analyzing
	 * the input data. Instead of using a plain object, creating a class actually
	 * helps the compiler optimize the object even further.
	 */
	var NumericAnalysisResults = function () {

	  /**
	   * Analysis results constructor.
	   *
	   * @param {Number} value0 - The first value in the array
	   */
	  function NumericAnalysisResults(value0) {
	    _classCallCheck(this, NumericAnalysisResults);

	    this._prev = value0;
	    this._same = 1;

	    // Note: The 0.1 is used to make javascript engine assume this is a float
	    //       type and therefore do not de-optimize when it becomes float
	    //       during finalizing phase.
	    this.average = value0 + 0.1;

	    this.dmin = Infinity;
	    this.dmax = -Infinity;
	    this.min = +value0;
	    this.max = +value0;
	    this.sameMax = 0;

	    this.isZero = false;
	    this.isSame = false;
	    this.isFloat = _NumberUtil2.default.isFloat(value0);
	    this.isInt = !this.isFloat && value0 !== 0;
	    this.isMixed = false;
	  }

	  /**
	   * Finalize metrics by calculating average, isSame and isZero flags.
	   *
	   * @param {Number} itemCount - The number of items processed
	   */


	  _createClass(NumericAnalysisResults, [{
	    key: 'finalize',
	    value: function finalize(itemCount) {
	      this.sameMax = this._same > this.sameMax ? this._same : this.sameMax;
	      this.average = (this.average - 0.1) / itemCount;
	      this.isZero = !this.isInt && !this.isFloat;
	      this.isSame = this.sameMax === itemCount;
	    }
	  }]);

	  return NumericAnalysisResults;
	}();

	/**
	 * Analysis functions for detecting the nature of numeric arrays and extracting
	 * useful information for optimized encoding.
	 *
	 * NOTE: Since we are going to receive any number of different function
	 *       arguments, we have separated the functions in smaller chunks in order
	 *       to benefit from the V8 type optimizer.
	 */


	var NumericArray = function () {
	  function NumericArray() {
	    _classCallCheck(this, NumericArray);
	  }

	  _createClass(NumericArray, null, [{
	    key: 'analyzeNumericArray',


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
	    value: function analyzeNumericArray(numericArray) {
	      var itemCount = Number(numericArray.length);
	      var results = new NumericAnalysisResults(numericArray[0]);

	      for (var i = 1; i < itemCount; ++i) {
	        var value = numericArray[i];

	        // Float/Integer/Mixed type detection
	        if (results.isMixed === false) {
	          if (_NumberUtil2.default.isFloat(value)) {
	            results.isFloat = true;
	            results.isMixed = results.isInt;
	          } else {
	            if (results.isInt === false && value !== 0) {
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
	     * @param {EncodingContext} encodingContext - The current encoding context
	     */

	  }, {
	    key: 'getNumericArrayMinType',
	    value: function getNumericArrayMinType(numericArray) {
	      var encodingContext = arguments.length <= 1 || arguments[1] === undefined ? _EncodingContext2.default.DEFAULT : arguments[1];

	      var tollerance = encodingContext.options.num_float_tollerance;
	      var type = _NumericTypes2.default.UNKNOWN;

	      for (var i = 0; i < numericArray.length; ++i) {
	        var value = numericArray[i];

	        // Check if this is a float, or if the float type needs to be upgraded
	        if (type === _NumericTypes2.default.FLOAT32 || value % 1 !== 0) {
	          if (!_NumberUtil2.default.isFloat32(value, tollerance)) return _NumericTypes2.default.FLOAT64;
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
	  }]);

	  return NumericArray;
	}();

	exports.default = NumericArray;

/***/ },
/* 18 */
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

	var _NumericBounds = __webpack_require__(9);

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
/* 19 */
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

	var _NumericBounds = __webpack_require__(9);

	var _NumericBounds2 = _interopRequireDefault(_NumericBounds);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	/**
	 * Local helper to cast a value to 32-bit float
	 */
	var float32_value = new Float32Array(1);

	/**
	 * Number-related utilities
	 */

	var NumberUtil = function () {
	  function NumberUtil() {
	    _classCallCheck(this, NumberUtil);
	  }

	  _createClass(NumberUtil, null, [{
	    key: "isFloat",


	    /**
	     * Optimised function to test if a number is float.
	     * It exploits a quirk for numbers smaller than 32-bit.
	     *
	     * @param {Number} number - The number to test
	     * @return {Boolean} Returns true if the number is float
	     */
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
	    key: "isFloat32",
	    value: function isFloat32(floatNumber) {
	      var tollerance = arguments.length <= 1 || arguments[1] === undefined ? _NumericBounds2.default.FLOAT32_ACCEPTED_LOSS : arguments[1];

	      // Cast number info float32 and then read it back in order
	      // to calculate the loss value
	      float32_value[0] = floatNumber;

	      // If the loss is acceptable, assume we can use Float32 for representing it
	      return Math.abs(floatNumber - float32_value[0]) < tollerance;
	    }
	  }]);

	  return NumberUtil;
	}();

	exports.default = NumberUtil;

/***/ },
/* 20 */
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