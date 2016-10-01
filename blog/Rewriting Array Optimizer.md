
# Rewriting the array Optimizer

The very core of JBB is built upon performance, and performance is something not very well defined in javascript, since the language is not strongly typed and the run-time compilers try to be smart on the way they optimize the code. This brings us in the unfortunate state to have to spend some considerable time transforming the code around until we have an acceptable performance through the compiler.

Since a while ago, I started [rewriting the JBB core]() in order to make it more readable and to further optimize it. One of it's core components is the numeric array optimizer, so today I am going to spend some time rewriting it and share my optimization experience with you. I hope it's going to be an interesting reading to you, as it was an experience to me.

To start, I follow by heart the [Optimization Killers](https://github.com/petkaantonov/bluebird/wiki/Optimization-killers) document by Petka Antonov, in order to exploit the optimizations in the V8 engine. Even though I think not all cases are covered, it's a very good reference. In addition, the latest ES6/ES7 language extensions are supposed to help towards performance, so I decided to give them a try.

For reference, I am using node v5.4.1, that uses the v4.6.85.31 version of the V8 engine. So expect a slight difference from your numbers if you try the examples with a different node version.

## Base set-up

I installed Babel and Webpack and created my benchmark entry point. I wanted a reasonably big number of iterations since the tiniest performance penalties can have a visible performance impact, so I settled with 100,000. In addition, I wanted a decently big array, and therefore decided to go with 10,000 elements. So my benchmark code looks like this:

```javascript
import ArrayAnalyser from './lib/codec/heuristics/ArrayAnalyser';

// Create the array
var ar_float = [];
for (var i=0; i<10000; i++) {
  ar_float.push(i*1024*Math.random());
}

// Run the benchmark
console.time('benchmark');
var counter = 100000;
while (counter--) {
  ArrayAnalyser.analyzeNumericArray(ar_float);
}
console.timeEnd('benchmark');
```

And just to get a the pure call cost to the empty `ArrayAnalyser.analyzeNumericArray` function we run the benchmark right away:

```
~$ node benchmark.js
benchmark: 2.342ms
```

From this point, I started developing with the optimization constantly in mind. When I was changing something I was passing it through the benchmark to see how much it's affecting the overall performance. So let me share with you my experience.

## Array iteration

The `ArrayAnalyser.analyzeNumericArray` is supposed to extract useful metrics from the array, that can be used for optimally encoding the array. Therefore, it's obvious that we somehow need to iterate over the array and return
an object with the results.

Trying the high-level `Array.reduce` function is one of the common places to start with, so I am going to start with it. Just to add some work to the function, I am going to calculate the minimum and maximum values of the array values in the callback:

```javascript
export default class ArrayAnalyser {

  static analyzeNumericArray(numericArray) {
    return numericArray.reduce((result, value) => {

      // Calculate bounds
      if (value < result.min) result.min = value;
      if (value > result.max) result.max = value;

      return result;
    }, {
      min: Infinity,
      max: -Infinity
    })
  }

}
```

Now let's have a look at the benchmark:

```
~$ node benchmark.js
benchmark: 17855.762ms
```

Almost 18 seconds? I can't say I am surprised. We are frequently accessing object properties and we are always calling a function. Only the call stack operations consume most of this additional time. Let's try to remove the function call by using a for loop.

```javascript
  static analyzeNumericArray(numericArray) {
    let result = {
      min: Infinity,
      max: -Infinity
    };

    for (let i=0; i<numericArray.length; ++i) {
      let value = numericArray[i];

      // Calculate bounds
      if (value < result.min) result.min = value;
      if (value > result.max) result.max = value;
    }

    return result;
  }
```

```
~$ node benchmark.js
benchmark: 1751.028ms
```

Ok, we are definitely on the right path here.

### Notes to self

* Avoid using any of the high-level array methods if you care more about performance than readability.


## Scope variables

Since we are at it, let's try to optimize the current situation event more. Let's see what happens if we try to avoid accessing object properties and use scope variables instead.


```javascript
  static analyzeNumericArray(numericArray) {
    var min = Infinity;
    var max = -Infinity;

    for (let i=0; i<numericArray.length; ++i) {
      let value = numericArray[i];

      // Calculate bounds
      if (value < min) min = value;
      if (value > max) max = value;
    }

    return { min, max };
  }
```

```
~$ node benchmark.js
benchmark: 1997.671ms
```

Wow, so this actually made things worse. Ok, **Note to self: Try to avoid scope variables, use object references instead!**




## Absolute values

Alright, now that we know how to optimally iterate over the array let's start fleshing out the rest of the analyses that we want to include. The next thing we have to check is the difference between consecutive items. If that difference is small enough we can use Delta Encoding to reduce the final size.

We implement this by calculating the absolute difference between two consecutive numbers in the array. To skip one check, we are starting our loop from the second item and every time we are comparing the current with the previous item.

As we learned from the previous experience, calling functions is bad, so instead of calling `Math.abs` we will manually check for negatives and swap the sign.

```javascript
  static analyzeNumericArray(numericArray) {
    let value0 = numericArray[0];
    let result = {
      min: value0,
      max: value0,
      delta: 0
    };

    for (let i=1; i<numericArray.length; ++i) {
      let value = numericArray[i];

      // Calculate bounds
      if (value < result.min) result.min = value;
      if (value > result.max) result.max = value;

      // Calculate difference
      let prev = numericArray[i-1];

      // "Fast" absolute
      let delta = value - prev;
      if (delta < 0) delta = -delta;

      if (delta > result.delta) {
        result.delta = delta;
      }

    }

    return result;
  }
```

```
~$ node benchmark.js
benchmark: 7523.204ms
```

Ok, that's not what I had in mind. We worsened the performance by factor x3, without any serious additions. Let's try to fiddle with our additions until the number comes back down to something reasonable.

To start with, let's make sure we don't add any overhead with the second `numericArray` lookup. So, let's create a variable `_prev` in the object, initialize it with the first value of the array and use this instead of looking up the value of the previous item in the array. Running the benchmark we see:

```
~$ node benchmark.js
benchmark: 7195.044ms
```

That is a tiny bit better, but not really what we were after. Out of curiosity, how much would an actual `Math.abs` call really cost:

```javascript
  static analyzeNumericArray(numericArray) {
    let value0 = numericArray[0];
    let result = {
      min: value0,
      max: value0,
      delta: 0,
      _prev: value0
    };

    for (let i=1; i<numericArray.length; ++i) {
      let value = numericArray[i];

      // Calculate bounds
      if (value < result.min) result.min = value;
      if (value > result.max) result.max = value;

      // Absolute difference
      let delta = Math.abs(value - result._prev);
      if (delta > result.delta) {
        result.delta = delta;
      }

      result._prev = value;
    }

    return result;
  }
```

```
~$ node benchmark.js
benchmark: 3761.592ms
```

You GOT to be kidding! Well, I would say that it makes sense, since this call passes down to the C library, to the OS, or even possibly to the hardware if there is such support. So apparently, **Note to self: use `Math.abs` wherever possible!**




## Testing for floats

We also want to check if an array contains only integers, only floats, or a combination of these two. Knowing this we can correctly pick the optimization algorithm to use in a next step.

I am aware of two ways of checking if a number is integer:

* Using the built-in `Number.isInteger(x)`
* If the remainder with 1 is zero : `x % 1 === 0`
* If the result of the bitwise or with 0 (aka integer part) is equal to the number : `x === (x|0)`

I will add a constant check in the beginning of the loop and run some checks with either solutions, like so:

```javascript
    ...
    for (let i=1; i<numericArray.length; ++i) {
      let value = numericArray[i];
      let isInt = Number.isInteger(x);
      // or ..
      let isInt = value % 1 === 0;
      // or ..
      let isInt = value === (value|0);
      ...
    }
    ...
```

Running the benchmarks with the three above solutions we have the following results:

```
~$ node benchmark.js
benchmark: 39121.737ms

~$ node benchmark.js
benchmark: 17753.562ms

~$ node benchmark.js
benchmark: 6111.839ms
```

It was a suprise to me to see the `Number.isInteger` failing so badly, judging from the performant results of `Math.abs` that we saw erlier. I am assuming that this function operates on floating-point numeric types, having some serious performance impact at type casting.

So, te option 3 is clearly our winner, right? I would say so, but but be aware that there is a catch. According to [ECMAScript specifications](http://www.ecma-international.org/ecma-262/5.1/#sec-11.10) the binary bitwise operation reults on a 32-bit signed integer. This means that if you are trying to test any number bigger than the positive 32-bit signed integer, this quirk will fail. For example:

```
~$ node
> 0x7fffffff|0
2147483647
> 0x8fffffff|0
-1879048193
> 0xffffffffff|0
-1
```

So we need a fast alternative for big numbers. But how can we avoid adding additional cost? I am going to rely on the V8 inline optimisations and create a utility function:

```javascript
  static isFloat(number) {
    if ((number > 0x7FFFFFFF) || (number < -0x7FFFFFFE)) {
      return number % 1 !== 0;
    } else {
      return number !== (number|0);
    }
  }
```

This function is small enough and not polymorphic, therefore it will get inlined by the compiler when used. So let's run the benchmarks again using our new function:

```
~$ node benchmark.js
benchmark: 6597.833ms
```

That looks good. Our custom function is proven to be 6 times faster than the native implementtion. However I am expecting this to be addressed in the newer V8 versions. Till then, **Note
