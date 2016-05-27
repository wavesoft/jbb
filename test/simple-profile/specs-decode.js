var OT = require('./objects');

/**
 * Factory & Initializer of OT.ObjectA
 */
var factory_OT_ObjectA = {
	props: 3,
	create: function() {
		return new OT.ObjectA();
	},
	init: function(inst, props, pagesize, offset) {
		inst.objApropA = props[offset+pagesize*0];
		inst.objApropB = props[offset+pagesize*1];
		inst.objApropC = props[offset+pagesize*2];
	}
}

/**
 * Factory & Initializer of OT.ObjectB
 */
var factory_OT_ObjectB = {
	props: 3,
	create: function() {
		return new OT.ObjectB();
	},
	init: function(inst, props, pagesize, offset) {
		inst.objBpropA = props[offset+pagesize*0];
		inst.objBpropB = props[offset+pagesize*1];
		inst.objBpropC = props[offset+pagesize*2];
	}
}

/**
 * Factory & Initializer of OT.ObjectC
 */
var factory_OT_ObjectC = {
	props: 3,
	create: function() {
		return Object.create(OT.ObjectC.prototype);
	},
	init: function(inst, props, pagesize, offset) {
		OT.ObjectC.call(inst,
			props[offset+pagesize*0],
			props[offset+pagesize*1]);
		inst.objCpropC = props[offset+pagesize*2];
	}
}

module.exports = {
	id: 7760,
	size: 3,
	frequent: 1,
	decode: function( id ) {
			if (id < 32) {
				if (id === 0)
					return factory_OT_ObjectA;
			} else {
				if (id < 33) {
					if (id === 32)
						return factory_OT_ObjectB;
				} else {
					if (id === 33)
						return factory_OT_ObjectC;
				}
			}
		}
};
