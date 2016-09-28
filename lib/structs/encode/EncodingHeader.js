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

import { IntegrityError } from '../../errors/Common';

/**
 * This class represents the JBB header, allowing bi-directional modifications
 * to the underlying payload.
 */
export default class EncodingHeader {

  /**
   * Construct an empty JBB header
   */
  constructor( versionInfo ) {

    // Populate defaults
    versionInfo.fields.forEach((field) => {
      this[field.name] = field.fixed || 0;
    });

    // Keep version info as a local property
    this._versionInfo = versionInfo;

  }

  /**
   * Compile header buffer and return it
   */
  getBuffer() {

    // Calculate header size
    let headerSize = this.versionInfo.fields.reduce((size, field) => {
      return size + field.size;
    }, 0);

    // Open access views
    let buf = new ArrayBuffer( headerSize );
    let u8 = new Uint8Array(buf);
    let u16 = new Uint16Array(buf);
    let u32 = new Uint32Array(buf);

    // Populate the fields of the buffer according to the header
    // fields in the version specifications
    let ofs = 0;
    this.versionInfo.fields.forEach((field) => {
      let value = this[field.name] || field.fixed || 0;
      switch (field.size) {
        case 1:
          u8[ofs] = value;
          ofs += 1;
          break;

        case 2:
          u16[ofs/2] = value;
          ofs += 2;
          break;

        case 4:
          u32[ofs/4] = value;
          ofs += 4;
          break;

        default:
          if (DEBUG_BUILD || false) {
            throw new IntegrityError('Unexpected `size` property value in header_versions');
          }
      }
    });

    return buf;
  }

};
