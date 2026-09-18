const fs = require("node:fs");
const path = require("node:path");
const { expect, test } = require("@playwright/test");
const { setContent } = require("./helpers/render");

// --cirth-box-shadow used to wrap two whole shadow lists in light-dark(),
// which only accepts colours. The declaration parsed — custom properties
// accept any tokens — but every box-shadow that read it was invalid at
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
	test(`the shared shadow resolves to seven layers in ${theme}`, async ({ page }) => {
		await render(page, theme);

		for (const selector of ["details.dropdown > ul", "#probe"]) {
			const shadow = await page
				.locator(selector)
				.evaluate((element) => getComputedStyle(element).boxShadow);
			expect(layers(shadow), selector).toHaveLength(7);
		}
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
	expect(layers(dark)).toHaveLength(7);
	// Same geometry, different colour.
	expect(dark).not.toBe(light);
	expect(dark.replace(/oklch\([^)]*\)|rgba?\([^)]*\)/g, "")).toBe(
		light.replace(/oklch\([^)]*\)|rgba?\([^)]*\)/g, ""),
	);
});
