const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

// Emptying the directory a docs build writes to, and nothing else.
//
// Eleventy does not clean its output, so the docs config removes it once
// before the first build of a process. The directory it removes is the one
// Eleventy reports for this build: docs/dist for `npm run docs:build`, or
// whatever `--output` named. A clean that always removed docs/dist deleted
// the real site whenever a build was pointed elsewhere.
//
// Because the path now comes from the caller, the removal refuses anything
// that is not plainly a build output: the filesystem root, the home
// directory, the repository or any directory above it, docs/ itself, a
// directory holding the sources, a symlink, a file, or a path that resolves
// somewhere else than it says. A refusal throws; nothing is removed.

const projectRoot = path.join(__dirname, "../..");

/** @param {string} target @returns {string} */
const real = (target) => {
	try {
		return fs.realpathSync(target);
	} catch {
		// Not there yet: resolve the nearest parent that is, and keep the rest.
		const parent = path.dirname(target);
		if (parent === target) return target;
		return path.join(real(parent), path.basename(target));
	}
};

/** @param {string} parent @param {string} child */
const contains = (parent, child) => {
	const relative = path.relative(parent, child);
	return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
};

/**
 * Remove the output directory of a docs build, if it is one.
 *
 * @param {string} outputDir the directory Eleventy reports for this build
 * @param {{ sources?: string[] }} [options] directories that must survive
 *   the removal (the input, includes and data directories)
 * @returns {string} the absolute path that was emptied
 */
const removeBuildOutput = (outputDir, { sources = [] } = {}) => {
	if (typeof outputDir !== "string" || outputDir.trim() === "") {
		throw new Error("[docs] refusing to clean an output directory with no name");
	}
	const absolute = path.resolve(outputDir);
	const resolved = real(absolute);
	const refuse = (/** @type {string} */ why) => {
		throw new Error(`[docs] refusing to clean ${absolute}: ${why}`);
	};

	if (resolved === path.parse(resolved).root) refuse("it is the filesystem root");
	const protectedDirs = [
		["the home directory", os.homedir()],
		["the repository", projectRoot],
		["docs/", path.join(projectRoot, "docs")],
	];
	for (const [name, directory] of protectedDirs) {
		const protectedReal = real(directory);
		if (resolved === protectedReal) refuse(`it is ${name}`);
		if (contains(resolved, protectedReal)) refuse(`it contains ${name}`);
	}
	for (const source of sources) {
		if (contains(resolved, real(path.resolve(source)))) refuse(`it contains the sources (${source})`);
	}

	let stats;
	try {
		stats = fs.lstatSync(absolute);
	} catch {
		return absolute; // Nothing to clean.
	}
	if (stats.isSymbolicLink()) refuse("it is a symlink");
	if (!stats.isDirectory()) refuse("it is not a directory");
	// Every component must be what it says: a path whose real location
	// differs by more than the platform's own aliases (macOS keeps /var and
	// /tmp as links into /private) points somewhere the caller did not name.
	const aliased = resolved.replace(/^\/private(?=\/(?:var|tmp)\/)/, "");
	if (resolved !== absolute && aliased !== absolute) refuse(`it resolves to ${resolved}`);

	fs.rmSync(absolute, { recursive: true, force: true });
	return absolute;
};

module.exports = { removeBuildOutput };
