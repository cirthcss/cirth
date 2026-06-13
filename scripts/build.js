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

// Compile only public top-level Cirth entrypoints; internals are pulled in through @use/@forward.
const getScssEntries = () =>
	fs
		.readdirSync(sourceFolder, { withFileTypes: true })
		.filter(
			(dirent) =>
				dirent.isFile() &&
				dirent.name.startsWith("cirth") &&
				dirent.name.endsWith(".scss"),
		)
		.map((dirent) => path.join(sourceFolder, dirent.name))
		.sort();

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

	getScssEntries().forEach((source) => {
		const output = path.join(
			outputFolder,
			path.basename(source).replace(/\.scss$/, ".css"),
		);
		const result = sass.compile(source, {
			sourceMap: false,
			style: "expanded",
		});

		fs.mkdirSync(path.dirname(output), { recursive: true });
		fs.writeFileSync(output, result.css);
	});
};

const cleanOutput = () => {
	console.log("[@cirthcss/cirth] Clean");
	fs.rmSync(outputFolder, { recursive: true, force: true });
	fs.mkdirSync(outputFolder, { recursive: true });
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
cleanOutput();
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
