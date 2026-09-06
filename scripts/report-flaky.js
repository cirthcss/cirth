const fs = require("node:fs");
const path = require("node:path");

// Names the tests that only passed because they were retried.
//
//   node scripts/report-flaky.js .cache/baseline-report.json
//
// The baseline regeneration step runs with --retries=2 because it is a
// writer: one flaky rendering used to throw away hundreds of regenerated
// screenshots and leave the branch with no Linux baselines at all. Retries
// fix that, and introduce their own problem — a step that goes green while
// something in it is genuinely unreliable, with the evidence buried in a
// few thousand lines of log.
//
// So the retry is paired with this: every test that needed one is printed,
// and on GitHub Actions each becomes a warning annotation on the run. The
// step still succeeds — a flaky screenshot is not a reason to discard the
// other eight hundred — but nobody has to go looking to find out which one
// it was, or whether there was one at all.

const reportPath = process.argv[2] ?? ".cache/baseline-report.json";
const resolved = path.resolve(reportPath);

if (!fs.existsSync(resolved)) {
	console.log(`[@cirthcss/cirth] No report at ${reportPath} — nothing to check.`);
	process.exit(0);
}

/** @type {{ config?: { rootDir?: string }, stats?: { flaky?: number }, suites?: unknown[] }} */
const report = JSON.parse(fs.readFileSync(resolved, "utf8"));

// `spec.file` is relative to the config's rootDir (testDir), not to the
// repository, and a GitHub annotation needs a repo-relative path to link
// anywhere. Resolved through rootDir and back down to cwd.
const rootDir = report.config?.rootDir ?? process.cwd();
/** @param {string} file */
const repoRelative = (file) =>
	file ? path.relative(process.cwd(), path.resolve(rootDir, file)) : "";

/**
 * @typedef {{
 *   projectName?: string,
 *   results?: { status?: string }[],
 *   status?: string,
 *   title?: string,
 * }} Test
 * @typedef {{
 *   file?: string,
 *   line?: number,
 *   tests?: Test[],
 *   title?: string,
 * }} Spec
 * @typedef {{ specs?: Spec[], suites?: Suite[], title?: string }} Suite
 */

/** @type {{ attempts: number, file: string, line: number, title: string }[]} */
const flaky = [];
/** @type {string[]} */
const failed = [];

/** @param {Suite} suite @param {string[]} trail */
const walk = (suite, trail) => {
	const here = suite.title ? [...trail, suite.title] : trail;
	for (const spec of suite.specs ?? []) {
		for (const test of spec.tests ?? []) {
			const attempts = (test.results ?? []).length;
			// The project belongs in the title. A spec carries one `tests`
			// entry per project, and the suite trail is files, not projects —
			// so without this the same rendering under chromium and under
			// webkit are two identical lines, and a reader cannot tell
			// whether one engine is flaky or both are.
			const title = [
				test.projectName ? `[${test.projectName}]` : "",
				...here,
				spec.title,
			]
				.filter(Boolean)
				.join(" › ");
			// `status` is the field to read. The JSON reporter classifies a
			// test across all of its attempts — "expected", "unexpected",
			// "flaky", "skipped" — and `ok` is not emitted at all in the
			// version this repo pins, so a check written against it silently
			// finds nothing.
			if (test.status === "flaky" || (test.status === "expected" && attempts > 1)) {
				flaky.push({
					attempts,
					file: repoRelative(spec.file ?? ""),
					line: spec.line ?? 0,
					title,
				});
			} else if (test.status === "unexpected") {
				failed.push(title);
			}
		}
	}
	for (const child of suite.suites ?? []) walk(child, here);
};

for (const suite of /** @type {Suite[]} */ (report.suites ?? [])) walk(suite, []);

if (failed.length > 0) {
	console.log(
		`[@cirthcss/cirth] ${failed.length} test(s) failed every attempt — ` +
			"the step that ran them has already reported it.",
	);
}

if (flaky.length === 0) {
	console.log("[@cirthcss/cirth] No test needed a retry.");
	process.exit(0);
}

console.log(
	`[@cirthcss/cirth] ${flaky.length} test(s) passed only after a retry:\n`,
);
for (const entry of flaky) {
	console.log(`  ${entry.title}  (${entry.attempts} attempts)`);
	if (process.env.GITHUB_ACTIONS) {
		// One annotation per flaky test, anchored at the spec so the run
		// summary links straight to it.
		console.log(
			`::warning file=${entry.file},line=${entry.line}::` +
				`Flaky: ${entry.title} passed on attempt ${entry.attempts} of ${entry.attempts}. ` +
				"The baselines it wrote are the ones from that attempt.",
		);
	}
}
