const fs = require("node:fs");
const path = require("node:path");
const process = require("node:process");
const { DRAWINGS, read } = require("./lib/brand-mark");
const marks = require("./build-brand-marks");
const lockups = require("./build-brand-lockup");

// Every Cirth brand asset is generated from the two drawings in docs/brand/
// and the theme's scales: the marks, the favicon and the manifest by
// build-brand-marks.js, the lockups by build-brand-lockup.js. Nothing in the
// build runs them, so a redrawn mark or a moved accent step leaves the
// files on disk describing the old one until someone regenerates them.
//
// This check is what notices. It regenerates every file in memory and
// compares it with the file on disk, byte for byte: geometry, pigment and
// crop together. A difference means the file was edited by hand, or not
// regenerated after the drawing or the scale moved.

/** @type {Record<string, string>} */
const generated = { ...marks.variants(), ...lockups.variants() };
/** @type {string[]} */
const failures = [];
const SOURCES = Object.values(DRAWINGS)
	.map(({ file }) => path.relative(path.join(__dirname, ".."), file))
	.join(" and ");

for (const [file, expected] of Object.entries(generated)) {
	/** @type {string} */
	let actual;
	try {
		actual = read(file);
	} catch {
		failures.push(`${file}: missing`);
		continue;
	}
	if (actual !== expected) {
		failures.push(
			`${file}: differs from what the generators write from ${SOURCES} and src/theme/_colors.scss`,
		);
	}
}

// Nothing brand-named is left over: every SVG is one the generators write,
// every mark or lockup PNG is the raster of one of those SVGs, and every
// icon is one `icons` in build-brand-marks.js declares. A variant the
// generators stopped writing would otherwise stay published, unnoticed.
const publicDir = path.join(__dirname, "../docs/public");
/** @type {Map<string, { file: string, sizes: number[] }>} */
const declaredIcons = new Map(marks.icons.map((icon) => [icon.file, icon]));
for (const file of fs.readdirSync(publicDir)) {
	if (declaredIcons.has(file)) continue;
	if (!/^(?:logo_|favicon|wordmark|mark_|icon-|apple-touch-icon)/.test(file)) continue;
	if (file.endsWith(".svg")) {
		if (!(file in generated)) failures.push(`${file}: no generator writes it; remove it or add it to one`);
	} else if (!/^(?:logo_|wordmark)/.test(file) || !file.endsWith(".png") || !(file.replace(/\.png$/, ".svg") in generated)) {
		failures.push(`${file}: a raster of nothing the generators write; remove it, or declare it in \`icons\``);
	}
}

// Every declared icon is there, at the sizes it declares: read from the
// PNG header, or from each entry of an .ico's directory. The pixels are
// not compared, for the reason the PNGs above are not.
const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
for (const icon of declaredIcons.values()) {
	const full = path.join(publicDir, icon.file);
	if (!fs.existsSync(full)) {
		failures.push(`${icon.file}: missing; run \`npm run docs:brand-assets\``);
		continue;
	}
	const bytes = fs.readFileSync(full);
	/** @type {number[]} */
	let sizes = [];
	if (icon.file.endsWith(".ico")) {
		const count = bytes.readUInt16LE(2) === 1 ? bytes.readUInt16LE(4) : 0;
		for (let index = 0; index < count; index++) {
			const entry = 6 + 16 * index;
			const width = bytes.readUInt8(entry) || 256;
			const height = bytes.readUInt8(entry + 1) || 256;
			const image = bytes.subarray(bytes.readUInt32LE(entry + 12));
			sizes.push(width === height && image.subarray(0, 8).equals(pngSignature) ? width : -1);
		}
	} else if (bytes.subarray(0, 8).equals(pngSignature) && bytes.readUInt32BE(16) === bytes.readUInt32BE(20)) {
		sizes = [bytes.readUInt32BE(16)];
	}
	if (sizes.join() !== icon.sizes.join()) {
		failures.push(`${icon.file}: holds ${sizes.length ? sizes.join(", ") : "no readable image"}, not the declared ${icon.sizes.join(", ")}px`);
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
		`[@cirthcss/cirth] check:brand-assets: ${failures.length} asset(s) failed: the Cirth mark drifted from ${SOURCES}, or an integration mark is missing, unsafe or unlisted`,
	);
	for (const failure of failures) console.error(`  ✗ ${failure}`);
	console.error(
		"\nThe brand files are generated: run `npm run docs:brand-assets` after\n" +
			"redrawing the mark or moving an accent or canvas step, and never edit\n" +
			"one by hand. docs/BRAND_ASSETS.md lists what each file is for.",
	);
	process.exit(1);
}

console.log(
	`[@cirthcss/cirth] check:brand-assets: ${Object.keys(generated).length} generated files match the drawings in ${SOURCES} and the theme's scales; ${named.size} integration mark files (${Object.values(frameworkMarks).filter((record) => record.file).length} marks) are present, self-contained, listed and shown under their owners' terms; all ${frameworkData.count} guides name their project's site, ${frameworkData.guides.filter((guide) => !guide.markData).length} of them by name alone`,
);
