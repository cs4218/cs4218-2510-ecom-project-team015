export default {
  displayName: "beintegration",

  testEnvironment: "node",

  // setup file for initializing things like MSW or global mocks
  // setupFilesAfterEnv: ["<rootDir>/tests/setupBackendIntegration.js"],

  // all integration tests
  testMatch: ["<rootDir>/tests/integration/**/*.test.js"],

  // coverage from source files, not tests
  collectCoverage: true,
  coverageDirectory: "coverage/backend-integration",
  collectCoverageFrom: [
    "controllers/**",
    "routes/**",
    "middlewares/**",
    "models/**",
    "config/**",
    "server.js",
    "!**/*.test.js",
  ],
};
