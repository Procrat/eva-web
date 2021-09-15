const path = require('path');

const merge = require('webpack-merge');

const commonWebpackConfig = require('./webpack.common');

const config = merge.smartStrategy({
  'module.rules.use': 'prepend',
})(
  commonWebpackConfig,
  {
    mode: 'development',

    resolve: {
      alias: {
        '@backend': path.join(__dirname, '..', 'generated-wasm', 'debug'),
      },
    },

    module: {
      rules: [
        {
          test: /\.sass$/,
          use: 'style-loader',
        },
        {
          test: /\.css$/,
          use: 'style-loader',
        },
      ],
    },

    devServer: {
      hot: true,
      client: {
        logging: 'warn',
      },
    },

    devtool: 'eval',
  },
);

module.exports = config;
