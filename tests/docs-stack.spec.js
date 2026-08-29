const { expect, test } = require("@playwright/test");
const {
	assertDocsBuilt,
	createServer,
	startServer,
} = require("../scripts/lib/docs-site");

assertDocsBuilt("docs-stack.spec");

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

test("homepage prioritizes authentic output before mechanism and source on mobile", async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto(`${origin}/`, { waitUntil: "networkidle" });

	const output = page.locator(".docs-output-panel");
	const mechanism = page.locator(".docs-mechanism");
	const source = page.locator(".docs-source-panel");
	await expect(output).toHaveCount(1);
	await expect(source.locator("[data-lab-source]")).toContainText(
		'<main class="container">',
	);

	const order = await Promise.all(
		[output, mechanism, source].map((locator) =>
			locator.evaluate((element) => Number(getComputedStyle(element).order)),
		),
	);
	expect(order).toEqual([1, 2, 3]);

	const frame = page.frameLocator("[data-lab-frame]");
	await expect(frame.getByRole("heading", { name: "Sign in" })).toBeVisible();
	await page.locator("[data-lab-build]").selectOption("classless");
	await expect(page.locator("[data-lab-frame]")).toHaveAttribute(
		"src",
		/classless/,
	);
	await expect(
		frame.locator('link[rel="stylesheet"]'),
	).toHaveAttribute("href", /cirth-lab-classless\.css/);
});
