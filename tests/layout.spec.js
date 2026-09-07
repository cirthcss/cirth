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
