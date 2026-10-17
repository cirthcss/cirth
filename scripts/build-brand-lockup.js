const fs = require("node:fs");
const path = require("node:path");
const { boundingBox, namePaths, pigment, publicDir } = require("./lib/brand-mark");
const { painted } = require("./build-brand-marks");

// Generates the horizontal lockups (the badge with "Cirth" beside it) from
// the sources that already define both halves. Nothing here is a second
// copy of the identity:
//
//   mark       docs/brand/cirth-mark.svg, cirth-mark-compact.svg
//                                              (painted as build-brand-marks.js
//                                              paints them)
//   name       docs/brand/cirth-wordmark-martian-condensed.svg
//                                              (the word outlined from
//                                              Martian Grotesk Condensed
//                                              Bold, SIL OFL 1.1)
//   pigment    src/theme/_colors.scss          (the name's ink from
//                                              $neutral-900 / $neutral-100)
//
// The name is outlines, not text, so the lockup renders the same on every
// platform and needs no font installed. There are two lockups, one per
// drawing: the full one for the README, the share card and the Brand page,
// the compact one for the site header and footer, where the badge is drawn
// 34px high.

// Both halves are measured from their geometry. The name's reference is
// the ink of its first glyph, the round C: cap height plus its overshoot.
const NAME = namePaths();
const NAME_BOX = boundingBox(NAME);
const CAP_BOX = boundingBox([NAME[0]]);

// The badge's ring is this many times the height of the name's C.
const MARK_RATIO = 1.6;

// How the two halves are aligned: the centre of the ring on the middle of
// the capitals. The badge is round, so its centre is also its optical
// centre; what the full drawing adds below the ring, the hands and sleeves,
// adds height without moving it.

// The gap between the ring and the name, as a fraction of the cap height.
const GAP_RATIO = 0.3;

// The lockup's own height, in user units: the size its SVG declares.
const HEIGHT = 108;

/** @param {number} value */
const round = (value) => Math.round(value * 1000) / 1000;

/** @param {"full" | "compact"} kind */
const layout = (kind) => {
	const mark = painted(kind);
	// Lay both halves out in the name's units, then scale the whole to
	// HEIGHT.
	const capCentre = CAP_BOX.y + CAP_BOX.height / 2;
	const scale = (MARK_RATIO * CAP_BOX.height) / mark.ring.height;
	const ringCentre = mark.ring.y + mark.ring.height / 2;
	/** @param {number} y a height in the drawing, as one in the name's units */
	const toName = (y) => capCentre + (y - ringCentre) * scale;
	const top = Math.min(toName(mark.ink.y), NAME_BOX.y);
	const bottom = Math.max(toName(mark.ink.y + mark.ink.height), NAME_BOX.y + NAME_BOX.height);
	const unit = HEIGHT / (bottom - top);
	const markWidth = mark.ink.width * scale * unit;
	const nameX = markWidth + GAP_RATIO * CAP_BOX.height * unit;
	const width = nameX + NAME_BOX.width * unit;
	return {
		mark,
		markTransform: `translate(0 ${round((toName(0) - top) * unit)}) scale(${round(scale * unit)}) translate(${round(-mark.ink.x)} 0)`,
		nameTransform: `translate(${round(nameX)} 0) scale(${round(unit)}) translate(${round(-NAME_BOX.x)} ${round(-top)})`,
		width: round(width),
		// Where the middle of the name's capitals falls, as a share of the
		// lockup's height: what a page needs to centre the name, rather than
		// the lockup's box, on the text beside it.
		nameCentre: round((capCentre - top) / (bottom - top)),
	};
};

/**
 * @param {object} variant
 * @param {"full" | "compact"} variant.kind
 * @param {string} variant.nameFill
 * @param {string} variant.title
 */
const lockup = ({ kind, nameFill, title }) => {
	const { mark, markTransform, nameTransform, width } = layout(kind);
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
		kind: "full",
		nameFill: pigment("neutral-900"),
		title: "Cirth — horizontal lockup, light backgrounds",
	}),
	"wordmark_dark.svg": lockup({
		kind: "full",
		nameFill: pigment("neutral-100"),
		title: "Cirth — horizontal lockup, dark backgrounds",
	}),
	"wordmark_compact.svg": lockup({
		kind: "compact",
		nameFill: pigment("neutral-900"),
		title: "Cirth — compact horizontal lockup, light backgrounds",
	}),
	"wordmark_compact_dark.svg": lockup({
		kind: "compact",
		nameFill: pigment("neutral-100"),
		title: "Cirth — compact horizontal lockup, dark backgrounds",
	}),
});

/** The box of each lockup, for the pages that reserve its space. */
const boxes = () => {
	const full = layout("full");
	const compact = layout("compact");
	return {
		height: HEIGHT,
		full: { width: full.width, nameCentre: full.nameCentre },
		compact: { width: compact.width, nameCentre: compact.nameCentre },
	};
};

module.exports = { HEIGHT, MARK_RATIO, boxes, variants };

if (require.main === module) {
	const files = variants();
	for (const [file, content] of Object.entries(files)) {
		fs.writeFileSync(path.join(publicDir, file), content);
	}
	console.log(`[cirth] brand lockup generated: ${Object.keys(files).join(", ")}`);
}
