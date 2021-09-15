const merge = require('webpack-merge');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

const productionWebpackConfig = require('./webpack.prod');

const config = merge.smart(
  productionWebpackConfig,
  {
    plugins: [new BundleAnalyzerPlugin()],
  },
);

module.exports = config;
