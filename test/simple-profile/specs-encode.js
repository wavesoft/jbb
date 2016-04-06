var OT = require('./objects');

/**
 * Property getter OT.ObjectA
 */
function getter_OT_ObjectA(inst) {
	return [
		inst.objApropA,
		inst.objApropB,
		inst.objApropC];
}

/**
 * Property getter OT.ObjectB
 */
function getter_OT_ObjectB(inst) {
	return [
		inst.objBpropA,
		inst.objBpropB,
		inst.objBpropC];
}

/**
 * Property getter OT.ObjectC
 */
function getter_OT_ObjectC(inst) {
	return [
		inst.objCpropA,
		inst.objCpropB,
		inst.objCpropC];
}


module.exports = {
	id: 7761,
	size: 3,
	encode: function( inst ) {
			if (inst instanceof OT.ObjectA) {
				return [32, getter_OT_ObjectA];
			} else if (inst instanceof OT.ObjectB) {
				return [33, getter_OT_ObjectB];
			} else if (inst instanceof OT.ObjectC) {
				return [34, getter_OT_ObjectC];
			}
		}
};
