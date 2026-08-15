const { expect, test } = require("@playwright/test");
const {
	assertDocsBuilt,
	createServer,
	startServer,
} = require("../scripts/lib/docs-site");

assertDocsBuilt("date-input-group.spec");

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

test("date-like inputs shrink inside grouped grid columns", async ({ page }) => {
	await page.goto(`${origin}/forms/input-date/`, { waitUntil: "networkidle" });
	await page.evaluate(() => {
		const types = ["date", "datetime-local", "month", "time", "week"];
		document.body.innerHTML = `
			<main style="max-width: none; padding: 1rem">
				${types
					.map(
						(type) => `
							<div class="grid date-grid" data-input-type="${type}" style="width: 700px">
								<fieldset>
									<legend>${type} range</legend>
									<div class="group" role="group">
										<input type="${type}" aria-label="${type} from">
										<input type="${type}" aria-label="${type} to">
									</div>
								</fieldset>
								<fieldset>
									<legend>Comparison ${type} range</legend>
									<div class="group" role="group">
										<input type="${type}" aria-label="Comparison ${type} from">
										<input type="${type}" aria-label="Comparison ${type} to">
									</div>
								</fieldset>
							</div>`,
					)
					.join("")}
			</main>`;
	});

	for (const type of ["date", "datetime-local", "month", "time", "week"]) {
		const group = page
			.locator(`[data-input-type="${type}"] .group`)
			.first();
		const inputs = group.locator("input");
		const groupBox = await group.boundingBox();
		const firstBox = await inputs.nth(0).boundingBox();
		const secondBox = await inputs.nth(1).boundingBox();

		if (!groupBox || !firstBox || !secondBox) {
			throw new Error(`${type} group and inputs should be rendered`);
		}
		expect(
			Math.abs(firstBox.y - secondBox.y),
			`${type} inputs should remain on the same row`,
		).toBeLessThan(1);
		expect(
			Math.max(firstBox.x + firstBox.width, secondBox.x + secondBox.width),
			`${type} inputs should not overflow their group`,
		).toBeLessThanOrEqual(groupBox.x + groupBox.width + 0.5);
	}
});
