const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

// Proof that scripts/report-flaky.js reads what Playwright actually writes.
//
//   node scripts/check-flaky-report.js
//
// The baseline workflow regenerates screenshots with --retries=2 because
// that step is a writer: one flaky rendering used to discard hundreds of
// regenerated baselines. The retry is only half of the deal. The other half
// is report-flaky.js, which names every test that needed one so a green
// step cannot quietly hide an unreliable rendering.
//
// That half is a JSON parser, and a parser is only as good as the shape it
// is written against. The first version of it keyed on `test.ok` — a field
// this Playwright does not emit at all — so it would have reported nothing,
// for ever, and looked like good news. Reading a hand-written fixture would
// not have caught that; only a real report does.
//
// So this runs Playwright. A four-test spec under two projects, with a
// deliberate deterministic failure and a deliberate retry-recovered flake,
// produces a genuine report from the version in node_modules, and the CLI
// is then run over it exactly as the workflow runs it. If a Playwright
// upgrade renames a field, this fails on the upgrade rather than in six
// months' worth of silently empty CI annotations.
//
// No browser is launched: none of the fixture tests takes the `page`
// fixture, so the whole run is a couple of seconds of pure Node.

const projectRoot = path.join(__dirname, "..");
const fixtureRoot = path.join(projectRoot, ".cache/flaky-fixture");
const reportPath = path.join(fixtureRoot, "report.json");

/** @type {string[]} */
const checks = [];
/** @param {string} what */
const passed = (what) => {
	checks.push(what);
	console.log(`  ok  ${what}`);
};

// --- The fixture --------------------------------------------------------
//
// Inside .cache so that `@playwright/test` resolves through the repo's own
// node_modules, and so nothing here is ever committed. `testDir: "tests"`
// mirrors the real config, which is what makes the report's `rootDir` a
// directory *below* the working directory — the arrangement report-flaky.js
// has to undo to produce a repo-relative path for its annotation.

const writeFixture = () => {
	fs.rmSync(fixtureRoot, { force: true, recursive: true });
	fs.mkdirSync(path.join(fixtureRoot, "tests"), { recursive: true });

	fs.writeFileSync(
		path.join(fixtureRoot, "playwright.config.js"),
		`const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
	testDir: "tests",
	reporter: [["json"]],
	projects: [{ name: "alpha" }, { name: "beta" }],
});
`,
	);

	// testInfo.retry is the deterministic way to write a flake: attempt 0
	// throws, every later attempt passes. No timers, no randomness, so the
	// report below is the same report on every machine.
	fs.writeFileSync(
		path.join(fixtureRoot, "tests/flake.spec.js"),
		`const { test, expect } = require("@playwright/test");

test("steady", async () => {
	expect(1).toBe(1);
});

test("recovers on the second attempt", async ({}, testInfo) => {
	expect(testInfo.retry).toBeGreaterThan(0);
});

test("broken for good", async () => {
	expect("still broken").toBe("fixed");
});
`,
	);
};

/**
 * @param {string[]} extra
 * @returns {{ report: any, status: number }}
 */
const runPlaywright = (extra) => {
	fs.rmSync(reportPath, { force: true });
	const result = spawnSync(
		process.execPath,
		[
			path.join(projectRoot, "node_modules/@playwright/test/cli.js"),
			"test",
			"--config=playwright.config.js",
			"--retries=2",
			// The exact reporter string the workflow passes: `list` for the
			// log a human reads, `json` for the file this parser reads. A
			// combined reporter still has to write the JSON file.
			"--reporter=list,json",
			...extra,
		],
		{
			cwd: fixtureRoot,
			encoding: "utf8",
			env: {
				...process.env,
				CI: "",
				PLAYWRIGHT_JSON_OUTPUT_NAME: reportPath,
			},
		},
	);
	assert.ok(
		fs.existsSync(reportPath),
		`playwright wrote no report\n${result.stdout}\n${result.stderr}`,
	);
	return {
		report: JSON.parse(fs.readFileSync(reportPath, "utf8")),
		status: result.status ?? -1,
	};
};

/** @param {{ actions?: boolean }} options */
const runReporter = ({ actions = true } = {}) => {
	const result = spawnSync(
		process.execPath,
		[path.join(projectRoot, "scripts/report-flaky.js"), reportPath],
		{
			cwd: fixtureRoot,
			encoding: "utf8",
			env: actions
				? { ...process.env, GITHUB_ACTIONS: "true" }
				: { ...process.env, GITHUB_ACTIONS: "" },
		},
	);
	assert.equal(result.status, 0, `report-flaky exited ${result.status}`);
	return result.stdout;
};

/** @param {any} report @param {string} title */
const testsFor = (report, title) => {
	/** @type {any[]} */
	const found = [];
	/** @param {any} suite */
	const walk = (suite) => {
		for (const spec of suite.specs ?? []) {
			if (spec.title === title) found.push(...(spec.tests ?? []));
		}
		for (const child of suite.suites ?? []) walk(child);
	};
	for (const suite of report.suites ?? []) walk(suite);
	return found;
};

// --- The checks ---------------------------------------------------------

const run = () => {
	writeFixture();

	// 1. The shape itself. These assertions are the point of running the
	//    real binary: they are what a Playwright upgrade would break.
	const full = runPlaywright([]);
	const recovered = testsFor(full.report, "recovers on the second attempt");
	const broken = testsFor(full.report, "broken for good");
	const steady = testsFor(full.report, "steady");

	assert.equal(recovered.length, 2, "two projects should give two entries");
	assert.deepEqual(
		recovered.map((test) => test.projectName).sort(),
		["alpha", "beta"],
		"the JSON report no longer carries projectName",
	);
	assert.equal(
		Object.hasOwn(recovered[0], "ok"),
		false,
		"this Playwright now emits `ok` — the parser may key on it again",
	);
	assert.equal(recovered[0].status, "flaky");
	assert.equal(recovered[0].results.length, 2, "the flake retried once");
	assert.equal(broken[0].status, "unexpected");
	assert.equal(broken[0].results.length, 3, "--retries=2 means three attempts");
	assert.equal(steady[0].status, "expected");
	assert.equal(steady[0].results.length, 1);
	passed("the real report carries status, projectName and results, and no `ok`");

	// 2. A deterministic failure still fails the run that produced it, which
	//    is what keeps the workflow's writer step from committing.
	assert.notEqual(
		full.status,
		0,
		"a test that fails every attempt must fail the run",
	);
	passed("a deterministic failure fails the Playwright run");

	// 3. The recovered flake is named, once per project, with the project in
	//    the title — without it the two entries are indistinguishable.
	const annotated = runReporter();
	assert.match(annotated, /2 test\(s\) passed only after a retry/);
	for (const project of ["alpha", "beta"]) {
		assert.ok(
			annotated
				.split("\n")
				.some(
					(line) =>
						line.includes(`[${project}]`) &&
						line.includes("recovers on the second attempt") &&
						!line.startsWith("::warning"),
				),
			`the ${project} run of the flaky test was not attributed`,
		);
	}
	passed("a recovered flake is named once per project");

	// 4. The deterministic failure is reported as a failure, never as a
	//    flake, and never gets an annotation of its own.
	// Two, not one: the broken test fails under both projects, and each is
	// its own run of it.
	assert.match(annotated, /2 test\(s\) failed every attempt/);
	assert.equal(
		annotated.includes("::warning") &&
			annotated.split("::warning").length - 1 === 2,
		true,
		"there must be exactly one warning per flaky test and none for the failure",
	);
	assert.equal(
		/Flaky:.*broken for good/.test(annotated),
		false,
		"a permanently broken test was presented as flaky",
	);
	passed("a deterministic failure is reported apart from the flakes");

	// 5. The annotation points at a file that exists, spelled relative to the
	//    directory the reporter ran in — the translation from the report's
	//    own rootDir.
	const warning = annotated
		.split("\n")
		.find((line) => line.startsWith("::warning"));
	assert.ok(warning, "no annotation was emitted");
	const anchor = /^::warning file=([^,]+),line=(\d+)::/.exec(warning);
	assert.ok(anchor, `unparseable annotation: ${warning}`);
	assert.equal(anchor[1], "tests/flake.spec.js", "the path is not repo-relative");
	assert.ok(
		fs.existsSync(path.join(fixtureRoot, anchor[1])),
		`the annotation points at a file that does not exist: ${anchor[1]}`,
	);
	const line = Number(anchor[2]);
	const source = fs
		.readFileSync(path.join(fixtureRoot, anchor[1]), "utf8")
		.split("\n");
	assert.match(
		source[line - 1],
		/recovers on the second attempt/,
		`line ${line} is not where the flaky test is declared`,
	);
	passed("the annotation anchors on the flaky test's own file and line");

	// 6. The semantic the whole workflow rests on: a run whose only trouble
	//    was a retry-recovered flake exits zero, so the writer step stays
	//    green and the commit that follows it is not skipped. If this ever
	//    stopped being true, --retries would buy nothing.
	const onlyFlaky = runPlaywright(["--grep", "recovers"]);
	assert.equal(
		onlyFlaky.status,
		0,
		"a run recovered by a retry must not fail the step",
	);
	assert.deepEqual(
		testsFor(onlyFlaky.report, "recovers on the second attempt").map(
			(test) => test.status,
		),
		["flaky", "flaky"],
	);
	const recoveredOut = runReporter();
	assert.match(recoveredOut, /2 test\(s\) passed only after a retry/);
	assert.equal(
		recoveredOut.includes("failed every attempt"),
		false,
		"a recovered flake was reported as a failure",
	);
	passed("a retry-recovered run exits zero and is still annotated");

	// 7. Nothing flaky, nothing said — and no annotation at all, so a clean
	//    run does not train anyone to ignore warnings.
	const clean = runPlaywright(["--grep", "steady"]);
	assert.equal(clean.status, 0, "the steady-only run should pass");
	const quiet = runReporter();
	assert.match(quiet, /No test needed a retry/);
	assert.equal(quiet.includes("::warning"), false, "a clean run was annotated");
	assert.equal(
		quiet.includes("failed every attempt"),
		false,
		"a clean run reported failures",
	);
	passed("a run with no retries says so, and annotates nothing");

	// 8. Outside GitHub Actions the same information is printed without the
	//    annotation syntax, so the script is readable in a local terminal.
	runPlaywright([]);
	const local = runReporter({ actions: false });
	assert.match(local, /passed only after a retry/);
	assert.equal(local.includes("::warning"), false, "annotated outside Actions");
	passed("outside Actions it reports without annotation syntax");

	// 9. A missing report is not an error: the workflow runs this with
	//    `if: always()`, including after a step that died before writing one.
	const absent = spawnSync(
		process.execPath,
		[path.join(projectRoot, "scripts/report-flaky.js"), "no-such-report.json"],
		{ cwd: fixtureRoot, encoding: "utf8" },
	);
	assert.equal(absent.status, 0);
	assert.match(absent.stdout, /No report at/);
	passed("a missing report is reported, not thrown over");

	fs.rmSync(fixtureRoot, { force: true, recursive: true });
	console.log(
		`\n[@cirthcss/cirth] Flake reporting verified against Playwright ` +
			`${require("@playwright/test/package.json").version} — ${checks.length} checks passed.\n`,
	);
	return 0;
};

try {
	process.exit(run());
} catch (error) {
	console.error(error);
	process.exit(1);
}
