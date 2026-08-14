const { expect, test } = require("@playwright/test");
const {
	assertDocsBuilt,
	createServer,
	listPages,
	startServer,
} = require("../scripts/lib/docs-site");

// Full-page screenshots of selected component and layout pages, compared
// against the committed per-platform baselines (see playwright.config.js).
// Editorial pages are covered by the docs build, link check, and a11y audit
// without multiplying text-only snapshots across every visual project.

assertDocsBuilt("visual.spec");

const visualPages = [
	"index.html",
	"brand/index.html",
	"colors/index.html",
	"examples/index.html",
	"components/accordion/index.html",
	"components/card/index.html",
	"components/dropdown/index.html",
	"components/group/index.html",
	"components/loading/index.html",
	"components/modal/index.html",
	"components/nav/index.html",
	"components/progress/index.html",
	"components/tooltip/index.html",
	"content/button/index.html",
	"content/code/index.html",
	"content/embedded/index.html",
	"content/figure/index.html",
	"content/link/index.html",
	"content/misc/index.html",
	"content/table/index.html",
	"content/typography/index.html",
	"forms/index.html",
	"forms/checkbox-radio-switch/index.html",
	"forms/input-color/index.html",
	"forms/input-date/index.html",
	"forms/input-file/index.html",
	"forms/input-range/index.html",
	"forms/input-search/index.html",
	"layout/container/index.html",
	"layout/grid/index.html",
	"layout/landmarks/index.html",
	"layout/overflow-auto/index.html",
	"layout/row/index.html",
	"layout/section/index.html",
	"utilities/breakout/index.html",
	"utilities/sr-only/index.html",
	"utilities/truncate/index.html",
];

const builtPages = new Set(listPages());
for (const pagePath of visualPages) {
	if (!builtPages.has(pagePath)) {
		throw new Error(`visual.spec: selected page was not built: ${pagePath}`);
	}
}

// One static docs server per worker process, on an ephemeral port.
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

for (const pagePath of visualPages) {
	const name = pagePath.replace(/\.html$/, "").replace(/\//g, "-");

	test(name, async ({ page }) => {
		await page.goto(`${origin}/${pagePath}`, { waitUntil: "networkidle" });
		await page.evaluate(() => document.fonts.ready);
		if (pagePath === "forms/input-date/index.html") {
			// Empty date segments in WebKit use today's date as their visual
			// placeholder, making the snapshot drift over time. Fixed values keep
			// the native controls visible while making the baseline deterministic.
			await page.locator('input[type="date"]').fill("2025-01-15");
			await page.locator('input[type="time"]').fill("12:30");
			await page
				.locator('input[type="datetime-local"]')
				.fill("2025-01-15T12:30");
		}
		await expect(page).toHaveScreenshot(`${name}.png`, {
			fullPage: true,
			// aria-busy spinners keep animating even under reduced motion (a
			// deliberate framework choice) and live inside a background-image
			// SVG that `animations: "disabled"` cannot reach — mask them.
			mask: [page.locator('[aria-busy="true"]')],
		});
	});
}
