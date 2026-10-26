const fs = require("node:fs");
const path = require("node:path");
const { expect, test } = require("@playwright/test");
const { setContent } = require("./helpers/render");

const projectRoot = path.join(__dirname, "..");

/** @param {string} file */
const read = (file) => {
	const stylesheet = path.join(projectRoot, file);

	if (!fs.existsSync(stylesheet)) {
		throw new Error(
			`layout.spec: ${file} not found: run \`npm run build\` first.`,
		);
	}

	return fs.readFileSync(stylesheet, "utf8");
};

const css = read("dist/cirth.css");

/**
 * @param {import("@playwright/test").Page} page
 * @param {string} markup
 * @param {string} [stylesheet]
 */
const render = (page, markup, stylesheet = css) =>
	setContent(page, `<style>${stylesheet}</style>${markup}`);

/**
 * @param {import("@playwright/test").Page} page
 * @param {string[]} ids
 */
const boxes = (page, ids) =>
	page.evaluate((requestedIds) => {
		/** @type {Record<string, { left: number, width: number }>} */
		const result = {};

		for (const id of requestedIds) {
			const element = document.getElementById(id);
			if (!element) {
				throw new Error(`missing #${id}`);
			}
			const rect = element.getBoundingClientRect();
			result[id] = { left: rect.left, width: rect.width };
		}

		return result;
	}, ids);

test("container content and breakout follow the named tracks", async ({
	page,
}) => {
	await render(
		page,
		`<main
			id="container"
			class="container"
			style="width: 1200px; --cirth-container-gutter: 32px; --cirth-container-max-width: 960px"
		>
			<div id="content">Content</div>
			<div id="full" class="breakout">Breakout</div>
		</main>`,
	);

	const { container, content, full } = await boxes(page, [
		"container",
		"content",
		"full",
	]);

	expect(content.width).toBe(960);
	expect(content.left - container.left).toBe(120);
	expect(full.width).toBe(container.width);
	expect(full.left).toBe(container.left);
});

test("container-fluid gives only the gutter tracks to its sides", async ({
	page,
}) => {
	await render(
		page,
		`<main
			id="container"
			class="container-fluid"
			style="width: 1200px; --cirth-container-gutter: 32px"
		>
			<div id="content">Content</div>
		</main>`,
	);

	const { container, content } = await boxes(page, ["container", "content"]);

	expect(content.width).toBe(1136);
	expect(content.left - container.left).toBe(32);
});

test("the default gutter follows a nested container, not the viewport", async ({
	page,
}) => {
	await render(
		page,
		`<aside style="width: 400px">
			<div id="container" class="container-fluid">
				<div id="content">Content</div>
			</div>
		</aside>`,
	);

	const { container, content } = await boxes(page, ["container", "content"]);

	expect(content.width).toBe(368);
	expect(content.left - container.left).toBe(16);
});

test("breakout does not leak into an unrelated grid", async ({ page }) => {
	await render(
		page,
		`<div
			id="grid"
			class="grid"
			style="width: 400px; --cirth-grid-min-column: 100px"
		>
			<div id="item" class="breakout">One</div>
			<div>Two</div>
			<div>Three</div>
		</div>`,
	);

	const { grid, item } = await boxes(page, ["grid", "item"]);

	expect(item.width).toBeLessThan(grid.width / 2);
});

test("the classless landmarks use the same content tracks and gutter token", async ({
	page,
}) => {
	await render(
		page,
		`<main
			id="container"
			style="width: 1200px; --cirth-container-gutter: 32px; --cirth-container-max-width: 960px"
		>
			<div id="content">Content</div>
		</main>`,
		read("dist/cirth.classless.css"),
	);

	const { container, content } = await boxes(page, ["container", "content"]);

	expect(content.width).toBe(960);
	expect(content.left - container.left).toBe(120);
});

test("the scoped build keeps the same layout contract inside its root", async ({
	page,
}) => {
	await render(
		page,
		`<div class="cirth">
			<main
				id="container"
				class="container"
				style="width: 1200px; --cirth-container-gutter: 32px; --cirth-container-max-width: 960px"
			>
				<div id="content">Content</div>
				<div id="full" class="breakout">Breakout</div>
			</main>
		</div>`,
		read("dist/cirth.scoped.css"),
	);

	const { container, content, full } = await boxes(page, [
		"container",
		"content",
		"full",
	]);

	expect(content.width).toBe(960);
	expect(content.left - container.left).toBe(120);
	expect(full.width).toBe(container.width);
});

// --- .grid and .row (specs/grid-and-row.md) -----------------------------

/**
 * The children of #layout, grouped by line: the width of each child, line by
 * line, rounded to the pixel.
 *
 * @param {import("@playwright/test").Page} page
 */
const lines = (page) =>
	page.evaluate(() => {
		const layout = /** @type {HTMLElement} */ (document.getElementById("layout"));
		/** @type {Map<number, number[]>} */
		const byTop = new Map();
		for (const child of layout.children) {
			const box = child.getBoundingClientRect();
			const top = Math.round(box.top);
			byTop.set(top, [...(byTop.get(top) ?? []), Math.round(box.width)]);
		}
		return [...byTop.values()];
	});

/** @param {number} count */
const cards = (count) => "<article>Card</article>".repeat(count);

// A collection of cards: columns of at least 16rem (256px), never more than
// three, aligned from row to row. Widths are the layout's own, so the
// container's gutters do not enter the numbers.
for (const [width, expected] of /** @type {const} */ ([
	[300, [[300], [300], [300], [300], [300]]],
	[600, [[292, 292], [292, 292], [292]]],
	[960, [[309, 309, 309], [309, 309]]],
	[1400, [[456, 456, 456], [456, 456]]],
])) {
	test(`grid: five cards at ${width}px, at most three columns of at least 16rem`, async ({ page }) => {
		await render(page, `<div id="layout" class="grid" style="width: ${width}px">${cards(5)}</div>`);
		expect(await lines(page)).toEqual(expected);
	});
}

test("grid: fewer cards than columns share the row", async ({ page }) => {
	await render(page, `<div id="layout" class="grid" style="width: 960px">${cards(2)}</div>`);
	expect(await lines(page)).toEqual([[472, 472]]);
});

test("grid: one grid can take a smaller minimum and more columns", async ({ page }) => {
	await render(
		page,
		`<div id="layout" class="grid" style="width: 960px; --cirth-grid-min-column: 8rem; --cirth-grid-max-columns: 6">${cards(6)}</div>`,
	);
	expect(await lines(page)).toEqual([[147, 147, 147, 147, 147, 147]]);
});

test("grid: span-full means nothing in a grid", async ({ page }) => {
	await render(
		page,
		`<div id="layout" class="grid" style="width: 960px"><article>One</article><article class="span-full">Two</article><article>Three</article></div>`,
	);
	expect(await lines(page)).toEqual([[309, 309, 309]]);
});

// A line of fields or controls: every child grows from 12rem (192px), all
// equally, the line always fills, and .span-full takes a line of its own.
/** @param {number} count */
const fields = (count) =>
	Array.from({ length: count }, (_, index) => `<label>Field ${index + 1}<input></label>`).join("");
const notes = `<label class="span-full">Notes<textarea></textarea></label>`;

for (const dir of /** @type {const} */ (["ltr", "rtl"])) {
	for (const [label, markup, width, expected] of /** @type {const} */ ([
		["two fields and notes, wide", fields(2) + notes, 960, [[472, 472], [960]]],
		["three fields and notes, wide", fields(3) + notes, 960, [[309, 309, 309], [960]]],
		["three fields and notes, medium", fields(3) + notes, 500, [[242, 242], [500], [500]]],
		["three fields and notes, narrow", fields(3) + notes, 300, [[300], [300], [300], [300]]],
		["seven controls, wide", fields(7), 960, [[228, 228, 228, 228], [309, 309, 309]]],
	])) {
		test(`row (${dir}): ${label} fill every line`, async ({ page }) => {
			await render(page, `<div dir="${dir}"><div id="layout" class="row" style="width: ${width}px">${markup}</div></div>`);
			expect(await lines(page)).toEqual(expected);
		});
	}
}

test("row: a line starts at the inline start, also right to left", async ({ page }) => {
	await render(
		page,
		`<div dir="rtl"><div id="layout" class="row" style="width: 960px">${fields(2)}</div></div>`,
	);
	const edges = await page.evaluate(() => {
		const layout = /** @type {HTMLElement} */ (document.getElementById("layout"));
		const first = /** @type {HTMLElement} */ (layout.firstElementChild);
		return { layout: layout.getBoundingClientRect().right, first: first.getBoundingClientRect().right };
	});
	expect(edges.first).toBeCloseTo(edges.layout, 0);
});

test("row: long content does not widen its line", async ({ page }) => {
	await render(
		page,
		`<div id="layout" class="row" style="width: 320px"><p>${"unbroken".repeat(40)}</p><p>Short</p></div>`,
	);
	const widths = await lines(page);
	for (const line of widths) {
		for (const width of line) expect(width).toBeLessThanOrEqual(320);
	}
});

test("grid and row are classes, so the classless builds have neither", () => {
	for (const file of ["dist/cirth.classless.css", "dist/cirth.classless.scoped.css"]) {
		const source = read(file);
		expect(source, file).not.toMatch(/\.grid\b|\.row\b|span-full/);
	}
	expect(read("dist/cirth.scoped.css")).toContain(".cirth .row > .span-full");
});
