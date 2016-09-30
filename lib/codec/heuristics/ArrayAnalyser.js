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

import NumericBounds from '../../constants/NumericBounds';
import NumericTypes from '../../constants/NumericTypes';

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
export default class ArrayAnalyser {

  /**
   * Test if the given float number fits in a 32-bit number representation.
   * if not it's assumed to fit in 64-bit number.
   *
   * @param {Number} floatNumber - A float number to test
   * @returns {Boolean} Returns true if the number can fit in 32-bits
   */
  static isFloat32(floatNumber) {
    let loss = 0.0;

    // Cast number info float32 and get the absolute of the difference
    float32_value[0] = floatNumber;
    loss = floatNumber - float32_value[0];
    if (loss < 0) loss = -loss;

    // If the loss is acceptable, assume it can fit on 32 bits
    return (loss < NumericBounds.FLOAT32_ACCEPTED_LOSS);
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
   static analyzeNumericArray(numericArray) {
    let value0 = numericArray[0];
    let results = {
      _prev: value0,
      _same: 1,
      average: 0,
      dmin: 0,
      dmax: 0,
      isFloat: value0 !== (value0|0),
      isInt: (value0 !== 0) && (value0 === (value0|0)),
      isMixed: false,
      min: value0,
      max: value0,
      sameMax: 0,
    };

    for (let i=1; i<numericArray.length; ++i) {
      let value = numericArray[i];

      // Float/Integer/Mixed type detection
      if (!results.isMixed) {
        if (value !== (value|0)) {
          results.isFloat = true;
          results.isMixed = results.isInt;
        } else {
          if (!results.isInt && (value !== 0)) {
            results.isInt = true;
            results.isMixed = results.isFloat;
          }
        }
      }

      // Check for similarity
      if (results._prev === value) {
        ++results._same;
      } else {
        let same = results._same;
        if (same > results.sameMax) {
          results.sameMax = same;
        }
        results._same = 1;
      }

      // Update bounds
      if (value < results.min) results.min = value;
      if (value > results.max) results.max = value;

      // Update delta bounds
      let diff = value - results._prev;
      if (diff < results.dmin) results.dmin=diff;
      if (diff > results.dmax) results.dmax=diff;

      // Update average
      results.average += value;

      // Keep track of previous value
      // (This is faster than accessing the previous element of the array)
      results._prev = value;
    }

    // Finalize and clean-up results
    if (results._same > results.sameMax) results.sameMax = results._same;
    results.average /= numericArray.length;
    results.isZero = !results.isInt && !results.isFloat;
    results.isSame = (results.sameMax === numericArray.length);
    delete results._prev;
    delete results._same;

    return results;
  }

  /**
   * Get the minimum possible type that can hold the numerical values
   * of all items in the given array.
   *
   *
   */
  static getNumericArrayMinType(numericArray) {
    let type = NumericTypes.UNKNOWN;

    for (let i=0; i<numericArray.length; ++i) {
      let value = numericArray[i];

      // Check if this is a float, or if the float type needs to be upgraded
      if ((type === NumericTypes.FLOAT32) || (value % 1 !== 0)) {
        if (!ArrayAnalyser.isFloat32(value)) return NumericTypes.FLOAT64;
        continue;
      }

      // Check if number is within bounds
      if (type !== NumericTypes.UNKNOWN && value >= type.min && value <= type.max) {
        continue;
      }

      // Check for type upgrade
      for (let j=0; j<type.upscale.length; ++j) {
        let nextType = type.upscale[j];
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
  static getNumericType(typedArray) {

  }

}
