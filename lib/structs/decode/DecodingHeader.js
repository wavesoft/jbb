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

if (DEBUG_BUILD || false) {
  import { IntegrityError } from '../errors/Common';
}

import Header_v1 from '../header_versions/Header_v1';
import Header_v2 from '../header_versions/Header_v2';

import { MalformedError, EndianessError } from '../../errors/Read';
import FileFormatConstants from '../../constants/FileFormatConstants';

/**
 * This class represents the JBB header, allowing bi-directional modifications
 * to the underlying payload.
 */
export default class DecodingHeader {

  /**
   * Construct a new JBB Header
   *
   * @param {ArrayBuffer} buffer - The array buffer to extract the header data from
   * @param {Array} supportedVersions - An array of possible version specs supported by the decoder
   */
  constructor(buffer = undefined, supportedVersions = [Header_v1, Header_v2]) {

    // Open views to the buffer
    let u8 = new Uint8Array( buffer );
    let u16 = new Uint16Array( buffer );
    let u32 = new Uint32Array( buffer );

    // Perform some obvious validations on the fixed part of the header
    if (u16[0] !== FileFormatConstants.MAGIC_NUMBER) {
      let swapMagic = ((u16[0] & 0x00FF) << 8) || ((u[16] >> 8) & 0x00FF);
      if (swapMagic === FileFormatConstants.MAGIC_NUMBER) {
        throw new EndianessError('Your machine\'s and the bundle\'s endianess types do not match');
      } else {
        throw new MalformedError('Unexpected magic number encountered in the bundle header');
      }
    }

    // Iterate over header versions and try to match the correct one
    let matchedVersion = supportedVersions.reduce((matchedInfo, versionInfo) => {
      let ofs = 0;
      let applyFields = [];
      let isMatch = true;

      // If we already found something, return it
      if (matchedInfo) {
        return matchedInfo;
      }

      // Extract fields and compare fixed fields for match
      versionInfo.fields.forEach((field) => {
        let value = 0;
        switch (field.size) {
          case 1:
            value = u8[ofs];
            ofs += 1;
            break;

          case 2:
            value = u16[ofs/2];
            ofs += 2;
            break;

          case 4:
            value = u32[ofs/4];
            ofs += 4;
            break;

          default:
            if (DEBUG_BUILD || false) {
              throw new IntegrityError('Unexpected `size` property value in header_versions');
            }
        }

        // Check for incompatible fixed field values
        if ((field.fixed !== undefined) && (field.fixed !== value)) {
          isMatch = false;
          return;
        }

        // Keep this field for later application
        applyFields.push([ field.name, value ]);
      });

      // If we have a match, return it
      if (isMatch) {
        return {
          fields: applyFields,
          version: versionInfo
        }
      }

      // Otherwise keep returning null
      return null;

    }, null)

    // Check if nothing found
    if (!matchedVersion) {
      throw new NotSupportedError('Unsupported bundle version');
    }

    // Apply fields
    matchedVersion.fields.forEach(([key, value]) => {
      this[key] = value;
    })

  }

};
