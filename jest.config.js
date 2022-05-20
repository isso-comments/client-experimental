const config = {
  modulePaths: ['<rootDir>/src', '<rootDir>/tests'],
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '\.svg$': '<rootDir>/tests/mocks/fileTransformer.js',
  },
  globalSetup: '<rootDir>/tests/setup/global-setup.js'
};

module.exports = config;
