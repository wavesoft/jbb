"use strict";

// Override default console functions
var colors = require("colors"), hideWarn = false;
console.warn = function() { if (hideWarn) return; console.log.apply(console, ["WARN:".yellow].concat(Array.prototype.slice.call(arguments)) ); };
console.error = function() { console.log.apply(console, ["ERROR:".red].concat(Array.prototype.slice.call(arguments)) ); };
console.info = function() { console.log.apply(console, ["INFO:".green].concat(Array.prototype.slice.call(arguments)) ); };
console.info("Initializing compiler");

// Import dependencies
var fs = require('fs');
var path = require('path');
var getopt = require('node-getopt');
var BinaryEncoder = require("../encoder");
var BinaryCompiler = require("../compiler");

///////////////////////////////////////////////////////////////////////
// Helper functions
///////////////////////////////////////////////////////////////////////

/**
 * Create node-getopt object
 */
var createOptions = function( profile ) {

	// Extract profile additions
	var profile_additions = [];
	if (profile && profile.getopt)
		profile_additions = profile.getopt();

	// Validate command-line
	var opt = getopt.create([
	  ['p' , 'profile=NAME'  	   , 'Specify the profile to use for the compiler'],
	  ['o' , 'out=BUNDLE'	  	   , 'Specify the name of the bundle'],
	  ['O' , 'optimise=LEVEL+'     , 'Specify optimisation level'],
	  ['b' , 'basedir=DIR'  	   , 'Specify bundle base directory'],
	].concat( profile_additions ).concat([
	  [''  , 'log=FLAGS' 	 	   , 'Enable logging (see flags below)'],
	  ['h' , 'help'                , 'Display this help'],
	  ['v' , 'version'             , 'Show version'],
	]))
	.setHelp(
	  "Usage: jbb -p <profile> -o <file> [OPTION] <source>\n" +
	  "Compile one or more bundles to a binary format.\n" +
	  "\n" +
	  "[[OPTIONS]]\n" +
	  "\n" +
	  "Logging Flags:\n" +
	  "\n" +
	  "  p                        Log primitive opcodes\n" +
	  "  a                        Log array opcodes\n" +
	  "  c                        Log array chunk opcodes\n" +
	  "  b                        Log array bulk operations opcodes\n" +
	  "  s                        Log string opcodes\n" +
	  "  r                        Log internal cross-reference\n" +
	  "  R                        Log external cross-reference\n" +
	  "  o                        Log object opcodes\n" +
	  "  e                        Log file embedding opcodes\n" +
	  "  o                        Log object opcodes\n" +
	  "  O                        Log plain object opcodes\n" +
	  "  d                        Log protocol debug operations\n" +
	  "  w                        Log low-level byte writes\n" +
	  "  -                        Log everything\n" +
	  "\n" +
	  "Installation: npm install three-bundles\n" +
	  "Respository:  https://github.com/wavesoft/three-bundles"
	)
	.bindHelp()     // bind option 'help' to default action
	.parseSystem(); // parse command line

	// Return options
	return opt;

}

/**
 * Compile log
 */
var getLogFlags = function( logTags ) {

	// If missing return none
	if (!logTags)
		return 0;

	// Apply logging flags
	var logFlags = 0;
	for (var i=0; i<logTags.length; i++) {
		var t = logTags[i];
		switch (t) {
			case 'p': logFlags |= BinaryEncoder.LogFlags.PRM; break;
			case 'a': logFlags |= BinaryEncoder.LogFlags.ARR; break;
			case 'c': logFlags |= BinaryEncoder.LogFlags.CHU; break;
			case 's': logFlags |= BinaryEncoder.LogFlags.STR; break;
			case 'r': logFlags |= BinaryEncoder.LogFlags.IREF; break;
			case 'R': logFlags |= BinaryEncoder.LogFlags.XREF; break;
			case 'o': logFlags |= BinaryEncoder.LogFlags.OBJ; break;
			case 'e': logFlags |= BinaryEncoder.LogFlags.EMB; break;
			case 'O': logFlags |= BinaryEncoder.LogFlags.PLO; break;
			case 'b': logFlags |= BinaryEncoder.LogFlags.BULK; break;
			case 'd': logFlags |= BinaryEncoder.LogFlags.PDBG; break;
			case 'w': logFlags |= BinaryEncoder.LogFlags.WRT; break;
			case '-': logFlags |= 0xffff; break;
		}
	}
	return logFlags;

}

///////////////////////////////////////////////////////////////////////
// Initialize Environment
///////////////////////////////////////////////////////////////////////

/**
 * Create a fake DOM enviroment for non-npm modules (hello THREE.js!)
 */
// Prepare a fake browser
var MockBrowser = require('mock-browser').mocks.MockBrowser;
var mock = new MockBrowser();

// Fake 'self', 'document' and 'window'
global.document = mock.getDocument(),
global.self = MockBrowser.createWindow(),
global.window = global.self;

// Fake 'XMLHttpRequest' (shall not be used)
global.XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

///////////////////////////////////////////////////////////////////////
// Compiler entry point
///////////////////////////////////////////////////////////////////////

// Parse options without profile first
var opt = createOptions();
if (opt.options['out'] == undefined) {
	console.error("You need to specify an output file (ex. -o bundle.jbb)");
	process.exit(1);
}
if (opt.argv.length == 0) {
	console.error("You need to specify at least one source bundle to compile");
	process.exit(1);
}

// Check for base dir
var baseDir = ".";
if (opt.options['basedir'] !== undefined)
	baseDir = opt.options['basedir'];

// Get bundle name
var nameparts = opt.options['out'].split("."); nameparts.pop();
var name = nameparts.join(".");

// Calcualte full path to the bundle
var bundlePath = opt.argv[0];
if (bundlePath.substr(0,1) != "/") bundlePath = baseDir + '/' + bundlePath;

// Try to load the bundle
var fname = bundlePath + "/bundle.json";
fs.readFile(fname, 'utf8', function (err,data) {
	if (err) {
		console.error("Could not load bundle specifications from "+fname);
		process.exit(1);
	}

	// Parse data
	var bundleSpecs = JSON.parse(data);

	// Check for profile either from input or from bundle
	var profile = opt.options['profile'];
	if (profile == undefined) {
		if (bundleSpecs['profile']) {
			profile = bundleSpecs['profile'];
		} else {
			console.error("You need to specify a profile to compile for (ex. -p three)");
			process.exit(1);
		}
	}

	// Load profile
	console.info("Loading profile "+String(profile).bold);
	try {
		var profile_ot = require("jbb-profile-"+profile);
	} catch (e) {
		console.error("Could not find profile ( try: npm install jbb-profile-"+profile+" )");
		process.exit(1);
	}

	// Access the profile object table and file loader
	var profile_ot = require("jbb-profile-"+profile);
	var profile_loader = require("jbb-profile-"+profile+'/loader');

	// Initialize environment according to the profile
	if (profile_loader.initialize) profile_loader.initialize();

	// Compile first file
	BinaryCompiler.compile(
		bundleSpecs, opt.options['out'], {
			'path'			: baseDir,
			'log'			: getLogFlags(opt.options['log']),
			'profileTable'	: profile_ot,
			'profileLoader'	: profile_loader,
		}
	);


});

