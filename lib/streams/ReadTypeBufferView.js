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

export default class ReadTypeBufferView {

  /**
   * Construct the view of given type on the shared buffer in the typeBuffer
   * specified.
   *
   * @param {TypeBuffer} typeBuffer - The buffer to use for this type
   * @param {Class} viewClass - The array class to construct (ex. Uint8Array)
   */
  constructor(typeBuffer, viewClass) {
    this.typeBuffer = typeBuffer;
    this.viewClass = viewClass;
  }

  /**
   * Re-generate the internal view with the latest buffer from typeBuffer
   *
   * @private This method is internally used by `ReadTypeBuffer`
   */
  regenerate() {
    this.view = new this.viewClass( this.typeBuffer.buffer );
  }

  /**
   * Get the next item from the buffer and advance index by one
   *
   * @return {Number} - Returns the next element of the array, defined in the constructor
   */
  get() {
    return this.view[ this.typeBuffer.next() ];
  }

  /**
   * Extract an array slice from the source array from the current position,
   * forwarding the offset by the number of items specified when done.
   *
   * @param {Number} itemCount - The number of items in the array to extract
   * @return {Array} - Returns the next array slice
   */
  getArray(itemCount) {
    return this.view.subarray(
      this.typeBuffer.nextArray(itemCount),
      this.typeBuffer.offset
    );
  }

};
