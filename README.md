# Javascript Binary Bundles (.jbb)

Javascript Binary Bundle is a binary bundle format for packing data structures for the web. To be more precise, `jbb` is a javascript serialization format with the ability to embed resources.

## Getting Started

You will need the `jbb` compiler and some compile profile (such as `jbb-profile-three`). The profile specifies the object table to be used and the loading process to use:

```
npm install -g jbb jbb-profile-three
```

This will make the `jbb` compiler available to your system. You can then compile your bundles:

```
jbb -p three -o bundle.jbb /path/to/resource.js ...
```

# Bundle Format Specifications

The binary bundle is a compacted representation of javascript objects, with size and speed optimisations. In addition, it offers a symbol import/export functionality for sharing resources among different bundles.

The data in a bundle file are organised in _Primitives_, each one being one of the following:

* __SIMPLE__ - A simple primitive, that being:
    - `UNDEFINED` - The value `undefined`
    - `NULL` - The value `null`
    - `FALSE` - The boolean value `false`
    - `TRUE` - The boolean value `true`
    - `NAN` - The value `NaN`
* __ARRAY__ - Array of primitives, further specialised as:
    - `EMPTY` - Empty Array
    - `DELTA` - Delta-Encoded TypedArray
    - `REPEATED` - Repeated TypedArray
    - `DOWNSCALED` - Downscaled TypedArray
    - `SHORT`  - Short TypedArray (1-256 numbers)
    - `PRIMITIVE` - Primitive Array (further optimised in chunks)
    - `RAW` - RAW Typed Array
* __OBJECT__ - A Javascript object, further specialised as:
    - `PREDEFINED` - A predefined object from the object table
    - `PLAIN` - A plain object
* __BUFFER__ - Buffered contents, further specialised as:
    - `STRING_LATIN` - A string in LATIN-1 (ISO-8859-1) encoding
    - `STRING_UTF8` - A string un UTF-8 encoding
    - `BUF_IMAGE` - An embedded image (ImageDOMElement)
    - `BUF_SCRIPT` - An embedded script (ScriptDOMElement)
    - `RESOURCE` - An arbitrary payload embedded as resource
* __NUMBER__ - A single number
* __IMPORT__ - Import a primitive from another bundle
* __REF__ - Reference to a primitive in the same bundle

The object primitives are composites. Internally the use array primitives to represent the series of property names and the property values. Therefore the object properties can be further optimised by the array optimisation functions.

## Optimisations

There are a series of optimisations used in this file format. The goal is to have the smallest file size possible that will not impact the parsing speed. This means avoiding `for` loops, using TypedArrays when possible and de-duplicating entries in the file. In addition, to further reduce the file size, the type of the TypedArray is chosen dynamically by analysing the values of the array.

### De-duplication

De-duplication occurs only for the `OBJECT` primitives, by internally referencing same or similar object in the bundle. The detection of the duplicate items is achieved either by reference or by value:

* __By Reference__ is enabled by default and looks for exact matches of the object in the object table.
* __By Value__ is enabled by the user (because it slows down the compilation time), and looks for exact match of the values of the object in the object table.

### Compression

In addition to de-duplication, there are some cases that we can benefit from numerical type downscaling, with a minor performance loss. Therefore compression occurs only on the `ARRAY` primitives:

* __Delta Encoding__ is used when the values in the array have a small difference (delta) between them. In this case, they are encoded as an array of smaller type size. For instance `Int32Array` can be encoded as `Int16Array` or even `Int8Array` if the differences are small. This can also be used with `Float32Array` in conjunction with scaled integers (ex. ±`Int16`*0.001).
* __Downscaling__ is used when the values of an array are able to fit on an array with smaller type. Therefore an `Int32Array` can be downscaled to `Int16Array` or event `Int8Array`. The original array type is preserved and restored at decoding.
* __Repeated__ is used when the values of the array is simply a single value repeated.
* __Chunked Primitive__ is used when an array mixes primitives and numerical values. The encoding algorithm will try to split the array in chunks if similar types that can be further optimised with one of the above techniques.



