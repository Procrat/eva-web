const merge = require('webpack-merge');

const devWebpackConfig = require('./webpack.dev');

const config = merge(devWebpackConfig, {
  devtool: false,
});

delete config.entry;

module.exports = config;
