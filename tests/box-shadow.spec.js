const fs = require("node:fs");
const path = require("node:path");
const { expect, test } = require("@playwright/test");
const { setContent } = require("./helpers/render");

// --cirth-box-shadow used to wrap two whole shadow lists in light-dark(),
// which only accepts colours. The declaration parsed: custom properties
// accept any tokens, but every box-shadow that read it was invalid at
// computed-value time and resolved to none, in every engine, so dropdowns
// and popovers shipped without their elevation and nothing noticed. The
// scheme choice now sits on each layer's colour.

const css = fs.readFileSync(
	path.join(__dirname, "..", "dist", "cirth.css"),
	"utf8",
);

/**
 * @param {import("@playwright/test").Page} page
 * @param {"light" | "dark"} theme
 */
const render = (page, theme) =>
	setContent(
		page,
		`<html data-theme="${theme}"><head><style>${css}</style></head><body>
		<main class="container">
			<details class="dropdown" open>
				<summary>Menu</summary>
				<ul><li><a href="#">Item</a></li></ul>
			</details>
			<article>A card</article>
			<div id="probe" style="box-shadow: var(--cirth-box-shadow)">probe</div>
			<section data-theme="dark">
				<div id="forced" style="box-shadow: var(--cirth-box-shadow)">forced</div>
			</section>
		</main></body></html>`,
	);

/** @param {string} value */
const layers = (value) =>
	value === "none" ? [] : value.split(/,(?![^(]*\))/).map((layer) => layer.trim());

for (const theme of /** @type {const} */ (["light", "dark"])) {
	// Three layers since specs/surface-depth.md: a one-pixel highlight on
	// the top edge, transparent in light, then the contact shadow and the
	// ambient one of specs/surface-and-edge-model.md. The seven-layer ramp
	// before them came from Pico.
	test(`the shared shadow resolves to three layers in ${theme}`, async ({ page }) => {
		await render(page, theme);

		for (const selector of ["details.dropdown > ul", "#probe"]) {
			const shadow = await page
				.locator(selector)
				.evaluate((element) => getComputedStyle(element).boxShadow);
			const [highlight, ...cast] = layers(shadow);
			expect(layers(shadow), selector).toHaveLength(3);
			expect(highlight, selector).toMatch(/inset/);
			for (const layer of cast) expect(layer, selector).not.toMatch(/inset/);
			if (theme === "light") {
				expect(highlight, `${selector}: no highlight on a light panel`).toMatch(
					/rgba\(0, 0, 0, 0\)|transparent|oklch\([^)]*\/ 0\)/,
				);
			} else {
				expect(highlight, `${selector}: a highlight on a dark panel`).not.toMatch(
					/rgba\(0, 0, 0, 0\)|transparent/,
				);
			}
		}
	});

	// A card is a sheet, not a panel: one contact layer that reaches a
	// fraction of the overlay's ambient one, and no highlight.
	test(`a card casts a contact shadow, not the overlay one, in ${theme}`, async ({
		page,
	}) => {
		await render(page, theme);
		const [card, overlay] = await Promise.all(
			["article", "details.dropdown > ul"].map((selector) =>
				page
					.locator(selector)
					.evaluate((element) => getComputedStyle(element).boxShadow),
			),
		);
		/** @param {string} layer */
		const blur = (layer) => {
			const lengths = layer
				.replace(/oklch\([^)]*\)|rgba?\([^)]*\)|inset/g, "")
				.trim()
				.split(/\s+/)
				.map((part) => Number.parseFloat(part));
			return lengths[2] ?? 0;
		};
		expect(layers(card)).toHaveLength(1);
		expect(card).not.toMatch(/inset/);
		expect(blur(layers(card)[0])).toBeLessThan(
			Math.max(...layers(overlay).map(blur)) / 4,
		);
	});
}

test("a forced dark subtree draws the dark shadow on a light page", async ({
	page,
}) => {
	await render(page, "light");

	const [light, dark] = await Promise.all(
		["#probe", "#forced"].map((selector) =>
			page
				.locator(selector)
				.evaluate((element) => getComputedStyle(element).boxShadow),
		),
	);
	expect(layers(dark)).toHaveLength(3);
	// Same geometry, different colour.
	expect(dark).not.toBe(light);
	expect(dark.replace(/oklch\([^)]*\)|rgba?\([^)]*\)/g, "")).toBe(
		light.replace(/oklch\([^)]*\)|rgba?\([^)]*\)/g, ""),
	);
});

// The elevation has to be *visible* in both schemes, not only present. One
// alpha for both used to darken the light canvas by about 0.035 of OKLab
// lightness beside a floating panel and the dark canvas by under 0.01:
// seven valid layers, and no elevation anyone could see in the dark. This
// reads the real pixels under an open popover, so it measures what a reader
// gets rather than restating the token. See specs/dark-elevation-shadow.md.

/**
 * OKLab lightness of the pixel `offset` px below the popover's bottom edge,
 * minus the canvas's own, measured on the screenshot the browser paints.
 *
 * @param {import("@playwright/test").Page} page
 * @param {"light" | "dark"} theme
 * @param {number} offset
 */
const edgeStep = async (page, theme, offset) => {
	await setContent(
		page,
		`<html data-theme="${theme}"><head><style>${css}</style></head><body>
		<main class="container">
			<div id="panel" popover style="inset: 120px auto auto 200px; margin: 0; width: 320px; height: 160px">Floating panel</div>
		</main></body></html>`,
	);
	await page.locator("#panel").evaluate((element) => {
		if (!(element instanceof HTMLElement)) throw new Error("no panel");
		element.showPopover();
	});
	await expect(page.locator("#panel")).toBeVisible();
	await page.waitForTimeout(300);
	const shot = (await page.screenshot()).toString("base64");

	return page.evaluate(
		async ({ png, offset }) => {
			const panel = /** @type {HTMLElement} */ (document.getElementById("panel"));
			const box = panel.getBoundingClientRect();
			const image = await createImageBitmap(
				await (await fetch(`data:image/png;base64,${png}`)).blob(),
			);
			const canvas = new OffscreenCanvas(image.width, image.height);
			const context = /** @type {OffscreenCanvasRenderingContext2D} */ (
				canvas.getContext("2d")
			);
			context.drawImage(image, 0, 0);
			const scale = image.width / window.innerWidth;
			/** @param {number} x @param {number} y */
			const lightness = (x, y) => {
				const [r, g, b] = context.getImageData(
					Math.round(x * scale),
					Math.round(y * scale),
					1,
					1,
				).data;
				/** @param {number} c */
				const lin = (c) => {
					const v = c / 255;
					return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
				};
				const [R, G, B] = [lin(r), lin(g), lin(b)];
				const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
				const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
				const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
				return 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
			};
			const canvasLightness = lightness(5, window.innerHeight - 5);
			return (
				lightness(box.left + box.width / 2, box.bottom + offset) -
				canvasLightness
			);
		},
		{ png: shot, offset },
	);
};

test("a floating panel lifts off the dark canvas as far as off the light one", async ({
	page,
}) => {
	const light = await edgeStep(page, "light", 2);
	const dark = await edgeStep(page, "dark", 2);
	test.info().annotations.push({
		type: "edge step",
		description: `light ${light.toFixed(4)}, dark ${dark.toFixed(4)}`,
	});

	// Both are shadows: the canvas under the edge is darker than the canvas.
	expect(light).toBeLessThan(0);
	expect(dark).toBeLessThan(0);
	// And the dark step is a real one. Measured before the fix: -0.0095
	// against -0.033 to -0.037 in light, in all three engines.
	expect(Math.abs(dark)).toBeGreaterThan(Math.abs(light) * 0.75);
});
