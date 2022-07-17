module.exports = {
  root: true,
  env: {
    browser: true,
    mocha: true,
  },
  plugins: [
    'vue'
  ],
  extends: [
    'eslint:recommended',
    // https://www.npmjs.com/package/eslint-config-airbnb-base
    'airbnb-base',
    // https://github.com/vuejs/eslint-plugin-vue
    'plugin:vue/recommended',
  ],
  rules: {
    // Allow some things during development
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'max-len': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    // Allow Vue plugins to change the Vue constructor
    'no-param-reassign': ['error', {
      props: true,
      ignorePropertyModificationsFor: ['vue'],
    }],
    // Allow _xxx for unused arguments
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    // Allow some dangling underscores that PouchDB uses
    'no-underscore-dangle': ['error', { allow: ['_id', '_rev']}],
    // Allow for-of loops
    'no-restricted-syntax': ['off', 'ForOfStatement'],
  },
  settings: {
    // Resolve imports through webpack
    'import/resolver': {
      webpack: {
        config: 'build/webpack.dev.js'
      }
    }
  },
};
