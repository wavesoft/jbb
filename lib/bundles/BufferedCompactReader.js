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

import BundleObject from './BundleObject';
import ReadTypedBuffer from '../buffers/ReadTypedBuffer';

export default class BufferedCompactReader extends BundleObject {

  /**
   * Create a buffered compact bundle reader from the given buffer
   * and offsets.
   *
   * @param {ArrayBuffer} buffer - The shared array buffer to use
   * @param {Number} ofs8 - The offset (in bytes) were the 8-bit stream strts
   * @param {Number} ofs16 - The offset (in bytes) were the 16-bit stream strts
   * @param {Number} ofs32 - The offset (in bytes) were the 32-bit stream strts
   * @param {Number} ofs64 - The offset (in bytes) were the 64-bit stream strts
   */
  constructor(buffer, ofs8, ofs16, ofs32, ofs64) {

    // Create the buffers for every different type size
    this.i8 = new ReadTypedBuffer(buffer, 1, ofs8);
    this.i16 = new ReadTypedBuffer(buffer, 2, ofs16);
    this.i32 = new ReadTypedBuffer(buffer, 4, ofs32);
    this.i64 = new ReadTypedBuffer(buffer, 8, ofs64);

    // Open different buffer views bound on the appropriate shared buffer
    super(
        this.i8.openView(Int8Array),
        this.i8.openView(Uint8Array),
        this.i16.openView(Int16Array),
        this.i16.openView(Uint16Array),
        this.i32.openView(Int32Array),
        this.i32.openView(Uint32Array),
        this.i32.openView(Float32Array),
        this.i64.openView(Float64Array),
      );

  }

}