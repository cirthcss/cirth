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

// --- .span-full (specs/grid-span-full.md) ---------------------------------

// A direct child of .grid crosses every column, however many the container
// fits, and nothing else changes: not its siblings, not a grid nested in it,
// not a .row, not an element outside a grid.
for (const [label, width, dir] of /** @type {const} */ ([
	["wide", 1200, "ltr"],
	["wide, right to left", 1200, "rtl"],
	["narrow", 300, "ltr"],
])) {
	test(`span-full crosses every column of a .grid (${label})`, async ({
		page,
	}) => {
		await render(
			page,
			`<div dir="${dir}">
				<div id="grid" class="grid" style="width: ${width}px">
					<label id="first">First<input></label>
					<label id="second">Second<input></label>
					<label id="full" class="span-full">Notes<textarea></textarea></label>
					<p id="after">After</p>
				</div>
			</div>`,
		);
		const box = await boxes(page, ["grid", "first", "second", "full", "after"]);

		expect(box.full.left).toBeCloseTo(box.grid.left, 0);
		expect(box.full.width).toBeCloseTo(box.grid.width, 0);
		// The short fields share the row the full child does not take.
		if (width > 600) {
			expect(box.first.width + box.second.width).toBeLessThan(box.grid.width);
			expect(box.first.width).toBeCloseTo(box.second.width, 0);
		}
	});
}

test("span-full does not overflow the grid with long content", async ({
	page,
}) => {
	await render(
		page,
		`<div id="grid" class="grid" style="width: 320px">
			<p id="full" class="span-full">${"unbroken".repeat(40)}</p>
		</div>`,
	);
	const measured = await page.evaluate(() => {
		const grid = /** @type {HTMLElement} */ (document.getElementById("grid"));
		const full = /** @type {HTMLElement} */ (document.getElementById("full"));
		return {
			gridWidth: grid.getBoundingClientRect().width,
			fullWidth: full.getBoundingClientRect().width,
		};
	});
	expect(measured.fullWidth).toBeLessThanOrEqual(measured.gridWidth + 0.5);
});

test("span-full means nothing outside a direct child of .grid", async ({
	page,
}) => {
	await render(
		page,
		`<div id="grid" class="grid" style="width: 1200px">
			<div id="cell"><div class="grid"><p id="nested" class="span-full">Nested</p><p>Sibling</p></div></div>
			<p>Two</p><p>Three</p>
		</div>
		<div id="row" class="row" style="width: 1200px"><p id="in-row" class="span-full">Row</p><p>Two</p></div>
		<p id="loose" class="span-full">Loose</p>`,
	);
	const columns = await page.evaluate(() =>
		["nested", "in-row", "loose"].map(
			(id) =>
				getComputedStyle(/** @type {Element} */ (document.getElementById(id)))
					.gridColumnStart,
		),
	);
	// A grandchild in its own .grid does span that grid; the outer one never
	// sees it. A .row and a block outside any grid keep the default.
	const box = await boxes(page, ["cell", "nested"]);
	expect(box.nested.width).toBeCloseTo(box.cell.width, 0);
	expect(columns[1]).toBe("auto");
	expect(columns[2]).toBe("auto");
});

test("span-full is a class, so the classless build has no such rule", () => {
	expect(read("dist/cirth.classless.css")).not.toContain("span-full");
	expect(read("dist/cirth.scoped.css")).toContain(".cirth .grid > .span-full");
});
