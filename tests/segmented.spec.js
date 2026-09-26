const fs = require("node:fs");
const path = require("node:path");
const { AxeBuilder } = require("@axe-core/playwright");
const { expect, test } = require("@playwright/test");
const { setContent } = require("./helpers/render");

// fieldset.segmented (gh#107): a segmented control that has to remain a
// real radio group. Every test here pins part of that contract: the
// native keyboard model, form submission, the accessible names, a focus
// indicator and a selection signal that survive forced colours, the 44px
// floor, RTL, because each of them is exactly what the upstream pattern
// (inputs set to display: none) gave up.

// Default Safari leaves form controls out of the Tab order (see
// docs-stack.spec.js); Option+Tab is its key for reaching every control,
// and it is what a Safari keyboard user presses.
/** @param {string} browserName */
const tabKey = (browserName) => (browserName === "webkit" ? "Alt+Tab" : "Tab");

/** @param {string} file */
const readCss = (file) =>
	fs.readFileSync(path.join(__dirname, "..", "dist", file), "utf8");

const css = readCss("cirth.css");

const markup = `
	<form>
		<fieldset class="segmented">
			<legend>View</legend>
			<label><input type="radio" name="view" value="list" checked> List</label>
			<label><input type="radio" name="view" value="grid"> Grid</label>
			<label><input type="radio" name="view" value="map" disabled> Map</label>
			<label><input type="radio" name="view" value="table"> Table</label>
		</fieldset>
	</form>`;

/**
 * @param {import("@playwright/test").Page} page
 * @param {{ direction?: "ltr" | "rtl", stylesheet?: string }} [options]
 */
const render = (page, { direction = "ltr", stylesheet = css } = {}) =>
	setContent(
		page,
		`<html dir="${direction}"><head><style>${stylesheet}</style></head>
		<body><main class="container">${markup}</main></body></html>`,
	);

/** @param {import("@playwright/test").Page} page */
const segments = (page) =>
	page.locator("fieldset.segmented > label").evaluateAll((labels) =>
		labels.map((label) => {
			const style = getComputedStyle(label);
			const box = label.getBoundingClientRect();
			const radio = /** @type {HTMLInputElement} */ (label.querySelector("input"));
			const radioStyle = getComputedStyle(radio);
			return {
				value: radio.value,
				left: box.left,
				right: box.right,
				width: box.width,
				height: box.height,
				background: style.backgroundColor,
				opacity: Number(style.opacity),
				outlineStyle: style.outlineStyle,
				outlineWidth: Number.parseFloat(style.outlineWidth),
				startStartRadius: Number.parseFloat(style.borderStartStartRadius),
				endEndRadius: Number.parseFloat(style.borderEndEndRadius),
				radioDisplay: radioStyle.display,
				radioOpacity: Number(radioStyle.opacity),
				radioBorder: Number.parseFloat(radioStyle.borderTopWidth),
				radioWidth: radio.getBoundingClientRect().width,
			};
		}),
	);

test("the group and every option keep their accessible names", async ({ page }) => {
	await render(page);

	const group = page.getByRole("group", { name: "View" });
	await expect(group).toBeVisible();
	await expect(group.getByRole("radio")).toHaveCount(4);
	await expect(group.getByRole("radio", { name: "List" })).toBeChecked();
	await expect(group.getByRole("radio", { name: "Map" })).toBeDisabled();
});

test("arrow keys move the selection natively and skip the disabled option", async ({
	page,
	browserName,
}) => {
	await render(page);

	await page.keyboard.press(tabKey(browserName));
	const list = page.getByRole("radio", { name: "List" });
	await expect(list).toBeFocused();

	await page.keyboard.press("ArrowDown");
	await expect(page.getByRole("radio", { name: "Grid" })).toBeChecked();
	await page.keyboard.press("ArrowDown");
	await expect(page.getByRole("radio", { name: "Table" })).toBeChecked();
	await expect(page.getByRole("radio", { name: "Map" })).not.toBeChecked();
});

test("the checked value submits with the form", async ({ page }) => {
	await render(page);

	await page.getByText("Table").click();
	const data = await page.locator("form").evaluate((form) =>
		Object.fromEntries(new FormData(/** @type {HTMLFormElement} */ (form))),
	);
	expect(data).toEqual({ view: "table" });
});

test("a disabled option cannot be selected by pointer", async ({ page }) => {
	await render(page);

	await page.getByText("Map").click({ force: true });
	await expect(page.getByRole("radio", { name: "List" })).toBeChecked();
});

test("segments are joined, meet the 44px floor, and keep the radios rendered", async ({
	page,
}) => {
	await render(page);
	const boxes = await segments(page);

	for (const box of boxes) {
		expect(box.height, box.value).toBeGreaterThanOrEqual(44);
		expect(box.width, box.value).toBeGreaterThanOrEqual(44);
		// Rendered, not display: none: that is the upstream failure.
		expect(box.radioDisplay, box.value).not.toBe("none");
		expect(box.radioWidth, box.value).toBeGreaterThan(0);
	}
	// Adjacent segments share one border instead of drawing two.
	for (let index = 1; index < boxes.length; index += 1) {
		expect(boxes[index].left).toBeLessThan(boxes[index - 1].right);
	}
	// Only the outer corners are rounded.
	expect(boxes[0].startStartRadius).toBeGreaterThan(0);
	expect(boxes[0].endEndRadius).toBe(0);
	expect(boxes[3].startStartRadius).toBe(0);
	expect(boxes[3].endEndRadius).toBeGreaterThan(0);
});

test("segments run from the inline start in RTL", async ({ page }) => {
	await render(page, { direction: "rtl" });
	const boxes = await segments(page);

	for (let index = 1; index < boxes.length; index += 1) {
		expect(boxes[index].right).toBeLessThanOrEqual(boxes[index - 1].left + 2);
	}
	expect(boxes[0].startStartRadius).toBeGreaterThan(0);
	expect(boxes[3].endEndRadius).toBeGreaterThan(0);
});

test("the selection is not conveyed by colour alone", async ({ page }) => {
	await render(page);
	const [checked, unchecked] = await segments(page);

	expect(checked.background).not.toBe(unchecked.background);
	// The checked radio keeps its dot: a much thicker border than an empty one.
	expect(checked.radioBorder).toBeGreaterThanOrEqual(unchecked.radioBorder * 3);
});

test("a disabled option fades its segment once", async ({ page }) => {
	await render(page);
	const disabled = (await segments(page))[2];

	expect(disabled.opacity).toBeLessThan(1);
	expect(disabled.radioOpacity).toBe(1);
});

/**
 * @param {import("@playwright/test").Page} page
 * @param {string} browserName
 */
const expectSegmentFocusOutline = async (page, browserName) => {
	const before = (await segments(page))[0];
	expect(before.outlineStyle === "none" || before.outlineWidth === 0).toBe(true);

	await page.keyboard.press(tabKey(browserName));
	const [focused] = await segments(page);
	expect(focused.outlineStyle).toBe("solid");
	expect(focused.outlineWidth).toBeGreaterThan(0);
};

test("keyboard focus outlines the whole segment", async ({ page, browserName }) => {
	await render(page);
	await expectSegmentFocusOutline(page, browserName);
});

test.describe("forced-colors: active", () => {
	test.use({ contextOptions: { forcedColors: "active" } });

	test("focus and selection stay visible without author colours", async ({
		page,
		browserName,
	}) => {
		await render(page);
		expect(
			await page.evaluate(() => matchMedia("(forced-colors: active)").matches),
		).toBe(true);

		await expectSegmentFocusOutline(page, browserName);

		// The fill is gone; the dot is what still tells the options apart.
		const [checked, unchecked] = await segments(page);
		expect(checked.radioBorder).toBeGreaterThanOrEqual(unchecked.radioBorder * 3);
	});
});

test("axe finds no violations in the segmented group", async ({
	page,
	browserName,
}) => {
	await render(page);
	await page.keyboard.press(tabKey(browserName));

	const results = await new AxeBuilder({ page })
		.withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
		.include("fieldset.segmented")
		.analyze();
	expect(results.violations.map((violation) => violation.id)).toEqual([]);
});

test("the classless build has no opt-in", async ({ page }) => {
	await render(page, { stylesheet: readCss("cirth.classless.css") });

	const display = await page
		.locator("fieldset.segmented")
		.evaluate((fieldset) => getComputedStyle(fieldset).display);
	expect(display).toBe("block");
});
