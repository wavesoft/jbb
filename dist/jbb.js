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

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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

	var _DecodingHeader = __webpack_require__(2);

	var _DecodingHeader2 = _interopRequireDefault(_DecodingHeader);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	exports.default = _DecodingHeader2.default;

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

	var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

	var _Header_v = __webpack_require__(3);

	var _Header_v2 = _interopRequireDefault(_Header_v);

	var _Header_v3 = __webpack_require__(4);

	var _Header_v4 = _interopRequireDefault(_Header_v3);

	var _Read = __webpack_require__(5);

	var _Common = __webpack_require__(6);

	var _FileFormatConstants = __webpack_require__(7);

	var _FileFormatConstants2 = _interopRequireDefault(_FileFormatConstants);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	/**
	 * This class represents the JBB header, allowing bi-directional modifications
	 * to the underlying payload.
	 */
	var DecodingHeader =

	/**
	 * Construct a new JBB Header
	 *
	 * @param {ArrayBuffer} buffer - The array buffer to extract the header data from
	 * @param {Array} supportedVersions - An array of possible version specs supported by the decoder
	 */
	function DecodingHeader() {
	  var _this = this;

	  var buffer = arguments.length <= 0 || arguments[0] === undefined ? undefined : arguments[0];
	  var supportedVersions = arguments.length <= 1 || arguments[1] === undefined ? [_Header_v2.default, _Header_v4.default] : arguments[1];

	  _classCallCheck(this, DecodingHeader);

	  // Open views to the buffer
	  var u8 = new Uint8Array(buffer);
	  var u16 = new Uint16Array(buffer);
	  var u32 = new Uint32Array(buffer);

	  // Perform some obvious validations on the fixed part of the header
	  if (u16[0] !== _FileFormatConstants2.default.MAGIC_NUMBER) {
	    var swapMagic = (u16[0] & 0x00FF) << 8 || u[16] >> 8 & 0x00FF;
	    if (swapMagic === _FileFormatConstants2.default.MAGIC_NUMBER) {
	      throw new _Read.EndianessError('Your machine\'s and the bundle\'s endianess types do not match');
	    } else {
	      throw new _Read.MalformedError('Unexpected magic number encountered in the bundle header');
	    }
	  }

	  // Iterate over header versions and try to match the correct one
	  var matchedVersion = supportedVersions.reduce(function (matchedInfo, versionInfo) {
	    var ofs = 0;
	    var applyFields = [];
	    var isMatch = true;

	    // If we already found something, return it
	    if (matchedInfo) {
	      return matchedInfo;
	    }

	    // Extract fields and compare fixed fields for match
	    versionInfo.fields.forEach(function (field) {
	      var value = 0;
	      switch (field.size) {
	        case 1:
	          value = u8[ofs];
	          ofs += 1;
	          break;

	        case 2:
	          value = u16[ofs / 2];
	          ofs += 2;
	          break;

	        case 4:
	          value = u32[ofs / 4];
	          ofs += 4;
	          break;

	        default:
	          if (true) {
	            throw new _Common.IntegrityError('Unexpected `size` property value in header_versions');
	          }
	      }

	      // Check for incompatible fixed field values
	      if (field.fixed !== undefined && field.fixed !== value) {
	        isMatch = false;
	        return;
	      }

	      // Keep this field for later application
	      applyFields.push([field.name, value]);
	    });

	    // If we have a match, return it
	    if (isMatch) {
	      return {
	        fields: applyFields,
	        version: versionInfo
	      };
	    }

	    // Otherwise keep returning null
	    return null;
	  }, null);

	  // Check if nothing found
	  if (!matchedVersion) {
	    throw new NotSupportedError('Unsupported bundle version');
	  }

	  // Apply fields
	  matchedVersion.fields.forEach(function (_ref) {
	    var _ref2 = _slicedToArray(_ref, 2);

	    var key = _ref2[0];
	    var value = _ref2[1];

	    _this[key] = value;
	  });
	};

	exports.default = DecodingHeader;
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
	var Header_v1 = {

	  version: 1,

	  fields: [{ name: 'magic', size: 2, fixed: 0x3142 }, { name: 'version', size: 1, fixed: 1 }, { name: 'reserved', size: 1 }, { name: 's64_length', size: 4 }, { name: 's32_length', size: 4 }, { name: 's16_length', size: 4 }, { name: 's8_length', size: 4 }, { name: 'st_length', size: 4 }, { name: 'ot_length', size: 4 }]

	};

	exports.default = Header_v1;

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
	var Header_v2 = {

	  version: 2,

	  fields: [{ name: 'magic', size: 2, fixed: 0x3142 }, { name: 'version', size: 1, fixed: 2 }, { name: 'reserved', size: 1 }, { name: 's64_length', size: 4 }, { name: 's32_length', size: 4 }, { name: 's16_length', size: 4 }, { name: 's8_length', size: 4 }, { name: 'fd_length', size: 4 }]

	};

	exports.default = Header_v2;

/***/ },
/* 5 */
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
	exports.VersionError = exports.EndianessError = exports.MalformedError = exports.ReadError = undefined;

	var _Common = __webpack_require__(6);

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

	/**
	 * General purpose reading error
	 */
	var ReadError = exports.ReadError = function (_JBBError) {
	  _inherits(ReadError, _JBBError);

	  function ReadError(message) {
	    _classCallCheck(this, ReadError);

	    return _possibleConstructorReturn(this, (ReadError.__proto__ || Object.getPrototypeOf(ReadError)).call(this, message));
	  }

	  return ReadError;
	}(_Common.JBBError);

	/**
	 * Malformed data encountered in the bundle
	 */


	var MalformedError = exports.MalformedError = function (_ReadError) {
	  _inherits(MalformedError, _ReadError);

	  function MalformedError(message) {
	    _classCallCheck(this, MalformedError);

	    return _possibleConstructorReturn(this, (MalformedError.__proto__ || Object.getPrototypeOf(MalformedError)).call(this, message));
	  }

	  return MalformedError;
	}(ReadError);

	/**
	 * The bundle has different endianess than the one it was encoded with
	 */


	var EndianessError = exports.EndianessError = function (_ReadError2) {
	  _inherits(EndianessError, _ReadError2);

	  function EndianessError(message) {
	    _classCallCheck(this, EndianessError);

	    return _possibleConstructorReturn(this, (EndianessError.__proto__ || Object.getPrototypeOf(EndianessError)).call(this, message));
	  }

	  return EndianessError;
	}(ReadError);

	/**
	 * A feature in the bundle has a different
	 */


	var VersionError = exports.VersionError = function (_ReadError3) {
	  _inherits(VersionError, _ReadError3);

	  function VersionError(message) {
	    _classCallCheck(this, VersionError);

	    return _possibleConstructorReturn(this, (VersionError.__proto__ || Object.getPrototypeOf(VersionError)).call(this, message));
	  }

	  return VersionError;
	}(ReadError);

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
	 * Internal, integrity error
	 */


	var IntegrityError = exports.IntegrityError = function (_JBBError) {
	  _inherits(IntegrityError, _JBBError);

	  function IntegrityError(message) {
	    _classCallCheck(this, IntegrityError);

	    return _possibleConstructorReturn(this, (IntegrityError.__proto__ || Object.getPrototypeOf(IntegrityError)).call(this, message));
	  }

	  return IntegrityError;
	}(JBBError);

	/**
	 * Not implemented default error
	 */


	var NotImplementedError = exports.NotImplementedError = function (_JBBError2) {
	  _inherits(NotImplementedError, _JBBError2);

	  function NotImplementedError(message) {
	    _classCallCheck(this, NotImplementedError);

	    return _possibleConstructorReturn(this, (NotImplementedError.__proto__ || Object.getPrototypeOf(NotImplementedError)).call(this, message));
	  }

	  return NotImplementedError;
	}(JBBError);

	/**
	 * Requested a feature not supported by the system
	 */


	var NotSupportedError = exports.NotSupportedError = function (_JBBError3) {
	  _inherits(NotSupportedError, _JBBError3);

	  function NotSupportedError(message) {
	    _classCallCheck(this, NotSupportedError);

	    return _possibleConstructorReturn(this, (NotSupportedError.__proto__ || Object.getPrototypeOf(NotSupportedError)).call(this, message));
	  }

	  return NotSupportedError;
	}(JBBError);

/***/ },
/* 7 */
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
	 * Constants specific to the JBB file format
	 */

	module.exports = {

	  /**
	   * The magic number
	   */
	  MAGIC_NUMBER: 0x4231

	};

/***/ }
/******/ ]);