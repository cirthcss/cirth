const { defineConfig } = require("@playwright/test");

// Interaction tests exercise browser-managed states such as :user-valid and
// :user-invalid. One desktop/light project per engine is enough here: visual
// coverage across themes and viewports remains in playwright.config.js.

module.exports = defineConfig({
	testDir: "tests",
	testMatch: "forms-validity.spec.js",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	reporter: [["list"]],
	use: {
		colorScheme: "light",
		contextOptions: { reducedMotion: "reduce" },
		viewport: { width: 1280, height: 720 },
	},
	projects: [
		{ name: "validity-chromium", use: { browserName: "chromium" } },
		{ name: "validity-firefox", use: { browserName: "firefox" } },
		{ name: "validity-webkit", use: { browserName: "webkit" } },
	],
});
