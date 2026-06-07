const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const sass = require("sass-embedded");

const projectRoot = path.join(__dirname, "..");
const binFolder = path.join(projectRoot, "node_modules/.bin");
const binExtension = process.platform === "win32" ? ".cmd" : "";
const sourceFolder = path.join(projectRoot, "src");
const outputFolder = path.join(projectRoot, "dist");

const getBinary = (name) => path.join(binFolder, `${name}${binExtension}`);

// Compile only real SCSS entrypoints; partials are pulled in through @use/@forward.
const getScssEntries = (foldername) => {
	const entries = [];

	fs.readdirSync(foldername, { withFileTypes: true }).forEach((dirent) => {
		const filename = path.join(foldername, dirent.name);

		if (dirent.isDirectory()) {
			entries.push(...getScssEntries(filename));
		} else if (dirent.isFile() && filename.endsWith(".scss") && !dirent.name.startsWith("_")) {
			entries.push(filename);
		}
	});

	return entries.sort();
};

const run = (label, command, args) => {
	console.log(`[@cirthcss/cirth] ${label}`);

	const result = spawnSync(command, args, {
		cwd: projectRoot,
		stdio: "inherit",
		env: process.env,
	});

	if (result.error) {
		console.error(result.error.message);
		process.exit(1);
	}

	if (result.status !== 0) {
		process.exit(result.status || 1);
	}
};

// Use the Sass Embedded API directly so the build does not depend on an ambiguous sass CLI binary.
const compileCss = () => {
	console.log("[@cirthcss/cirth] Compile");

	getScssEntries(sourceFolder).forEach((source) => {
		const relativeSource = path.relative(sourceFolder, source);
		const output = path.join(
			outputFolder,
			relativeSource.replace(/\.scss$/, ".css"),
		);
		const result = sass.compile(source, {
			sourceMap: false,
			style: "expanded",
		});

		fs.mkdirSync(path.dirname(output), { recursive: true });
		fs.writeFileSync(output, result.css);
	});
};

console.log("\x1b[96m[@cirthcss/cirth] Start\x1b[0m");

// Keep this order: every generated CSS file should pass through Lightning CSS before minification.
run("Format", getBinary("prettier"), [
	"--write",
	"--log-level",
	"silent",
	"src/**/*.scss",
]);
run("Lint", getBinary("stylelint"), ["src/**/*.scss"]);
compileCss();
run("Compile themes", process.execPath, [path.join(__dirname, "build-themes.js")]);
run("Transform CSS", process.execPath, [
	path.join(__dirname, "process-css.js"),
	"--transform",
]);
run("Minify", process.execPath, [
	path.join(__dirname, "process-css.js"),
	"--minify",
]);

console.log("\x1b[32m[@cirthcss/cirth] Done\x1b[0m");
