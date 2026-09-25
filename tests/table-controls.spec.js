const fs = require("node:fs");
const path = require("node:path");
const { AxeBuilder } = require("@axe-core/playwright");
const { expect, test } = require("@playwright/test");
const { setContent } = require("./helpers/render");

// table.controls (gh#108): form controls placed directly in table cells,
// without the box-inside-a-box of cell padding around a full control. The
// variant may only take padding away. Everything that makes a control a
// control (its border, its states, its focus ring, its 44px target, its
// name) has to arrive unchanged, and that is most of what this pins.

/** @param {string} file */
const readCss = (file) =>
	fs.readFileSync(path.join(__dirname, "..", "dist", file), "utf8");

const css = readCss("cirth.css");
const demo = fs.readFileSync(
	path.join(__dirname, "..", "docs", "src", "content", "demos", "table-controls.html"),
	"utf8",
);

// Controls outside any table, in the same states as the demo's, to compare
// against: a state that looks different inside the table has been changed
// by the variant.
const reference = `
	<form id="reference">
		<input id="ref-number" type="number" value="12" aria-label="r1">
		<input id="ref-invalid" type="number" value="-3" aria-invalid="true" aria-label="r2">
		<select id="ref-disabled" disabled aria-label="r3"><option>C3</option></select>
		<input id="ref-readonly" type="text" value="x" readonly aria-label="r4">
		<button id="ref-button" type="button">Save</button>
	</form>`;

// Default Safari leaves buttons out of the Tab order (docs-stack.spec.js);
// Option+Tab is its key for reaching every control.
/** @param {string} browserName */
const tabKey = (browserName) => (browserName === "webkit" ? "Alt+Tab" : "Tab");

/**
 * @param {import("@playwright/test").Page} page
 * @param {{ direction?: "ltr" | "rtl", stylesheet?: string }} [options]
 */
const render = (page, { direction = "ltr", stylesheet = css } = {}) =>
	setContent(
		page,
		`<html dir="${direction}"><head><style>${stylesheet}</style></head>
		<body><main class="container">${demo}${reference}</main></body></html>`,
	);

/**
 * @param {import("@playwright/test").Page} page
 * @param {string} selector
 */
const look = (page, selector) =>
	page.locator(selector).first().evaluate((element) => {
		const style = getComputedStyle(element);
		const box = element.getBoundingClientRect();
		return {
			borderColor: style.borderTopColor,
			borderStyle: style.borderTopStyle,
			borderWidth: Number.parseFloat(style.borderTopWidth),
			boxShadow: style.boxShadow,
			opacity: style.opacity,
			outlineStyle: style.outlineStyle,
			backgroundColor: style.backgroundColor,
			marginBottom: Number.parseFloat(style.marginBottom),
			height: box.height,
		};
	});

/**
 * @param {import("@playwright/test").Page} page
 * @param {string} selector
 */
const cellPadding = (page, selector) =>
	page.locator(selector).first().evaluate((cell) => {
		const style = getComputedStyle(cell);
		return {
			block: Number.parseFloat(style.paddingTop),
			inline: Number.parseFloat(style.paddingInlineStart),
		};
	});

const row = "table.controls tbody tr";

test("cells holding a control give up most of their padding; text cells keep theirs", async ({
	page,
}) => {
	await render(page);

	const control = await cellPadding(page, `${row} td:has(> input)`);
	const text = await cellPadding(page, `${row} th`);
	expect(control.block).toBeLessThan(text.block);
	expect(control.inline).toBeLessThan(text.inline);
	expect(control.inline).toBeGreaterThan(0);
});

test("controls drop their stacking margin and keep the 44px floor", async ({
	page,
}) => {
	await render(page);

	for (const selector of [
		`${row} input[type="number"]`,
		`${row} select`,
		`${row} input[type="text"]`,
		`${row} button`,
	]) {
		const control = await look(page, selector);
		expect(control.marginBottom, selector).toBe(0);
		expect(control.height, selector).toBeGreaterThanOrEqual(44);
	}
});

test("every state looks the same inside the table as outside it", async ({ page }) => {
	await render(page);

	const pairs = [
		[`${row} input[type="number"]:not([aria-invalid])`, "#ref-number"],
		[`${row} input[aria-invalid="true"]`, "#ref-invalid"],
		[`${row} select[disabled]`, "#ref-disabled"],
		[`${row} input[readonly]`, "#ref-readonly"],
		[`${row} button:not(.secondary)`, "#ref-button"],
	];
	for (const [inside, outside] of pairs) {
		const a = await look(page, inside);
		const b = await look(page, outside);
		for (const key of /** @type {const} */ ([
			"borderColor",
			"borderStyle",
			"borderWidth",
			"opacity",
			"backgroundColor",
		])) {
			expect(a[key], `${inside} ${key}`).toBe(b[key]);
		}
	}

	// Hover and focus, which only exist while they are happening.
	const field = `${row} input[type="number"]:not([aria-invalid])`;
	await page.locator(field).first().hover();
	await page.locator("#ref-number").hover();
	const hoveredOutside = await look(page, "#ref-number");
	await page.locator(field).first().hover();
	const hoveredInside = await look(page, field);
	expect(hoveredInside.borderColor).toBe(hoveredOutside.borderColor);

	await page.locator(field).first().focus();
	const focusedInside = await look(page, field);
	await page.locator("#ref-number").focus();
	const focusedOutside = await look(page, "#ref-number");
	expect(focusedInside.boxShadow).toBe(focusedOutside.boxShadow);
	expect(focusedInside.boxShadow).not.toBe("none");
});

test("each control is named by its row and column headers", async ({ page }) => {
	await render(page);

	await expect(page.getByRole("spinbutton", { name: "Quantity Apples" })).toHaveValue("12");
	await expect(page.getByRole("combobox", { name: "Bin Apples" })).toBeVisible();
	await expect(page.getByRole("textbox", { name: "Note Pears" })).toHaveAttribute("readonly", "");
	await expect(
		page.getByRole("button", { name: "Save", description: "Apples" }),
	).toBeVisible();
});

test("a focus ring is not clipped by the scroll container", async ({
	page,
	browserName,
}) => {
	await render(page);

	// The scroll region first, then the first control inside it.
	await page.keyboard.press(tabKey(browserName));
	await page.keyboard.press(tabKey(browserName));
	await expect(page.getByRole("spinbutton", { name: "Quantity Apples" })).toBeFocused();

	for (const name of ["Quantity Apples", "Save"]) {
		const control =
			name === "Save"
				? page.getByRole("button", { name, description: "Apples" })
				: page.getByRole("spinbutton", { name });
		await control.focus();
		const fits = await control.evaluate((element) => {
			const ring = Number.parseFloat(
				getComputedStyle(document.documentElement).getPropertyValue(
					"--cirth-outline-width",
				),
			) * 16;
			const box = element.getBoundingClientRect();
			const container = /** @type {HTMLElement} */ (element.closest(".overflow-auto"));
			const bounds = container.getBoundingClientRect();
			return (
				box.left - ring >= bounds.left - 0.5 &&
				box.right + ring <= bounds.right + 0.5 &&
				box.top - ring >= bounds.top - 0.5 &&
				box.bottom + ring <= bounds.bottom + 0.5
			);
		});
		expect(fits, name).toBe(true);
	}
});

test("at 320px the table scrolls inside its container, not the page", async ({
	page,
}) => {
	await page.setViewportSize({ width: 320, height: 640 });
	await render(page);

	const metrics = await page.evaluate(() => {
		const container = /** @type {HTMLElement} */ (document.querySelector(".overflow-auto"));
		return {
			page: document.documentElement.scrollWidth - document.documentElement.clientWidth,
			container: container.scrollWidth - container.clientWidth,
		};
	});
	expect(metrics.page).toBeLessThanOrEqual(0);
	expect(metrics.container).toBeGreaterThan(0);

	// The table overflows rather than squeezing a select below its value.
	const select = await page.locator(`${row} select`).first().evaluate((element) => {
		const squeezed = element.getBoundingClientRect().width;
		/** @type {HTMLElement} */ (element).style.width = "max-content";
		const needed = element.getBoundingClientRect().width;
		/** @type {HTMLElement} */ (element).style.width = "";
		return { squeezed, needed };
	});
	expect(select.squeezed).toBeGreaterThanOrEqual(select.needed - 1);
	expect((await look(page, `${row} input[type="text"]`)).height).toBeGreaterThanOrEqual(44);
});

test("controls stay inside their cells in RTL", async ({ page }) => {
	await render(page, { direction: "rtl" });

	const layout = await page.locator(`${row}`).first().evaluate((tr) =>
		[...tr.children].map((cell) => {
			const box = cell.getBoundingClientRect();
			const control = cell.querySelector("input, select, button");
			const inner = control?.getBoundingClientRect();
			return {
				left: box.left,
				contains: inner
					? inner.left >= box.left - 0.5 && inner.right <= box.right + 0.5
					: true,
			};
		}),
	);
	for (const cell of layout) expect(cell.contains).toBe(true);
	// The row header is the inline start, which is the right in RTL.
	expect(layout[0].left).toBeGreaterThan(layout[1].left);
});

test.describe("forced-colors: active", () => {
	test.use({ contextOptions: { forcedColors: "active" } });

	test("every control keeps a visible border", async ({ page }) => {
		await render(page);
		expect(
			await page.evaluate(() => matchMedia("(forced-colors: active)").matches),
		).toBe(true);

		for (const selector of [`${row} input`, `${row} select`, `${row} button`]) {
			const control = await look(page, selector);
			expect(control.borderStyle, selector).not.toBe("none");
			expect(control.borderWidth, selector).toBeGreaterThan(0);
		}
	});
});

test("axe finds no violations in the table", async ({ page }) => {
	await render(page);

	const results = await new AxeBuilder({ page })
		.withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
		.include(".overflow-auto")
		.analyze();
	expect(results.violations.map((violation) => violation.id)).toEqual([]);
});

test("the classless build has no variant", async ({ page }) => {
	await render(page, { stylesheet: readCss("cirth.classless.css") });

	const control = await cellPadding(page, `${row} td:has(> input)`);
	const header = await cellPadding(page, `${row} th`);
	expect(control).toEqual(header);
});
