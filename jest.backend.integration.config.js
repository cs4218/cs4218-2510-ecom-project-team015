export default {
  displayName: "beintegration",

  testEnvironment: "node",

  // setup file for initializing things like MSW or global mocks
  setupFilesAfterEnv: ["<rootDir>/tests/setupBackendIntegration.js"],

  // all integration tests
  testMatch: ["<rootDir>/tests/integration/*.test.js"],

  collectCoverage: true,
  collectCoverageFrom: ["helpers/**", "middlewares/**", "controllers/**", "models/**", "config/**"],
};
