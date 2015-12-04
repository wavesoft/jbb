
// Prepare a fake browser
var MockBrowser = require('mock-browser').mocks.MockBrowser;
var mock = new MockBrowser();

// Fake 'self', 'document' and 'window'
global.document = mock.getDocument(),
global.self = MockBrowser.createWindow(),
global.window = global.self;

// Fake 'XMLHttpRequest' (shall not be used)
global.XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

console.info("Creating fake DOM environment");
