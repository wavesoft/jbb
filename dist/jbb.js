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

	// import BundleReader from './bundles/BundleReader';
	// import BundleWriter from './bundles/BundleWriter';

	var _WriteTypeBuffer = __webpack_require__(1);

	var _WriteTypeBuffer2 = _interopRequireDefault(_WriteTypeBuffer);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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

	function test_16() {
	  var buf = new _WriteTypeBuffer2.default(2);
	  var view = buf.openView(Uint16Array);

	  console.time('writeBuffer[16]');
	  var count16 = 100000000;
	  while (count16--) {
	    view.put(0xAABBCCDD);
	  };
	  console.timeEnd('writeBuffer[16]');
	  console.log('Length:', buf.buffer.byteLength, '/ Actual:', buf.byteOffset);
	}

	test_16();

	// export {
	//   BundleReader,
	//   BundleWriter
	// }

/***/ },
/* 1 */
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

	var _WriteTypeBufferView = __webpack_require__(2);

	var _WriteTypeBufferView2 = _interopRequireDefault(_WriteTypeBufferView);

	var _TypeBuffer2 = __webpack_require__(4);

	var _TypeBuffer3 = _interopRequireDefault(_TypeBuffer2);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

	var WriteTypeBuffer = function (_TypeBuffer) {
	  _inherits(WriteTypeBuffer, _TypeBuffer);

	  /**
	   * Constructs a new WriteTypeBuffer object that can be used for writing
	   * data on an ever-growing buffer in memory.
	   *
	   * Since expanding the array buffer is quite costly, we are doing so in bulks
	   * of large enough data. By default, it will add 16MiB of data on every update.
	   * This might be OK in most of the cases, without too much memory going to
	   * waste. Of course, if you are going to pack a lot of data, it's a good idea
	   * to increase this value, or use the WriteTypeFile class.
	   *
	   * @param {Number} bytesPerElement - The size of the individual elements
	   * @param {Number} bytesPerPage - For how many bytes to grow the buffer when needed
	   */
	  function WriteTypeBuffer() {
	    var bytesPerElement = arguments.length <= 0 || arguments[0] === undefined ? 1 : arguments[0];
	    var bytesPerPage = arguments.length <= 1 || arguments[1] === undefined ? 16777216 : arguments[1];

	    _classCallCheck(this, WriteTypeBuffer);

	    var _this = _possibleConstructorReturn(this, (WriteTypeBuffer.__proto__ || Object.getPrototypeOf(WriteTypeBuffer)).call(this, new ArrayBuffer(bytesPerPage), bytesPerElement, 0));

	    _this.bytesPerPage = bytesPerPage;
	    _this.elementsLength = bytesPerPage / bytesPerElement;
	    return _this;
	  }

	  /**
	   * Expand the buffer, adding enough pages in order to fit the items
	   */


	  _createClass(WriteTypeBuffer, [{
	    key: 'expand',
	    value: function expand() {
	      var fitItems = arguments.length <= 0 || arguments[0] === undefined ? 1 : arguments[0];
	      var bytesPerElement = this.bytesPerElement;
	      var bytesPerPage = this.bytesPerPage;

	      var fitBytes = fitItems * bytesPerElement;
	      var expandBy = Math.ceil(fitBytes / bytesPerPage) * bytesPerPage;
	      var oldBuffer = this.buffer;

	      // Create new buffer and update new element length
	      this.buffer = new ArrayBuffer(oldBuffer.byteLength + expandBy);
	      this.elementsLength = this.buffer.byteLength / bytesPerElement;

	      // Clone contents so-far
	      new Uint8Array(this.buffer).set(new Uint8Array(oldBuffer));

	      // Regenerate all open views
	      this.openViews.forEach(function (view) {
	        return view.regenerate();
	      });
	    }

	    /**
	     * Return the index of the next item and advance offset by 1.
	     *
	     * If there is no more room in the buffer, this function will call
	     * `expand` in order to append another page to the buffer.
	     *
	     * @override
	     * @returns {Number} Returns the new item offset
	     */

	  }, {
	    key: 'next',
	    value: function next() {
	      var ofs = this.itemOffset++;
	      if (ofs >= this.elementsLength) {
	        this.expand();
	      }

	      return ofs;
	    }

	    /**
	     * Return the index of the next item and advance offset by a number
	     *
	     * If there is no more room in the buffer, this function will call
	     * `expand` as many times as needed in order to append enough data to fit
	     * the new number of items.
	     *
	     * @override
	     * @param {Number} itemCount - The number of items to move forward
	     * @returns {Number} Returns the new item offset
	     */

	  }, {
	    key: 'nextArray',
	    value: function nextArray(itemCount) {
	      var ofs = this.itemOffset;
	      this.itemOffset += itemCount;
	      if (this.itemOffset >= this.elementsLength) {
	        this.expand(itemCount);
	      }

	      return ofs;
	    }

	    /**
	     * Open a new view using a shared buffer, for the specified type length
	     *
	     * @param {Class} viewType - The class of the array view (Ex. Uint8Array)
	     * @returns {WriteTypeBufferView} Returns a view for accessing the items.
	     */

	  }, {
	    key: 'openView',
	    value: function openView(viewType) {
	      if (viewType.BYTES_PER_ELEMENT !== this.bytesPerElement) {
	        throw new TypeError('Trying to open a view with ' + viewType.BYTES_PER_ELEMENT + ' bytes per element, on a stream with ' + this.bytesPerElement + ' bytes per element');
	      }

	      // Create a new view and store it for reference
	      var view = new _WriteTypeBufferView2.default(this, viewType);
	      this.openViews.push(view);

	      // Ask view to re-generate using our buffer
	      view.regenerate();

	      // Return it
	      return view;
	    }
	  }]);

	  return WriteTypeBuffer;
	}(_TypeBuffer3.default);

	exports.default = WriteTypeBuffer;
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

	var _TypeBufferView2 = __webpack_require__(3);

	var _TypeBufferView3 = _interopRequireDefault(_TypeBufferView2);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

	var WriteTypeBufferView = function (_TypeBufferView) {
	  _inherits(WriteTypeBufferView, _TypeBufferView);

	  /**
	   * Construct the view of given type on the shared buffer in the typeBuffer
	   * specified.
	   *
	   * @param {TypeBuffer} typeBuffer - The buffer to use for this type
	   * @param {Class} viewClass - The array class to construct (ex. Uint8Array)
	   */
	  function WriteTypeBufferView(typeBuffer, viewClass) {
	    _classCallCheck(this, WriteTypeBufferView);

	    return _possibleConstructorReturn(this, (WriteTypeBufferView.__proto__ || Object.getPrototypeOf(WriteTypeBufferView)).call(this, typeBuffer, viewClass));
	  }

	  /**
	   * Re-generate the internal view with the latest buffer from typeBuffer
	   *
	   * @private This method is internally used by `ReadTypeBuffer`
	   */


	  _createClass(WriteTypeBufferView, [{
	    key: "regenerate",
	    value: function regenerate() {
	      this.view = new this.viewClass(this.typeBuffer.buffer);
	    }

	    /**
	     * Append a value to the current position and advance offset by one
	     *
	     * @param {Any} value - The value to add to the array
	     */

	  }, {
	    key: "put",
	    value: function put(value) {
	      var ofs = this.typeBuffer.next();

	      // Note: View might be re-generated here

	      this.view[ofs] = value;
	    }

	    /**
	     * Append an array to the current position and advance the indes by
	     * the number of elements in the array.
	     *
	     * @param {Array} array - The new array to append
	     */

	  }, {
	    key: "putArray",
	    value: function putArray(array) {
	      var ofs = this.typeBuffer.nextArray(array.length);
	      this.view.set(array, ofs);
	    }
	  }]);

	  return WriteTypeBufferView;
	}(_TypeBufferView3.default);

	exports.default = WriteTypeBufferView;
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

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var TypeBufferView = function () {

	  /**
	   * Construct the view of given type on the shared buffer in the typeBuffer
	   * specified.
	   *
	   * @param {TypeBuffer} typeBuffer - The buffer to use for this type
	   * @param {Class} viewClass - The array class to construct (ex. Uint8Array)
	   */
	  function TypeBufferView(typeBuffer, viewClass) {
	    _classCallCheck(this, TypeBufferView);

	    this.typeBuffer = typeBuffer;
	    this.viewClass = viewClass;
	  }

	  /**
	   * Close the current view by calling back to our parent buffer
	   */


	  _createClass(TypeBufferView, [{
	    key: "close",
	    value: function close() {
	      this.typeBuffer.closeView(this);
	    }
	  }]);

	  return TypeBufferView;
	}();

	exports.default = TypeBufferView;

/***/ },
/* 4 */
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

	var TypeBuffer = function () {

	  /**
	   * Constructs a new TypeBuffer object that is responsible of keeping track
	   * of the current index of a particular typed buffer.
	   *
	   * @param {Number} bytesPerElement - The size of the individual elements
	   * @param {Number} byteOffset - The initial offset (must be multiplicand of bytesPerElement)
	   */
	  function TypeBuffer(buffer) {
	    var bytesPerElement = arguments.length <= 1 || arguments[1] === undefined ? 1 : arguments[1];
	    var byteOffset = arguments.length <= 2 || arguments[2] === undefined ? 0 : arguments[2];

	    _classCallCheck(this, TypeBuffer);

	    this.buffer = buffer;
	    this.bytesPerElement = bytesPerElement;
	    this.itemOffset = byteOffset / bytesPerElement;
	    this.openViews = [];
	  }

	  /**
	   * Convert the item offset to byte offset and return
	   *
	   * @returns {Number} The offset of this index in bytes
	   */


	  _createClass(TypeBuffer, [{
	    key: "closeView",


	    /**
	     * Closes a view previously crated with openView
	     *
	     * @param {WriteTypeBufferView} view - The view to close
	     * @param {Boolean} dispose - Dispose the buffer if this was the last view
	     */
	    value: function closeView(view) {
	      var i = this.openViews.indexOf(view);
	      if (i < 0) return;
	      this.openViews.slice(i, 1);

	      if (this.openViews.length === 0) {
	        this.close();
	      }
	    }

	    /**
	     * Release the memory associated with this object
	     */

	  }, {
	    key: "close",
	    value: function close() {
	      this.buffer = null;
	    }

	    /**
	     * Return the index of the next item and advance offset by 1
	     *
	     * @returns {Number} Returns the new item offset
	     */

	  }, {
	    key: "next",
	    value: function next() {
	      return this.itemOffset++;
	    }

	    /**
	     * Return the index of the next item and advance offset by a number
	     *
	     * @param {Number} itemCount - The number of items to move forward
	     * @returns {Number} Returns the new item offset
	     */

	  }, {
	    key: "nextArray",
	    value: function nextArray(itemCount) {
	      var ofs = this.itemOffset;
	      this.itemOffset += itemCount;
	      return ofs;
	    }
	  }, {
	    key: "byteOffset",
	    get: function get() {
	      return this.itemOffset * this.bytesPerElement;
	    }

	    /**
	     * Convert the item offset to byte offset and return
	     *
	     * @param {Number} value - The new offset in bytes to set
	     */
	    ,
	    set: function set(value) {
	      this.itemOffset = Math.floor(value / this.bytesPerElement);
	    }
	  }]);

	  return TypeBuffer;
	}();

	exports.default = TypeBuffer;
	;

/***/ }
/******/ ]);