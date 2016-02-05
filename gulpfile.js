var gulp 		= require('gulp');
var header 		= require('gulp-header');
var webpack 	= require('webpack-stream');
var PROD 		= JSON.parse(process.env.PROD_DEV || "0");

//
// Compile the sources 
//
gulp.task('dist', function() {
	return gulp.src('index.js')
		.pipe(webpack({
			module: {
				loaders: [
					{ test: /\.json$/, loader: 'json' },
				],
		    },
		    node: {
		    	'fs': 'empty'
		    },
		    output: {
		    	// The output filename
		    	filename: PROD ? 'jbb-profile-three.min.js' : 'jbb-profile-three.js',
				// Export itself to a global var
				libraryTarget: 'var',
				// Name of the global var: 'Foo'
				library: 'JBBProfileThree'
			},
			externals: {
				'jquery': 'jQuery',
				'three': 'THREE',
			},
		    plugins: PROD ? [
		    	new webpack.webpack.optimize.DedupePlugin(),
			    new webpack.webpack.optimize.UglifyJsPlugin({
			    	minimize: true
			    })
		    ] : [
		    	new webpack.webpack.optimize.DedupePlugin(),
		    ]
		}))
		.pipe(header("/* THREE.js profile for JBB - https://github.com/wavesoft/jbb-profile-three */\n"))
		.pipe(gulp.dest('dist'));
});

// By default run only script
gulp.task('default', ['dist']);

