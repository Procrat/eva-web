// This is a karma config file. For more details see
//   http://karma-runner.github.io/0.13/config/configuration-file.html
// We are also using it with karma-webpack
//   https://github.com/webpack/karma-webpack

const MochaClean = require('mocha-clean');

const webpackConfig = require('../../build/webpack.test');


module.exports = (config) => {
  config.set({
    // available frameworks: https://npmjs.com/search?q=keywords:karma-adapter
    frameworks: ['mocha', 'webpack'],

    files: ['./index.js'],

    // available preprocessors: https://npmjs.com/search?q=keywords:karma-preprocessor
    preprocessors: {
      './index.js': ['webpack', 'sourcemap'],
    },
    webpack: webpackConfig,
    webpackMiddleware: {
      stats: 'minimal',
    },

    // available browser launchers: https://npmjs.com/search?q=keywords:karma-launcher
    browsers: ['ChromiumHeadless'],

    // available reporters: https://npmjs.com/search?q=keywords:karma-reporter
    reporters: [
      'mocha',
      // 'coverage',
    ],

    mochaReporter: {
      showDiff: true,
    },

    formatError(msg) {
      const cleanedMsg = MochaClean.cleanError({ stack: msg }).stack;
      return cleanedMsg ? `${cleanedMsg}\n` : '';
    },

    coverageReporter: {
      dir: './coverage',
      reporters: [
        { type: 'lcov', subdir: '.' },
        { type: 'text-summary' },
      ],
    },
  });
};
