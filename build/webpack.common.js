const path = require('path');

const ESLintFriendlyFormatter = require('eslint-friendly-formatter');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const postcssNormalize = require('postcss-normalize');


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
        test: /\.(js|vue)$/,
        use: {
          loader: 'eslint-loader',
          options: { formatter: ESLintFriendlyFormatter },
        },
        enforce: 'pre',
        include: [resolve('src'), resolve('test')],
      },

      {
        test: /\.css$/,
        use: [
          { loader: 'css-loader', options: { importLoaders: 1 } },
          {
            loader: 'postcss-loader',
            options: { ident: 'postcss', plugins: () => [postcssNormalize()] },
          },
        ],
      },
      {
        test: /\.sass$/,
        use: [
          { loader: 'css-loader', options: { importLoaders: 3 } },
          {
            loader: 'postcss-loader',
            options: { ident: 'postcss', plugins: () => [postcssNormalize()] },
          },
          {
            loader: 'sass-loader',
            options: { sassOptions: { indentedSyntax: true } },
          },
          'webpack-multiline-sass',
        ],
      },

      {
        test: /\.(ttf|woff|png|jpe?g)(\?\S*)?$/,
        use: {
          loader: 'file-loader',
          options: { esModule: false },
        },
      },
    ],
  },

  plugins: [
    new VueLoaderPlugin(),
    new HtmlWebpackPlugin({ title: 'Eva' }),
  ],
};
