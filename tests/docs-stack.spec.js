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

test("homepage keeps the source and authentic output comparison focused on mobile", async ({
	page,
}) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto(`${origin}/`, { waitUntil: "networkidle" });

	const output = page.locator(".docs-output-panel");
	const source = page.locator(".docs-source-panel");
	await expect(output).toHaveCount(1);
	await expect(page.locator(".docs-mechanism")).toHaveCount(0);
	await expect(page.locator(".docs-figure-caption")).toHaveCount(0);
	await expect(source.locator("[data-lab-source]")).toContainText(
		'<main class="container">',
	);
	await expect(source.locator("[data-lab-source]")).toContainText(
		'<input type="email" name="email" autocomplete="email">',
	);
	await expect(source.locator("[data-lab-source]")).not.toContainText("…");

	const order = await Promise.all(
		[output, source].map((locator) =>
			locator.evaluate((element) => Number(getComputedStyle(element).order)),
		),
	);
	expect(order).toEqual([1, 2]);

	const frame = page.frameLocator("[data-lab-frame]");
	await expect(frame.getByRole("heading", { name: "Sign in" })).toBeVisible();
	await expect(frame.locator("header, footer")).toHaveCount(0);
	await expect(frame.locator("article")).toHaveCount(1);
	await expect(frame.locator("form")).toHaveCount(1);

	const builds = [
		{
			name: "default",
			stylesheet: /cirth-docs\.css/,
			mainClass: "container",
			scoped: false,
		},
		{
			name: "classless",
			stylesheet: /cirth-lab-classless\.css/,
			mainClass: null,
			scoped: false,
		},
		{
			name: "scoped",
			stylesheet: /cirth-lab-scoped\.css/,
			mainClass: "container",
			scoped: true,
		},
		{
			name: "scoped-classless",
			stylesheet: /cirth-lab-scoped-classless\.css/,
			mainClass: null,
			scoped: true,
		},
	];
	for (const build of builds) {
		await page.locator("[data-lab-build]").selectOption(build.name);
		await expect(page.locator("[data-lab-frame]")).toHaveAttribute(
			"src",
			new RegExp(`/lab/${build.name}/`),
		);
		await expect(frame.locator('link[rel="stylesheet"]')).toHaveAttribute(
			"href",
			build.stylesheet,
		);
		await expect(frame.locator(".cirth")).toHaveCount(build.scoped ? 1 : 0);
		if (build.mainClass) {
			await expect(frame.locator("main")).toHaveClass(build.mainClass);
		} else {
			await expect(frame.locator("main")).not.toHaveAttribute("class");
		}
	}
});

test("homepage cards and FAQ expose consistent interactive states", async ({
	page,
}) => {
	await page.emulateMedia({ reducedMotion: "no-preference" });
	await page.goto(`${origin}/`, { waitUntil: "networkidle" });

	const card = page.locator(".docs-case").first();
	const shadowBefore = await card.evaluate(
		(element) => getComputedStyle(element).boxShadow,
	);
	await card.hover();
	await page.waitForTimeout(200);
	await expect
		.poll(() => card.evaluate((element) => getComputedStyle(element).transform))
		.not.toBe("none");
	const shadowAfter = await card.evaluate(
		(element) => getComputedStyle(element).boxShadow,
	);
	expect(shadowAfter).not.toBe(shadowBefore);

	const details = page.locator(".docs-native-faq details").first();
	const summary = details.locator("summary");
	const closedWidths = await Promise.all([
		details.evaluate((element) => element.getBoundingClientRect().width),
		summary.evaluate((element) => element.getBoundingClientRect().width),
	]);
	await summary.click();
	const openWidths = await Promise.all([
		details.evaluate((element) => element.getBoundingClientRect().width),
		summary.evaluate((element) => element.getBoundingClientRect().width),
		details
			.locator("p")
			.evaluate((element) => element.getBoundingClientRect().width),
	]);
	expect(new Set([...closedWidths, ...openWidths]).size).toBe(1);

	const nextSummary = page.locator(".docs-native-faq summary").nth(1);
	const backgroundBefore = await nextSummary.evaluate(
		(element) => getComputedStyle(element).backgroundColor,
	);
	await nextSummary.hover();
	await page.waitForTimeout(180);
	const backgroundAfter = await nextSummary.evaluate(
		(element) => getComputedStyle(element).backgroundColor,
	);
	expect(backgroundAfter).not.toBe(backgroundBefore);
});

test("documentation active navigation is angular and fills its row", async ({
	page,
}) => {
	await page.goto(`${origin}/get-started/`, { waitUntil: "networkidle" });
	const active = page.locator('.docs-sidebar a[aria-current="page"]');
	const geometry = await active.evaluate((element) => {
		const style = getComputedStyle(element);
		const marker = getComputedStyle(element, "::before");
		return {
			anchorHeight: element.getBoundingClientRect().height,
			backgroundImage: style.backgroundImage,
			borderRadius: style.borderRadius,
			markerHeight: Number.parseFloat(marker.height),
			markerRadius: marker.borderRadius,
		};
	});

	expect(geometry.backgroundImage).toBe("none");
	expect(geometry.borderRadius).toBe("0px");
	expect(geometry.markerRadius).toBe("0px");
	expect(geometry.markerHeight).toBeCloseTo(geometry.anchorHeight, 1);
});
