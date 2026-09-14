const fs = require("node:fs");
const path = require("node:path");

// Duplicate copies — "name 2.png", "name 3.png" — appear beside real files
// in this working tree and have done since at least August. They are
// gitignored, so `git status` stays clean while they accumulate: the last
// batch reached 440 files and 130 MB before anyone noticed.
//
// They are not harmless. Eleventy would publish a copied page, Playwright
// would collect a copied spec, and scripts/lib/check-built-links.js already
// carries a filter to skip them. This makes the accumulation visible instead
// of silently tolerated.
//
// What creates them is still unknown (gh#102). What is established:
//   - the mtimes match git operations that rewrite LFS-tracked baselines —
//     the last batch lands on a `pull --ff-only` at 18:14 and a fast-forward
//     merge at 18:25, to the minute, and the affected files are exactly the
//     160 Linux baselines those operations rewrote;
//   - iCloud Drive is *not* the cause, though .gitignore said so for months:
//     the repository is not under a File Provider root, nothing carries the
//     `dataless` flag, and `fileproviderctl` lists no provider over this path;
//   - OneDrive is installed but roots at ~/OneDrive - OperaLogica, elsewhere;
//   - Time Machine has no destinations configured.
//
// So this reports rather than explains, and `--fix` removes what it finds.

const projectRoot = path.join(__dirname, "..");

// A trailing " <digits>" before the extension, which is the shape every batch
// has taken so far (" 2.", " 3.", " 4."). Anchored to the basename so a
// directory named "v0.10 2" is caught too.
const DUPLICATE = /^(?<stem>.+) \d+(?<ext>\.[^.]+)?$/;

// Directories that are someone else's problem: node_modules legitimately
// contains such names, and .git is git's own business.
const SKIP = new Set(["node_modules", ".git"]);

/** @param {string} dir @returns {{path: string, size: number, dir: boolean}[]} */
const walk = (dir) => {
	/** @type {{path: string, size: number, dir: boolean}[]} */
	const found = [];
	let entries;
	try {
		entries = fs.readdirSync(dir, { withFileTypes: true });
	} catch {
		return found;
	}
	for (const entry of entries) {
		if (SKIP.has(entry.name)) continue;
		const full = path.join(dir, entry.name);
		const match = DUPLICATE.exec(entry.name);
		if (match) {
			// Only a duplicate if the unsuffixed original is actually there.
			// Without that test this would flag any file whose name ends in a
			// number, which is a real naming style ("Figure 1.svg").
			const original = `${match.groups?.stem ?? ""}${match.groups?.ext ?? ""}`;
			if (fs.existsSync(path.join(dir, original))) {
				let size = 0;
				try {
					size = entry.isDirectory() ? 0 : fs.statSync(full).size;
				} catch {
					/* raced away; report it anyway */
				}
				found.push({ path: full, size, dir: entry.isDirectory() });
				if (entry.isDirectory()) continue;
			}
		}
		if (entry.isDirectory()) found.push(...walk(full));
	}
	return found;
};

const fix = process.argv.includes("--fix");
const duplicates = walk(projectRoot);

if (duplicates.length === 0) {
	console.log("[@cirthcss/cirth] check-tree-noise: no duplicate copies.");
	process.exit(0);
}

const bytes = duplicates.reduce((total, entry) => total + entry.size, 0);
const megabytes = (bytes / 1024 / 1024).toFixed(1);

/** @type {Map<string, number>} */
const byFolder = new Map();
for (const entry of duplicates) {
	const folder = path.relative(projectRoot, path.dirname(entry.path)) || ".";
	byFolder.set(folder, (byFolder.get(folder) ?? 0) + 1);
}

if (!fix) {
	console.error(
		`[@cirthcss/cirth] check-tree-noise: ${duplicates.length} duplicate copies, ${megabytes} MB.\n`,
	);
	for (const [folder, count] of [...byFolder].sort((a, b) => b[1] - a[1]).slice(0, 8)) {
		console.error(`  ${String(count).padStart(4)}  ${folder}`);
	}
	if (byFolder.size > 8) console.error(`  … and ${byFolder.size - 8} more folders`);
	console.error(
		"\nThey are gitignored, so `git status` will not show them. Remove with:\n" +
			"  node scripts/check-tree-noise.js --fix\n" +
			"Do not rename one over its neighbour: the unsuffixed file is the tracked\n" +
			"source. See gh#102 for what is known about the cause.",
	);
	process.exit(1);
}

let removed = 0;
for (const entry of duplicates) {
	try {
		fs.rmSync(entry.path, { force: true, recursive: entry.dir });
		removed += 1;
	} catch (error) {
		const reason = error instanceof Error ? error.message : String(error);
		console.error(`  could not remove ${entry.path}: ${reason}`);
	}
}
console.log(
	`[@cirthcss/cirth] check-tree-noise: removed ${removed} duplicate copies, ${megabytes} MB.`,
);
process.exit(removed === duplicates.length ? 0 : 1);
