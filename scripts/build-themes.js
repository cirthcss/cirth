const sass = require("sass-embedded");
const path = require("node:path");
const fs = require("node:fs");
const os = require("node:os");

// The default build (azure, no suffix) is compiled by build.js. This script
// compiles the other two named themes, each a complete theme under
// src/themes/, not an accent swap of the default theme.
const themeNames = ["jade", "slate"];

const projectRoot = path.join(__dirname, "..");
const tempEntryFoldername = fs.mkdtempSync(
	path.join(os.tmpdir(), "cirth-themes-"),
);
const outputFoldername = path.join(projectRoot, "dist");

fs.mkdirSync(outputFoldername, { recursive: true });

try {
	themeNames.forEach((themeName, themeIndex) => {
		// Theme CSS is generated from temporary SCSS entrypoints so each file can configure its build.
		const versions = [
			{
				name: "cirth",
				content: `@use "src/config" with (
        $theme-color: "${themeName}"
      );
      @use "src";`,
			},
			{
				name: "cirth.classless",
				content: `@use "src/config" with (
        $theme-color: "${themeName}",
        $enable-classes: false
      );
      @use "src";`,
			},
			{
				name: "cirth.scoped",
				content: `@use "src/config" with (
        $theme-color: "${themeName}",
        $parent-selector: ".cirth"
      );
      @use "src";`,
			},
			{
				name: "cirth.classless.scoped",
				content: `@use "src/config" with (
        $theme-color: "${themeName}",
        $enable-classes: false,
        $parent-selector: ".cirth"
      );
      @use "src";`,
			},
		];

		const displayAsciiProgress = ({ length, index, name }) => {
			const progress = Math.round((index / length) * 100);
			const bar = "■".repeat(progress / 10);
			const empty = "□".repeat(10 - progress / 10);
			process.stdout.write(`[@cirthcss/cirth] ✨ ${bar}${empty} ${name}\r`);
		};

		versions.forEach((version) => {
			displayAsciiProgress({
				length: themeNames.length,
				index: themeIndex,
				name: themeName.charAt(0).toUpperCase() + themeName.slice(1),
			});

			const tempEntryFilename = path.join(
				tempEntryFoldername,
				`${version.name}.${themeName}.scss`,
			);

			fs.writeFileSync(tempEntryFilename, version.content);

			const result = sass.compile(tempEntryFilename, {
				loadPaths: [projectRoot],
				outputStyle: "compressed",
			});

			fs.writeFileSync(
				path.join(outputFoldername, `${version.name}.${themeName}.css`),
				result.css,
			);

			// Clear the console when running in an interactive terminal.
			if (process.stdout.clearLine && process.stdout.cursorTo) {
				process.stdout.clearLine();
				process.stdout.cursorTo(0);
			}
		});
	});
} finally {
	fs.rmSync(tempEntryFoldername, { recursive: true, force: true });
}
