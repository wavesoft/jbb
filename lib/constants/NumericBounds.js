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

const NumericBounds = {

  UINT8_MIN: 0,
  UINT8_MAX: 256,
  INT8_MIN: -129,
  INT8_MAX: 128,

  UINT16_MIN: 0,
  UINT16_MAX: 65536,
  INT16_MIN: -32769,
  INT16_MAX: 32768,

  UINT32_MIN: 0,
  UINT32_MAX: 4294967296,
  INT32_MIN: -2147483649,
  INT32_MAX: 2147483648,

  //
  // A Float32 number can store approximately 7.225 decimal digits,
  // therefore the minimum accepted loss must be within this range
  //
  FLOAT32_ACCEPTED_LOSS: 1.0E-7

}

export default NumericBounds;
