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

test("the dropdown menu settles with opacity and transform", async ({ page }) => {
	await page.emulateMedia({ reducedMotion: "no-preference" });
	await page.goto(`${origin}/components/dropdown/`, { waitUntil: "networkidle" });
	const dropdown = page.locator(".docs-demo-preview details.dropdown").first();

	const transitions = await dropdown.evaluate(async (element) => {
		const menu = element.querySelector(":scope > ul");
		if (!(menu instanceof HTMLElement)) throw new Error("missing dropdown menu");
		/** @type {HTMLDetailsElement} */ (element).open = true;
		for (let frame = 0; frame < 10; frame++) {
			await new Promise((resolve) => requestAnimationFrame(resolve));
			const running = menu
				.getAnimations()
				.filter((animation) => animation instanceof CSSTransition)
				.map((animation) => /** @type {CSSTransition} */ (animation).transitionProperty);
			if (running.length > 0) return running;
		}
		return [];
	});

	expect(transitions).toContain("opacity");
	expect(transitions).toContain("transform");
});

test("the dropdown menu is immediate under reduced motion", async ({ page }) => {
	await page.goto(`${origin}/components/dropdown/`, { waitUntil: "networkidle" });
	const dropdown = page.locator(".docs-demo-preview details.dropdown").first();
	const state = await dropdown.evaluate(async (element) => {
		const menu = element.querySelector(":scope > ul");
		if (!(menu instanceof HTMLElement)) throw new Error("missing dropdown menu");
		/** @type {HTMLDetailsElement} */ (element).open = true;
		await new Promise((resolve) => requestAnimationFrame(resolve));
		await new Promise((resolve) => requestAnimationFrame(resolve));
		const transform = new DOMMatrixReadOnly(getComputedStyle(menu).transform);
		return {
			animations: menu.getAnimations().length,
			opacity: getComputedStyle(menu).opacity,
			scaleX: transform.a,
			y: transform.m42,
		};
	});

	expect(state).toEqual({ animations: 0, opacity: "1", scaleX: 1, y: 0 });
});
