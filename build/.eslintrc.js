module.exports = {
  rules: {
    // Allow imported things to be listed in dev dependencies as well
    'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
  }
};
