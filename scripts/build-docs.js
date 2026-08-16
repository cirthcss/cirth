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
		content: `@use "src";`,
	},
	{
		filename: "cirth-docs-classless.css",
		content: `@use "src/config" with (
      $enable-classes: false,
      $parent-selector: ".cirth-classless"
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
