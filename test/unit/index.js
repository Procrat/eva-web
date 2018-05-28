const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);

// Require all test files (files that ends with .spec.js)
const testsContext = require.context('./specs', true, /\.spec$/);
testsContext.keys().forEach(testsContext);

// Require all src files except main.js for coverage
const srcContext = require.context('../../src', true, /^(?!\.\/main\.js).*\.js$/);
srcContext.keys().forEach(srcContext);
