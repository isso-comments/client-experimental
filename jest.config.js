const config = {
  modulePaths: ["<rootDir>/src"],
  testEnvironment: "jsdom",
  moduleNameMapper: {
    "\.svg$": "<rootDir>/tests/mocks/fileTransformer.js",
  },
};

module.exports = config;
