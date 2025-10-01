export default {
	// display name
	displayName: "backend",

	// when testing backend
	testEnvironment: "node",

	// which test to run
	testMatch: [
		"<rootDir>/helpers/*.test.js",
		"<rootDir>/middlewares/*.test.js",
		"<rootDir>/controllers/categoryController.test.js",
	],

	// jest code coverage
	collectCoverage: true,
	collectCoverageFrom: ["helpers/**", "middlewares/**", "controllers/categoryController.js"],
	coverageThreshold: {
		global: {
			lines: 80,
			functions: 80,
		},
	},
};
