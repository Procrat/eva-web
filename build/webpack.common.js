const path = require('path');

const VueLoaderPlugin = require('vue-loader/lib/plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ESLintFriendlyFormatter = require('eslint-friendly-formatter');


function resolve(dir) {
  return path.join(__dirname, '..', dir);
}


module.exports = env => ({
  context: path.resolve(__dirname, '../'),
  entry: '@/main.js',

  resolve: {
    extensions: ['.js', '.ts', '.vue', '.wasm'],
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
        test: /\.(js|ts)$/,
        use: [{
          loader: 'ts-loader',
          options: {
            configFile: `build/tsconfig.${env}.json`,
            appendTsSuffixTo: [/\.vue$/],
          },
        }],
        exclude: /node_modules/,
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
});
