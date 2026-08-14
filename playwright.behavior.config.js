const { defineConfig } = require("@playwright/test");

// Interaction tests exercise behavior that static screenshots cannot cover,
// including keyboard flows and browser-managed validity states. One
// desktop/light project per engine is enough here: visual coverage across
// themes and viewports remains in playwright.config.js.

module.exports = defineConfig({
	testDir: "tests",
	testMatch: ["forms-validity.spec.js", "group-hidden-elements.spec.js"],
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	reporter: [["list"]],
	use: {
		colorScheme: "light",
		contextOptions: { reducedMotion: "reduce" },
		viewport: { width: 1280, height: 720 },
	},
	projects: [
		{ name: "behavior-chromium", use: { browserName: "chromium" } },
		{ name: "behavior-firefox", use: { browserName: "firefox" } },
		{ name: "behavior-webkit", use: { browserName: "webkit" } },
	],
});
