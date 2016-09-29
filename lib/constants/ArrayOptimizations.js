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

export const NumericOptimizations = {

  /**
   * No optimizations possible
   */
  NONE: 0,

  /**
   * The numerical types of the array can be downscaled to a smaller
   * type since it's bounds are not exploited
   */
  DOWNSCALE: 1,

  /**
   * The array values can be downscaled by pivoting around a different
   * zero value.
   */
  PIVOT: 2,

  /**
   * The array values can be downscaled by calculating the delta between
   * two consecutive numbers
   */
  DELTA: 3,

};

export const ObjectOptimizations = {

  /**
   * No optimizations possible
   */
  NONE: 0,

  /**
   * The objects in the array are plain objects and all of them are sharing
   * the same signature.
   */
  PLAIN_SAME_SIGNATURE: 1,

  /**
   * The objects in the array are all known and of the same type.
   */
  KNOWN_SAME_TYPE: 2,

};

export const GenericOptimizations = {

  /**
   * No optimizations possible
   */
  NONE: 0,

  /**
   * The array is empty
   */
  EMPTY: 1,

  /**
   * The same value is repeated
   */
  REPEATED: 2,

}
