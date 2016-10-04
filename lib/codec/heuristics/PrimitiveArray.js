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

import deepEqual from 'deep-equal';

import ObjectUtil from './util/ObjectUtil';
import EncodingContext from '../EncodingContext';
import { NumericGroup, NumericChunk } from './groups/NumericGroup';
import { SmallPrimitiveGroup, SmallPrimitiveChunk } from './groups/SmallPrimitiveGroup';
import KnownObjectGroup from './groups/KnownObjectGroup';
import PlainObjectGroup from './groups/PlainObjectGroup';
import SameGroup from './groups/SameGroup';

/**
 * Result object used by the `analyzePrimitiveArray` function when analyzing
 * the input data. Instead of using a plain object, creating a class actually
 * helps the compiler optimize the object even further.
 */
class PrimitiveAnalysisResults {

  /**
   * Analysis results constructor.
   */
  constructor( value0 ) {
    this._sameGroup = new SameGroup();
    this._numericGroup = new NumericGroup();
    this._knownObjects = new KnownObjectGroup();
    this._plainObjects = new PlainObjectGroup();
    this._smallPrimitives = new SmallPrimitiveGroup();
    this._lastValue = undefined;

    this.chunks = [];
  }

  /**
   * Finalize metrics by calculating ???
   *
   * @param {Number} itemCount - The number of items processed
   */
  finalize(itemCount) {
  }

}

/**
 * Analysis functions for detecting the nature of primitive arrays and extracting
 * useful information for optimized encoding.
 */
export default class PrimitiveArray {

  static analyzePrimitiveArray(primitiveArray, encodingContext=EncodingContext.DEFAULT) {
    const itemCount = Number(primitiveArray.length);
    const { obj_byval_comparision } = encodingContext.options;
    let results = new PrimitiveAnalysisResults();

    // Pass every element trough the primitive groupping rules in order to
    // chunk together primitives that can be optimally encoded.
    for (let i=0; i<itemCount; ++i) {
      let value = primitiveArray[i];
      let valueType = typeof value;
      let isSame = false;
      let {chunks} = results;

      // Perform comparison to the previous value inside the loop and not
      // within a particular function in order to avoid de-optimizing it due
      // to incompatible argument types passed to `isValueEndingChunk`
      if (results._lastValue === value) {
        isSame = true;
      } else if ((obj_byval_comparision === true) &&
                 deepEqual(results._lastValue, value, {strict:true})) {
        isSame = true;
      }

      // [1] Check for SAME group
      if (results._sameGroup.isValueEndingChunk(isSame, i)) {
        chunks.push(results._sameGroup.getChunk());
      }

      // Keep last value
      results._lastValue = value;

      // Check for small primitivies
      if ((value === null) || (valueType === 'boolean') || (valueType === 'undefined')) {

        // [2] Check for SMALL PRIMITIVES group
        if (results._smallPrimitives.isValueEndingChunk(value, i)) {
          chunks.push(results._smallPrimitives.getChunk());
        }

        // Close possibly open other groups
        if (results._knownObjects.isActive(i)) {
          chunks.push(results._knownObjects.getChunk());
        }
        if (results._plainObjects.isActive(i)) {
          chunks.push(results._plainObjects.getChunk());
        }
        if (results._numericGroup.isActive(i)) {
          chunks.push(results._numericGroup.getChunk());
        }

      } else if (valueType === 'number') {

        // [3] Check for NUMERIC group
        if (results._numericGroup.isValueEndingChunk(value, i)) {
          chunks.push(results._numericGroup.getChunk());
        }

        // Close possibly open other groups
        if (results._knownObjects.isActive(i)) {
          chunks.push(results._knownObjects.getChunk());
        }
        if (results._plainObjects.isActive(i)) {
          chunks.push(results._plainObjects.getChunk());
        }
        if (results._smallPrimitives.isActive(i)) {
          chunks.push(results._smallPrimitives.getChunk());
        }

      } else if (valueType === 'object') {

        let type = encodingContext.knownObjects.lookup(value);
        if (type === null) {
          let keys = Object.keys(value);

          // [4] Check for PLAIN OBJECT group
          if (results._plainObjects.isValueEndingChunk(keys, i)) {
            chunks.push(results._plainObjects.getChunk());
          }
          if (results._knownObjects.isActive(i)) {
            chunks.push(results._knownObjects.getChunk());
          }

        } else {

          // [5] Check for KNOWN OBJECT group
          if (results._knownObjects.isValueEndingChunk(type, i)) {
            chunks.push(results._knownObjects.getChunk());
          }
          if (results._plainObjects.isActive(i)) {
            chunks.push(results._plainObjects.getChunk());
          }

        }

        // Close possibly other open groups
        if (results._numericGroup.isActive(i)) {
          chunks.push(results._numericGroup.getChunk());
        }
        if (results._smallPrimitives.isActive(i)) {
          chunks.push(results._smallPrimitives.getChunk());
        }

      } else if (valueType === 'string') {

      }

    }

    results.finalize(itemCount);
    return results;
  }

}
