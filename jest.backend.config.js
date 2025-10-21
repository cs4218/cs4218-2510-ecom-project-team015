export default {
	// display name
	displayName: "backend",

	// when testing backend
	testEnvironment: "node",

	// which test to run
	testMatch: [
		"<rootDir>/helpers/*.test.js",
		"<rootDir>/middlewares/*.test.js",
		"<rootDir>/config/*.test.js",
		"<rootDir>/models/*.test.js",
		"<rootDir>/controllers/*.test.js",
		"<rootDir>/config/db.test.js",
	],

	// jest code coverage
	collectCoverage: true,
	coverageDirectory: "coverage/backend",
	collectCoverageFrom: [
		"helpers/**",
		"middlewares/**",
		"controllers/**",
		"models/**",
		"config/**",
		"server.js",
		"!**/*.test.js",
	],
	coverageThreshold: {
		global: {
			lines: 80,
			functions: 80,
		},
	},
};
