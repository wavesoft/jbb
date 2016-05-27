var OT = require('./objects');

/**
 * Factory & Initializer of OT.ObjectE
 */
var factory_OT_ObjectE = {
	props: 3,
	create: function() {
		return new OT.ObjectE();
	},
	init: function(inst, props, pagesize, offset) {
		inst.objEpropA = props[offset+pagesize*0];
		inst.objEpropB = props[offset+pagesize*1];
		inst.objEpropC = props[offset+pagesize*2];
	}
}

/**
 * Factory & Initializer of OT.ObjectF
 */
var factory_OT_ObjectF = {
	props: 3,
	create: function() {
		return new OT.ObjectF();
	},
	init: function(inst, props, pagesize, offset) {
		inst.objFpropA = props[offset+pagesize*0];
		inst.objFpropB = props[offset+pagesize*1];
		inst.objFpropC = props[offset+pagesize*2];
	}
}

/**
 * Factory & Initializer of OT.ObjectG
 */
var factory_OT_ObjectG = {
	props: 3,
	create: function() {
		return Object.create(OT.ObjectG.prototype);
	},
	init: function(inst, props, pagesize, offset) {
		OT.ObjectG.call(inst,
			props[offset+pagesize*0],
			props[offset+pagesize*1]);
		inst.objGpropC = props[offset+pagesize*2];
	}
}

module.exports = {
	id: 15024,
	size: 3,
	frequent: 2,
	decode: function( id ) {
			if (id < 32) {
				if (id < 1) {
					if (id === 0)
						return factory_OT_ObjectE;
				} else {
					if (id === 1)
						return factory_OT_ObjectF;
				}
			} else {
				if (id === 32)
					return factory_OT_ObjectG;
			}
		}
};
