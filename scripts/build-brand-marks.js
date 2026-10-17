const fs = require("node:fs");
const path = require("node:path");
const { drawing, pigment, publicDir, scaleStep } = require("./lib/brand-mark");

// Writes every published file of the mark from two sources, so that none
// of them is a hand-made copy:
//
//   drawings   docs/brand/cirth-mark.svg          (the full badge)
//              docs/brand/cirth-mark-compact.svg  (the badge for small sizes)
//   pigment    src/theme/_colors.scss             (accent and canvas steps)
//
// The drawings are the one thing a person edits. Painting their disc from
// the accent or framing one for an icon is mechanical, and a mechanical
// copy kept by hand is the copy that goes stale. `npm run
// check:brand-assets` compares the files on disk with what this module
// produces.
//
// The full drawing is for 64px and up. Below that its cloak, sleeves and
// finer hair lines close up, so the compact drawing, a close-up of the face
// and the flute, takes over: every icon and every place the site shows the
// mark small. docs/BRAND_ASSETS.md records the rule.
//
// There is one file per drawing, not one per scheme: the badge carries its
// own black ring and reads on a light or a dark ground alike. There is no
// one-colour file either, since a drawing in several inks has no
// mechanical one-ink version.

// Which step each role takes. The disc is the light accent itself, the
// colour of a primary button; its highlight is the step the drawing's own
// highlight sits nearest. Paper is the ground of the icons that need an
// opaque one and the colour the web manifest declares.
const roles = {
	disc: "accent-500",
	highlight: "accent-250",
	paper: "canvas-light",
};

/** @returns {Record<keyof typeof roles, string>} */
const pigments = () =>
	/** @type {Record<keyof typeof roles, string>} */ (
		Object.fromEntries(Object.entries(roles).map(([role, step]) => [role, pigment(step)]))
	);

/** @param {"full" | "compact"} kind */
const painted = (kind) => {
	const p = pigments();
	return drawing(kind, { disc: p.disc, highlight: p.highlight });
};

/** @param {number} value */
const round = (value) => Math.round(value * 100) / 100;

/**
 * The square a drawing is shown in, centred on its ring.
 *
 * - `0`: the ring's own square, edge to edge. Whatever the ring does not
 *   hold (the end of the compact drawing's flute) is cut by the frame.
 * - `"whole"`: just wide enough to hold every part of the drawing.
 * - a fraction: the ring leaves that share of the side clear on each edge,
 *   and the drawing must fit inside it whole.
 *
 * @param {ReturnType<typeof painted>} mark
 * @param {number | "whole"} inset
 */
const frame = (mark, inset) => {
	const { ring, ink } = mark;
	const overhang = Math.max(
		0,
		ring.x - ink.x,
		ink.x + ink.width - (ring.x + ring.width),
		ring.y - ink.y,
		ink.y + ink.height - (ring.y + ring.height),
	);
	const side = inset === "whole" ? ring.width + 2 * overhang : ring.width / (1 - 2 * inset);
	if (typeof inset === "number" && inset > 0 && (side - ring.width) / 2 < overhang) {
		throw new Error(`build-brand-marks: the drawing reaches past an inset of ${inset}`);
	}
	return { x: ring.x + ring.width / 2 - side / 2, y: ring.y + ring.height / 2 - side / 2, side };
};

/**
 * A drawing in a square frame, declared `size` pixels square, on the paper
 * canvas or on nothing.
 *
 * @param {"full" | "compact"} kind
 * @param {{ inset: number | "whole", size: number, ground?: boolean }} options
 */
const framed = (kind, { inset, size, ground = false }) => {
	const mark = painted(kind);
	const { x, y, side } = frame(mark, inset);
	const box = `${round(x)} ${round(y)} ${round(side)} ${round(side)}`;
	const paper = ground
		? `<rect x="${round(x)}" y="${round(y)}" width="${round(side)}" height="${round(side)}" fill="${pigments().paper}"/>\n`
		: "";
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${box}" role="img" aria-label="Cirth">
<title>Cirth</title>
${paper}${mark.body}
</svg>
`;
};

/**
 * The full drawing in its own box, declared 512px so that the 1024px PNG
 * is a 2x render of it.
 */
const full = () => {
	const { viewBox, body } = painted("full");
	return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}" role="img" aria-label="Cirth">
<title>Cirth</title>
${body}
</svg>
`;
};

// The icons, every one the compact drawing. `capture-brand-assets.js`
// renders each file at each of its sizes; an .ico holds them all.
//
// A tab icon is the ring's own square, edge to edge: at 16px every pixel
// goes to the badge, and the edge of the icon explains the flute it cuts.
// Larger icons show the whole drawing. The two an operating system puts on
// a tile of its own stand on the paper canvas: iOS fills a transparent
// touch icon with black and rounds its corners itself, and a maskable icon
// is cropped to any shape inside its central 80%, the circle the badge is
// fitted to.
/** @typedef {{ file: string, sizes: number[], inset: number | "whole", ground?: boolean, manifest?: "any" | "maskable" }} Icon */
/** @type {Icon[]} */
const icons = [
	// The tab icon for browsers that take no SVG one: Safari before 26.
	{ file: "favicon.ico", sizes: [16, 32], inset: 0 },
	// The iOS home screen and Safari's favourites.
	{ file: "apple-touch-icon.png", sizes: [180], inset: 20 / 180, ground: true },
	// What the web manifest offers an installed shortcut.
	{ file: "icon-192.png", sizes: [192], inset: "whole", manifest: "any" },
	{ file: "icon-512.png", sizes: [512], inset: "whole", manifest: "any" },
	{ file: "icon-maskable.png", sizes: [512], inset: 0.1, ground: true, manifest: "maskable" },
];

/**
 * The SVG an icon is rendered from, at one of its sizes.
 *
 * @param {Icon} icon
 * @param {number} size
 */
const iconSource = (icon, size) => framed("compact", { inset: icon.inset, size, ground: icon.ground });

// The manifest's ground is the light canvas, the page a shortcut opens on.
// `display: browser`: the documentation opens in a browser tab, and is not
// offered for installation as an app; the icons still serve a shortcut.
/** @param {string} paper */
const manifest = (paper) =>
	`${JSON.stringify(
		{
			name: "Cirth documentation",
			short_name: "Cirth",
			icons: icons
				.filter((icon) => icon.manifest)
				.map((icon) => ({
					src: `/${icon.file}`,
					sizes: `${icon.sizes[0]}x${icon.sizes[0]}`,
					type: "image/png",
					...(icon.manifest === "any" ? {} : { purpose: icon.manifest }),
				})),
			theme_color: paper.toLowerCase(),
			background_color: paper.toLowerCase(),
			display: "browser",
		},
		null,
		2,
	)}\n`;

/** @returns {Record<string, string>} Every generated file, by name, as it should read on disk. */
const variants = () => ({
	"logo_brand.svg": full(),
	"logo_compact.svg": framed("compact", { inset: "whole", size: 512 }),
	"favicon.svg": framed("compact", { inset: 0, size: 32 }),
	"site.webmanifest": manifest(pigments().paper),
});

// What the Brand page prints: each painted role's step and value, from the
// same steps the files are painted with.
const palette = () => {
	const p = pigments();
	/** @param {keyof typeof roles} role */
	const entry = (role) => ({ step: roles[role], hex: p[role], oklch: scaleStep(roles[role]) });
	return { disc: entry("disc"), highlight: entry("highlight"), paper: entry("paper") };
};

module.exports = { iconSource, icons, palette, painted, roles, variants };

if (require.main === module) {
	const files = variants();
	for (const [file, content] of Object.entries(files)) {
		fs.writeFileSync(path.join(publicDir, file), content);
	}
	console.log(`[cirth] brand marks generated: ${Object.keys(files).join(", ")}`);
}
