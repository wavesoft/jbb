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

import NumericBounds from './NumericBounds';

/**
 * Constants specific to the JBB file format
 */
const NumericTypes = {

  // Base numeric constants
  UINT8:   { id: 0, signed: false, min: NumericBounds.UINT8_MIN,  max: NumericBounds.UINT8_MAX,  upscale: [] },
  INT8:    { id: 1, signed: true,  min: NumericBounds.INT8_MIN,   max: NumericBounds.INT8_MAX,   upscale: [] },
  UINT16:  { id: 2, signed: false, min: NumericBounds.UINT16_MIN, max: NumericBounds.UINT16_MAX, upscale: [] },
  INT16:   { id: 3, signed: true,  min: NumericBounds.INT16_MIN,  max: NumericBounds.INT16_MAX,  upscale: [] },
  UINT32:  { id: 4, signed: false, min: NumericBounds.UINT32_MIN, max: NumericBounds.UINT32_MAX, upscale: [] },
  INT32:   { id: 5, signed: true,  min: NumericBounds.INT32_MIN,  max: NumericBounds.INT32_MAX,  upscale: [] },
  FLOAT32: { id: 6, signed: true },
  FLOAT64: { id: 7, signed: true },

  // General numeric constants
  NUMERIC: { id: 8, unsigned: true, min: -Infinity, max: Infinity, upscale: [] },
  UNKNOWN: { id: 9, unsigned: true, min: -Infinity, max: Infinity, upscale: [] },
  NAN: { id: 10 }

};

/**
 * Define upscaling candidates
 */
NumericTypes.UNKNOWN.upscale.push( NumericTypes.UINT8 );
NumericTypes.UNKNOWN.upscale.push( NumericTypes.INT8 );
NumericTypes.UNKNOWN.upscale.push( NumericTypes.UINT16 );
NumericTypes.UNKNOWN.upscale.push( NumericTypes.INT16 );
NumericTypes.UNKNOWN.upscale.push( NumericTypes.UINT32 );
NumericTypes.UNKNOWN.upscale.push( NumericTypes.INT32 );
NumericTypes.UNKNOWN.upscale.push( NumericTypes.FLOAT32 );
NumericTypes.UNKNOWN.upscale.push( NumericTypes.FLOAT64 );

NumericTypes.NUMERIC.upscale.push( NumericTypes.UINT8 );
NumericTypes.NUMERIC.upscale.push( NumericTypes.INT8 );
NumericTypes.NUMERIC.upscale.push( NumericTypes.UINT16 );
NumericTypes.NUMERIC.upscale.push( NumericTypes.INT16 );
NumericTypes.NUMERIC.upscale.push( NumericTypes.UINT32 );
NumericTypes.NUMERIC.upscale.push( NumericTypes.INT32 );
NumericTypes.NUMERIC.upscale.push( NumericTypes.FLOAT32 );
NumericTypes.NUMERIC.upscale.push( NumericTypes.FLOAT64 );

NumericTypes.UINT8.upscale.push( NumericTypes.INT8 );
NumericTypes.UINT8.upscale.push( NumericTypes.UINT16 );
NumericTypes.UINT8.upscale.push( NumericTypes.INT16 );
NumericTypes.UINT8.upscale.push( NumericTypes.UINT32 );
NumericTypes.UINT8.upscale.push( NumericTypes.INT32 );
NumericTypes.UINT8.upscale.push( NumericTypes.FLOAT64 );

NumericTypes.INT8.upscale.push( NumericTypes.INT16 );
NumericTypes.INT8.upscale.push( NumericTypes.INT32 );
NumericTypes.INT8.upscale.push( NumericTypes.FLOAT64 );

NumericTypes.UINT16.upscale.push( NumericTypes.INT16 );
NumericTypes.UINT16.upscale.push( NumericTypes.UINT32 );
NumericTypes.UINT16.upscale.push( NumericTypes.INT32 );
NumericTypes.UINT16.upscale.push( NumericTypes.FLOAT64 );

NumericTypes.INT16.upscale.push( NumericTypes.INT32 );
NumericTypes.INT16.upscale.push( NumericTypes.FLOAT64 );

NumericTypes.UINT32.upscale.push( NumericTypes.INT32 );
NumericTypes.UINT32.upscale.push( NumericTypes.FLOAT64 );

NumericTypes.INT32.upscale.push( NumericTypes.FLOAT64 );


export default NumericTypes;
