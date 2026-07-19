const { defineConfig } = require("@playwright/test");

// Visual regression over the built docs site (tests/visual.spec.js).
// Baselines live in tests/__screenshots__/<project>-<platform>/ and are
// platform-specific: system font rendering differs between macOS and
// Linux, so local (darwin) and CI (linux) each compare against their
// own committed set. Regenerate deliberately with
// `npm run check:visual:update` after a wanted visual change.
module.exports = defineConfig({
	testDir: "tests",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	reporter: [["list"]],
	snapshotPathTemplate:
		"{testDir}/__screenshots__/{projectName}-{platform}/{arg}{ext}",
	expect: {
		toHaveScreenshot: {
			// CSS animations frozen; JS-driven motion (the hero typing demo)
			// already stops itself under reduced motion.
			animations: "disabled",
			caret: "hide",
		},
	},
	use: {
		contextOptions: { reducedMotion: "reduce" },
	},
	projects: [
		{
			name: "light-desktop",
			use: { colorScheme: "light", viewport: { width: 1440, height: 900 } },
		},
		{
			name: "dark-desktop",
			use: { colorScheme: "dark", viewport: { width: 1440, height: 900 } },
		},
		{
			name: "light-mobile",
			use: { colorScheme: "light", viewport: { width: 390, height: 844 } },
		},
		{
			name: "dark-mobile",
			use: { colorScheme: "dark", viewport: { width: 390, height: 844 } },
		},
	],
});
