const path = require('path');

const webpack = require('webpack');
const merge = require('webpack-merge');
const FilterWarningsPlugin = require('webpack-filter-warnings-plugin');

const commonWebpackConfig = require('./webpack.common');


module.exports = merge(commonWebpackConfig, {
  mode: 'development',

  resolve: {
    alias: {
      '@backend': path.join(__dirname, '..', 'generated-wasm', 'debug'),
    },
  },

  module: {
    rules: [
      {
        test: /\.(css|sass)$/,
        use: 'vue-style-loader',
        enforce: 'post',
      },
    ],
  },

  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new FilterWarningsPlugin({
      exclude: /Critical dependency: the request of a dependency is an expression/,
    }),
  ],

  devServer: {
    clientLogLevel: 'warning',
    hot: true,
    overlay: true,
  },

  devtool: 'cheap-module-eval-source-map',
});
