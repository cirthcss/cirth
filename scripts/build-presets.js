const path = require("node:path");
const fs = require("node:fs");
const { compileScssFolder } = require("./lib/compile-scss");

// Presets (src/presets/) are plain custom-property overrides, so each one
// compiles standalone with no build-time configuration to inject.
const projectRoot = path.join(__dirname, "..");
const presetsSourceFolder = path.join(projectRoot, "src/presets");
const outputFolder = path.join(projectRoot, "dist/presets");

fs.rmSync(outputFolder, { recursive: true, force: true });

compileScssFolder({ sourceFolder: presetsSourceFolder, outputFolder });
