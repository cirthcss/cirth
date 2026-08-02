const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");

const projectRoot = path.join(__dirname, "..");
const distDir = path.join(projectRoot, "dist");

// Gzipped ceiling for each root bundle in dist/. Size is part of the
// pitch ("lightweight", minimal philosophy), so growth past this line
// should be a deliberate decision, not creep: raise the budget in the
// same change that needs it, and say why in the commit.
// Current bundles sit at ~11-12.5 KiB gzipped.
const budgetBytes = 14 * 1024;

const warnOnly = process.argv.includes("--warn-only");

if (!fs.existsSync(distDir)) {
	console.error("check-css-size: dist/ not found — run `npm run build` first.");
	process.exit(1);
}

const bundles = fs
	.readdirSync(distDir)
	.filter((name) => name.endsWith(".min.css"))
	.sort();

if (bundles.length === 0) {
	console.error("check-css-size: no dist/*.min.css bundles found.");
	process.exit(1);
}

let failed = false;

for (const name of bundles) {
	const source = fs.readFileSync(path.join(distDir, name));
	const gzippedBytes = zlib.gzipSync(source, { level: 9 }).length;
	const overBudget = gzippedBytes >= budgetBytes;

	const mark = overBudget ? (warnOnly ? "⚠" : "✗") : "✓";
	console.log(
		`${mark} dist/${name} — ${gzippedBytes} B gzipped` +
			` (budget ${budgetBytes} B)`,
	);

	if (overBudget) {
		failed = true;
	}
}

if (failed) {
	const message =
		"\ncheck-css-size: a bundle exceeds the gzipped size budget. Either " +
		"trim the change or raise budgetBytes deliberately in " +
		"scripts/check-css-size.js.";

	if (warnOnly) {
		console.warn(message);
	} else {
		console.error(message);
		process.exit(1);
	}
}
