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

import Header from './structs/Header';

import PrimitiveArray from './codec/heuristics/PrimitiveArray';
import NumericArray from './codec/heuristics/NumericArray';

import { analyzeNumericArray } from './legacy';

// import BundleReader from './bundles/BundleReader';
// import BundleWriter from './bundles/BundleWriter';

// import WriteTypedBuffer from './buffers/WriteTypedBuffer';
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

// function test_16() {
//   var buf = new WriteTypedBuffer(2);
//   var view = buf.openView(Uint16Array);

//   console.time('writeBuffer[16]');
//   var count16 = 100000000;
//   while (count16--) {
//     view.put( 0xAABBCCDD );
//   };
//   console.timeEnd('writeBuffer[16]');
//   console.log('Length:', buf.buffer.byteLength, '/ Actual:', buf.byteOffset);

// }

// test_16();

var ar_float = [];
var ar_bigint = [];
var ar_int = [];
var ar_same = [];
var ar_zero = [];

for (var i=0; i<10000; i++) {
  ar_float.push(i*1024*Math.random());
  ar_int.push(1024*Math.random() | 0);
  ar_bigint.push(Math.round(0xFFFFFFFFFFFFFFF * Math.random()));
  ar_zero.push(0);
  ar_same.push(4.124512);
}

// ar_int[5000] = 3.14;

// console.log('wat=', NumericArray.isFloat32( 3 ));
// console.log('is=', NumericArray.isFloat32( 3.14 ));
// console.log('isNot=', NumericArray.isFloat32( Math.PI ));

// console.time('analyzeNumericArray [float 1x]');
// console.log( NumericArray.analyzeNumericArray(ar_float) );
// console.timeEnd('analyzeNumericArray [float 1x]');
// console.time('analyzeNumericArray [int 1x]');
// console.log( NumericArray.analyzeNumericArray(ar_int) );
// console.timeEnd('analyzeNumericArray [int 1x]');
// console.time('analyzeNumericArray [zero 1x]');
// console.log( NumericArray.analyzeNumericArray(ar_zero) );
// console.timeEnd('analyzeNumericArray [zero 1x]');
// console.time('analyzeNumericArray [same 1x]');
// console.log( NumericArray.analyzeNumericArray(ar_same) );
// console.timeEnd('analyzeNumericArray [same 1x]');

// console.time('benchmark');
// var counter = 100000;
// while (counter--) {
//   NumericArray.analyzeNumericArrayX(ar_int);
// };
// console.timeEnd('benchmark');

// console.time('getNumericArrayMinType');
// var count16 = 100000;
// var isFloat;
// while (count16--) {
//   NumericArray.getNumericArrayMinType(ar);
// };
// console.timeEnd('getNumericArrayMinType');

// console.time('getNumericArrayMinType');
// var count16 = 100000;
// while (count16--) {
//   NumericArray.getNumericArrayMinType(ar_float);
// };
// console.timeEnd('getNumericArrayMinType');

console.time('analyzeNumericArray [float]');
var count16 = 100000;
while (count16--) {
  NumericArray.analyzeNumericArray(ar_float);
};
console.timeEnd('analyzeNumericArray [float]');

console.time('analyzeNumericArray [int]');
var count16 = 100000;
while (count16--) {
  NumericArray.analyzeNumericArray(ar_int);
};
console.timeEnd('analyzeNumericArray [int]');

console.time('analyzeNumericArray [bigint]');
var count16 = 100000;
while (count16--) {
  NumericArray.analyzeNumericArray(ar_bigint);
};
console.timeEnd('analyzeNumericArray [bigint]');

console.time('analyzeNumericArray [zero]');
var count16 = 100000;
while (count16--) {
  NumericArray.analyzeNumericArray(ar_zero);
};
console.timeEnd('analyzeNumericArray [zero]');

console.time('analyzeNumericArray [same]');
var count16 = 100000;
while (count16--) {
  NumericArray.analyzeNumericArray(ar_same);
};
console.timeEnd('analyzeNumericArray [same]');

// console.time('old_analyzeNumericArray');
// var count16 = 100000;
// var isFloat;
// while (count16--) {
//   analyzeNumericArray(ar_float, true);
// };
// console.timeEnd('old_analyzeNumericArray');

// console.time('analyzeNumericArray(false)');
// var count16 = 100000;
// var isFloat;
// while (count16--) {
//   NumericArray.analyzeNumericArray(ar, false);
// };
// console.timeEnd('analyzeNumericArray(false)');


// export {
//   BundleReader,
//   BundleWriter
// }