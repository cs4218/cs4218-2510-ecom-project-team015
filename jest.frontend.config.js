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
		"<rootDir>/client/src/pages/Auth/Login.test.js",
		"<rootDir>/client/src/pages/Auth/Register.test.js",
		"<rootDir>/client/src/pages/admin/*.test.js",
		"<rootDir>/client/src/pages/user/*.test.js",
		"<rootDir>/client/src/pages/About.test.js",
		"<rootDir>/client/src/pages/Pagenotfound.test.js",
		"<rootDir>/client/src/context/auth.test.js",
		"<rootDir>/client/src/components/Routes/*.test.js",
		"<rootDir>/client/src/components/Form/*.test.js",
		"<rootDir>/client/src/components/*.test.js",
		"<rootDir>/client/src/components/Form/*.test.js",
		"<rootDir>/client/src/pages/Search.test.js",
		"<rootDir>/client/src/context/search.test.js",
		"<rootDir>/client/src/pages/ProductDetails.test.js",
		"<rootDir>/client/src/pages/CategoryProduct.test.js",

	],

	// jest code coverage
	collectCoverage: true,
	collectCoverageFrom: [
		"client/src/pages/Auth/Login.js",
		"client/src/pages/Auth/Register.js", 
		"client/src/pages/admin/AdminDashboard.js",
		"client/src/pages/user/Dashboard.js",
		"client/src/pages/About.js",
		"client/src/pages/Pagenotfound.js", 
		"!client/src/pages/admin/Users.js", // Excluded as it is not yet implemented
		"client/src/context/auth.js",
		"client/src/components/Routes/Private.js",
		"client/src/components/AdminMenu.js",
		"client/src/components/Footer.js",
		"client/src/components/Header.js",
		"client/src/components/Layout.js",
		"client/src/components/Spinner.js",
		"client/src/components/UserMenu.js",
		"client/src/components/Form/CategoryForm.js",
		"client/src/pages/Search.js",
		"client/src/context/search.js",
		"client/src/components/Form/**",
		"client/src/pages/ProductDetails.js",
		"client/src/pages/CategoryProduct.js",
	],
	coverageThreshold: {
		global: {
			lines: 80,
			functions: 80,
		},
	},
	setupFilesAfterEnv: ["<rootDir>/client/src/setupTests.js"],
};
