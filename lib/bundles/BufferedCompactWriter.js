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
import WriteTypedBuffer from '../buffers/WriteTypedBuffer';

export default class BufferedCompactWriter extends BundleObject {

  /**
   * Create a buffered compact bundle writer whose data will be composed
   * at closing time into a buffer in memory.
   *
   * @param {Number} bytesPerPage - For how many bytes to grow the buffer when needed
   */
  constructor(bytesPerPage = 16777216) {

    // Create the buffers for every different type size
    this.i8 = new WriteTypedBuffer(1, bytesPerPage);
    this.i16 = new WriteTypedBuffer(2, bytesPerPage);
    this.i32 = new WriteTypedBuffer(4, bytesPerPage);
    this.i64 = new WriteTypedBuffer(8, bytesPerPage);

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
