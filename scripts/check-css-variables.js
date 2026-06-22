const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.join(__dirname, "..");
const sourceFolder = path.join(projectRoot, "src");
const customPropertyPattern = /--[a-zA-Z_][a-zA-Z0-9_-]*/g;
const customPropertyDeclarationPattern =
	/(--[a-zA-Z_][a-zA-Z0-9_-]*)\s*:\s*((?:#\{[^{}]*\}|[^;{}])*)\s*;/gs;
const cirthPropertyPattern = /^--cirth-[a-z0-9]+(?:-[a-z0-9]+)*$/;
const legacyPrefixPattern = /\$css-var-prefix/g;
const sassExpressionPattern =
	/\$[a-zA-Z_-]|\b[a-z][a-z0-9-]*\.[a-z][a-z0-9-]*\s*\(/;

const getScssFiles = (folder) =>
	fs
		.readdirSync(folder, { withFileTypes: true })
		.flatMap((entry) => {
			const filename = path.join(folder, entry.name);

			if (entry.isDirectory()) {
				return getScssFiles(filename);
			}

			return entry.isFile() && entry.name.endsWith(".scss") ? [filename] : [];
		})
		.sort();

const violations = [];
let checkedProperties = 0;

getScssFiles(sourceFolder).forEach((filename) => {
	const relativeFilename = path.relative(projectRoot, filename);
	const source = fs.readFileSync(filename, "utf8");
	const lines = source.split("\n");

	for (const match of source.matchAll(customPropertyDeclarationPattern)) {
		const uninterpolatedValue = match[2].replace(/#\{[^{}]*\}/gs, "");
		const sassExpression = uninterpolatedValue.match(sassExpressionPattern);

		if (sassExpression) {
			const line = source.slice(0, match.index).split("\n").length;
			violations.push(
				`${relativeFilename}:${line} Interpolate Sass expressions in ${match[1]} values`,
			);
		}
	}

	lines.forEach((line, index) => {
		for (const match of line.matchAll(customPropertyPattern)) {
			checkedProperties += 1;

			if (!cirthPropertyPattern.test(match[0])) {
				violations.push(
					`${relativeFilename}:${index + 1}:${match.index + 1} Invalid custom property ${match[0]}`,
				);
			}
		}

		for (const match of line.matchAll(legacyPrefixPattern)) {
			violations.push(
				`${relativeFilename}:${index + 1}:${match.index + 1} Remove the legacy $css-var-prefix abstraction`,
			);
		}
	});
});

if (violations.length > 0) {
	console.error("[@cirthcss/cirth] Invalid CSS custom properties:\n");
	violations.forEach((violation) => {
		console.error(`- ${violation}`);
	});

	process.exit(1);
}

console.log(
	`[@cirthcss/cirth] Checked ${checkedProperties} CSS custom property references`,
);
