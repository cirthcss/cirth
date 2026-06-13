const sass = require("sass-embedded");
const path = require("node:path");
const fs = require("node:fs");
const os = require("node:os");

const themeColors = [
	"amber",
	"blue",
	"cyan",
	"fuchsia",
	"green",
	"grey",
	"indigo",
	"jade",
	"lime",
	"orange",
	"pink",
	"pumpkin",
	"purple",
	"red",
	"sand",
	"slate",
	"violet",
	"yellow",
	"zinc",
];

const projectRoot = path.join(__dirname, "..");
const tempEntryFoldername = fs.mkdtempSync(
	path.join(os.tmpdir(), "cirth-themes-"),
);
const outputFoldername = path.join(projectRoot, "dist");

fs.mkdirSync(outputFoldername, { recursive: true });

try {
	themeColors.forEach((themeColor, colorIndex) => {
		// Theme CSS is generated from temporary SCSS entrypoints so each file can override Cirth settings.
		const versions = [
			{
				name: "cirth",
				content: `@use "src" with (
        $theme-color: "${themeColor}"
      );`,
			},
			{
				name: "cirth.classless",
				content: `@use "src" with (
        $theme-color: "${themeColor}",
        $enable-semantic-container: true,
        $enable-classes: false
      );`,
			},
			{
				name: "cirth.scoped",
				content: `@use "src" with (
        $theme-color: "${themeColor}",
        $parent-selector: ".cirth"
      );`,
			},
			{
				name: "cirth.classless.scoped",
				content: `@use "src" with (
        $theme-color: "${themeColor}",
        $enable-semantic-container: true,
        $enable-classes: false,
        $parent-selector: ".cirth"
      );`,
			},
		];

		const displayAsciiProgress = ({ length, index, color }) => {
			const progress = Math.round((index / length) * 100);
			const bar = "■".repeat(progress / 10);
			const empty = "□".repeat(10 - progress / 10);
			process.stdout.write(`[@cirthcss/cirth] ✨ ${bar}${empty} ${color}\r`);
		};

		versions.forEach((version) => {
			displayAsciiProgress({
				length: themeColors.length,
				index: colorIndex,
				color: themeColor.charAt(0).toUpperCase() + themeColor.slice(1),
			});

			const tempEntryFilename = path.join(
				tempEntryFoldername,
				`${version.name}.${themeColor}.scss`,
			);

			fs.writeFileSync(tempEntryFilename, version.content);

			const result = sass.compile(tempEntryFilename, {
				loadPaths: [projectRoot],
				outputStyle: "compressed",
			});

			fs.writeFileSync(
				path.join(outputFoldername, `${version.name}.${themeColor}.css`),
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
