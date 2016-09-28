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

import WriteTypeBufferView from './WriteTypeBufferView';
import TypeBuffer from './TypeBuffer';

export default class WriteTypeBuffer extends TypeBuffer {

  /**
   * Constructs a new WriteTypeBuffer object that can be used for writing
   * data on an ever-growing buffer in memory.
   *
   * Since expanding the array buffer is quite costly, we are doing so in bulks
   * of large enough data. By default, it will add 16MiB of data on every update.
   * This might be OK in most of the cases, without too much memory going to
   * waste. Of course, if you are going to pack a lot of data, it's a good idea
   * to increase this value, or use the WriteTypeFile class.
   *
   * @param {Number} bytesPerElement - The size of the individual elements
   * @param {Number} bytesPerPage - For how many bytes to grow the buffer when needed
   */
  constructor(bytesPerElement = 1, bytesPerPage = 16777216) {
    super(new ArrayBuffer(bytesPerPage), bytesPerElement, 0);

    this.bytesPerPage = bytesPerPage;
    this.elementsLength = bytesPerPage / bytesPerElement;
  }

  /**
   * Expand the buffer, adding enough pages in order to fit the items
   */
  expand(fitItems=1) {
    let {bytesPerElement, bytesPerPage} = this;
    let fitBytes = fitItems * bytesPerElement;
    let expandBy = Math.ceil( fitBytes / bytesPerPage ) * bytesPerPage;
    let oldBuffer = this.buffer;

    // Create new buffer and update new element length
    this.buffer = new ArrayBuffer( oldBuffer.byteLength + expandBy );
    this.elementsLength = this.buffer.byteLength / bytesPerElement;

    // Clone contents so-far
    new Uint8Array(this.buffer).set( new Uint8Array( oldBuffer) );

    // Regenerate all open views
    this.openViews.forEach((view) => view.regenerate());
  }

  /**
   * Return the index of the next item and advance offset by 1.
   *
   * If there is no more room in the buffer, this function will call
   * `expand` in order to append another page to the buffer.
   *
   * @override
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
   * If there is no more room in the buffer, this function will call
   * `expand` as many times as needed in order to append enough data to fit
   * the new number of items.
   *
   * @override
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
      throw new TypeError(`Trying to open a view with ${viewType.BYTES_PER_ELEMENT} bytes per element, on a stream with ${this.bytesPerElement} bytes per element`);
    }

    // Create a new view and store it for reference
    let view = new WriteTypeBufferView(this, viewType);
    this.openViews.push(view);

    // Ask view to re-generate using our buffer
    view.regenerate();

    // Return it
    return view;
  }

};
