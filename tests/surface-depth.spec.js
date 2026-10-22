const fs = require("node:fs");
const path = require("node:path");
const { expect, test } = require("@playwright/test");
const { contrastColors, srgbToOklab } = require("../scripts/lib/color");
const { listPresetNames } = require("../scripts/lib/presets");
const { setContent } = require("./helpers/render");

// The surface ladder has to read as depth, not only exist. Four levels
// told apart by lightness alone, with every edge and shadow ignored; three
// edges in a fixed order on every level, the control one at the non-text
// floor; a light page near white and a dark one near black; and a card
// that casts less than a menu. Measured on colours as painted in 8-bit
// sRGB, for the default theme, every shipped preset and the probe accent.
// See specs/surface-depth.md.

const projectRoot = path.join(__dirname, "..");

/** @param {string} file */
const read = (file) => {
	const stylesheet = path.join(projectRoot, file);
	if (!fs.existsSync(stylesheet)) {
		throw new Error(`surface-depth.spec: ${file} not found: run \`npm run build\` first.`);
	}
	return fs.readFileSync(stylesheet, "utf8");
};

const css = read("dist/cirth.css");

const variants = [
	{ name: "default", css: "" },
	{
		name: "probe",
		css: ":root { --cirth-primary: light-dark(oklch(50% 0.09 200deg), oklch(72% 0.1 200deg)); }",
	},
	...listPresetNames().map((name) => ({ name, css: read(`dist/presets/${name}.css`) })),
];

const levels = /** @type {const} */ (["recessed", "canvas", "band", "raised", "overlay"]);
const tokens = {
	recessed: "--cirth-surface-recessed",
	canvas: "--cirth-canvas",
	band: "--cirth-card-sectioning-background-color",
	raised: "--cirth-surface-raised",
	overlay: "--cirth-surface-overlay",
	separator: "--cirth-muted-border-color",
	container: "--cirth-card-border-color",
	control: "--cirth-form-element-border-color",
};

const markup = `
	<main>
		<article>A card</article>
		<details class="dropdown" open><summary>Menu</summary><ul><li><a href="#">Item</a></li></ul></details>
	</main>
`;

/**
 * Every token, painted: the computed colour is drawn on a canvas and read
 * back, so what is compared is what a screen shows.
 *
 * @param {import("@playwright/test").Page} page
 */
const paint = (page) =>
	page.evaluate((list) => {
		const canvas = document.createElement("canvas");
		canvas.width = canvas.height = 1;
		const context = /** @type {CanvasRenderingContext2D} */ (
			canvas.getContext("2d", { willReadFrequently: true })
		);
		/** @type {Record<string, [number, number, number]>} */
		const result = {};
		for (const [role, token] of Object.entries(list)) {
			const probe = document.createElement("div");
			probe.style.backgroundColor = `var(${token})`;
			document.body.append(probe);
			const value = getComputedStyle(probe).backgroundColor;
			probe.remove();
			context.clearRect(0, 0, 1, 1);
			context.fillStyle = value;
			context.fillRect(0, 0, 1, 1);
			const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
			result[role] = [r, g, b];
		}
		return result;
	}, tokens);

/** @param {[number, number, number]} rgb */
const color = ([r, g, b]) => ({ r: r / 255, g: g / 255, b: b / 255, alpha: 1 });
/** @param {[number, number, number]} rgb */
const lightness = (rgb) => srgbToOklab(color(rgb)).lightness;
/** @param {[number, number, number]} a @param {[number, number, number]} b */
const ratio = (a, b) => contrastColors(color(a), color(b));

/**
 * @param {import("@playwright/test").Page} page
 * @param {{ scheme: "light" | "dark", more?: boolean, variant: (typeof variants)[number] }} options
 */
const render = async (page, { more = false, scheme, variant }) => {
	await page.emulateMedia({ colorScheme: scheme, contrast: more ? "more" : "no-preference" });
	await setContent(page, `<style>${css}</style><style>${variant.css}</style>${markup}`);
};

/** @param {import("@playwright/test").Page} page */
const reportsPreference = async (page) => {
	await page.emulateMedia({ contrast: "more" });
	await setContent(
		page,
		"<style>#s{color:rgb(255,0,0)}@media (prefers-contrast: more){#s{color:rgb(0,255,0)}}</style><p id=\"s\">s</p>",
	);
	return page.locator("#s").evaluate((element) => getComputedStyle(element).color === "rgb(0, 255, 0)");
};

// Floors, in OKLab lightness, a little under the lowest value any shipped
// variant measures, so a regression toward the flat ladder trips them.
const floors = {
	light: { recessed: 0.035, raised: 0.012 },
	dark: { recessed: 0.035, band: 0.02, raised: 0.05, overlayAboveRaised: 0.04 },
};

for (const variant of variants) {
	for (const scheme of /** @type {const} */ (["light", "dark"])) {
		test(`${variant.name}, ${scheme}: the levels read apart by lightness alone`, async ({ page }) => {
			await render(page, { scheme, variant });
			const painted = await paint(page);
			const L = Object.fromEntries(levels.map((level) => [level, lightness(painted[level])]));
			const summary = levels.map((level) => `${level} ${L[level].toFixed(3)}`).join(", ");

			expect(L.canvas - L.recessed, `recessed sits below the canvas: ${summary}`).toBeGreaterThanOrEqual(
				floors[scheme].recessed,
			);
			expect(L.band, `the band sits above the canvas: ${summary}`).toBeGreaterThan(L.canvas);
			expect(L.raised, `the band sits below the raised level: ${summary}`).toBeGreaterThan(L.band);
			if (scheme === "light") {
				expect(L.raised - L.canvas, `a card is lighter than the page: ${summary}`).toBeGreaterThanOrEqual(
					floors.light.raised,
				);
				expect(L.overlay, `the overlay shares the raised level: ${summary}`).toBeCloseTo(L.raised, 3);
			} else {
				expect(L.band - L.canvas, summary).toBeGreaterThanOrEqual(floors.dark.band);
				expect(L.raised - L.canvas, `a card is lifted: ${summary}`).toBeGreaterThanOrEqual(floors.dark.raised);
				expect(L.overlay - L.raised, `a menu is lifted past a card: ${summary}`).toBeGreaterThanOrEqual(
					floors.dark.overlayAboveRaised,
				);
			}
		});

		for (const more of [false, true]) {
			test(`${variant.name}, ${scheme}${more ? ", more" : ""}: edges keep their order and the control its floor on every level`, async ({
				page,
			}) => {
				if (more) {
					test.skip(!(await reportsPreference(page)), "this engine does not expose prefers-contrast to automation");
				}
				await render(page, { more, scheme, variant });
				const painted = await paint(page);
				const controlFloor = more ? 6.9 : 3;

				for (const level of levels) {
					const on = (/** @type {"separator" | "container" | "control"} */ edge) =>
						ratio(painted[edge], painted[level]);
					const line = `${level}: separator ${on("separator").toFixed(2)}, container ${on("container").toFixed(2)}, control ${on("control").toFixed(2)}`;
					expect(on("separator"), line).toBeLessThan(on("container"));
					expect(on("container"), line).toBeLessThanOrEqual(on("control"));
					expect(on("control"), line).toBeGreaterThanOrEqual(controlFloor);
				}
			});
		}
	}
}

// The default theme and plain share their ends: a page near white in
// light and near black in dark. The presets that set their own canvas to a
// design language's values (material, metro) keep them.
for (const name of ["default", "plain"]) {
	const variant = variants.find((entry) => entry.name === name);
	if (!variant) throw new Error(`missing variant ${name}`);
	test(`${name}: the light page is near white and the dark one near black`, async ({ page }) => {
		await render(page, { scheme: "light", variant });
		const light = lightness((await paint(page)).canvas);
		await render(page, { scheme: "dark", variant });
		const dark = lightness((await paint(page)).canvas);

		expect(light, "light canvas").toBeGreaterThanOrEqual(0.97);
		expect(dark, "dark canvas").toBeLessThanOrEqual(0.18);
	});
}

// Flat presets turn every shadow off, the card's included; the others keep
// a card's single contact layer under a menu's larger one.
for (const variant of variants) {
	test(`${variant.name}: a card casts less than a menu`, async ({ page }) => {
		await render(page, { scheme: "light", variant });
		const [card, menu] = await Promise.all(
			["article", "details.dropdown > ul"].map((selector) =>
				page.locator(selector).evaluate((element) => getComputedStyle(element).boxShadow),
			),
		);
		if (["material", "metro"].includes(variant.name)) {
			expect(card, "a flat preset's card").toBe("none");
			return;
		}
		expect(card).not.toBe("none");
		expect(menu).not.toBe("none");
		/** @param {string} value */
		const layers = (value) => value.split(/,(?![^(]*\))/);
		expect(layers(card).length).toBeLessThan(layers(menu).length);
	});
}
