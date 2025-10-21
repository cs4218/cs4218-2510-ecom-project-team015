export default {
  displayName: "beintegration",

  testEnvironment: "node",

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
