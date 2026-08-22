const fs = require("node:fs");
const path = require("node:path");
const { expect, test } = require("@playwright/test");

// WCAG 2.5.5 target size, checked as a floor rather than as a coincidence.
//
// An input is pinned to 44px by an explicit height. A select grows with its
// longest option and a textarea with its rows, so neither can be pinned the
// same way — their height falls out of the text inside them, which means
// the target size held only as long as nobody changed the type scale. This
// asks each control for the threshold under a font-size an author might
// plausibly set, which is how the documentation's own header selects were
// found sitting at 37px.

const css = fs.readFileSync(
	path.join(__dirname, "..", "dist", "cirth.css"),
	"utf8",
);

const TARGET = 44;

/** @param {import("@playwright/test").Page} page */
const heightOf = (page, /** @type {string} */ id) =>
	page.evaluate(
		(name) =>
			document.getElementById(name)?.getBoundingClientRect().height ?? 0,
		id,
	);

for (const fontSize of ["1rem", "0.875rem", "0.75rem"]) {
	test(`controls stay at least ${TARGET}px at font-size ${fontSize}`, async ({
		page,
	}) => {
		await page.setContent(
			`<style>${css}</style>
			<main class="container" style="font-size: ${fontSize}">
				<input id="text" type="text" style="font-size: inherit">
				<select id="select" style="font-size: inherit"><option>Option</option></select>
				<textarea id="textarea" rows="1" style="font-size: inherit"></textarea>
				<button id="button" type="button" style="font-size: inherit">Button</button>
			</main>`,
		);

		for (const id of ["text", "select", "textarea", "button"]) {
			expect(
				await heightOf(page, id),
				`${id} meets the target size`,
			).toBeGreaterThanOrEqual(TARGET);
		}
	});
}
