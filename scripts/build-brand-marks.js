const fs = require("node:fs");
const path = require("node:path");
const { contrastRatio } = require("./lib/color");
const { boundingBox, markPaths, pigment, publicDir, scaleStep } = require("./lib/brand-mark");

// Writes every flat variant of the mark from two sources, so that none of
// them is a hand-made copy:
//
//   geometry   docs/public/logo_brand.svg   (the path data, verbatim)
//   pigment    src/theme/_colors.scss       (accent and canvas steps)
//
// The drawing is the one thing a person edits. Recolouring it or cropping
// it for a favicon is mechanical, and a mechanical copy kept by hand is the
// copy that goes stale. `npm run check:brand-assets` compares the files on
// disk with what this module produces.
//
// There is no reduced drawing for small sizes. Without its two sliver
// counters the mark stops reading as a written sign at 16px and becomes a
// round figure; with them it is soft on a 1x screen and clear at 2x and
// from 32px up, which is the trade docs/BRAND_ASSETS.md records.

// Which step each role takes. The mark on a light ground is the light
// accent itself; on a dark ground it is one step lighter than the dark
// accent, since a mid-tone sign on a near-black page reads dimmer than the
// same contrast in text. Paper is the ground of the touch icon and the
// colour the web manifest declares.
const roles = {
	markLight: "accent-500",
	markDark: "accent-400",
	paper: "canvas-light",
	night: "canvas-dark",
};

/** @returns {Record<keyof typeof roles, string>} */
const pigments = () =>
	/** @type {Record<keyof typeof roles, string>} */ (
		Object.fromEntries(Object.entries(roles).map(([role, step]) => [role, pigment(step)]))
	);

/** @param {number} value */
const round = (value) => Math.round(value * 100) / 100;

/**
 * @param {string} fill
 * @returns {string}
 */
const markElements = (fill) =>
	markPaths()
		.map((d) => `<path d="${d}" fill="${fill}"/>`)
		.join("\n");

/**
 * The mark in its 512 box.
 *
 * @param {string} fill
 */
const square = (fill) =>
	`<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">\n${markElements(fill)}\n</svg>\n`;

// The favicon is the mark alone on a transparent ground, cropped to a
// square around its ink so that it fills the tab rather than its own
// margins: the ink's height plus FAVICON_MARGIN on each side, centred on
// the ink box.
const FAVICON_MARGIN = 8;
/** @param {string} fill */
const favicon = (fill) => {
	const ink = boundingBox(markPaths());
	const side = Math.max(ink.width, ink.height) + 2 * FAVICON_MARGIN;
	const x = ink.x + ink.width / 2 - side / 2;
	const y = ink.y + ink.height / 2 - side / 2;
	return `<svg width="64" height="64" viewBox="${round(x)} ${round(y)} ${round(side)} ${round(side)}" fill="none" xmlns="http://www.w3.org/2000/svg">
<title>Cirth</title>
${markElements(fill)}
</svg>
`;
};

// The manifest's ground is the light canvas, the page an installed shortcut
// opens on.
/** @param {string} paper */
const manifest = (paper) =>
	`${JSON.stringify(
		{
			name: "Cirth documentation",
			short_name: "Cirth",
			icons: [
				{ src: "/favicon.svg", sizes: "any", type: "image/svg+xml" },
				{ src: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
			],
			theme_color: paper.toLowerCase(),
			background_color: paper.toLowerCase(),
			display: "standalone",
		},
		null,
		2,
	)}\n`;

/** @returns {Record<string, string>} Every generated file, by name, as it should read on disk. */
const variants = () => {
	const p = pigments();
	return {
		"logo_brand.svg": square(p.markLight),
		"logo_brand_dark.svg": square(p.markDark),
		"logo_mono.svg": square("black"),
		"logo_mono_dark.svg": square("white"),
		"favicon.svg": favicon(p.markLight),
		"favicon_dark.svg": favicon(p.markDark),
		"site.webmanifest": manifest(p.paper),
	};
};

// What the Brand page prints: each mark's step and value, and its contrast
// on the canvas it is drawn for, from the same steps the files are painted
// with.
const palette = () => {
	const p = pigments();
	/** @param {keyof typeof roles} role */
	const entry = (role) => ({ step: roles[role], hex: p[role], oklch: scaleStep(roles[role]) });
	/** @param {keyof typeof roles} mark @param {keyof typeof roles} ground */
	const ratio = (mark, ground) => contrastRatio(scaleStep(roles[mark]), scaleStep(roles[ground]));
	return {
		markLight: entry("markLight"),
		markDark: entry("markDark"),
		paper: entry("paper"),
		night: entry("night"),
		contrast: {
			light: ratio("markLight", "paper"),
			dark: ratio("markDark", "night"),
		},
	};
};

module.exports = { palette, roles, variants };

if (require.main === module) {
	const files = variants();
	for (const [file, content] of Object.entries(files)) {
		fs.writeFileSync(path.join(publicDir, file), content);
	}
	console.log(`[cirth] brand marks generated: ${Object.keys(files).join(", ")}`);
}
