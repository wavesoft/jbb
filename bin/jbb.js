"use strict";

// Override default console functions
var colors = require("colors"), hideWarn = false;
console.warn = function() { if (hideWarn) return; console.log.apply(console, ["WARN:".yellow].concat(Array.prototype.slice.call(arguments)) ); };
console.error = function() { console.log.apply(console, ["ERROR:".red].concat(Array.prototype.slice.call(arguments)) ); };
console.info = function() { console.log.apply(console, ["INFO:".green].concat(Array.prototype.slice.call(arguments)) ); };
console.info("Initializing compiler");

// Import dependencies
var path = require('path');
var getopt = require('node-getopt');
var BinaryEncoder = require("jbb").BinaryEncoder;

///////////////////////////////////////////////////////////////////////
// Parse input
///////////////////////////////////////////////////////////////////////

var config = {
	'profile' : 	'three'
};

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
if (opt.options['profile'] == undefined) {
	console.error("You need to specify a profile to compile for (ex. -p three)");
	process.exit(1);
}
if (opt.options['out'] == undefined) {
	console.error("You need to specify an output file (ex. -o bundle.jbb)");
	process.exit(1);
}

// Check for base dir
var baseDir = ".";
if (opt.options['basedir'] !== undefined)
	baseDir = opt.options['basedir'];

// Load profile
console.info("Loading profile "+String(opt.options['profile']).bold);
try {
	var profile_ot = require("jbb-profile-"+opt.options['profile']);
} catch (e) {
	console.error("Could not find profile ( try: npm install jbb-profile-"+opt.options['profile']+" )");
	process.exit(1);
}

// Access the profile-compiler.js, since the package should
// always expose only the run-time (user-friendly interface).
var profile = require( require.resolve("jbb-profile-"+opt.options['profile']).split('/dist/')[0]+'/js/profile-compiler.js' );

// Parse options once again, this time with profile extensions
opt = createOptions(profile);

// Initialize environment according to the profile
if (profile.initialize) profile.initialize();

// Make sure we have a load function
if (!profile.load) {
	console.error("This profile is missing a 'load' function!");
	process.exit(1);
}

// Load object from profile
profile.load( opt, 

	// Callback fired when objects are loaded
	function( objects ) {

		// Get splitter function
		var splitter = profile.split || function( opt, objects ) {

			// If objects is an array, merge individual objects
			var exports = {};
			if (objects instanceof Array) {
				for (var i=0; i<objects.length; i++) {
					var o = objects[i];
					for (var k in o)
						exports[k] = o[k];
				}
			} else {
				exports = objects;
			}

			// Get name
			var nameparts = opt.options['out'].split("."); nameparts.pop();
			var name = nameparts.join(".");

			// Default is to pipe everything on the same bundle
			var streams = { };
			streams[name] = exports;
			return streams;
		};

		// Get processor function
		var processor = profile.process || function( opt, encoder, stream ) {

			// Encode all keys from stream
			for (var ks=Object.keys(stream),i=0,l=ks.length; i<l; i++)
				encoder.encode( stream[ks[i]], ks[i] );

		}

		// Use splitter to get streams
		var streams = splitter( opt, objects );
		for (var ks=Object.keys(streams),i=0,l=ks.length; i<l; i++) {
			var name = ks[i],
				filename = path.dirname( opt.options['out'] ) + "/" + 
								name + ( path.extname( opt.options['out'] ) || ".jbb" );

			// Create encoder
			var encoder = new BinaryEncoder(
					filename,
					{
						'name' 			: name,
						'base_dir' 		: baseDir,
						'object_table' 	: profile_ot,
						'log'			: getLogFlags(opt.options['log']),
					}
				);

			// Pass through processor
			processor( opt, encoder, streams[name] );

			// Close
			encoder.close();

		}

	},

	// Handle loading errors
	function(error) {
		console.error(error);
		process.exit(1);
	}
)
