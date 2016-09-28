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

import BundleReader from './bundles/BundleReader';
import BundleWriter from './bundles/BundleWriter';

// import TypeIndex from './streams/TypeIndex';
// import BufferedTypeWriter from './streams/BufferedTypeWriter';

// class ClassAccess {
//   constructor() {
//     this.i = 0;
//   }
//   next() {
//     return this.i++;
//   }
// }

// function functionAccss() {
//   var i = 0;
//   return {
//     next() {
//       return i++;
//     }
//   }
// }

// console.time('classAccess');
// var c1 = new ClassAccess();
// while (c1.next() < 100000000) { };
// console.timeEnd('classAccess');

// console.time('functionAccss');
// var c2 = functionAccss();
// while (c2.next() < 100000000) { };
// console.timeEnd('functionAccss');

// var i8 = new TypeIndex(1);
// var w8 = new BufferedTypeWriter( Uint8Array, i8 );

// console.time('writeUint8');
// var count8 = 100000000;
// while (count8--) {
//   w8.put( 0xBABA );
// };
// console.timeEnd('writeUint8');
// console.log('Length:', w8.buffer.byteLength, '/ Actual:', w8.byteLength);

// var i16 = new TypeIndex(2);
// var w16 = new BufferedTypeWriter( Uint16Array, i16 );

// console.time('writeUint16');
// var count16 = 100000000;
// while (count16--) {
//   w16.put( 0xCACAD1D1 );
// };
// console.timeEnd('writeUint16');
// console.log('Length:', w16.buffer.byteLength, '/ Actual:', w16.byteLength);

export {
  BundleReader,
  BundleWriter
}
