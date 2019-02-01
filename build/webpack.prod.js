const path = require('path');

const merge = require('webpack-merge');
const TerserPlugin = require('terser-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const commonWebpackConfig = require('./webpack.common');


function cleanOutput() {
  return {
    plugins: [
      new CleanWebpackPlugin(),
    ],
  };
}


function minifyJavaScript() {
  return {
    optimization: {
      minimizer: [
        new TerserPlugin({
          cache: true,
          parallel: true,
          sourceMap: true,
        }),
      ],
    },
  };
}


function minifyCss() {
  return {
    module: {
      rules: [{
        test: /\.(css|sass)$/,
        use: MiniCssExtractPlugin.loader,
      }],
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: '[name].[contenthash].css',
      }),
    ],
    optimization: {
      minimizer: [
        new OptimizeCSSAssetsPlugin({}),
      ],
    },
  };
}


function outputCacheableFilenames() {
  return {
    output: {
      filename: '[name].[chunkhash].js',
      chunkFilename: '[name].[chunkhash].js',
    },
    module: {
      rules: [
        {
          test: /\.(ttf|woff|png|jpe?g)(\?\S*)?$/,
          use: {
            loader: 'file-loader',
            options: {
              name: 'assets/[name].[hash].[ext]',
            },
          },
        },
      ],
    },
  };
}


const config = merge.smartStrategy({
  'module.rules': 'prepend',
  'module.rules.use': 'prepend',
})([
  commonWebpackConfig,
  {
    mode: 'production',
    resolve: {
      alias: {
        '@backend': path.join(__dirname, '..', 'generated-wasm', 'release'),
      },
    },
    devtool: 'source-map',
    performance: {
      maxAssetSize: 350000,
    },
    stats: {
      children: false,
    },
  },
  cleanOutput(),
  minifyJavaScript(),
  minifyCss(),
  outputCacheableFilenames(),
]);


module.exports = config;
