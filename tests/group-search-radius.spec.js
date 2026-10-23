const fs = require("node:fs");
const path = require("node:path");
const { expect, test } = require("@playwright/test");
const { setContent } = require("./helpers/render");

// gh#69: inside a generic group a search field is one segment of a shared
// shape. Its exposed corners used to stay pill-round against the group's
// square ones, focus included. Search no longer has a pill of its own
// (specs/radius-relations.md), so the search group and a search field in
// any group are shaped exactly like a text group.

const projectRoot = path.join(__dirname, "..");

const builds = [
	{ file: "dist/cirth.css", name: "default", scope: "" },
	{ file: "dist/cirth.classless.css", name: "classless", scope: "" },
	{ file: "dist/cirth.scoped.css", name: "scoped", scope: "cirth" },
];

/** @param {string} name */
const groupAttributes = (name) =>
	name === "classless" ? 'role="group"' : 'class="group" role="group"';

/** @param {string} name */
const markup = (name) => `
	<div id="generic-group" ${groupAttributes(name)}>
		<input id="generic-search" type="search" aria-label="Search">
		<button type="submit">Search</button>
	</div>

	<div id="reference-group" ${groupAttributes(name)}>
		<input id="reference-text" type="text" aria-label="Value">
		<button type="submit">Save</button>
	</div>

	<form id="search-group" role="search">
		<input id="search-field" type="search" aria-label="Search">
		<button type="submit">Search</button>
	</form>

	<input id="standalone-search" type="search" aria-label="Search">
`;

/**
 * @param {import("@playwright/test").Page} page
 * @param {{ file: string, name: string, scope: string }} build
 */
const render = async (page, build) => {
	const stylesheet = path.join(projectRoot, build.file);

	if (!fs.existsSync(stylesheet)) {
		throw new Error(
			`group-search-radius.spec: ${build.file} not found: run \`npm run build\` first.`,
		);
	}

	const content = markup(build.name);

	await setContent(page,
		build.scope ? `<div class="${build.scope}">${content}</div>` : content,
	);
	await page.addStyleTag({ path: stylesheet });
};

/** @param {import("@playwright/test").Locator} locator */
const radiiOf = (locator) =>
	locator.evaluate((element) => {
		const style = getComputedStyle(element);
		return {
			endEnd: style.borderEndEndRadius,
			endStart: style.borderEndStartRadius,
			startEnd: style.borderStartEndRadius,
			startStart: style.borderStartStartRadius,
		};
	});

for (const build of builds) {
	for (const colorScheme of /** @type {const} */ (["light", "dark"])) {
		test(`a search field inside a generic group matches the group's radius (${build.name} build, ${colorScheme})`, async ({
			page,
		}) => {
			await page.emulateMedia({ colorScheme });
			await render(page, build);

			const search = await radiiOf(page.locator("#generic-search"));
			const reference = await radiiOf(page.locator("#reference-text"));

			expect(search.startStart).toBe(reference.startStart);
			expect(search.endStart).toBe(reference.endStart);

			// Inner corners stay squared off against the button beside it.
			expect(search.startEnd).toBe("0px");
			expect(search.endEnd).toBe("0px");
		});

		test(`the search group is shaped like a text group (${build.name} build, ${colorScheme})`, async ({
			page,
		}) => {
			await page.emulateMedia({ colorScheme });
			await render(page, build);

			const grouped = await radiiOf(page.locator("#search-field"));
			const standalone = await radiiOf(page.locator("#standalone-search"));
			const reference = await radiiOf(page.locator("#reference-text"));
			const outer = await radiiOf(page.locator("#search-group"));
			const referenceOuter = await radiiOf(page.locator("#reference-group"));

			expect(grouped).toEqual(reference);
			expect(outer).toEqual(referenceOuter);
			expect(standalone.startStart).toBe(reference.startStart);
			expect(standalone.endEnd).toBe(reference.startStart);
		});
	}

	test(`the focused search field keeps the group's radius (${build.name} build)`, async ({
		page,
	}) => {
		await render(page, build);

		await page.locator("#generic-search").focus();

		const focused = await radiiOf(page.locator("#generic-search"));
		const reference = await radiiOf(page.locator("#reference-text"));

		expect(focused.startStart).toBe(reference.startStart);
		expect(focused.endStart).toBe(reference.endStart);
	});
}
