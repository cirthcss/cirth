const fs = require("node:fs");
const path = require("node:path");
const { expect, test } = require("@playwright/test");
const { setContent } = require("./helpers/render");

// A nav inside <aside> or <details> is a stacked list: its rows are blocks,
// the current entry is marked on the inline-start edge, and a focus ring is
// drawn inside the row so a scrolling rail cannot clip it. A nav anywhere
// else stays a bar. See specs/stacked-nav-disclosure.md.

const css = fs.readFileSync(
	path.join(__dirname, "..", "dist", "cirth.css"),
	"utf8",
);

// WebKit moves focus to links only with Option held, as Safari does.
/** @param {string} browserName */
const tab = (browserName) => (browserName === "webkit" ? "Alt+Tab" : "Tab");
/** @param {string} browserName */
const shiftTab = (browserName) => `Shift+${tab(browserName)}`;

const list = `<ul>
	<li><a href="#" aria-current="page">Overview</a></li>
	<li><a href="#">Get started</a></li>
</ul>`;

test.beforeEach(async ({ page }) => {
	await setContent(
		page,
		`<html><head><style>${css}</style></head><body>
		<main class="container">
			<nav id="bar" aria-label="Bar">${list}</nav>
			<aside><nav id="aside" aria-label="Rail">${list}</nav></aside>
			<details open>
				<summary>Documentation</summary>
				<nav id="details" aria-label="Disclosure">${list}</nav>
			</details>
			<div id="rail" style="overflow-y: auto; inline-size: 12rem; block-size: 8rem">
				<aside><nav aria-label="Scrolling rail">${list}</nav></aside>
			</div>
		</main></body></html>`,
	);
});

/** @param {import("@playwright/test").Page} page @param {string} id */
const layout = (page, id) =>
	page.locator(`#${id}`).evaluate((nav) => {
		const [first, second] = [...nav.querySelectorAll("li")].map((item) =>
			item.getBoundingClientRect(),
		);
		const link = nav.querySelector("[aria-current]");
		if (!link) throw new Error("no current entry");
		const current = getComputedStyle(link);
		return {
			stacked: second.top >= first.bottom - 0.5,
			markerStart: current.borderInlineStartWidth !== "0px" &&
				current.borderInlineStartColor !== "rgba(0, 0, 0, 0)",
			markerEnd: current.borderBlockEndColor !== "rgba(0, 0, 0, 0)",
		};
	});

test("a nav inside <details> stacks like a nav inside <aside>", async ({ page }) => {
	for (const id of ["aside", "details"]) {
		expect(await layout(page, id), id).toEqual({
			stacked: true,
			markerStart: true,
			markerEnd: false,
		});
	}
});

test("a nav outside <aside> and <details> stays a bar", async ({ page }) => {
	expect(await layout(page, "bar")).toEqual({
		stacked: false,
		markerStart: false,
		markerEnd: true,
	});
});

test("a stacked nav draws its focus ring inside the row", async ({ page, browserName }) => {
	const rail = page.locator("#rail");
	await rail.locator("a").first().focus();
	await page.keyboard.press(tab(browserName));
	await page.keyboard.press(shiftTab(browserName));
	const ring = await rail.locator("a").first().evaluate((link) => {
		const style = getComputedStyle(link);
		return {
			focusVisible: link.matches(":focus-visible"),
			offset: Number.parseFloat(style.outlineOffset),
			width: Number.parseFloat(style.outlineWidth),
		};
	});
	expect(ring.focusVisible).toBe(true);
	expect(ring.offset).toBe(-ring.width);

	// A bar keeps the outset ring every other control draws.
	await page.locator("#bar a").first().focus();
	await page.keyboard.press(tab(browserName));
	await page.keyboard.press(shiftTab(browserName));
	const barOffset = await page
		.locator("#bar a")
		.first()
		.evaluate((link) => Number.parseFloat(getComputedStyle(link).outlineOffset));
	expect(barOffset).toBeGreaterThan(0);
});

test("a summary inside a stacked nav draws its ring inside too", async ({ page, browserName }) => {
	await setContent(
		page,
		`<html><head><style>${css}</style></head><body>
		<main class="container"><aside><nav aria-label="Index">
			<details open><summary>Group</summary>${list}</details>
		</nav></aside></main></body></html>`,
	);
	const summary = page.locator("summary");
	await summary.focus();
	await page.keyboard.press(tab(browserName));
	await page.keyboard.press(shiftTab(browserName));
	const ring = await summary.evaluate((element) => {
		const style = getComputedStyle(element);
		return {
			focusVisible: element.matches(":focus-visible"),
			offset: Number.parseFloat(style.outlineOffset),
			width: Number.parseFloat(style.outlineWidth),
		};
	});
	expect(ring.focusVisible).toBe(true);
	expect(ring.offset).toBe(-ring.width);
});
