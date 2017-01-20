
import NumericTypes from '../../../constants/NumericTypes';
import NumericArray from '../NumericArray';

describe('NumericArray', function() {

  describe('#getNumericArrayMinType', function() {

    it('should detect UINT8', function() {
      var arr = [ 0, 1, 50, 90, 128, 250, 254 ];
      expect(NumericArray.getNumericArrayMinType(arr)).toBe(NumericTypes.UINT8);
    });

    it('should detect INT8', function() {
      var arr = [ 0, 10, -10, 50, -20, 120, -127, 127 ];
      expect(NumericArray.getNumericArrayMinType(arr)).toBe(NumericTypes.INT8);
    });

    it('should detect UINT16', function() {
      var arr = [ 0, 810, 2048, 4114, 49170 ];
      expect(NumericArray.getNumericArrayMinType(arr)).toBe(NumericTypes.UINT16);
    });

    it('should detect INT16', function() {
      var arr = [ -1501, 16402, 90, -2401, -17034 ];
      expect(NumericArray.getNumericArrayMinType(arr)).toBe(NumericTypes.INT16);
    });

    it('should detect UINT32', function() {
      var arr = [ 0, 141428, 12749237, 671154704, 2969903104 ];
      expect(NumericArray.getNumericArrayMinType(arr)).toBe(NumericTypes.UINT32);
    });

    it('should detect INT32', function() {
      var arr = [ -518293, 124925, 124892, -1092673812, 1921328208 ];
      expect(NumericArray.getNumericArrayMinType(arr)).toBe(NumericTypes.INT32);
    });

    it('should detect FLOAT32', function() {
      var arr = [ 3.124119997024536, 517283.125, 4817.1474609375 ];
      expect(NumericArray.getNumericArrayMinType(arr)).toBe(NumericTypes.FLOAT32);
    });

    it('should detect FLOAT64', function() {
      var arr = [ 41924.1293714, 891.2387912, 712871.213 ];
      expect(NumericArray.getNumericArrayMinType(arr)).toBe(NumericTypes.FLOAT64);
    });

  });


  describe('#analyzeNumericArray', function() {

    it('should detect integer bounds', function() {
      var arr = [ 0, 1012, 4, 108274, 5012, 48192731, 48182 ];
      var analysis = NumericArray.analyzeNumericArray(arr);

      expect(analysis.min).toBe(0);
      expect(analysis.max).toBe(48192731);
    });

    it('should detect float bounds', function() {
      var arr = [ 0.123124, 48192.3123, -50.129, 12391.491, 108429173.231 ];
      var analysis = NumericArray.analyzeNumericArray(arr);

      expect(analysis.min).toBe(-50.129);
      expect(analysis.max).toBe(108429173.231);
    });

    it('should detect positive delta bounds', function() {
      var arr = [ 0, 10, 20, 40, 60, 90 ];
      var analysis = NumericArray.analyzeNumericArray(arr);

      expect(analysis.dmin).toBe(10);
      expect(analysis.dmax).toBe(30);
    });

    it('should detect negative delta bounds', function() {
      var arr = [ 100, 90, 70, 50, 20 ];
      var analysis = NumericArray.analyzeNumericArray(arr);

      expect(analysis.dmin).toBe(-30);
      expect(analysis.dmax).toBe(-10);
    });

    it('should detect maximum block of same values', function() {
      expect(NumericArray.analyzeNumericArray([
          1, 2, 3, 3, 4, 5, 6
        ]).sameMax).toBe(2);
      expect(NumericArray.analyzeNumericArray([
          1, 2, 3, 4, 5, 5, 5, 5, 6, 7
        ]).sameMax).toBe(4);
    });

    it('should correctly calculate avarage', function() {
      var arr = [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ];
      var analysis = NumericArray.analyzeNumericArray(arr);

      expect(analysis.average).toBe(5.5);
    });

    it('should correctly populate isSame with integers', function() {
      var arr = [ 60, 60, 60, 60, 60, 60 ];
      var analysis = NumericArray.analyzeNumericArray(arr);

      expect(analysis.isSame).toBeTruthy();
    });

    it('should correctly populate isSame with floats', function() {
      var arr = [ 7123198312.142937182, 7123198312.142937182, 7123198312.142937182 ];
      var analysis = NumericArray.analyzeNumericArray(arr);

      expect(analysis.isSame).toBeTruthy();
    });

    it('should correctly populate isZero', function() {
      var arr = [ 0, 0, 0, 0, 0, 0, 0, ];
      var analysis = NumericArray.analyzeNumericArray(arr);

      expect(analysis.isZero).toBeTruthy();
    });

    it('should correctly populate isFloat', function() {
      var arr = [ 5.1, 5.2, 19.2, 100.2, 60.2 ];
      var analysis = NumericArray.analyzeNumericArray(arr);

      expect(analysis.isFloat).toBeTruthy();
    });

    it('should correctly populate isInt', function() {
      var arr = [ 1, 4, 6, 1, 9, 4, 1, 2 ];
      var analysis = NumericArray.analyzeNumericArray(arr);

      expect(analysis.isInt).toBeTruthy();
    });

    it('should correctly populate isMixed', function() {
      expect(NumericArray.analyzeNumericArray([
          1, 4, 6, 1, 9.1, 4, 1, 2
        ]).isMixed).toBeTruthy();
      expect(NumericArray.analyzeNumericArray([
          1, 5, 6, 10, 100, 90, 93, 123123
        ]).isMixed).toBeFalsy();
      expect(NumericArray.analyzeNumericArray([
          0.1, 0.5, 5.9, 10.4, 50.5, 60.2, 412.1
        ]).isMixed).toBeFalsy();
    });

  });

});
