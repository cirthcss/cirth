// sRGB conversion and WCAG contrast math for the color values the theme
// actually ships.
//
// Every scheme token is an oklch() literal, and browsers hand those back
// from getComputedStyle unresolved — `color` on a paragraph reads as
// "oklch(0.353 0.021 264)", not as an rgb triple. A check that wants to
// assert a contrast ratio therefore has to do the conversion itself,
// which is what this module is for.
//
// Conversion follows the CSS Color 4 sample code (Oklab -> linear sRGB),
// and the ratio follows WCAG 2.x SC 1.4.3: (L1 + 0.05) / (L2 + 0.05) over
// relative luminance.

/**
 * A color as gamma-encoded sRGB channels in 0..1, plus its alpha.
 *
 * @typedef {{ r: number, g: number, b: number, alpha: number }} Color
 */

/** @param {number} value */
const clamp01 = (value) => Math.min(1, Math.max(0, value));

/** @param {number} value */
const toGamma = (value) =>
	value <= 0.0031308 ? 12.92 * value : 1.055 * value ** (1 / 2.4) - 0.055;

/** @param {number} value */
const toLinear = (value) =>
	value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;

/**
 * @param {number} lightness 0..1
 * @param {number} chroma
 * @param {number} hue degrees
 * @returns {{ r: number, g: number, b: number }}
 */
const oklchToSrgb = (lightness, chroma, hue) => {
	const radians = (hue * Math.PI) / 180;
	const a = chroma * Math.cos(radians);
	const b = chroma * Math.sin(radians);

	const long = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
	const medium = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
	const short = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;

	return {
		r: toGamma(
			clamp01(4.0767416621 * long - 3.3077115913 * medium + 0.2309699292 * short),
		),
		g: toGamma(
			clamp01(
				-1.2684380046 * long + 2.6097574011 * medium - 0.3413193965 * short,
			),
		),
		b: toGamma(
			clamp01(
				-0.0041960863 * long - 0.7034186147 * medium + 1.707614701 * short,
			),
		),
	};
};

/** @param {string} token @param {number} [scale] */
const number = (token, scale = 1) =>
	token.endsWith("%") ? Number.parseFloat(token) / 100 : Number.parseFloat(token) / scale;

/**
 * Parses the color notations getComputedStyle actually returns for Cirth's
 * tokens: oklch() (the source notation, preserved by every engine we test)
 * and rgb()/rgba() (what engines resolve hex and named colors to).
 *
 * @param {string} value
 * @returns {Color}
 */
const parseColor = (value) => {
	const input = value.trim().toLowerCase();

	if (input === "transparent") {
		return { r: 0, g: 0, b: 0, alpha: 0 };
	}

	const [body, alphaPart] = input
		.replace(/^[a-z]+\(/, "")
		.replace(/\)$/, "")
		.split("/");
	const parts = body.trim().split(/[\s,]+/).filter(Boolean);
	const alpha = alphaPart === undefined ? 1 : number(alphaPart.trim());

	if (input.startsWith("oklch(")) {
		const [lightness, chroma, hue] = parts;
		return {
			...oklchToSrgb(
				number(lightness),
				Number.parseFloat(chroma),
				Number.parseFloat(hue),
			),
			alpha,
		};
	}

	if (input.startsWith("rgb(") || input.startsWith("rgba(")) {
		const [red, green, blue, legacyAlpha] = parts;
		return {
			r: number(red, 255),
			g: number(green, 255),
			b: number(blue, 255),
			alpha: legacyAlpha === undefined ? alpha : number(legacyAlpha),
		};
	}

	throw new Error(`color: unsupported notation ${value}`);
};

/**
 * Composites a translucent color over an opaque backdrop — what the eye
 * is actually judging when a focus ring carries an alpha.
 *
 * @param {Color} color
 * @param {Color} backdrop
 * @returns {Color}
 */
const over = (color, backdrop) => ({
	r: color.r * color.alpha + backdrop.r * (1 - color.alpha),
	g: color.g * color.alpha + backdrop.g * (1 - color.alpha),
	b: color.b * color.alpha + backdrop.b * (1 - color.alpha),
	alpha: 1,
});

/** @param {Color} color */
const luminance = (color) =>
	0.2126 * toLinear(color.r) +
	0.7152 * toLinear(color.g) +
	0.0722 * toLinear(color.b);

/**
 * WCAG contrast ratio between a foreground and an opaque background. A
 * translucent foreground is composited over that background first.
 *
 * @param {string} foreground
 * @param {string} background
 * @returns {number}
 */
const contrastRatio = (foreground, background) => {
	const back = parseColor(background);
	const front = over(parseColor(foreground), back);
	const [lighter, darker] = [luminance(front), luminance(back)].sort(
		(a, b) => b - a,
	);

	return (lighter + 0.05) / (darker + 0.05);
};

module.exports = { contrastRatio, luminance, over, parseColor };
