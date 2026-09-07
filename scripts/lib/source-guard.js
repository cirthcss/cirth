const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

// Content identity for the sources a long run is about to reason about,
// taken at the start and checked at the end.
//
// The audit already protects the thing it *measures*: snapshotDocs() copies
// docs/dist so a build cannot move the ground under a forty-minute sweep
// (see scripts/check-audit-snapshot.js). This protects the thing a person
// then *acts on*. A sweep that takes half an hour ends with a list of
// declarations to delete from docs/src/styles/style.css, and that list is
// only meaningful for the file the sweep started with.
//
// It is not hypothetical. On 2026-09-05 two sessions had this working tree
// open at once; one of them reverted a rule out of style.css at 22:40:26Z
// while the other was four minutes into a behavior run. The second session
// spent the next half hour reading a clean result that was clean because
// the rule under test was gone, and wrote the disappearance up as a sync
// daemon. Either session would have been told, in one line, by this.
//
// Deliberately not a lock, a daemon, or a watch: two stats and a hash at
// each end of a run that already costs minutes. Normal editing is
// unaffected — the guard only ever speaks about the run it wrapped.

const projectRoot = path.join(__dirname, "../..");

/** @param {string} filename */
const digest = (filename) => {
	try {
		return crypto
			.createHash("sha256")
			.update(fs.readFileSync(filename))
			.digest("hex");
	} catch {
		return null;
	}
};

/** @param {readonly string[]} args @param {string} cwd */
const git = (args, cwd) => {
	try {
		return execFileSync("git", args, {
			cwd,
			encoding: "utf8",
			stdio: ["ignore", "pipe", "ignore"],
		}).trim();
	} catch {
		return null;
	}
};

// What a file looked like at a commit, by content. This is the difference
// between "somebody edited the sheet" and "something ran git checkout,
// git stash or git restore over it" — which is the shape a concurrent
// session's cleanup actually takes, and a different thing to go and fix.
/** @param {string} relative @param {string} revision @param {string} cwd */
const committedDigest = (relative, revision, cwd) => {
	try {
		const blob = execFileSync("git", ["show", `${revision}:${relative}`], {
			cwd,
			maxBuffer: 64 * 1024 * 1024,
			stdio: ["ignore", "pipe", "ignore"],
		});
		return crypto.createHash("sha256").update(blob).digest("hex");
	} catch {
		return null;
	}
};

/**
 * @param {{ files: string[], label: string, root?: string }} options
 */
const watchSources = ({ files, label, root = projectRoot }) => {
	const started = Date.now();
	const head = git(["rev-parse", "HEAD"], root);

	/** @type {Map<string, { digest: string | null, size: number | null }>} */
	const before = new Map();
	for (const file of files) {
		const filename = path.resolve(root, file);
		const hash = digest(filename);
		before.set(path.relative(root, filename), {
			digest: hash,
			size: hash === null ? null : fs.statSync(filename).size,
		});
	}

	/**
	 * @returns {{ how: string, relative: string }[]}
	 */
	const changed = () => {
		/** @type {{ how: string, relative: string }[]} */
		const findings = [];
		for (const [relative, was] of before) {
			const filename = path.resolve(root, relative);
			const hash = digest(filename);
			if (hash === was.digest) continue;

			if (hash === null) {
				findings.push({ how: "was deleted", relative });
				continue;
			}
			if (was.digest === null) {
				findings.push({ how: "appeared", relative });
				continue;
			}

			const size = fs.statSync(filename).size;
			const delta = was.size === null ? 0 : size - was.size;
			const sign = delta > 0 ? "+" : "";
			let how =
				`changed: ${was.size} B → ${size} B (${sign}${delta}), ` +
				`${was.digest.slice(0, 12)} → ${hash.slice(0, 12)}`;

			// Content that now matches a commit was not typed — it was
			// restored. Naming the revision turns "a file changed under me"
			// into "something ran git over this tree".
			for (const revision of [head, "HEAD"]) {
				if (!revision) continue;
				if (committedDigest(relative, revision, root) !== hash) continue;
				how += `\n      it now matches ${revision === head ? `the commit this run started on (${revision.slice(0, 8)})` : "the current HEAD"} exactly — something restored it rather than edited it`;
				break;
			}
			findings.push({ how, relative });
		}
		return findings;
	};

	return {
		files: [...before.keys()],

		// The identity of what this run measured, for a report to carry so a
		// later stage can tell whether it is still describing the same tree.
		digests: () =>
			Object.fromEntries(
				[...before].map(([relative, was]) => [relative, was.digest]),
			),

		/**
		 * Loud, and at the end, where a result is about to be believed.
		 * @param {{ warnOnly?: boolean }} [options]
		 */
		assertUnchanged: ({ warnOnly = false } = {}) => {
			const findings = changed();
			const nowHead = git(["rev-parse", "HEAD"], root);
			const moved = head && nowHead && head !== nowHead;
			if (findings.length === 0 && !moved) return true;

			const minutes = ((Date.now() - started) / 60000).toFixed(1);
			const lines = [
				`[@cirthcss/cirth] ${label}: the sources this run is about changed while it ran.`,
				"",
				`  The run took ${minutes} min. Its conclusions describe the files as they`,
				"  were when it started, so they do not describe the tree you have now.",
				"",
			];
			for (const finding of findings) {
				lines.push(`  - ${finding.relative} ${finding.how}`);
			}
			if (moved) {
				lines.push(
					`  - HEAD moved: ${head.slice(0, 8)} → ${nowHead.slice(0, 8)}`,
				);
			}
			lines.push(
				"",
				"  Nothing here says which process did it. What it does say is that this",
				"  result cannot be acted on: re-run against the tree you mean to change.",
			);
			const report = lines.join("\n");

			if (warnOnly) {
				console.warn(`\n${report}\n`);
				return false;
			}
			throw new Error(report);
		},

		changed,
	};
};

// The sheet every dead-CSS verdict is a claim about, and the library build
// that produces the rest of what the docs render.
const auditSources = [
	"docs/src/styles/style.css",
	"docs/src/_includes/site-header.njk",
];

module.exports = { auditSources, watchSources };
