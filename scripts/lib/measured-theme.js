const fs = require("node:fs");
const path = require("node:path");

// The values the Brand and Colors pages quote, read out of the build.
//
// Both pages describe mechanisms (surface levels, edges, inks, roles) and
// back each one with a number. A number typed into Markdown goes stale the
// first time a token moves, and the Brand page already quoted a radius
// pair wrong for three minor versions that way. So every value here comes
// from dist/tokens/{light,dark}.tokens.json, which `npm run build` writes
// from dist/cirth.css and `check:tokens` holds to what Chromium, Firefox
// and WebKit compute, within ΔOklab 0.002.
//
// Contrast is WCAG 2 relative luminance over the export's sRGB hex, with a
// translucent colour composited over the surface it is measured against,
// the way a browser paints it.

/** @typedef {{ hex: string, alpha: number, l: number, c: number, h: number | null, oklch: string }} Color */

/** @param {number} value @param {number} digits */
const round = (value, digits) => {
	const factor = 10 ** digits;
	return Math.round(value * factor) / factor;
};

/** @param {string} hex @returns {[number, number, number]} */
const rgb = (hex) =>
	/** @type {[number, number, number]} */ (
		[1, 3, 5].map((index) => Number.parseInt(hex.slice(index, index + 2), 16) / 255)
	);

/** @param {[number, number, number]} channels */
const luminance = ([r, g, b]) => {
	/** @param {number} value */
	const linear = (value) => (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
	return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
};

/**
 * @param {Color} foreground
 * @param {Color} background an opaque colour
 */
const contrast = (foreground, background) => {
	const base = rgb(background.hex);
	const top = rgb(foreground.hex);
	const painted = /** @type {[number, number, number]} */ (
		top.map((value, index) => value * foreground.alpha + base[index] * (1 - foreground.alpha))
	);
	const [lighter, darker] = [luminance(painted), luminance(base)].sort((a, b) => b - a);
	return round((lighter + 0.05) / (darker + 0.05), 2);
};

/**
 * @param {string} root the repository root
 * @param {"light" | "dark"} scheme
 */
const readScheme = (root, scheme) => {
	const file = path.join(root, "dist", "tokens", `${scheme}.tokens.json`);
	if (!fs.existsSync(file)) return null;
	/** @type {Record<string, any>} */
	const document = JSON.parse(fs.readFileSync(file, "utf8"));
	/** @type {Record<string, { css: string }>} */
	const unrepresented = document.$extensions?.["com.github.cirthcss"]?.unrepresented ?? {};

	/** @param {string} name @param {number} [depth] @returns {any} */
	const value = (name, depth = 0) => {
		if (depth > 12) return null;
		const token = document[name];
		if (!token) return null;
		const raw = token.$value;
		if (typeof raw === "string" && /^\{[a-z0-9-]+\}$/.test(raw)) return value(raw.slice(1, -1), depth + 1);
		return raw;
	};

	/** @param {string} name @returns {Color | null} */
	const color = (name) => {
		const raw = value(name);
		if (!raw || typeof raw !== "object" || !raw.hex) return null;
		const [l, c, h] = raw.components;
		const hue = typeof h === "number" ? h : null;
		return {
			hex: raw.hex,
			alpha: raw.alpha ?? 1,
			l: round(l, 3),
			c: round(c, 3),
			h: hue === null ? null : round(hue, 1),
			oklch: `oklch(${round(l, 3)} ${round(c, 3)} ${hue === null ? "none" : round(hue, 1)}${(raw.alpha ?? 1) < 1 ? ` / ${round(raw.alpha, 2)}` : ""})`,
		};
	};

	// A length in px: a DTCG dimension, an alias to one, or one of the two
	// shapes the theme writes for a derived length that has no DTCG type,
	// `var(--x)` and `calc(var(--x) * n)`. Anything else is null, which the
	// pages print as missing rather than guessed.
	/** @param {string} name @param {number} [depth] @returns {number | null} */
	const length = (name, depth = 0) => {
		if (depth > 12) return null;
		const raw = value(name);
		if (raw && typeof raw === "object" && "unit" in raw) {
			return raw.unit === "rem" ? raw.value * 16 : raw.unit === "px" ? raw.value : null;
		}
		const css = unrepresented[name]?.css;
		if (!css) return null;
		const alias = /^var\(--cirth-([a-z0-9-]+)\)$/.exec(css);
		if (alias) return length(alias[1], depth + 1);
		const scaled = /^calc\(var\(--cirth-([a-z0-9-]+)\) \* ([0-9.]+)\)$/.exec(css);
		if (scaled) {
			const base = length(scaled[1], depth + 1);
			return base === null ? null : round(base * Number(scaled[2]), 2);
		}
		return null;
	};

	/** @param {string} name @returns {number | null} */
	const number = (name) => {
		const raw = value(name);
		return typeof raw === "number" ? raw : null;
	};

	// The rule a derived token is written as: the CSS the export keeps
	// beside a resolved colour, or the token it aliases. Null for an input,
	// which is a value rather than a rule.
	/** @param {string} name @returns {string | null} */
	const rule = (name) => {
		const token = document[name];
		if (!token) return unrepresented[name]?.css ?? null;
		const css = token.$extensions?.["com.github.cirthcss"]?.css;
		if (css) return css;
		const raw = token.$value;
		if (typeof raw === "string" && /^\{[a-z0-9-]+\}$/.test(raw)) return `var(--cirth-${raw.slice(1, -1)})`;
		return null;
	};

	return { color, length, number, rule, css: (/** @type {string} */ name) => unrepresented[name]?.css ?? null };
};

// Surface levels, lowest first. `surface` is the inherited current
// surface and not a level of its own, so it is left out.
const levels = [
	{ name: "Recessed", token: "surface-recessed" },
	{ name: "Canvas", token: "canvas" },
	{ name: "Raised", token: "surface-raised" },
	{ name: "Overlay", token: "surface-overlay" },
];

const edges = [
	{ name: "Separator", token: "muted-border-color", job: "Divides content inside a surface: table rows, a card's bands, a rule" },
	{ name: "Container", token: "card-border-color", job: "Bounds a surface: a card, a popover, a dropdown list" },
	{ name: "Control", token: "form-element-border-color", job: "Bounds something you operate: a field, a checkbox, a select" },
];

const inks = [
	{ name: "Strong", token: "ink-strong", job: "Headings" },
	{ name: "Ink", token: "ink", job: "Body text and code" },
	{ name: "Secondary", token: "secondary-text", job: "Secondary actions, supporting prose" },
	{ name: "Muted", token: "muted-color", job: "Metadata, captions, placeholders" },
	{ name: "Accent text", token: "primary-text", job: "Links and the current position" },
];

const statuses = ["error", "success", "warning"];

/**
 * Everything the two pages quote, per scheme, or null when dist/ has not
 * been built (a docs-only run), in which case the pages print the token
 * names without measurements.
 *
 * @param {string} root the repository root
 */
const measuredTheme = (root) => {
	const schemes = /** @type {const} */ (["light", "dark"]);
	const read = schemes.map((scheme) => readScheme(root, scheme));
	if (read.some((scheme) => scheme === null)) return null;
	const [light, dark] = /** @type {NonNullable<ReturnType<typeof readScheme>>[]} */ (read);

	/** @param {(scheme: NonNullable<ReturnType<typeof readScheme>>) => any} pick */
	const both = (pick) => ({ light: pick(light), dark: pick(dark) });

	/** @param {NonNullable<ReturnType<typeof readScheme>>} scheme @param {string} token */
	const worstOnLevels = (scheme, token) => {
		const foreground = scheme.color(token);
		if (!foreground) return null;
		const ratios = levels.map((level) => {
			const background = scheme.color(level.token);
			return background ? contrast(foreground, background) : Number.POSITIVE_INFINITY;
		});
		return Math.min(...ratios);
	};

	const spacing = light.length("spacing");
	const flow = ["line", "element", "group", "section", "chapter"].map((step) => ({
		name: step,
		token: `--cirth-flow-${step}`,
		px: light.length(`flow-${step}`),
		multiple: spacing ? round((light.length(`flow-${step}`) ?? 0) / spacing, 2) : null,
	}));

	const tracking = light.number("tracking-optical");
	/** @param {number} size */
	const trackingAt = (size) => (tracking === null ? null : round((tracking * (16 - size)) / size, 3));
	// Signed as a reader expects it: "+0.006em", "0", "−0.019em".
	/** @param {number | null} em */
	const signed = (em) => (em === null ? "n/a" : em === 0 ? "0" : `${em > 0 ? "+" : "\u2212"}${Math.abs(em)}em`);

	return {
		levels: levels.map((level) => ({
			...level,
			...both((scheme) => ({ ...scheme.color(level.token), rule: scheme.rule(level.token) })),
		})),
		edges: edges.map((edge) => ({
			...edge,
			...both((scheme) => ({
				...scheme.color(edge.token),
				rule: scheme.rule(edge.token),
				onCanvas: contrast(
					/** @type {Color} */ (scheme.color(edge.token)),
					/** @type {Color} */ (scheme.color("canvas")),
				),
				worst: worstOnLevels(scheme, edge.token),
			})),
		})),
		inks: inks.map((ink) => ({
			...ink,
			...both((scheme) => ({ ...scheme.color(ink.token), worst: worstOnLevels(scheme, ink.token) })),
		})),
		accent: {
			hue: light.color("primary")?.h ?? null,
			...both((scheme) => ({
				primary: scheme.color("primary"),
				text: scheme.color("primary-text"),
				surface: scheme.color("primary-surface"),
				onSurface: scheme.color("primary-on-surface"),
				label: contrast(
					/** @type {Color} */ (scheme.color("primary-on-surface")),
					/** @type {Color} */ (scheme.color("primary-surface")),
				),
				textWorst: worstOnLevels(scheme, "primary-text"),
				focusWorst: worstOnLevels(scheme, "primary-focus"),
			})),
		},
		statuses: statuses.map((status) => ({
			name: status,
			hue: light.color(status)?.h ?? null,
			...both((scheme) => ({
				text: scheme.color(`${status}-text`),
				border: scheme.color(`${status}-border`),
				surface: scheme.color(`${status}-surface`),
				textWorst: worstOnLevels(scheme, `${status}-text`),
				borderWorst: worstOnLevels(scheme, `${status}-border`),
			})),
		})),
		neutralHue: light.color("ink")?.h ?? null,
		canvasHue: both((scheme) => scheme.color("canvas")?.h ?? null),
		flow,
		spacing,
		tracking: {
			coefficient: tracking,
			at: [13, 16, 28, 40, 64].map((size) => ({ size, em: trackingAt(size), label: signed(trackingAt(size)) })),
		},
		type: {
			headingWeight: light.number("heading-font-weight"),
			titleWeight: light.number("title-font-weight"),
			labelWeight: light.number("form-label-font-weight"),
			labelSize: light.length("label-font-size"),
			metaSize: light.length("meta-font-size"),
			bodySize: light.length("font-size-md"),
			displaySize: light.css("display-font-size"),
			leading: {
				tight: light.number("line-height-tight"),
				snug: light.number("line-height-snug"),
				normal: light.number("line-height-normal"),
				relaxed: light.number("line-height-relaxed"),
			},
		},
	};
};

module.exports = { contrast, measuredTheme };
