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

test("homepage cards pin and stack at a mobile viewport", async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto(`${origin}/`, { waitUntil: "networkidle" });

	const cards = page.locator(".docs-stack-card-sticky");
	await expect(cards).toHaveCount(6);

	const initial = await cards.evaluateAll((elements) =>
		elements.slice(0, 2).map((element) => {
			const rect = element.getBoundingClientRect();
			const style = getComputedStyle(element);
			return {
				documentTop: rect.top + window.scrollY,
				height: rect.height,
				position: style.position,
				stickyTop: Number.parseFloat(style.top),
			};
		}),
	);

	for (const card of initial) {
		expect(card.position).toBe("sticky");
	}
	expect(initial[1].stickyTop).toBeGreaterThan(initial[0].stickyTop);

	// Scroll just beyond the second card's sticking point. Both cards must
	// remain pinned at their distinct top offsets, with the second covering
	// most of the first instead of both continuing up in ordinary flow.
	const targetScroll = Math.ceil(
		initial[1].documentTop - initial[1].stickyTop + 1,
	);
	await page.evaluate((top) => {
		window.scrollTo(0, top);
	}, targetScroll);
	await page.evaluate(
		() => new Promise((resolve) => requestAnimationFrame(() => resolve(undefined))),
	);

	const pinned = await cards.evaluateAll((elements) =>
		elements.slice(0, 2).map((element) => element.getBoundingClientRect().top),
	);

	expect(pinned[0]).toBeCloseTo(initial[0].stickyTop, 0);
	expect(pinned[1]).toBeCloseTo(initial[1].stickyTop, 0);
	expect(pinned[1] - pinned[0]).toBeLessThan(initial[0].height);
});
