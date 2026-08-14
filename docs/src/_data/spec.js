const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");

// Machine-plate data for the homepage hero (and anywhere else the site
// quotes a figure). Everything here is measured or read from the repo at
// docs-build time rather than typed into a template: the hero states a
// weight and a revision, and those have to be the real ones or the plate
// is decoration. Same gzip settings as scripts/check-css-size.js, so the
// number on the page is the number the size budget is enforced against.
const projectRoot = path.join(__dirname, "../../..");

const packageJson = JSON.parse(
	fs.readFileSync(path.join(projectRoot, "package.json"), "utf8"),
);

/** @param {string} file */
const gzippedBytes = (file) => {
	const full = path.join(projectRoot, "dist", file);
	if (!fs.existsSync(full)) return null;
	return zlib.gzipSync(fs.readFileSync(full), { level: 9 }).length;
};

const defaultBuildBytes = gzippedBytes("cirth.min.css");

module.exports = {
	version: packageJson.version,
	license: packageJson.license,

	// Null when dist/ hasn't been built yet — templates fall back rather
	// than printing "null B" (docs:build can legitimately run on its own).
	defaultBuildBytes,
	defaultBuildLabel: defaultBuildBytes
		? `${defaultBuildBytes.toLocaleString("en-US")} B`
		: "—",

	// The budget check-css-size.js enforces, in the same unit the script
	// reports it in.
	budgetBytes: 14 * 1024,

	builds: ["default", "classless", "scoped", "scoped classless"].length,
	browsers: packageJson.browserslist ?? [],
};
