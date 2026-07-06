const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.join(__dirname, "..");
const violations = [];

// Canonical theme set, derived from source rather than restated here:
// - the default theme's display name comes from src/_config.scss;
// - the other themes come from scripts/build-themes.js, cross-checked
//   against the theme folders that actually exist under src/themes/.
const configSource = fs.readFileSync(
	path.join(projectRoot, "src/_config.scss"),
	"utf8",
);
const defaultThemeMatch = configSource.match(
	/\$theme-color:\s*"([a-z0-9-]+)"\s*!default/,
);

if (!defaultThemeMatch) {
	violations.push(
		"src/_config.scss: could not find the $theme-color default — update the parser in scripts/check-theme-docs.js",
	);
}

const defaultThemeName = defaultThemeMatch?.[1];

const buildThemesSource = fs.readFileSync(
	path.join(projectRoot, "scripts/build-themes.js"),
	"utf8",
);
const themeNamesMatch = buildThemesSource.match(
	/const themeNames\s*=\s*\[([^\]]*)\]/,
);

if (!themeNamesMatch) {
	violations.push(
		"scripts/build-themes.js: could not find the themeNames array — update the parser in scripts/check-theme-docs.js",
	);
}

const otherThemeNames = (themeNamesMatch?.[1].match(/"([a-z0-9-]+)"/g) ?? [])
	.map((token) => token.slice(1, -1))
	.sort();

const themeFolders = fs
	.readdirSync(path.join(projectRoot, "src/themes"), { withFileTypes: true })
	.filter((entry) => entry.isDirectory() && entry.name !== "base")
	.map((entry) => entry.name)
	.filter((name) => name !== "default")
	.sort();

if (JSON.stringify(otherThemeNames) !== JSON.stringify(themeFolders)) {
	violations.push(
		`scripts/build-themes.js's themeNames (${otherThemeNames.join(", ") || "none"}) ` +
			`is out of sync with the theme folders under src/themes/ (${themeFolders.join(", ") || "none"})`,
	);
}

const canonicalThemeNames = defaultThemeName
	? [defaultThemeName, ...otherThemeNames]
	: otherThemeNames;
const canonicalThemeSet = new Set(canonicalThemeNames);

// Prose that names the maintained theme set. If a theme is added or
// removed from the code above, these are the places doc updates need to
// land — this check just makes sure they still match.
const docFiles = [
	"README.md",
	"docs/get-started.md",
	"docs/colors.md",
	"docs/about.md",
	"docs/index.md",
];

docFiles.forEach((relativeFilename) => {
	const filename = path.join(projectRoot, relativeFilename);
	const source = fs.readFileSync(filename, "utf8");
	const lowerSource = source.toLowerCase();

	canonicalThemeNames.forEach((themeName) => {
		const wordPattern = new RegExp(`\\b${themeName}\\b`, "i");

		if (!wordPattern.test(lowerSource)) {
			violations.push(
				`${relativeFilename}: doesn't mention the "${themeName}" theme — ` +
					"add it wherever the maintained theme set is listed",
			);
		}
	});

	// Filenames like dist/cirth.amber.min.css name a theme explicitly, so
	// unlike bare prose words (which collide with unrelated things like
	// Tailwind's `bg-blue-600` or badge colors) they're safe to check.
	const themeFilenamePattern =
		/dist\/cirth(?:\.classless)?(?:\.scoped)?\.([a-z0-9-]+)\.min\.css/gi;

	for (const match of source.matchAll(themeFilenamePattern)) {
		const themeToken = match[1].toLowerCase();

		// "classless"/"scoped" are build modifiers, not themes — a filename
		// like dist/cirth.classless.min.css has no theme segment at all, but
		// the regex above can't tell that apart from a real theme token.
		if (themeToken === "classless" || themeToken === "scoped") {
			continue;
		}

		if (!canonicalThemeSet.has(themeToken)) {
			violations.push(
				`${relativeFilename}: references "${match[0]}", but "${themeToken}" isn't ` +
					"one of Cirth's maintained themes — check for a stale filename",
			);
		}
	}
});

// The docs site's swatch component hardcodes theme names/colors for
// display (see the file for why) — keep its list in sync too.
const colorSwatchesFilename = path.join(
	projectRoot,
	"docs/.vitepress/theme/components/ColorSwatches.vue",
);
const colorSwatchesSource = fs.readFileSync(colorSwatchesFilename, "utf8");
const swatchNames = [...colorSwatchesSource.matchAll(/name:\s*"([a-z0-9-]+)"/g)]
	.map((match) => match[1])
	.sort();

if (JSON.stringify(swatchNames) !== JSON.stringify([...canonicalThemeSet].sort())) {
	violations.push(
		"docs/.vitepress/theme/components/ColorSwatches.vue: its swatch list " +
			`(${swatchNames.join(", ") || "none"}) doesn't match the maintained theme set ` +
			`(${canonicalThemeNames.join(", ")})`,
	);
}

if (violations.length > 0) {
	console.error(
		"[@cirthcss/cirth] Theme docs are out of sync with the maintained theme set:\n",
	);
	violations.forEach((violation) => {
		console.error(`- ${violation}`);
	});

	process.exit(1);
}

console.log(
	`[@cirthcss/cirth] Checked ${docFiles.length} docs against ${canonicalThemeNames.length} maintained themes (${canonicalThemeNames.join(", ")})`,
);
