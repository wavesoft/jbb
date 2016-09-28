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

export default class TypeBuffer {

  /**
   * Constructs a new TypeBuffer object that is responsible of keeping track
   * of the current index of a particular typed buffer.
   *
   * @param {Number} bytesPerElement - The size of the individual elements
   * @param {Number} byteOffset - The initial offset (must be multiplicand of bytesPerElement)
   */
  constructor(buffer, bytesPerElement = 1, byteOffset = 0) {
    this.buffer = buffer;
    this.bytesPerElement = bytesPerElement;
    this.itemOffset = byteOffset / bytesPerElement;
  }

  /**
   * Return the index of the next item and advance offset by 1
   *
   * @returns {Number} Returns the new item offset
   */
  next() {
    return this.itemOffset++;
  }

  /**
   * Return the index of the next item and advance offset by a number
   *
   * @param {Number} itemCount - The number of items to move forward
   * @returns {Number} Returns the new item offset
   */
  nextArray( itemCount ) {
    let ofs = this.itemOffset;
    this.itemOffset += itemCount;
    return ofs;
  }

  /**
   * Convert the item offset to byte offset and return
   *
   * @returns {Number} The offset of this index in bytes
   */
  get byteOffset() {
    return this.itemOffset * this.bytesPerElement;
  }

  /**
   * Convert the item offset to byte offset and return
   *
   * @param {Number} value - The new offset in bytes to set
   */
  set byteOffset(value) {
    this.itemOffset = Math.floor(value / this.bytesPerElement);
  }

};
