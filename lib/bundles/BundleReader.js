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

export default class BundleReader {

  /**
   * Create a new bundle reader capable of decoding data and structures
   * from the given set of typed streams.
   *
   * @param {ReadTypeBufferView} s8 - View for signed 8-bit integers
   * @param {ReadTypeBufferView} u8 - View for unsigned 8-bit integers
   * @param {ReadTypeBufferView} s16 - View for signed 16-bit integers
   * @param {ReadTypeBufferView} u16 - View for unsigned 16-bit integers
   * @param {ReadTypeBufferView} s32 - View for signed 32-bit integers
   * @param {ReadTypeBufferView} u32 - View for unsigned 32-bit integers
   * @param {ReadTypeBufferView} f32 - View for 32-bit floats
   * @param {ReadTypeBufferView} f64 - View for 64-bit floats
   */
  constructor(s8, u8, s16, u16, s32, u32, f32, f64) {
    this.s8 = s8;
    this.u8 = u8;
    this.s16 = s16;
    this.u16 = u16;
    this.s32 = s32;
    this.u32 = u32;
    this.f32 = f32;
    this.f64 = f64;
  }

  /**
   * Close all views and the shared buffers
   */
  close() {
    this.s8.close();
    this.u8.close();
    this.s16.close();
    this.u16.close();
    this.s32.close();
    this.u32.close();
    this.f32.close();
    this.f64.close();
  }

}
