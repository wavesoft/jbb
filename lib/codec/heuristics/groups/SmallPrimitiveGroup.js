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

export class SmallPrimitiveChunk extends Chunk {

  constructor() {
    super();
  }

}

/**
 * A small primitive group (true, false, undefined, null) that can pack
 * consecutive items in a much tighter space, using 2 bits per entry.
 */
export class SmallPrimitiveGroup extends Group {

  constructor() {
    super();
  }

  isValueEndingChunk(value, index) {
    return true;
  }

  isActive(index) {
    return false;
  }

  getChunk() {
    return new SmallPrimitiveChunk(0, 0);
  }

}
