const { expect, test } = require("@playwright/test");
const {
	assertDocsBuilt,
	createServer,
	installTheme,
	listPages,
	startServer,
	themeVariants,
	waitForTheme,
} = require("../scripts/lib/docs-site");

// Full-page screenshots of the docs, compared against the committed
// per-platform baselines (see playwright.config.js). The default theme keeps
// broad page coverage. Every maintained preset adds a compact representative
// set plus open interactive surfaces, so a new preset discovered from
// src/presets/ cannot bypass visual verification.

assertDocsBuilt("visual.spec");

const visualPages = [
	"index.html",
	"about/index.html",
	"brand/index.html",
	"colors/index.html",
	"contributions/index.html",
	"customization/index.html",
	"examples/index.html",
	"get-started/index.html",
	"components/accordion/index.html",
	"components/card/index.html",
	"components/dropdown/index.html",
	"components/group/index.html",
	"components/loading/index.html",
	"components/meter/index.html",
	"components/modal/index.html",
	"components/nav/index.html",
	"components/popover/index.html",
	"components/progress/index.html",
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
	"upgrading/index.html",
];

const representativePresetPages = [
	"colors/index.html",
	"components/meter/index.html",
	"content/button/index.html",
	"forms/index.html",
];

/**
 * @type {{
 *   pagePath: string,
 *   state: string,
 *   prepare: (page: import("@playwright/test").Page) => Promise<void>,
 * }[]}
 */
const interactiveCases = [
	{
		pagePath: "index.html",
		state: "search-open",
		prepare: async (page) => {
			await page.locator("[data-docs-search-trigger]").click();
			const dialog = page.locator("[data-docs-search-dialog]");
			await expect(dialog).toBeVisible();
			await dialog.locator("[data-docs-search-input]").fill("semantic");
			await expect(
				dialog.locator("[data-docs-search-result]").first(),
			).toBeVisible();
		},
	},
	{
		pagePath: "components/modal/index.html",
		state: "modal-open",
		prepare: (page) =>
			page.locator(".docs-demo-preview dialog").evaluate((dialog) => {
				if (!(dialog instanceof HTMLDialogElement)) {
					throw new Error("modal demo dialog not found");
				}
				if (dialog.open) dialog.close();
				dialog.showModal();
			}),
	},
	{
		pagePath: "components/popover/index.html",
		state: "popover-open",
		prepare: async (page) => {
			const popover = page.locator(".docs-demo-preview [popover]");
			await popover.evaluate((element) => {
				if (!(element instanceof HTMLElement)) {
					throw new Error("popover demo not found");
				}
				element.showPopover();
			});
			await expect(popover).toBeVisible();
		},
	},
];

const builtPages = new Set(listPages());
for (const pagePath of visualPages) {
	if (!builtPages.has(pagePath)) {
		throw new Error(`visual.spec: selected page was not built: ${pagePath}`);
	}
}
for (const { pagePath } of interactiveCases) {
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

/**
 * @param {import("@playwright/test").Page} page
 * @param {string} pagePath
 * @param {(typeof themeVariants)[number]} theme
 * @param {(page: import("@playwright/test").Page) => Promise<void>} [prepare]
 */
const capture = async (page, pagePath, theme, prepare) => {
	await installTheme(page, theme);
	await page.goto(`${origin}/${pagePath}`, { waitUntil: "networkidle" });
	await waitForTheme(page, theme);
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
	if (prepare) await prepare(page);
};

/** @param {string} pagePath */
const pageName = (pagePath) =>
	pagePath.replace(/\.html$/, "").replace(/\//g, "-");

/**
 * @param {import("@playwright/test").Page} page
 * @param {string} name
 * @param {boolean} [splitLongPage]
 */
const expectScreenshot = async (page, name, splitLongPage = false) => {
	const mask = [page.locator('[aria-busy="true"]')];
	if (!splitLongPage) {
		await expect(page).toHaveScreenshot(`${name}.png`, {
			fullPage: true,
			mask,
		});
		return;
	}

	// Firefox cannot capture an image taller than 32,767 pixels. The
	// customization guide crosses that limit on a mobile viewport, so keep
	// complete coverage as four deterministic document-space slices instead
	// of dropping the tail of the page or excluding the guide again (gh#99).
	const { height, width } = await page.evaluate(() => ({
		height: document.documentElement.scrollHeight,
		width: document.documentElement.clientWidth,
	}));
	const parts = 4;
	for (let part = 0; part < parts; part += 1) {
		const y = Math.floor((height * part) / parts);
		const bottom = Math.floor((height * (part + 1)) / parts);
		await expect(page).toHaveScreenshot(`${name}-part-${part + 1}.png`, {
			clip: { height: bottom - y, width, x: 0, y },
			fullPage: true,
			mask,
		});
	}
};

const defaultTheme = themeVariants.find((theme) => theme.name === "default");
if (!defaultTheme) throw new Error("visual.spec: default theme is missing");

for (const pagePath of visualPages) {
	const name = pageName(pagePath);

	test(name, async ({ page }) => {
		await capture(page, pagePath, defaultTheme);
		// aria-busy spinners keep animating even under reduced motion (a
		// deliberate framework choice) and live inside a background-image SVG
		// that `animations: "disabled"` cannot reach — mask them.
		await expectScreenshot(page, name, pagePath === "customization/index.html");
	});
}

for (const theme of themeVariants.filter(({ name }) => name !== "default")) {
	for (const pagePath of representativePresetPages) {
		const name = `${theme.name}-${pageName(pagePath)}`;

		test(name, async ({ page }) => {
			await capture(page, pagePath, theme);
			await expectScreenshot(page, name);
		});
	}
}

for (const theme of themeVariants) {
	for (const { pagePath, prepare, state } of interactiveCases) {
		const prefix = theme.name === "default" ? "" : `${theme.name}-`;
		const name = `${prefix}${pageName(pagePath)}-${state}`;

		test(name, async ({ page }) => {
			await capture(page, pagePath, theme, prepare);
			await expectScreenshot(page, name);
		});
	}
}
