var OT = require('./objects');

/**
 * Property getter OT.ObjectE
 */
function getter_OT_ObjectE(inst) {
	return [
		inst.objEpropA,
		inst.objEpropB,
		inst.objEpropC];
}

/**
 * Property getter OT.ObjectF
 */
function getter_OT_ObjectF(inst) {
	return [
		inst.objFpropA,
		inst.objFpropB,
		inst.objFpropC];
}

/**
 * Property getter OT.ObjectG
 */
function getter_OT_ObjectG(inst) {
	return [
		inst.objGpropA,
		inst.objGpropB,
		inst.objGpropC];
}


module.exports = {
	id: 15024,
	size: 3,
	frequent: 2,
	encode: function( inst ) {
			if (inst instanceof OT.ObjectE) {
				return [0, getter_OT_ObjectE];
			} else if (inst instanceof OT.ObjectF) {
				return [1, getter_OT_ObjectF];
			} else if (inst instanceof OT.ObjectG) {
				return [32, getter_OT_ObjectG];
			}
		}
};
