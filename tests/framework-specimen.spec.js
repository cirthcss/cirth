const { expect, test } = require("@playwright/test");
const {
	assertDocsBuilt,
	createServer,
	startServer,
} = require("../scripts/lib/docs-site");

assertDocsBuilt("framework-specimen.spec");

const specimens = ["amber", "plain", "playroom", "blue"];
/** @type {import("node:http").Server} */
let server;
/** @type {string} */
let origin;

test.beforeAll(async () => {
	server = createServer();
	origin = await startServer(server);
});

test.afterAll(() => server.close());

for (const specimen of specimens) {
	test(`${specimen} uses only the public framework surface`, async ({ page }) => {
		await page.goto(`${origin}/specimen/${specimen}/`);

		await expect(page.locator('link[href*="cirth-lab-default.css"]')).toHaveCount(1);
		await expect(page.locator('link[href*="styles/style.css"]')).toHaveCount(0);
		await expect(page.locator('[class^="docs-"], [class*=" docs-"]')).toHaveCount(0);
		await expect(page.locator("img, svg")).toHaveCount(0);
		await expect(page.locator("nav")).toHaveCount(3);
		await expect(page.locator("article")).toHaveCount(2);
		await expect(page.locator("form, table, details, progress, dialog")).toHaveCount(5);

		const geometry = await page.locator('input[name="owner"]').evaluate((field) => {
			const style = getComputedStyle(field);
			return {
				bottom: style.borderBottomWidth,
				radius: style.borderRadius,
				top: style.borderTopWidth,
			};
		});
		expect(Number.parseFloat(geometry.bottom)).toBeGreaterThan(
			Number.parseFloat(geometry.top),
		);
		expect(geometry.radius).toBe("4px");
	});
}

test("presets preserve geometry while changing colour", async ({ page }) => {
	const values = [];
	for (const specimen of specimens) {
		await page.goto(`${origin}/specimen/${specimen}/`);
		values.push(
			await page.locator('input[name="owner"]').evaluate((field) => {
				const style = getComputedStyle(field);
				return {
					borderBottomWidth: style.borderBottomWidth,
					borderRadius: style.borderRadius,
					primary: getComputedStyle(document.documentElement)
						.getPropertyValue("--cirth-primary")
						.trim(),
				};
			}),
		);
	}

	expect(new Set(values.map(({ borderRadius }) => borderRadius)).size).toBe(1);
	expect(new Set(values.map(({ borderBottomWidth }) => borderBottomWidth)).size).toBe(1);
	expect(new Set(values.map(({ primary }) => primary)).size).toBe(4);
});

test("dark progress follows each public primary instead of default amber", async ({
	page,
}) => {
	await page.emulateMedia({ colorScheme: "dark" });
	const values = [];

	for (const specimen of specimens) {
		await page.goto(`${origin}/specimen/${specimen}/`);
		values.push(
			await page.evaluate(() => {
				const swatch = document.createElement("span");
				swatch.style.backgroundColor = "var(--cirth-progress-color)";
				document.body.append(swatch);
				const color = getComputedStyle(swatch).backgroundColor;
				swatch.remove();
				return color;
			}),
		);
	}

	expect(new Set(values).size).toBe(4);
});

test("dialog behavior is specimen-only and keyboard reachable", async ({ page }) => {
	await page.goto(`${origin}/specimen/amber/`);
	await page.getByRole("button", { name: "Review confirmation dialog" }).click();
	const dialog = page.getByRole("dialog");
	await expect(dialog).toBeVisible();
	await expect(page.getByRole("button", { name: "Cancel" }).last()).toBeFocused();
	await page.keyboard.press("Escape");
	await expect(dialog).toBeHidden();
});
