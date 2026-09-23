const fs = require("node:fs");
const path = require("node:path");

const { BROTLI_QUALITY, brotliSize } = require("./lib/compressed-size");

const projectRoot = path.join(__dirname, "..");
const distDir = path.join(projectRoot, "dist");

// Brotli-compressed ceiling, per bundle.
//
// This used to be one number — 14 * 1024 — applied to every file in dist/.
// It was doing two jobs badly.
//
// As a *guard* it only ever watched one bundle. The print sheets are around
// 880 B, so a shared 14 KB ceiling let them grow to sixteen times their size
// without a word; the classless builds had two kilobytes of silent room.
// Only the scoped build was ever close enough to the line for the line to
// mean anything, and by the end it was 305 B away — which is not headroom,
// it is a tripwire in front of the next legitimate default.
//
// As a *promise* it was worse. "Under 14 KB" is a number a reader can hold
// the project to, and holding a stylesheet under a round number is not a
// design goal: it is a reason to leave <dl> with the user agent's indent
// and a disclosure marker four pixels off its own line, which is exactly
// what it had started to buy. Cirth is small because its model is small —
// element selectors and custom properties, no component catalogue and no
// runtime — not because it rations correctness by the byte.
//
// So: one budget per bundle, each set a few hundred bytes above what that
// bundle actually measures. Every file is now genuinely watched, including
// the ones that were not. Crossing a line here means "look at this", not
// "revert this": raise the number in the same change that needs it, and say
// why in the commit. The figures below use Brotli quality 11, shared with the
// documentation through scripts/lib/compressed-size.js.
/** @type {Record<string, number>} */
const budgets = {
	"cirth.classless.min.css": 11_500,
	"cirth.classless.scoped.min.css": 11_600,
	"cirth.min.css": 13_100,
	"cirth.print.classless.min.css": 900,
	"cirth.print.classless.scoped.min.css": 900,
	"cirth.print.min.css": 900,
	"cirth.print.scoped.min.css": 900,
	"cirth.scoped.min.css": 13_200,
};

const warnOnly = process.argv.includes("--warn-only");

if (!fs.existsSync(distDir)) {
	console.error("check-css-size: dist/ not found — run `npm run build` first.");
	process.exit(1);
}

const bundles = fs
	.readdirSync(distDir)
	.filter((name) => name.endsWith(".min.css"))
	.sort();

if (bundles.length === 0) {
	console.error("check-css-size: no dist/*.min.css bundles found.");
	process.exit(1);
}

let failed = false;

// A bundle with no budget is a build mode nobody chose a number for. Fail on
// it rather than let a new entrypoint ship unwatched, which is the failure
// mode the single shared ceiling had.
const unbudgeted = bundles.filter((name) => !(name in budgets));
if (unbudgeted.length > 0) {
	console.error(
		`check-css-size: no budget set for ${unbudgeted.join(", ")}. ` +
			"Add one to scripts/check-css-size.js.",
	);
	process.exit(1);
}

for (const name of bundles) {
	const source = fs.readFileSync(path.join(distDir, name));
	const compressedBytes = brotliSize(source);
	const budget = budgets[name];
	const overBudget = compressedBytes >= budget;
	const headroom = budget - compressedBytes;

	const mark = overBudget ? (warnOnly ? "⚠" : "✗") : "✓";
	console.log(
		`${mark} dist/${name} — ${compressedBytes} B Brotli q${BROTLI_QUALITY}` +
			` (budget ${budget} B, ${headroom} B left)`,
	);

	if (overBudget) {
		failed = true;
	}
}

if (failed) {
	const message =
		"\ncheck-css-size: a bundle exceeds its Brotli-compressed size budget. " +
		"This is a " +
		"regression guard, not a ceiling to design against: if the growth is " +
		"deliberate, raise that bundle's number in scripts/check-css-size.js " +
		"in the same change and say why in the commit.";

	if (warnOnly) {
		console.warn(message);
	} else {
		console.error(message);
		process.exit(1);
	}
}
