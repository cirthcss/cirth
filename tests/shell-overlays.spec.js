const { expect, test } = require("@playwright/test");
const {
	assertDocsBuilt,
	createServer,
	startServer,
} = require("../scripts/lib/docs-site");

assertDocsBuilt("shell-overlays.spec");

// Keyboard behaviour that a screenshot cannot see: what Tab actually
// reaches on the home page, and what the two modal surfaces in this shell
// — search and the navigation drawer — do to the document behind them.
//
// These press keys rather than asserting attributes. An element can carry
// a correct href, a correct aria-expanded and a correct role and still be
// unreachable, or reachable and invisible; the only way to tell is to
// walk the focus and look at where it landed.

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
 * Tab `steps` times, returning a description of the active element after
 * each press.
 * @param {import("@playwright/test").Page} page
 * @param {number} steps
 * @param {"Tab" | "Shift+Tab"} key
 */
const walk = async (page, steps, key = "Tab") => {
	/** @type {{ tag: string, text: string, href: string | null }[]} */
	const seen = [];
	for (let index = 0; index < steps; index += 1) {
		await page.keyboard.press(key);
		seen.push(
			await page.evaluate(() => {
				const element = document.activeElement;
				if (!element || element === document.body) {
					return { tag: "body", text: "", href: null };
				}
				return {
					tag: element.tagName.toLowerCase(),
					text: (element.textContent || "").trim().replace(/\s+/g, " "),
					href: element.getAttribute("href"),
				};
			}),
		);
	}
	return seen;
};

test("Tab reaches every landmark control on the home page", async ({
	page,
	browserName,
}) => {
	// WebKit's sequential focus navigation visits form controls only —
	// links and buttons are skipped until the reader turns on macOS Full
	// Keyboard Access (Safari's "Press Tab to highlight each item on a
	// webpage"). A page containing nothing but a link, a button and a
	// summary behaves identically, so running this here would assert that
	// preference rather than anything about this shell.
	test.skip(
		browserName === "webkit",
		"WebKit excludes links and buttons from Tab by default",
	);
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto(`${origin}/`, { waitUntil: "networkidle" });

	// Landmarks and the controls a reader has to be able to get to, not a
	// transcript of the page: pinning the full sequence would fail on any
	// edit to the home page rather than on a keyboard regression.
	const reached = await walk(page, 60);
	/** @param {RegExp} pattern */
	const found = (pattern) =>
		reached.some((entry) => pattern.test(entry.text) || pattern.test(entry.href || ""));

	expect(found(/^Skip to main content$/), "skip link").toBe(true);
	expect(found(/^Docs$/), "navbar: Docs").toBe(true);
	expect(found(/^Search documentation/), "navbar: search trigger").toBe(true);
	expect(found(/^Get Started$/), "hero: Get Started").toBe(true);
	expect(found(/^Examples$/), "hero: Examples").toBe(true);
	expect(found(/^\/colors$/), "footer: Colors").toBe(true);
	expect(found(/^\/about$/), "footer: About").toBe(true);
});

test("the hero preview is a picture, not four tab stops", async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto(`${origin}/`, { waitUntil: "networkidle" });

	// The Output card renders a real sign-in form in an iframe. It is a
	// demonstration of what the library paints, so nothing in it is
	// operable: without this, Tab walked the reader through an email
	// field, a password field, a checkbox and a Sign in button that
	// belong to a picture, and a screen reader announced a working
	// sign-in form on the Cirth home page.
	const frame = page.frameLocator("[data-lab-frame]");
	await expect(frame.locator("form")).toBeAttached();
	expect(
		await page
			.locator("[data-lab-frame]")
			.contentFrame()
			.locator("body")
			.evaluate((body) => body.hasAttribute("inert")),
	).toBe(true);

	const reached = await walk(page, 30);
	expect(
		reached.filter((entry) => entry.tag === "iframe").length,
		"the frame itself takes a stop",
	).toBe(0);

	// The fields are in the frame's own document, and the walk above cannot
	// see them: focus entering an iframe is reported on the host as the
	// <iframe> element, which the assertion above already excludes. This
	// used to be approximated by counting <input> stops on the host page,
	// which held only while the home page happened to own no fields of its
	// own — it now has several, in the section whose whole argument is that
	// its controls *are* reachable. Asserted where it is true instead: the
	// preview renders a real form, and nothing in it was ever focused.
	const preview = await page
		.locator("[data-lab-frame]")
		.contentFrame()
		.locator("body")
		.evaluate((body) => ({
			fields: body.querySelectorAll("input, button").length,
			active: body.ownerDocument.activeElement?.tagName.toLowerCase() ?? null,
		}));

	expect(preview.fields, "the preview renders a real form").toBeGreaterThan(0);
	expect(preview.active, "nothing in the preview took focus").toBe("body");
});

test("Shift+Tab walks the home page back out the way it came", async ({
	page,
}) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto(`${origin}/`, { waitUntil: "networkidle" });

	const forward = await walk(page, 8);
	const backward = await walk(page, 7, "Shift+Tab");

	// Reversing from the eighth stop should retrace stops seven to one.
	expect(backward.map((entry) => entry.text)).toEqual(
		forward.slice(0, 7).map((entry) => entry.text).reverse(),
	);
});

test("search opens to the field, returns results, and gives focus back", async ({
	page,
}) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto(`${origin}/`, { waitUntil: "networkidle" });

	const trigger = page.locator("[data-docs-search-trigger]");
	const dialog = page.locator("[data-docs-search-dialog]");
	const input = page.locator("[data-docs-search-input]");

	await trigger.click();
	await expect(dialog).toHaveAttribute("open", "");
	expect(await dialog.evaluate((element) => element.matches(":modal"))).toBe(
		true,
	);
	await expect(input).toBeFocused();
	await expect(trigger).toHaveAttribute("aria-expanded", "true");

	await input.fill("button");
	await expect(
		page.locator(".docs-search-results [data-docs-search-result]").first(),
	).toBeVisible();

	await page.keyboard.press("Escape");
	await expect(dialog).not.toHaveAttribute("open", "");
	await expect(trigger).toHaveAttribute("aria-expanded", "false");
	await expect(trigger).toBeFocused();
});

test("search is a full surface on a phone, not a shrunken panel", async ({
	page,
}) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto(`${origin}/`, { waitUntil: "networkidle" });

	await page.locator("[data-docs-search-trigger]").click();
	await page.locator("[data-docs-search-input]").fill("button");
	await expect(
		page.locator(".docs-search-results [data-docs-search-result]").first(),
	).toBeVisible();

	const panel = page.locator(".docs-search-dialog > article");
	const geometry = await panel.evaluate((element) => {
		const box = element.getBoundingClientRect();
		const style = getComputedStyle(element);
		return {
			width: box.width,
			height: box.height,
			left: box.left,
			top: box.top,
			viewport: { width: window.innerWidth, height: window.innerHeight },
			radius: Number.parseFloat(style.borderTopLeftRadius),
			margin: Number.parseFloat(style.marginTop),
		};
	});

	// The whole screen, with nothing of the page showing around it — the
	// difference between a search mode and a dialog that happens to be
	// narrow.
	expect(geometry.width).toBeCloseTo(geometry.viewport.width, 0);
	expect(geometry.height).toBeCloseTo(geometry.viewport.height, 0);
	expect(geometry.left).toBe(0);
	expect(geometry.top).toBe(0);
	expect(geometry.radius).toBe(0);
	expect(geometry.margin).toBe(0);

	// The keyboard-shortcut hints are advice about hardware this reader
	// does not have, and they were sitting where results go. Gone, not
	// shrunk. The attribution beside them is still true on a phone, so it
	// stays — the band is not removed wholesale.
	const help = page.locator(".docs-search-help");
	await expect(help.locator("span").first()).toBeHidden();
	await expect(help.locator("small")).toBeVisible();
	expect(
		await help.evaluate(
			(element) =>
				element.querySelectorAll(
					'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
				).length,
		),
		"the band must not hold anything focusable",
	).toBe(0);

	// The field survives scrolling the results: it is a grid row, so there
	// is no scroll position at which the reader cannot retype or leave.
	const fieldTop = () =>
		page
			.locator(".docs-search-dialog > article > header")
			.evaluate((element) => element.getBoundingClientRect().top);
	const before = await fieldTop();
	await page
		.locator(".docs-search-results")
		.evaluate((element) => {
			element.scrollTop = element.scrollHeight;
		});
	expect(await fieldTop()).toBe(before);
	expect(
		await page
			.locator(".docs-search-results")
			.evaluate((element) => element.scrollTop),
		"the results scrolled inside their own box",
	).toBeGreaterThan(0);

	expect(
		await page.evaluate(
			() => document.documentElement.scrollWidth - window.innerWidth,
		),
	).toBeLessThanOrEqual(0);
});

test("an open overlay takes the page behind it out of the tab order", async ({
	page,
}) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto(`${origin}/`, { waitUntil: "networkidle" });

	/**
	 * @param {string} triggerSelector
	 * @param {string} dialogSelector
	 */
	const assertContained = async (triggerSelector, dialogSelector) => {
		await page.locator(triggerSelector).click();
		await expect(page.locator(dialogSelector)).toHaveAttribute("open", "");

		const outside = [];
		for (let index = 0; index < 14; index += 1) {
			await page.keyboard.press("Tab");
			const escaped = await page.evaluate((selector) => {
				const element = document.activeElement;
				const dialog = document.querySelector(selector);
				if (!element || element === document.body) return null;
				return dialog && dialog.contains(element)
					? null
					: element.tagName.toLowerCase();
			}, dialogSelector);
			if (escaped) outside.push(escaped);
		}
		expect(outside, `${dialogSelector} leaked focus to the page`).toEqual([]);

		// Locking the document is what stops the article behind the drawer
		// sliding around under it on a phone.
		expect(
			await page.evaluate(
				() => getComputedStyle(document.documentElement).overflow,
			),
		).toBe("hidden");

		await page.keyboard.press("Escape");
		await expect(page.locator(dialogSelector)).not.toHaveAttribute("open", "");
	};

	await assertContained(
		"[data-docs-menu-trigger]",
		"[data-docs-menu-drawer]",
	);
	await assertContained(
		"[data-docs-search-trigger]",
		"[data-docs-search-dialog]",
	);
});

test("the drawer is a modal surface with a way out of it", async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto(`${origin}/`, { waitUntil: "networkidle" });

	const trigger = page.locator("[data-docs-menu-trigger]");
	const drawer = page.locator("[data-docs-menu-drawer]");

	// Closing by the close button, and closing by the backdrop, both land
	// the reader back on the control they opened it with.
	await trigger.click();
	await expect(drawer).toHaveAttribute("open", "");
	await drawer.locator("[data-docs-menu-close]").click();
	await expect(drawer).not.toHaveAttribute("open", "");
	await expect(trigger).toBeFocused();

	await trigger.click();
	await expect(drawer).toHaveAttribute("open", "");
	// The backdrop is the dialog's own box outside the panel: the panel is
	// pinned to the inline end, so the inline start of the viewport is it.
	await page.mouse.click(8, 400);
	await expect(drawer).not.toHaveAttribute("open", "");
	await expect(trigger).toBeFocused();

	// A drawer with room in it: the full height of the screen, and wide
	// enough to label its controls rather than squeeze them.
	await trigger.click();
	const panel = await drawer.locator("article").evaluate((element) => {
		const box = element.getBoundingClientRect();
		return {
			height: box.height,
			width: box.width,
			right: box.right,
			viewport: { width: window.innerWidth, height: window.innerHeight },
		};
	});
	expect(panel.height).toBeCloseTo(panel.viewport.height, 0);
	expect(panel.right).toBeCloseTo(panel.viewport.width, 0);
	expect(panel.width).toBeGreaterThan(240);
});

test("the home page never scrolls sideways", async ({ page }) => {
	for (const width of [1440, 1280, 1024, 900, 768, 390, 320]) {
		await page.setViewportSize({ width, height: 900 });
		await page.goto(`${origin}/`, { waitUntil: "networkidle" });
		const overflow = await page.evaluate(
			() => document.documentElement.scrollWidth - window.innerWidth,
		);
		expect(overflow, `horizontal overflow at ${width}px`).toBeLessThanOrEqual(
			0,
		);

		// The six-row ledger table that used to be the one block wide enough
		// to need a scroll region is gone: its four measurements are a
		// hairline strip that reflows, and the two claims left are a list
		// that wraps. What still scrolls on this page is the code panes,
		// and the reason they are allowed to is that a listing must not
		// break an attribute across two lines — so the contract that
		// survives is the same one, asserted where it is now true: anything
		// that scrolls can be reached to scroll it.
		const panes = page.locator(".docs-native-home pre");
		const count = await panes.count();
		expect(count, "the home page still shows source").toBeGreaterThan(0);
		for (let index = 0; index < count; index++) {
			await expect(
				panes.nth(index),
				`code pane ${index} at ${width}px is keyboard reachable`,
			).toHaveAttribute("tabindex", "0");
		}
	}
});
