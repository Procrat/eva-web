const path = require('path');

const merge = require('webpack-merge');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

const commonWebpackConfig = require('./webpack.common');

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
        '...',
        new CssMinimizerPlugin({
          minimizerOptions: {
            // Assumes browserslist and no dynamic CSS loading
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
      filename: '[name].[contenthash].js',
      chunkFilename: '[name].[contenthash].js',
      assetModuleFilename: 'assets/[name].[contenthash][ext][query]',
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
    output: {
      clean: true,
    },
    devtool: 'source-map',
    performance: {
      maxAssetSize: 350000,
    },
  },
  minifyCss(),
  outputCacheableFilenames(),
  proofOwnershipForGoogleSearchConsole(),
);

module.exports = config;
