const path = require('path');

const merge = require('webpack-merge');
const FilterWarningsPlugin = require('webpack-filter-warnings-plugin');

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

    plugins: [
      new FilterWarningsPlugin({
        exclude: /Critical dependency: the request of a dependency is an expression/,
      }),
    ],

    devServer: {
      hot: true,
      client: {
        logging: 'warn',
      },
    },

    devtool: 'cheap-module-eval-source-map',
  }
);

module.exports = config;
