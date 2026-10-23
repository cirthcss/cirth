const fs = require("node:fs");
const path = require("node:path");
const { expect, test } = require("@playwright/test");
const { setContent } = require("./helpers/render");

// Three structural defaults, asserted as relationships rather than as
// numbers: what a disclosure puts between its trigger and its panel, what
// a card's header band does with a heading inside it, and where a
// disclosure draws its focus ring. All three were found from the
// documentation home page and all three were fixed in the library,
// because all three are wrong in any page that uses the component, so
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
 * A length token, resolved in pixels next to the element that reads it.
 * The flow steps are calc() relations of --cirth-spacing, so the raw token
 * text is not a number: a probe beside the element lets the browser do
 * the arithmetic, in the same inheritance context.
 * @param {import("@playwright/test").Page} page
 * @param {string} selector
 * @param {string} name
 */
const token = (page, selector, name) =>
	page.evaluate(
		({ target, property }) => {
			const element = document.querySelector(target);
			if (!element) throw new Error(`missing ${target}`);
			if (!getComputedStyle(element).getPropertyValue(property).trim()) {
				throw new Error(`${property} unset on ${target}`);
			}
			const probe = document.createElement("div");
			probe.style.marginTop = `var(${property})`;
			probe.style.display = "block";
			element.after(probe);
			const value = Number.parseFloat(getComputedStyle(probe).marginTop);
			probe.remove();
			return value;
		},
		{ target: selector, property: name },
	);

for (const [build, css] of builds) {
	test(`${build}: top-level sections get a chapter beat without opening nested regions`, async ({
		page,
	}) => {
		await render(
			page,
			css,
			`<section><h2>First chapter</h2><section id="nested">Nested region</section></section>
			<section id="chapter"><h2>Second chapter</h2></section>`,
		);

		const measured = await page.evaluate(() => {
			const chapter = document.getElementById("chapter");
			const nested = document.getElementById("nested");
			if (!chapter || !nested) throw new Error("section fixtures are unavailable");

			return {
				chapter: Number.parseFloat(getComputedStyle(chapter).marginTop),
				nested: Number.parseFloat(getComputedStyle(nested).marginTop),
			};
		});

		// The chapter step between the top-level sections of <main>; a
		// nested region directly under its heading takes the line that binds
		// anything to the heading above it (specs/container-owned-flow.md).
		expect(measured.chapter).toBeCloseTo(
			await token(page, "#chapter", "--cirth-flow-chapter"),
			1,
		);
		expect(measured.nested).toBeCloseTo(
			await token(page, "#nested", "--cirth-flow-line"),
			1,
		);
	});

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
		// blocks of prose, and no more, because the padding that lifts the
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
		// break: the band is a group, so the heading sits a line under what
		// precedes it, and nothing else carries a margin.
		const line = await token(page, "#after", "--cirth-flow-line");
		expect(measured.afterMarginTop).toBeCloseTo(line, 1);
		expect(measured.eyebrowMarginBottom).toBe(0);
		expect(measured.eyebrowGap).toBeCloseTo(line, 1);

		// Scoped to the band, and to nothing else: the same heading after the
		// same paragraph in the card's *body* is document flow, and still
		// gets the group step the framework gives an h3 everywhere.
		expect(measured.inFlowMarginTop).toBeCloseTo(
			await token(page, "#inflow", "--cirth-flow-group"),
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

		// Closed, the chevron points down, at the panel that is about to
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

// --- The relation table (specs/container-owned-flow.md) ----------------

// Nothing carries a margin of its own: the space between two siblings is
// one step of the flow scale, picked by what the two are to each other.
// Measured between rendered boxes, where a reader sees it, at the width a
// phone gives a stacked form.
for (const [build, css] of builds) {
	test(`${build}: every relation measures its step, and the steps rise`, async ({
		page,
	}) => {
		await page.setViewportSize({ width: 390, height: 900 });
		await render(
			page,
			css,
			`<section id="s1">
				<p id="p0">Before the heading.</p>
				<h2 id="h2">Heading</h2>
				<p id="p1">One.</p>
				<p id="p2">Two.</p>
				<ul><li id="li1">One</li><li id="li2">Two</li></ul>
				<h3 id="h3">Title</h3>
				<form>
					<fieldset id="fs1">
						<legend>Group</legend>
						<label id="l1">Name<input id="i1"></label>
						<label id="l2">Email<input id="i2"></label>
					</fieldset>
					<fieldset id="fs2">
						<legend>Grid</legend>
						<div class="grid" id="grid"><label id="g1">A<input id="gi1"></label><label id="g2">B<input id="gi2"></label><label id="g3">C<input id="gi3"></label></div>
					</fieldset>
					<button id="b1" type="submit">Send</button> <button id="b2" type="button">Other</button>
				</form>
			</section>
			<section id="s2"><p>Next part.</p></section>`,
		);

		const gaps = await page.evaluate(() => {
			/** @param {string} id */
			const box = (id) =>
				/** @type {HTMLElement} */ (document.getElementById(id)).getBoundingClientRect();
			/** @param {string} a @param {string} b */
			const gap = (a, b) => box(b).top - box(a).bottom;
			return {
				line: gap("h2", "p1"),
				element: gap("p1", "p2"),
				listItem: gap("li1", "li2"),
				group: gap("fs1", "fs2"),
				titleAfterBlock: gap("li2", "h3"),
				section: gap("p0", "h2"),
				chapter: gap("s1", "s2"),
				stacked: [gap("i1", "l2")],
				gridStacked: [gap("gi1", "g2"), gap("gi2", "g3")],
				buttonsShareALine: box("b2").top - box("b1").top,
			};
		});

		const scale = [gaps.line, gaps.element, gaps.group, gaps.section, gaps.chapter];
		for (let index = 1; index < scale.length; index++) {
			expect(scale[index], `step ${index} is larger than the one below`).toBeGreaterThan(
				scale[index - 1],
			);
		}
		expect(gaps.listItem).toBeCloseTo(gaps.line, 0);
		expect(gaps.titleAfterBlock).toBeCloseTo(gaps.group, 0);

		// Stacked fields are equal to a pixel, in a grid or out of one, and a
		// group of fields is further from the next group than a field is
		// from the next field.
		for (const stacked of [...gaps.stacked, ...gaps.gridStacked]) {
			expect(Math.abs(stacked - gaps.element)).toBeLessThanOrEqual(1);
		}
		expect(gaps.group).toBeGreaterThan(gaps.element);
		expect(gaps.buttonsShareALine).toBe(0);
	});
}
