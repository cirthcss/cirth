const sass = require("sass-embedded");
const path = require("node:path");
const fs = require("node:fs");

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

const tempEntryFoldername = path.join(__dirname, "../.cirth");
const outputFoldername = path.join(__dirname, "../dist");

const createFolderIfNotExists = (foldername) => {
	if (!fs.existsSync(foldername)) {
		fs.mkdirSync(foldername);
	}
};

const emptyFolder = (foldername) => {
	fs.readdirSync(foldername).forEach((file) => {
		fs.unlinkSync(path.join(foldername, file));
	});
};

createFolderIfNotExists(tempEntryFoldername);
emptyFolder(tempEntryFoldername);

themeColors.forEach((themeColor, colorIndex) => {
	// Theme CSS is generated from temporary SCSS entrypoints so each file can override Cirth settings.
	const versions = [
		{
			name: "cirth",
			content: `@use "../src" with (
        $theme-color: "${themeColor}"
      );`,
		},
		{
			name: "cirth.classless",
			content: `@use "../src" with (
        $theme-color: "${themeColor}",
        $enable-semantic-container: true,
        $enable-classes: false
      );`,
		},
		{
			name: "cirth.fluid.classless",
			content: `@use "../src" with (
        $theme-color: "${themeColor}", 
        $enable-semantic-container: true, 
        $enable-viewport: false, 
        $enable-classes: false
      );`,
		},
		{
			name: "cirth.conditional",
			content: `@use "../src" with (
        $theme-color: "${themeColor}",
        $parent-selector: ".cirth"
      );`,
		},
		{
			name: "cirth.classless.conditional",
			content: `@use "../src" with (
        $theme-color: "${themeColor}",
        $enable-semantic-container: true,
        $enable-classes: false,
        $parent-selector: ".cirth"
      );`,
		},
		{
			name: "cirth.fluid.classless.conditional",
			content: `@use "../src" with (
        $theme-color: "${themeColor}", 
        $enable-semantic-container: true, 
        $enable-viewport: false, 
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

		fs.writeFileSync(
			path.join(tempEntryFoldername, `${version.name}.${themeColor}.scss`),
			version.content,
		);

		const result = sass.compile(
			path.join(tempEntryFoldername, `${version.name}.${themeColor}.scss`),
			{ outputStyle: "compressed" },
		);

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

emptyFolder(tempEntryFoldername);
