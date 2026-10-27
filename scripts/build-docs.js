const sass = require("sass-embedded");
const path = require("node:path");
const fs = require("node:fs");
const os = require("node:os");
const { compileScssFolder } = require("./lib/compile-scss");

// The docs site dogfoods Cirth: the whole site (header, sidebar, prose,
// live examples) is styled by the real default build, unscoped.
const variants = [
	{
		filename: "cirth-docs.css",
		content: `@use "src";`,
	},
	// The four public configurations, compiled from source with the same
	// switches as the distributed entrypoints, for pages that show one build
	// alone: the /lab/ pages the examples page frames, the specimen pages,
	// and the home page's isolated copies (the scoped build).
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

/** @param {string} folder @param {string[]} keep */
const prune = (folder, keep) => {
	for (const entry of fs.readdirSync(folder)) {
		if (!keep.includes(entry)) fs.rmSync(path.join(folder, entry), { recursive: true, force: true });
	}
};

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
	// for dist/ (standalone, no build-time config to inject), so the header's
	// live preset switcher (see site-header.njk / base.njk, gh#80) has a real
	// stylesheet to swap in rather than a reimplementation of one. Kept
	// separate from npm run build's dist/presets/ output on purpose: docs:build
	// stays runnable on its own, with no dependency on dist/ existing first.
	const presetsFoldername = path.join(outputFoldername, "presets");
	const presets = compileScssFolder({
		sourceFolder: path.join(projectRoot, "src/presets"),
		outputFolder: presetsFoldername,
	});

	// Generated files whose source is gone (a removed preset or variant)
	// would otherwise keep being copied into the site.
	prune(outputFoldername, [...variants.map((variant) => variant.filename), "presets"]);
	prune(
		presetsFoldername,
		presets.map((source) => path.basename(source).replace(/\.scss$/, ".css")),
	);

	console.log("[cirth] docs assets built");
} finally {
	fs.rmSync(tempEntryFoldername, { recursive: true, force: true });
}
