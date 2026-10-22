const fs = require("node:fs");
const path = require("node:path");
const { expect, test } = require("@playwright/test");
const { setContent } = require("./helpers/render");

// gh#76 — a nested list gets a small top margin and no bottom margin, so
// the gap before the next parent item matches the rhythm inside the nested
// list itself. The rule existed but weighed nothing (`:where()` on both
// compounds lost to the `dl, ol, ul` type selectors), so this asserts the
// computed values rather than the presence of a declaration, across all
// four nesting combinations and every build variant.

const projectRoot = path.join(__dirname, "..");

const builds = [
	{ file: "dist/cirth.css", name: "default", scope: "" },
	{ file: "dist/cirth.classless.css", name: "classless", scope: "" },
	{ file: "dist/cirth.scoped.css", name: "scoped", scope: "cirth" },
];

const markup = `
	<p id="lead">Lead paragraph</p>
	<ul id="top-level-ul">
		<li>Item</li>
		<li>
			Item with children
			<ul id="ul-in-ul"><li>Child</li></ul>
		</li>
		<li>
			Item with children
			<ol id="ol-in-ul"><li>Child</li></ol>
		</li>
	</ul>
	<ol id="top-level-ol">
		<li>
			Item with children
			<ol id="ol-in-ol"><li>Child</li></ol>
		</li>
		<li>
			Item with children
			<ul id="ul-in-ol"><li>Child</li></ul>
		</li>
	</ol>
`;

/**
 * @param {import("@playwright/test").Page} page
 * @param {{ file: string, scope: string }} build
 */
const render = async (page, build) => {
	const stylesheet = path.join(projectRoot, build.file);

	if (!fs.existsSync(stylesheet)) {
		throw new Error(
			`list-nesting.spec: ${build.file} not found: run \`npm run build\` first.`,
		);
	}

	await setContent(page,
		build.scope ? `<div class="${build.scope}">${markup}</div>` : markup,
	);
	await page.addStyleTag({ path: stylesheet });
};

/** @param {import("@playwright/test").Page} page @param {string} id */
const marginsOf = (page, id) =>
	page.locator(`#${id}`).evaluate((element) => {
		const style = getComputedStyle(element);
		return { bottom: style.marginBottom, top: style.marginTop };
	});

for (const build of builds) {
	test(`nested lists drop their bottom margin (${build.name} build)`, async ({
		page,
	}) => {
		await render(page, build);

		for (const id of ["ul-in-ul", "ol-in-ol", "ol-in-ul", "ul-in-ol"]) {
			const margins = await marginsOf(page, id);
			expect(margins.bottom, `${id} bottom margin`).toBe("0px");
			expect(
				Number.parseFloat(margins.top),
				`${id} top margin`,
			).toBeGreaterThan(0);
		}
	});

	// Since specs/container-owned-flow.md a list carries no margin of its
	// own: the space before it is its relation to the block before it. So
	// the spacing is measured where a reader sees it, between boxes.
	test(`top-level lists keep their spacing (${build.name} build)`, async ({
		page,
	}) => {
		await render(page, build);

		const gaps = await page.evaluate(() => {
			/** @param {string} id */
			const box = (id) =>
				/** @type {HTMLElement} */ (document.getElementById(id)).getBoundingClientRect();
			return {
				paragraphToList: box("top-level-ul").top - box("lead").bottom,
				listToList: box("top-level-ol").top - box("top-level-ul").bottom,
				// Read where the list is: a scoped build declares the knob on
				// its wrapper, not on the root.
				element: Number.parseFloat(
					getComputedStyle(
						/** @type {HTMLElement} */ (document.getElementById("lead")),
					).getPropertyValue("--cirth-spacing"),
				) * 16,
			};
		});

		expect(gaps.paragraphToList).toBeCloseTo(gaps.element, 0);
		expect(gaps.listToList).toBeCloseTo(gaps.element, 0);
	});

	test(`a nested list sits closer to its parent item than a top-level list does to the next block (${build.name} build)`, async ({
		page,
	}) => {
		await render(page, build);

		const gaps = await page.evaluate(() => {
			const nested = /** @type {HTMLElement} */ (document.getElementById("ul-in-ul"));
			const parentItem = /** @type {HTMLElement} */ (nested.parentElement);
			const range = document.createRange();
			range.selectNodeContents(parentItem);
			range.setEndBefore(nested);
			const text = range.getClientRects();
			return {
				nested: nested.getBoundingClientRect().top - text[text.length - 1].bottom,
				topLevel:
					/** @type {HTMLElement} */ (document.getElementById("top-level-ol")).getBoundingClientRect().top -
					/** @type {HTMLElement} */ (document.getElementById("top-level-ul")).getBoundingClientRect().bottom,
			};
		});

		expect(gaps.nested).toBeLessThan(gaps.topLevel);
	});
}
