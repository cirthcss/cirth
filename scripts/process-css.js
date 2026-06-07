const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const outputFoldername = path.join(__dirname, "../dist");
const lightningcssBinary = path.join(
	__dirname,
	"../node_modules/.bin",
	process.platform === "win32" ? "lightningcss.cmd" : "lightningcss",
);

const mode = process.argv[2];

// Lightning CSS works on the expanded files; minified files are regenerated separately.
const getCssFiles = () =>
	fs
		.readdirSync(outputFoldername)
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

if (!fs.existsSync(lightningcssBinary)) {
	console.error("Lightning CSS CLI was not found. Run `npm install` first.");
	process.exit(1);
}

if (!fs.existsSync(outputFoldername)) {
	console.error("The dist folder was not found.");
	process.exit(1);
}

if (mode === "--transform") {
	getCssFiles().forEach((filename) => {
		const source = path.join(outputFoldername, filename);
		const temp = `${source}.tmp`;

		// Write to a temporary file first so the input is never overwritten mid-process.
		runLightningCss(["--browserslist", source, "-o", temp]);
		fs.renameSync(temp, source);
	});
} else if (mode === "--minify") {
	getCssFiles().forEach((filename) => {
		const source = path.join(outputFoldername, filename);
		const output = path.join(
			outputFoldername,
			filename.replace(/\.css$/, ".min.css"),
		);

		// Minified output is always derived from the already transformed CSS.
		runLightningCss(["--browserslist", "--minify", source, "-o", output]);
	});
} else {
	console.error("Usage: node scripts/process-css --transform|--minify");
	process.exit(1);
}
