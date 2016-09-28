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

import WriteypeBufferView from './WriteypeBufferView';
import TypeBuffer from './TypeBuffer';

export default class WriteTypeBuffer {

  /**
   * Constructs a new WriteTypeBuffer object that can be used for writing
   * data on an ever-growing buffer in memory.
   *
   * @param {Number} bytesPerElement - The size of the individual elements
   * @param {Number} bytesPerPage - For how many bytes to grow the buffer when needed
   */
  constructor(bytesPerElement = 1, bytesPerPage = 33554432) {
    super(new ArrayBuffer(bytesPerPage), bytesPerElement, 0);

    this.bytesPerPage = bytesPerPage;
    this.elementsLength = bytesPerPage / bytesPerElement;
    this.openViews = [];
  }

  /**
   * Expand the buffer, adding enough pages in order to fit the items
   */
  expand(fitItems=1) {
    let expandBy = Math.ceil( fitItems / this.bytesPerPage ) * this.bytesPerPage;
    let oldBuffer = this.buffer;

    // Create new buffer and copy contents
    this.buffer = new ArrayBuffer( oldBuffer.byteLength + expandBy );
    new Uint8Array(this.buffer).set( new Uint8Array( oldBuffer) );

    // Regenerate all open views
    this.openViews.forEach((view) => view.regenerate());
  }

  /**
   * Return the index of the next item and advance offset by 1
   *
   * @returns {Number} Returns the new item offset
   */
  next() {
    let ofs = this.itemOffset++;
    if (ofs >= this.elementsLength) {
      this.expand();
    }

    return ofs;
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
    if (this.itemOffset >= this.elementsLength) {
      this.expand(itemCount);
    }

    return ofs;
  }

  /**
   * Open a new view using a shared buffer, for the specified type length
   *
   * @param {Class} viewType - The class of the array view (Ex. Uint8Array)
   * @returns {WriteTypeBufferView} Returns a view for accessing the items.
   */
  openView(viewType) {
    if (viewType.BYTES_PER_ELEMENT !== this.bytesPerElement) {
      throw new TypeError(`Trying to open a view with ${viewType.BYTES_PER_ELEMENT}
        bytes per element, on a stream with ${this.bytesPerElement} bytes per element`);
    }

    // Create a new view and store it for reference
    let view = new WriteTypeBufferView(this, viewType);
    this.openViews.push(view);

    // Ask view to re-generate using our buffer
    view.regenerate();

    // Return it
    return view;
  }

  /**
   * Closes a view previously crated with openView
   *
   * @param {WriteTypeBufferView} view - The view to close
   * @param {Boolean} dispose - Dispose the buffer if this was the last view
   */
  closeView(view) {
    let i = this.openViews.indexOf(view);
    if (i < 0) return;
    this.openViews.slice(i, 1);
  }

  /**
   * Release the memory associated with this object
   */
  close() {
    this.buffer = null;
  }

};
