"use strict";
/**
 * DELETE ME - DELETE ME - DELETE ME - DELETE ME - DELETE ME - DELETE ME
 */

const FLOAT32_POS = 3.40282347e+38; // largest positive number in float32
const FLOAT32_NEG = -3.40282346e+38; // largest negative number in float32
const FLOAT32_SMALL = 1.175494350e-38; // smallest number in float32

/* Note that all these values are exclusive, for positive test (ex v < UING8_MAX) */

const UINT8_MAX   = 256; // largest positive unsigned integer on 8-bit
const UINT16_MAX  = 65536; // largest positive unsigned integer on 16-bit
const UINT32_MAX  = 4294967296;  // largest positive unsigned integer on 32-bit

const INT8_MIN    = -129; // largest negative signed integer on 8-bit
const INT8_MAX    = 128; // largest positive signed integer on 8-bit
const INT16_MIN   = -32769; // largest negative signed integer on 16-bit
const INT16_MAX   = 32768; // largest positive signed integer on 16-bit
const INT32_MIN   = -2147483649; // largest negative signed integer on 16-bit
const INT32_MAX   = 2147483648; // largest positive signed integer on 16-bit

/* Version of binary bundle */

const VERSION     = (( 1 /* Major */ )<<8)|( 2 /* Minor */ );

/**
 * If this constant is true, the packing functions will do sanity checks,
 * which might increase the build time.
 */
const SAFE = 1;

/**
 * Numerical types
 */
var NUMTYPE = {
  // For protocol use
  UINT8:   0, INT8:    1,
  UINT16:  2, INT16:   3,
  UINT32:  4, INT32:   5,
  FLOAT32: 6, FLOAT64: 7,
  // For internal use
  NUMERIC: 8, UNKNOWN: 9, NAN: 10
};

/**
 * Numerical length types
 */
var NUMTYPE_LN = {
  UINT16: 0,
  UINT32 : 1
};
var NUMTYPE_LEN = {
  UINT8:   0,
  UINT16:  1,
  UINT32:  2,
  FLOAT64: 3
};

/**
 * Log flags
 */
var LOG = {
  PRM:  0x0001, // Primitive messages
  ARR:  0x0002, // Array messages
  CHU:  0x0004, // Array Chunk
  STR:  0x0008, // String buffer
  IREF:   0x0010, // Internal reference
  XREF:   0x0020, // External reference
  OBJ:  0x0040, // Object messages
  EMB:  0x0080, // Embedded resource
  PLO:  0x0100, // Simple objects
  BULK:   0x0200, // Bulk-encoded objects
  SUMM:   0x2000, // Log summary
  WRT:  0x4000, // Debug writes
  PDBG:   0x8000, // Protocol debug messages
};

/**
 * Log prefix chunks
 */
var LOG_PREFIX_STR = {
  0x0001  : 'PRM',
  0x0002  : 'ARR',
  0x0004  : 'CHU',
  0x0008  : 'STR',
  0x0010  : 'IRF',
  0x0020  : 'XRF',
  0x0040  : 'OBJ',
  0x0080  : 'EMB',
  0x0100  : 'PLO',
  0x0200  : 'BLK',
  0x2000  : 'SUM',
  0x8000  : 'DBG',
};

/**
 * Numerical type classes
 */
var NUMTYPE_CLASS = [
  Uint8Array,
  Int8Array,
  Uint16Array,
  Int16Array,
  Uint32Array,
  Int32Array,
  Float32Array,
  Float64Array
];

/**
 * Downscaling numtype conversion table from/to
 */
var NUMTYPE_DOWNSCALE = {
  FROM: [
    NUMTYPE.UINT16,
    NUMTYPE.INT16 ,
    NUMTYPE.UINT32,
    NUMTYPE.INT32 ,
    NUMTYPE.UINT32,
    NUMTYPE.INT32 ,

    NUMTYPE.FLOAT32,
    NUMTYPE.FLOAT32,
    NUMTYPE.FLOAT32,
    NUMTYPE.FLOAT32,

    NUMTYPE.FLOAT64,
    NUMTYPE.FLOAT64,
    NUMTYPE.FLOAT64,
    NUMTYPE.FLOAT64,

    NUMTYPE.FLOAT64,
  ],
  TO: [
    NUMTYPE.UINT8  ,
    NUMTYPE.INT8   ,
    NUMTYPE.UINT8  ,
    NUMTYPE.INT8   ,
    NUMTYPE.UINT16 ,
    NUMTYPE.INT16  ,

    NUMTYPE.UINT8  ,
    NUMTYPE.INT8   ,
    NUMTYPE.UINT16 ,
    NUMTYPE.INT16  ,

    NUMTYPE.UINT8  ,
    NUMTYPE.INT8   ,
    NUMTYPE.UINT16 ,
    NUMTYPE.INT16  ,

    NUMTYPE.FLOAT32
  ]
};

/**
 * Delta-Encoding for integers
 */
var NUMTYPE_DELTA_INT = {
  FROM: [
    NUMTYPE.UINT16,
    NUMTYPE.INT16 ,
    NUMTYPE.UINT32,
    NUMTYPE.INT32 ,
    NUMTYPE.UINT32,
    NUMTYPE.INT32 ,
  ],
  TO: [
    NUMTYPE.INT8 ,
    NUMTYPE.INT8 ,
    NUMTYPE.INT8 ,
    NUMTYPE.INT8 ,
    NUMTYPE.INT16,
    NUMTYPE.INT16,
  ]
};

/**
 * Delta-Encoding for floats
 */
var NUMTYPE_DELTA_FLOAT = {
  FROM: [
    NUMTYPE.FLOAT32,
    NUMTYPE.FLOAT32,
    NUMTYPE.FLOAT64,
    NUMTYPE.FLOAT64,
  ],
  TO: [
    NUMTYPE.INT8 ,
    NUMTYPE.INT16,
    NUMTYPE.INT8 ,
    NUMTYPE.INT16,
  ]
};

/**
 * Delta encoding scale factor
 */
var DELTASCALE = {
  S_001 : 1,  // Divide by 100 the value
  S_1   : 2,  // Keep value as-is
  S_R   : 3,  // Multiply by 127 on 8-bit and by 32768 on 16-bit
  S_R00 : 4,  // Multiply by 12700 on 8-bit and by 3276800 on 16-bit
};

/**
 * Control Op-Codes
 */
var CTRL_OP = {
  ATTRIB  : 0x80,   // Attribute
  EXPORT  : 0xF8,   // External Export
  EMBED   : 0xF9,   // Embedded resource
};

/**
 * Primitive Op-Codes
 */
var PRIM_OP = {
  ARRAY:    0x00,   // Array
  OBJECT:   0x80,   // Object / Plain Object [ID=0]
  BUFFER:   0xC0,   // Buffer
  REF:    0xE0,   // Internal Reference
  NUMBER:   0xF0,   // Number
  SIMPLE:   0xF8,   // Simple
  SIMPLE_EX:  0xFC, // Extended simple primitive
  IMPORT:   0xFE,   // External Import
};

/**
 * Object Op-Codes
 */
var OBJ_OP = {
  KNOWN_5:    0x00, // Known object (5-bit)
  KNOWN_12:     0x20, // Known object (12-bit)
  PLAIN_LOOKUP: 0x30, // A plain object from lookup table
  PLAIN_NEW:    0x3F, // A new plain object that will define a lookup entry
  PRIMITIVE:    0x38,   // Primitive object
  PRIM_DATE:    0x38
};

/**
 * Primitive object op-codes
 */
var OBJ_PRIM = {
  DATE:       0x00,   // A DATE primitive
};

/**
 * Array Op-Codes
 */
var ARR_OP = {
  NUM_DWS:     0x00, // Downscaled Numeric Type
  NUM_DELTA_INT:   0x20, // Delta-Encoded Integer Array
  NUM_DELTA_FLOAT: 0x30, // Delta-Encoded Float Array
  NUM_REPEATED:    0x40, // Repeated Numeric Value
  NUM_RAW:     0x50, // Raw Numeric Value
  NUM_SHORT:     0x60, // Short Numeric Value
  PRIM_REPEATED:   0x68, // Repeated Primitive Value
  PRIM_RAW:      0x6A, // Raw Primitive Array
  PRIM_BULK_PLAIN: 0x6E, // Bulk Array of Plain Objects
  PRIM_SHORT:    0x6F, // Short Primitive Array
  PRIM_CHUNK:    0x78, // Chunked Primitive ARray
  PRIM_BULK_KNOWN: 0x7C, // Bulk Array of Known Objects
  EMPTY:       0x7E, // Empty Array
  PRIM_CHUNK_END:  0x7F, // End of primary chunk
};

/**
 * Array chunk types
 */
var ARR_CHUNK = {
  PRIMITIVES:  1, // Two or more primitives
  REPEAT:    2, // Repeated of the same primitive
  NUMERIC:   3, // A numeric TypedArray
  BULK_PLAIN:  4, // A bulk of many plain objects
  BULK_KNOWN:  5, // A bulk of known objects
};

var _ARR_CHUNK = [
  undefined,
  'PRIMITIVES',
  'REPEAT',
  'NUMERIC',
  'BULK_PLAIN',
  'BULK_KNOWN'
];

/**
 * Simple primitives
 */
var PRIM_SIMPLE = {
  UNDEFINED:  0,
  NULL:     1,
  FALSE:    2,
  TRUE:     3
};

/**
 * Extended simple primitives
 */
var PRIM_SIMPLE_EX = {
  NAN:  0,
};

/**
 * Buffer primitive MIME Types
 */
var PRIM_BUFFER_TYPE = {
  STRING_LATIN:    0,
  STRING_UTF8:   1,
  BUF_IMAGE:     2,
  BUF_SCRIPT:    3,
  BUF_AUDIO:     4,
  BUF_VIDEO:     5,
  RESOURCE:      7,
};

/**
 * BULK_KNOWN Array encoding operator codes
 */
var PRIM_BULK_KNOWN_OP = {
  LREF_7: 0x00, // Local reference up to 7bit
  LREF_11:0xF0, // Local reference up to 11bit
  LREF_16:0xFE, // Local reference up to 16bit
  IREF: 0xE0, // Internal reference up to 20bit
  XREF: 0xFF, // External reference
  DEFINE: 0x80, // Definition up to 5bit
  REPEAT: 0xC0, // Repeat up to 4bit
};

/**
 * String representation of numerical type for debug messages
 */
var _NUMTYPE = [
  'UINT8',
  'INT8',
  'UINT16',
  'INT16',
  'UINT32',
  'INT32',
  'FLOAT32',
  'FLOAT64',
  'NUMERIC',
  'UNKNOWN',
  'NaN',
];
var _NUMTYPE_DOWNSCALE_DWS = [
  'UINT16 -> UINT8',
  'INT16 -> INT8',
  'UINT32 -> UINT8',
  'INT32 -> INT8',
  'UINT32 -> UINT16',
  'INT32 -> INT16',
  'FLOAT32 -> UINT8',
  'FLOAT32 -> INT8',
  'FLOAT32 -> UINT16',
  'FLOAT32 -> INT16',
  'FLOAT64 -> UINT8',
  'FLOAT64 -> INT8',
  'FLOAT64 -> UINT16',
  'FLOAT64 -> INT16',
  'FLOAT64 -> FLOAT32'
];
var _NUMTYPE_DOWNSCALE_DELTA_INT = [
  'UINT16 -> INT8',
  'INT16 -> INT8',
  'UINT32 -> INT8',
  'INT32 -> INT8',
  'UINT32 -> INT16',
  'INT32 -> INT16'
];
var _NUMTYPE_DOWNSCALE_DELTA_FLOAT = [
  'FLOAT32 -> INT8',
  'FLOAT32 -> INT16',
  'FLOAT64 -> INT8',
  'FLOAT64 -> INT16 '
];


/**
 * Calculate and return the numerical type and the scale to
 * apply to the float values given in order to minimize the error.
 */
function getFloatScale( values, min, max, error ) {
  var mid = (min + max) / 2, range = mid - min,
    norm_8 = (range / INT8_MAX),
    norm_16 = (range / INT16_MAX),
    ok_8 = true, ok_16 = true,
    er_8 = 0, er_16 = 0,
    v, uv, er;

  // For the values given, check if 8-bit or 16-bit
  // scaling brings smaller error value
  for (var i=0, l=values.length; i<l; ++i) {

    // Test 8-bit scaling
    if (ok_8) {
      v = Math.round((values[i] - mid) / norm_8);
      uv = v * norm_8 + mid;
      er = (uv-v)/v;
      if (er > er_8) er_8 = er;
      if (er >= error) {
        ok_8 = false;
      }
    }

    // Test 16-bit scaling
    if (ok_16) {
      v = Math.round((values[i] - mid) / norm_16);
      uv = v * norm_16 + mid;
      er = (uv-v)/v;
      if (er > er_16) er_16 = er;
      if (er >= error) {
        ok_16 = false;
      }
    }

    if (!ok_8 && !ok_16)
      return [ 0, NUMTYPE.UNKNOWN ];
  }

  // Pick most appropriate normalization factor
  if (ok_8 && ok_16) {
    if (er_8 < er_16) {
      return [ norm_8, NUMTYPE.INT8 ];
    } else {
      return [ norm_16, NUMTYPE.INT16 ];
    }
  } else if (ok_8) {
    return [ norm_8, NUMTYPE.INT8 ];
  } else if (ok_16) {
    return [ norm_16, NUMTYPE.INT16 ];
  } else {
    return [ 0, NUMTYPE.UNKNOWN ];
  }

}


/**
 * Get the smallest possible numeric type fits this numberic bounds
 *
 * @param {number} vmin - The minimum number to check
 * @param {number} vmax - The maximum number to check
 * @param {boolean} is_float - Set to 'true' to assume that the numbers are float
 * @return {NUMTYPE} - The numerical type to rerutn
 */
function getNumType( vmin, vmax, is_float ) {
  if (typeof vmin !== "number") return NUMTYPE.NAN;
  if (typeof vmax !== "number") return NUMTYPE.NAN;
  if (isNaN(vmin) || isNaN(vmax)) return NUMTYPE.NAN;

  // If float, test only-floats
  if (is_float) {

    // Try to find smallest value for float32 minimum tests
    var smallest;
    if (vmin === 0) {
      // vmin is 0, which makes vmax positive, so
      // test vmax for smallest
      smallest = vmax;
    } else if (vmax === 0) {
      // if vmax is 0, it makes vmin negative, which
      // means we should test it's positive version
      smallest = -vmax;
    } else {
      // if vmin is positive, both values are positive
      // so get the smallest for small test (vmin)
      if (vmin > 0) {
        smallest = vmin;

      // if vmax is negative, both values are negative
      // so get the biggest for small test (vmax)
      } else if (vmax < 0) {
        smallest = -vmax;

      // if vmin is negative and vmax positive, get the
      // smallest of their absolute values
      } else if ((vmin < 0) && (vmax > 0)) {
        smallest = -vmin;
        if (vmax < smallest) smallest = vmax;
      }
    }

    // Test if float number fits on 32 or 64 bits
    if ((vmin > FLOAT32_NEG) && (vmax < FLOAT32_POS) && (smallest > FLOAT32_SMALL)) {
      return NUMTYPE.FLOAT32;
    } else {
      return NUMTYPE.FLOAT64;
    }

  }

  // If we have a negative value, switch to signed tests
  if ((vmax < 0) || (vmin < 0)) {

    // Get absolute maximum of bound values
    var amax = -vmin;
    if (vmax < 0) {
      if (-vmax > amax) amax = -vmax;
    } else {
      if (vmax > amax) amax = vmax;
    }

    // Test for integer bounds
    if (amax < INT8_MAX) {
      return NUMTYPE.INT8;

    } else if (amax < INT16_MAX) {
      return NUMTYPE.INT16;

    } else if (amax < INT32_MAX) {
      return NUMTYPE.INT32;

    } else {
      return NUMTYPE.FLOAT64;

    }

  // Otherwise perform unsigned tests
  } else {

    // Check for unsigned cases
    if (vmax < UINT8_MAX) {
      return NUMTYPE.UINT8;

    } else if (vmax < UINT16_MAX) {
      return NUMTYPE.UINT16;

    } else if (vmax < UINT32_MAX) {
      return NUMTYPE.UINT32;

    } else {
      return NUMTYPE.FLOAT64;

    }

  }

}

/**
 * Analyze the specified numeric array and return analysis details
 *
 * @param {Array} v - The array to analyze
 * @param {Boolean} include_costly - Include additional (costly) operations
 * @return {object} - Return an object with the analysis results
 */
export function analyzeNumericArray( v, include_costly ) {
  var min = v[0], max = min, is_int = false, is_float = false, is_same = true,
    dmin=0, dmax=0, is_dfloat = false,
    mean=0, n_type=0, d_mode=0, f_type=[0, NUMTYPE.UNKNOWN],
    c_same=0, same=0,
    s_min = [min,min,min,min,min], s_min_i=0, s_max = [min,min,min,min,min], s_max_i=0, samples,
    a, b, d_type, cd, cv, lv = v[0];

  // Anlyze array items
  for (var i=0, l=v.length; i<l; ++i) {
    cv = v[i];

    // Exit on non-numeric cases
    if (typeof cv !== 'number')
      return null;

    // Update mean
    mean += cv;

    // Include costly calculations if enabled
    if (include_costly) {

      // Update delta
      if (i !== 0) {
        cd = lv - cv; if (cd < 0) cd = -cd;
        if (i === 1) {
          dmin = cd;
          dmax = cd;
        } else {
          if (cd < dmin) dmin = cd;
          if (cd > dmax) dmax = cd;
        }

        // Check if delta is float
        if ((cd !== 0) && (cd % 1 !== 0))
          is_dfloat = true;
      }

      // Update bounds & Keep samples
      if (cv < min) {
        min = cv;
        s_min[s_min_i] = cv;
        if (++s_min_i>5) s_min_i=0;
      }
      if (cv > max) {
        max = cv;
        s_max[s_max_i] = cv;
        if (++s_max_i>5) s_max_i=0;
      }

    } else {

      // Update bounds
      if (cv < min) min = cv;
      if (cv > max) max = cv;

    }

    // Check for same values
    if (cv === lv) {
      c_same++;
    } else {
      if (c_same > same)
        same = c_same;
      is_same = false;
      c_same = 0;
    }

    // Keep last value
    lv = cv;

    // Skip zeros from further analysis
    if (cv === 0) continue;

    // Update integer/float
    if (cv % 1 !== 0) {
      is_float = true;
    } else {
      is_int = true;
    }

  }

  // Finalize counters
  if (c_same > same) same = c_same;
  mean /= v.length;

  // Guess numerical type
  n_type = getNumType( min, max, is_float );

  // Calculate delta-encoding details
  d_type = NUMTYPE.UNKNOWN;
  if (include_costly) {
    if (!is_float && is_int) {

      // INTEGERS : Use Delta-Encoding (d_mode=1)

      if ((dmin > INT8_MIN) && (dmax < INT8_MAX)) {
        d_type = NUMTYPE.INT8;
        d_mode = 1;
      } else if ((dmin > INT16_MIN) && (dmax < INT16_MAX)) {
        d_type = NUMTYPE.INT16;
        d_mode = 1;
      } else if ((dmin > INT32_MIN) && (dmax < INT32_MAX)) {
        d_type = NUMTYPE.INT32;
        d_mode = 1;
      }

    } else if (is_float) {

      // FLOATS : Use Rebase Encoding (d_mode=2)

      // Get a couple more samples
      samples = [].concat(
        s_min, s_max,
        [
          v[Math.floor(Math.random()*v.length)],
          v[Math.floor(Math.random()*v.length)],
          v[Math.floor(Math.random()*v.length)],
          v[Math.floor(Math.random()*v.length)],
          v[Math.floor(Math.random()*v.length)],
        ]
      );

      // Calculate float scale
      f_type = getFloatScale( v, min, max, 0.01 );
      if (f_type[1] != NUMTYPE.UNKNOWN) {
        d_type = f_type[1];
        d_mode = 2;
      }

    }
  }

  // Based on information detected so far, populate
  // the analysis results
  return {

    // Get numeric type
    'type'    : n_type,
    'delta_type': d_type,

    // Percentage of same items
    'psame'   : same / v.length,

    // Log numeric bounds
    'min'   : min,
    'max'   : max,
    'mean'    : mean,

    // Log delta bounds
    'dmin'    : dmin,
    'dmax'    : dmax,

    // Delta mode
    'dmode'   : d_mode,
    'fscale'  : f_type[0],

    // Expose information details
    'integer'   : is_int && !is_float,
    'float'   : is_float && !is_int,
    'mixed'   : is_float && is_int,
    'same'    : is_same && (v.length > 1),

  };

}
