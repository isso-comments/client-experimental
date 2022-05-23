const config = {
  modulePaths: ['<rootDir>/src', '<rootDir>/tests'],
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '\.svg$': '<rootDir>/tests/mocks/fileTransformer.js',
  },
  globalSetup: '<rootDir>/tests/setup/global-setup.js',
  collectCoverageFrom: [
    '<rootDir>/src/**/*.js',
  ],
};

module.exports = config;
