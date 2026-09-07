const sass = require("sass-embedded");
const path = require("node:path");
const fs = require("node:fs");
const os = require("node:os");
const { compileScssFolder } = require("./lib/compile-scss");

// The docs site dogfoods Cirth: the whole site (header, sidebar, prose,
// live examples) is styled by the real default build, unscoped. A second,
// classless variant is scoped under `.cirth-classless` so classless demos
// can render accurately without their landmark/container rules fighting
// the site-wide build.
const variants = [
	{
		filename: "cirth-docs.css",
		content: `@use "src"; @use "src/utilities/print";`,
	},
	{
		filename: "cirth-docs-classless.css",
		content: `@use "src/config" with (
      $enable-classes: false,
      $parent-selector: ".cirth-classless"
    );
    @use "src";
    @use "src/utilities/print";`,
	},
	// The homepage build laboratory is isolated in an iframe so the docs'
	// unscoped default build cannot leak into the comparison. These are the
	// actual four public configurations, compiled from source with the same
	// switches as the distributed entrypoints — not look-alike shell CSS.
	{
		filename: "cirth-lab-default.css",
		content: `@use "src";`,
	},
	{
		filename: "cirth-lab-classless.css",
		content: `@use "src/config" with ($enable-classes: false); @use "src";`,
	},
	{
		filename: "cirth-lab-scoped.css",
		content: `@use "src/config" with ($parent-selector: ".cirth"); @use "src";`,
	},
	{
		filename: "cirth-lab-scoped-classless.css",
		content: `@use "src/config" with (
      $enable-classes: false,
      $parent-selector: ".cirth"
    );
    @use "src";`,
	},
];

const projectRoot = path.join(__dirname, "..");
const outputFoldername = path.join(projectRoot, "docs/src/styles/generated");
const tempEntryFoldername = fs.mkdtempSync(
	path.join(os.tmpdir(), "cirth-docs-"),
);

fs.mkdirSync(outputFoldername, { recursive: true });

try {
	for (const variant of variants) {
		const tempEntryFilename = path.join(
			tempEntryFoldername,
			variant.filename.replace(".css", ".scss"),
		);
		fs.writeFileSync(tempEntryFilename, variant.content);

		const result = sass.compile(tempEntryFilename, {
			loadPaths: [projectRoot],
			style: "expanded",
		});

		fs.writeFileSync(path.join(outputFoldername, variant.filename), result.css);
	}

	// Presets, compiled the same way scripts/build-presets.js compiles them
	// for dist/ (standalone, no build-time config to inject) — so the header's
	// live preset switcher (see site-header.njk / base.njk, gh#80) has a real
	// stylesheet to swap in rather than a reimplementation of one. Kept
	// separate from npm run build's dist/presets/ output on purpose: docs:build
	// stays runnable on its own, with no dependency on dist/ existing first.
	compileScssFolder({
		sourceFolder: path.join(projectRoot, "src/presets"),
		outputFolder: path.join(outputFoldername, "presets"),
	});

	console.log("[cirth] docs assets built");
} finally {
	fs.rmSync(tempEntryFoldername, { recursive: true, force: true });
}
