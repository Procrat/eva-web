const path = require('path');

const VueLoaderPlugin = require('vue-loader/lib/plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ESLintFriendlyFormatter = require('eslint-friendly-formatter');


function resolve(dir) {
  return path.join(__dirname, '..', dir);
}


module.exports = {
  context: path.resolve(__dirname, '../'),
  entry: '@/main.js',

  resolve: {
    extensions: ['.js', '.vue', '.wasm'],
    alias: {
      '@': resolve('src'),
      vue: 'vue/dist/vue.esm.js',
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
          'css-loader',
        ],
      },
      {
        test: /\.sass$/,
        use: [
          'css-loader',
          { loader: 'sass-loader', options: { indentedSyntax: true } },
          'webpack-multiline-sass',
        ],
      },

      {
        test: /\.(ttf|woff|png|jpe?g)(\?\S*)?$/,
        use: 'file-loader',
      },
    ],
  },

  plugins: [
    new VueLoaderPlugin(),
    new HtmlWebpackPlugin({ title: 'Eva' }),
  ],
};
