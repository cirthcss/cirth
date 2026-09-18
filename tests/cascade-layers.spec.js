const fs = require("node:fs");
const path = require("node:path");
const postcss = require("postcss");
const { expect, test } = require("@playwright/test");
const {
	layerName,
	presetBuilds,
	rootBuilds,
	scopeClass,
} = require("../scripts/lib/dist-manifest");
const { listPresetNames } = require("../scripts/lib/presets");
const { setContent } = require("./helpers/render");

// gh#124 — every stylesheet Cirth ships puts all of its rules in one
// cascade layer, `@layer cirth` (specs/cascade-layer.md). The contract is
// about the cascade, so it is proved in the cascade: rendered, in each
// engine, against the built files in dist/.
//
// Where a case claims that a rule wins *because of the layer*, it first
// proves the rule would have lost without it. The control is the same
// stylesheet with the layer block unwrapped — identical rules, identical
// order — so the only variable between the two renders is the layer.

const projectRoot = path.join(__dirname, "..");

/** @param {string} file */
const read = (file) => {
	const stylesheet = path.join(projectRoot, file);

	if (!fs.existsSync(stylesheet)) {
		throw new Error(
			`cascade-layers.spec: ${file} not found: run \`npm run build\` first.`,
		);
	}

	return fs.readFileSync(stylesheet, "utf8");
};

/**
 * The stylesheet as it was before gh#124: the same rules, lifted out of
 * the layer block.
 *
 * @param {string} css
 */
const unlayered = (css) => {
	const root = postcss.parse(css);
	root.walkAtRules("layer", (atRule) => {
		if (atRule.parent?.type === "root" && atRule.nodes) {
			atRule.replaceWith(atRule.nodes);
		}
	});
	return root.toString();
};

// The four screen builds. Print sheets are covered at the end.
const builds = rootBuilds
	.filter(({ name }) => !name.includes(".print"))
	.map(({ classless, name, scoped }) => ({
		classless,
		css: read(`dist/${name}.css`),
		name,
		scoped,
	}));

const presets = listPresetNames().map((name) => ({
	css: read(`dist/presets/${name}.css`),
	name,
}));

/**
 * @param {{ scoped: boolean }} build
 * @param {string} markup
 */
const inScope = (build, markup) =>
	build.scoped ? `<div class="${scopeClass}">${markup}</div>` : markup;

/**
 * @param {import("@playwright/test").Page} page
 * @param {string} id
 * @param {string} property
 */
const styleOf = (page, id, property) =>
	page.evaluate(
		([elementId, name]) => {
			const element = document.getElementById(elementId);
			if (!element) {
				throw new Error(`missing #${elementId}`);
			}
			return getComputedStyle(element).getPropertyValue(name).trim();
		},
		/** @type {[string, string]} */ ([id, property]),
	);

const ink = "rgb(1, 2, 3)";

// --- The artifacts, as a browser parses them ---------------------------

// check-dist.js asserts the shape of every file with a CSS parser. This
// asks each engine: one top-level rule, a CSSLayerBlockRule named cirth,
// and everything else inside it.
const allArtifacts = [
	...rootBuilds.map(({ name }) => `dist/${name}.min.css`),
	...presetBuilds().map(({ name }) => `dist/${name}.min.css`),
];

test("every built file parses as one cirth layer block", async ({ page }) => {
	for (const file of allArtifacts) {
		await setContent(page, `<style>${read(file)}</style>`);
		const shape = await page.evaluate(() => {
			const rules = [...document.styleSheets[0].cssRules];
			return rules.map((rule) => ({
				inner: rule instanceof CSSGroupingRule ? rule.cssRules.length : 0,
				kind: rule.constructor.name,
				name: rule instanceof CSSLayerBlockRule ? rule.name : null,
			}));
		});

		expect(shape, file).toHaveLength(1);
		expect(shape[0], file).toMatchObject({
			kind: "CSSLayerBlockRule",
			name: layerName,
		});
		expect(shape[0].inner, `${file} has rules inside the layer`).toBeGreaterThan(
			0,
		);
	}
});

// --- Unlayered author CSS wins, without specificity escalation ---------

// Each case is one declaration an author would plausibly write, with a
// selector no heavier than a type, a single class, or `html`. Cirth styles
// the same property with a selector that outweighs it, which the unlayered
// control proves case by case. `only` restricts a case to the builds whose
// markup it needs.
/**
 * @type {{
 *   name: string,
 *   markup: string,
 *   css: string,
 *   read: string,
 *   only?: (build: (typeof builds)[number]) => boolean,
 * }[]}
 */
const overrides = [
	{
		name: "a summary's ink",
		markup: `<details><summary id="target">More</summary><p>Body</p></details>`,
		css: `summary { color: ${ink}; }`,
		read: "color",
	},
	{
		name: "the accent, set on html rather than :root",
		markup: `<p><a id="target" href="#x">A link</a></p>`,
		css: `html { --cirth-primary: ${ink}; }`,
		read: "color",
		// A scoped wrapper declares the token on itself, which beats one it
		// would inherit from html at any layer — inheritance, not cascade.
		// The scoped equivalent is the preset/consumer case further down.
		only: (build) => !build.scoped,
	},
	{
		name: "a dropdown item",
		markup:
			`<details class="dropdown" open><summary>Menu</summary>` +
			`<ul><li><a id="target" href="#x">Item</a></li></ul></details>`,
		css: `.dropdown a { color: ${ink}; }`,
		read: "color",
		only: (build) => !build.classless,
	},
	{
		name: "a striped table's header cell",
		markup:
			`<table class="striped"><tbody>` +
			`<tr><th id="target">Head</th><td>Cell</td></tr></tbody></table>`,
		css: `th { background-color: ${ink}; }`,
		read: "background-color",
		only: (build) => !build.classless,
	},
	{
		name: "a secondary button's fill",
		markup: `<button id="target" class="secondary" type="button">Save</button>`,
		css: `.secondary { background-color: ${ink}; }`,
		read: "background-color",
		only: (build) => build.scoped && !build.classless,
	},
	{
		name: "a nav link's ink",
		markup: `<nav><ul><li><a id="target" href="#x">Home</a></li></ul></nav>`,
		css: `nav a { color: ${ink}; }`,
		read: "color",
		only: (build) => build.scoped,
	},
	{
		name: "a text field's border",
		markup: `<input id="target" type="text" aria-label="Name">`,
		css: `input { border-top-color: ${ink}; }`,
		read: "border-top-color",
		only: (build) => build.scoped,
	},
];

for (const build of builds) {
	for (const item of overrides.filter(({ only }) => !only || only(build))) {
		test(`${build.name}: ${item.name} yields to an unlayered rule`, async ({
			page,
		}) => {
			const markup = inScope(build, item.markup);

			// Control: the same rules unlayered, author CSS loaded *after*
			// them. Cirth wins, so the author's selector is the lighter one.
			await setContent(
				page,
				`<style>${unlayered(build.css)}</style><style>${item.css}</style>${markup}`,
			);
			expect(
				await styleOf(page, "target", item.read),
				"without the layer, Cirth's heavier selector wins",
			).not.toBe(ink);

			// As shipped, in either loading order.
			for (const [label, head] of [
				["after", `<style>${build.css}</style><style>${item.css}</style>`],
				["before", `<style>${item.css}</style><style>${build.css}</style>`],
			]) {
				await setContent(page, `${head}${markup}`);
				expect(
					await styleOf(page, "target", item.read),
					`author CSS loaded ${label} Cirth wins`,
				).toBe(ink);
			}
		});
	}
}

// --- Consumer layers sort against cirth, deterministically -------------

test.describe("a consumer's own layers", () => {
	const build = builds.find(({ name }) => name === "cirth");
	if (!build) throw new Error("no default build");

	const markup = `<details><summary id="target">More</summary></details>`;
	const app = `@layer app { summary { color: ${ink}; } }`;

	test("a layer first named after cirth wins", async ({ page }) => {
		await setContent(
			page,
			`<style>${build.css}</style><style>${app}</style>${markup}`,
		);
		expect(await styleOf(page, "target", "color")).toBe(ink);
	});

	test("an order statement written first fixes the order, wherever the blocks load", async ({
		page,
	}) => {
		// app before cirth: Cirth wins even though app's block loads last.
		await setContent(
			page,
			`<style>@layer app, ${layerName};</style>` +
				`<style>${build.css}</style><style>${app}</style>${markup}`,
		);
		expect(await styleOf(page, "target", "color")).not.toBe(ink);

		// cirth before app: app wins even though its block loads first.
		await setContent(
			page,
			`<style>@layer ${layerName}, app;</style>` +
				`<style>${app}</style><style>${build.css}</style>${markup}`,
		);
		expect(await styleOf(page, "target", "color")).toBe(ink);
	});
});

// --- Presets: same layer, after the build ------------------------------

// A preset is one file for every build, so it is checked against all four.
// The token is read where it is used — inside the wrapper, in a scoped
// build — so a preset that only reached :root would show the theme's value.
/**
 * @param {import("@playwright/test").Page} page
 * @param {(typeof builds)[number]} build
 * @param {string} head
 */
const accentOf = async (page, build, head) => {
	await setContent(
		page,
		`${head}${inScope(build, `<p><a id="target" href="#x">A link</a></p>`)}`,
	);
	return {
		link: await styleOf(page, "target", "color"),
		token: await styleOf(page, "target", "--cirth-primary"),
	};
};

for (const preset of presets) {
	for (const build of builds) {
		test(`${build.name} + ${preset.name}: the preset beats the theme and yields to the consumer`, async ({
			page,
		}) => {
			const theme = await accentOf(page, build, `<style>${build.css}</style>`);
			const reference = await accentOf(
				page,
				builds[0],
				`<style>${builds[0].css}</style><style>${preset.css}</style>`,
			);
			const withPreset = await accentOf(
				page,
				build,
				`<style>${build.css}</style><style>${preset.css}</style>`,
			);

			expect(withPreset.token, "the preset replaces the theme's accent").not.toBe(
				theme.token,
			);
			expect(
				withPreset,
				"and resolves exactly as it does on an unscoped page",
			).toEqual(reference);

			// Loaded before the build, the preset loses to it on source order —
			// the same order rule as before the layer, and still documented.
			const reversed = await accentOf(
				page,
				build,
				`<style>${preset.css}</style><style>${build.css}</style>`,
			);
			expect(reversed.token, "source order still decides inside the layer").toBe(
				theme.token,
			);

			// A consumer beats both, from anywhere in the document. The
			// selector is the one that declares the token in this build.
			const consumer = `<style>${build.scoped ? `.${scopeClass}` : ":root"} { --cirth-primary: ${ink}; }</style>`;
			for (const head of [
				`${consumer}<style>${build.css}</style><style>${preset.css}</style>`,
				`<style>${build.css}</style>${consumer}<style>${preset.css}</style>`,
				`<style>${build.css}</style><style>${preset.css}</style>${consumer}`,
			]) {
				expect((await accentOf(page, build, head)).link).toBe(ink);
			}
		});
	}
}

// --- Scoped builds: containment kept, host rules no longer outweighed --

for (const build of builds.filter(({ scoped }) => scoped)) {
	test.describe(`${build.name} in a host page`, () => {
		const host = `button { background-color: ${ink}; }`;
		const markup =
			`<button id="outside" type="button">Host</button>` +
			`<div class="${scopeClass}"><button id="inside" type="button">Widget</button></div>`;

		test("nothing outside the wrapper is styled", async ({ page }) => {
			await setContent(page, `<button id="bare" type="button">Bare</button>`);
			const bare = await page.evaluate(() => {
				const style = getComputedStyle(/** @type {Element} */ (document.getElementById("bare")));
				return [style.backgroundColor, style.borderRadius, style.paddingLeft];
			});

			await setContent(page, `<style>${build.css}</style>${markup}`);
			const outside = await page.evaluate(() => {
				const style = getComputedStyle(/** @type {Element} */ (document.getElementById("outside")));
				return [style.backgroundColor, style.borderRadius, style.paddingLeft];
			});

			expect(outside).toEqual(bare);
		});

		test("an unlayered host rule now wins inside the wrapper", async ({
			page,
		}) => {
			// Before gh#124 the `.cirth` prefix outweighed a host type
			// selector. That was never promised, and it no longer holds.
			await setContent(
				page,
				`<style>${unlayered(build.css)}</style><style>${host}</style>${markup}`,
			);
			expect(await styleOf(page, "inside", "background-color")).not.toBe(ink);

			await setContent(
				page,
				`<style>${build.css}</style><style>${host}</style>${markup}`,
			);
			expect(await styleOf(page, "inside", "background-color")).toBe(ink);
		});

		test("a host layer ordered before cirth gives the widget back", async ({
			page,
		}) => {
			await setContent(
				page,
				`<style>@layer host, ${layerName}; @layer host { ${host} }</style>` +
					`<style>${build.css}</style>${markup}`,
			);
			expect(await styleOf(page, "inside", "background-color")).not.toBe(ink);
			expect(
				await styleOf(page, "outside", "background-color"),
				"and the host keeps its own buttons",
			).toBe(ink);
		});

		test("a shadow root keeps host rules out altogether", async ({ page }) => {
			// The remedy when the host's CSS is not yours to layer. Host rules
			// do not cross the boundary; the widget's own unlayered CSS, inside
			// it, still beats Cirth.
			await setContent(page, `<style>${host}</style><div id="mount"></div>`);
			const [cirthOnly, customised] = await page.evaluate(
				([css, scope, tint]) => {
					/** @param {string} extra */
					const mount = (extra) => {
						const element = document.createElement("div");
						document.body.append(element);
						const root = element.attachShadow({ mode: "open" });
						root.innerHTML =
							`<style>${css}</style><style>${extra}</style>` +
							`<div class="${scope}"><button type="button">Widget</button><a href="#x">Link</a></div>`;
						const button = /** @type {Element} */ (root.querySelector("button"));
						const link = /** @type {Element} */ (root.querySelector("a"));
						return {
							button: getComputedStyle(button).backgroundColor,
							link: getComputedStyle(link).color,
						};
					};
					return [mount(""), mount(`a { color: ${tint}; }`)];
				},
				/** @type {[string, string, string]} */ ([build.css, scopeClass, ink]),
			);

			expect(cirthOnly.button).not.toBe(ink);
			expect(customised.link).toBe(ink);
		});
	});
}

// --- The gh#110 path: importing Cirth into a layer yourself ------------

// Served from one origin so the imported sheets stay readable through the
// CSSOM, which is how the nesting is observed rather than inferred.
test.describe("@import … layer(cirth), as gh#110 described it", () => {
	const origin = "https://cirth.test";
	const build = builds.find(({ name }) => name === "cirth");
	const plain = presets[0];
	if (!build || !plain) throw new Error("no default build or preset");

	/**
	 * @param {import("@playwright/test").Page} page
	 * @param {string} body
	 */
	const serve = async (page, body) => {
		await page.route(`${origin}/**`, (route) => {
			const url = new URL(route.request().url());
			const files = {
				"/cirth.css": build.css,
				"/preset.css": plain.css,
			};
			if (url.pathname in files) {
				return route.fulfill({
					body: files[/** @type {keyof typeof files} */ (url.pathname)],
					contentType: "text/css",
				});
			}
			return route.fulfill({
				body: `<!doctype html>${body}`,
				contentType: "text/html",
			});
		});
		await page.goto(`${origin}/`);
	};

	test("nests Cirth as cirth.cirth", async ({ page }) => {
		await serve(
			page,
			`<style>@import url("/cirth.css") layer(${layerName});</style>`,
		);
		const nesting = await page.evaluate(() => {
			const importRule = /** @type {CSSImportRule} */ (
				document.styleSheets[0].cssRules[0]
			);
			const inner = /** @type {CSSLayerBlockRule} */ (
				importRule.styleSheet?.cssRules[0]
			);
			return [importRule.layerName, inner?.name];
		});
		expect(nesting).toEqual([layerName, layerName]);
	});

	test("keeps every outcome the plain link gives", async ({ page }) => {
		const markup =
			`<details><summary id="target">More</summary></details>` +
			`<p><a id="link" href="#x">A link</a></p>`;

		// The accent the preset should produce, loaded the recommended way.
		await serve(
			page,
			`<link rel="stylesheet" href="/cirth.css"><link rel="stylesheet" href="/preset.css">${markup}`,
		);
		const expected = await styleOf(page, "link", "color");

		for (const head of [
			// Both imported into the layer: they share cirth.cirth.
			`<style>@import url("/cirth.css") layer(${layerName}); @import url("/preset.css") layer(${layerName});</style>`,
			// Only the build imported: the preset's own block lands directly
			// in cirth, which outranks the nested cirth.cirth.
			`<style>@import url("/cirth.css") layer(${layerName});</style><link rel="stylesheet" href="/preset.css">`,
		]) {
			await serve(page, `${head}<style>summary { color: ${ink}; }</style>${markup}`);
			expect(await styleOf(page, "link", "color"), head).toBe(expected);
			expect(await styleOf(page, "target", "color"), head).toBe(ink);
		}
	});
});

// --- Print sheets share the layer -------------------------------------

test("the print pass still outranks the build, and an author print rule outranks both", async ({
	page,
}) => {
	const build = read("dist/cirth.css");
	const print = read("dist/cirth.print.css");
	const markup = `<article id="target"><p>Card</p></article>`;
	await page.emulateMedia({ media: "print" });

	// Cirth's own order, inside the layer: the pass flattens the card.
	await setContent(page, `<style>${build}</style><style>${print}</style>${markup}`);
	expect(await styleOf(page, "target", "box-shadow")).toBe("none");

	// A consumer's print rule, even one loaded before both, wins over it.
	await setContent(
		page,
		`<style>@media print { article { box-shadow: 0 0 0 1px ${ink}; } }</style>` +
			`<style>${build}</style><style>${print}</style>${markup}`,
	);
	expect(await styleOf(page, "target", "box-shadow")).toBe(`${ink} 0px 0px 0px 1px`);
});
