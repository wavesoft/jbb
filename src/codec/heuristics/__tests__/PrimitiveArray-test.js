
import PrimitiveArray from '../PrimitiveArray';

describe('PrimitiveArray', function() {

  describe('#analyzePrimitiveArray', function() {

    describe('[Numbers]', function() {

      it('should properly detect few-number groups', function() {
        let arr = [ 1, 2, 3, true, 'string', false, 5, 6, 7 ]
        let ans = PrimitiveArray.analyzePrimitiveArray(arr);
      });

    });

  });

});
