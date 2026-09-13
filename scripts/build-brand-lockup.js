const fs = require("node:fs");
const path = require("node:path");
const { parseColor } = require("./lib/color");

// Generates the horizontal lockup — the mark with "Cirth" beside it — from
// the assets and tokens that already define both halves. Nothing here is a
// second copy of the identity:
//
//   geometry   docs/public/logo_brand.svg      (the five mark paths, verbatim)
//   pigment    docs/public/logo_brand*.svg     (each variant's own fill)
//   ink        src/theme/_colors.scss          ($neutral-900 / $neutral-100)
//   type       the system sans the framework ships, as live SVG text
//
// The text is live rather than outlined on purpose, and it is the reason
// this file exists instead of four hand-drawn SVGs. Cirth's wordmark is
// "the same system stacks the framework ships" (docs/src/pages/brand.md);
// outlining it would both freeze one platform's rendering and embed glyph
// outlines from fonts — SF Pro, Segoe UI — that are not ours to
// redistribute. Live text costs one thing in exchange: the advance width
// moves between faces, so the box reserves the widest one measured.

const projectRoot = path.join(__dirname, "..");
const publicDir = path.join(projectRoot, "docs/public");

// Geometry. The mark's ink occupies this box inside its 512 viewBox — the
// paths are not centred in it, so a lockup that used the viewBox would sit
// visibly off its own baseline.
const MARK_BOX = { x: 76, y: 66, width: 340.476, height: 380 };

// Type. Measured in Chromium at 700 weight, 100px, over the faces
// `--cirth-font-family-sans` can actually resolve to:
//
//   cap height   71.68 (SF Pro) · 72.8 (Arial) · 73.34 (Helvetica)
//   advance      227.64 (SF Pro) · 233.3 (Helvetica, Arial) · 245.86 (Tahoma)
//
// CAP_HEIGHT is the ratio the mark is sized against, and is what "mark at
// the cap height" in brand.md means numerically. TEXT_RESERVE is the width
// the box holds open for the word: above every face in the stack, so a
// narrower one leaves a little air on the right rather than being clipped.
const FONT_SIZE = 100;
const CAP_HEIGHT = 0.72 * FONT_SIZE;
const TEXT_RESERVE = 2.45 * FONT_SIZE;
const ASCENDER = 0.78 * FONT_SIZE;

// The gap between mark and word, as a fraction of the cap height. The two
// places Cirth already sets its own name beside the mark — the site header
// and the share card — sit either side of this value.
const GAP = 0.25 * CAP_HEIGHT;

// Tracking, in user units rather than `em`: `letter-spacing` with a
// relative unit is CSS/SVG 2, and standalone SVG rasterisers still in use
// (librsvg, resvg) ignore it silently. At this font size the two are the
// same -2% the site header sets on the same word.
const TRACKING = -0.02 * FONT_SIZE;

const FONT_STACK =
	"system-ui, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, Helvetica, Arial, 'Helvetica Neue', sans-serif";

/** @param {string} file */
const readAsset = (file) => fs.readFileSync(path.join(publicDir, file), "utf8");

// The five path commands, taken from the brand mark so the lockup can never
// drift from it. Only `d` is read; the fill comes from the variant.
const markPaths = () => {
	const source = readAsset("logo_brand.svg");
	const paths = [...source.matchAll(/<path\s+d="([^"]+)"/g)].map((m) => m[1]);
	if (paths.length !== 5) {
		throw new Error(
			`build-brand-lockup: expected 5 mark paths in logo_brand.svg, found ${paths.length}`,
		);
	}
	return paths;
};

// The fill a given mark variant paints with, read back out of that variant.
/** @param {string} file */
const markFill = (file) => {
	const fill = readAsset(file).match(/<path\s+d="[^"]+"\s+fill="([^"]+)"/);
	if (!fill) throw new Error(`build-brand-lockup: no fill found in ${file}`);
	return fill[1];
};

// The page ink, from the scale the schemes build --cirth-contrast out of.
/** @param {string} name */
const neutral = (name) => {
	const colors = fs.readFileSync(
		path.join(projectRoot, "src/theme/_colors.scss"),
		"utf8",
	);
	const match = colors.match(new RegExp(`\\$${name}:\\s*(oklch\\([^)]*\\))`));
	if (!match) throw new Error(`build-brand-lockup: $${name} not found`);
	const { r, g, b } = parseColor(match[1]);
	/** @param {number} value */
	const channel = (value) =>
		Math.round(Math.max(0, Math.min(1, value)) * 255)
			.toString(16)
			.padStart(2, "0")
			.toUpperCase();
	return `#${channel(r)}${channel(g)}${channel(b)}`;
};

const scale = CAP_HEIGHT / MARK_BOX.height;
const markWidth = MARK_BOX.width * scale;
const textX = markWidth + GAP;
const width = Math.round((textX + TEXT_RESERVE) * 100) / 100;
const height = ASCENDER;
// Baseline sits at the bottom of the box: "Cirth" has no descender, so the
// box does not reserve room for one.
const baseline = ASCENDER;
const markY = baseline - CAP_HEIGHT;

/**
 * @param {object} variant
 * @param {string} variant.file
 * @param {string} variant.markFill
 * @param {string} variant.textFill
 * @param {string} variant.title
 */
const lockup = ({ file, markFill: fill, textFill, title }) => {
	const transform = `translate(0 ${round(markY)}) scale(${round(scale)}) translate(${round(-MARK_BOX.x)} ${round(-MARK_BOX.y)})`;
	const paths = markPaths()
		.map((d) => `    <path d="${d}" fill="${fill}" />`)
		.join("\n");
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${round(width)}" height="${round(height)}" viewBox="0 0 ${round(width)} ${round(height)}" fill="none" role="img" aria-label="Cirth">
  <title>${title}</title>
  <g transform="${transform}">
${paths}
  </g>
  <text x="${round(textX)}" y="${round(baseline)}" fill="${textFill}" font-family="${FONT_STACK}" font-size="${FONT_SIZE}" font-weight="700" letter-spacing="${round(TRACKING)}">Cirth</text>
</svg>
`;
	fs.writeFileSync(path.join(publicDir, file), svg);
	return file;
};

/** @param {number} value */
function round(value) {
	return Math.round(value * 1000) / 1000;
}

const variants = [
	{
		file: "wordmark.svg",
		markFill: markFill("logo_brand.svg"),
		textFill: neutral("neutral-900"),
		title: "Cirth — horizontal lockup, light backgrounds",
	},
	{
		file: "wordmark_dark.svg",
		markFill: markFill("logo_brand_dark.svg"),
		textFill: neutral("neutral-100"),
		title: "Cirth — horizontal lockup, dark backgrounds",
	},
	{
		file: "wordmark_mono.svg",
		markFill: "currentColor",
		textFill: "currentColor",
		title: "Cirth — horizontal lockup, one colour",
	},
];

const written = variants.map(lockup);
console.log(`[cirth] brand lockup generated: ${written.join(", ")}`);
