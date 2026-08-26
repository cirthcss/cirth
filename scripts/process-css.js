const fs = require("node:fs");
const path = require("node:path");
const { runSync } = require("./lib/run-sync");

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
/** @param {string} foldername */
const getCssFiles = (foldername) =>
	fs
		.readdirSync(foldername)
		.filter(
			(filename) => filename.endsWith(".css") && !filename.endsWith(".min.css"),
		)
		.sort();

/** @param {readonly string[]} args */
const runLightningCss = (args) => runSync(lightningcssBinary, args);

// theme/_dual.scss states every scheme difference once, as a light-dark()
// pair, and the whole customization contract rests on that resolving
// natively: the pair is evaluated where the token is *used*, against that
// element's color-scheme, which is what lets a [data-theme] subtree switch
// while a consumer's :root override still reaches into it.
//
// Lightning CSS will compile light-dark() away if any target sits below
// its floor, replacing it with a --lightningcss-light/--lightningcss-dark
// emulation. That emulation does not reproduce the semantics — a forced
// scheme subtree stops resolving its own values — so its appearance is a
// broken build, not a slower one. It is worth failing loudly for: the
// output still looks plausible, and the visual suite does not render
// forced-scheme subtrees, so nothing else would catch it.
//
// The usual cause is a family whose caniuse bucket is stale; see the
// FORBIDDEN list in scripts/check-browserslist.js.
/** @param {string} filename */
const assertNativeLightDark = (filename) => {
	const css = fs.readFileSync(filename, "utf8");

	if (!css.includes("--lightningcss-")) {
		return;
	}

	console.error(
		`[@cirthcss/cirth] ${path.basename(filename)}: light-dark() was ` +
			"compiled to Lightning CSS's emulation, which does not reproduce " +
			"its semantics. A Browserslist target is below the light-dark() " +
			"floor — check package.json against scripts/check-browserslist.js.",
	);
	process.exit(1);
};

/** @param {string} foldername */
const transformFolder = (foldername) => {
	getCssFiles(foldername).forEach((filename) => {
		const source = path.join(foldername, filename);
		const temp = `${source}.tmp`;

		// Write to a temporary file first so the input is never overwritten mid-process.
		runLightningCss(["--browserslist", source, "-o", temp]);
		fs.renameSync(temp, source);
		assertNativeLightDark(source);
	});
};

/** @param {string} foldername */
const minifyFolder = (foldername) => {
	getCssFiles(foldername).forEach((filename) => {
		const source = path.join(foldername, filename);
		const output = path.join(foldername, filename.replace(/\.css$/, ".min.css"));

		// Minified output is always derived from the already transformed CSS.
		runLightningCss(["--browserslist", "--minify", source, "-o", output]);
		assertNativeLightDark(output);
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
