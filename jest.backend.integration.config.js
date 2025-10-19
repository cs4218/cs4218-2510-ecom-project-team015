// jest.backend.integration.config.js
export default {
  displayName: "beintegration",

  // use 'node' for backend-like integration tests, 'jsdom' for frontend React integration
  testEnvironment: "node",

  // setup file for initializing things like MSW or global mocks
  // setupFilesAfterEnv: ["<rootDir>/tests/setupIntegration.js"],

  // all integration tests
  testMatch: ["<rootDir>/tests/integration/*.test.js"],

  // optionally, add coverage thresholds if you want
  // collectCoverage: true,
  // collectCoverageFrom: ["tests/integration/**"],
};
