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
			if (id < 2) {
				if (id < 1) {
					if (id < 1) {
						if (id < 1) {
							switch (id) {
								case 0: return factory_OT_ObjectA;
							}
						} else {
							switch (id) {
							}
						}
					} else {
						if (id < 1) {
							switch (id) {
							}
						} else {
							switch (id) {
							}
						}
					}
				} else {
					if (id < 2) {
						if (id < 2) {
							switch (id) {
								case 1: return factory_OT_ObjectB;
							}
						} else {
							switch (id) {
							}
						}
					} else {
						if (id < 2) {
							switch (id) {
							}
						} else {
							switch (id) {
							}
						}
					}
				}
			} else {
				if (id < 3) {
					if (id < 3) {
						if (id < 3) {
							switch (id) {
								case 2: return factory_OT_ObjectC;
							}
						} else {
							switch (id) {
							}
						}
					} else {
						if (id < 3) {
							switch (id) {
							}
						} else {
							switch (id) {
							}
						}
					}
				} else {
					if (id < 3) {
						if (id < 3) {
							switch (id) {
							}
						} else {
							switch (id) {
							}
						}
					} else {
						if (id < 3) {
							switch (id) {
							}
						} else {
							switch (id) {
							}
						}
					}
				}
			}
		}
};
