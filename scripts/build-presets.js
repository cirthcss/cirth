const sass = require("sass-embedded");
const path = require("node:path");
const fs = require("node:fs");

const projectRoot = path.join(__dirname, "..");
const presetsSourceFolder = path.join(projectRoot, "src/presets");
const outputFolder = path.join(projectRoot, "presets");

// Presets are plain custom-property overrides (see src/presets/), so each
// one compiles standalone with no build-time configuration to inject.
const getPresetEntries = () =>
	fs
		.readdirSync(presetsSourceFolder, { withFileTypes: true })
		.filter((dirent) => dirent.isFile() && dirent.name.endsWith(".scss"))
		.map((dirent) => path.join(presetsSourceFolder, dirent.name))
		.sort();

fs.rmSync(outputFolder, { recursive: true, force: true });
fs.mkdirSync(outputFolder, { recursive: true });

getPresetEntries().forEach((source) => {
	const output = path.join(
		outputFolder,
		path.basename(source).replace(/\.scss$/, ".css"),
	);
	const result = sass.compile(source, {
		sourceMap: false,
		style: "expanded",
	});

	fs.writeFileSync(output, result.css);
});
