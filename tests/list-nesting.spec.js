const fs = require("node:fs");
const path = require("node:path");
const { expect, test } = require("@playwright/test");

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

	await page.setContent(
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

	test(`top-level lists keep their spacing (${build.name} build)`, async ({
		page,
	}) => {
		await render(page, build);

		const paragraph = await marginsOf(page, "lead");

		for (const id of ["top-level-ul", "top-level-ol"]) {
			const margins = await marginsOf(page, id);
			expect(margins.top, `${id} top margin`).toBe("0px");
			expect(margins.bottom, `${id} bottom margin`).toBe(paragraph.bottom);
		}
	});

	test(`a nested list sits closer to its parent item than a top-level list does to the next block (${build.name} build)`, async ({
		page,
	}) => {
		await render(page, build);

		const nested = await marginsOf(page, "ul-in-ul");
		const topLevel = await marginsOf(page, "top-level-ul");

		expect(Number.parseFloat(nested.top)).toBeLessThan(
			Number.parseFloat(topLevel.bottom),
		);
	});
}
