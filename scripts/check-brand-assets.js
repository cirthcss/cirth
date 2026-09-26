const process = require("node:process");
const { SOURCE, markPaths, pathData, read } = require("./lib/brand-mark");

// Every brand asset carries the mark by copy. There is one drawing, in
// docs/public/logo_brand.svg, and nine other files repeat its path data
// with a different pigment, a background tile, or fewer parts. Nothing in
// the build regenerates them, so replacing the mark means editing ten
// files and the tenth is the one that gets forgotten.
//
// This check is what notices. It does not care about colour, size, view
// box or title: those are each variant's own decision. It cares that the
// geometry in a variant is still the geometry in the source.
//
//   full     every path of the mark, in order, and nothing else drawn
//            except a declared background shape.
//   reduced  a deliberate simplification for small sizes. Every path it
//            keeps must still be one of the mark's, and it must keep
//            fewer: a "reduced" file holding the whole mark is a file
//            nobody reduced, and one holding a path the mark no longer
//            has is stale.
//
// A reduced variant cannot be regenerated, because which parts to drop is
// a drawing decision. Failing here is the point: it says a human has to
// redraw this one.

/** @type {{ file: string, kind: "full" | "reduced", background: number }[]} */
const assets = [
	{ file: "logo_brand_dark.svg", kind: "full", background: 0 },
	{ file: "logo_mono.svg", kind: "full", background: 0 },
	{ file: "logo_mono_dark.svg", kind: "full", background: 0 },
	{ file: "logo_brand_app.svg", kind: "full", background: 1 },
	{ file: "logo_brand_app_dark.svg", kind: "full", background: 1 },
	{ file: "logo_mono_app.svg", kind: "full", background: 1 },
	{ file: "logo_mono_app_dark.svg", kind: "full", background: 1 },
	{ file: "wordmark.svg", kind: "full", background: 0 },
	{ file: "wordmark_dark.svg", kind: "full", background: 0 },
	{ file: "wordmark_mono.svg", kind: "full", background: 0 },
	{ file: "favicon.svg", kind: "reduced", background: 0 },
	{ file: "favicon_dark.svg", kind: "reduced", background: 0 },
	{ file: "mark_small.svg", kind: "reduced", background: 0 },
	{ file: "mark_small_dark.svg", kind: "reduced", background: 0 },
];

const mark = markPaths();
const markSet = new Set(mark);
/** @type {string[]} */
const failures = [];

for (const { file, kind, background } of assets) {
	/** @type {string[]} */
	let paths;
	try {
		paths = pathData(read(file));
	} catch {
		failures.push(`${file}: missing`);
		continue;
	}

	// A background tile is drawn before the mark and is not the mark.
	const drawn = paths.slice(background);

	if (kind === "full") {
		const same =
			drawn.length === mark.length && drawn.every((d, i) => d === mark[i]);
		if (!same) {
			failures.push(
				`${file}: carries ${drawn.length} mark path(s), ${SOURCE} has ${mark.length}, and they are not the same drawing`,
			);
		}
		continue;
	}

	const foreign = drawn.filter((d) => !markSet.has(d));
	if (foreign.length > 0) {
		failures.push(
			`${file}: ${foreign.length} path(s) are not in ${SOURCE}; the reduction was made from an older drawing`,
		);
	} else if (drawn.length >= mark.length) {
		failures.push(
			`${file}: keeps ${drawn.length} of ${mark.length} paths, so nothing was reduced`,
		);
	}
}

if (failures.length > 0) {
	console.error(
		`[@cirthcss/cirth] check:brand-assets: ${failures.length} asset(s) have drifted from ${SOURCE}`,
	);
	for (const failure of failures) console.error(`  ✗ ${failure}`);
	console.error(
		"\nThe mark is copied into each variant by hand. When the drawing changes,\n" +
			"every file above changes with it. A 'reduced' variant needs a person to\n" +
			"choose which parts it keeps; the rest are a recolour of the same paths.\n" +
			"docs/BRAND_ASSETS.md lists what each file is for.",
	);
	process.exit(1);
}

console.log(
	`[@cirthcss/cirth] check:brand-assets: ${assets.length} assets carry the ${mark.length}-path mark from ${SOURCE}`,
);
