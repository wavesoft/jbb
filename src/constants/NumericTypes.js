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

import NumericBounds from './NumericBounds';

/**
 * Shorthand to create an integer type object
 *
 * @param {Number} id - The encoded type ID
 * @param {String} name - The encoded type ID
 * @param {Boolean} signed - The number is signed
 * @param {Number} min - The minimum number
 * @param {Number} max - The maximum possible number
 */
function integerType(id, name, signed=false, min=-Infinity, max=Infinity) {
  return {
    id, signed, min, max,
    upscale: [],
    toJSON() {
      return name;
    }
  };
}

/**
 * Constants specific to the JBB file format
 */
const NumericTypes = {

  UINT8   : integerType( 0, 'UINT8',   false, NumericBounds.UINT8_MIN,  NumericBounds.UINT8_MAX ),
  INT8    : integerType( 1, 'INT8',    false, NumericBounds.INT8_MIN,   NumericBounds.INT8_MAX ),
  UINT16  : integerType( 2, 'UINT16',  false, NumericBounds.UINT16_MIN, NumericBounds.UINT16_MAX ),
  INT16   : integerType( 3, 'INT16',   false, NumericBounds.INT16_MIN,  NumericBounds.INT16_MAX ),
  UINT32  : integerType( 4, 'UINT32',  false, NumericBounds.UINT32_MIN, NumericBounds.UINT32_MAX ),
  INT32   : integerType( 5, 'INT32',   false, NumericBounds.INT32_MIN,  NumericBounds.INT32_MAX ),
  FLOAT32 : integerType( 6, 'FLOAT32', false ),
  FLOAT64 : integerType( 7, 'FLOAT64', false ),

  NUMERIC : integerType( 8, 'NUMERIC' ),
  UNKNOWN : integerType( 9, 'UNKNOWN' ),
  NAN     : integerType( 10, 'NAN' )

};

/**
 * Define upscaling candidates
 */
NumericTypes.UNKNOWN.upscale = [
  NumericTypes.UINT8,
  NumericTypes.INT8,
  NumericTypes.UINT16,
  NumericTypes.INT16,
  NumericTypes.UINT32,
  NumericTypes.INT32,
  NumericTypes.FLOAT32,
  NumericTypes.FLOAT64
];

NumericTypes.NUMERIC.upscale = [
  NumericTypes.UINT8,
  NumericTypes.INT8,
  NumericTypes.UINT16,
  NumericTypes.INT16,
  NumericTypes.UINT32,
  NumericTypes.INT32,
  NumericTypes.FLOAT32,
  NumericTypes.FLOAT64
];

NumericTypes.UINT8.upscale = [
  NumericTypes.INT8,
  NumericTypes.UINT16,
  NumericTypes.INT16,
  NumericTypes.UINT32,
  NumericTypes.INT32,
  NumericTypes.FLOAT64
];

NumericTypes.INT8.upscale = [
  NumericTypes.INT16,
  NumericTypes.INT32,
  NumericTypes.FLOAT64
];

NumericTypes.UINT16.upscale = [
  NumericTypes.INT16,
  NumericTypes.UINT32,
  NumericTypes.INT32,
  NumericTypes.FLOAT64
];

NumericTypes.INT16.upscale = [
  NumericTypes.INT32,
  NumericTypes.FLOAT64
];

NumericTypes.UINT32.upscale = [
  NumericTypes.INT32,
  NumericTypes.FLOAT64
];

NumericTypes.INT32.upscale = [
  NumericTypes.FLOAT64
];

export default NumericTypes;
