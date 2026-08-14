const { defineConfig } = require("@playwright/test");

// Visual regression over the built docs site (tests/visual.spec.js).
// Baselines live in tests/__screenshots__/<project>-<platform>/ and are
// platform-specific: system font rendering differs between macOS and
// Linux, so local (darwin) and CI (linux) each compare against their
// own committed set. Regenerate deliberately with
// `npm run check:visual:update` after a wanted visual change.

const viewports = {
	desktop: { width: 1440, height: 900 },
	mobile: { width: 390, height: 844 },
};

// Chromium keeps its original, unsuffixed project names (light-desktop,
// not light-desktop-chromium) so its already-committed baselines stay
// valid — Firefox and WebKit are added alongside it as engine-suffixed
// projects, matching the Browserslist floor in package.json.
/** @type {["chromium" | "firefox" | "webkit", string][]} */
const engines = [
	["chromium", ""],
	["firefox", "-firefox"],
	["webkit", "-webkit"],
];

/** @type {("light" | "dark")[]} */
const colorSchemes = ["light", "dark"];

const projects = [];
for (const [browserName, suffix] of engines) {
	for (const [form, viewport] of Object.entries(viewports)) {
		for (const colorScheme of colorSchemes) {
			projects.push({
				name: `${colorScheme}-${form}${suffix}`,
				use: { browserName, colorScheme, viewport },
			});
		}
	}
}

module.exports = defineConfig({
	testDir: "tests",
	testMatch: "visual.spec.js",
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
	projects,
});
