
import NumericTypes from '../../../constants/NumericTypes';
import ArrayAnalyser from '../ArrayAnalyser';

describe('ArrayAnalyser', function() {

  describe('#isFloat', function() {

    it('should detect smaller than 31-bit signed integers', function() {
      expect(ArrayAnalyser.isFloat(3)).toBeFalsy();
      expect(ArrayAnalyser.isFloat(1073741824)).toBeFalsy();
    });

    it('should detect bigger than 31-bit signed integers', function() {
      expect(ArrayAnalyser.isFloat(3221260416)).toBeFalsy();
      expect(ArrayAnalyser.isFloat(1240171841664)).toBeFalsy();
      expect(ArrayAnalyser.isFloat(577024942428686464)).toBeFalsy();
    });

    it('should detect smaller than 31-bit floats', function() {
      expect(ArrayAnalyser.isFloat(512.4123)).toBeTruthy();
      expect(ArrayAnalyser.isFloat(1073741824.5918)).toBeTruthy();
    });

    it('should detect bigger than 31-bit floats', function() {
      expect(ArrayAnalyser.isFloat(3221260416.48123)).toBeTruthy();
      expect(ArrayAnalyser.isFloat(1240171841664.5882)).toBeTruthy();
      expect(ArrayAnalyser.isFloat(5770249424288.4182)).toBeTruthy();
    });

  });

  describe('#isFloat32', function() {

    it('should accept numbers with small 32-bit float error', function() {
      expect(ArrayAnalyser.isFloat32(4.124781131744385)).toBeTruthy();
      expect(ArrayAnalyser.isFloat32(47.172813415527344)).toBeTruthy();
      expect(ArrayAnalyser.isFloat32(712871.1875)).toBeTruthy();
    });

    it('should reject numbers with big 32-bit float error', function() {
      expect(ArrayAnalyser.isFloat32(41924.1293714)).toBeFalsy();
      expect(ArrayAnalyser.isFloat32(891.2387912)).toBeFalsy();
      expect(ArrayAnalyser.isFloat32(712871.213)).toBeFalsy();
    });

  });

  describe('#getNumericArrayMinType', function() {

    it('should detect UINT8', function() {
      var arr = [ 0, 1, 50, 90, 128, 250, 254 ];
      expect(ArrayAnalyser.getNumericArrayMinType(arr)).toBe(NumericTypes.UINT8);
    });

    it('should detect INT8', function() {
      var arr = [ 0, 10, -10, 50, -20, 120, -127, 127 ];
      expect(ArrayAnalyser.getNumericArrayMinType(arr)).toBe(NumericTypes.INT8);
    });

    it('should detect UINT16', function() {
      var arr = [ 0, 810, 2048, 4114, 49170 ];
      expect(ArrayAnalyser.getNumericArrayMinType(arr)).toBe(NumericTypes.UINT16);
    });

    it('should detect INT16', function() {
      var arr = [ -1501, 16402, 90, -2401, -17034 ];
      expect(ArrayAnalyser.getNumericArrayMinType(arr)).toBe(NumericTypes.INT16);
    });

    it('should detect UINT32', function() {
      var arr = [ 0, 141428, 12749237, 671154704, 2969903104 ];
      expect(ArrayAnalyser.getNumericArrayMinType(arr)).toBe(NumericTypes.UINT32);
    });

    it('should detect INT32', function() {
      var arr = [ -518293, 124925, 124892, -1092673812, 1921328208 ];
      expect(ArrayAnalyser.getNumericArrayMinType(arr)).toBe(NumericTypes.INT32);
    });

    it('should detect FLOAT32', function() {
      var arr = [ 3.124119997024536, 517283.125, 4817.1474609375 ];
      expect(ArrayAnalyser.getNumericArrayMinType(arr)).toBe(NumericTypes.FLOAT32);
    });

    it('should detect FLOAT64', function() {
      var arr = [ 41924.1293714, 891.2387912, 712871.213 ];
      expect(ArrayAnalyser.getNumericArrayMinType(arr)).toBe(NumericTypes.FLOAT64);
    });

  });

});
