var gulp 		= require('gulp');
var jbb 		= require('gulp-jbb');
var uglify 		= require('gulp-uglifyjs');
var webpack 	= require('webpack-stream');

//
// Compile the binary bundles
//
gulp.task('bundles', function() {

	return gulp
		.src([
			'bundles/animated.jbbsrc',
			'bundles/heavy.jbbsrc',
			'bundles/md2.jbbsrc'
		])
		.pipe(jbb({
			'profile': 'three'
		}))
		.pipe(gulp.dest('build/bundles'));

});

//
// Compile the sources 
//
gulp.task('script', function() {
	return gulp.src('js/runtests.js')
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
		    	'filename': 'runtests.js'
		    },
		    plugins: [
		    	new webpack.webpack.optimize.DedupePlugin()
		    ]
		}))
		.pipe(uglify("runtests.min.js", { outSourceMap: true }))
		.pipe(gulp.dest('build'));
});

// By default run only script
gulp.task('default', ['script']);

