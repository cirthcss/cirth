const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const {
	createServer,
	docsDist,
	snapshotDocs,
	startServer,
} = require("./lib/docs-site");
const { openCorpus } = require("./lib/docs-fingerprint");
const { watchSources } = require("./lib/source-guard");
const { execFileSync } = require("node:child_process");

// Proof that a docs build cannot change what the audit is measuring.
//
//   node scripts/check-audit-snapshot.js
//
// The race this closes: `docs/dist` is a build output, and
// `npm run docs:build` replaces files in it — eleventy's passthrough copy
// *replaces* styles/style.css rather than editing it, so there is a window
// in which a page loads with no stylesheet at all. The dead-CSS audit takes
// tens of minutes and read that directory directly, so a build started
// alongside it produced either a hard failure ("no stylesheet matching
// styles/style.css") or, worse, a report measured half against one build
// and half against another.
//
// The fix is not a lock. The audit copies the built site once, at startup,
// and serves the copy: 8 MB and ~300 files, well under a second, after
// which nothing it reads can change. This file checks that claim three
// ways, and each check is written so that it would fail if the snapshot
// were removed:
//
//   1. a snapshot does not see its source change — including the exact
//      mutation a build makes, replacing the stylesheet;
//   2. an open corpus keeps serving the build it started with, while
//      docs/dist is being rewritten underneath it, with a control that
//      proves the rewrite was real;
//   3. the copy is cleaned up — on the way out, and on the way out of a
//      run that threw.

/** @type {string[]} */
const checks = [];
/** @param {string} what */
const passed = (what) => {
	checks.push(what);
	console.log(`  ok  ${what}`);
};

// --- 1. A snapshot does not see its source change ----------------------
//
// Against a tree this test owns, so the mutations can be as violent as the
// worst moment of a build without touching the real build output.

const isolatedSource = () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "cirth-source-"));
	fs.mkdirSync(path.join(root, "styles"), { recursive: true });
	fs.writeFileSync(
		path.join(root, "index.html"),
		'<!doctype html><html><head><link rel="stylesheet" href="/styles/style.css">' +
			"</head><body><p>first build</p></body></html>",
	);
	fs.writeFileSync(
		path.join(root, "styles/style.css"),
		"p { color: rgb(1, 2, 3); }\n",
	);
	return root;
};

const checkSourceMutation = () => {
	const source = isolatedSource();
	const snapshot = snapshotDocs({ label: "check-audit-snapshot", source });

	try {
		const before = fs.readFileSync(
			path.join(snapshot.root, "styles/style.css"),
			"utf8",
		);

		// What a docs build does, in the order it does it: remove the file,
		// then write a different one in its place.
		fs.rmSync(path.join(source, "styles/style.css"));
		assert.equal(
			fs.existsSync(path.join(snapshot.root, "styles/style.css")),
			true,
			"the snapshot lost a file the source lost",
		);

		fs.writeFileSync(
			path.join(source, "styles/style.css"),
			"p { color: rgb(4, 5, 6); }\n",
		);
		fs.writeFileSync(
			path.join(source, "index.html"),
			"<!doctype html><html><body><p>second build</p></body></html>",
		);

		assert.equal(
			fs.readFileSync(path.join(snapshot.root, "styles/style.css"), "utf8"),
			before,
			"the snapshot followed the source's stylesheet",
		);
		assert.match(
			fs.readFileSync(path.join(snapshot.root, "index.html"), "utf8"),
			/first build/,
			"the snapshot followed the source's markup",
		);
		passed("a snapshot does not see its source replaced");
	} finally {
		snapshot.dispose();
		fs.rmSync(source, { force: true, recursive: true });
	}

	assert.equal(
		fs.existsSync(snapshot.root),
		false,
		"dispose() left the copy behind",
	);
	passed("dispose() removes the copy");
};

// A build that has not run, or one caught mid-write, is a different failure
// from a race and has to stay loud: the audit must not measure an empty
// stylesheet and call every declaration in it inert.
const checkIncompleteBuild = () => {
	const source = isolatedSource();
	fs.writeFileSync(path.join(source, "styles/style.css"), "");

	try {
		assert.throws(
			() => snapshotDocs({ label: "check-audit-snapshot", source }),
			/missing or.*empty at styles\/style\.css/,
			"an empty stylesheet was accepted as a build",
		);
		passed("an incomplete build is refused, not measured");
	} finally {
		fs.rmSync(source, { force: true, recursive: true });
	}
};

// --- 3. Nothing is left behind when a run throws -----------------------

const checkCleanupOnError = () => {
	const source = isolatedSource();
	const snapshot = snapshotDocs({ label: "check-audit-snapshot", source });
	try {
		// The shape every consumer uses: whatever happens in between, the
		// copy goes away. (The process-exit handler in docs-site.js is the
		// belt to this file's braces, and covers the case where the throw
		// escapes the run entirely.)
		try {
			throw new Error("simulated audit failure");
		} finally {
			snapshot.dispose();
		}
	} catch (error) {
		assert.match(String(error), /simulated audit failure/);
	} finally {
		fs.rmSync(source, { force: true, recursive: true });
	}

	assert.equal(
		fs.existsSync(snapshot.root),
		false,
		"a failed run left its copy behind",
	);
	passed("a run that throws still removes its copy");
};

// --- 2. An open corpus keeps serving the build it started with ---------
//
// The real thing: the audit's own corpus, over the real docs/dist, with
// docs/dist rewritten underneath it exactly as a build rewrites it.
//
// docs/dist is a gitignored build output and the mutation is undone in a
// finally, but the bytes are also saved first and written back, so an
// interruption costs a `npm run docs:build` at worst.

const MARKER = "\n/* check-audit-snapshot: written after the corpus opened */\n";

const checkLiveCorpus = async () => {
	const stylesheet = path.join(docsDist, "styles/style.css");
	const original = fs.readFileSync(stylesheet);
	const home = path.join(docsDist, "index.html");
	const originalHome = fs.readFileSync(home);

	const corpus = await openCorpus({
		label: "check-audit-snapshot",
		pages: ["index.html"],
	});

	// A second server, on docs/dist itself, is the control: it reads what
	// the audit used to read, so it shows the mutation is real and would
	// have reached the measurement.
	const live = createServer();
	const liveOrigin = await startServer(live);

	try {
		const [target] = corpus.visits;
		/** @type {{ declarations: number, marked: boolean }[]} */
		const seen = [];

		const look = async (/** @type {import("playwright").Page} */ page) => {
			const found = await page.evaluate(() => {
				const index = window.__cirthAudit.index("styles/style.css");
				if (!index) return null;
				const sheet = [...document.styleSheets].find(
					(candidate) => candidate.href?.includes("styles/style.css"),
				);
				const text = [...(sheet?.cssRules ?? [])]
					.map((rule) => rule.cssText)
					.join("");
				return { declarations: index.length, marked: text.includes("--marker") };
			});
			assert.notEqual(found, null, "the corpus lost the stylesheet");
			seen.push(/** @type {{ declarations: number, marked: boolean }} */ (found));
		};

		let mutated = false;
		await corpus.visit(target, async (page, context) => {
			if (context.state !== "loaded") return;
			await look(page);

			if (mutated) return;
			mutated = true;
			// Exactly what eleventy's passthrough copy does: remove, then
			// write. The removal is the window that used to break a run.
			fs.rmSync(stylesheet);
			fs.writeFileSync(
				stylesheet,
				`${original.toString()}${MARKER}:root { --marker: 1 }\n`,
			);
			fs.writeFileSync(
				home,
				originalHome.toString().replace("<body", "<body data-rebuilt"),
			);
		});

		// The control: docs/dist really did change.
		const response = await fetch(`${liveOrigin}/styles/style.css`);
		assert.match(
			await response.text(),
			/--marker/,
			"the test never actually rewrote docs/dist",
		);
		passed("docs/dist was rewritten while the corpus was open (control)");

		// And the corpus did not.
		await corpus.visit(target, async (page, context) => {
			if (context.state !== "loaded") return;
			await look(page);
		});

		assert.equal(seen.length, 2, "the corpus was not measured twice");
		assert.equal(
			seen[1].declarations,
			seen[0].declarations,
			"the corpus saw a different sheet after the rewrite",
		);
		assert.equal(
			seen[1].marked,
			false,
			"the rewrite reached the corpus — the snapshot is not isolating it",
		);
		passed(
			`the corpus kept measuring the build it opened (${seen[0].declarations} declarations, before and after)`,
		);
	} finally {
		fs.writeFileSync(stylesheet, original);
		fs.writeFileSync(home, originalHome);
		live.close();
		await corpus.close();
	}

	assert.equal(
		fs.readFileSync(stylesheet).equals(original),
		true,
		"docs/dist was not restored",
	);
	passed("docs/dist is left as it was found");
};

// --- 4. The source guard ------------------------------------------------
//
// The snapshot above protects what the audit *measures*. This protects what
// a person *acts on* afterwards: the sheet the report names declarations in.
// Checked against a throwaway git repository, so all three verdicts —
// unchanged, edited, restored — can be produced without touching this one.

const checkSourceGuard = () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "cirth-guard-"));
	/** @param {readonly string[]} args */
	const git = (args) =>
		execFileSync("git", args, { cwd: root, stdio: ["ignore", "pipe", "pipe"] });

	try {
		const tracked = path.join(root, "sheet.css");
		fs.writeFileSync(tracked, "p { color: rgb(1, 2, 3); }\n");
		git(["init", "--quiet", "--initial-branch=main"]);
		git(["config", "user.email", "check@example.invalid"]);
		git(["config", "user.name", "check"]);
		git(["add", "sheet.css"]);
		git(["commit", "--quiet", "-m", "committed"]);
		const committed = fs.readFileSync(tracked);

		// A run nobody disturbed says nothing at all.
		const quiet = watchSources({ files: ["sheet.css"], label: "quiet", root });
		assert.equal(quiet.assertUnchanged(), true);
		assert.deepEqual(quiet.changed(), []);
		passed("an undisturbed run passes the source guard silently");

		// An edited file throws, and the message names the file and the size
		// it moved by — the two things needed to tell what happened.
		const edited = watchSources({ files: ["sheet.css"], label: "edited", root });
		fs.writeFileSync(tracked, "p { color: rgb(9, 9, 9); }\np { margin: 0; }\n");
		assert.throws(
			() => edited.assertUnchanged(),
			(/** @type {Error} */ error) =>
				error.message.includes("sheet.css") &&
				error.message.includes("changed:") &&
				/\(\+\d+\)/.test(error.message),
			"an edited source did not fail loudly",
		);
		passed("an edited source fails the run, naming the file and the delta");

		// The shape a concurrent session's cleanup actually takes: the file
		// does not become something new, it becomes something committed.
		const restored = watchSources({
			files: ["sheet.css"],
			label: "restored",
			root,
		});
		fs.writeFileSync(tracked, committed);
		const findings = restored.changed();
		assert.equal(findings.length, 1);
		assert.match(
			findings[0].how,
			/restored it rather than edited it/,
			"a git restore was not told apart from an edit",
		);
		passed("content that matches a commit is reported as restored, not edited");

		// A deleted source is its own verdict, not a crash.
		const removed = watchSources({ files: ["sheet.css"], label: "removed", root });
		fs.rmSync(tracked);
		assert.deepEqual(removed.changed(), [
			{ how: "was deleted", relative: "sheet.css" },
		]);
		passed("a deleted source is reported rather than thrown over");

		// warnOnly is the escape hatch for a tool that still wants to print
		// its result: it returns false and says so, instead of throwing.
		fs.writeFileSync(tracked, committed);
		const warned = watchSources({ files: ["sheet.css"], label: "warned", root });
		fs.writeFileSync(tracked, "p { color: rgb(4, 4, 4); }\n");
		assert.equal(warned.assertUnchanged({ warnOnly: true }), false);
		passed("warnOnly reports without throwing");
	} finally {
		fs.rmSync(root, { force: true, recursive: true });
	}
};

const run = async () => {
	console.log(
		"\n[@cirthcss/cirth] The audit measures an immutable copy of the build:\n",
	);
	checkSourceMutation();
	checkIncompleteBuild();
	checkCleanupOnError();
	await checkLiveCorpus();
	checkSourceGuard();

	console.log(
		`\n[@cirthcss/cirth] Audit isolation and source guard verified — ${checks.length} checks passed\n`,
	);
	return 0;
};

run().then(
	(code) => process.exit(code),
	(error) => {
		console.error(error);
		process.exit(1);
	},
);
