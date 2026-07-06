const sass = require("sass-embedded");
const path = require("node:path");
const fs = require("node:fs");
const os = require("node:os");

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
const outputFoldername = path.join(
	projectRoot,
	"docs/.vitepress/theme/generated",
);
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

	console.log("[cirth] docs assets built");
} finally {
	fs.rmSync(tempEntryFoldername, { recursive: true, force: true });
}
