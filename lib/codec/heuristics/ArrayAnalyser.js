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
   * @param {TypedArray} typedArray - The typed array to get the
   */
  static getNumericType(typedArray) {

  }

}
