export default {
	// display name
	displayName: "backend",

	// when testing backend
	testEnvironment: "node",

	// which test to run
	testMatch: [
		// "<rootDir>/helpers/*.test.js",
		// "<rootDir>/middlewares/*.test.js",
		// "<rootDir>/config/*.test.js",
		// "<rootDir>/models/*.test.js",
		// "<rootDir>/controllers/*.test.js",
		"<rootDir>/models/productModel.test.js",
		//"<rootDir>/controllers/productController.test.js",
	],

	// jest code coverage
	collectCoverage: true,
	collectCoverageFrom: [
		// "helpers/**",
		// "middlewares/**",
		// "controllers/**",
		// "models/**",
		// "!models/categoryModel.js", // Excluded as it is not yet implemented
		// "!models/productModel.js", // Excluded as it is not yet implemented
		//"controllers/productController.js",
		"models/productModel.js",
	],
	coverageThreshold: {
		global: {
			lines: 80,
			functions: 80,
		},
	},
};
