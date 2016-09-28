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

import ReadTypeBufferView from './ReadTypeBufferView';
import TypeBuffer from './TypeBuffer';

export default class ReadTypeBuffer extends TypeBuffer {

  /**
   * Constructs a new ReadTypeBuffer object that can be used to open
   * typed views that share a particular internal structure length.
   *
   * @param {ArrayBuffer} buffer - The buffer shared between the views
   * @param {Number} bytesPerElement - The size of the individual elements
   * @param {Number} byteOffset - The initial offset (must be multiplicand of bytesPerElement)
   */
  constructor(buffer, bytesPerElement = 1, byteOffset = 0) {
    super(buffer, bytesPerElement, byteOffset);
  }

  /**
   * Open a new view using a shared buffer, for the specified type length
   *
   * @param {Class} viewType - The class of the array view (Ex. Uint8Array)
   * @returns {ReadTypeBufferView} Returns a view for accessing the items.
   */
  openView(viewType) {
    if (viewType.BYTES_PER_ELEMENT !== this.bytesPerElement) {
      throw new TypeError(`Trying to open a view with ${viewType.BYTES_PER_ELEMENT} bytes per element, on a stream with ${this.bytesPerElement} bytes per element`);
    }

    // Create a new view and store it for reference
    let view = new ReadTypeBufferView(this, viewType);
    this.openViews.push(view);

    // Ask view to re-generate using our buffer
    view.regenerate();

    // Return it
    return view;
  }

};
