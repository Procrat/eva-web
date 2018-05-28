const webpack = require('webpack');
const merge = require('webpack-merge');

const devWebpackConfig = require('./webpack.dev');


const config = merge(devWebpackConfig, {
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: '"testing"',
      },
    }),
  ],

  devtool: 'cheap-module-eval-source-map',
});

delete config.entry;


module.exports = config;
