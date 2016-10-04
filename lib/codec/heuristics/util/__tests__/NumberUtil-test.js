
import NumericTypes from '../../../../constants/NumericTypes';
import NumberUtil from '../NumberUtil';

describe('NumberUtil', function() {

  describe('#isFloat', function() {

    it('should detect smaller than 31-bit signed integers', function() {
      expect(NumberUtil.isFloat(3)).toBeFalsy();
      expect(NumberUtil.isFloat(1073741824)).toBeFalsy();
    });

    it('should detect bigger than 31-bit signed integers', function() {
      expect(NumberUtil.isFloat(3221260416)).toBeFalsy();
      expect(NumberUtil.isFloat(1240171841664)).toBeFalsy();
      expect(NumberUtil.isFloat(577024942428686464)).toBeFalsy();
    });

    it('should detect smaller than 31-bit floats', function() {
      expect(NumberUtil.isFloat(512.4123)).toBeTruthy();
      expect(NumberUtil.isFloat(1073741824.5918)).toBeTruthy();
    });

    it('should detect bigger than 31-bit floats', function() {
      expect(NumberUtil.isFloat(3221260416.48123)).toBeTruthy();
      expect(NumberUtil.isFloat(1240171841664.5882)).toBeTruthy();
      expect(NumberUtil.isFloat(5770249424288.4182)).toBeTruthy();
    });

  });

  describe('#isFloat32', function() {

    it('should accept numbers with small 32-bit float error', function() {
      expect(NumberUtil.isFloat32(4.124781131744385)).toBeTruthy();
      expect(NumberUtil.isFloat32(47.172813415527344)).toBeTruthy();
      expect(NumberUtil.isFloat32(712871.1875)).toBeTruthy();
    });

    it('should reject numbers with big 32-bit float error', function() {
      expect(NumberUtil.isFloat32(41924.1293714)).toBeFalsy();
      expect(NumberUtil.isFloat32(891.2387912)).toBeFalsy();
      expect(NumberUtil.isFloat32(712871.213)).toBeFalsy();
    });

  });

});
