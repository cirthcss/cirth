const fs = require("node:fs");
const path = require("node:path");
const sass = require("sass-embedded");
const { DEFAULT_PREFIX, applyPrefix } = require("./prefix");

// Compiles every matching .scss file directly under `sourceFolder` to
// plain, expanded (unminified) CSS in `outputFolder`: the shared first
// build step both the default entrypoints (cirth*.scss, build.js) and
// the presets (src/presets/*.scss, build-presets.js) go through before
// Lightning CSS transforms and minifies the result. `prefix` renames the
// `--cirth-` custom properties in that output (see ./prefix.js).
/**
 * @param {object} options
 * @param {string} options.sourceFolder
 * @param {string} options.outputFolder
 * @param {(dirent: import("node:fs").Dirent) => boolean} [options.filter]
 * @param {string} [options.prefix]
 */
const compileScssFolder = ({
	sourceFolder,
	outputFolder,
	filter = () => true,
	prefix = DEFAULT_PREFIX,
}) => {
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
		fs.writeFileSync(output, applyPrefix(result.css, prefix));
	}

	return entries;
};

module.exports = { compileScssFolder };
