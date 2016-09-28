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

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.BundleWriter = exports.BundleReader = undefined;

	var _BundleReader = __webpack_require__(1);

	var _BundleReader2 = _interopRequireDefault(_BundleReader);

	var _BundleWriter = __webpack_require__(2);

	var _BundleWriter2 = _interopRequireDefault(_BundleWriter);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	// import TypeIndex from './streams/TypeIndex';
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

	exports.BundleReader = _BundleReader2.default;
	exports.BundleWriter = _BundleWriter2.default;

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

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var BundleReader = function BundleReader(s8, s16, s32, s64) {
	  _classCallCheck(this, BundleReader);

	  // Get proxied accessors to stream element accessors for
	  // optimized reading speed.

	  this.getU8 = s8.getUnsigned;
	  this.getI8 = s8.getSigned;
	  this.getU16 = s16.getUnsigned;
	  this.getI16 = s16.getSigned;
	  this.getU32 = s32.getUnsigned;
	  this.getI32 = s32.getSigned;
	  this.getU64 = s64.getUnsigned;
	  this.getI64 = s64.getSigned;
	};

	exports.default = BundleReader;
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

	var _Common = __webpack_require__(3);

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var BundleWriter = function () {
	  function BundleWriter() {
	    _classCallCheck(this, BundleWriter);

	    this.s08 = null;
	    this.s16 = null;
	    this.s32 = null;
	    this.s64 = null;
	  }

	  /**
	   * This function is implemented by the child classes to open
	   * the streams.
	   */


	  _createClass(BundleWriter, [{
	    key: "openStreams",
	    value: function openStreams() {
	      throw new _Common.NotImplementedError();
	    }
	  }]);

	  return BundleWriter;
	}();

	exports.default = BundleWriter;
	;

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

	/**
	 * Base class for implementing JBB exceptions
	 */

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

	var JBBError = exports.JBBError = function (_Error) {
	  _inherits(JBBError, _Error);

	  function JBBError(message) {
	    _classCallCheck(this, JBBError);

	    // Hack to provide the correct call stack
	    var _this = _possibleConstructorReturn(this, (JBBError.__proto__ || Object.getPrototypeOf(JBBError)).call(this));

	    var temp = Error.call(_this, message);
	    temp.name = _this.name = _this.constructor.name;
	    _this.stack = temp.stack;
	    _this.message = temp.message;
	    return _this;
	  }

	  return JBBError;
	}(Error);

	/**
	 * Not implemented default error
	 */


	var NotImplementedError = exports.NotImplementedError = function (_JBBError) {
	  _inherits(NotImplementedError, _JBBError);

	  function NotImplementedError(message) {
	    _classCallCheck(this, NotImplementedError);

	    return _possibleConstructorReturn(this, (NotImplementedError.__proto__ || Object.getPrototypeOf(NotImplementedError)).call(this, message));
	  }

	  return NotImplementedError;
	}(JBBError);

	/**
	 * Object not in ready state
	 */


	var NotReadyError = exports.NotReadyError = function (_JBBError2) {
	  _inherits(NotReadyError, _JBBError2);

	  function NotReadyError(message) {
	    _classCallCheck(this, NotReadyError);

	    return _possibleConstructorReturn(this, (NotReadyError.__proto__ || Object.getPrototypeOf(NotReadyError)).call(this, message));
	  }

	  return NotReadyError;
	}(JBBError);

/***/ }
/******/ ]);