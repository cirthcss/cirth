const fs = require("node:fs");
const path = require("node:path");
const { boundingBox, namePaths, pigment, publicDir } = require("./lib/brand-mark");
const { painted } = require("./build-brand-marks");

// Generates the horizontal lockups (the badge with "cirth" beside it) from
// the sources that already define both halves. Nothing here is a second
// copy of the identity:
//
//   mark       docs/brand/cirth-mark.svg      (painted as build-brand-marks.js
//                                              paints it)
//   name       docs/brand/cirth-wordmark-onest.svg
//                                              (the word in lowercase,
//                                              outlined from Onest,
//                                              SIL OFL 1.1)
//   pigment    src/theme/_colors.scss          (the name's ink from
//                                              $neutral-900 / $neutral-100)
//
// The name is outlines, not text, so the lockup renders the same on every
// platform and needs no font installed. There is one lockup, written twice
// for the name's ink on a light and on a dark ground: the README, the share
// card, the Brand page and the site header and footer, where it is drawn
// 34px high, all use it.

// Both halves are measured from their geometry. The name is set in
// lowercase, so its reference is its whole ink, from the top of the
// ascenders to the foot of the round letters. The ink of its first glyph,
// the round c, is the x-height plus its overshoot.
const NAME = namePaths();
const NAME_BOX = boundingBox(NAME);
const X_BOX = boundingBox([NAME[0]]);

// The badge's disc is this many times the height of the name's ink.
const MARK_RATIO = 1.55;

// How the two halves are aligned: the centre of the disc on the middle of
// the name's ink. The badge is round, so its centre is also its optical
// centre.

// The gap between the disc and the name, as a fraction of the height of
// the name's ink.
const GAP_RATIO = 0.3;

// The lockup's own height, in user units: the size its SVG declares.
const HEIGHT = 108;

/** @param {number} value */
const round = (value) => Math.round(value * 1000) / 1000;

const layout = () => {
	const mark = painted();
	// Lay both halves out in the name's units, then scale the whole to
	// HEIGHT.
	const inkCentre = NAME_BOX.y + NAME_BOX.height / 2;
	const xCentre = X_BOX.y + X_BOX.height / 2;
	const scale = (MARK_RATIO * NAME_BOX.height) / mark.disc.height;
	const discCentre = mark.disc.y + mark.disc.height / 2;
	/** @param {number} y a height in the drawing, as one in the name's units */
	const toName = (y) => inkCentre + (y - discCentre) * scale;
	const top = Math.min(toName(mark.ink.y), NAME_BOX.y);
	const bottom = Math.max(toName(mark.ink.y + mark.ink.height), NAME_BOX.y + NAME_BOX.height);
	const unit = HEIGHT / (bottom - top);
	const markWidth = mark.ink.width * scale * unit;
	const nameX = markWidth + GAP_RATIO * NAME_BOX.height * unit;
	const width = nameX + NAME_BOX.width * unit;
	return {
		mark,
		markTransform: `translate(0 ${round((toName(0) - top) * unit)}) scale(${round(scale * unit)}) translate(${round(-mark.ink.x)} 0)`,
		nameTransform: `translate(${round(nameX)} 0) scale(${round(unit)}) translate(${round(-NAME_BOX.x)} ${round(-top)})`,
		width: round(width),
		// Where the middle of the name's x-height falls, as a share of the
		// lockup's height: what a page needs to centre the name, rather than
		// the lockup's box, on the text beside it. A lowercase word reads on
		// its x-height, so that band is the one lined up with the text.
		nameCentre: round((xCentre - top) / (bottom - top)),
	};
};

/**
 * @param {object} variant
 * @param {string} variant.nameFill
 * @param {string} variant.title
 */
const lockup = ({ nameFill, title }) => {
	const { mark, markTransform, nameTransform, width } = layout();
	const name = NAME.map((d) => `    <path d="${d}"/>`).join("\n");
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${HEIGHT}" viewBox="0 0 ${width} ${HEIGHT}" role="img" aria-label="Cirth">
  <title>${title}</title>
  <g transform="${markTransform}">
${mark.body}
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
		nameFill: pigment("neutral-900"),
		title: "Cirth — horizontal lockup, light backgrounds",
	}),
	"wordmark_dark.svg": lockup({
		nameFill: pigment("neutral-100"),
		title: "Cirth — horizontal lockup, dark backgrounds",
	}),
});

/** The lockup's box, for the pages that reserve its space. */
const boxes = () => {
	const { width, nameCentre } = layout();
	return { height: HEIGHT, width, nameCentre };
};

module.exports = { HEIGHT, MARK_RATIO, boxes, variants };

if (require.main === module) {
	const files = variants();
	for (const [file, content] of Object.entries(files)) {
		fs.writeFileSync(path.join(publicDir, file), content);
	}
	console.log(`[cirth] brand lockup generated: ${Object.keys(files).join(", ")}`);
}
