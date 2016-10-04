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

import Group from './Group';
import Chunk from './Chunk';

export class NumericChunk extends Chunk {

  constructor() {
    super();
  }

}

/**
 * A primitive group is an array of primitives that share some common
 * optimization property.
 *
 * This is the base class without any functionality. Each individual group
 * should implement it accordingly.
 */
export class NumericGroup extends Group {

  constructor() {
    super();
    this.startIndex = -1;
    this.endIndex = -1;
  }

  isValueEndingChunk(value, index) {
    if (typeof value === 'number') {
      if (this.startIndex === -1) {
        this.startIndex = index;
      }
      this.endIndex = index;
      return false;
    } else if (this.startIndex !== -1) {
      return true;
    }
  }

  isActive(index) {
    return (this.startIndex !== -1);
  }

  getChunk() {
    return new NumericChunk(this.startIndex, this.endIndex);
  }

}
