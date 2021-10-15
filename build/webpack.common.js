const path = require('path');

const ESLintPlugin = require('eslint-webpack-plugin');
const ESLintFriendlyFormatter = require('eslint-friendly-formatter');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const VueLoaderPlugin = require('vue-loader/lib/plugin');

function resolve(dir) {
  return path.join(__dirname, '..', dir);
}

module.exports = {
  context: path.resolve(__dirname, '../'),
  entry: [
    // Polyfill for Edge for TextEncoder/TextDecoder, used by wasm-bindgen
    'fast-text-encoding',
    '@/main.js',
  ],

  resolve: {
    extensions: ['.js', '.vue', '.wasm'],
    alias: {
      '@': resolve('src'),
    },
  },

  module: {
    rules: [
      {
        test: /\.vue$/,
        use: 'vue-loader',
      },
      {
        test: /\.js$/,
        use: 'babel-loader',
        include: [resolve('src'), resolve('test')],
      },
      {
        test: /\.css$/,
        use: [
          { loader: 'css-loader', options: { importLoaders: 1 } },
          'postcss-loader',
        ],
      },
      {
        test: /\.sass$/,
        use: [
          { loader: 'css-loader', options: { importLoaders: 3 } },
          'postcss-loader',
          {
            loader: 'sass-loader',
            options: { sassOptions: { indentedSyntax: true } },
          },
        ],
      },
      {
        test: /\.(ttf|woff|png|jpe?g)(\?\S*)?$/,
        type: 'asset',
      },
    ],
  },

  plugins: [
    new VueLoaderPlugin(),
    new ESLintPlugin({
      extensions: ['js', 'vue'],
      exclude: ['generated-wasm', 'node_modules'],
      formatter: ESLintFriendlyFormatter,
    }),
    new HtmlWebpackPlugin({ title: 'Eva' }),
  ],

  experiments: {
    asyncWebAssembly: true,
  },
};
