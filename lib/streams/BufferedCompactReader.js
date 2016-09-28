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

import ReadTypeBuffer from './ReadTypeBuffer';

export default class BufferedCompactReader {

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
    this.i8 = new ReadTypeBuffer(buffer, 1, ofs8);
    this.i16 = new ReadTypeBuffer(buffer, 2, ofs16);
    this.i32 = new ReadTypeBuffer(buffer, 4, ofs32);
    this.i64 = new ReadTypeBuffer(buffer, 8, ofs64);

    // Open different buffer views bound on the appropriate shared buffer
    this.s8 = this.i8.openView(Int8Array);
    this.u8 = this.i8.openView(Uint8Array);
    this.s16 = this.i16.openView(Int16Array);
    this.u16 = this.i16.openView(Uint16Array);
    this.s32 = this.i32.openView(Int32Array);
    this.u32 = this.i32.openView(Uint32Array);
    this.f32 = this.i32.openView(Float32Array);
    this.f64 = this.i64.openView(Float64Array);

  }

  /**
   * Close all views and the shared buffers
   */
  close() {
    this.i8.closeView( this.s8 );
    this.i8.closeView( this.u8 );
    this.i8.close();

    this.i16.closeView( this.s16 );
    this.i16.closeView( this.u16 );
    this.i16.close();

    this.i32.closeView( this.s32 );
    this.i32.closeView( this.u32 );
    this.i32.closeView( this.f32 );
    this.i32.close();

    this.i64.closeView( this.f64 );
    this.i64.close();
  }

}
