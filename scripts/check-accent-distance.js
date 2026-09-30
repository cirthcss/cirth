const assert = require("node:assert/strict");
const path = require("node:path");
const postcss = require("postcss");
const sass = require("sass-embedded");

const { srgbToOklab } = require("./lib/color");
const { listPresetNames, presetsSourceDir } = require("./lib/presets");

// The accent and the error colour have to stay apart.
//
//   node scripts/check-accent-distance.js
//
// A destructive action and a primary one share a decision surface, and
// the palette is what keeps them from reading as the same thing. The
// shipped accent sits 62deg of OKLCh hue from the error input. When the
// accent is replaced (a preset, a retheme, a new brand colour), nothing
// else in the build notices if it lands on the error's hue, so this does.
//
// What it reads: --cirth-primary and --cirth-error as the stylesheet
// declares them, compiled from source, for the default theme and every
// preset stacked on it, in both schemes, with and without
// prefers-contrast: more. Each pair has to be at least MIN_HUE_DISTANCE
// apart on the hue circle.
//
// What it does not decide: whether two colours are distinguishable in
// general. Hue is only meaningful when both colours carry chroma, so a
// near-neutral accent (below MIN_CHROMA) is reported and not judged; and
// lightness, which is what keeps the two fills apart when red/green
// discrimination is reduced, is asserted on painted fills by
// tests/framework-specimen.spec.js, not here. The floor is a tripwire for
// the hue, not a perceptual guarantee.

const MIN_HUE_DISTANCE = 20;
const MIN_CHROMA = 0.04;

const projectRoot = path.join(__dirname, "..");

/** @typedef {{ l: number, c: number, h: number }} Oklch */
/** @typedef {{ light?: string, dark?: string }} Pair */
/** @typedef {Record<string, Pair>} Inputs */

/** @param {string} source */
const compile = (source) =>
	sass.compile(source, { sourceMap: false, style: "expanded" }).css;

/**
 * Splits `light-dark(a, b)` at its top-level comma.
 *
 * @param {string} value
 * @returns {[string, string] | null}
 */
const splitLightDark = (value) => {
	const match = /^light-dark\((.*)\)$/s.exec(value.trim());
	if (!match) return null;
	const body = match[1];
	let depth = 0;
	for (let index = 0; index < body.length; index++) {
		const char = body[index];
		if (char === "(") depth++;
		else if (char === ")") depth--;
		else if (char === "," && depth === 0) {
			return [body.slice(0, index).trim(), body.slice(index + 1).trim()];
		}
	}
	return null;
};

/**
 * An oklch() literal, or a six-digit hex one: a preset that transcribes
 * another design system (material.scss) keeps that system's own notation.
 *
 * @param {string} value
 * @returns {Oklch}
 */
const parseOklch = (value) => {
	const hex = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(value.trim());
	if (hex) {
		const [r, g, b] = hex.slice(1).map((channel) => Number.parseInt(channel, 16) / 255);
		const { lightness, a, b: blue } = srgbToOklab({ r, g, b, alpha: 1 });
		const hue = ((Math.atan2(blue, a) * 180) / Math.PI + 360) % 360;
		return { l: lightness, c: Math.hypot(a, blue), h: Math.round(hue * 10) / 10 };
	}
	const match = /^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)(?:deg)?\s*\)$/.exec(
		value.trim(),
	);
	if (!match) {
		throw new Error(`check-accent-distance: not an oklch() or hex literal: ${value}`);
	}
	const lightness = Number.parseFloat(match[1]);
	return {
		l: match[2] === "%" ? lightness / 100 : lightness,
		c: Number.parseFloat(match[3]),
		h: Number.parseFloat(match[4]),
	};
};

/**
 * The rules and at-rules a declaration sits inside, innermost first.
 *
 * @param {import("postcss").Declaration} decl
 * @returns {(import("postcss").Rule | import("postcss").AtRule)[]}
 */
const ancestors = (decl) => {
	/** @type {(import("postcss").Rule | import("postcss").AtRule)[]} */
	const chain = [];
	/** @type {import("postcss").Node | undefined} */
	let node = decl.parent;
	while (node) {
		if (node.type === "rule" || node.type === "atrule") {
			chain.push(/** @type {import("postcss").Rule | import("postcss").AtRule} */ (node));
		}
		node = node.parent;
	}
	return chain;
};

/**
 * Which scheme a declaration outside light-dark() applies to. A rule that
 * selects no scheme at all (a preset's `:root, :host, .cirth`) applies to
 * both: a single accent for both schemes is a value, not a light one.
 *
 * @param {import("postcss").Declaration} decl
 * @returns {"light" | "dark" | "both"}
 */
const schemeOf = (decl) => {
	const chain = ancestors(decl);
	const chooses = chain.some(
		(node) =>
			(node.type === "rule" && /data-theme/.test(node.selector)) ||
			(node.type === "atrule" && /prefers-color-scheme/.test(node.params)),
	);
	if (!chooses) return "both";
	for (const node of chain) {
		// The light block names the dark attribute too, inside :not(), which
		// is exactly how it excludes it. Only a positive match means dark.
		if (
			node.type === "rule" &&
			/data-theme="dark"/.test(
				node.selector.replace(/:not\(\[data-theme(?:="dark")?\]\)/g, ""),
			)
		) {
			return "dark";
		}
		if (node.type === "atrule" && /prefers-color-scheme:\s*dark/.test(node.params)) {
			return "dark";
		}
	}
	return "light";
};

/** @param {import("postcss").Declaration} decl */
const underMoreContrast = (decl) =>
	ancestors(decl).some(
		(node) => node.type === "atrule" && /prefers-contrast:\s*more/.test(node.params),
	);

const NAMES = ["--cirth-primary", "--cirth-error"];

/**
 * Applies one stylesheet's declarations of the two inputs on top of
 * `base`, for one contrast mode.
 *
 * @param {string} css
 * @param {{ primary: Pair, error: Pair }} base
 * @param {boolean} moreContrast
 */
const applyInputs = (css, base, moreContrast) => {
	const state = {
		primary: { ...base.primary },
		error: { ...base.error },
	};
	/** @type {import("postcss").Declaration[]} */
	const ordered = [];
	postcss.parse(css).walkDecls((decl) => {
		if (NAMES.includes(decl.prop)) ordered.push(decl);
	});
	// Base declarations first, then the contrast pass, as the cascade does.
	const passes = moreContrast
		? [ordered.filter((d) => !underMoreContrast(d)), ordered.filter(underMoreContrast)]
		: [ordered.filter((d) => !underMoreContrast(d))];
	for (const pass of passes) {
		for (const decl of pass) {
			const key = decl.prop === "--cirth-primary" ? "primary" : "error";
			const pair = splitLightDark(decl.value);
			if (pair) {
				state[key] = { light: pair[0], dark: pair[1] };
			} else {
				const scheme = schemeOf(decl);
				state[key] =
					scheme === "both"
						? { light: decl.value, dark: decl.value }
						: { ...state[key], [scheme]: decl.value };
			}
		}
	}
	return state;
};

/** @param {number} a @param {number} b */
const hueDistance = (a, b) => {
	const delta = Math.abs(a - b) % 360;
	return delta > 180 ? 360 - delta : delta;
};

/**
 * @param {Oklch} accent
 * @param {Oklch} error
 * @returns {{ verdict: "pass" | "fail" | "neutral", distance: number }}
 */
const judge = (accent, error) => {
	const distance = hueDistance(accent.h, error.h);
	if (accent.c < MIN_CHROMA || error.c < MIN_CHROMA) {
		return { verdict: "neutral", distance };
	}
	return { verdict: distance >= MIN_HUE_DISTANCE ? "pass" : "fail", distance };
};

// --- The rule proves it can fail --------------------------------------
//
// A tripwire that never fires looks exactly like one that works. These
// cases are synthetic and fixed, so the check is known to catch an accent
// on the error's hue, to measure across the 0/360 seam, and to leave a
// neutral accent alone.

const controls = () => {
	const error = { l: 0.44, c: 0.151, h: 22 };
	assert.equal(judge({ l: 0.5, c: 0.12, h: 30 }, error).verdict, "fail", "an accent 8deg from the error must fail");
	assert.equal(judge({ l: 0.5, c: 0.12, h: 42 }, error).verdict, "pass", "an accent 20deg from the error passes at the floor");
	assert.equal(judge({ l: 0.5, c: 0.12, h: 10 }, { l: 0.44, c: 0.15, h: 355 }).verdict, "fail", "15deg across the 0/360 seam must fail");
	assert.equal(hueDistance(350, 10), 20, "the hue circle wraps");
	assert.equal(judge({ l: 0.5, c: 0.01, h: 24 }, error).verdict, "neutral", "a near-neutral accent has no hue to judge");
	assert.ok(Math.abs(parseOklch("#ff0000").h - 29.2) < 0.1, "a hex literal reads as its OKLCh hue");

	// And the reading of the stylesheet: a pair at the root, then a contrast
	// pass that restates one scheme on its own selector.
	const sheet = `
		:root { --cirth-primary: light-dark(oklch(50% 0.1 30deg), oklch(70% 0.1 31deg)); --cirth-error: light-dark(oklch(44% 0.15 22deg), oklch(74% 0.13 22deg)); }
		@media (prefers-contrast: more) {
			:root:where(:not([data-theme="dark"])) { --cirth-primary: oklch(40% 0.1 200deg); }
			:where([data-theme="dark"]) { --cirth-primary: oklch(80% 0.1 201deg); }
		}`;
	const plainRead = applyInputs(sheet, { primary: {}, error: {} }, false);
	assert.equal(parseOklch(/** @type {string} */ (plainRead.primary.dark)).h, 31, "light-dark() splits into two schemes");
	const moreRead = applyInputs(sheet, { primary: {}, error: {} }, true);
	assert.equal(parseOklch(/** @type {string} */ (moreRead.primary.light)).h, 200, "the contrast pass overrides the light scheme");
	assert.equal(parseOklch(/** @type {string} */ (moreRead.primary.dark)).h, 201, "and the dark one, by its selector");
	assert.equal(parseOklch(/** @type {string} */ (moreRead.error.dark)).h, 22, "an input the pass does not restate is inherited");
	const single = applyInputs(":root, :host, .cirth { --cirth-primary: #0050ef; }", plainRead, false);
	assert.equal(single.primary.dark, "#0050ef", "one value on the theme roots holds in both schemes");
	assert.equal(
		judge(parseOklch(/** @type {string} */ (plainRead.primary.light)), parseOklch(/** @type {string} */ (plainRead.error.light))).verdict,
		"fail",
		"a stylesheet with its accent 8deg from the error fails end to end",
	);
};

// --- The shipped themes ----------------------------------------------

const main = () => {
	controls();

	const baseCss = compile(path.join(projectRoot, "src/cirth.scss"));
	const empty = { primary: {}, error: {} };
	/** @type {{ name: string, css: string | null }[]} */
	const themes = [{ name: "default", css: null }];
	themes.push(
		...listPresetNames().map((name) => ({
			name,
			css: compile(path.join(presetsSourceDir, `${name}.scss`)),
		})),
	);

	/** @type {string[]} */
	const failures = [];
	/** @type {string[]} */
	const rows = [];

	for (const theme of themes) {
		for (const moreContrast of [false, true]) {
			let state = applyInputs(baseCss, empty, moreContrast);
			if (theme.css) state = applyInputs(theme.css, state, moreContrast);
			for (const scheme of /** @type {const} */ (["light", "dark"])) {
				const accentValue = state.primary[scheme];
				const errorValue = state.error[scheme];
				if (!accentValue || !errorValue) {
					failures.push(`${theme.name}: no ${scheme} value for ${accentValue ? "--cirth-error" : "--cirth-primary"}`);
					continue;
				}
				const accent = parseOklch(accentValue);
				const error = parseOklch(errorValue);
				const { verdict, distance } = judge(accent, error);
				const label = `${theme.name.padEnd(9)} ${scheme.padEnd(5)} ${moreContrast ? "more " : "     "}`;
				rows.push(
					`  ${verdict === "fail" ? "✗" : verdict === "neutral" ? "·" : "✓"}  ${label} accent ${accent.h}deg  error ${error.h}deg  distance ${distance.toFixed(1)}deg` +
						(verdict === "neutral" ? " (accent chroma below the floor: not judged)" : ""),
				);
				if (verdict === "fail") {
					failures.push(
						`${theme.name} ${scheme}${moreContrast ? " (prefers-contrast: more)" : ""}: the accent sits ${distance.toFixed(1)}deg from the error hue, under the ${MIN_HUE_DISTANCE}deg floor. Move the accent, or move --cirth-error with it (see docs/src/pages/colors.md, Status colours).`,
					);
				}
			}
		}
	}

	console.log(rows.join("\n"));
	if (failures.length) {
		console.error(`\n[@cirthcss/cirth] check-accent-distance failed:\n  ${failures.join("\n  ")}`);
		process.exit(1);
	}
	console.log(
		`[@cirthcss/cirth] check-accent-distance: ${rows.length} accent/error pairs at least ${MIN_HUE_DISTANCE}deg apart; the controls fail, wrap and skip as they should.`,
	);
};

main();
