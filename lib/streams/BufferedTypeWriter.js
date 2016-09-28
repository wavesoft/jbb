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

export default class BufferedTypeWriter {

  /**
   * Construct the buffered type writer with the given type of underlaying
   * array type and buffer
   *
   * @param {Class} typeClass - The array class to construct (ex. Uint8Array)
   * @param {TypeBuffer} typeBuffer - The buffer to use for this type
   */
  constructor(typeClass, typeBuffer) {
    this.typeClass = typeClass;
    this.typeBuffer = typeBuffer;
    this.array = new typeClass( typeBuffer.buffer );
  }

  /**
   * Append a value to the current position and advance offset by one
   *
   * @param {Any} value - The value to add to the array
   */
  put(value) {
    let ofs = this.typeBuffer.next();
    this.array[ofs] = value;
  }

  /**
   * Append an array to the current position and advance the indes by
   * the number of elements in the array.
   *
   * @param {Array} array - The new array to append
   */
  putArray(array) {
    let ofs = this.typeBuffer.nextArray(array.length);
    this.array.set( array, ofs );
  }

  /**
   * Close this stream by releasing it's resources
   */
  close() {
    this.array = undefined;
  }

}
