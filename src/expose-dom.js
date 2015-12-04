
var exposer = function() {
	// Fake 'self', 'document' and 'window'
	var MockBrowser = require('mock-browser').mocks.MockBrowser;
	var mock = new MockBrowser();

	// Expose globals
	global.document = mock.getDocument(),
	global.self = MockBrowser.createWindow(),
	global.window = self;

	// Fake 'XMLHttpRequest' (shall not be used)
	global.XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

	console.info("Creating fake DOM environment");
}

// Run with require.js or with node
if (define) {
	define(exposer);
} else {
	exposer();
}
