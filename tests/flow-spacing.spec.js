const fs = require("node:fs");
const path = require("node:path");
const { expect, test } = require("@playwright/test");

// Two structural defaults, asserted as relationships rather than as
// numbers: what a disclosure puts between its trigger and its panel, and
// what a card's header band does with a heading inside it. Both were
// found from the documentation home page and both were fixed in the
// library, because both are wrong in any page that uses the component —
// so both are pinned here, against the compiled stylesheet, with no
// documentation shell anywhere near them.

const projectRoot = path.join(__dirname, "..");

/** @param {string} file */
const read = (file) => {
	const stylesheet = path.join(projectRoot, file);
	if (!fs.existsSync(stylesheet)) {
		throw new Error(
			`flow-spacing.spec: ${file} not found: run \`npm run build\` first.`,
		);
	}
	return fs.readFileSync(stylesheet, "utf8");
};

/** @type {[string, string][]} */
const builds = [
	["default", read("dist/cirth.css")],
	["classless", read("dist/cirth.classless.css")],
];

/**
 * @param {import("@playwright/test").Page} page
 * @param {string} css
 * @param {string} markup
 */
const render = (page, css, markup) =>
	page.setContent(`<style>${css}</style><main>${markup}</main>`);

/**
 * A token read off the element that resolves it. Several of these are
 * rebound per element — every heading level carries its own
 * --cirth-typography-spacing-top — so reading them off the root would
 * compare a measurement against a value nothing on the page uses.
 * @param {import("@playwright/test").Page} page
 * @param {string} selector
 * @param {string} name
 */
const token = (page, selector, name) =>
	page.evaluate(
		({ target, property }) => {
			const element = document.querySelector(target);
			if (!element) throw new Error(`missing ${target}`);
			const value = getComputedStyle(element).getPropertyValue(property);
			if (!value.trim()) throw new Error(`${property} unset on ${target}`);
			return Number.parseFloat(value) * 16;
		},
		{ target: selector, property: name },
	);

for (const [build, css] of builds) {
	test(`${build}: an open disclosure puts its panel one rhythm step under its trigger`, async ({
		page,
	}) => {
		await render(
			page,
			css,
			`<details open>
				<summary id="trigger">A question</summary>
				<p id="panel">An answer.</p>
			</details>`,
		);

		const measured = await page.evaluate(() => {
			const summary = /** @type {HTMLElement} */ (
				document.getElementById("trigger")
			);
			const panel = /** @type {HTMLElement} */ (
				document.getElementById("panel")
			);
			const style = getComputedStyle(summary);
			const summaryBox = summary.getBoundingClientRect();
			return {
				height: summaryBox.height,
				// The summary is padded to reach its touch target, so the gap a
				// reader sees runs from the trigger's *text*, not from its box.
				inkGap:
					panel.getBoundingClientRect().top -
					(summaryBox.bottom - Number.parseFloat(style.paddingBottom)),
			};
		});

		// The panel opens on the same step the framework puts between any two
		// blocks of prose — no more, because the padding that lifts the
		// trigger to its target is not content spacing and must not be
		// counted twice.
		expect(measured.inkGap).toBeCloseTo(
			await token(page, "#panel", "--cirth-typography-spacing-vertical"),
			1,
		);

		// And the step was taken out of the margin, not out of the target.
		expect(measured.height).toBeGreaterThanOrEqual(44);
	});

	test(`${build}: a card's header band does not take document-flow heading spacing`, async ({
		page,
	}) => {
		await render(
			page,
			css,
			`<article id="plain">
				<header><h3 id="alone">Title</h3></header>
				<p>Body</p>
			</article>
			<article id="eyebrowed">
				<header>
					<p id="eyebrow">Section</p>
					<h3 id="after">Title</h3>
				</header>
				<p>Body</p>
			</article>
			<article id="flowing">
				<p id="lead">Body</p>
				<h3 id="inflow">Title</h3>
			</article>`,
		);

		const measured = await page.evaluate(() => {
			/** @param {string} id */
			const box = (id) =>
				/** @type {HTMLElement} */ (
					document.getElementById(id)
				).getBoundingClientRect();
			/** @param {string} id */
			const marginTop = (id) =>
				Number.parseFloat(
					getComputedStyle(
						/** @type {HTMLElement} */ (document.getElementById(id)),
					).marginTop,
				);
			const header = /** @type {HTMLElement} */ (
				document.querySelector("#eyebrowed > header")
			);
			const plainHeader = /** @type {HTMLElement} */ (
				document.querySelector("#plain > header")
			);
			return {
				aloneInset: box("alone").top - plainHeader.getBoundingClientRect().top,
				headerPadding: Number.parseFloat(
					getComputedStyle(plainHeader).paddingTop,
				),
				afterMarginTop: marginTop("after"),
				eyebrowGap: box("after").top - box("eyebrow").bottom,
				eyebrowMarginBottom: Number.parseFloat(
					getComputedStyle(
						/** @type {HTMLElement} */ (document.getElementById("eyebrow")),
					).marginBottom,
				),
				inFlowMarginTop: marginTop("inflow"),
				headerHeight: header.getBoundingClientRect().height,
			};
		});

		// A heading that opens the band sits on the band's own padding.
		expect(measured.aloneInset).toBeCloseTo(measured.headerPadding, 0);

		// A heading that follows something in the band takes no section
		// break: the gap is whatever the element above it already carried.
		expect(measured.afterMarginTop).toBe(0);
		expect(measured.eyebrowGap).toBeCloseTo(measured.eyebrowMarginBottom, 1);

		// Scoped to the band, and to nothing else: the same heading after the
		// same paragraph in the card's *body* is document flow, and still
		// gets the section break the framework gives it everywhere.
		expect(measured.inFlowMarginTop).toBeCloseTo(
			await token(page, "#inflow", "--cirth-typography-spacing-top"),
			1,
		);
	});
}
