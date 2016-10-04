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

export default class BundleObject {

  /**
   * Create a new bundle reader capable of decoding data and structures
   * from the given set of typed streams.
   *
   * @param {ReadTypedBufferView} s8 - View for signed 8-bit integers
   * @param {ReadTypedBufferView} u8 - View for unsigned 8-bit integers
   * @param {ReadTypedBufferView} s16 - View for signed 16-bit integers
   * @param {ReadTypedBufferView} u16 - View for unsigned 16-bit integers
   * @param {ReadTypedBufferView} s32 - View for signed 32-bit integers
   * @param {ReadTypedBufferView} u32 - View for unsigned 32-bit integers
   * @param {ReadTypedBufferView} f32 - View for 32-bit floats
   * @param {ReadTypedBufferView} f64 - View for 64-bit floats
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

  /**
   * Return the next op-code
   */
  getOpCode() {
    return this.u8.get();
  }

  /**
   * Return the next op-code argument with 2-kind type index
   */
  getOpArg2(type) {
    if (type === 0) {
      return this.u16.get();
    } else {
      return this.u32.get();
    }
  }

  /**
   * Return the next op-code argument with 4-kind type index
   */
  getOpArg4(type) {
    switch (type) {
      case 0:
        return this.u8.get();
      case 1:
        return this.u16.get();
      case 2:
        return this.u32.get();
      case 3:
        return this.f64.get();
    }
  }

  /**
   * Return the next op-code array argument with 2-kind type index
   */
  getOpArray2(type, length) {
    if (type === 0) {
      return this.u16.getArray(length);
    } else {
      return this.u32.getArray(length);
    }
  }

  /**
   * Return the next op-code array argument with 8-kind type index
   */
  getOpArray8(type, length) {
    switch (type) {
      case 0:
        return this.u8.getArray(length);
      case 1:
        return this.i8.getArray(length);
      case 2:
        return this.u16.getArray(length);
      case 3:
        return this.i16.getArray(length);
      case 4:
        return this.u32.getArray(length);
      case 5:
        return this.i32.getArray(length);
      case 6:
        return this.f32.getArray(length);
      case 7:
        return this.f64.getArray(length);
    }
  }

}
