const { expect, test } = require("@playwright/test");
const { listPresetNames, presetLabel } = require("../scripts/lib/presets");
const { setContent } = require("./helpers/render");
const {
	assertDocsBuilt,
	createServer,
	installTheme,
	listPages,
	startServer,
	themeVariants,
	waitForTheme,
} = require("../scripts/lib/docs-site");

// Content-region screenshots of the docs, compared against the committed
// per-platform baselines (see playwright.config.js). Keeping the shared docs
// chrome out of each page capture confines a content change to the pages it
// affects; the chrome has one small dedicated baseline below. The default
// theme keeps broad page coverage. Every maintained preset adds a compact
// representative set plus open interactive surfaces, so a new preset
// discovered from src/presets/ cannot bypass visual verification.

assertDocsBuilt("visual.spec");

const visualPages = [
	"index.html",
	"about/index.html",
	"brand/index.html",
	"colors/index.html",
	"compatibility/index.html",
	"contributions/index.html",
	"customization/index.html",
	"examples/index.html",
	"guides/accessibility/index.html",
	"installation/index.html",
	"installation/vite/index.html",
	"installation/laravel/index.html",
	"themes/index.html",
	"why-cirth/index.html",
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
	"forms/select/index.html",
	"forms/text-inputs/index.html",
	"forms/textarea/index.html",
	"forms/validation/index.html",
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
	"forms/validation/index.html",
];

// No docs shell or logo: the public theme has to carry the family resemblance.
const frameworkSpecimens = ["default", ...listPresetNames(), "blue"];

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
 * `data-pagefind-body` already identifies the page-specific content for both
 * the documentation layout and the home page. Its document-space box keeps
 * the capture independent from the shared header, sidebar and outline while
 * preserving overlays that paint across the content (dialogs, popovers and
 * their backdrops). Integer outer edges avoid clipping antialiased borders.
 *
 * @param {import("@playwright/test").Page} page
 */
const docsContentRegion = (page) =>
	page.locator("[data-pagefind-body]").evaluate((content) => {
		const box = content.getBoundingClientRect();
		const root = document.documentElement;
		const x = Math.max(0, Math.floor(box.left + window.scrollX));
		const y = Math.max(0, Math.floor(box.top + window.scrollY));
		const right = Math.min(
			root.scrollWidth,
			Math.ceil(box.right + window.scrollX),
		);
		const bottom = Math.min(
			root.scrollHeight,
			Math.ceil(box.bottom + window.scrollY),
		);

		return { height: bottom - y, width: right - x, x, y };
	});

/**
 * @param {import("@playwright/test").Page} page
 * @param {string} name
 * @param {boolean} [splitLongPage]
 */
const expectDocsScreenshot = async (page, name, splitLongPage = false) => {
	const mask = [page.locator('[aria-busy="true"]')];
	const region = await docsContentRegion(page);
	if (!splitLongPage) {
		await expect(page).toHaveScreenshot(`${name}.png`, {
			clip: region,
			fullPage: true,
			mask,
		});
		return;
	}

	// Firefox cannot capture an image taller than 32,767 pixels. The
	// customization guide crosses that limit on a mobile viewport, so keep
	// complete coverage as four deterministic document-space slices instead
	// of dropping the tail of the page or excluding the guide again (gh#99).
	const parts = 4;
	for (let part = 0; part < parts; part += 1) {
		const y = region.y + Math.floor((region.height * part) / parts);
		const bottom =
			region.y + Math.floor((region.height * (part + 1)) / parts);
		await expect(page).toHaveScreenshot(`${name}-part-${part + 1}.png`, {
			clip: { height: bottom - y, width: region.width, x: region.x, y },
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
		// that `animations: "disabled"` cannot reach: mask them.
		await expectDocsScreenshot(
			page,
			name,
			pagePath === "customization/index.html",
		);
	});
}

for (const theme of themeVariants.filter(({ name }) => name !== "default")) {
	for (const pagePath of representativePresetPages) {
		const name = `${theme.name}-${pageName(pagePath)}`;

		test(name, async ({ page }) => {
			await capture(page, pagePath, theme);
			await expectDocsScreenshot(page, name);
		});
	}
}

for (const theme of themeVariants) {
	for (const { pagePath, prepare, state } of interactiveCases) {
		const prefix = theme.name === "default" ? "" : `${theme.name}-`;
		const name = `${prefix}${pageName(pagePath)}-${state}`;

		test(name, async ({ page }) => {
			await capture(page, pagePath, theme, prepare);
			await expectDocsScreenshot(page, name);
		});
	}
}

// The home page's held scenes, at fixed points of their scroll. A scene's
// state is a function of the scroll position alone, so each point is a
// scrollY computed from the section's geometry: no inertia, no delay, the
// same frame every run. Motion has to be welcome for a scene to be held,
// so these captures, unlike the rest, run with it.
test.describe("home scenes", () => {
	test.use({ contextOptions: { reducedMotion: "no-preference" } });

	/**
	 * @param {import("@playwright/test").Page} page
	 * @param {string} selector
	 * @param {number} progress
	 */
	const goTo = async (page, selector, progress) => {
		await page.locator(selector).evaluate((section, p) => {
			const element = /** @type {HTMLElement} */ (section);
			const top = element.getBoundingClientRect().top + window.scrollY;
			window.scrollTo(0, top + p * (element.offsetHeight - window.innerHeight));
		}, progress);
		await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));
	};
	/** @type {[string, string, number][]} */
	const points = [
		["story-typing", "[data-docs-story]", 0.15],
		["story-markup", "[data-docs-story]", 0.34],
		["story-browser", "[data-docs-story]", 0.52],
		["story-cirth", "[data-docs-story]", 0.85],
		["measured", "[data-docs-measured]", 0.9],
		["theme-start", "[data-docs-theme]", 0.05],
		["theme-accent", "[data-docs-theme]", 0.3],
		["theme-corners", "[data-docs-theme]", 0.52],
		["theme-canvas", "[data-docs-theme]", 0.85],
	];
	for (const [name, selector, progress] of points) {
		test(`home-${name}`, async ({ page }, testInfo) => {
			test.skip(!testInfo.project.name.includes("-desktop"), "a scene is held only where the window can hold it");
			await capture(page, "index.html", defaultTheme);
			await expect(page.locator(".docs-home")).toHaveAttribute("data-stage", "held");
			await goTo(page, selector, progress);
			await expect(page).toHaveScreenshot(`home-${name}.png`, {
				fullPage: false,
				mask: [page.locator('[aria-busy="true"]')],
			});
		});
	}

	for (const split of [20, 50, 80]) {
		test(`home-presets-${split}`, async ({ page }, testInfo) => {
			test.skip(!testInfo.project.name.includes("-desktop"), "one width shows the divider");
			await capture(page, "index.html", defaultTheme);
			const range = page.locator("[data-docs-compare-range]");
			await range.evaluate((element, value) => {
				const input = /** @type {HTMLInputElement} */ (element);
				input.value = String(value);
				input.dispatchEvent(new Event("input", { bubbles: true }));
			}, split);
			await expect(range).toHaveValue(String(split));
			await expect(page.locator(".docs-compare")).toHaveScreenshot(`home-presets-${split}.png`);
		});
	}

	test("home-orbit", async ({ page }, testInfo) => {
		test.skip(!testInfo.project.name.includes("-desktop"), "the orbit turns only on a wide screen");
		await capture(page, "index.html", defaultTheme);
		await page.locator(".docs-agnostic").evaluate((band) => {
			const element = /** @type {HTMLElement} */ (band);
			window.scrollTo(0, element.getBoundingClientRect().top + window.scrollY + element.offsetHeight / 2 - window.innerHeight / 2);
		});
		await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));
		await expect(page).toHaveScreenshot("home-orbit.png", { fullPage: false });
	});
});

// The story on a phone: three blocks in order, each complete, still. The
// story is taller than the window, and an element capture scrolls through
// it with the sticky header painted over its middle, so this is the whole
// page, clipped to the story's box: the header stays at the page's top.
test("home-story-column", async ({ page }, testInfo) => {
	test.skip(!testInfo.project.name.includes("-mobile"), "the story is a column on a phone");
	await capture(page, "index.html", defaultTheme);
	await expect(page.locator(".docs-home")).toHaveAttribute("data-stage", "column");
	const clip = await page.locator("[data-docs-story]").evaluate((story) => {
		const box = story.getBoundingClientRect();
		return { x: box.left + window.scrollX, y: box.top + window.scrollY, width: box.width, height: box.height };
	});
	await expect(page).toHaveScreenshot("home-story-column.png", { fullPage: true, clip });
});

test("documentation chrome", async ({ page }) => {
	await capture(page, "colors/index.html", defaultTheme);
	await expect(page).toHaveScreenshot("docs-chrome.png", { fullPage: false });
});

test("readonly number input affordance", async ({ page }, testInfo) => {
	test.skip(
		!testInfo.project.name.startsWith("light-desktop"),
		"one focused light capture per engine covers the native affordance",
	);

	await capture(page, "forms/validation/index.html", defaultTheme);
	await expect(
		page.locator("[data-readonly-number-example]"),
	).toHaveScreenshot("readonly-number-inputs.png");
});

for (const specimen of frameworkSpecimens) {
	test(`specimen-${specimen}`, async ({ page }) => {
		await page.goto(`${origin}/specimen/${specimen}/`, {
			waitUntil: "networkidle",
		});
		await page.evaluate(() => document.fonts.ready);
		await expect(page).toHaveScreenshot(`specimen-${specimen}.png`, {
			fullPage: true,
			mask: [page.locator('[aria-busy="true"]')],
		});
	});
}

// The surface matrix (specs/surface-depth.md): every level side by side,
// a form in and out of a card, and a dropdown, a popover and a dialog open
// at once, for the default theme, each preset and the probe accent.
for (const variant of ["default", ...listPresetNames(), "probe"]) {
	test(`surfaces-${variant}`, async ({ page }) => {
		await page.goto(`${origin}/specimen/surfaces/${variant}/`, {
			waitUntil: "networkidle",
		});
		await page.evaluate(() => document.fonts.ready);
		await expect(page).toHaveScreenshot(`surfaces-${variant}.png`, {
			fullPage: true,
		});
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
	// Four controls, four states, every theme, both schemes: well over the
	// default 30s once the radio row is in.
	test.setTimeout(180_000);
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

			// A radio as a reader meets it: unchecked, under the pointer
			// (its label counts), with the keyboard's ring (a group takes
			// focus on its checked radio), and checked. The label is in the
			// capture, so the mark's alignment with its text is too.
			const radioImages = [];
			await page.goto(url);
			target = page.locator("[data-state-radio]");
			const radioClip = await clipForTarget(target, 6);
			radioImages.push(await captureTarget(target, 6, radioClip));
			await target.hover();
			await page.waitForTimeout(transitionDuration);
			radioImages.push(await captureTarget(target, 6, radioClip));
			await page.goto(url);
			target = page.locator("[data-state-radio-checked]");
			await keyboardFocus(target.locator("input"));
			await page.waitForTimeout(transitionDuration);
			radioImages.push(await captureTarget(target, 6));
			await page.goto(url);
			radioImages.push(await captureTarget(page.locator("[data-state-radio-checked]"), 6));
			rows.push({
				component: "Radio",
				images: radioImages.map(
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
	await setContent(page, `<!doctype html>
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
		<p>Real browser states · Default, ${listPresetNames().map(presetLabel).join(", ")} and custom blue · light and dark</p>
		<div class="matrix">${cells}</div>`);
	await expect(page).toHaveScreenshot(
		"framework-interactive-state-matrix.png",
		{
			animations: "disabled",
			fullPage: true,
		},
	);
});
