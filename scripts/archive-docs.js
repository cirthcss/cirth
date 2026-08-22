const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { runSync } = require("./lib/run-sync");

// Freezes a documentation line.
//
// Called at a breaking release, before the new line takes the root: it
// builds the docs from the tag that ended the outgoing line and stores the
// result under docs/versions/<dir>/, which the site copies verbatim into
// its output. Copied rather than rebuilt on every deploy, because an
// archived line should not have to keep compiling against a toolchain that
// has moved on — the whole point of freezing it is that it stops changing.
//
//   node scripts/archive-docs.js v0.10.0 v0.10
//
// The build happens in a detached worktree so the working tree, its
// node_modules and its dist/ are never touched.

const [tag, directory] = process.argv.slice(2);

if (!tag || !directory) {
	console.error(
		"Usage: node scripts/archive-docs.js <tag> <directory>\n" +
			"  e.g. node scripts/archive-docs.js v0.10.0 v0.10",
	);
	process.exit(1);
}

const projectRoot = path.join(__dirname, "..");
const destination = path.join(projectRoot, "docs/versions", directory);
const worktree = fs.mkdtempSync(path.join(os.tmpdir(), "cirth-archive-"));

/**
 * @param {string} command
 * @param {readonly string[]} args
 * @param {string} [cwd]
 * @param {Record<string, string>} [env]
 */
const run = (command, args, cwd = projectRoot, env = {}) =>
	runSync(command, args, { cwd, env: { ...process.env, ...env } });

console.log(`[@cirthcss/cirth] Archiving ${tag} to docs/versions/${directory}`);

try {
	run("git", ["worktree", "add", "--detach", worktree, tag]);

	// The archived line is served from a subdirectory, and the tag predates
	// the idea — its config only knows how to build for the site root. One
	// line is repointed at the archive's own prefix so every internal link
	// and asset path lands inside it. This is the only edit made to the
	// checkout, and it lives and dies with the temporary worktree.
	const config = path.join(worktree, "docs/eleventy.config.js");
	const source = fs.readFileSync(config, "utf8");

	if (!source.includes('"/cirth/"')) {
		throw new Error(
			`${tag} does not build for "/cirth/" — check how its pathPrefix is set`,
		);
	}

	fs.writeFileSync(config, source.replace('"/cirth/"', `"/cirth/${directory}/"`));

	run("npm", ["ci", "--no-audit", "--no-fund"], worktree);
	run("npm", ["run", "build"], worktree);
	run("npm", ["run", "docs:build"], worktree, { GITHUB_PAGES: "true" });

	fs.rmSync(destination, { force: true, recursive: true });
	fs.mkdirSync(path.dirname(destination), { recursive: true });
	fs.cpSync(path.join(worktree, "docs/dist"), destination, {
		recursive: true,
	});

	// A frozen line cannot grow a version switcher, so it gets told where it
	// is instead. Without this, someone arriving from a search result reads
	// documentation for a version they may not be running, with no signal and
	// no way back — the same problem the /next/ banner solves, at the other
	// end of the timeline.
	const banner =
		'<aside style="border-bottom:1px solid #8884;padding:.5rem 1rem;' +
		'text-align:center;font-size:.875rem">Archived documentation for ' +
		`${tag} and earlier. <a href="/cirth/">Read the current ` +
		"documentation</a>.</aside>";

	/** @param {string} directory */
	const annotate = (directory) => {
		for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
			const filename = path.join(directory, entry.name);

			if (entry.isDirectory()) {
				annotate(filename);
				continue;
			}

			if (!entry.name.endsWith(".html")) {
				continue;
			}

			const html = fs.readFileSync(filename, "utf8");
			const body = html.indexOf("<body");

			if (body < 0) {
				continue;
			}

			const open = html.indexOf(">", body) + 1;

			fs.writeFileSync(filename, html.slice(0, open) + banner + html.slice(open));
		}
	};

	annotate(destination);

	console.log(
		`[@cirthcss/cirth] Archived ${fs.readdirSync(destination).length} entries`,
	);
} finally {
	run("git", ["worktree", "remove", "--force", worktree]);
}
