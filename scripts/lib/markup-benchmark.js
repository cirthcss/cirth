const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

// The home page's markup comparison, measured rather than written down.
//
// One component, the sign-in card from the top of the home page, written
// twice to the same brief: the same ten elements with the same text and
// attributes, a card surface, both colour schemes following the system, a
// focus ring on every control, hover and pressed states on the button, an
// invalid state on a required field and an accent-coloured checkbox. One
// version is semantic HTML that Cirth styles; the other is the same markup
// in a utility-first style, where each of those decisions is a class. The
// fixtures are docs/benchmark/*.html, and the Cirth one is also the hero's
// specimen, so the card the comparison counts is the card the page shows.
//
// What is counted is the HTML a template produces and a browser receives:
//
//   - classes: every whitespace-separated token in every `class` attribute,
//     repeats included, because a repeat is still markup someone keeps;
//   - bytes: the UTF-8 length of the HTML after `minifyHtml` below, so
//     indentation does not count against either side.
//
// Neither stylesheet is counted, and neither is any build tooling: this
// compares the markup, which is the one thing both versions share in kind.
// The element count is recorded to show the two are the same component,
// not as a result.
//
// A reduction is (alternative - Cirth) / alternative, as a whole percentage.
// A bar is its value over the larger of the two values of the same metric.

const projectRoot = path.join(__dirname, "../..");
const benchmarkDir = path.join(projectRoot, "docs/benchmark");
const resultsFile = path.join(benchmarkDir, "results.json");

/** @type {{ id: string, label: string, file: string }[]} */
const implementations = [
	{ id: "cirth", label: "Semantic HTML + Cirth", file: "sign-in.cirth.html" },
	{ id: "utility", label: "Utility-first implementation", file: "sign-in.utility.html" },
];

/** @type {{ id: "classes" | "bytes", label: string, unit: string, result: string }[]} */
const metrics = [
	{ id: "classes", label: "Class names in the markup", unit: "", result: "fewer class names" },
	{ id: "bytes", label: "HTML, minified", unit: "B", result: "less HTML" },
];

/**
 * Whitespace collapsed the way an HTML minifier's conservative mode does
 * it: every run of whitespace becomes one space, and a run between two tags
 * goes entirely. Nothing else is touched: no attribute, quote or end tag
 * is removed, so both fixtures keep exactly what their author wrote.
 * @param {string} html
 */
const minifyHtml = (html) =>
	html
		.replace(/\s+/g, " ")
		.replace(/>\s+</g, "><")
		.trim();

/** @param {string} html */
const measure = (html) => {
	const tags = [...html.matchAll(/<([a-z][a-z0-9-]*)\b([^>]*)>/gi)];
	const tokens = tags.flatMap(([, , attributes]) => {
		const value = /\sclass\s*=\s*"([^"]*)"/i.exec(attributes)?.[1] ?? "";
		return value.split(/\s+/).filter(Boolean);
	});
	return {
		elements: tags.length,
		classes: tokens.length,
		distinctClasses: new Set(tokens).size,
		bytes: Buffer.byteLength(minifyHtml(html), "utf8"),
	};
};

/** @param {string} file */
const readFixture = (file) => fs.readFileSync(path.join(benchmarkDir, file), "utf8");

/** @param {string} source */
const sha256 = (source) => crypto.createHash("sha256").update(source).digest("hex");

/**
 * The comparison as it stands in the fixtures now. Deterministic: no date,
 * no version, nothing that changes unless a fixture does.
 */
const compute = () => {
	const measured = implementations.map((implementation) => {
		const source = readFixture(implementation.file);
		return {
			...implementation,
			sha256: sha256(source),
			...measure(source),
		};
	});
	const [cirth, alternative] = measured;
	return {
		implementations: measured,
		metrics: metrics.map((metric) => {
			const values = measured.map((implementation) => implementation[metric.id]);
			const max = Math.max(...values);
			return {
				...metric,
				values: Object.fromEntries(measured.map((implementation, index) => [implementation.id, values[index]])),
				shares: Object.fromEntries(measured.map((implementation, index) => [implementation.id, max === 0 ? 0 : values[index] / max])),
				reduction: alternative[metric.id] === 0 ? 0 : Math.round(((alternative[metric.id] - cirth[metric.id]) / alternative[metric.id]) * 100),
			};
		}),
	};
};

/**
 * The committed results, checked against the fixtures. A fixture edited
 * without `npm run benchmark` fails here, so the home page cannot print a
 * number its fixtures no longer give.
 */
const readResults = () => {
	const results = JSON.parse(fs.readFileSync(resultsFile, "utf8"));
	const fresh = compute();
	const comparable = (/** @type {any} */ value) => JSON.stringify({ implementations: value.implementations, metrics: value.metrics });
	if (comparable(results) !== comparable(fresh)) {
		throw new Error(
			`${path.relative(projectRoot, resultsFile)} does not match the fixtures in ${path.relative(projectRoot, benchmarkDir)}/. Run \`npm run benchmark\` and commit the result.`,
		);
	}
	return {
		...results,
		// Less markup only if every metric says so.
		lessMarkup: fresh.metrics.every((metric) => metric.reduction > 0),
		sources: Object.fromEntries(implementations.map((implementation) => [implementation.id, readFixture(implementation.file).trimEnd()])),
	};
};

module.exports = { benchmarkDir, compute, measure, minifyHtml, readResults, resultsFile };
