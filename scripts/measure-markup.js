const fs = require("node:fs");
const path = require("node:path");
const { compute, readResults, resultsFile } = require("./lib/markup-benchmark");

// Measures the home page's markup comparison from its fixtures
// (docs/benchmark/) and writes docs/benchmark/results.json, which the home
// page and the Why Cirth page print. See scripts/lib/markup-benchmark.js for
// what is counted and how.
//
//   npm run benchmark          measure, and write the results
//   npm run check:benchmark    fail if the results no longer match
//
// The date and the version are when, and against which release, the
// numbers were taken. A run that finds the same numbers keeps both, so
// measuring twice never changes the file.

const projectRoot = path.join(__dirname, "..");

if (process.argv.includes("--check")) {
	try {
		readResults();
	} catch (error) {
		console.error(`check:benchmark: ${error instanceof Error ? error.message : error}`);
		process.exit(1);
	}
	console.log("check:benchmark: docs/benchmark/results.json matches its fixtures.");
	process.exit(0);
}

const fresh = compute();
/** @type {{ measured?: string, cirthVersion?: string } | null} */
let previous = null;
try {
	previous = readResults();
} catch {
	previous = null;
}
const { version } = JSON.parse(fs.readFileSync(path.join(projectRoot, "package.json"), "utf8"));
const results = {
	measured: previous?.measured ?? new Date().toISOString().slice(0, 10),
	cirthVersion: previous?.cirthVersion ?? version,
	...fresh,
};
fs.writeFileSync(resultsFile, `${JSON.stringify(results, null, "\t")}\n`);
for (const metric of fresh.metrics) {
	const [cirth, alternative] = Object.values(metric.values);
	console.log(`${metric.label}: ${cirth} against ${alternative}, ${metric.reduction}% ${metric.result}`);
}
console.log(`Wrote ${path.relative(projectRoot, resultsFile)}${previous ? " (unchanged)" : ""}.`);
