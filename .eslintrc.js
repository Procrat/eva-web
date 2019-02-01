module.exports = {
  root: true,
  parserOptions: {
    parser: 'babel-eslint',
  },
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
    // Allow debugger during development
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    // Allow console statements during development
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    // Allow Vue plugins to change the Vue constructor
    'no-param-reassign': ['error', {
      props: true,
      ignorePropertyModificationsFor: ['vue'],
    }],
    // Allow _xxx for unused arguments
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    // Allow some dangling underscores that PouchDB uses
    'no-underscore-dangle': ['error', { allow: ['_id', '_rev']}],
    // Allow imported things to be listed in dev dependencies as well
    'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
  },
  settings: {
    // Resolve imports through webpack
    'import/resolver': {
      webpack: {
        config: 'build/webpack.common.js'
      }
    }
  },
}
