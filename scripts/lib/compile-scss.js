const fs = require("node:fs");
const path = require("node:path");
const sass = require("sass-embedded");

// Compiles every matching .scss file directly under `sourceFolder` to
// plain, expanded (unminified) CSS in `outputFolder` — the shared first
// build step both the default entrypoints (cirth*.scss, build.js) and
// the presets (src/presets/*.scss, build-presets.js) go through before
// Lightning CSS transforms and minifies the result.
const compileScssFolder = ({ sourceFolder, outputFolder, filter = () => true }) => {
	fs.mkdirSync(outputFolder, { recursive: true });

	const entries = fs
		.readdirSync(sourceFolder, { withFileTypes: true })
		.filter(
			(dirent) => dirent.isFile() && dirent.name.endsWith(".scss") && filter(dirent),
		)
		.map((dirent) => path.join(sourceFolder, dirent.name))
		.sort();

	for (const source of entries) {
		const output = path.join(
			outputFolder,
			path.basename(source).replace(/\.scss$/, ".css"),
		);
		const result = sass.compile(source, { sourceMap: false, style: "expanded" });
		fs.writeFileSync(output, result.css);
	}

	return entries;
};

module.exports = { compileScssFolder };
