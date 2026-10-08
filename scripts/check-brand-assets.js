const fs = require("node:fs");
const path = require("node:path");
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

// The integration marks are not Cirth's and are never redrawn, so the
// check is a different one: every file docs/src/_data/frameworks.js names
// is there and is a picture the page can size before it loads: an SVG with
// a view box, or a width and height where the project's file has none, or
// a PNG, which states its size in its header and is used only where a
// project publishes no SVG. An SVG is self-contained, with nothing that
// runs and nothing fetched from elsewhere. Nothing sits in the folder that
// the data file does not name, so the Brand page's table of sources covers
// every logo served. And every guide has the project's own site, which is
// where its mark leads wherever the mark is a link.
const frameworkDir = path.join(__dirname, "../docs/public/logos/frameworks");
const frameworkData = require("../docs/src/_data/frameworks.js");
/** @type {Record<string, { file?: string, dark?: string }>} */
const frameworkMarks = frameworkData.marks;
const named = new Set(
	Object.values(frameworkMarks).flatMap((mark) => [mark.file, mark.dark].filter(Boolean)),
);
const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
/** @type {string[]} */
const markFailures = [];
for (const file of named) {
	const full = path.join(frameworkDir, /** @type {string} */ (file));
	if (!fs.existsSync(full)) {
		markFailures.push(`logos/frameworks/${file}: missing`);
		continue;
	}
	if (String(file).endsWith(".png")) {
		const bytes = fs.readFileSync(full);
		if (!bytes.subarray(0, 8).equals(pngSignature)) markFailures.push(`logos/frameworks/${file}: not a PNG`);
		else if (Math.min(bytes.readUInt32BE(16), bytes.readUInt32BE(20)) < 96) {
			markFailures.push(`logos/frameworks/${file}: too small to stay sharp at twice its drawn size`);
		}
		continue;
	}
	const svg = fs.readFileSync(full, "utf8");
	const root = /<svg\b[^>]*>/.exec(svg)?.[0] ?? "";
	if (!root) markFailures.push(`logos/frameworks/${file}: not an SVG`);
	if (!/viewBox="[\d.\s-]+"/.test(root) && !(/\swidth="[\d.]+"/.test(root) && /\sheight="[\d.]+"/.test(root))) {
		markFailures.push(`logos/frameworks/${file}: neither a viewBox nor a width and height`);
	}
	if (/<script\b|\son[a-z]+\s*=/i.test(svg)) markFailures.push(`logos/frameworks/${file}: carries script`);
	if (/<image\b|<foreignObject\b/i.test(svg)) markFailures.push(`logos/frameworks/${file}: embeds an image or HTML`);
	if (/(?:href|src)\s*=\s*["']\s*(?:https?:)?\/\/|url\(\s*["']?\s*(?:https?:)?\/\/|@import/i.test(svg)) {
		markFailures.push(`logos/frameworks/${file}: fetches something from elsewhere`);
	}
}
for (const file of fs.readdirSync(frameworkDir)) {
	if (!named.has(file)) markFailures.push(`logos/frameworks/${file}: not named in frameworks.js, so its source is not on the Brand page`);
}
for (const guide of frameworkData.guides) {
	if (!/^https:\/\/[^/]+\.[a-z]+/.test(guide.officialUrl ?? "")) {
		markFailures.push(`frameworks.js: ${guide.id} has no official site for its mark to lead to`);
	}
}

// A logo is shown only under the rules frameworks.js states. Every record
// a guide points at names its owner, the policy read and its address; one
// with a file names where the file came from, and one without says why the
// project is named by text alone. A record with a file never carries a
// text-only reason, and no guide draws mark data from a text-only record.
// Checked here as well as where frameworks.js loads, because this is the
// check a change to the logos folder is run against.
/** @type {Set<string>} */
const shownMarks = new Set();
for (const guide of frameworkData.guides) {
	const data = /** @type {Record<string, string | undefined>} */ (/** @type {unknown} */ (frameworkMarks[guide.mark] ?? {}));
	shownMarks.add(guide.mark);
	for (const field of ["owner", "terms", "termsUrl"]) {
		if (typeof data[field] !== "string" || String(data[field]).trim() === "") {
			markFailures.push(`frameworks.js: the ${guide.mark} record ${guide.name} uses has no ${field}`);
		}
	}
	if (data.file) {
		if (typeof data.source !== "string" || !data.source.startsWith("https://")) markFailures.push(`frameworks.js: the ${guide.mark} mark has no source`);
		if (data.textOnly) markFailures.push(`frameworks.js: the ${guide.mark} mark is drawn and says it is named by text alone`);
	} else {
		if (typeof data.textOnly !== "string" || data.textOnly.trim().length < 40) {
			markFailures.push(`frameworks.js: ${guide.id} is named by text alone and does not say why`);
		}
		if (guide.markData) markFailures.push(`frameworks.js: ${guide.id} is named by text alone but carries mark data a template would draw`);
	}
}
for (const id of Object.keys(frameworkMarks)) {
	if (!shownMarks.has(id)) markFailures.push(`frameworks.js: the ${id} record is used by no guide; remove it and its files`);
}
// The number of guides is the number of guide pages, whatever the number
// of marks.
const guidePages = fs
	.readdirSync(path.join(__dirname, "../docs/src/pages/installation"))
	.filter((file) => file.endsWith(".md") && file !== "index.md");
if (frameworkData.count !== frameworkData.guides.length || frameworkData.count !== guidePages.length) {
	markFailures.push(`frameworks.js: ${frameworkData.count} guides counted, ${frameworkData.guides.length} listed, ${guidePages.length} guide pages`);
}
failures.push(...markFailures);

if (failures.length > 0) {
	console.error(
		`[@cirthcss/cirth] check:brand-assets: ${failures.length} asset(s) failed: the Cirth mark drifted from ${SOURCE}, or an integration mark is missing, unsafe or unlisted`,
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
	`[@cirthcss/cirth] check:brand-assets: ${assets.length} assets carry the ${mark.length}-path mark from ${SOURCE}; ${named.size} integration mark files (${Object.values(frameworkMarks).filter((record) => record.file).length} marks) are present, self-contained, listed and shown under their owners' terms; all ${frameworkData.count} guides name their project's site, ${frameworkData.guides.filter((guide) => !guide.markData).length} of them by name alone`,
);
