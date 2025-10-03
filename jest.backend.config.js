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
	],

	// jest code coverage
	collectCoverage: true,
	collectCoverageFrom: ["helpers/**", "middlewares/**", "controllers/**", "models/**"],
	coverageThreshold: {
		global: {
			lines: 80,
			functions: 80,
		},
	},
};
