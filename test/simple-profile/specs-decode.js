var OT = require('./objects');

/**
 * Factory & Initializer of OT.ObjectA
 */
var factory_OT_ObjectA = {
	props: 3,
	create: function() {
		return new OT.ObjectA();
	},
	init: function(inst, props) {
		inst.objApropA = props[0];
		inst.objApropB = props[1];
		inst.objApropC = props[2];
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
	init: function(inst, props) {
		inst.objBpropA = props[0];
		inst.objBpropB = props[1];
		inst.objBpropC = props[2];
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
	init: function(inst, props) {
		OT.ObjectC.call(inst,
			props[0],
			props[1]);
		inst.objCpropC = props[2];
	}
}

module.exports = {
	id: 7761,
	size: 3,
	decode: function( id ) {
			if (id < 32) {
				/* No items */
			} else {
				if (id < 33) {
					if (id < 32) {
						if (id === 31)
							return factory_OT_ObjectA;
					} else {
						if (id === 32)
							return factory_OT_ObjectB;
					}
				} else {
					if (id === 33)
						return factory_OT_ObjectC;
				}
			}
		}
};
