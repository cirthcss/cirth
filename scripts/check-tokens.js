const fs = require("node:fs");
const path = require("node:path");
const { chromium, firefox, webkit } = require("playwright");

const { tokenSchemes } = require("./lib/dist-manifest");
const { EXTENSION, readSchemes } = require("./lib/tokens");

// The DTCG token export (gh#93), checked against the stylesheet it claims
// to describe.
//
// Two halves. The first is structural and needs no browser: every file is
// valid DTCG as far as this export uses it, every alias lands on a token
// of the same type, and every custom property the theme roots declare is
// either exported or listed as unrepresentable, so nothing is dropped.
//
// The second is the one that matters. Most colour tokens are computed by
// the browser — color-mix(), relative colours — and the export resolves
// them itself. So each exported colour is compared with what Chromium,
// Firefox and WebKit compute for the same token on dist/cirth.css in the
// same scheme. A resolver that is subtly wrong about hue interpolation or
// premultiplied alpha produces plausible JSON; only this catches it.

const projectRoot = path.join(__dirname, "..");
const distFolder = path.join(projectRoot, "dist");

// Oklab distance, well under a just-noticeable difference (≈0.02) and
// above the export's four-decimal rounding and engines' float32 maths.
const COLOR_TOLERANCE = 0.002;
const ALPHA_TOLERANCE = 0.005;

const TYPES = new Set([
	"color",
	"dimension",
	"fontFamily",
	"fontWeight",
	"duration",
	"cubicBezier",
	"number",
	"shadow",
]);

/** @type {string[]} */
const failures = [];

/** @param {string} message */
const fail = (message) => {
	failures.push(message);
};

/**
 * @typedef {{ $type: string, $value: any, $extensions?: object }} Token
 * @typedef {Record<string, any>} TokenDocument
 */

/** @param {TokenDocument} document */
const tokensOf = (document) =>
	/** @type {[string, Token][]} */ (
		Object.entries(document).filter(([name]) => !name.startsWith("$"))
	);

/**
 * @param {TokenDocument} document
 * @param {string} name
 * @returns {Token}
 */
const resolveAlias = (document, name) => {
	/** @type {Token} */
	let token = document[name];
	const seen = new Set([name]);
	while (typeof token.$value === "string" && /^\{.+\}$/.test(token.$value)) {
		const target = token.$value.slice(1, -1);
		if (seen.has(target)) throw new Error(`alias cycle at ${name}`);
		seen.add(target);
		token = document[target];
	}
	return token;
};

// --- Structure ----------------------------------------------------------

const css = fs.readFileSync(path.join(distFolder, "cirth.css"), "utf8");
const declared = readSchemes(css);

/** @type {Record<string, TokenDocument>} */
const documents = {};

for (const scheme of tokenSchemes) {
	const file = `tokens/${scheme}.tokens.json`;
	const filePath = path.join(distFolder, file);
	if (!fs.existsSync(filePath)) {
		fail(`dist/${file}: missing — run \`npm run build\` first.`);
		continue;
	}
	/** @type {TokenDocument} */
	const document = JSON.parse(fs.readFileSync(filePath, "utf8"));
	documents[scheme] = document;
	const meta = document.$extensions?.[EXTENSION];

	if (meta?.scheme !== scheme) fail(`dist/${file}: $extensions says scheme ${meta?.scheme}`);

	for (const [name, token] of tokensOf(document)) {
		if (/[{}.$]/.test(name)) fail(`dist/${file}: ${name} is not a valid DTCG token name`);
		if (!TYPES.has(token.$type)) fail(`dist/${file}: ${name} has $type ${token.$type}`);
		if (token.$value === undefined) fail(`dist/${file}: ${name} has no $value`);

		for (const reference of JSON.stringify(token.$value).match(/\{[^{}"]+\}/g) ?? []) {
			const target = document[reference.slice(1, -1)];
			if (!target) {
				fail(`dist/${file}: ${name} refers to ${reference}, which is not exported`);
			} else if (token.$value === reference && target.$type !== token.$type) {
				fail(`dist/${file}: ${name} is ${token.$type} but aliases a ${target.$type}`);
			}
		}
	}

	// Every root custom property is accounted for, exactly once.
	const exported = new Set(tokensOf(document).map(([name]) => name));
	const unrepresented = new Set(Object.keys(meta?.unrepresented ?? {}));
	for (const name of declared[scheme].keys()) {
		if (!exported.has(name) && !unrepresented.has(name)) {
			fail(`dist/${file}: --cirth-${name} is declared but neither exported nor listed`);
		}
		if (exported.has(name) && unrepresented.has(name)) {
			fail(`dist/${file}: --cirth-${name} is both exported and listed as unrepresented`);
		}
	}
	for (const name of [...exported, ...unrepresented]) {
		if (!declared[scheme].has(name)) fail(`dist/${file}: ${name} is not declared in dist/cirth.css`);
	}
}

// --- Resolved colours against three engines -----------------------------

/**
 * A colour as getComputedStyle serialises it, as Oklab plus alpha.
 *
 * @param {string} value
 * @returns {{ l: number, a: number, b: number, alpha: number }}
 */
const parseComputed = (value) => {
	const match = value.match(/^(oklch|oklab|rgba?|color)\((.*)\)$/);
	if (!match) throw new Error(`unrecognised computed colour: ${value}`);
	let [, kind, body] = match;
	/** @type {string[]} */
	let parts;
	let alpha = 1;
	if (kind === "color") {
		const [space, ...rest] = body.trim().split(/\s+/);
		if (space !== "srgb") throw new Error(`unrecognised computed colour: ${value}`);
		kind = "rgb";
		body = rest.join(" ");
	}
	const [channels, alphaPart] = body.split("/");
	parts = channels.trim().split(/[\s,]+/);
	if (alphaPart !== undefined) alpha = Number.parseFloat(alphaPart);
	if (kind.startsWith("rgb") && parts.length === 4) alpha = Number.parseFloat(parts.pop() ?? "1");
	/** @param {string} part */
	const number = (part) => (part === "none" ? 0 : Number.parseFloat(part));

	if (kind === "oklch") {
		const [l, c, h] = parts.map(number);
		const radians = (h * Math.PI) / 180;
		return { l: parts[0].endsWith("%") ? l / 100 : l, a: c * Math.cos(radians), b: c * Math.sin(radians), alpha };
	}
	if (kind === "oklab") {
		const [l, a, b] = parts.map(number);
		return { l: parts[0].endsWith("%") ? l / 100 : l, a, b, alpha };
	}
	// rgb(): 0..255 unless it came from color(srgb), which is 0..1.
	const scale = match[1] === "color" ? 1 : 255;
	const [r, g, b] = parts.map((part) => {
		const channel = number(part) / scale;
		return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
	});
	const long = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
	const medium = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
	const short = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
	return {
		l: 0.2104542553 * long + 0.793617785 * medium - 0.0040720468 * short,
		a: 1.9779984951 * long - 2.428592205 * medium + 0.4505937099 * short,
		b: 0.0259040371 * long + 0.7827717662 * medium - 0.808675766 * short,
		alpha,
	};
};

/** @param {{ components: (number | "none")[], alpha: number }} value */
const exportedOklab = ({ components, alpha }) => {
	const [l, c, h] = components.map((part) => (part === "none" ? 0 : part));
	const radians = (h * Math.PI) / 180;
	return { l, a: c * Math.cos(radians), b: c * Math.sin(radians), alpha };
};

const main = async () => {
	/** @type {Record<string, [string, Token][]>} */
	const colorTokens = {};
	for (const [scheme, document] of Object.entries(documents)) {
		colorTokens[scheme] = tokensOf(document)
			.map(([name]) => /** @type {[string, Token]} */ ([name, resolveAlias(document, name)]))
			.filter(([, token]) => token.$type === "color");
	}

	let compared = 0;
	for (const engine of [chromium, firefox, webkit]) {
		const browser = await engine.launch();
		try {
			const page = await browser.newPage();
			await page.setContent(`<!doctype html><html><head><style>${css}</style></head><body><i id="probe">x</i></body></html>`);
			const version = browser.version();

			for (const [scheme, tokens] of Object.entries(colorTokens)) {
				const computed = await page.evaluate(
					([theme, names]) => {
						document.documentElement.dataset.theme = theme;
						const probe = /** @type {HTMLElement} */ (document.getElementById("probe"));
						return names.map((name) => {
							probe.style.color = `var(--cirth-${name})`;
							return getComputedStyle(probe).color;
						});
					},
					/** @type {[string, string[]]} */ ([scheme, tokens.map(([name]) => name)]),
				);

				tokens.forEach(([name, token], index) => {
					compared += 1;
					let actual;
					try {
						actual = parseComputed(computed[index]);
					} catch (error) {
						fail(`${engine.name()} ${version}, ${scheme}: ${name}: ${/** @type {Error} */ (error).message}`);
						return;
					}
					const expected = exportedOklab(token.$value);
					const distance = Math.hypot(expected.l - actual.l, expected.a - actual.a, expected.b - actual.b);
					if (distance > COLOR_TOLERANCE || Math.abs(expected.alpha - actual.alpha) > ALPHA_TOLERANCE) {
						fail(
							`${engine.name()} ${version}, ${scheme}: ${name} exports ` +
								`${JSON.stringify(token.$value.components)} / ${token.$value.alpha} ` +
								`but the engine computes ${computed[index]} (ΔOklab ${distance.toFixed(4)})`,
						);
					}
				});
			}
			console.log(`[@cirthcss/cirth] check-tokens: compared against ${engine.name()} ${version}`);
		} finally {
			await browser.close();
		}
	}

	if (failures.length > 0) {
		for (const failure of failures) console.error(`✗ ${failure}`);
		console.error(`\ncheck-tokens: ${failures.length} problem(s) in dist/tokens/.`);
		process.exit(1);
	}

	const counts = Object.entries(documents)
		.map(([scheme, document]) => `${scheme} ${tokensOf(document).length}`)
		.join(", ");
	console.log(
		`✓ check-tokens: ${counts} tokens, every root custom property accounted for; ` +
			`${compared} colour comparisons (every colour token, both schemes, ` +
			`three engines) within ΔOklab ${COLOR_TOLERANCE}.`,
	);
};

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
