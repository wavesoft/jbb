# Bundle Format Specifications

:warning: **This document is slightly outdated and is not reflecting the v1.3.0 version of the bundle.**

The bundle format is optimised for use in conjunction with javascript `TypedArray`. Therefore, it's contents are laid out appropriately in order to minimise alignment padding.

That's why the bundle is organised in four streams laid one after the other, as seen in the table below. Each stream has it's own index, and is incremented every time an op-code fetches an item or an array from them.

<table>
    <tr>
        <th>Offset</th>
        <th>Region</th>
    </tr>
    <tr>
        <th>0x0000</th>
        <td>Header (see below)</td>
    </tr>
    <tr>
        <th>0x0018</th>
        <td>64-Bit Elements (<code>Float64</code>)</td>
    </tr>
    <tr>
        <th>...</th>
        <td>32-Bit Elements (<code>Float32</code>, <code>Int32</code>, <code>UInt32</code>)</td>
    </tr>
    <tr>
        <th>...</th>
        <td>16-Bit Elements (<code>Int16</code>, <code>UInt16</code>)</td>
    </tr>
    <tr>
        <th>...</th>
        <td>Object Signatures</td>
    </tr>
    <tr>
        <th>...</th>
        <td>8-Bit Elements (<code>Int8</code>, <code>UInt8</code>)</td>
    </tr>
    <tr>
        <th>...</th>
        <td>Strings (NULL Terminated)</td>
    </tr>
</table>

The entry point of the bundle is the beginning of the 8-bit elements, since all the op-codes are 8-bit long (`UInt8`).

*NOTE:* When using sparse format, the four streams are separated in four different files that can be loaded in parallel.

## Header

_Revision Notice: The previous version of the protocol was using the 0x4233 magic number in the header._ 

The file header is organised as shown below. The `Magic` number is a 16-bit unsigned integer with value `0x4231`, so it's represented as `<31h,42h>` in machines with little-endian architecture or `<42h,31h>` in big-endian. It's therefore possible to detect incompatible endianess before loading the bundle. 

The `Object Table ID` is the ID of the Object Table used to compile this bundle. This table contains the information required to re-construct the objects in the bundle and should be provided by the loader arguments.

<table>
    <tr>
        <th>Offset</th>
        <th>+1</th>
        <th>+2</th>
        <th>+3</th>
        <th>+4</th>
    </tr>    
    <tr>
        <th>0x00</th>
        <td colspan="2">Magic (0x4231)</td>
        <td colspan="2">Object Table ID</td>
    </tr>
    <tr>
        <th>0x04</th>
        <td colspan="2">Protocol Version (1)</td>
        <td colspan="2"><em>Reserved</em></td>
    </tr>
    <tr>
        <th>0x08</th>
        <td colspan="4">64-Bit Table Size (Bytes)</td>
    </tr>
    <tr>
        <th>0x0C</th>
        <td colspan="4">32-Bit Table Size (Bytes)</td>
    </tr>
    <tr>
        <th>0x10</th>
        <td colspan="4">16-Bit Table Size (Bytes)</td>
    </tr>
    <tr>
        <th>0x14</th>
        <td colspan="4">8-Bit Table Size (Bytes)</td>
    </tr>
    <tr>
        <th>0x18</th>
        <td colspan="4">String Table Size (Bytes)</td>
    </tr>
    <tr>
        <th>0x1C</th>
        <td colspan="4">Object Signature Table Size (Bytes)</td>
    </tr>
</table>

## Primitives 

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
    - `PRIMITIVE` - A primitive javascript object, such as `Date`
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

### Table of Known Objects

Most of the times, some objects can be represented with less properties than appear in their instance. In addition, to further reduce the amount of information stored in the file, this information is stored in a separate table, called `Object Table`. 

This table is specific to the application and therefore maintained separately from the `jbb` project. For example, have a look on the [jbb-profile-three](https://github.com/wavesoft/jbb-profile-three) profile.

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

## Opcodes

The following table explains the binary opcodes found in the bundle format:

### Control Opcodes
The control opcodes prefix primitives or other control/information data in the file.

<img src="https://raw.githubusercontent.com/wavesoft/jbb/master/doc/table_OP_CTL.png" />

### Primitive Opcodes
The primitive opcodes define the type of the primitive being encoded:

<img src="https://raw.githubusercontent.com/wavesoft/jbb/master/doc/table_OP_PRIM.png" />

### Object Opcodes
This is a specialisation of the OBJECT primitive.

<img src="https://raw.githubusercontent.com/wavesoft/jbb/master/doc/table_OP_OBJECT.png" />

### Array Opcodes
This is a specialisation of the ARRAY primitive.

<img src="https://raw.githubusercontent.com/wavesoft/jbb/master/doc/table_OP_ARR.png" />

### PRIM_BULK_KNOWN Steering OP-Codes
This is a set of steering instructions for the `PRIM_BULK_KNOWN` array.

<img src="https://raw.githubusercontent.com/wavesoft/jbb/master/doc/table_OP_BULK_KNOWN.png" />

### Other Types
The following tables contain the values of other properties of the opcodes.

<table>
    <tr>
        <td>
            <img src="https://raw.githubusercontent.com/wavesoft/jbb/master/doc/table_NUM_TYPE.png" />
        </td>
        <td colspan="2">
            <img src="https://raw.githubusercontent.com/wavesoft/jbb/master/doc/table_DWS_TYPE.png" />
        </td>
        <td>
            <img src="https://raw.githubusercontent.com/wavesoft/jbb/master/doc/table_BUF_TYPE.png" />
        </td>
    </tr>
    <tr>
        <td>
            <img src="https://raw.githubusercontent.com/wavesoft/jbb/master/doc/table_OT.png" />
        </td>
        <td>
            <img src="https://raw.githubusercontent.com/wavesoft/jbb/master/doc/table_S_TYPE.png" />
        </td>
        <td>
            <img src="https://raw.githubusercontent.com/wavesoft/jbb/master/doc/table_SCALE.png" />
        </td>
        <td>
            <img src="https://raw.githubusercontent.com/wavesoft/jbb/master/doc/table_CHUNK.png" />
        </td>
    </tr>
    <tr>
        <td>
            <img src="https://raw.githubusercontent.com/wavesoft/jbb/master/doc/table_LEN.png" />
        </td>
        <td>
            <img src="https://raw.githubusercontent.com/wavesoft/jbb/master/doc/table_LN.png" />
        </td>
        <td colspan="2"></td>
    </tr>
</table>
