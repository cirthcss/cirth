const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

// Presets (src/presets/) are plain custom-property overrides compiled into
// dist/presets/ and treated exactly like the rest of dist/: transformed by
// Lightning CSS, then minified.
const distFoldername = path.join(__dirname, "../dist");
const presetsFoldername = path.join(__dirname, "../dist/presets");
const lightningcssBinary = path.join(
	__dirname,
	"../node_modules/.bin",
	process.platform === "win32" ? "lightningcss.cmd" : "lightningcss",
);

const mode = process.argv[2];

// Lightning CSS works on the expanded files; minified files are regenerated separately.
const getCssFiles = (foldername) =>
	fs
		.readdirSync(foldername)
		.filter(
			(filename) => filename.endsWith(".css") && !filename.endsWith(".min.css"),
		)
		.sort();

const runLightningCss = (args) => {
	const result = spawnSync(lightningcssBinary, args, { stdio: "inherit" });

	if (result.error) {
		console.error(result.error.message);
		process.exit(1);
	}

	if (result.status !== 0) {
		process.exit(result.status || 1);
	}
};

const transformFolder = (foldername) => {
	getCssFiles(foldername).forEach((filename) => {
		const source = path.join(foldername, filename);
		const temp = `${source}.tmp`;

		// Write to a temporary file first so the input is never overwritten mid-process.
		runLightningCss(["--browserslist", source, "-o", temp]);
		fs.renameSync(temp, source);
	});
};

const minifyFolder = (foldername) => {
	getCssFiles(foldername).forEach((filename) => {
		const source = path.join(foldername, filename);
		const output = path.join(foldername, filename.replace(/\.css$/, ".min.css"));

		// Minified output is always derived from the already transformed CSS.
		runLightningCss(["--browserslist", "--minify", source, "-o", output]);
	});
};

if (!fs.existsSync(lightningcssBinary)) {
	console.error("Lightning CSS CLI was not found. Run `npm install` first.");
	process.exit(1);
}

if (!fs.existsSync(distFoldername)) {
	console.error("The dist folder was not found.");
	process.exit(1);
}

if (mode === "--transform") {
	transformFolder(distFoldername);

	if (fs.existsSync(presetsFoldername)) {
		transformFolder(presetsFoldername);
	}
} else if (mode === "--minify") {
	minifyFolder(distFoldername);

	if (fs.existsSync(presetsFoldername)) {
		minifyFolder(presetsFoldername);
	}
} else {
	console.error("Usage: node scripts/process-css --transform|--minify");
	process.exit(1);
}
