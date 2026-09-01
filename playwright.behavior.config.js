const { defineConfig } = require("@playwright/test");

// Interaction tests exercise behavior that static screenshots cannot cover,
// including keyboard flows and browser-managed validity states. One
// desktop/light project per engine is enough here: resilience and parity
// specs explicitly exercise the default, plain, and playroom themes, while
// screenshot coverage across schemes and viewports remains elsewhere.

module.exports = defineConfig({
	testDir: "tests",
	testMatch: [
		"accessibility-resilience.spec.js",
		"baseline-consistency.spec.js",
		"button-overflow.spec.js",
		"docs-stack.spec.js",
		"date-input-group.spec.js",
		"form-sizing.spec.js",
		"forms-validity.spec.js",
		"framework-specimen.spec.js",
		"group-hidden-elements.spec.js",
		"group-search-radius.spec.js",
		"input-parity.spec.js",
		"layout.spec.js",
		"link-visited.spec.js",
		"list-nesting.spec.js",
		"meter.spec.js",
		"modal.spec.js",
		"nav-dropdown.spec.js",
		"popover.spec.js",
		"prefers-contrast.spec.js",
		"print.spec.js",
		"surface-derivation.spec.js",
		"token-override.spec.js",
	],
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
