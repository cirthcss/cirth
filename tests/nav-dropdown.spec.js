const { expect, test } = require("@playwright/test");
const {
	assertDocsBuilt,
	createServer,
	startServer,
} = require("../scripts/lib/docs-site");

assertDocsBuilt("nav-dropdown.spec");

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

test("an open nav dropdown menu matches its trigger width", async ({ page }) => {
	await page.goto(`${origin}/components/dropdown/`, { waitUntil: "networkidle" });

	const dropdown = page
		.locator(".docs-demo-preview nav details.dropdown")
		.first();
	const summary = dropdown.locator(":scope > summary");
	const menu = dropdown.locator(":scope > ul");
	await dropdown.evaluate((element) => {
		/** @type {HTMLDetailsElement} */ (element).open = true;
	});

	const summaryBox = await summary.boundingBox();
	const menuBox = await menu.boundingBox();
	if (!summaryBox || !menuBox) {
		throw new Error("nav dropdown trigger and open menu should be rendered");
	}
	expect(
		Math.abs(menuBox.x - summaryBox.x),
		"the menu should align with the trigger's inline start",
	).toBeLessThan(0.5);
	expect(
		Math.abs(menuBox.width - summaryBox.width),
		"the menu should match the trigger width",
	).toBeLessThan(0.5);
});
