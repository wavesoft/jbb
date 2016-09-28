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

import { NotReadyError } from '../errors/Common';

export default class BufferedTypeReader {

  /**
   * Construct the buffered type reader with the given type of underlaying
   * array type and buffer
   *
   * @param {Class} typeClass - The array class to construct (ex. Uint8Array)
   * @param {TypeBuffer} typeBuffer - The buffer to use for this type
   */
  constructor(typeClass, typeBuffer) {
    this.constructorOffset = typeBuffer.byteOffset;
    this.typeBuffer = typeBuffer;

    // Open a new session and define the initial typed view
    this.typeBufferSession = typeBuffer.open((buffer) => {
      this.view = new typeClass( newBuffer, this.constructorOffset );
    });

    this.view = null;
  }

  /**
   * Get the next item from the buffer and advance index by one
   *
   * @return {Any} - Returns the next element of the array, defined in the constructor
   */
  get() {
    if (!this.view) {
      throw new NotReadyError('Trying to read from an object without (properly initialized) buffer');
    }
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
    if (!this.view) {
      throw new NotReadyError('Trying to read from an object without (properly initialized) buffer');
    }
    return this.view.subarray(
      this.typeBuffer.nextArray(itemCount),
      this.typeBuffer.offset
    );
  }

  /**
   * Close this stream by releasing it's resources
   */
  close() {
    this.typeBuffer.close( this.typeBufferSession );
    this.typeBufferSession = null;
  }

}
