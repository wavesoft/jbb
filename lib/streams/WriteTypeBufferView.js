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

export default class WriteTypeBufferView {

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
   * Append a value to the current position and advance offset by one
   *
   * @param {Any} value - The value to add to the array
   */
  put(value) {
    let ofs = this.typeBuffer.next();

    // Note: View might be re-generated here

    this.view[ofs] = value;
  }

  /**
   * Append an array to the current position and advance the indes by
   * the number of elements in the array.
   *
   * @param {Array} array - The new array to append
   */
  putArray(array) {
    let ofs = this.typeBuffer.nextArray(array.length);
    this.view.set( array, ofs );
  }

};
