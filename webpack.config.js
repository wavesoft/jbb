var path = require('path');
var webpack = require('webpack');

module.exports = {
  entry: './src/jbb.js',
  output: {
    path: path.join(__dirname, 'lib'),
    filename: 'jbb.js'
  },
  module: {
    preLoaders: [
      {
        test: /.js$/,
        exclude: /node_modules/,
        loader: 'js-inline-loader'
      }
    ],
    loaders: [
      {
        test: /.js$/,
        exclude: /node_modules/,
        loader: 'babel?presets[]=es2015'
      }
    ]
  }
};
