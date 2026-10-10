const fs = require("node:fs");
const path = require("node:path");
const { boundingBox, markPaths, namePaths, pigment, publicDir } = require("./lib/brand-mark");
const { roles } = require("./build-brand-marks");

// Generates the horizontal lockup (the mark with "Cirth" beside it) from
// the sources that already define both halves. Nothing here is a second
// copy of the identity:
//
//   mark       docs/public/logo_brand.svg      (the path data, verbatim)
//   name       docs/brand/cirth-wordmark-martian-condensed.svg
//                                              (the word outlined from
//                                              Martian Grotesk Condensed
//                                              Bold, SIL OFL 1.1)
//   pigment    src/theme/_colors.scss          (the mark's roles, as
//                                              build-brand-marks.js assigns
//                                              them; the name's ink from
//                                              $neutral-900 / $neutral-100)
//
// The name is outlines, not text, so the lockup renders the same on every
// platform and needs no font installed.

// Both halves are measured from their path data. The name's reference is
// the ink of its first glyph, the round C: cap height plus its overshoot.
const MARK_BOX = boundingBox(markPaths());
const NAME = namePaths();
const NAME_BOX = boundingBox(NAME);
const CAP_BOX = boundingBox([NAME[0]]);

// The mark is drawn taller than the name's capitals. Provisional, like the
// drawing: the published ratio waits for the definitive mark.
const MARK_RATIO = 1.5;

// How the two halves are aligned: optically, not by their boxes. The
// feather adds height to the mark without adding mass, so centring the
// mark on the capitals leaves the figure sunk below them. The mark and the
// name are aligned at the foot instead, and the name is raised by a quarter
// of the difference in their heights. For this drawing that is also what
// centring the figure without its feather (hat to lute) on the capitals
// gives: 0.254.
const RAISE = 0.25;

// The gap between mark and name, as a fraction of the cap height.
const GAP_RATIO = 0.3;

// The lockup's own height, in user units: the size its SVG declares.
const HEIGHT = 108;

/** @param {number} value */
const round = (value) => Math.round(value * 1000) / 1000;

// Lay both halves out in the name's units, then scale the whole to HEIGHT.
const capBottom = CAP_BOX.y + CAP_BOX.height;
const markHeight = MARK_RATIO * CAP_BOX.height;
const markTop = capBottom + RAISE * (markHeight - CAP_BOX.height) - markHeight;
const top = Math.min(markTop, NAME_BOX.y);
const bottom = Math.max(markTop + markHeight, NAME_BOX.y + NAME_BOX.height);
const unit = HEIGHT / (bottom - top);
const markScale = (markHeight * unit) / MARK_BOX.height;
const markWidth = MARK_BOX.width * markScale;
const nameX = markWidth + GAP_RATIO * CAP_BOX.height * unit;
const width = nameX + NAME_BOX.width * unit;
// Where the middle of the name's capitals falls, as a share of the
// lockup's height: what a page needs to centre the name, rather than the
// lockup's box, on the text beside it.
const nameCentre = (CAP_BOX.y + CAP_BOX.height / 2 - top) / (bottom - top);

/**
 * @param {object} variant
 * @param {string} variant.markFill
 * @param {string} variant.nameFill
 * @param {string} variant.title
 */
const lockup = ({ markFill, nameFill, title }) => {
	const markTransform = `translate(0 ${round((markTop - top) * unit)}) scale(${round(markScale)}) translate(${round(-MARK_BOX.x)} ${round(-MARK_BOX.y)})`;
	const nameTransform = `translate(${round(nameX)} 0) scale(${round(unit)}) translate(${round(-NAME_BOX.x)} ${round(-top)})`;
	const mark = markPaths()
		.map((d) => `    <path d="${d}"/>`)
		.join("\n");
	const name = NAME.map((d) => `    <path d="${d}"/>`).join("\n");
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${round(width)}" height="${HEIGHT}" viewBox="0 0 ${round(width)} ${HEIGHT}" fill="none" role="img" aria-label="Cirth">
  <title>${title}</title>
  <g transform="${markTransform}" fill="${markFill}">
${mark}
  </g>
  <g transform="${nameTransform}" fill="${nameFill}">
${name}
  </g>
</svg>
`;
};

/** @returns {Record<string, string>} Every lockup, by file name, as it should read on disk. */
const variants = () => ({
	"wordmark.svg": lockup({
		markFill: pigment(roles.markLight),
		nameFill: pigment("neutral-900"),
		title: "Cirth — horizontal lockup, light backgrounds",
	}),
	"wordmark_dark.svg": lockup({
		markFill: pigment(roles.markDark),
		nameFill: pigment("neutral-100"),
		title: "Cirth — horizontal lockup, dark backgrounds",
	}),
	"wordmark_mono.svg": lockup({
		markFill: "currentColor",
		nameFill: "currentColor",
		title: "Cirth — horizontal lockup, one colour",
	}),
});

module.exports = { HEIGHT, nameCentre: round(nameCentre), variants, width: round(width) };

if (require.main === module) {
	const files = variants();
	for (const [file, content] of Object.entries(files)) {
		fs.writeFileSync(path.join(publicDir, file), content);
	}
	console.log(`[cirth] brand lockup generated: ${Object.keys(files).join(", ")}`);
}
