const { expect, test } = require("@playwright/test");
const {
	assertDocsBuilt,
	createServer,
	listPages,
	startServer,
} = require("../scripts/lib/docs-site");

// Full-page screenshot of every built docs page, compared against the
// committed per-platform baselines (see playwright.config.js). The
// component demos live on these pages, so this doubles as visual
// coverage of the framework itself in every scheme × viewport project.

assertDocsBuilt("visual.spec");

// One static docs server per worker process, on an ephemeral port.
let server;
let origin;

test.beforeAll(async () => {
	server = createServer();
	origin = await startServer(server);
});

test.afterAll(() => {
	server.close();
});

for (const pagePath of listPages()) {
	const name = pagePath.replace(/\.html$/, "").replace(/\//g, "-");

	test(name, async ({ page }) => {
		await page.goto(`${origin}/${pagePath}`, { waitUntil: "networkidle" });
		await page.evaluate(() => document.fonts.ready);
		await expect(page).toHaveScreenshot(`${name}.png`, {
			fullPage: true,
			// aria-busy spinners keep animating even under reduced motion (a
			// deliberate framework choice) and live inside a background-image
			// SVG that `animations: "disabled"` cannot reach — mask them.
			mask: [page.locator('[aria-busy="true"]')],
		});
	});
}
