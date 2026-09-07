const fs = require("node:fs");
const path = require("node:path");
const { expect, test } = require("@playwright/test");
const { setContent } = require("./helpers/render");

// How tall form controls come out, which is two separate questions.
//
// The first is target size, checked as a floor rather than as a
// coincidence — and there are two thresholds, deliberately. Outside a nav
// it is 44px, WCAG 2.5.5 Target Size (Enhanced), which this project treats
// as a product requirement. Inside a nav it is a 40px compact band, still
// above the 24px WCAG 2.5.8 Target Size (Minimum) threshold.
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
const TARGET_NAV = 40;

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
		await setContent(page,
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

for (const customMetrics of [false, true]) {
	test(`equivalent controls share their geometry${
		customMetrics ? " after a runtime metric override" : ""
	}`, async ({ page }) => {
		await setContent(page,
			`<style>${css}</style>
			<main class="container"${
				customMetrics
					? ' style="--cirth-line-height: 1.25; --cirth-form-element-spacing-vertical: 0.75rem"'
					: ""
			}>
				<input id="text" type="text" value="Control">
				<select id="select"><option>Control</option></select>
				<textarea id="textarea" rows="1">Control</textarea>
				<button id="button" type="button">Control</button>
			</main>`,
		);

		const geometry = await page.evaluate(() =>
			["text", "select", "textarea", "button"].map((id) => {
				const element = document.getElementById(id);
				if (!element) {
					throw new Error(`missing ${id}`);
				}
				const style = getComputedStyle(element);
				return {
					id,
					height: element.getBoundingClientRect().height,
					fontSize: style.fontSize,
					lineHeight: style.lineHeight,
					paddingTop: style.paddingTop,
					paddingBottom: style.paddingBottom,
					borderTopWidth: style.borderTopWidth,
					borderBottomWidth: style.borderBottomWidth,
				};
			}),
		);

		const reference = geometry[0];
		for (const control of geometry) {
			expect(control.height, `${control.id} keeps the 44px floor`).toBeGreaterThanOrEqual(
				TARGET,
			);
			expect(control.height, `${control.id} aligns with the input`).toBeCloseTo(
				reference.height,
				1,
			);
			for (const property of /** @type {const} */ ([
				"fontSize",
				"lineHeight",
				"paddingTop",
				"paddingBottom",
				"borderTopWidth",
				"borderBottomWidth",
			])) {
				expect(
					control[property],
					`${control.id} shares ${property}`,
				).toBe(reference[property]);
			}
		}
	});
}

// The second is how much of a textarea you can see before scrolling inside
// it. The user agent opens one at two rows, which is a line and a half of
// a paragraph — so Cirth asks for four. Measured in `lh`, so four rows
// means four rows of this textarea's own text, not of the default type
// scale.
//
// What these tests are really pinning down is where that stops: `rows` is
// the author declaring the height in the markup, and a framework that
// overrules an explicit rows="2" is worse than the default it replaced.

/** @param {import("@playwright/test").Page} page */
const rowsVisible = (page, /** @type {string} */ id) =>
	page.evaluate((name) => {
		const el = document.getElementById(name);
		if (!el) {
			throw new Error(`missing ${name}`);
		}
		const style = getComputedStyle(el);
		const inner =
			el.getBoundingClientRect().height -
			Number.parseFloat(style.paddingTop) -
			Number.parseFloat(style.paddingBottom) -
			Number.parseFloat(style.borderTopWidth) -
			Number.parseFloat(style.borderBottomWidth);
		return inner / Number.parseFloat(style.lineHeight);
	}, id);

/** @param {import("@playwright/test").Page} page */
const renderTextareas = (page) =>
	setContent(page,
		`<style>${css}</style>
		<main class="container">
			<textarea id="default"></textarea>
			<textarea id="two" rows="2"></textarea>
			<textarea id="eight" rows="8"></textarea>
			<textarea id="one" rows="1"></textarea>
			<textarea id="small" style="font-size: 0.75rem"></textarea>
		</main>`,
	);

test("a textarea opens showing four rows instead of two", async ({ page }) => {
	await renderTextareas(page);

	expect(await rowsVisible(page, "default")).toBeCloseTo(4, 1);
});

test("four rows means four rows of the textarea's own text", async ({
	page,
}) => {
	await renderTextareas(page);

	// Smaller type, same number of rows — a shorter box, not a box with
	// more lines crammed into it.
	expect(await rowsVisible(page, "small")).toBeCloseTo(4, 1);
});

test("an explicit rows attribute is left alone", async ({ page }) => {
	await renderTextareas(page);

	// Including rows="2", which is what the browser would have done anyway:
	// the author asking for it must not be overruled by the default that
	// replaced it.
	expect(await rowsVisible(page, "two")).toBeCloseTo(2, 1);
	expect(await rowsVisible(page, "eight")).toBeCloseTo(8, 1);
});

test("a one-row textarea still meets the target size", async ({ page }) => {
	await renderTextareas(page);

	// The floor and the default answer to different things: this one is
	// short because the author said so, and stays clickable regardless.
	expect(await heightOf(page, "one")).toBeGreaterThanOrEqual(TARGET);
});

test(`a nav may be compact, but never below ${TARGET_NAV}px`, async ({
	page,
}) => {
	// `height: auto` is how the nav escapes the input's fixed height, and it
	// cannot escape a min-block-size the same way — so the nav restates the
	// floor at the AA minimum instead of inheriting the AAA one.
	await setContent(page,
		`<style>${css}</style>
		<nav style="font-size: 0.75rem">
			<ul>
				<li><button id="button" type="button">Menu</button></li>
				<li><select id="select"><option>Option</option></select></li>
				<li><input id="text" type="text"></li>
			</ul>
		</nav>`,
	);

	for (const id of ["button", "select", "text"]) {
		const height = await heightOf(page, id);
		expect(height, `${id} clears the AA minimum`).toBeGreaterThanOrEqual(
			TARGET_NAV,
		);
		// And is allowed to stay under the enhanced one: if this ever reaches
		// 44 the nav has quietly stopped being compact, which is a change to
		// argue for rather than to discover.
		expect(height, `${id} stays compact`).toBeLessThan(TARGET);
	}
});

test("the file input's button is not forced past the input holding it", async ({
	page,
}) => {
	// ::file-selector-button is matched by the same selector list as every
	// other button, and giving it the 44px floor made it taller than the
	// content box of the 44px input it lives in, so it spilled out. The
	// target here is the input — that is what the pointer is aimed at, and
	// it meets the size on its own; the pseudo-element is a part of it.
	await setContent(page,
		`<style>${css}</style><main class="container"><input id="file" type="file"></main>`,
	);

	const { height, scrollHeight } = await page.evaluate(() => {
		const el = document.getElementById("file");
		if (!el) {
			throw new Error("missing file input");
		}
		return {
			height: el.getBoundingClientRect().height,
			scrollHeight: el.scrollHeight,
		};
	});

	expect(height, "the input is the target and meets the size").toBeGreaterThanOrEqual(
		TARGET,
	);
	expect(scrollHeight, "and nothing overflows it").toBeLessThanOrEqual(
		Math.ceil(height),
	);
});
