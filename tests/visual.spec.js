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
	"content/description-list/index.html",
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

// No docs shell or logo: the public theme has to carry the family resemblance.
const frameworkSpecimens = ["amber", "plain", "playroom", "blue"];

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
		await page.locator('input[type="datetime-local"]').fill("2025-01-15T12:30");
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

for (const specimen of frameworkSpecimens) {
	test(`specimen-${specimen}`, async ({ page }) => {
		await page.goto(`${origin}/specimen/${specimen}/`, {
			waitUntil: "networkidle",
		});
		await page.evaluate(() => document.fonts.ready);
		await expectScreenshot(page, `specimen-${specimen}`);
	});
}

test("mobile navigation open", async ({ page }, testInfo) => {
	test.skip(
		!testInfo.project.name.includes("-mobile"),
		"the compact navigation only exists on mobile projects",
	);

	await capture(page, "colors/index.html", defaultTheme);
	const drawer = page.locator("[data-docs-menu-drawer]");
	await page.locator("[data-docs-menu-trigger]").click();
	await expect(drawer).toHaveAttribute("open", "");
	await expect(drawer.locator("[data-docs-mobile-controls]")).toBeVisible();
	await expect(page).toHaveScreenshot("mobile-menu-open.png", {
		fullPage: false,
	});
});

// One reviewable board, assembled from real browser pixels. The controls are
// captured under actual pseudo-states; the test-only HTML below only labels
// and arranges those PNGs, so it cannot fake or restyle the framework output.
// Behavior parity remains multi-engine in framework-specimen.spec.js while
// this representative Chromium board avoids 192 near-duplicate baselines.
test("framework interactive state matrix", async ({ page }, testInfo) => {
	test.skip(
		testInfo.project.name !== "light-desktop",
		"one representative Chromium board covers all themes and schemes",
	);

	await page.setViewportSize({ width: 620, height: 900 });
	const transitionDuration = 260;

	/**
	 * @param {import("@playwright/test").Locator} locator
	 * @param {number} [padding]
	 */
	const clipForTarget = async (locator, padding = 12) => {
		await locator.scrollIntoViewIfNeeded();
		const box = await locator.boundingBox();
		if (!box) throw new Error("state matrix target has no bounding box");
		const viewport = page.viewportSize();
		if (!viewport) throw new Error("state matrix viewport is unavailable");
		const x = Math.max(0, box.x - padding);
		const y = Math.max(0, box.y - padding);
		return {
			height: Math.min(box.height + padding * 2, viewport.height - y),
			width: Math.min(box.width + padding * 2, viewport.width - x),
			x,
			y,
		};
	};

	/**
	 * @param {import("@playwright/test").Locator} locator
	 * @param {number} [padding]
	 * @param {{ height: number, width: number, x: number, y: number }} [clip]
	 */
	const captureTarget = async (locator, padding = 12, clip) => {
		await locator.scrollIntoViewIfNeeded();
		return page.screenshot({
			animations: "disabled",
			clip: clip ?? (await clipForTarget(locator, padding)),
		});
	};

	/** @param {import("@playwright/test").Locator} locator */
	const keyboardFocus = async (locator) => {
		for (let index = 0; index < 30; index += 1) {
			await page.keyboard.press("Tab");
			if (
				await locator.evaluate((element) => element === document.activeElement)
			) {
				return;
			}
		}
		throw new Error("state matrix target was not keyboard reachable");
	};

	/** @type {{ component: string, label: string, images: string[] }[]} */
	const rows = [];
	for (const scheme of /** @type {const} */ (["light", "dark"])) {
		for (const specimen of frameworkSpecimens) {
			const url = `${origin}/specimen/states/${specimen}/`;
			const label = `${specimen} · ${scheme}`;
			await page.emulateMedia({ colorScheme: scheme });

			const buttonImages = [];
			await page.goto(url);
			let target = page.locator("[data-state-button]");
			const buttonClip = await clipForTarget(target);
			buttonImages.push(await captureTarget(target, 12, buttonClip));
			await target.hover();
			await page.waitForTimeout(transitionDuration);
			buttonImages.push(await captureTarget(target, 12, buttonClip));
			await page.goto(url);
			target = page.locator("[data-state-button]");
			await keyboardFocus(target);
			await page.waitForTimeout(transitionDuration);
			buttonImages.push(await captureTarget(target, 12, buttonClip));
			await page.goto(url);
			target = page.locator("[data-state-button]");
			await target.hover();
			await page.mouse.down();
			try {
				buttonImages.push(await captureTarget(target, 12, buttonClip));
			} finally {
				await page.mouse.up();
			}
			expect(buttonImages[3].equals(buttonImages[1])).toBe(false);
			rows.push({
				component: "Button",
				images: buttonImages.map(
					(image) => `data:image/png;base64,${image.toString("base64")}`,
				),
				label,
			});

			const inputImages = [];
			await page.goto(url);
			target = page.locator("[data-state-input]");
			const inputClip = await clipForTarget(target, 3);
			inputImages.push(await captureTarget(target, 3, inputClip));
			await target.hover();
			await page.waitForTimeout(transitionDuration);
			inputImages.push(await captureTarget(target, 3, inputClip));
			await page.goto(url);
			target = page.locator("[data-state-input]");
			await keyboardFocus(target);
			await page.waitForTimeout(transitionDuration);
			inputImages.push(await captureTarget(target, 3, inputClip));
			inputImages.push(
				await captureTarget(page.locator('input[name="disabled"]'), 3),
			);
			rows.push({
				component: "Input",
				images: inputImages.map(
					(image) => `data:image/png;base64,${image.toString("base64")}`,
				),
				label,
			});

			const accordionImages = [];
			await page.goto(url);
			let details = page.locator("[data-state-accordion]");
			let summary = details.locator("summary");
			accordionImages.push(await captureTarget(details));
			await summary.hover();
			await page.waitForTimeout(transitionDuration);
			accordionImages.push(await captureTarget(details));
			await page.goto(url);
			details = page.locator("[data-state-accordion]");
			summary = details.locator("summary");
			await keyboardFocus(summary);
			await page.waitForTimeout(transitionDuration);
			accordionImages.push(await captureTarget(details));
			await page.goto(url);
			details = page.locator("[data-state-accordion]");
			summary = details.locator("summary");
			await summary.click();
			await summary.evaluate((element) => element.blur());
			accordionImages.push(await captureTarget(details));
			rows.push({
				component: "Accordion",
				images: accordionImages.map(
					(image) => `data:image/png;base64,${image.toString("base64")}`,
				),
				label,
			});
		}
	}

	const columns = [
		"Rest / closed",
		"Hover",
		"Focus",
		"Active / open / disabled",
	];
	const cells = rows
		.map(
			({ component, images, label }) => `
				<div class="label"><strong>${component}</strong><span>${label}</span></div>
				${images.map((image, index) => `<figure><figcaption>${columns[index]}</figcaption><img src="${image}" alt="" /></figure>`).join("")}
			`,
		)
		.join("");
	await page.setViewportSize({ width: 1600, height: 900 });
	await page.setContent(`<!doctype html>
		<style>
			* { box-sizing: border-box; }
			body { margin: 0; padding: 24px; background: #f4f2ed; color: #272934; font: 14px/1.4 system-ui, sans-serif; }
			h1 { margin: 0 0 8px; font-size: 28px; letter-spacing: -.035em; }
			p { margin: 0 0 24px; color: #5d6272; }
			.matrix { display: grid; grid-template-columns: 180px repeat(4, minmax(0, 1fr)); gap: 1px; border: 1px solid #9a9eaa; background: #c8cbd2; }
			.label, figure { min-width: 0; margin: 0; padding: 10px; background: #fffefa; }
			.label { display: grid; align-content: center; gap: 3px; }
			.label span, figcaption { color: #666b79; font: 10px/1.2 ui-monospace, monospace; letter-spacing: .06em; text-transform: uppercase; }
			figure { display: grid; align-content: start; gap: 8px; }
			img { display: block; max-width: 100%; height: auto; }
		</style>
		<h1>Cirth interactive state matrix</h1>
		<p>Real browser states · Amber, Plain, Playroom and custom blue · light and dark</p>
		<div class="matrix">${cells}</div>`);
	await expect(page).toHaveScreenshot(
		"framework-interactive-state-matrix.png",
		{
			animations: "disabled",
			fullPage: true,
		},
	);
});
