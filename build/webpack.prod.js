const path = require('path');

const merge = require('webpack-merge');
const TerserPlugin = require('terser-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyPlugin = require('copy-webpack-plugin');

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
      minimizer: [new TerserPlugin()],
    },
  };
}


function minifyCss() {
  return {
    module: {
      rules: [
        {
          test: /\.css$/,
          use: MiniCssExtractPlugin.loader,
        },
        {
          test: /\.sass$/,
          use: MiniCssExtractPlugin.loader,
        },
      ],
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: '[name].[contenthash].css',
      }),
    ],
    optimization: {
      minimizer: [
        new OptimizeCSSAssetsPlugin({
          cssProcessorPluginOptions: {
            // Assumes browserslist and no dynamics CSS loading
            preset: ['advanced'],
          },
        }),
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


function proofOwnershipForGoogleSearchConsole() {
  return {
    plugins: [
      new CopyPlugin({
        patterns: [
          'src/assets/google18660690c202c2b5.html',
        ],
      }),
    ],
  };
}


const config = merge.smartStrategy({
  'module.rules.use': 'prepend',
})(
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
  proofOwnershipForGoogleSearchConsole(),
);


module.exports = config;
