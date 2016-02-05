var gulp 		= require('gulp');
var header 		= require('gulp-header');
var webpack 	= require('webpack-stream');
var PROD 		= JSON.parse(process.env.PROD_DEV || "0");

//
// Compile the sources 
//
gulp.task('dist', function() {
	return gulp.src('decoder.js')
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
		    	filename: 'jbb.min.js',
				libraryTarget: 'var',
				library: 'JBBLoader'
			},
			externals: {
			},
		    plugins: [
		    	new webpack.webpack.optimize.DedupePlugin(),
			    new webpack.webpack.optimize.UglifyJsPlugin({
			    	minimize: true
			    })
		    ]
		}))
		.pipe(header("/* Javascript Binary Bundles - Binary Loader - https://github.com/wavesoft/jbb */\n"))
		.pipe(gulp.dest('dist'));
});

// By default run only script
gulp.task('default', ['dist']);

