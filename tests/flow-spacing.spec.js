const fs = require("node:fs");
const path = require("node:path");
const { expect, test } = require("@playwright/test");
const { setContent } = require("./helpers/render");

// Three structural defaults, asserted as relationships rather than as
// numbers: what a disclosure puts between its trigger and its panel, what
// a card's header band does with a heading inside it, and where a
// disclosure draws its focus ring. All three were found from the
// documentation home page and all three were fixed in the library,
// because all three are wrong in any page that uses the component — so
// they are pinned here, against the compiled stylesheet, with no
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
	setContent(page, `<style>${css}</style><main>${markup}</main>`);

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

	test(`${build}: a focused disclosure keeps its ring clear of the trigger text`, async ({
		page,
	}) => {
		await render(
			page,
			css,
			`<details open>
				<summary id="trigger">Do I need to write any JavaScript?</summary>
				<p id="panel">No.</p>
			</details>`,
		);

		// Tab, not .focus(): :focus-visible is the state being measured, and
		// only a keyboard interaction is guaranteed to produce it.
		await page.keyboard.press("Tab");

		const measured = await page.evaluate(() => {
			const summary = /** @type {HTMLElement} */ (
				document.getElementById("trigger")
			);
			if (document.activeElement !== summary) {
				throw new Error("Tab did not reach the summary");
			}
			const style = getComputedStyle(summary);
			const box = summary.getBoundingClientRect();
			const offset = Number.parseFloat(style.outlineOffset);
			const width = Number.parseFloat(style.outlineWidth);

			// The ring is the border box grown by the offset; the glyphs are
			// wherever the text actually starts, which is not the same edge.
			const range = document.createRange();
			range.selectNodeContents(summary);
			const ink = range.getBoundingClientRect();

			const panelRange = document.createRange();
			panelRange.selectNodeContents(
				/** @type {HTMLElement} */ (document.getElementById("panel")),
			);

			return {
				width,
				offset,
				style: style.outlineStyle,
				// Positive: the ring is outside the glyph. Negative: over it.
				inlineClearance: ink.left - (box.left - offset),
				blockClearance: ink.top - (box.top - offset),
				triggerInkLeft: ink.left,
				panelInkLeft: panelRange.getBoundingClientRect().left,
			};
		});

		// A real ring, not a transparent forced-colors placeholder.
		expect(measured.style).toBe("solid");
		expect(measured.width).toBeGreaterThan(0);

		// The defect this pins: a summary has no inline padding, so the
		// border box and the first glyph share an edge and an inset ring was
		// drawn straight over the text. The ring has to sit outside it by at
		// least its own width, on both axes, or it reads as underlining the
		// first character rather than enclosing the row.
		expect(measured.offset).toBeGreaterThan(0);
		expect(measured.inlineClearance).toBeGreaterThanOrEqual(measured.width);
		expect(measured.blockClearance).toBeGreaterThanOrEqual(measured.width);

		// And the clearance is bought with the offset, not with inline
		// padding on the summary: a padded trigger would buy the same gap
		// and cost the alignment that makes a disclosure read as one thing,
		// indenting the question away from its own answer.
		expect(measured.triggerInkLeft).toBeCloseTo(measured.panelInkLeft, 1);
	});

	test(`${build}: a disclosure marker points at what opening will reveal`, async ({
		page,
	}) => {
		await render(
			page,
			css,
			`<details id="shut"><summary>Closed</summary><p>Panel.</p></details>
			<details id="open" open><summary>Open</summary><p>Panel.</p></details>`,
		);

		const measured = await page.evaluate(() => {
			/** @param {string} id */
			const marker = (id) => {
				const summary = /** @type {HTMLElement} */ (
					document.querySelector(`#${id} > summary`)
				);
				const style = getComputedStyle(summary, "::after");
				const matrix = new DOMMatrixReadOnly(style.transform);
				// The rotation the matrix encodes, in degrees, normalised to
				// [0, 360). Read off the matrix rather than the declaration so
				// this holds however the transform is written.
				const degrees =
					((Math.atan2(matrix.b, matrix.a) * 180) / Math.PI + 360) % 360;
				return {
					degrees: Math.round(degrees),
					transition: style.transitionProperty,
				};
			};
			return { shut: marker("shut"), open: marker("open") };
		});

		// Closed, the chevron points down — at the panel that is about to
		// appear. It used to rest at -90deg, pointing along the row at
		// nothing, and swing to 0 on open: the closed state said "more this
		// way" and the open state said "more below" about content that was
		// already below.
		expect(measured.shut.degrees).toBe(0);

		// Open, a half turn: it points back at the trigger that closes it.
		expect(measured.open.degrees).toBe(180);

		// And it turns rather than jumping.
		expect(measured.shut.transition).toContain("transform");
	});
}
