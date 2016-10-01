"use strict";

var iter = 100000000;
var v = 41.412;
var a = true;
var b = false;
var c = 0;
var d = 1;

console.time('(c === 0) && b');
var c = iter;
while (c--) {
  if ((c === 0) && b) { }
};
console.timeEnd('(c === 0) && b');

console.time('(d === 1) && b');
var c = iter;
while (c--) {
  if ((d === 1) && b) { }
};
console.timeEnd('(d === 1) && b');

console.time('a && b');
var c = iter;
while (c--) {
  if (a && b) { }
};
console.timeEnd('a && b');

console.time('a || b');
var c = iter;
while (c--) {
  if (a || b) { }
};
console.timeEnd('a || b');

console.time('a && !b');
var c = iter;
while (c--) {
  if (a && !b) { }
};
console.timeEnd('a && !b');

console.time('v === 0');
var c = iter;
while (c--) {
  if (v === 0) { }
};
console.timeEnd('v === 0');

console.time('v !== 0');
var c = iter;
while (c--) {
  if (v !== 0) { }
};
console.timeEnd('v !== 0');

console.time('v !== (v|0)');
var c = iter;
while (c--) {
  if (v !== (v|0)) { }
};
console.timeEnd('v !== (v|0)');

console.time('v === (v|0)');
var c = iter;
while (c--) {
  if (v === (v|0)) { }
};
console.timeEnd('v === (v|0)');

console.time('v % 1 === 0');
var c = iter;
while (c--) {
  if (v % 1 === 0) { }
};
console.timeEnd('v % 1 === 0');
