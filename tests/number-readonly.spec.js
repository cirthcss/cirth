const fs = require("node:fs");
const path = require("node:path");
const { expect, test } = require("@playwright/test");
const { setContent } = require("./helpers/render");

const css = fs.readFileSync(
	path.join(__dirname, "..", "dist", "cirth.css"),
	"utf8",
);

/**
 * @param {import("@playwright/test").Page} page
 * @param {"ltr" | "rtl"} direction
 */
const render = (page, direction = "ltr") =>
	setContent(
		page,
		`<style>${css}</style>
		<main class="container" dir="${direction}">
			<label>Editable quantity
				<input id="editable" type="number" value="3" min="0" max="10">
			</label>
			<label>Readonly quantity
				<input id="readonly" type="number" value="3" min="0" max="10" readonly>
			</label>
		</main>`,
	);

for (const direction of /** @type {const} */ (["ltr", "rtl"])) {
	test(`only the editable number can step from the keyboard in ${direction}`, async ({
		page,
	}) => {
		await render(page, direction);

		const editable = page.locator("#editable");
		await editable.focus();
		await page.keyboard.press("ArrowUp");
		await expect(editable).toHaveValue("4");

		const readonly = page.locator("#readonly");
		await readonly.focus();
		await expect(readonly).toBeFocused();
		await page.keyboard.press("ArrowUp");
		await expect(readonly).toHaveValue("3");
	});
}

test("hiding the readonly stepper preserves the field state and geometry", async ({
	page,
}) => {
	await render(page);

	const beforeFocus = await page.locator("#readonly").evaluate((element) => {
		const style = getComputedStyle(element);
		const box = element.getBoundingClientRect();
		return {
			backgroundColor: style.backgroundColor,
			borderStyle: style.borderStyle,
			height: box.height,
			width: box.width,
		};
	});
	const editable = await page.locator("#editable").evaluate((element) => {
		const style = getComputedStyle(element);
		const box = element.getBoundingClientRect();
		return {
			backgroundColor: style.backgroundColor,
			height: box.height,
			width: box.width,
		};
	});

	expect(beforeFocus.borderStyle).toBe("dashed");
	expect(beforeFocus.backgroundColor).not.toBe(editable.backgroundColor);
	expect(beforeFocus.height).toBeGreaterThanOrEqual(44);
	expect(beforeFocus.height).toBeCloseTo(editable.height, 1);
	expect(beforeFocus.width).toBeCloseTo(editable.width, 1);

	await page.locator("#readonly").focus();
	const afterFocus = await page.locator("#readonly").evaluate((element) => {
		const style = getComputedStyle(element);
		return {
			backgroundColor: style.backgroundColor,
			borderStyle: style.borderStyle,
		};
	});
	expect(afterFocus).toEqual({
		backgroundColor: beforeFocus.backgroundColor,
		borderStyle: beforeFocus.borderStyle,
	});
});

test.describe("forced colors", () => {
	test.use({ contextOptions: { forcedColors: "active" } });

	test("readonly number remains distinguishable and editable focus remains visible", async ({
		page,
	}) => {
		await render(page);

		const readonly = page.locator("#readonly");
		expect(
			await readonly.evaluate((element) => getComputedStyle(element).borderStyle),
		).toBe("dashed");
		expect(
			await readonly.evaluate(
				(element) => element.getBoundingClientRect().height,
			),
		).toBeGreaterThanOrEqual(44);

		const editable = page.locator("#editable");
		await editable.focus();
		await expect(editable).toBeFocused();
		expect(
			await editable.evaluate(
				(element) => getComputedStyle(element).outlineStyle,
			),
		).toBe("solid");
	});
});
