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

import Header_v1 from '../header_versions/Header_v1';
import Header_v2 from '../header_versions/Header_v2';

/**
 * This class represents the JBB header, allowing bi-directional modifications
 * to the underlying payload.
 */
export default class Header {

  /**
   * Construct a new JBB Header
   *
   * @param {ArrayBuffer} buffer - The array buffer to extract the header data from
   * @param {Array} supported_versions - An array of possible version specs supported by the decoder
   */
  constructor(buffer = undefined, supported_versions = [Header_v1, Header_v2]) {

    // Open views to the buffer
    var u8 = new Uint8Array( buffer );
    var u16 = new Uint16Array( buffer );
    var u32 = new Uint32Array( buffer );

    // Perform some obvious validations
    if (u16[0] === 0x3142) {
      throw new EndianessError('Your machine does not match the endianess format in the bundle');
    } else if (u16[0] !== 0x4231) {
      throw new MalformedError('Unknown magic header encountered in the header. Expecting 0x4231');
    }

    // Initialize default values when constructing new header
    if (!buffer) {
      this.magic = 0x4231;
      this.version = supported_versions[supported_versions.length-1];

    // Or validate existing values if it already exists
    } else {
       else if (supported_versions.indexOf(this.version) === -1) {
        throw new NotSupportedError(`Unsupported bundle version ${this.version}`);
      }
    }
  }

};
