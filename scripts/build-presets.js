const path = require("node:path");
const fs = require("node:fs");
const { compileScssFolder } = require("./lib/compile-scss");
const { readPrefixArg } = require("./lib/prefix");

// Presets (src/presets/) are plain custom-property overrides, so each one
// compiles standalone with no build-time configuration to inject. The one
// exception is the custom property prefix, which build.js forwards so a
// preset keeps overriding the tokens of the stylesheet it ships with.
const projectRoot = path.join(__dirname, "..");
const presetsSourceFolder = path.join(projectRoot, "src/presets");
const outputFolder = path.join(projectRoot, "dist/presets");

fs.rmSync(outputFolder, { recursive: true, force: true });

compileScssFolder({
	sourceFolder: presetsSourceFolder,
	outputFolder,
	prefix: readPrefixArg(process.argv.slice(2)),
});
