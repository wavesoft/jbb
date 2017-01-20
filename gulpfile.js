var gulp    = require('gulp');
var header    = require('gulp-header');
var webpack   = require('webpack-stream');
var PROD = (process.env.NODE_ENV || "production") == "production";

//
// Compile the jbb library
//
gulp.task('jbb/lib', function() {
  return gulp.src('lib/JBB.js')
    .pipe(webpack({
      module: {
        loaders: [
          { test: /\.json$/, loader: 'json' },
          {
            test: /\.js$/,
            exclude: /(node_modules|bower_components)/,
            loader: './webpack/inline-require-loader!babel?presets[]=es2015'
          }
        ],
        },
        node: {
          'fs': 'empty'
        },
        output: {
          // The output filename
          filename: PROD ? 'jbb.min.js' : 'jbb.js',
          // Export itself to a global var
          libraryTarget: 'var',
          // Name of the global var: 'JBB.BinaryLoader'
          library: [ 'JBB', 'BinaryLoader' ]
      },
      externals: {
        'three': 'THREE',
      },
      plugins: ([
        new webpack.webpack.optimize.DedupePlugin(),
        new webpack.webpack.DefinePlugin({
            DEBUG_BUILD : !PROD
        })
      ]).concat(PROD ? [
        new webpack.webpack.optimize.UglifyJsPlugin({
          minimize: true
        })
      ] : [])
    }))
    .pipe(header("/* JBB Binary Bundle Loader - https://github.com/wavesoft/jbb */\n"))
    .pipe(gulp.dest('dist'));
});


// By default run only script
gulp.task('default', ['jbb/lib']);

