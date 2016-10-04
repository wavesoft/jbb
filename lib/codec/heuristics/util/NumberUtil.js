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

import NumericBounds from '../../../constants/NumericBounds';

/**
 * Local helper to cast a value to 32-bit float
 */
var float32_value = new Float32Array(1);

/**
 * Number-related utilities
 */
export default class NumberUtil {

  /**
   * Optimised function to test if a number is float.
   * It exploits a quirk for numbers smaller than 32-bit.
   *
   * @param {Number} number - The number to test
   * @return {Boolean} Returns true if the number is float
   */
  static isFloat(number) {
    if ((number > 0x7FFFFFFF) || (number < -0x7FFFFFFE)) {
      return number % 1 !== 0;
    } else {
      return number !== (number|0);
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
  static isFloat32(floatNumber, tollerance=NumericBounds.FLOAT32_ACCEPTED_LOSS) {
    // Cast number info float32 and then read it back in order
    // to calculate the loss value
    float32_value[0] = floatNumber;

    // If the loss is acceptable, assume we can use Float32 for representing it
    return (Math.abs(floatNumber - float32_value[0]) < tollerance);
  }

}
