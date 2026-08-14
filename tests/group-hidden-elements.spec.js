const { expect, test } = require("@playwright/test");
const {
	assertDocsBuilt,
	createServer,
	startServer,
} = require("../scripts/lib/docs-site");

assertDocsBuilt("group-hidden-elements.spec");

/** @type {import("node:http").Server} */
let server;
/** @type {string} */
let origin;

test.beforeAll(async () => {
	server = createServer();
	origin = await startServer(server);
});

test.afterAll(() => {
	server.close();
});

test.beforeEach(async ({ page }) => {
	await page.goto(`${origin}/components/group/`, { waitUntil: "networkidle" });
	await page.evaluate(() => {
		document.body.innerHTML = `
			<main class="container">
				<form id="search-reference" role="search">
					<input id="search-reference-first" type="search" aria-label="Search">
					<button id="search-reference-last" type="submit">Search</button>
				</form>

				<form id="search-hidden-type-start" role="search">
					<input type="hidden" name="token" value="token">
					<input id="search-after-hidden-type" type="search" aria-label="Search">
					<button type="submit">Search</button>
				</form>

				<form id="search-hidden-attribute-start" role="search">
					<span hidden>Hidden content</span>
					<input id="search-after-hidden-attribute" type="search" aria-label="Search">
					<button type="submit">Search</button>
				</form>

				<form id="search-multiple-hidden-start" role="search">
					<input type="hidden" name="token" value="token">
					<span hidden>Hidden content</span>
					<input type="hidden" name="context" value="context">
					<input id="search-after-multiple-hidden" type="search" aria-label="Search">
					<button type="submit">Search</button>
				</form>

				<form id="search-hidden-type-end" role="search">
					<input type="search" aria-label="Search">
					<button id="search-before-hidden-type" type="submit">Search</button>
					<input type="hidden" name="token" value="token">
				</form>

				<form id="search-hidden-attribute-end" role="search">
					<input type="search" aria-label="Search">
					<button id="search-before-hidden-attribute" type="submit">Search</button>
					<span hidden>Hidden content</span>
				</form>

				<form id="search-multiple-hidden-end" role="search">
					<input type="search" aria-label="Search">
					<button id="search-before-multiple-hidden" type="submit">Search</button>
					<input type="hidden" name="token" value="token">
					<span hidden>Hidden content</span>
					<input type="hidden" name="context" value="context">
				</form>

				<fieldset id="group-reference" class="group" role="group">
					<input id="group-reference-first" type="text" aria-label="Value">
					<button id="group-reference-last" type="button">Save</button>
				</fieldset>

				<fieldset id="group-hidden-boundaries" class="group" role="group">
					<input type="hidden" name="token" value="token">
					<span hidden>Hidden content</span>
					<input id="group-first-visible" type="text" aria-label="Value">
					<button id="group-last-visible" type="button">Save</button>
					<input type="hidden" name="context" value="context">
					<span hidden>Hidden content</span>
				</fieldset>
			</main>
		`;
	});
	await page.addStyleTag({
		content: "*,*::before,*::after{animation:none!important;transition:none!important}",
	});
});

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

test("search groups ignore hidden elements before the first visible control", async ({
	page,
}) => {
	const reference = await radiiOf(page.locator("#search-reference-first"));

	for (const selector of [
		"#search-after-hidden-type",
		"#search-after-hidden-attribute",
		"#search-after-multiple-hidden",
	]) {
		const actual = await radiiOf(page.locator(selector));
		expect(actual.startStart).toBe(reference.startStart);
		expect(actual.endStart).toBe(reference.endStart);
	}
});

test("search groups ignore hidden elements after the last visible control", async ({
	page,
}) => {
	const reference = await radiiOf(page.locator("#search-reference-last"));

	for (const selector of [
		"#search-before-hidden-type",
		"#search-before-hidden-attribute",
		"#search-before-multiple-hidden",
	]) {
		const actual = await radiiOf(page.locator(selector));
		expect(actual.startEnd).toBe(reference.startEnd);
		expect(actual.endEnd).toBe(reference.endEnd);
	}
});

test("regular groups use the same visible boundary calculation", async ({ page }) => {
	const referenceFirst = await radiiOf(page.locator("#group-reference-first"));
	const referenceLast = await radiiOf(page.locator("#group-reference-last"));
	const actualFirst = await radiiOf(page.locator("#group-first-visible"));
	const actualLast = await radiiOf(page.locator("#group-last-visible"));

	expect(actualFirst.startStart).toBe(referenceFirst.startStart);
	expect(actualFirst.endStart).toBe(referenceFirst.endStart);
	expect(actualLast.startEnd).toBe(referenceLast.startEnd);
	expect(actualLast.endEnd).toBe(referenceLast.endEnd);
});
