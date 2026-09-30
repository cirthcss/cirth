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
	await expect(
		page.getByRole("button", { name: "Get started" }),
	).toHaveAttribute("href", "/installation");
	await expect(
		page.getByRole("button", { name: "Examples", exact: true }),
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
	await page.goto(`${origin}/installation/`, { waitUntil: "networkidle" });

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

	// One entrance, and it ends: every animation in the hero is finite, and
	// none of them repeats.
	const animations = await page.locator(".docs-hero").evaluate((element) =>
		element.getAnimations({ subtree: true }).map((animation) => {
			const timing = animation.effect?.getComputedTiming();
			return { iterations: timing?.iterations, duration: Number(timing?.duration) };
		}),
	);
	expect(animations.length, "the entrance runs where motion is welcome").toBeGreaterThan(0);
	for (const animation of animations) {
		expect(animation.iterations).toBe(1);
		expect(animation.duration).toBeLessThanOrEqual(2000);
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

// --- The count -----------------------------------------------------------

// The demonstration opens on a number, and the number is taken from the two
// listings it compares, both served in a disclosure beside it, rather than
// asserted.
test("the count is taken from the two listings it compares", async ({ page }) => {
	await page.goto(`${origin}/`, { waitUntil: "networkidle" });

	const rows = page.locator(".docs-count-rows > div");
	await expect(rows).toHaveCount(2);
	const counts = await rows.locator("dd").evaluateAll((items) =>
		items.map((item) => Number.parseInt(item.textContent ?? "", 10)),
	);

	const listings = page.locator(".docs-count-source pre code");
	await expect(listings).toHaveCount(2);
	const counted = await listings.evaluateAll((items) =>
		items.map((item) =>
			[...(item.textContent ?? "").matchAll(/\sclass="([^"]*)"/g)].reduce(
				(total, [, value]) => total + value.split(/\s+/).filter(Boolean).length,
				0,
			),
		),
	);
	expect(counts).toEqual(counted);
	expect(counts[0]).toBeGreaterThan(40);
	expect(counts[1]).toBe(0);

	// The bars are drawn to one scale, and the text is the number.
	const bars = await rows.locator(".docs-count-bar").evaluateAll((items) =>
		items.map((item) => ({
			width: item.getBoundingClientRect().width,
			hidden: item.getAttribute("aria-hidden"),
		})),
	);
	expect(bars[0].width).toBeGreaterThan(bars[1].width * 4);
	expect(bars.map((bar) => bar.hidden)).toEqual(["true", "true"]);
});

// --- Framework agnostic --------------------------------------------------

test("the framework section names each project and leads to its guide", async ({
	page,
}) => {
	const frameworks = require("../docs/src/_data/frameworks.js");
	await page.goto(`${origin}/`, { waitUntil: "networkidle" });
	const section = page.locator(".docs-frameworks");
	await expect(section.locator("h2")).toHaveText("Pure CSS. Whatever writes your HTML.");

	// One list, from the one data file: every mark, in guide order, each
	// leading to the guide that covers it.
	const links = await section.locator(".docs-logo-list a").evaluateAll((items) =>
		items.map((item) => ({
			name: item.textContent?.trim(),
			href: item.getAttribute("href"),
			images: [...item.querySelectorAll("img")].map((image) => ({
				alt: image.getAttribute("alt"),
				src: image.getAttribute("src"),
				width: image.getAttribute("width"),
				height: image.getAttribute("height"),
			})),
		})),
	);
	expect(links.map((link) => link.name)).toEqual(
		frameworks.entries.map((/** @type {{ name: string }} */ entry) => entry.name),
	);
	for (const link of links) {
		expect(link.href ?? "").toMatch(/^\/installation\//);
		// The name is printed, so the mark is decorative, and it carries its
		// size so nothing moves while it loads. Served from this site.
		expect(link.images.length).toBeGreaterThan(0);
		for (const image of link.images) {
			expect(image.alt, `${link.name}'s mark is decorative`).toBe("");
			expect(image.src ?? "").toMatch(/^\/logos\/frameworks\/[\w-]+\.svg$/);
			expect(Number(image.width)).toBeGreaterThan(0);
			expect(Number(image.height)).toBeGreaterThan(0);
		}
	}

	// One variant shows per scheme where a project publishes two.
	const visible = await section.locator(".docs-logo-list img").evaluateAll((images) =>
		images.filter((image) => getComputedStyle(image).display !== "none").length,
	);
	expect(visible).toBe(links.length);

	await expect(section).toContainText("none of these projects is affiliated with Cirth or endorses it");
	await expect(section.locator('a[href="/brand#framework-logos"]')).toHaveCount(1);
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

	// A radio group named by its legend, with every segment a 44px target.
	await expect(install.getByRole("group", { name: "Package manager" })).toHaveCount(1);
	const heights = await install
		.locator("label")
		.evaluateAll((items) => items.map((item) => Math.round(item.getBoundingClientRect().height)));
	for (const height of heights) expect(height).toBeGreaterThanOrEqual(44);

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

	// The count and both of the listings it is taken from need no script.
	test("the count and its two listings are served", async ({ page }) => {
		await page.goto(`${origin}/`, { waitUntil: "load" });
		await expect(page.locator(".docs-count-rows > div")).toHaveCount(2);
		await expect(page.locator(".docs-count-rows")).toBeVisible();
		await page.locator(".docs-count-source summary").click();
		await expect(page.locator(".docs-count-source pre")).toHaveCount(2);
		await expect(page.locator(".docs-count-source pre").first()).toBeVisible();
	});

	// The showcase's fallback is the whole reason its tab strip ships
	// `hidden` rather than inert: with no script there is no tablist, so
	// all three examples are served rendered, complete, and under their own
	// headings.
	test("the showcase degrades to three complete examples", async ({ page }) => {
		await page.goto(`${origin}/`, { waitUntil: "load" });

		const strip = page.locator("[data-docs-switch]");
		await expect(strip).toHaveCount(1);
		await expect(strip).toBeHidden();
		await expect(page.locator('[role="tablist"], [role="tab"]')).toHaveCount(0);
		await expect(page.locator('[role="tabpanel"]')).toHaveCount(0);

		const panels = page.locator("[data-docs-panel]");
		await expect(panels).toHaveCount(3);
		for (let index = 0; index < 3; index++) {
			await expect(panels.nth(index)).toBeVisible();
			await expect(
				panels.nth(index).locator(".docs-example-name"),
				`example ${index} names itself without the tab`,
			).toBeVisible();
		}

		// And the theme section is a listing and a finished interface, both
		// served. The custom element never upgrades, so what renders is its
		// own children, painted by the page's Cirth, carrying the pane's
		// padding while it lasts.
		const listing = page.locator("[data-docs-theme-block]");
		await expect(listing).toHaveCount(1);
		await expect(listing).toContainText(".cirth {");
		await expect(listing).toContainText("--cirth-primary");

		const preview = page.locator("cirth-theme-preview");
		await expect(preview).toBeVisible();
		const fallback = await preview.evaluate((element) => ({
			defined: element.matches(":not(:defined)"),
			shadow: element.shadowRoot !== null,
			children: element.children.length,
			padding: Number.parseFloat(getComputedStyle(element).paddingTop),
		}));
		expect(fallback.defined, "the element never upgrades").toBe(true);
		expect(fallback.shadow).toBe(false);
		expect(fallback.children).toBe(1);
		expect(fallback.padding).toBeGreaterThan(8);
		await expect(
			preview.locator("article button", { hasText: "Save changes" }),
		).toBeVisible();

		// The choices that would change the preview are not offered, because
		// without script nothing could apply them. The inert preview cannot
		// trap the page either: its open menu's outside-click catcher is a
		// fixed layer, and an inert subtree takes no pointer events.
		await expect(page.locator("[data-docs-theme-controls]")).toBeHidden();
		await expect(preview).toHaveAttribute("inert", "");
		await page.locator(".docs-cta").getByRole("button", { name: "Why Cirth" }).click();
		await expect(page).toHaveURL(/\/why-cirth\/?$/);
	});
});


// --- The home page's showcase sections ---------------------------------

// Every specimen on this page is declared once in home.njk and used twice:
// rendered into the page, and highlighted into the pane beside it. The
// point of doing it that way is that the two cannot drift: the hero has
// had exactly that bug before, a snippet declaring attributes the rendered
// output no longer had, so the contract to pin is equality, not the
// presence of either half.
const normalizeMarkup = (/** @type {string} */ html) =>
	html
		.replace(/\s+/g, " ")
		.replace(/>\s+</g, "><")
		// `open` and `open=""` are the same attribute. The specimen writes
		// the bare form, which is what an author writes and what the pane
		// therefore lists; `outerHTML` always serialises the empty-string
		// form. Normalising both sides the same way compares the markup
		// rather than the serialiser.
		.replace(/=""/g, "")
		.trim();

/** The three examples, in the order the strip offers them. */
const showcaseExamples = ["article", "details", "form"];

/**
 * @param {import("@playwright/test").Page} page
 * @param {string} id
 */
const openExample = async (page, id) => {
	await page.locator(`[data-docs-tab="${id}"]`).click();
	await expect(page.locator(`[data-docs-panel="${id}"]`)).toBeVisible();
};

test("each source pane is the markup that produced the specimen beside it", async ({
	page,
}) => {
	await page.goto(`${origin}/`, { waitUntil: "networkidle" });

	// All three, not just the one that happens to be showing: an example
	// nobody looks at is exactly where a listing drifts from its specimen.
	for (const id of showcaseExamples) {
		await openExample(page, id);
		const scope = page.locator(`[data-docs-panel="${id}"]`);
		const listed = await scope.locator(".docs-stage-code pre code").innerText();
		const rendered = await scope
			.locator(".docs-stage-preview article")
			.evaluate((element) => element.outerHTML);

		expect(
			normalizeMarkup(listed),
			`${id}: the pane lists what the page rendered`,
		).toBe(normalizeMarkup(rendered));

		// Highlighted at build time, like every other code block on the site.
		expect(
			await scope.locator("pre code span").count(),
			`${id} is highlighted`,
		).toBeGreaterThan(10);
	}
});

// The strip is the WAI-ARIA tabs pattern or it is three buttons pretending:
// one tab stop for the whole strip, arrows walking it, one panel showing,
// and the panel named by the tab that opened it.
test("the showcase strip is a real tablist", async ({ page }) => {
	await page.goto(`${origin}/`, { waitUntil: "networkidle" });

	const strip = page.locator("[data-docs-switch]");
	await expect(strip).toBeVisible();
	await expect(strip).toHaveAttribute("role", "tablist");

	const tabs = page.getByRole("tab");
	await expect(tabs).toHaveCount(3);

	/** Exactly one panel is in the document at a time. */
	const assertOnlyOpen = async (/** @type {string} */ id) => {
		for (const other of showcaseExamples) {
			await expect(
				page.locator(`[data-docs-panel="${other}"]`),
				`${other} while ${id} is selected`,
			)[other === id ? "toBeVisible" : "toBeHidden"]();
		}
		// Roving tabindex: one stop for the strip, on the selected tab.
		expect(
			await tabs.evaluateAll((items) =>
				items.map((item) => `${item.getAttribute("aria-selected")}/${item.tabIndex}`),
			),
		).toEqual(
			showcaseExamples.map((other) =>
				other === id ? "true/0" : "false/-1",
			),
		);
	};

	await assertOnlyOpen("article");

	// Each tab controls a panel, and each panel is named by its tab:
	// which is what lets the heading in the panel be dropped once the
	// strip is on without the panel losing its name.
	for (const id of showcaseExamples) {
		const tab = page.locator(`[data-docs-tab="${id}"]`);
		const panel = page.locator(`[data-docs-panel="${id}"]`);
		await expect(tab).toHaveAttribute("aria-controls", `panel-${id}`);
		await expect(panel).toHaveAttribute("role", "tabpanel");
		await expect(panel).toHaveAttribute("aria-labelledby", `tab-${id}`);
		await expect(panel).toHaveAttribute("tabindex", "0");
	}

	// Arrow keys walk the strip and selection follows focus, because every
	// panel is already in the document: nothing is fetched by arrowing.
	await page.locator('[data-docs-tab="article"]').focus();
	await page.keyboard.press("ArrowRight");
	await assertOnlyOpen("details");
	await expect(page.locator('[data-docs-tab="details"]')).toBeFocused();
	await page.keyboard.press("End");
	await assertOnlyOpen("form");
	await page.keyboard.press("ArrowRight");
	await assertOnlyOpen("article");
	await page.keyboard.press("Home");
	await assertOnlyOpen("article");

	// The tab strip is the only control in this section, and it takes a
	// ring like everything else the page asks a reader to operate.
	expect(
		await page
			.locator('[data-docs-tab="article"]')
			.evaluate((element) => {
				const style = getComputedStyle(element);
				return (
					(style.outlineStyle !== "none" &&
						Number.parseFloat(style.outlineWidth) > 0) ||
					style.boxShadow !== "none"
				);
			}),
		"the focused tab paints a ring",
	).toBe(true);

	// With the strip on, the panel's own heading is redundant with the tab
	// above it and is taken out of the page rather than repeated.
	await expect(page.locator(".docs-example-name").first()).toBeHidden();

	// And the strip is the section's control, not a row of the stage's
	// band: it sits outside the stage, above it, on the section's own
	// column. In the band it read as part of the listing's toolbar, beside
	// the file name and the copy affordance.
	const stage = page.locator('[aria-labelledby="semantic-title"] .docs-stage');
	expect(
		await strip.evaluate((element) => element.closest(".docs-stage") !== null),
		"the strip is outside the stage",
	).toBe(false);
	await expect(stage.locator(".docs-switch")).toHaveCount(0);

	const [stripBox, stageBox] = await Promise.all([
		strip.boundingBox(),
		stage.boundingBox(),
	]);
	if (!stripBox || !stageBox) throw new Error("Expected the strip and stage");
	expect(stripBox.y + stripBox.height).toBeLessThanOrEqual(stageBox.y + 1);
	expect(Math.round(stripBox.x)).toBe(Math.round(stageBox.x));
	// Close enough to read as attached to what it switches, and not so far
	// that it reads as loose copy.
	expect(stageBox.y - (stripBox.y + stripBox.height)).toBeLessThan(24);
});

// The two sections this one absorbed both claimed the browser does the
// work. That claim now belongs to two of the three examples, and it has to
// be true of the elements the page actually renders.
test("the showcase's examples are the browser's own behaviour", async ({
	page,
}) => {
	await page.goto(`${origin}/`, { waitUntil: "networkidle" });

	// 1 — an exclusive disclosure group. One `name`, so opening the second
	// closes the first, and it is the browser doing it.
	await openExample(page, "details");
	const panel = page.locator('[data-docs-panel="details"]');
	const rows = panel.locator("details");
	await expect(rows).toHaveCount(2);
	const names = await rows.evaluateAll((items) =>
		items.map((item) => item.getAttribute("name")),
	);
	expect(new Set(names).size).toBe(1);
	expect(names[0]).toBeTruthy();

	await expect(rows.nth(0)).toHaveAttribute("open", "");
	await rows.nth(1).locator("summary").click();
	await expect(rows.nth(1)).toHaveAttribute("open", "");
	await expect(rows.nth(0)).not.toHaveAttribute("open", "");

	// 2 — the browser's own validity state, painted by the framework, and
	// held back until the reader has caused it. `:user-invalid`, not
	// `:invalid`: a required field is invalid on arrival, and nothing on
	// this page is painted red before anyone has touched it.
	await openExample(page, "form");
	const email = page.locator('[data-docs-panel="form"] input[type="email"]');
	expect(
		await email.evaluate((el) => el.matches(":user-invalid")),
		"nothing is invalid on arrival",
	).toBe(false);
	const resting = await email.evaluate(
		(el) => getComputedStyle(el).borderColor,
	);
	await email.fill("not-an-address");
	await email.blur();
	expect(await email.evaluate((el) => el.matches(":user-invalid"))).toBe(true);
	expect(
		await email.evaluate((el) => getComputedStyle(el).borderColor),
		"an invalid field is repainted",
	).not.toBe(resting);

	// And nothing in any of the three samples is wired to anything, which
	// is the sentence under the heading. The switcher is in the band, not
	// in a sample, and there is no inline handler anywhere in the section.
	const section = page.locator('[aria-labelledby="semantic-title"]');
	expect(
		await section.locator(".docs-stage-deck :is(script, [onclick], [onchange], [onsubmit])").count(),
	).toBe(0);

	// No <form> in the samples either, and that is deliberate: a form with
	// no action submits to this page, so a reader who filled the field in
	// would be navigated off the home page by a demo whose claim is that
	// nothing here is wired. Constraint validation does not need a form
	// owner, which is why the example above still works.
	expect(await section.locator("form").count()).toBe(0);
});

test("every control in the showcase specimens is reachable and takes a ring", async ({
	page,
}) => {
	await page.goto(`${origin}/`, { waitUntil: "networkidle" });

	let checked = 0;
	// Every example, not only the one showing: a control in a panel nobody
	// opened is still a control a reader can reach.
	for (const id of [...showcaseExamples, null]) {
		if (id) await openExample(page, id);

		// Form controls and summaries only, which is what every engine
		// reaches with default settings (see the note at the top of this
		// file). Visible ones, because a hidden panel's controls are out of
		// the document's tab order by design.
		const controls = page.locator(
			".docs-example:not([hidden]) .docs-stage-preview :is(input, select, summary)",
		);
		const count = await controls.count();
		for (let index = 0; index < count; index++) {
			const control = controls.nth(index);
			// A Tab first, because opening an example is a click and every
			// engine's `:focus-visible` heuristic remembers that the last
			// interaction was a pointer: a programmatic focus after a click
			// is deliberately not focus-visible. The keypress puts the
			// browser back in the modality this assertion is about.
			await page.keyboard.press("Tab");
			await control.focus();
			expect(
				await control.evaluate((element) => element.matches(":focus-visible")),
				`${id ?? "last"} control ${index} takes focus`,
			).toBe(true);
			const ring = await control.evaluate((element) => {
				const style = getComputedStyle(element);
				return {
					style: style.outlineStyle,
					width: Number.parseFloat(style.outlineWidth),
					shadow: style.boxShadow,
				};
			});
			expect(
				(ring.style !== "none" && ring.width > 0) || ring.shadow !== "none",
				`${id ?? "last"} control ${index} paints a focus ring`,
			).toBe(true);
			checked += 1;
		}
	}
	// The disclosure's two summaries and the form's field and switch: the
	// theme preview is inert, a picture of an interface, and has none.
	expect(checked).toBeGreaterThanOrEqual(4);
});

// --- The theme section --------------------------------------------------

/**
 * The listing beside the preview and the stylesheet the preview is really
 * carrying, normalised the same way: the listing breaks a `light-dark()`
 * value over three lines to fit the pane.
 * @param {string} css
 */
const normalizeCss = (css) =>
	css
		.replace(/\s+/g, " ")
		.replace(/\(\s+/g, "(")
		.replace(/\s+\)/g, ")")
		.trim();

/**
 * What the demo is showing and what it is doing, read together.
 * @param {import("@playwright/test").Page} page
 */
const themeState = (page) =>
	page.evaluate(() => {
		const element = document.querySelector("cirth-theme-preview");
		const shadow = element?.shadowRoot;
		const surface = /** @type {HTMLElement | null | undefined} */ (shadow?.querySelector(".cirth"));
		const style = shadow?.querySelector("style[data-cirth-theme]");
		const block = document.querySelector("[data-docs-theme-block]");
		return {
			applied: style?.textContent ?? "",
			listed: block?.textContent ?? "",
			file: document.querySelector("[data-docs-theme-file]")?.textContent?.trim() ?? "",
			scheme: surface?.dataset.theme ?? "",
			accent: surface
				? getComputedStyle(surface).getPropertyValue("--cirth-primary").trim()
				: "",
			canvas: surface ? getComputedStyle(surface).backgroundColor : "",
			pageAccent: getComputedStyle(document.documentElement)
				.getPropertyValue("--cirth-primary")
				.trim(),
		};
	});

// The demo is a custom element with its own copy of Cirth in a shadow
// root, and every claim this section makes rests on that: the declarations
// it applies reach the preview and nothing else, and the listing beside it
// is the stylesheet the preview carries rather than a picture of one.
test("the theme preview carries its own Cirth, in a shadow root", async ({
	page,
}) => {
	await page.goto(`${origin}/`, { waitUntil: "networkidle" });

	const element = page.locator("cirth-theme-preview");
	await expect(element).toHaveCount(1);
	// A picture of a themed interface, like the hero's card.
	await expect(element).toHaveAttribute("inert", "");

	const shadow = await element.evaluate((host) => {
		const root = host.shadowRoot;
		const sheets = [...(root?.querySelectorAll("link[rel=stylesheet]") ?? [])];
		return {
			mode: root ? "open" : "none",
			stylesheets: sheets.map((sheet) =>
				String(sheet.getAttribute("href")).replace(/^.*\/styles\//, "styles/"),
			),
			themeAfterCirth:
				[...(root?.children ?? [])].findIndex((child) =>
					child.matches("style[data-cirth-theme]"),
				) >
				[...(root?.children ?? [])].findIndex((child) =>
					child.matches("link[rel=stylesheet]"),
				),
			wrapper: root?.querySelector(".cirth")?.tagName.toLowerCase() ?? null,
			specimen: root?.querySelector(".cirth > article")?.tagName.toLowerCase() ?? null,
			// The overlay the section is about: a menu open over the card.
			menu: root?.querySelector(".cirth details.dropdown[open] > ul") ? "open" : "closed",
			lightChildren: host.children.length,
		};
	});
	expect(shadow.mode).toBe("open");
	expect(shadow.stylesheets).toEqual(["styles/generated/cirth-lab-scoped.css"]);
	expect(shadow.themeAfterCirth).toBe(true);
	expect(shadow.wrapper).toBe("div");
	expect(shadow.specimen).toBe("article");
	expect(shadow.menu).toBe("open");
	expect(shadow.lightChildren).toBe(0);

	// The listing is the stylesheet: the same text, which is the only
	// version of this claim that cannot drift.
	const state = await themeState(page);
	expect(normalizeCss(state.listed)).toBe(normalizeCss(state.applied));
	expect(state.applied).toContain(".cirth {");
	for (const token of ["--cirth-primary", "--cirth-border-radius", "--cirth-canvas"]) {
		expect(state.applied, `${token} is applied`).toContain(token);
	}

	// Served in the default theme and the page's own scheme: the section
	// opens on agreement rather than on a difference nobody asked for.
	expect(state.accent).toBe(state.pageAccent);
	expect(state.file).toBe("cirth.scoped.css");
});

// Every choice applies exactly what it lists, and names the file it comes
// from. Every value is read out of a compiled file at build time, so "no
// fake code" is a property of the pipeline; what this checks is that the
// demo applies what it prints, for every theme.
test("choosing a theme applies exactly what it lists", async ({ page }) => {
	await page.goto(`${origin}/`, { waitUntil: "networkidle" });

	const controls = page.locator("[data-docs-theme-controls]");
	await expect(controls).toBeVisible();
	const themes = controls.locator('input[name="docs-theme-state"]');
	const count = await themes.count();
	expect(count).toBeGreaterThanOrEqual(4);

	const accents = new Set();
	for (let index = 0; index < count; index++) {
		await themes.nth(index).check();
		const state = await themeState(page);
		expect(normalizeCss(state.listed), `theme ${index}: listed is applied`).toBe(
			normalizeCss(state.applied),
		);
		expect(state.file, `theme ${index} names its file`).toMatch(/\.css$/);
		accents.add(state.accent);
	}
	// Each theme is a different accent, not four names for one.
	expect(accents.size).toBe(count);
});

// The isolation, exercised rather than asserted: the demo takes a theme of
// its own, and the site's preset switcher moves the page and leaves the
// demo where it was.
test("the theme demo and the page keep separate themes", async ({ page }) => {
	await page.goto(`${origin}/`, { waitUntil: "networkidle" });

	const opening = await themeState(page);
	await page.locator('[data-docs-theme-controls] label', { hasText: "Material" }).click();
	const moved = await themeState(page);
	expect(moved.accent).not.toBe(opening.accent);
	expect(moved.pageAccent, "the page did not move").toBe(opening.pageAccent);

	const header = page.locator("[data-cirth-preset-select]");
	await header.selectOption("metro");
	await expect
		.poll(async () => (await themeState(page)).pageAccent, {
			message: "the preset repaints the page",
			timeout: 15000,
		})
		.not.toBe(moved.pageAccent);
	const after = await themeState(page);
	expect(after.accent, "the demo is not repainted by the page").toBe(moved.accent);
	expect(after.applied).toBe(moved.applied);

	await header.selectOption("default");
});

// Nothing in the section moves on its own, with or without the motion
// preference: auto-updating content beside a form is what WCAG 2.2.2 asks
// a way to stop, and the simplest way is not to start it. The scheme is a
// choice too, and it moves the preview's canvas and nothing else.
test("the theme demo moves only when the reader chooses", async ({ page }) => {
	await page.emulateMedia({ reducedMotion: "no-preference" });
	await page.goto(`${origin}/`, { waitUntil: "networkidle" });
	await page.locator(".docs-themes").scrollIntoViewIfNeeded();

	const opening = await themeState(page);
	await page.waitForTimeout(2500);
	expect(await themeState(page), "nothing changes on its own").toEqual(opening);

	const pageScheme = await page.locator("html").getAttribute("data-theme");
	const other = pageScheme === "dark" ? "Light" : "Dark";
	await page.locator('[data-docs-theme-controls] label', { hasText: other }).click();
	const flipped = await themeState(page);
	expect(flipped.scheme).toBe(other.toLowerCase());
	await expect.poll(async () => (await themeState(page)).canvas).not.toBe(opening.canvas);
	expect(await page.locator("html").getAttribute("data-theme")).toBe(pageScheme);
});

// The two choices are real radio groups: named, one tab stop each, and the
// arrow keys walk them, which is what the segmented control is.
test("the theme choices are named radio groups the keyboard can walk", async ({
	page,
}) => {
	await page.goto(`${origin}/`, { waitUntil: "networkidle" });

	const groups = page.locator("[data-docs-theme-controls] fieldset");
	await expect(groups).toHaveCount(2);
	await expect(groups.nth(0).locator("legend")).toHaveText("Theme");
	await expect(groups.nth(1).locator("legend")).toHaveText("Scheme");

	const first = groups.nth(0).locator("input").first();
	await page.keyboard.press("Tab");
	await first.focus();
	const before = await themeState(page);
	await page.keyboard.press("ArrowRight");
	await expect(groups.nth(0).locator("input").nth(1)).toBeChecked();
	const after = await themeState(page);
	expect(after.applied).not.toBe(before.applied);
	expect(normalizeCss(after.listed)).toBe(normalizeCss(after.applied));
});

// The shell injects a copy button on every `pre > code` and copies its
// text, so the listing hands over exactly the declarations on screen.
test("copying the theme listing hands over the declarations on screen", async ({
	page,
}) => {
	await page.goto(`${origin}/`, { waitUntil: "networkidle" });

	const block = page.locator("[data-docs-theme-block]");
	const copied = await block.innerText();
	const state = await themeState(page);
	expect(normalizeCss(copied)).toBe(normalizeCss(state.applied));
	// One value per token, not every state's version of it.
	expect(copied.match(/--cirth-primary/g)).toHaveLength(1);
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

	// Six blocks, in order: the claim and its proof, the facts, the
	// demonstration, where it works, the theme, and the way in. The
	// questions and the long proofs live on Why Cirth.
	const sections = await page
		.locator("main > section")
		.evaluateAll((items) => items.map((item) => item.className.split(" ")[0]));
	expect(sections).toEqual([
		"docs-hero",
		"docs-facts-band",
		"docs-demo-section",
		"docs-frameworks",
		"docs-themes",
		"docs-cta",
	]);
	for (const gone of [
		"Before you install",
		"Every claim has a check path.",
		"Less markup. The same interface.",
	]) {
		await expect(
			page.locator("main h2", { hasText: gone }),
			`${gone} is not a section of the home page`,
		).toHaveCount(0);
	}
});

test("every stage is one contained frame, and the live half is not a thumbnail", async ({
	page,
}) => {
	await page.goto(`${origin}/`, { waitUntil: "networkidle" });

	for (const [section, inner] of /** @type {const} */ ([
		["semantic", ".docs-demo-section .docs-home-inner"],
		["theme", ".docs-themes .docs-home-inner"],
	])) {
		const grid = await page
			.locator(inner)
			.evaluate((element) => element.getBoundingClientRect().width);
		const stage = page.locator(`[aria-labelledby="${section}-title"] .docs-stage`);
		await expect(stage, `${section} has one stage`).toHaveCount(1);
		const width = await stage.evaluate((element) => element.getBoundingClientRect().width);
		expect(Math.round(width), `${section} stage width`).toBeGreaterThanOrEqual(
			Math.round(grid) - 1,
		);
	}

	for (const scope of ['[data-docs-panel="article"]', ".docs-theme-stage"]) {
		const [code, preview] = await Promise.all(
			[".docs-stage-code", ".docs-stage-preview"].map((selector) =>
				page
					.locator(`${scope} ${selector}`)
					.first()
					.evaluate((element) => element.getBoundingClientRect().width),
			),
		);
		expect(
			preview / (code + preview),
			`${scope}: the preview's share of the split`,
		).toBeGreaterThanOrEqual(0.5);
	}

	// Switching examples must not move the page under the reader.
	const heights = [];
	for (const id of showcaseExamples) {
		await openExample(page, id);
		heights.push(
			await page
				.locator('[aria-labelledby="semantic-title"] .docs-stage')
				.evaluate((element) => Math.round(element.getBoundingClientRect().height)),
		);
	}
	expect(
		Math.max(...heights) - Math.min(...heights),
		`stage heights across examples: ${heights.join(", ")}`,
	).toBeLessThanOrEqual(96);
});

// The disclosure example's note says the questions on Why Cirth are this
// same element. A sentence is cheap; the thing worth pinning is that it is
// still true.
test("the disclosure example is the element the questions on Why Cirth are made of", async ({
	page,
}) => {
	/** @param {import("@playwright/test").Locator} locator */
	const shapeOf = (locator) =>
		locator.first().evaluate((element) => {
			const summary = element.querySelector("summary");
			const paragraph = element.querySelector("p");
			return {
				tag: element.tagName.toLowerCase(),
				grouped: element.hasAttribute("name"),
				classes: [
					element.className,
					summary?.className ?? "",
					paragraph?.className ?? "",
				].join("").trim(),
				children: [...element.children].map((child) => child.tagName.toLowerCase()),
			};
		});

	await page.goto(`${origin}/`, { waitUntil: "networkidle" });
	await openExample(page, "details");
	const specimen = await shapeOf(page.locator('[data-docs-panel="details"] details'));
	const link = page.locator('[data-docs-panel="details"] .docs-example-note a');
	await expect(link).toHaveAttribute("href", "/why-cirth#before-you-install");
	// One group on the home page: the specimen's own.
	expect(
		await page
			.locator("main details[name]")
			.evaluateAll((items) => [...new Set(items.map((item) => item.getAttribute("name")))]),
	).toEqual(["delivery"]);

	// The static server this suite runs on does not add a trailing slash
	// the way a real host does, so the page is opened by its file path.
	await page.goto(`${origin}/why-cirth/#before-you-install`, { waitUntil: "networkidle" });
	const question = await shapeOf(page.locator('.docs-content details[name="faq"]'));

	// The same element, the same parts, and no classes on any of them.
	expect(specimen.tag).toBe("details");
	expect(specimen).toEqual(question);
	expect(specimen.classes, "the specimen wears no classes").toBe("");
	expect(specimen.grouped, "and it is a group, like the questions are").toBe(true);
	await expect(page.locator('.docs-content details[name="faq"]')).toHaveCount(7);
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
// every paragraph at the root's 1.5, on lines of about 107 characters.
test("the reading column applies its rhythm and stops prose at the measure", async ({
	page,
}) => {
	await page.goto(`${origin}/components/card/`);

	const lines = await page.evaluate(() => {
		const paragraphs = [...document.querySelectorAll(".docs-content > p")].filter(
			(element) => (element.textContent ?? "").length > 250,
		);
		return paragraphs.map((paragraph) => {
			const style = getComputedStyle(paragraph);
			const range = document.createRange();
			/** @type {Map<number, number>} */
			const perLine = new Map();
			const walker = document.createTreeWalker(paragraph, NodeFilter.SHOW_TEXT);
			while (walker.nextNode()) {
				const node = /** @type {Text} */ (walker.currentNode);
				for (let index = 0; index < node.length; index++) {
					range.setStart(node, index);
					range.setEnd(node, index + 1);
					const box = range.getClientRects()[0];
					if (!box) continue;
					const top = Math.round(box.top);
					perLine.set(top, (perLine.get(top) ?? 0) + 1);
				}
			}
			return {
				ratio:
					Number.parseFloat(style.lineHeight) /
					Number.parseFloat(style.fontSize),
				longest: Math.max(...perLine.values()),
			};
		});
	});

	expect(lines.length).toBeGreaterThan(0);
	for (const line of lines) {
		expect(line.ratio).toBeGreaterThanOrEqual(1.6);
		expect(line.longest).toBeLessThanOrEqual(75);
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
				const boxes = [...document.querySelectorAll(links)].map((link) => {
					const rect = link.getBoundingClientRect();
					return { left: rect.left, right: rect.right };
				});
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

// A guide opens on the project's marks and its name, says what it will
// have you do, and sets its numbered chapters as steps. The marks are
// decorative, so the title a reader, a search index and <title> get is the
// name alone.
test("each framework guide opens on its marks and reads as steps", async ({ page }) => {
	const frameworks = require("../docs/src/_data/frameworks.js");
	for (const guide of frameworks.guides) {
		await page.goto(`${origin}${guide.link}/`, { waitUntil: "networkidle" });
		const title = page.locator(".docs-content > h1.docs-guide-title");
		await expect(title, `${guide.id} title`).toHaveCount(1);
		await expect(title).toHaveText(guide.text);
		expect(await page.title()).toBe(`${guide.text} — Cirth`);

		const marks = title.locator(".docs-guide-marks img");
		expect(await marks.count()).toBeGreaterThanOrEqual(guide.marks.length);
		for (const alt of await marks.evaluateAll((items) => items.map((item) => item.getAttribute("alt")))) {
			expect(alt, `${guide.id}: a mark beside the name is decorative`).toBe("");
		}
		const shown = await marks.evaluateAll(
			(items) => items.filter((item) => getComputedStyle(item).display !== "none").length,
		);
		expect(shown, `${guide.id}: one variant per mark`).toBe(guide.marks.length);

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
