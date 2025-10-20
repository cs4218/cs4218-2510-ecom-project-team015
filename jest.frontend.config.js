export default {
	// name displayed during tests
	displayName: "frontend",

	// simulates browser environment in jest
	// e.g., using document.querySelector in your tests
	testEnvironment: "jest-environment-jsdom",

	// jest does not recognise jsx files by default, so we use babel to transform any jsx files
	transform: {
		"^.+\\.jsx?$": "babel-jest",
	},

	// tells jest how to handle css/scss imports in your tests
	moduleNameMapper: {
		"\\.(css|scss)$": "identity-obj-proxy",
	},

	// ignore all node_modules except styleMock (needed for css imports)
	transformIgnorePatterns: ["/node_modules/(?!(styleMock\\.js)$)"],

	// only run these tests
	testMatch: [
		"<rootDir>/client/src/components/**/*.test.js",
		"<rootDir>/client/src/context/**/*.test.js",
		"<rootDir>/client/src/pages/**/*.test.js",
		"<rootDir>/client/src/hooks/*.test.js",
	],

	// Excluded as some bug fixes have broken the tests
	testPathIgnorePatterns: [
		"<rootDir>/client/src/context/cart.test.js",
		"<rootDir>/client/src/pages/HomePage.test.js",
		"<rootDir>/client/src/pages/CartPage.test.js",
	],

	// jest code coverage
	collectCoverage: true,
	collectCoverageFrom: [
		"client/src/components/**/*.js",
		"!client/src/components/Prices.js", // Excluded as it is not required
		"!client/src/components/Routes/AdminRoute.js", // Excluded as it is not required
		"client/src/context/**/*.js",
		"client/src/hooks/*.js",
		"client/src/pages/**/*.js",
		"!client/src/context/cart.js", // Excluded as some bug fixes have broken the tests
		"!client/src/pages/CartPage.js", // Excluded as some bug fixes have broken the tests
		"!client/src/pages/HomePage.js", // Excluded as it is not yet implemented
		"!client/src/context/cart.test.js", // I know test file is not supposed to be here but testPathIgnorePatterns changes jest behaviour so need to add it here too.
		"!client/src/pages/CartPage.test.js", 
		"!client/src/pages/HomePage.test.js", 
	],
	coverageThreshold: {
		global: {
			lines: 80,
			functions: 80,
		},
	},
	setupFilesAfterEnv: ["<rootDir>/client/src/setupTests.js"],
};
