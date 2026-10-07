const { expect, test } = require("@playwright/test");
const { setContent } = require("./helpers/render");
const {
	assertDocsBuilt,
	createServer,
	startServer,
} = require("../scripts/lib/docs-site");
const { withAndWithoutScrollbar } = require("./helpers/viewport");
const { listPresetNames, presetsSourceDir } = require("../scripts/lib/presets");
const versions = require("../docs/src/_data/versions.js");

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

// WebKit's sequential focus navigation visits form controls only: links
// and buttons are excluded unless the reader turns on macOS Full Keyboard
// Access (Safari's "Press Tab to highlight each item on a webpage"). It
// is a platform preference, not a property of this page: a document
// containing nothing but a link, a button and a summary behaves the same
// way, so assertions about Tab *arriving* at a link or a button would be
// asserting that setting. The controls themselves are still checked on
// every engine; only the walk to them is skipped.
//
// Note this is why the menu toggle stopped being reachable by Tab on
// default Safari when it became a <button>: as a <summary> it counted as
// a control. That put it in the same position as the search trigger
// beside it and every link in the bar, which is consistent, and a button
// with aria-haspopup="dialog" is what actually opens a dialog.
/** @param {string} browserName */
const tabSkipsButtons = (browserName) => browserName === "webkit";

/**
 * The hero's demo is two surfaces, one over the other: the source slab and
 * the card it renders, laid over the slab so both read at once. What has to
 * hold at every width is that the card never hides the source: no line of
 * code sits under it. Both stay inside the figure, the card sits after the
 * source on the block axis (it starts lower), and the listing never needs
 * a horizontal scrollbar down to a 360px phone.
 * @param {import("@playwright/test").Page} page
 */
const assertHeroDemoGeometry = async (page) => {
	const width = page.viewportSize()?.width ?? 0;
	const geometry = await page.evaluate(() => {
		const figure = /** @type {HTMLElement} */ (document.querySelector(".docs-hero-demo"));
		const source = /** @type {HTMLElement} */ (document.querySelector(".docs-hero-source"));
		const card = /** @type {HTMLElement} */ (document.querySelector(".docs-hero-render > article"));
		const code = /** @type {HTMLElement} */ (source.querySelector("pre code"));
		const range = document.createRange();
		range.selectNodeContents(code);
		const lines = [...range.getClientRects()].filter((rect) => rect.width > 0);
		const box = (/** @type {DOMRect} */ rect) => ({
			left: rect.left,
			right: rect.right,
			top: rect.top,
			bottom: rect.bottom,
		});
		return {
			figure: box(figure.getBoundingClientRect()),
			source: box(source.getBoundingClientRect()),
			card: box(card.getBoundingClientRect()),
			lines: lines.map(box),
		};
	});

	for (const [name, rect] of /** @type {const} */ ([
		["source", geometry.source],
		["card", geometry.card],
	])) {
		expect(rect.left, `${name} starts inside the figure at ${width}px`).toBeGreaterThanOrEqual(
			geometry.figure.left - 1,
		);
		expect(rect.right, `${name} ends inside the figure at ${width}px`).toBeLessThanOrEqual(
			geometry.figure.right + 1,
		);
	}
	expect(geometry.card.top, `the card starts below the source at ${width}px`).toBeGreaterThan(
		geometry.source.top,
	);

	const covered = geometry.lines.filter(
		(line) =>
			line.right > geometry.card.left + 1 &&
			line.left < geometry.card.right - 1 &&
			line.bottom > geometry.card.top + 1 &&
			line.top < geometry.card.bottom - 1,
	);
	expect(covered, `lines of code under the card at ${width}px`).toEqual([]);

	if (width >= 360) {
		const overflow = await page
			.locator(".docs-hero-source pre")
			.evaluate((element) => element.scrollWidth - element.clientWidth);
		expect(overflow, `the source scrolls sideways at ${width}px`).toBeLessThanOrEqual(0);
	}
};

test("homepage keeps the source and authentic output comparison focused on mobile", async ({
	page,
}) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto(`${origin}/`, { waitUntil: "networkidle" });

	const source = page.locator(".docs-hero-source pre code");
	const result = page.locator(".docs-hero-render");
	await expect(source).toContainText("<article>");
	await expect(source).toContainText('<input type="email" required>');
	await expect(source).toContainText("<button>Sign in</button>");
	await expect(source).not.toContainText("…");
	const hero = page.locator(".docs-hero");
	await expect(
		hero.getByRole("button", { name: "Get started" }),
	).toHaveAttribute("href", "/installation");
	await expect(
		hero.getByRole("button", { name: "Examples", exact: true }),
	).toHaveAttribute("href", "/examples");

	// The result is the page's own Cirth rendering the card, not an image
	// or a frame, and it is a picture of the output rather than a form on
	// the home page: inert, so it adds no tab stops.
	await expect(result).toHaveAttribute("inert", "");
	await expect(result.locator("article")).toHaveCount(1);
	await expect(result.locator("form")).toHaveCount(1);
	await expect(result.locator("h2")).toHaveText("Sign in");

	const builds = [
		{
			name: "default",
			stylesheet: /cirth-lab-default\.css/,
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
	// The four build specimens the Examples page frames. Each is checked
	// where it lives: every build's page is the real distributed stylesheet
	// rendering the real markup, with the wrapper and the container class
	// the build is supposed to have and nothing else.
	for (const build of builds) {
		await page.goto(`${origin}/lab/${build.name}/`, {
			waitUntil: "networkidle",
		});
		await expect(page.locator('link[rel="stylesheet"]')).toHaveAttribute(
			"href",
			build.stylesheet,
		);
		await expect(page.locator(".cirth")).toHaveCount(build.scoped ? 1 : 0);
		if (build.mainClass) {
			await expect(page.locator("main")).toHaveClass(build.mainClass);
		} else {
			await expect(page.locator("main")).not.toHaveAttribute("class");
		}
		// A specimen, not an operable form: it is embedded as a picture.
		await expect(page.locator("body")).toHaveAttribute("inert", "");
	}
	await page.goto(`${origin}/`, { waitUntil: "networkidle" });

	for (const width of [390, 360, 768, 1024, 1440]) {
		await page.setViewportSize({ width, height: 900 });
		await assertHeroDemoGeometry(page);
	}

	const actionAlignment = await page
		.locator(".docs-hero .docs-hero-actions")
		.evaluate((element) => ({
			containerX: element.getBoundingClientRect().x,
			firstActionX: element.firstElementChild?.getBoundingClientRect().x,
			justifyContent: getComputedStyle(element).justifyContent,
			textAlign: getComputedStyle(element).textAlign,
		}));
	// The contract is that the actions start flush with the column, not that
	// a particular keyword is written down. `justify-content` used to be
	// declared `flex-start` explicitly and was removed as redundant: on a row
	// flex container the initial `normal` behaves as `stretch`, which for
	// justify-content behaves as `flex-start`. Both spellings are accepted so
	// the assertion survives that, and the geometry below is what actually
	// pins the alignment.
	expect(["flex-start", "normal"]).toContain(actionAlignment.justifyContent);
	expect(actionAlignment.textAlign).toBe("start");
	expect(actionAlignment.firstActionX).toBeCloseTo(
		actionAlignment.containerX,
		1,
	);
});

test("header keeps navigation, search, and automatic versioning distinct", async ({
	page,
}) => {
	await page.goto(`${origin}/`, { waitUntil: "networkidle" });

	const start = page.locator(".docs-header-start-group");
	const search = page.locator(".docs-header-search");
	const controls = page.locator(".docs-header-controls-group");
	const [startBox, searchBox, controlsBox] = await Promise.all([
		start.boundingBox(),
		search.boundingBox(),
		controls.boundingBox(),
	]);
	if (!startBox || !searchBox || !controlsBox) {
		throw new Error("Expected all desktop header regions to be visible");
	}
	expect(startBox.x).toBeLessThan(searchBox.x);
	expect(searchBox.x).toBeLessThan(controlsBox.x);

	const searchTrigger = search.locator("[data-docs-search-trigger]");
	const version = page.locator("[data-docs-version-select]");
	await expect(searchTrigger).toBeVisible();
	await expect(version).toBeVisible();
	// Surface, border, radius and height: the trigger is set the way the
	// field beside it is set.
	/** @param {import("@playwright/test").Locator} locator */
	const box = (locator) =>
		locator.evaluate((element) => {
			const style = getComputedStyle(element);
			return {
				background: style.backgroundColor,
				border: style.borderColor,
				radius: style.borderRadius,
				height: Math.round(element.getBoundingClientRect().height),
			};
		});
	const [searchRest, fieldRest] = await Promise.all([
		box(searchTrigger),
		box(version),
	]);
	expect(searchRest).toEqual(fieldRest);

	// And its text is a placeholder in every property a placeholder has,
	// not only in colour. It used to take the placeholder ink and the
	// button's semibold: "Search documentation" at 600 beside real
	// placeholders at 400. The reference is a real ::placeholder, measured
	// in this same cascade rather than restated as literals here.
	/** @param {import("@playwright/test").Locator} locator */
	const type = (locator) =>
		locator.evaluate((element) => {
			const style = getComputedStyle(element);
			return {
				color: style.color,
				family: style.fontFamily,
				size: style.fontSize,
				weight: style.fontWeight,
				lineHeight: style.lineHeight,
				letterSpacing: style.letterSpacing,
				opacity: style.opacity,
			};
		});
	const placeholder = await page.evaluate(() => {
		const host = /** @type {HTMLElement} */ (
			document.querySelector(".docs-header-controls-group")
		);
		const probe = document.createElement("input");
		probe.type = "text";
		probe.placeholder = "probe";
		host.append(probe);
		const style = getComputedStyle(probe, "::placeholder");
		const own = getComputedStyle(probe);
		const result = {
			color: style.color,
			family: own.fontFamily,
			size: own.fontSize,
			weight: own.fontWeight,
			lineHeight: own.lineHeight,
			letterSpacing: own.letterSpacing,
			opacity: style.opacity,
		};
		probe.remove();
		return result;
	});
	expect(await type(searchTrigger)).toEqual(placeholder);
	expect(placeholder.weight).toBe("400");

	// The header's controls are quiet chrome with no edge: hover deepens the
	// wash on the trigger exactly as it does on the field beside it, and
	// leaves the edge and the size where they are. The text keeps every
	// property of a placeholder but its ink, which steps up to the secondary
	// ink: the placeholder ink on the deeper wash measured 4.21:1 in the
	// dark scheme of the former playroom preset, under AA.
	await version.hover();
	const fieldHover = await box(version);
	await searchTrigger.hover();
	const searchHover = await box(searchTrigger);
	expect(searchHover.background).not.toBe(searchRest.background);
	expect(searchHover.background).toBe(fieldHover.background);
	expect(searchHover.border).toBe(searchRest.border);
	expect(searchHover.height).toBe(searchRest.height);
	const secondaryInk = await page.evaluate(() => {
		const probe = document.createElement("span");
		probe.style.color = "var(--cirth-secondary-text)";
		document.body.append(probe);
		const color = getComputedStyle(probe).color;
		probe.remove();
		return color;
	});
	expect(await type(searchTrigger)).toEqual({ ...placeholder, color: secondaryInk });

	// Focus is the one ring every control draws, outside the box.
	await page.mouse.move(0, 0);
	await searchTrigger.focus();
	const searchFocus = await searchTrigger.evaluate((element) => {
		const style = getComputedStyle(element);
		return {
			outline: style.outlineStyle,
			outlineWidth: Number.parseFloat(style.outlineWidth),
			offset: Number.parseFloat(style.outlineOffset),
			height: Math.round(element.getBoundingClientRect().height),
		};
	});
	expect(searchFocus.outline).toBe("solid");
	expect(searchFocus.outlineWidth).toBeGreaterThan(0);
	expect(searchFocus.offset).toBeGreaterThan(0);
	expect(searchFocus.height).toBe(searchRest.height);
	expect(await type(searchTrigger)).toEqual(placeholder);
	await searchTrigger.blur();
	await searchTrigger.click();
	const searchDialog = page.locator("[data-docs-search-dialog]");
	await expect(searchDialog).toBeVisible();
	const searchInput = searchDialog.locator("[data-docs-search-input]");
	await expect(searchInput).toBeFocused();
	await searchInput.fill("Accordion");
	await expect(
		searchDialog.locator(
			'[data-docs-search-result][href$="/components/accordion/"]',
		),
	).toBeVisible();
	await searchInput.press("Enter");
	await expect(page).toHaveURL(`${origin}/components/accordion/`);

	// Read from the same list the switcher is built from, not copied out of
	// it. This test is named for automatic versioning, and a hand-kept copy
	// here turns archiving a line into a test edit, which is friction in
	// exactly the place the project least wants it: the archive went three
	// releases without a new line, and every small cost in the way of adding
	// one is part of why.
	expect(await version.locator("option").allTextContents()).toEqual(
		versions.lines.map((line) => line.shortLabel),
	);
	expect(versions.lines[0].current).toBe(true);
	await version.selectOption({ label: "v0.12" });
	await expect(page).toHaveURL(`${origin}/v0.12/`);
});

test("compact header orders search before its complete keyboard menu", async ({
	page,
	browserName,
}) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto(`${origin}/colors/`, { waitUntil: "networkidle" });

	const actions = page.locator(".docs-header-actions");
	const search = page.locator("[data-docs-search-trigger]");
	const menu = page.locator("[data-docs-menu-drawer]");
	const trigger = page.locator("[data-docs-menu-trigger]");
	const panel = menu;
	const mobileControls = panel.locator("[data-docs-mobile-controls]");

	expect(
		await actions.evaluate((element) =>
			Array.from(element.children).map((child) => child.className),
		),
	).toEqual(["docs-header-search", "ghost contrast docs-menu-toggle"]);
	await expect(trigger).toHaveAttribute("aria-controls", "docs-mobile-menu-panel");
	await expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
	await expect(trigger).toHaveAttribute("aria-expanded", "false");
	await expect(page.locator(".docs-header-controls-group [data-docs-header-control]")).toHaveCount(0);
	await expect(mobileControls.locator("[data-docs-header-control]")).toHaveCount(3);

	await search.focus();
	if (!tabSkipsButtons(browserName)) {
		await page.keyboard.press("Tab");
		await expect(trigger).toBeFocused();
	}
	await trigger.focus();
	await page.keyboard.press("Enter");
	await expect(menu).toHaveAttribute("open", "");
	expect(await menu.evaluate((element) => element.matches(":modal"))).toBe(true);
	await expect(trigger).toHaveAttribute("aria-expanded", "true");
	await expect(panel.getByRole("link", { name: "Docs", exact: true })).toBeVisible();
	await expect(mobileControls.locator("[data-docs-version-select]")).toBeVisible();
	await expect(mobileControls.locator("[data-cirth-preset-select]")).toBeVisible();
	await expect(mobileControls.locator(".docs-theme-toggle")).toBeVisible();

	const beforeTheme = await page.locator("html").getAttribute("data-theme");
	await mobileControls.locator(".docs-theme-toggle").click();
	expect(await page.locator("html").getAttribute("data-theme")).not.toBe(beforeTheme);

	await mobileControls.locator("[data-docs-version-select]").focus();
	await page.keyboard.press("Escape");
	await expect(menu).not.toHaveAttribute("open", "");
	await expect(trigger).toHaveAttribute("aria-expanded", "false");
	await expect(trigger).toBeFocused();

	const compactGeometry = await page.evaluate(() => {
		const header = document.querySelector(".docs-header");
		const heading = document.querySelector(".docs-content > h1");
		if (!header || !heading) throw new Error("compact docs shell is incomplete");
		return {
			headerPosition: getComputedStyle(header).position,
			h1Y: heading.getBoundingClientRect().y,
			overflow:
					document.documentElement.scrollWidth -
					document.documentElement.clientWidth,
		};
	});
	expect(compactGeometry.headerPosition).toBe("sticky");
	expect(compactGeometry.h1Y).toBeLessThan(220);
	expect(compactGeometry.overflow).toBeLessThanOrEqual(0);

	await page.setViewportSize({ width: 320, height: 720 });
	expect(
		await page.evaluate(
			() =>
				document.documentElement.scrollWidth -
				document.documentElement.clientWidth,
		),
	).toBeLessThanOrEqual(0);

	await page.setViewportSize({ width: 1440, height: 900 });
	await expect(trigger).toBeHidden();
	await expect(page.locator(".docs-header-controls-group [data-docs-header-control]")).toHaveCount(3);
});

test("the questions before installing expose consistent interactive states", async ({
	page,
}) => {
	await page.emulateMedia({ reducedMotion: "no-preference" });
	await page.goto(`${origin}/why-cirth/`, { waitUntil: "networkidle" });

	const details = page.locator('.docs-content details[name="faq"]').first();
	const summary = details.locator("summary");
	const closedWidths = await Promise.all([
		details.evaluate((element) => element.getBoundingClientRect().width),
		summary.evaluate((element) => element.getBoundingClientRect().width),
	]);
	await summary.click();
	// The state measured is "open", not "opening": the disclosure animates
	// its content in, so wait for the answer to have a box.
	await expect(details).toHaveAttribute("open", "");
	await expect(details.locator("p")).toBeVisible();
	const openWidths = await Promise.all([
		details.evaluate((element) => element.getBoundingClientRect().width),
		summary.evaluate((element) => element.getBoundingClientRect().width),
		details
			.locator("p")
			.evaluate((element) => element.getBoundingClientRect().width),
	]);
	// The divider-style public disclosure keeps one stable content measure.
	expect(openWidths[0]).toBe(closedWidths[0]);
	expect(openWidths[1]).toBe(closedWidths[1]);
	expect(openWidths[2]).toBe(openWidths[1]);

	const nextSummary = page.locator('.docs-content details[name="faq"] summary').nth(1);
	const stateBefore = await nextSummary.evaluate(
		(element) => ({
			background: getComputedStyle(element).backgroundColor,
			color: getComputedStyle(element).color,
		}),
	);
	await nextSummary.hover();
	await page.waitForTimeout(180);
	const stateAfter = await nextSummary.evaluate(
		(element) => ({
			background: getComputedStyle(element).backgroundColor,
			color: getComputedStyle(element).color,
		}),
	);
	expect(stateAfter.background).toBe(stateBefore.background);
	expect(stateAfter.color).not.toBe(stateBefore.color);

	// The answers that quote the build carry the build's numbers, not the
	// marker they were written with.
	await expect(page.locator(".docs-content")).not.toContainText("<!--");
	await expect(
		page.locator('.docs-content details[name="faq"]', { hasText: "How big" }),
	).toContainText(/\d+(\.\d+)? KB gzipped/);
});

test("documentation active navigation uses the public registered state", async ({
	page,
}) => {
	await page.goto(`${origin}/installation/`, { waitUntil: "networkidle" });
	const active = page.locator('.docs-sidebar a[aria-current="page"]');
	const inactive = page.locator(".docs-sidebar a:not([aria-current])").first();
	const inactiveStyle = await inactive.evaluate((element) => ({
		color: getComputedStyle(element).color,
		fontWeight: getComputedStyle(element).fontWeight,
	}));
	const geometry = await active.evaluate((element) => {
		const style = getComputedStyle(element);
		const marker = getComputedStyle(element, "::before");
		const probe = document.createElement("div");
		document.body.append(probe);
		// The rail is the accent's text role: it sits on the surface, not
		// on a fill, and the fill's edge falls to 2.84:1 on the dark canvas
		// (specs/surface-and-edge-model.md).
		probe.style.color = "var(--cirth-primary-text)";
		const accent = getComputedStyle(probe).color;
		probe.style.color = "var(--cirth-contrast-text)";
		const contrast = getComputedStyle(probe).color;
		probe.remove();
		return {
			accent,
			contrast,
			backgroundColor: style.backgroundColor,
			backgroundImage: style.backgroundImage,
			borderRadius: style.borderRadius,
			color: style.color,
			fontWeight: style.fontWeight,
			leadingEdge: Number.parseFloat(style.borderInlineStartWidth),
			leadingEdgeColor: style.borderInlineStartColor,
			markerContent: marker.content,
			textDecoration: style.textDecorationLine,
		};
	});

	// One accent marker and no more: the registered edge. Position is also
	// carried by contrast, the convention the header's current entry follows:
	// full-contrast ink and a heavier weight, never the accent, and no tint,
	// pill, or generic link underline.
	expect(geometry.backgroundImage).toBe("none");
	expect(geometry.backgroundColor).toBe("rgba(0, 0, 0, 0)");
	expect(geometry.borderRadius).toBe("0px");
	expect(geometry.leadingEdge).toBe(2);
	expect(geometry.leadingEdgeColor).toBe(geometry.accent);
	expect(geometry.color).toBe(geometry.contrast);
	expect(geometry.color).not.toBe(geometry.accent);
	expect(geometry.color).not.toBe(inactiveStyle.color);
	expect(Number(geometry.fontWeight)).toBeGreaterThan(
		Number(inactiveStyle.fontWeight),
	);
	expect(geometry.textDecoration).toBe("none");

	// One rail. The shell used to add a second accent-coloured bar as a ::before on
	// top of the one the framework paints.
	expect(geometry.markerContent).toBe("none");
});

// --- Navbar: one collapse breakpoint, one row ---------------------------

test("the navbar collapses at a single breakpoint with a complete menu", async ({
	page,
}) => {
	// The shell used to have three states, not two. The toggler appeared at
	// 1023px but the controls only moved into it at 575px, so across the
	// whole tablet range the menu opened onto an empty "Display" heading
	// while version, preset and theme sat outside it, and the bar, unable
	// to fit them beside the search, wrapped onto a second grid row: a
	// 155px sticky header on every page. Both halves are asserted here,
	// because either one alone can come back.
	// Every width, and the same width with a classic scrollbar taken out of
	// it (helpers/viewport.js). Which side of the tier a window falls on is
	// then read off the layout viewport rather than assumed from the number
	// passed to setViewportSize: a 1024px window on a platform with classic
	// scrollbars has a 1009px layout viewport, so it is a *collapsed* shell
	// and the query below the 64rem tier is the one that applies.
	const widths = [1440, 1280, 1100, 1024, 1023, 900, 768, 576, 575, 390, 320]
		.flatMap(withAndWithoutScrollbar)
		.sort((a, b) => b - a);

	for (const width of widths) {
		await page.setViewportSize({ width, height: 800 });
		await page.goto(`${origin}/installation/`, { waitUntil: "networkidle" });

		// Ask the browser the question the stylesheet asks, rather than
		// recomputing it from a width. Chromium evaluates a width media
		// query against the window *including* a classic scrollbar while
		// laying content out in the box without it, so at a 1024px window on
		// the Linux runner `(width >= 64rem)` matches and the content box is
		// 1009px. Any arithmetic here has to pick one of those two numbers
		// and will be wrong about the other; matchMedia is neither.
		const isExpanded = await page.evaluate(
			() => matchMedia("(width >= 64rem)").matches,
		);

		const state = await page.evaluate(() => {
			const header = /** @type {HTMLElement} */ (
				document.querySelector(".docs-header")
			);
			const menu = /** @type {HTMLElement} */ (
				document.querySelector("[data-docs-menu-trigger]")
			);
			const group = document.querySelector(".docs-mobile-controls");
			return {
				headerHeight: Math.round(header.getBoundingClientRect().height),
				menuVisible: getComputedStyle(menu).display !== "none",
				inMenu: document.querySelectorAll(
					"[data-docs-mobile-controls] [data-docs-header-control]",
				).length,
				onBar: document.querySelectorAll(
					".docs-header-controls-group [data-docs-header-control]",
				).length,
				// Moved, never cloned: three controls in the document, always.
				total: document.querySelectorAll("[data-docs-header-control]").length,
				displayGroupVisible: group
					? getComputedStyle(group).display !== "none"
					: false,
				overflow:
					document.documentElement.scrollWidth -
					document.documentElement.clientWidth,
			};
		});

		const at = `at ${width}px (${isExpanded ? "expanded" : "collapsed"})`;
		expect(state.total, `controls are duplicated ${at}`).toBe(3);
		expect(state.overflow, `horizontal overflow ${at}`).toBeLessThanOrEqual(0);
		// One row, at every width. 155px was two.
		expect(
			state.headerHeight,
			`header is ${state.headerHeight}px ${at}`,
		).toBeLessThan(100);

		if (isExpanded) {
			expect(state.menuVisible, `toggler shows ${at}`).toBe(false);
			expect(state.onBar, `controls left the bar ${at}`).toBe(3);
			expect(state.inMenu, `controls moved early ${at}`).toBe(0);
			expect(state.displayGroupVisible, `empty group shows ${at}`).toBe(false);
		} else {
			expect(state.menuVisible, `toggler hidden ${at}`).toBe(true);
			// The transfer happens at the same width as the toggler. This is
			// the assertion the intermediate range used to fail.
			expect(state.inMenu, `controls not in the menu ${at}`).toBe(3);
			expect(state.onBar, `controls duplicated on the bar ${at}`).toBe(0);
			expect(state.displayGroupVisible, `"Display" is empty ${at}`).toBe(true);
		}
	}
});

test("the collapsed menu is complete, ordered, and returns focus", async ({
	page,
	browserName,
}) => {
	// 900px: squarely inside the range that used to be broken.
	await page.setViewportSize({ width: 900, height: 800 });
	await page.goto(`${origin}/installation/`, { waitUntil: "networkidle" });

	const actions = page.locator(".docs-header-actions");
	const search = page.locator("[data-docs-search-trigger]");
	const menu = page.locator("[data-docs-menu-drawer]");
	const trigger = page.locator("[data-docs-menu-trigger]");
	const panel = menu;
	const controls = panel.locator("[data-docs-mobile-controls]");

	// Search, then the toggler: in the DOM, so also in the tab order.
	expect(
		await actions.evaluate((element) =>
			Array.from(element.children).map((child) => child.className),
		),
	).toEqual(["docs-header-search", "ghost contrast docs-menu-toggle"]);
	const [searchBox, triggerBox] = await Promise.all([
		search.boundingBox(),
		trigger.boundingBox(),
	]);
	if (!searchBox || !triggerBox) throw new Error("collapsed bar is incomplete");
	expect(searchBox.x).toBeLessThan(triggerBox.x);

	await search.focus();
	if (!tabSkipsButtons(browserName)) {
		await page.keyboard.press("Tab");
		await expect(trigger).toBeFocused();
	}
	await trigger.focus();
	await expect(trigger).toHaveAttribute("aria-controls", "docs-mobile-menu-panel");
	await expect(trigger).toHaveAttribute("aria-expanded", "false");
	await page.keyboard.press("Enter");
	await expect(trigger).toHaveAttribute("aria-expanded", "true");

	// Everything the expanded bar carries is in here, and nothing is missing.
	for (const name of ["Docs", "Examples"]) {
		await expect(panel.getByRole("link", { name, exact: true })).toBeVisible();
	}
	await expect(panel.getByRole("link", { name: /GitHub/ })).toBeVisible();
	await expect(controls.locator("[data-docs-version-select]")).toBeVisible();
	await expect(controls.locator("[data-cirth-preset-select]")).toBeVisible();
	await expect(controls.locator(".docs-theme-toggle")).toBeVisible();

	await controls.locator("[data-docs-version-select]").focus();
	await page.keyboard.press("Escape");
	await expect(menu).not.toHaveAttribute("open", "");
	await expect(trigger).toHaveAttribute("aria-expanded", "false");
	await expect(trigger).toBeFocused();

	// Expanding again puts the controls back and closes the menu behind them.
	await trigger.press("Enter");
	await expect(menu).toHaveAttribute("open", "");
	await page.setViewportSize({ width: 1280, height: 800 });
	await expect(trigger).toBeHidden();
	await expect(menu).not.toHaveAttribute("open", "");
	await expect(
		page.locator(".docs-header-controls-group [data-docs-header-control]"),
	).toHaveCount(3);
	await expect(page.locator("[data-docs-header-control]")).toHaveCount(3);
});

test("the navbar states are a contrast ladder, not the accent", async ({
	page,
}) => {
	// Bootstrap's navbar ladder: resting ink below the hover step, hover
	// below the current item, current at full contrast, and none of the
	// three is the accent, which in chrome belongs to actions.
	await page.setViewportSize({ width: 1280, height: 800 });
	// Where "Docs" leads, so it is the current item there.
	await page.goto(`${origin}/why-cirth/`, { waitUntil: "networkidle" });

	const current = page.locator('.docs-nav-item a[aria-current="page"]');
	const other = page.locator(".docs-nav-item a:not([aria-current])");
	await expect(current).toHaveCount(1);

	/** @param {import("@playwright/test").Locator} locator */
	const read = (locator) =>
		locator.evaluate((element) => {
			const style = getComputedStyle(element);
			return {
				color: style.color,
				weight: style.fontWeight,
				decoration: style.textDecorationLine,
				underline: style.borderBottomWidth,
			};
		});

	const [resting, active, accent] = await Promise.all([
		read(other.first()),
		read(current),
		// Resolved, not the raw token: --cirth-primary-text aliases a light-dark()
		// expression, and comparing it as a string compares nothing.
		page.evaluate(() => {
			const probe = document.createElement("span");
			probe.style.color = "var(--cirth-primary-text)";
			document.body.append(probe);
			const value = getComputedStyle(probe).color;
			probe.remove();
			return value;
		}),
	]);
	await other.first().hover();
	const hovered = await read(other.first());

	/** @param {string} value */
	const luminance = (value) => {
		const [, l] = value.match(/oklab\(([\d.]+)|oklch\(([\d.]+)/) ?? [];
		return Number.parseFloat(l ?? value.match(/[\d.]+/)?.[0] ?? "0");
	};
	// Three distinct steps, in order.
	expect(resting.color).not.toBe(hovered.color);
	expect(hovered.color).not.toBe(active.color);
	expect(active.color).not.toBe(accent);
	expect(luminance(active.color)).toBeLessThan(luminance(hovered.color));
	expect(luminance(hovered.color)).toBeLessThan(luminance(resting.color));

	// The current item is not carried by colour alone, and nothing
	// decorative is layered on top of it.
	expect(active.weight).not.toBe(resting.weight);
	expect(active.decoration).toBe("none");
	expect(resting.decoration).toBe("none");
	expect(Number.parseFloat(active.underline)).toBe(0);

	// A card's own header keeps the ordinary nav language: the navbar rule
	// used to reach it through `header nav li`.
	const scoped = await page.evaluate(() => {
		const host = document.createElement("div");
		host.innerHTML =
			'<article><header><nav><ul><li><a href="#a" aria-current="page">a</a></li></ul></nav></header></article>';
		document.body.append(host);
		const link = /** @type {HTMLElement} */ (host.querySelector("a"));
		const style = getComputedStyle(link);
		const result = {
			edge: Number.parseFloat(style.borderBottomWidth),
			edgeColor: style.borderBottomColor,
		};
		host.remove();
		return result;
	});
	expect(scoped.edge).toBe(2);
	expect(scoped.edgeColor).toBe(accent);
});

// --- The proof band -----------------------------------------------------

// Six claims, one card each, and what is worth pinning is that every card
// says what kind of claim it is and where to check it. A guarantee and a
// capability age differently, and a page that presents them identically is
// promising the weaker one.
test("the facts band is four checked facts on one ruled band", async ({
	page,
}) => {
	await page.setViewportSize({ width: 1280, height: 900 });
	await page.goto(`${origin}/`, { waitUntil: "networkidle" });

	const band = page.locator(".docs-facts-band");
	const facts = band.locator(".docs-fact-list > div");
	await expect(facts).toHaveCount(4);

	// Every fact: a label, a value, and the link that checks it.
	for (let index = 0; index < 4; index++) {
		const fact = facts.nth(index);
		await expect(fact.locator("dt")).toHaveCount(1);
		await expect(fact.locator("dd strong")).toHaveCount(1);
		const link = fact.locator("dd a");
		await expect(link, `fact ${index} has a check path`).toHaveCount(1);
		expect((await link.getAttribute("href")) || "").not.toBe("");
	}
	// The size is the build's own measurement, not a figure typed in.
	await expect(facts.nth(1).locator("strong")).toHaveText(/^\d+(\.\d+)? KB$/);

	// A band, not four boxes: no fact paints a surface or casts a shadow of
	// its own, and the band is divided by the separator.
	const paint = await facts.evaluateAll((items) =>
		items.map((item) => {
			const style = getComputedStyle(item);
			return { background: style.backgroundColor, shadow: style.boxShadow };
		}),
	);
	for (const fact of paint) {
		expect(fact.background).toBe("rgba(0, 0, 0, 0)");
		expect(fact.shadow).toBe("none");
	}
	const rules = await band.evaluate((element) => {
		const style = getComputedStyle(element);
		return [style.borderTopWidth, style.borderBottomWidth];
	});
	expect(rules).not.toContain("0px");

	// Four across on a wide screen, one per row on a phone, and nothing
	// wider than the viewport at either.
	for (const [width, columns] of /** @type {const} */ ([
		[1280, 4],
		[390, 1],
	])) {
		await page.setViewportSize({ width, height: 900 });
		const layout = await page.locator(".docs-fact-list").evaluate((element) => ({
			columns: getComputedStyle(element).gridTemplateColumns.split(" ").length,
			overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
		}));
		expect(layout.columns, `columns at ${width}px`).toBe(columns);
		expect(layout.overflow, `horizontal overflow at ${width}px`).toBeLessThanOrEqual(0);
	}
});

// --- The hero composition -----------------------------------------------

// The source pane and the card beside it are one string in home.njk,
// highlighted into one and rendered into the other. The contract is that
// they cannot drift: the rendered card is exactly the markup listed.
test("the hero's result is exactly the markup in its source pane", async ({
	page,
}) => {
	await page.goto(`${origin}/`, { waitUntil: "networkidle" });

	const [listed, rendered] = await Promise.all([
		page.locator(".docs-hero-source pre code").evaluate((element) => element.textContent ?? ""),
		page.locator(".docs-hero-render").evaluate((element) => element.innerHTML),
	]);
	expect(normalizeMarkup(rendered)).toBe(normalizeMarkup(listed));
	// Highlighted at build time: there is no highlighter in the browser.
	expect(
		await page.locator(".docs-hero-source .hljs-name").count(),
	).toBeGreaterThan(10);
});

test("the hero moves once, only where motion is welcome, and its result follows the page", async ({
	page,
}) => {
	await page.emulateMedia({ reducedMotion: "no-preference" });
	await page.goto(`${origin}/`, { waitUntil: "networkidle" });

	// The demo makes its argument by being read. The copy button stays: it
	// is the affordance every code block on the site carries. Everything
	// else operable in there belongs to the rendered card, which is inert.
	await expect(page.locator(".docs-hero-render")).toHaveAttribute("inert", "");
	const stray = await page.locator(".docs-hero-demo").evaluate((element) =>
		[...element.querySelectorAll("a, button, input, select, textarea")].filter(
			(node) => !node.closest("[inert]") && !node.classList.contains("copy"),
		).length,
	);
	expect(stray, "operable controls outside the inert card").toBe(0);

	// One entrance, and it ends: every animation in the hero that runs on
	// the clock is finite, and none of them repeats. The field's drift is
	// tied to the scroll where scroll timelines exist, so it moves only
	// while the reader does and has no duration of its own.
	const animations = await page.locator(".docs-hero").evaluate((element) =>
		element.getAnimations({ subtree: true }).map((animation) => {
			const timing = animation.effect?.getComputedTiming();
			return {
				scroll: !(animation.timeline instanceof DocumentTimeline),
				iterations: timing?.iterations,
				duration: Number(timing?.duration),
			};
		}),
	);
	const timed = animations.filter((animation) => !animation.scroll);
	expect(timed.length, "the entrance runs where motion is welcome").toBeGreaterThan(0);
	for (const animation of timed) {
		expect(animation.iterations).toBe(1);
		expect(animation.duration).toBeLessThanOrEqual(2000);
	}
	for (const animation of animations.filter((animation) => animation.scroll)) {
		expect(animation.iterations, "a scroll-linked drift does not repeat").toBe(1);
	}

	// With the preference set, nothing in the hero moves at all.
	await page.emulateMedia({ reducedMotion: "reduce" });
	await page.reload({ waitUntil: "networkidle" });
	expect(
		await page
			.locator(".docs-hero")
			.evaluate((element) => element.getAnimations({ subtree: true }).length),
	).toBe(0);

	// The result is rendered by the page's own stylesheet, so it follows the
	// page's scheme without being told.
	const card = page.locator(".docs-hero-render article");
	const light = await card.evaluate((element) => getComputedStyle(element).backgroundColor);
	await page.locator(".docs-theme-toggle").click();
	await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
	const dark = await card.evaluate((element) => getComputedStyle(element).backgroundColor);
	expect(dark).not.toBe(light);
});

// --- Framework agnostic --------------------------------------------------

test("the framework band shows the ecosystems and leads each mark to its project", async ({
	page,
}) => {
	const frameworks = require("../docs/src/_data/frameworks.js");
	await page.goto(`${origin}/`, { waitUntil: "networkidle" });
	const band = page.locator(".docs-agnostic");
	await expect(band.locator("h2")).toHaveText("Framework agnostic. Works everywhere.");
	// The page's own scheme: no scheme forced on the band, so each mark
	// shows the variant its project publishes for the page's ground.
	await expect(band).not.toHaveAttribute("data-theme", /.*/);
	await expect(band.locator("[data-theme]")).toHaveCount(0);
	// No card under any mark: the orbit is the composition.
	const tile = await band.locator(".docs-agnostic-mark").first().evaluate((link) => ({
		border: getComputedStyle(link).borderTopStyle,
		background: getComputedStyle(link).backgroundColor,
	}));
	expect(tile.border).toBe("none");
	expect(tile.background).toBe("rgba(0, 0, 0, 0)");

	// The marks are the data's featured set, each a link to the project's
	// own site, named as one; the images inside are decorative and carry
	// their size, so nothing moves while they load.
	const links = await band.locator(".docs-agnostic-orbit a").evaluateAll((items) =>
		items.map((item) => ({
			href: item.getAttribute("href"),
			name: item.getAttribute("aria-label"),
			images: [...item.querySelectorAll("img")].map((image) => ({
				alt: image.getAttribute("alt"),
				src: image.getAttribute("src"),
				width: Number(image.getAttribute("width")),
				height: Number(image.getAttribute("height")),
				shown: getComputedStyle(image).display !== "none",
			})),
		})),
	);
	expect(links.map((link) => link.href)).toEqual(
		frameworks.featured.map((/** @type {{ officialUrl: string }} */ guide) => guide.officialUrl),
	);
	links.forEach((link, index) => {
		expect(link.name).toBe(`${frameworks.featured[index].name} website`);
		expect(link.images.filter((image) => image.shown), `${link.name}: one variant shows`).toHaveLength(1);
		for (const image of link.images) {
			expect(image.alt).toBe("");
			expect(image.src).toMatch(/^\/logos\/frameworks\/[\w-]+\.(svg|png)$/);
			expect(image.width).toBeGreaterThan(0);
			expect(image.height).toBeGreaterThan(0);
		}
	});
	// Spread over the ecosystems, not one family of tools.
	const categories = new Set(frameworks.featured.map((/** @type {{ category: string }} */ guide) => guide.category));
	expect(categories.size).toBeGreaterThanOrEqual(5);

	// One way on, with the list's own count.
	const action = band.getByRole("button");
	await expect(action).toHaveText(`Browse all ${frameworks.count} guides`);
	await expect(action).toHaveAttribute("href", "/installation#guides");

	// The variant follows the page: Django's positive logo on a light page,
	// its negative one on a dark page.
	const django = band.locator(`a[href="${frameworks.byId.django.officialUrl}"] img`);
	const shown = () =>
		django.evaluateAll((images) => images.filter((image) => getComputedStyle(image).display !== "none").map((image) => image.getAttribute("src")));
	const scheme = await page.locator("html").getAttribute("data-theme");
	const first = await shown();
	await page.locator(".docs-theme-toggle").click();
	await expect(page.locator("html")).not.toHaveAttribute("data-theme", String(scheme));
	const second = await shown();
	const byScheme = scheme === "dark" ? { dark: first, light: second } : { light: first, dark: second };
	expect(byScheme.light).toEqual([`/logos/frameworks/${frameworks.marks.django.file}`]);
	expect(byScheme.dark).toEqual([`/logos/frameworks/${frameworks.marks.django.dark}`]);
});

test("the marks orbit Cirth's behind no line, stay upright, and turn only with the scroll", async ({ page }) => {
	await page.emulateMedia({ reducedMotion: "no-preference" });
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto(`${origin}/`, { waitUntil: "networkidle" });
	const band = page.locator(".docs-agnostic");
	const orbit = page.locator(".docs-agnostic-orbit");
	/** Each mark's centre, and how far its box is turned. */
	const read = () =>
		orbit.locator("li").evaluateAll((items) =>
			items.map((item) => {
				const box = item.getBoundingClientRect();
				const matrix = new DOMMatrix(getComputedStyle(item).transform);
				return {
					x: Math.round(box.left + box.width / 2),
					y: Math.round(box.top + box.height / 2),
					turn: Math.round((Math.atan2(matrix.b, matrix.a) * 180) / Math.PI),
				};
			}),
		);
	await band.evaluate((element) => window.scrollTo(0, element.getBoundingClientRect().top + window.scrollY - 200));
	await page.waitForFunction(() => document.querySelector(".docs-agnostic-orbit")?.getAttribute("style")?.includes("--docs-orbit"));
	const at = await read();
	for (const mark of at) expect(Math.abs(mark.turn), "a mark is turned").toBeLessThanOrEqual(0);

	// Two rings round one centre, drawn behind the marks: the rings sit
	// under the orbit and the core above it, and neither takes the pointer.
	const field = await page.locator(".docs-agnostic-field").evaluate((element) => {
		const box = element.getBoundingClientRect();
		const ring = getComputedStyle(element, "::after");
		return {
			x: box.left + box.width / 2,
			y: box.top + box.height / 2,
			size: box.width,
			isolated: getComputedStyle(element).isolation,
			ringZ: ring.zIndex,
			ringEvents: ring.pointerEvents,
			orbitZ: getComputedStyle(/** @type {Element} */ (element.querySelector(".docs-agnostic-orbit"))).zIndex,
			coreZ: getComputedStyle(/** @type {Element} */ (element.querySelector(".docs-agnostic-core"))).zIndex,
			coreEvents: getComputedStyle(/** @type {Element} */ (element.querySelector(".docs-agnostic-core"))).pointerEvents,
		};
	});
	expect(field.isolated).toBe("isolate");
	expect(Number(field.ringZ)).toBeLessThan(Number(field.orbitZ));
	expect(Number(field.coreZ)).toBeGreaterThan(Number(field.orbitZ));
	expect(field.ringEvents).toBe("none");
	expect(field.coreEvents).toBe("none");
	const radii = at.map((mark) => Math.hypot(mark.x - field.x, mark.y - field.y) / field.size);
	expect([...new Set(radii.map((radius) => Math.round(radius * 10)))].sort()).toEqual([2, 4]);
	await expect(page.locator(".docs-agnostic-core img:visible")).toHaveCount(1);
	// Every mark's link stands on a disc of the canvas, so no ring line runs
	// through it, and is the element under its own centre (nothing on top).
	const marks = await orbit.locator("a").evaluateAll((links) =>
		links.map((link) => {
			const box = link.getBoundingClientRect();
			const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
			return { disc: getComputedStyle(link).backgroundImage, own: Boolean(hit && link.contains(hit)) };
		}),
	);
	for (const mark of marks) {
		expect(mark.disc).toMatch(/radial-gradient/);
		expect(mark.own, "a mark is covered").toBe(true);
	}

	// The rings turn with the scroll, never on their own, and hold still
	// under the pointer.
	const still = await read();
	await page.waitForTimeout(600);
	expect(await read(), "the orbit moved on its own").toEqual(still);
	await page.mouse.wheel(0, 300);
	await expect.poll(async () => (await read()).some((mark, index) => mark.x !== still[index].x)).toBe(true);
	for (const mark of await read()) expect(Math.abs(mark.turn)).toBeLessThanOrEqual(0);
	const box = await orbit.boundingBox();
	if (!box) throw new Error("no orbit");
	await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
	const held = await orbit.getAttribute("style");
	await page.mouse.wheel(0, 120);
	await page.waitForTimeout(200);
	expect(await orbit.getAttribute("style"), "the orbit moved under the pointer").toBe(held);

	// A phone and reduced motion: still, and no CSS animation anywhere.
	for (const [width, motion] of /** @type {const} */ ([[390, "no-preference"], [1440, "reduce"]])) {
		await page.emulateMedia({ reducedMotion: motion });
		await page.setViewportSize({ width, height: 900 });
		await page.goto(`${origin}/`, { waitUntil: "networkidle" });
		await band.evaluate((element) => element.scrollIntoView());
		await page.mouse.wheel(0, 200);
		await page.waitForTimeout(200);
		expect(await orbit.getAttribute("style"), `${width}px ${motion}`).toBeNull();
		await expect(orbit).toHaveCSS("animation-name", "none");
	}
});

// --- Installation widgets -----------------------------------------------

test("the package manager switch shows one command and remembers the choice", async ({
	page,
}) => {
	await page.goto(`${origin}/installation/`, { waitUntil: "networkidle" });
	const install = page.locator("[data-docs-install]").first();
	const visible = () =>
		install.locator("pre").evaluateAll((items) =>
			items
				.filter((item) => getComputedStyle(item).display !== "none")
				.map((item) => item.textContent?.trim()),
		);
	expect(await visible()).toEqual(["npm install @cirthcss/cirth"]);

	await install.getByLabel("pnpm").check();
	expect(await visible()).toEqual(["pnpm add @cirthcss/cirth"]);

	// A radio group named by its legend: native radios in labels of their
	// own, apart rather than joined, each label the whole target, as tall as
	// the header's controls. Not a tab strip: no tab roles, and no class
	// that draws one.
	const group = install.getByRole("group", { name: "Package manager" });
	await expect(group).toHaveCount(1);
	await expect(group.getByRole("radio")).toHaveCount(4);
	await expect(install.locator("fieldset.segmented, [role='tab'], [role='tablist']")).toHaveCount(0);
	const labels = await install.locator("label").evaluateAll((items) =>
		items.map((item) => item.getBoundingClientRect()),
	);
	for (const label of labels) expect(Math.round(label.height)).toBeGreaterThanOrEqual(40);
	for (let index = 1; index < labels.length; index++) {
		expect(
			labels[index].left - labels[index - 1].right,
			"the options stand apart",
		).toBeGreaterThanOrEqual(4);
	}

	// The keyboard walks it the way it walks any radio group.
	await install.getByLabel("pnpm").focus();
	await page.keyboard.press("ArrowRight");
	await expect(install.getByLabel("Yarn")).toBeChecked();
	expect(await visible()).toEqual(["yarn add @cirthcss/cirth"]);
	await install.getByLabel("pnpm").check();

	// The choice follows the reader to the next guide.
	await page.goto(`${origin}/installation/vite/`, { waitUntil: "networkidle" });
	await expect(page.locator("[data-docs-install] input[value='pnpm']")).toBeChecked();
});

// --- Pages that moved ---------------------------------------------------

test("an old address forwards to the page that replaced it", async ({ page }) => {
	for (const [from, to] of [
		["/get-started/#cdn", "/installation/#cdn"],
		["/get-started/#excluding-a-third-party-component", "/compatibility/#excluding-a-third-party-component"],
		["/deploy/#caching", "/compatibility/#caching"],
		["/utilities/reduce-motion/", "/guides/accessibility/#reduced-motion"],
		// The CDN guide became the Installation page's first section. For a
		// while the JavaScript guides were one page with a section each;
		// each tool has its own page again, and a link to a section lands
		// on that tool's page.
		["/installation/cdn/", "/installation/#cdn"],
		["/installation/cdn/#choosing-a-build", "/compatibility/#every-build-from-the-cdn"],
		["/installation/javascript/", "/installation/#guides"],
		["/installation/javascript/#react", "/installation/react/"],
		["/installation/javascript/#3-set-the-css-target", "/installation/vite/#3-set-the-css-target"],
	]) {
		await page.goto(`${origin}${from}`);
		await page.waitForURL(`${origin}${to}`);
		expect(page.url()).toBe(`${origin}${to}`);
	}
	// And says so without script, with a canonical link and a way to go on.
	const response = await page.request.get(`${origin}/deploy/`);
	const html = await response.text();
	expect(html).toMatch(/<link rel="canonical" href="\/compatibility\/"/);
	expect(html).toMatch(/<meta name="robots" content="noindex"/);
	expect(html).toMatch(/<a href="\/compatibility\/">Compatibility<\/a>/);

	// The guides that came back are pages again, not forwards.
	for (const slug of ["vite", "react", "vue", "sveltekit", "astro"]) {
		const guide = await page.request.get(`${origin}/installation/${slug}/`);
		const text = await guide.text();
		expect(text, slug).not.toMatch(/<meta name="robots" content="noindex"/);
		expect(text, slug).toMatch(/class="docs-guide-title"/);
	}
});

test.describe("without JavaScript", () => {
	test.use({ javaScriptEnabled: false });

	test("the hero demo serves the complete source and the real output", async ({
		page,
	}) => {
		await page.goto(`${origin}/`, { waitUntil: "load" });

		const code = page.locator(".docs-hero-source pre code");
		await expect(code).toContainText("<article>");
		await expect(code).toContainText('<input type="password" required>');
		await expect(code).toContainText("<button>Sign in</button>");
		await expect(code).not.toContainText("…");
		// Highlighted at build time, so it is highlighted here too.
		expect(await code.locator("span").count()).toBeGreaterThan(10);
		// The output is the real stylesheet rendering the real card.
		await expect(
			page.locator(".docs-hero-render").getByRole("heading", { name: "Sign in" }),
		).toHaveCount(1);
		await expect(page.locator(".docs-hero-render article")).toBeVisible();
		// The facts are readable without a line of script.
		await expect(page.locator(".docs-fact-list > div")).toHaveCount(4);
	});

	// Every scene is whole without a script: the story's three pictures,
	// the browser's own rendering from a declarative shadow root, the
	// measured figures, the finished theme, and the presets comparator at
	// the middle, without a control that could not move anything.
	test("every scene of the home page needs no script", async ({ page }) => {
		await page.goto(`${origin}/`, { waitUntil: "load" });

		await expect(page.locator(".docs-home")).not.toHaveAttribute("data-stage", /.*/);
		for (const part of ["1", "2", "3"]) {
			await expect(page.locator(`[data-docs-story-part="${part}"]`)).toBeVisible();
			await expect(page.locator(`[data-docs-story-part="${part}"] figcaption`)).not.toBeEmpty();
		}
		await expect(page.locator("[data-docs-story-code]")).toContainText("<button type=\"button\">Show ticket</button>");
		expect(
			await page
				.locator(".docs-story-ua")
				.evaluate((element) => element.shadowRoot?.querySelector("meter") !== null),
		).toBe(true);
		await expect(page.locator('[role="tablist"], [role="tab"], [role="tabpanel"]')).toHaveCount(0);
		await expect(page.locator(".docs-measured-fact")).toHaveCount(3);
		await expect(page.locator(".docs-measured-figure strong").first()).toHaveText("0");

		// The finished theme, with all three of its declarations.
		const themeOn = await page
			.locator(".docs-theme-copy")
			.evaluate((element) => [...(element.shadowRoot?.querySelectorAll("style[data-docs-theme-state]") ?? [])].filter((style) => /** @type {HTMLStyleElement} */ (style).media === "all").map((style) => /** @type {HTMLElement} */ (style).dataset.docsThemeState));
		expect(themeOn).toEqual(["canvas"]);
		await expect(page.locator(".docs-theme-code")).toContainText("1.125rem");

		await expect(page.locator("[data-docs-compare-range]")).toBeHidden();
		await expect(page.locator("[data-docs-compare-preset]")).toBeHidden();
		const halves = await page
			.locator(".docs-compare-layer")
			.evaluateAll((layers) => layers.map((layer) => layer.shadowRoot?.querySelectorAll("button").length ?? 0));
		expect(halves).toEqual([2, 2]);
		await expect(page.locator(".docs-compare")).toBeVisible();

		await page.locator(".docs-pure").getByRole("button", { name: "Get started" }).click();
		await expect(page).toHaveURL(/\/installation\/?$/);
	});
});


// --- The home page's story -----------------------------------------------

// The story's specimen is declared once in home.njk and used three times:
// listed, rendered with no stylesheet, and rendered by Cirth. The contract
// worth pinning is that the three are the same markup.
const normalizeMarkup = (/** @type {string} */ html) =>
	html
		.replace(/\s+/g, " ")
		.replace(/>\s+</g, "><")
		// `open` and `open=""` are the same attribute; `outerHTML` always
		// writes the second.
		.replace(/=""/g, "")
		.trim();

test("the story lists the markup it renders, with and without Cirth", async ({ page }) => {
	await page.goto(`${origin}/`, { waitUntil: "networkidle" });
	const listed = normalizeMarkup((await page.locator("[data-docs-story-code]").textContent()) ?? "");
	const cirth = normalizeMarkup(await page.locator(".docs-story-result").evaluate((element) => element.innerHTML));
	const browser = normalizeMarkup(
		await page.locator(".docs-story-ua").evaluate((element) => element.shadowRoot?.querySelector(".ua")?.innerHTML ?? ""),
	);
	expect(listed).toContain('<meter value="0.7" low="0.5" high="0.8" optimum="0">70%</meter>');
	// No class anywhere in it: the elements say what they are.
	expect(listed).not.toMatch(/\sclass=/);
	expect(cirth).toBe(listed);
	expect(browser).toBe(listed);
});

test("the browser's picture is its defaults and a picture; Cirth's ticket is live and the library's own", async ({ page }) => {
	await page.goto(`${origin}/`, { waitUntil: "networkidle" });
	const ua = page.locator(".docs-story-ua");
	await expect(ua).toHaveAttribute("inert", "");
	const looks = await page.evaluate(() => {
		const host = /** @type {HTMLElement} */ (document.querySelector(".docs-story-ua"));
		const plain = /** @type {HTMLElement} */ (host.shadowRoot?.querySelector("button"));
		const styled = /** @type {HTMLElement} */ (document.querySelector(".docs-story-result button"));
		return {
			plainFont: getComputedStyle(/** @type {Element} */ (host.shadowRoot?.querySelector(".ua"))).fontFamily,
			pageFont: getComputedStyle(document.body).fontFamily,
			plainHeight: plain.getBoundingClientRect().height,
			styledHeight: styled.getBoundingClientRect().height,
			// Nothing in home.css restyles the ticket's own elements: no rule
			// there names an element inside the result.
			homeRules: [...document.styleSheets]
				.filter((sheet) => sheet.href?.endsWith("/styles/home.css"))
				.flatMap((sheet) => [...sheet.cssRules].flatMap((rule) => ("cssRules" in rule ? [rule, .../** @type {CSSGroupingRule} */ (rule).cssRules] : [rule])))
				.map((rule) => /** @type {CSSStyleRule} */ (rule).selectorText ?? "")
				.filter((selector) => /\.docs-story-result\s*>?\s*(?:article\s+)?(?:hgroup|dl|dt|dd|meter|details|summary|button|label|time|h3|p)\b/.test(selector)),
		};
	});
	// No stylesheet reaches the picture: neither the page's face nor
	// Cirth's control size.
	expect(looks.plainFont).not.toBe(looks.pageFont);
	expect(looks.styledHeight).toBeGreaterThan(looks.plainHeight + 8);
	expect(looks.homeRules).toEqual([]);

	// Cirth's copy is the real thing: the disclosure opens and closes, the
	// gauge has its region, and the button takes the keyboard.
	const details = page.locator(".docs-story-result details");
	await expect(details).not.toHaveAttribute("open", "");
	await details.locator("summary").click();
	await expect(details).toHaveAttribute("open", "");
	await details.locator("summary").click();
	await expect(details).not.toHaveAttribute("open", "");
	expect(await page.locator(".docs-story-result meter").evaluate((meter) => /** @type {HTMLMeterElement} */ (meter).value)).toBe(0.7);
	const button = page.locator(".docs-story-result button");
	await button.focus();
	await expect(button).toBeFocused();
});

// --- The presets comparator -------------------------------------------

test("the import line under the list is the preset the halves wear", async ({ page }) => {
	await page.goto(`${origin}/`, { waitUntil: "networkidle" });
	const options = await page.locator("[data-docs-compare-preset] option").evaluateAll((items) => items.map((item) => [item.getAttribute("value"), item.textContent?.trim()]));
	expect(options).toEqual([["default", "Default"], ["material", "Material"], ["metro", "Metro"], ["plain", "Plain"]]);
	const line = page.locator("[data-docs-compare-import][data-current]");
	await expect(line).toHaveText('@import "@cirthcss/cirth";');
	for (const name of ["material", "metro", "plain"]) {
		await page.locator("[data-docs-compare-preset]").selectOption(name);
		await expect(line).toHaveText(`@import "@cirthcss/cirth/presets/${name}";`);
		await expect(line).toBeVisible();
		await expect(page.locator("[data-docs-compare-import]:not([data-current])").first()).toHaveCSS("visibility", "hidden");
	}
	// One short line, not a block competing with the comparator.
	await expect(page.locator(".docs-presets pre")).toHaveCount(0);
});

test("one preset in both halves: light on the left, dark on the right, never on the host", async ({ page }) => {
	await page.goto(`${origin}/`, { waitUntil: "networkidle" });
	const read = () =>
		page.locator(".docs-compare-layer").evaluateAll((layers) =>
			layers.map((layer) => {
				const root = /** @type {ShadowRoot} */ (layer.shadowRoot);
				const surface = /** @type {Element} */ (root.querySelector("[data-docs-compare-surface]"));
				return {
					host: layer.getAttribute("data-theme"),
					theme: surface.getAttribute("data-theme"),
					scheme: getComputedStyle(surface).colorScheme,
					canvas: getComputedStyle(surface).backgroundColor,
					radius: getComputedStyle(/** @type {Element} */ (root.querySelector('input[type="email"]'))).borderTopLeftRadius,
					on: [...root.querySelectorAll("link[data-docs-preset]")].filter((link) => /** @type {HTMLLinkElement} */ (link).media === "all").map((link) => /** @type {HTMLElement} */ (link).dataset.docsPreset),
				};
			}),
		);
	const pick = page.locator("[data-docs-compare-preset]");
	await expect(pick).toBeVisible();
	await expect(pick).toHaveValue("default");
	/** @type {Record<string, string>} */
	const radii = {};
	for (const name of ["default", "material", "metro", "plain"]) {
		await pick.selectOption(name);
		const [light, dark] = await read();
		expect(light.host, "a data-theme on the shadow host").toBeNull();
		expect(dark.host, "a data-theme on the shadow host").toBeNull();
		expect([light.theme, dark.theme]).toEqual(["light", "dark"]);
		expect([light.scheme, dark.scheme]).toEqual(["light", "dark"]);
		expect(light.canvas).not.toBe(dark.canvas);
		// The same theme on both sides.
		expect(light.radius).toBe(dark.radius);
		expect(light.on).toEqual(name === "default" ? [] : [name]);
		expect(dark.on).toEqual(light.on);
		radii[name] = light.radius;
	}
	expect(radii.metro).toBe("0px");
	expect(new Set(Object.values(radii)).size).toBeGreaterThan(2);

	// The page's own scheme and preset reach neither half.
	const before = await read();
	await page.locator(".docs-theme-toggle").click();
	await page.locator("[data-cirth-preset-select]").first().selectOption("material");
	await page.waitForTimeout(500);
	expect((await read()).map((half) => [half.scheme, half.canvas, half.radius])).toEqual(before.map((half) => [half.scheme, half.canvas, half.radius]));
});

test("picking a preset moves nothing on the page", async ({ page }) => {
	for (const width of [320, 390, 1024, 1440]) {
		await page.setViewportSize({ width, height: 900 });
		await page.goto(`${origin}/`, { waitUntil: "networkidle" });
		const layout = () =>
			page.evaluate(() =>
				[".docs-compare-frame", ".docs-compare > figcaption", ".docs-presets .docs-section-more", ".docs-agnostic"].map((selector) => {
					const box = /** @type {Element} */ (document.querySelector(selector)).getBoundingClientRect();
					return [Math.round(box.top + window.scrollY), Math.round(box.height)];
				}),
			);
		const first = await layout();
		for (const name of ["material", "metro", "plain", "default"]) {
			await page.locator("[data-docs-compare-preset]").selectOption(name);
			expect(await layout(), `${width}px ${name}`).toEqual(first);
		}
	}
});

test("the divider is a real range: keyboard, pointer, a name and a value", async ({ page }) => {
	await page.goto(`${origin}/`, { waitUntil: "networkidle" });
	const compare = page.locator("[data-docs-compare]");
	const range = page.getByRole("slider", { name: "Divider between the light and the dark scheme" });
	await expect(range).toHaveCount(1);
	await expect(range).toHaveAttribute("aria-valuetext", "Half light, half dark");
	const split = () => compare.evaluate((element) => getComputedStyle(element).getPropertyValue("--docs-split").trim());

	await range.focus();
	await page.keyboard.press("Home");
	await expect(range).toHaveValue("0");
	await expect(range).toHaveAttribute("aria-valuetext", "All dark");
	await page.keyboard.press("End");
	await expect(range).toHaveAttribute("aria-valuetext", "All light");
	await page.keyboard.press("Home");
	for (let index = 0; index < 20; index++) await page.keyboard.press("ArrowRight");
	await expect(range).toHaveValue("20");
	expect(await split()).toBe("20%");
	await expect(range).toHaveAttribute("aria-valuetext", "20% light, 80% dark");
	// The ring is drawn on the handle, where the reader looks.
	await expect(page.locator(".docs-compare-handle")).not.toHaveCSS("outline-style", "none");

	// A press anywhere on the frame moves the divider there.
	const frame = await page.locator(".docs-compare-frame").boundingBox();
	if (!frame) throw new Error("no frame");
	await page.mouse.click(frame.x + frame.width * 0.75, frame.y + frame.height / 2);
	const value = Number(await range.inputValue());
	expect(value).toBeGreaterThanOrEqual(72);
	expect(value).toBeLessThanOrEqual(78);

	// The two copies are pictures: the list and the range are the only
	// controls, and Tab meets each of them once.
	for (const layer of await page.locator(".docs-compare-layer").all()) {
		await expect(layer).toHaveAttribute("inert", "");
	}
	const focusable = await page.locator(".docs-presets").evaluate((section) =>
		[...section.querySelectorAll("a, button, input, select, [tabindex]")].filter((element) => {
			const style = getComputedStyle(element);
			return !element.closest("[inert]") && style.visibility === "visible" && style.display !== "none" && !element.hasAttribute("hidden");
		}).map((element) => element.tagName),
	);
	expect(focusable.filter((tag) => tag === "SELECT")).toHaveLength(1);
	expect(focusable.filter((tag) => tag === "INPUT")).toHaveLength(1);

	// No labels drawn as badges over the frame: the schemes are named in
	// the copies' own ink.
	await expect(page.locator(".docs-compare-label")).toHaveCount(0);
	const names = await page.locator(".docs-compare-layer").evaluateAll((layers) => layers.map((layer) => layer.shadowRoot?.querySelector(".scheme")?.textContent));
	expect(names).toEqual(["Light", "Dark"]);
});

test("nothing moves the divider but the reader", async ({ page }) => {
	await page.emulateMedia({ reducedMotion: "no-preference" });
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto(`${origin}/`, { waitUntil: "networkidle" });
	const range = page.locator("[data-docs-compare-range]");
	const split = () => page.locator("[data-docs-compare]").evaluate((element) => getComputedStyle(element).getPropertyValue("--docs-split").trim());
	// Arriving at the comparator plays nothing: no hint, no animation.
	await page.locator(".docs-compare").evaluate((element) => element.scrollIntoView({ block: "center" }));
	await page.waitForTimeout(1800);
	expect(await split()).toBe("50%");
	expect(await page.locator(".docs-compare").evaluate((element) => element.getAnimations({ subtree: true }).length)).toBe(0);
	await range.focus();
	await page.keyboard.press("ArrowLeft");
	await page.waitForTimeout(1200);
	expect(await range.inputValue()).toBe("49");
	expect(await split()).toBe("49%");
});

// --- Your theme --------------------------------------------------------

test("the demonstration's theme is its own: no value is the default's or a preset's", () => {
	const fs = require("node:fs");
	const path = require("node:path");
	const themeDemo = require("../docs/src/_data/themeDemo.js");
	/** @param {string} text */
	const declared = (text) =>
		Object.fromEntries(
			[...text.matchAll(/(--cirth-[\w-]+):\s*([^;]+);/g)].map(([, prop, value]) => [
				prop,
				value.replace(/\s+/g, " ").replace(/\(\s+/g, "(").replace(/\s+\)/g, ")").replace(/(\d)deg\b/g, "$1").trim(),
			]),
		);
	const postcss = require("postcss");
	const generated = path.join(__dirname, "../docs/src/styles/generated");
	// A theme root's own declarations, at the top of the file or of its one
	// cascade layer, as the docs build reads them for the presets page.
	/** @param {string} file */
	const themeRoot = (file) => {
		/** @type {Record<string, string>} */
		const found = {};
		postcss.parse(fs.readFileSync(path.join(generated, file), "utf8")).walkRules((rule) => {
			const parent = rule.parent;
			const top = parent?.type === "root" || (parent?.type === "atrule" && /** @type {import("postcss").AtRule} */ (parent).name === "layer" && parent.parent?.type === "root");
			if (!top || !rule.selector.split(",").every((selector) => /^(:root|:host|\.cirth)$/.test(selector.trim()))) return;
			Object.assign(found, declared(rule.toString()));
		});
		return found;
	};
	/** @type {Record<string, Record<string, string>>} */
	const shipped = { default: themeRoot("cirth-lab-scoped.css") };
	for (const name of ["material", "metro", "plain"]) shipped[name] = themeRoot(`presets/${name}.css`);
	for (const [name, values] of Object.entries(shipped)) {
		expect(values["--cirth-primary"], `${name} declares an accent`).toBeTruthy();
	}
	const normal = (/** @type {string} */ value) => value.replace(/\s+/g, " ").replace(/(\d)deg\b/g, "$1").trim();
	expect(themeDemo.states).toHaveLength(4);
	for (const state of themeDemo.states) {
		for (const token of themeDemo.tokens) {
			const value = normal(state.values[token]);
			for (const [name, values] of Object.entries(shipped)) {
				if (values[token]) expect(value, `${state.id} ${token} is ${name}'s`).not.toBe(normal(values[token]));
			}
		}
		// Not the default theme's or any preset's, as a whole either.
		for (const [name, values] of Object.entries(shipped)) {
			expect(themeDemo.tokens.every((token) => normal(state.values[token]) === normal(values[token] ?? "")), `${state.id} is ${name}`).toBe(false);
		}
	}
	// One declaration changes at each step, in the order the steps name.
	expect(themeDemo.states.slice(1).map((state) => state.changes)).toEqual(themeDemo.tokens);
	for (let index = 1; index < themeDemo.states.length; index += 1) {
		const changed = themeDemo.tokens.filter((token) => themeDemo.states[index].values[token] !== themeDemo.states[index - 1].values[token]);
		expect(changed).toEqual([themeDemo.states[index].changes]);
	}
});

test("the theme copy wears each state inside its shadow root, and reads at AA in every one", async ({ page }) => {
	const themeDemo = require("../docs/src/_data/themeDemo.js");
	for (const scheme of /** @type {const} */ (["light", "dark"])) {
		await page.emulateMedia({ colorScheme: scheme, reducedMotion: "no-preference" });
		await page.setViewportSize({ width: 1440, height: 900 });
		await page.goto(`${origin}/`, { waitUntil: "networkidle" });
		const host = page.locator(".docs-theme-copy");
		await expect(host).toHaveAttribute("inert", "");
		expect(await host.getAttribute("data-theme"), "a data-theme on the shadow host").toBeNull();
		for (const [index, p] of [0.05, 0.3, 0.52, 0.85].entries()) {
			await page.locator("[data-docs-theme]").evaluate((section, p) => {
				window.scrollTo(0, section.getBoundingClientRect().top + window.scrollY + p * (/** @type {HTMLElement} */ (section).offsetHeight - window.innerHeight));
			}, p);
			const id = themeDemo.states[index].id;
			await expect(page.locator("[data-docs-theme]")).toHaveAttribute("data-state", id);
			// Cirth's own control transitions finish before reading colours.
			await page.waitForTimeout(400);
			const read = await host.evaluate((element) => {
				const root = /** @type {ShadowRoot} */ (element.shadowRoot);
				const on = [...root.querySelectorAll("style[data-docs-theme-state]")].filter((style) => /** @type {HTMLStyleElement} */ (style).media === "all").map((style) => /** @type {HTMLElement} */ (style).dataset.docsThemeState);
				const surface = /** @type {HTMLElement} */ (root.querySelector("[data-docs-theme-surface]"));
				const canvas = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
				if (!canvas) throw new Error("no canvas");
				/** @param {string} colour */
				const rgb = (colour) => {
					canvas.clearRect(0, 0, 1, 1);
					canvas.fillStyle = colour;
					canvas.fillRect(0, 0, 1, 1);
					return [...canvas.getImageData(0, 0, 1, 1).data];
				};
				/** @param {number[]} colour */
				const luminance = ([r, g, b]) => {
					const f = (/** @type {number} */ v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
					return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
				};
				/** @param {string} a @param {string} b */
				const ratio = (a, b) => {
					const [x, y] = [luminance(rgb(a)), luminance(rgb(b))].sort((m, n) => n - m);
					return (x + 0.05) / (y + 0.05);
				};
				/** @param {Element | null} node */
				const background = (node) => {
					for (let at = node; at; at = at.parentElement) {
						const colour = getComputedStyle(at).backgroundColor;
						if (rgb(colour)[3] > 0) return colour;
					}
					return getComputedStyle(surface).backgroundColor;
				};
				/** @param {string} selector */
				const text = (selector) => {
					const node = /** @type {Element} */ (root.querySelector(selector));
					return ratio(getComputedStyle(node).color, background(node));
				};
				return {
					on,
					scheme: getComputedStyle(surface).colorScheme,
					theme: surface.getAttribute("data-theme"),
					button: text("button"),
					summary: text("summary"),
					term: text("dt"),
					value: text("dd"),
					subtitle: text("hgroup p"),
				};
			});
			expect(read.on, `${scheme} ${id}`).toEqual([id]);
			expect(read.theme).toBe(scheme);
			expect(read.scheme).toBe(scheme);
			for (const [what, value] of Object.entries(read)) {
				if (typeof value === "number") expect(value, `${scheme} ${id}: ${what}`).toBeGreaterThanOrEqual(4.5);
			}
		}
	}
});

test("the home page states its argument in one heading outline", async ({
	page,
}) => {
	await page.goto(`${origin}/`, { waitUntil: "networkidle" });

	const outline = await page
		.locator("main :is(h1, h2, h3, h4, h5, h6)")
		.evaluateAll((headings) =>
			headings.map((heading) => Number(heading.tagName.slice(1))),
		);

	expect(outline[0], "the page opens on its h1").toBe(1);
	expect(outline.filter((level) => level === 1)).toHaveLength(1);
	// No skipped levels (axe: heading-order).
	for (let index = 1; index < outline.length; index++) {
		expect(
			outline[index] - outline[index - 1],
			`heading ${index} follows ${outline[index - 1]}`,
		).toBeLessThanOrEqual(1);
	}

	// Eight scenes, in order: the claim and its proof, the facts, what the
	// browser does and what Cirth adds, the measured figures, a theme of the
	// reader's own, the presets, the stacks, and the close.
	const sections = await page
		.locator("main > section")
		.evaluateAll((items) => items.map((item) => item.className.split(" ")[0]));
	expect(sections).toEqual([
		"docs-hero",
		"docs-facts-band",
		"docs-story",
		"docs-measured",
		"docs-theme",
		"docs-presets",
		"docs-agnostic",
		"docs-pure",
	]);
	expect(
		await page.locator("main > section h2[id]").evaluateAll((headings) => headings.map((heading) => heading.textContent?.trim())),
	).toEqual([
		"At a glance",
		"Built on HTML, not around it.",
		"Less markup. Nothing to run.",
		"Your theme. Same HTML.",
		"Presets, light and dark.",
		"Framework agnostic. Works everywhere.",
		"Pure CSS. Whatever writes your HTML.",
	]);
	// The sections it replaced are gone, with everything that drew them.
	await expect(page.locator(".docs-showcase, .docs-narrative, .docs-themes")).toHaveCount(0);
	const last = page.locator("main > section").last();
	await expect(last.locator("h2")).toHaveText("Pure CSS. Whatever writes your HTML.");
	await expect(page.locator("main h2", { hasText: "Pure CSS. Whatever writes your HTML." })).toHaveCount(1);
	await expect(last.getByRole("button", { name: "Get started" })).toHaveAttribute("href", "/installation");
	for (const gone of [
		"One stylesheet. Whole interfaces.",
		"Three declarations. A different interface.",
		"Before you install",
		"Every claim has a check path.",
		"Less markup. The same interface.",
		"Add one stylesheet. Keep your HTML.",
		"Describe what it is. Cirth draws it.",
	]) {
		await expect(
			page.locator("main h2", { hasText: gone }),
			`${gone} is not a section of the home page`,
		).toHaveCount(0);
	}
	// No radios choose anything on the home page, and nothing poses as tabs.
	await expect(page.locator("main [type=radio]")).toHaveCount(0);
	await expect(page.locator('main [role="tab"], main [role="tablist"]')).toHaveCount(0);
});

// --- The boundary of a live example -------------------------------------

// Every demo on this site is captioned "Authentic Cirth · shell overrides
// declared in source", and the reading column around it used to make that
// untrue in silence: `--cirth-line-height` and
// `--cirth-typography-spacing-vertical` are inherited custom properties, so
// the column's own rhythm crossed into every preview and re-timed every
// example in it. Structure, colour, borders, radii and the type scale were
// always right; the whole divergence was vertical rhythm, which is the one
// thing a reader comparing a demo against their own page would not think to
// doubt.
test("a live example resolves the framework's own rhythm, not the reading column's", async ({
	page,
}) => {
	await page.goto(`${origin}/content/typography/`);

	const readings = await page.evaluate(() => {
		const read = (/** @type {Element} */ element, /** @type {string} */ name) =>
			getComputedStyle(element).getPropertyValue(name).trim();
		const root = document.documentElement;
		const column = /** @type {HTMLElement} */ (
			document.querySelector(".docs-content")
		);
		const preview = /** @type {HTMLElement} */ (
			document.querySelector(".docs-demo-preview")
		);
		const names = ["--cirth-line-height", "--cirth-typography-spacing-vertical"];
		return {
			root: names.map((name) => read(root, name)),
			column: names.map((name) => read(column, name)),
			preview: names.map((name) => read(preview, name)),
		};
	});

	// The column really is re-timed: this is not a test that passes because
	// nothing was ever different.
	expect(readings.column).not.toEqual(readings.root);
	// And the preview hands both back.
	expect(readings.preview).toEqual(readings.root);
});

// The other side of the same boundary: the column re-times its own prose,
// and the re-timing has to arrive. The library reads --cirth-line-height
// once, on the root, so a token set on the column and never applied left
// every paragraph at the root's 1.5. And prose runs the column's full
// width, as the code blocks, tables and demos in it do: one edge for
// everything in the column, not a narrower one for text.
test("the reading column applies its rhythm and runs prose to its full width", async ({
	page,
}) => {
	await page.goto(`${origin}/components/card/`);

	const measured = await page.evaluate(() => {
		const column = /** @type {HTMLElement} */ (document.querySelector(".docs-content"));
		const inner = column.getBoundingClientRect().width -
			Number.parseFloat(getComputedStyle(column).paddingLeft) -
			Number.parseFloat(getComputedStyle(column).paddingRight);
		const widths = (/** @type {string} */ selector) =>
			[...column.querySelectorAll(selector)].map((element) => element.getBoundingClientRect().width);
		const paragraphs = [...column.querySelectorAll(":scope > p")].filter(
			(element) => (element.textContent ?? "").length > 250,
		);
		return {
			inner,
			ratios: paragraphs.map((paragraph) => {
				const style = getComputedStyle(paragraph);
				return Number.parseFloat(style.lineHeight) / Number.parseFloat(style.fontSize);
			}),
			prose: widths(":scope > :is(p, ul, h2)"),
			code: widths(":scope > pre"),
		};
	});

	expect(measured.ratios.length).toBeGreaterThan(0);
	for (const ratio of measured.ratios) expect(ratio).toBeGreaterThanOrEqual(1.6);
	for (const width of [...measured.prose, ...measured.code]) {
		expect(width).toBeCloseTo(measured.inner, 0);
	}
});

// The same claim, made against the thing itself rather than against two
// tokens: every element inside a preview renders exactly as it does on a
// page that loads nothing but the compiled build.
test("a demo renders the same as the same markup under cirth.css alone", async ({
	page,
}) => {
	const fs = require("node:fs");
	const path = require("node:path");
	const root = path.join(__dirname, "..");
	const build = fs.readFileSync(path.join(root, "dist/cirth.css"), "utf8");
	const snippet = fs
		.readFileSync(
			path.join(root, "docs/src/content/demos/typography.html"),
			"utf8",
		)
		.trim();

	/** Every element in a subtree, positioned against its host's content box. */
	const fingerprint = () => {
		const host = /** @type {HTMLElement} */ (document.getElementById("probe"));
		const style = getComputedStyle(host);
		const box = host.getBoundingClientRect();
		const originX =
			box.left +
			Number.parseFloat(style.paddingLeft) +
			Number.parseFloat(style.borderLeftWidth);
		const originY =
			box.top +
			Number.parseFloat(style.paddingTop) +
			Number.parseFloat(style.borderTopWidth);
		/** @type {string[]} */
		const rows = [];
		const last = host.lastElementChild;
		const walk = (/** @type {Element} */ element) => {
			const rect = element.getBoundingClientRect();
			const own = getComputedStyle(element);
			rows.push(
				[
					element.tagName,
					(rect.left - originX).toFixed(2),
					(rect.top - originY).toFixed(2),
					rect.width.toFixed(2),
					rect.height.toFixed(2),
					own.marginTop,
					// The frame closes the trailing margin of what it holds, the
					// way the card contract does for <article>. It is the one
					// shell declaration that reaches a node inside a preview, and
					// it is asserted on its own below rather than folded in here.
					element === last ? "(container contract)" : own.marginBottom,
					own.lineHeight,
					own.fontSize,
					own.paddingTop,
					own.borderTopWidth,
					own.color,
					own.backgroundColor,
					own.borderRadius,
				].join("|"),
			);
			for (const child of element.children) walk(child);
		};
		for (const child of host.children) walk(child);
		return rows;
	};

	await page.goto(`${origin}/content/typography/`);
	const width = await page.evaluate(
		({ snippet }) => {
			const content = /** @type {HTMLElement} */ (
				document.querySelector(".docs-content")
			);
			content.innerHTML = `<figure class="docs-demo"><div class="docs-demo-preview" id="probe">${snippet}</div></figure>`;
			const probe = /** @type {HTMLElement} */ (
				document.getElementById("probe")
			);
			const style = getComputedStyle(probe);
			return (
				probe.getBoundingClientRect().width -
				Number.parseFloat(style.paddingLeft) -
				Number.parseFloat(style.paddingRight)
			);
		},
		{ snippet },
	);
	const inDocs = await page.evaluate(fingerprint);

	// The same markup, at the same content width, with nothing but the build.
	await setContent(page,
		`<!doctype html><style>${build}</style><body style="margin: 0"><div id="probe" style="width: ${width}px">${snippet}</div></body>`,
	);
	const bare = await page.evaluate(fingerprint);

	expect(inDocs.length).toBeGreaterThan(4);
	// Every node, every property: identical.
	expect(inDocs).toEqual(bare);

	// And the one exception, stated rather than hidden: the frame closes the
	// trailing margin of its last child, which is what a padded container
	// owes its contents and what the card contract already does for
	// <article>. It is a property of the frame, not a restyle of the
	// example's type.
	await page.goto(`${origin}/content/typography/`);
	const trailing = await page.evaluate(() => {
		const host = /** @type {HTMLElement} */ (
			document.querySelector(".docs-demo-preview")
		);
		return getComputedStyle(
			/** @type {Element} */ (host.lastElementChild),
		).marginBottom;
	});
	expect(trailing).toBe("0px");
});

// The documentation's chapter separators are the documentation's. As
// descendant selectors they reached headings inside live examples: an <h2>
// in the classless demo on the install page took a 1px rule and 12px of
// padding, and three <h3>s took 32px of editorial margin.
test("no shell chapter rule or margin lands on a heading inside a live example", async ({
	page,
}) => {
	for (const url of [
		"/installation/",
		"/examples/",
		"/layout/landmarks/",
		"/colors/",
	]) {
		await page.goto(`${origin}${url}`);
		const headings = await page.evaluate(() =>
			[...document.querySelectorAll(".docs-demo-preview :is(h1,h2,h3,h4,h5,h6)")].map(
				(heading) => {
					const style = getComputedStyle(heading);
					/** @param {string} name */
					const step = (name) => {
						const probe = document.createElement("div");
						probe.style.marginTop = `var(${name})`;
						heading.after(probe);
						const value = getComputedStyle(probe).marginTop;
						probe.remove();
						return value;
					};
					return {
						tag: heading.tagName,
						text: (heading.textContent ?? "").trim().slice(0, 24),
						borderBlockStart: style.borderBlockStartWidth,
						paddingBlockStart: style.paddingBlockStart,
						marginBlockStart: style.marginBlockStart,
						steps: [
							"0px",
							step("--cirth-flow-line"),
							step("--cirth-flow-group"),
							step("--cirth-flow-section"),
						],
					};
				},
			),
		);
		for (const heading of headings) {
			expect(heading.borderBlockStart, `${url} ${heading.text}`).toBe("0px");
			expect(heading.paddingBlockStart, `${url} ${heading.text}`).toBe("0px");
			// The framework's own values for a heading in a specimen are the
			// flow relations' (specs/container-owned-flow.md): nothing, a
			// line, a group or a section. The shell's chapter spacing is a
			// clamp that lands on none of them.
			expect(heading.steps, `${url} ${heading.text}`).toContain(
				heading.marginBlockStart,
			);
		}
	}
});

// A <pre> inside a preview is the example, and the copy affordance is
// chrome: the shell's positioning context, its fade and its injected button
// used to be painted onto the one demo on the site that renders a code
// block. The listing under that demo keeps its button, because that
// listing is the shell's.
test("the shell's code-block chrome stops at the edge of a live example", async ({
	page,
}) => {
	await page.goto(`${origin}/content/code/`);

	const inside = await page.evaluate(() => {
		const block = /** @type {HTMLElement} */ (
			document.querySelector(".docs-demo-preview pre")
		);
		const style = getComputedStyle(block);
		return {
			position: style.position,
			backgroundImage: style.backgroundImage,
			buttons: block.querySelectorAll("button.copy").length,
		};
	});
	expect(inside.position).toBe("static");
	expect(inside.backgroundImage).toBe("none");
	expect(inside.buttons).toBe(0);

	// And the shell's own listing still has all three.
	const shellBlock = await page.evaluate(() => {
		const block = /** @type {HTMLElement} */ (
			document.querySelector(".docs-demo-source pre")
		);
		const style = getComputedStyle(block);
		return {
			position: style.position,
			buttons: block.querySelectorAll("button.copy").length,
		};
	});
	expect(shellBlock.position).toBe("relative");
	expect(shellBlock.buttons).toBe(1);
});

// --- The shell consumes the library's own contracts ---------------------

// Three stacked navs outside an <aside>, each with its own layout, all
// released from the bar idiom by the one public token rather than by
// undoing three framework insets by hand.
test("every stacked nav in the shell paints inside its own container", async ({
	page,
}) => {
	/**
	 * @param {string} label
	 * @param {string} container
	 * @param {string} links
	 */
	const assertContained = async (label, container, links) => {
		const geometry = await page.evaluate(
			({ container, links }) => {
				const host = /** @type {HTMLElement} */ (
					document.querySelector(container)
				);
				const style = getComputedStyle(host);
				const box = host.getBoundingClientRect();
				const inner = {
					start:
						box.left +
						Number.parseFloat(style.paddingLeft) +
						Number.parseFloat(style.borderLeftWidth),
					end:
						box.right -
						Number.parseFloat(style.paddingRight) -
						Number.parseFloat(style.borderRightWidth),
				};
				// Links in a folded group are not rendered; what is drawn has
				// to stay inside.
				const boxes = [...document.querySelectorAll(links)]
					.map((link) => link.getBoundingClientRect())
					.filter((rect) => rect.width > 0)
					.map((rect) => ({ left: rect.left, right: rect.right }));
				return { inner, boxes, gutter: style.getPropertyValue("--cirth-nav-element-spacing-horizontal").trim() };
			},
			{ container, links },
		);

		expect(geometry.boxes.length, `${label}: no links found`).toBeGreaterThan(0);
		// Released through the token, not by undoing the framework by hand.
		expect(geometry.gutter, `${label}: gutter not released`).toBe("0");
		for (const box of geometry.boxes) {
			expect(box.left, `${label}: a link paints before the container`).toBeGreaterThanOrEqual(
				geometry.inner.start - 0.5,
			);
			expect(box.right, `${label}: a link paints past the container`).toBeLessThanOrEqual(
				geometry.inner.end + 0.5,
			);
		}
	};

	await page.setViewportSize({ width: 1024, height: 900 });
	await page.goto(`${origin}/components/nav/`);
	await page.evaluate(() =>
		document.querySelector(".docs-toc-top")?.setAttribute("open", ""),
	);
	await assertContained(
		"page outline",
		".docs-toc-top > nav",
		".docs-toc-top nav a",
	);

	await page.setViewportSize({ width: 900, height: 900 });
	await page.evaluate(() =>
		document.querySelector(".docs-mobile-nav")?.setAttribute("open", ""),
	);
	await assertContained(
		"mobile documentation menu",
		".docs-mobile-nav > nav",
		".docs-mobile-nav nav a",
	);

	await page.setViewportSize({ width: 390, height: 844 });
	await page.evaluate(() => {
		const toggle = /** @type {HTMLElement} */ (
			document.querySelector(".docs-menu-toggle")
		);
		toggle.click();
	});
	await page.waitForTimeout(300);
	await assertContained(
		"drawer",
		".docs-drawer > article > nav",
		".docs-drawer > article > nav a",
	);
});

// The sidebar still gets the same containment from <aside> alone, and its
// aria-current rail is still a visible edge rather than one clipped off the
// side of a scrolling column.
test("the sidebar rail is a visible edge inside its aside", async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto(`${origin}/components/nav/`);

	const current = await page.evaluate(() => {
		const rail = /** @type {HTMLElement} */ (
			document.querySelector(".docs-sidebar nav a[aria-current='page']")
		);
		const aside = /** @type {HTMLElement} */ (
			document.querySelector(".docs-sidebar")
		);
		const style = getComputedStyle(rail);
		const asideStyle = getComputedStyle(aside);
		const asideBox = aside.getBoundingClientRect();
		const box = rail.getBoundingClientRect();
		return {
			left: box.left,
			innerStart:
				asideBox.left +
				Number.parseFloat(asideStyle.paddingLeft) +
				Number.parseFloat(asideStyle.borderLeftWidth),
			width: Number.parseFloat(style.borderInlineStartWidth),
			color: style.borderInlineStartColor,
		};
	});

	expect(current.left).toBeGreaterThanOrEqual(current.innerStart - 0.5);
	expect(current.width).toBeGreaterThan(0);
	expect(current.color).not.toBe("rgba(0, 0, 0, 0)");
});

// The flush card, dogfooded. The hero's Source panel and both overlay
// panels are <article>s with the card's knobs moved, not hand-restated card
// contracts, so the frame, the radius, the surface and the header's bleed
// to the card's edges all arrive from components/_card.scss.
test("the shell's flush panels are cards with their knobs moved", async ({
	page,
}) => {
	/** @param {string} selector */
	const readPanel = (selector) =>
		page.evaluate((selector) => {
			const panel = /** @type {HTMLElement} */ (
				document.querySelector(selector)
			);
			const style = getComputedStyle(panel);
			const header = /** @type {HTMLElement} */ (
				panel.querySelector(":scope > header")
			);
			const headerBox = header.getBoundingClientRect();
			const panelBox = panel.getBoundingClientRect();
			return {
				tag: panel.tagName,
				horizontal: style.getPropertyValue("--cirth-block-spacing-horizontal").trim(),
				vertical: style.getPropertyValue("--cirth-block-spacing-vertical").trim(),
				padding: style.padding,
				// The band bleeds to the frame, landing on the border and no
				// further: the trap the Card page documents is a header hanging
				// 19px outside because the *token* still read 1.25rem.
				headerInset: headerBox.left - panelBox.left,
				headerRule: getComputedStyle(header).borderBlockEndWidth,
			};
		}, selector);

	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto(`${origin}/components/nav/`);
	await page.evaluate(() => {
		const trigger = /** @type {HTMLElement} */ (
			document.querySelector(".docs-search-trigger")
		);
		trigger.click();
	});
	await page.waitForTimeout(400);
	const search = await readPanel(".docs-search-dialog > article");
	expect(search.horizontal).toBe("0");
	expect(search.vertical).toBe("0");
	expect(search.padding).toBe("0px");
	expect(search.headerInset).toBeCloseTo(1, 1);
});

// A metrics panel is `.grid` plus a <dl>, which is what the framework tells
// everyone else to do, and the panel's cells are divided by the grid gap
// with the container's colour showing through, which holds at any column
// count without a :nth-child ladder to restate in a media query.
test("the metrics panels are gridded description lists divided by their gap", async ({
	page,
}) => {
	/**
	 * @param {string} url
	 * @param {string} selector
	 */
	const readPanel = async (url, selector) => {
		await page.goto(`${origin}${url}`);
		return page.evaluate((selector) => {
			const panel = /** @type {HTMLElement} */ (
				document.querySelector(selector)
			);
			const style = getComputedStyle(panel);
			const cells = [...panel.children].map((cell) => {
				const cellStyle = getComputedStyle(cell);
				return {
					tag: cell.tagName,
					background: cellStyle.backgroundColor,
					borders: [
						cellStyle.borderTopWidth,
						cellStyle.borderRightWidth,
						cellStyle.borderBottomWidth,
						cellStyle.borderLeftWidth,
					].join(" "),
					pairs: cell.querySelectorAll("dt, dd").length,
				};
			});
			return {
				tag: panel.tagName,
				classes: panel.className,
				display: style.display,
				gap: style.gap,
				// The stroke this shell draws its frames with, read off a frame
				// rather than off a token, so the two are compared as rendered.
				strokeWidth: Number.parseFloat(
					getComputedStyle(
						/** @type {HTMLElement} */ (
							panel.closest(".docs-proof-strip, .docs-brand-spec") ??
								document.documentElement
						),
					).borderTopWidth,
				) || 1,
				background: style.backgroundColor,
				cells,
			};
		}, selector);
	};

	for (const [url, selector] of [
		["/why-cirth/", ".docs-facts"],
		["/brand/", ".docs-brand-measures"],
		["/about/", ".docs-proof-strip dl"],
	]) {
		const panel = await readPanel(url, selector);
		expect(panel.tag, selector).toBe("DL");
		expect(panel.classes.split(/\s+/), selector).toContain("grid");
		expect(panel.display, selector).toBe("grid");
		// The gap is the divider: one stroke, the same on both axes.
		const gaps = new Set(panel.gap.split(" "));
		expect(gaps.size, selector).toBe(1);
		expect(Number.parseFloat([...gaps][0]), selector).toBeCloseTo(
			panel.strokeWidth,
			1,
		);
		// Which only draws a line because the container paints under it.
		expect(panel.background, selector).not.toBe("rgba(0, 0, 0, 0)");
		expect(panel.cells.length, selector).toBeGreaterThan(2);
		for (const cell of panel.cells) {
			expect(cell.tag, selector).toBe("DIV");
			// No cell draws its own divider, at any position in the grid.
			expect(cell.borders, selector).toBe("0px 0px 0px 0px");
			expect(cell.background, selector).not.toBe("rgba(0, 0, 0, 0)");
			expect(cell.pairs, selector).toBeGreaterThan(1);
		}
	}
});

// The divider grid holds when the column count changes, which is the whole
// point of spending it through the gap: the ladder it replaced had to be
// re-derived by hand in a media query, and got it wrong in one direction.
test("a divider grid keeps one stroke at every column count", async ({
	page,
}) => {
	for (const width of [1440, 900, 640, 390]) {
		await page.setViewportSize({ width, height: 900 });
		await page.goto(`${origin}/about/`);
		const reading = await page.evaluate(() => {
			const panel = /** @type {HTMLElement} */ (
				document.querySelector(".docs-proof-strip dl")
			);
			const plate = /** @type {HTMLElement} */ (
				document.querySelector(".docs-proof-strip")
			);
			return {
				columns: getComputedStyle(panel).gridTemplateColumns.split(" ").length,
				divider: getComputedStyle(panel).backgroundColor,
				frame: getComputedStyle(plate).borderTopColor,
				cellBorders: [...panel.children].map((cell) =>
					[
						getComputedStyle(cell).borderTopWidth,
						getComputedStyle(cell).borderRightWidth,
						getComputedStyle(cell).borderBottomWidth,
						getComputedStyle(cell).borderLeftWidth,
					].join(" "),
				),
			};
		});
		// One stroke: the divider between cells is the frame around them.
		expect(reading.divider, `at ${width}px`).toBe(reading.frame);
		for (const borders of reading.cellBorders) {
			expect(borders, `at ${width}px`).toBe("0px 0px 0px 0px");
		}
	}
});

// Shell chrome that is ordinary Cirth UI follows the knob a preset moves.
// The stage a live example stands on is one: under a preset that opens the
// flow the example re-times, and the frame around it used to stay pinned.
// The preset is whichever shipped one sets --cirth-spacing, read from its
// source, so the test does not hang on one name.
const spacingPreset = listPresetNames().find((name) =>
	/--cirth-spacing\s*:/.test(
		require("node:fs").readFileSync(
			require("node:path").join(presetsSourceDir, `${name}.scss`),
			"utf8",
		),
	),
);

test("the demo stage follows the preset's spacing knob", async ({ page }) => {
	test.skip(!spacingPreset, "no shipped preset sets --cirth-spacing");
	const stagePadding = async (/** @type {string} */ preset) => {
		await page.context().addInitScript((value) => {
			sessionStorage.setItem("cirth-preset", value);
		}, preset);
		await page.goto(`${origin}/components/card/`);
		await page.waitForFunction((name) => {
			const select = document.querySelector("[data-cirth-preset-select]");
			const link = document.getElementById("cirth-preset-stylesheet");
			if (!(select instanceof HTMLSelectElement)) return false;
			if (name === "default") return link === null;
			return link instanceof HTMLLinkElement && Boolean(link.sheet);
		}, preset);
		return page.evaluate(() => {
			const stage = /** @type {HTMLElement} */ (
				document.querySelector(".docs-demo-preview")
			);
			return {
				padding: Number.parseFloat(getComputedStyle(stage).paddingLeft),
				spacing: getComputedStyle(document.documentElement)
					.getPropertyValue("--cirth-spacing")
					.trim(),
			};
		});
	};

	const base = await stagePadding("default");
	const roomier = await stagePadding(/** @type {string} */ (spacingPreset));

	// The preset really does move the knob…
	expect(roomier.spacing).not.toBe(base.spacing);
	// …and the stage moves with it.
	expect(roomier.padding).toBeGreaterThan(base.padding);
});

// --- The footer -----------------------------------------------------------

// Paths out of the page, not a second index of the reference: the sidebar
// and search are that. It closes every page on the dark scheme, a forced
// subtree of Cirth's own, so it ends the page in both schemes.
test("the footer offers paths out, not the reference", async ({ page }) => {
	for (const url of ["/", "/installation/"]) {
		await page.goto(`${origin}${url}`, { waitUntil: "networkidle" });
		const footer = page.locator(".docs-footer");
		await expect(footer).toHaveAttribute("data-theme", "dark");
		await expect(footer.locator("nav[aria-label='Footer'] h2")).toHaveText([
			"Start",
			"Project",
			"Community",
		]);
		await expect(footer.getByRole("link", { name: "Get started" })).toHaveAttribute(
			"href",
			"/installation",
		);
		await expect(
			footer.getByRole("link", { name: /^Discussions/ }),
		).toHaveAttribute("href", "https://github.com/orgs/cirthcss/discussions");
		// No reference entries: layout, forms and components live in the
		// sidebar.
		for (const reference of ["/layout/document", "/forms/", "/components/accordion"]) {
			await expect(footer.locator(`a[href="${reference}"]`)).toHaveCount(0);
		}
		// The deeper ground in both page schemes.
		const grounds = await page.evaluate(() => ({
			footer: getComputedStyle(/** @type {Element} */ (document.querySelector(".docs-footer"))).backgroundColor,
			body: getComputedStyle(document.body).backgroundColor,
		}));
		expect(grounds.footer).not.toBe(grounds.body);
	}
});

// --- The framework guides -------------------------------------------------

// A guide opens on the project's mark and its name, says what it will
// have you do, and sets its numbered chapters as steps. The mark is
// decorative, so the title a reader, a search index and <title> get is the
// name alone; a project whose terms keep its logo off the site has none.
test("each framework guide opens on its mark and reads as steps", async ({ page }) => {
	const frameworks = require("../docs/src/_data/frameworks.js");
	for (const guide of frameworks.guides) {
		await page.goto(`${origin}${guide.link}/`, { waitUntil: "networkidle" });
		const title = page.locator(".docs-content > h1.docs-guide-title");
		await expect(title, `${guide.id} title`).toHaveCount(1);
		await expect(title).toHaveText(guide.name);
		expect(await page.title()).toBe(`${guide.name} — Cirth`);

		const marks = title.locator(".docs-guide-marks img");
		for (const alt of await marks.evaluateAll((items) => items.map((item) => item.getAttribute("alt")))) {
			expect(alt, `${guide.id}: a mark beside the name is decorative`).toBe("");
		}
		const shown = await marks.evaluateAll(
			(items) => items.filter((item) => getComputedStyle(item).display !== "none").length,
		);
		expect(shown, `${guide.id}: one variant of its mark, or none`).toBe(guide.mark ? 1 : 0);
		await expect(title.locator("a")).toHaveCount(0);

		const steps = page.locator(".docs-content > h2.docs-step-heading");
		const count = await steps.count();
		expect(count, `${guide.id} has steps`).toBeGreaterThanOrEqual(2);
		// The number is in the heading's name.
		await expect(steps.first()).toHaveAccessibleName(/^1 \S/);
		await expect(page.locator(".docs-content > .docs-guide-summary")).toHaveText(
			new RegExp(`^(Two|Three|Four|Five) steps: `),
		);
	}
});
