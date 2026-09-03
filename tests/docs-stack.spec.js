const { expect, test } = require("@playwright/test");
const {
	assertDocsBuilt,
	createServer,
	startServer,
} = require("../scripts/lib/docs-site");

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
// is a platform preference, not a property of this page — a document
// containing nothing but a link, a button and a summary behaves the same
// way — so assertions about Tab *arriving* at a link or a button would be
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
 * The hero is a source card and the interface it produces, overlapping —
 * not one panel split in two, and not two panels: only the source is in a
 * frame. The geometry worth pinning is the relationship between them: the
 * output reaches back over the source by a real, bounded amount, sits
 * below it, and neither leaves the stage. An overlap built out of flow
 * rather than out of absolute positioning is exactly the thing that can
 * quietly start clipping at some width, which is what this asserts
 * against.
 * @param {import("@playwright/test").Page} page
 */
const assertHeroDemoGeometry = async (page) => {
	const stageBox = await page.locator(".docs-lab-stage").boundingBox();
	const sourceBox = await page.locator(".docs-source-panel").boundingBox();
	const outputBox = await page.locator(".docs-output-frame").boundingBox();
	const frameBox = await page.locator("[data-lab-frame]").boundingBox();
	if (!stageBox || !sourceBox || !outputBox || !frameBox) {
		throw new Error("Expected the source card and the output");
	}

	// The iframe fills its surface exactly: no letterbox, no overhang.
	// The surface is the output itself now — there is no panel around it —
	// so this is the frame against its own box.
	expect(Math.abs(frameBox.y - outputBox.y)).toBeLessThanOrEqual(1);
	expect(
		Math.abs(
			frameBox.y + frameBox.height - (outputBox.y + outputBox.height),
		),
	).toBeLessThanOrEqual(1);

	// Neither card escapes the stage on either edge, at any width.
	expect(Math.min(sourceBox.x, outputBox.x)).toBeGreaterThanOrEqual(
		stageBox.x - 1,
	);
	expect(
		Math.max(sourceBox.x + sourceBox.width, outputBox.x + outputBox.width),
	).toBeLessThanOrEqual(stageBox.x + stageBox.width + 1);

	// Stacked is the case where the two cards share a column: same x, same
	// width. Reading it off the vertical relation instead would get mobile
	// backwards, where the output is ordered first and therefore sits
	// entirely above the source.
	const stacked =
		Math.abs(outputBox.x - sourceBox.x) <= 1 &&
		Math.abs(outputBox.width - sourceBox.width) <= 1;
	if (!stacked) {
		// Overlapping: the output reaches back over the source by an amount
		// you can see rather than by a hairline.
		const overlapX = sourceBox.x + sourceBox.width - outputBox.x;
		expect(overlapX).toBeGreaterThan(8);
		expect(overlapX).toBeLessThan(sourceBox.width / 2);

		// And it is centred on the card it overlaps. It used to sit on the
		// row's end edge, which put its middle 154px below the source's and
		// read as a stack that had slipped. Measured against the *card*
		// rather than the row, which is the whole point: a row-centred
		// output would be 20px low, on the source's own bottom margin.
		const sourceCentre = sourceBox.y + sourceBox.height / 2;
		const outputCentre = outputBox.y + outputBox.height / 2;
		expect(
			Math.abs(outputCentre - sourceCentre),
			"the output is optically centred on the source",
		).toBeLessThanOrEqual(2);

		// Which, the output being the shorter of the two, means it sits
		// inside the source's span on both edges rather than hanging past
		// it.
		expect(outputBox.y).toBeGreaterThan(sourceBox.y);
		expect(outputBox.y + outputBox.height).toBeLessThan(
			sourceBox.y + sourceBox.height,
		);
	} else {
		// Stacked: the offset is unwound completely rather than shrunk, so
		// the two cards read as a column and not as a misalignment.
		expect(
			Math.abs(outputBox.x + outputBox.width - (sourceBox.x + sourceBox.width)),
		).toBeLessThanOrEqual(1);
	}

	// Whatever follows the demo starts below both halves of it: the stage
	// is intrinsically as tall as the taller of the two, which is the
	// property an overlap built out of flow has and an absolutely
	// positioned one does not.
	expect(stageBox.y + stageBox.height).toBeGreaterThanOrEqual(
		Math.max(sourceBox.y + sourceBox.height, outputBox.y + outputBox.height) -
			1,
	);
};

test("homepage keeps the source and authentic output comparison focused on mobile", async ({
	page,
}) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto(`${origin}/`, { waitUntil: "networkidle" });

	const output = page.locator(".docs-output-frame");
	const source = page.locator(".docs-source-panel");
	await expect(output).toHaveCount(1);
	await expect(page.locator(".docs-mechanism")).toHaveCount(0);
	await expect(page.locator(".docs-figure-caption")).toHaveCount(0);
	await expect(source.locator("[data-lab-source]")).toContainText(
		'<main class="container">',
	);
	await expect(source.locator("[data-lab-source]")).toContainText(
		'name="email"',
	);
	await expect(source.locator("[data-lab-source]")).not.toContainText("…");
	await expect(
		page.getByRole("button", { name: "Get Started" }),
	).toHaveAttribute("href", "/get-started");
	await expect(page.getByRole("button", { name: "Examples" })).toHaveAttribute(
		"href",
		"/examples",
	);

	// Source first, output second. Stacked, the two are read in sequence
	// rather than compared side by side, and the sequence this page argues
	// for is markup → interface: the output used to be ordered first, which
	// put the result above its own cause.
	const order = await Promise.all(
		[source, output].map((locator) =>
			locator.evaluate((element) => Number(getComputedStyle(element).order)),
		),
	);
	expect(order).toEqual([1, 2]);

	const frame = page.frameLocator("[data-lab-frame]");
	await expect(frame.getByRole("heading", { name: "Sign in" })).toBeVisible();
	await expect(frame.locator("header, footer")).toHaveCount(0);
	await expect(frame.locator("article")).toHaveCount(1);
	await expect(frame.locator("form")).toHaveCount(1);

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
	// The hero shows the default build and offers no switch, so each
	// specimen is checked where it lives rather than through a control on
	// the home page. The assertions are the ones that matter either way:
	// every build's page is the real distributed stylesheet rendering the
	// real markup, with the wrapper and the container class the build is
	// supposed to have and nothing else.
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

	await assertHeroDemoGeometry(page);
	await page.setViewportSize({ width: 1440, height: 900 });
	await assertHeroDemoGeometry(page);

	const actionAlignment = await page
		.locator(".docs-hero-actions")
		.evaluate((element) => ({
			containerX: element.getBoundingClientRect().x,
			firstActionX: element.firstElementChild?.getBoundingClientRect().x,
			justifyContent: getComputedStyle(element).justifyContent,
			textAlign: getComputedStyle(element).textAlign,
		}));
	expect(actionAlignment.justifyContent).toBe("flex-start");
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

	// Hover and focus move the surface and the border, the way a field's
	// do — and leave the placeholder, and the size, exactly where they are.
	await searchTrigger.hover();
	const searchHover = await box(searchTrigger);
	expect(searchHover.background).toBe(searchRest.background);
	expect(searchHover.border).not.toBe(searchRest.border);
	expect(searchHover.height).toBe(searchRest.height);
	expect(await type(searchTrigger)).toEqual(placeholder);

	await searchTrigger.focus();
	const searchFocus = await searchTrigger.evaluate((element) => {
		const style = getComputedStyle(element);
		return {
			border: style.borderColor,
			shadow: style.boxShadow,
			height: Math.round(element.getBoundingClientRect().height),
		};
	});
	expect(searchFocus.shadow).not.toBe("none");
	expect(searchFocus.border).not.toBe(searchRest.border);
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

	await expect(page.locator(".docs-version-submit")).toHaveCount(0);
	expect(await version.locator("option").allTextContents()).toEqual([
		"v0.13",
		"v0.12",
		"v0.10",
	]);
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
			overflow: document.documentElement.scrollWidth - window.innerWidth,
		};
	});
	expect(compactGeometry.headerPosition).toBe("sticky");
	expect(compactGeometry.h1Y).toBeLessThan(220);
	expect(compactGeometry.overflow).toBeLessThanOrEqual(0);

	await page.setViewportSize({ width: 320, height: 720 });
	expect(
		await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth),
	).toBeLessThanOrEqual(0);

	await page.setViewportSize({ width: 1440, height: 900 });
	await expect(trigger).toBeHidden();
	await expect(page.locator(".docs-header-controls-group [data-docs-header-control]")).toHaveCount(3);
});

test("the homepage FAQ exposes consistent interactive states", async ({
	page,
}) => {
	await page.emulateMedia({ reducedMotion: "no-preference" });
	await page.goto(`${origin}/`, { waitUntil: "networkidle" });

	// The card half of this test went with the three shell-built cards it
	// hovered. What replaced them renders from the specimen strings the
	// page shows the source of, so it carries no shell hover treatment by
	// design — its contract is "this is the library's card and nothing
	// else", pinned in baseline-consistency.spec.js.

	const details = page.locator(".docs-native-faq details").first();
	const summary = details.locator("summary");
	const closedWidths = await Promise.all([
		details.evaluate((element) => element.getBoundingClientRect().width),
		summary.evaluate((element) => element.getBoundingClientRect().width),
	]);
	await summary.click();
	// Wait for the panel to actually be in layout before measuring it. The
	// disclosure now animates open (::details-content starts at block-size
	// 0), so reading straight after the click can catch the paragraph
	// before it has a box — which under a loaded suite it intermittently
	// did. The state being measured is "open", not "opening".
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

	const nextSummary = page.locator(".docs-native-faq summary").nth(1);
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
});

test("documentation active navigation uses the public registered state", async ({
	page,
}) => {
	await page.goto(`${origin}/get-started/`, { waitUntil: "networkidle" });
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
		probe.style.color = "var(--cirth-primary-border)";
		const accent = getComputedStyle(probe).color;
		probe.remove();
		return {
			accent,
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

	// One marker and no more: the registered edge. Text stays neutral and
	// keeps the same weight, with no tint, pill, or generic link underline.
	expect(geometry.backgroundImage).toBe("none");
	expect(geometry.backgroundColor).toBe("rgba(0, 0, 0, 0)");
	expect(geometry.borderRadius).toBe("0px");
	expect(geometry.leadingEdge).toBe(2);
	expect(geometry.leadingEdgeColor).toBe(geometry.accent);
	expect(geometry.color).toBe(inactiveStyle.color);
	expect(geometry.fontWeight).toBe(inactiveStyle.fontWeight);
	expect(geometry.textDecoration).toBe("none");

	// One rail. The shell used to add a second amber bar as a ::before on
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
	// while version, preset and theme sat outside it — and the bar, unable
	// to fit them beside the search, wrapped onto a second grid row: a
	// 155px sticky header on every page. Both halves are asserted here,
	// because either one alone can come back.
	const expanded = [1440, 1280, 1100, 1024];
	const collapsed = [1023, 900, 768, 576, 575, 390, 320];

	for (const width of [...expanded, ...collapsed]) {
		await page.setViewportSize({ width, height: 800 });
		await page.goto(`${origin}/get-started/`, { waitUntil: "networkidle" });

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
				overflow: document.documentElement.scrollWidth - window.innerWidth,
			};
		});

		const at = `at ${width}px`;
		expect(state.total, `controls are duplicated ${at}`).toBe(3);
		expect(state.overflow, `horizontal overflow ${at}`).toBeLessThanOrEqual(0);
		// One row, at every width. 155px was two.
		expect(
			state.headerHeight,
			`header is ${state.headerHeight}px ${at}`,
		).toBeLessThan(100);

		if (expanded.includes(width)) {
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
	await page.goto(`${origin}/get-started/`, { waitUntil: "networkidle" });

	const actions = page.locator(".docs-header-actions");
	const search = page.locator("[data-docs-search-trigger]");
	const menu = page.locator("[data-docs-menu-drawer]");
	const trigger = page.locator("[data-docs-menu-trigger]");
	const panel = menu;
	const controls = panel.locator("[data-docs-mobile-controls]");

	// Search, then the toggler — in the DOM, so also in the tab order.
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
	// below the current item, current at full contrast — and none of the
	// three is the accent, which in chrome belongs to actions.
	await page.setViewportSize({ width: 1280, height: 800 });
	await page.goto(`${origin}/get-started/`, { waitUntil: "networkidle" });

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
		// Resolved, not the raw token: --cirth-primary is a light-dark()
		// expression, and comparing it as a string compares nothing.
		page.evaluate(() => {
			const probe = document.createElement("span");
			probe.style.color = "var(--cirth-primary)";
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

// Four claims and two more below them, and what is worth pinning is no
// longer only that each has a path to check it: it is that each says what
// kind of claim it is. A guarantee, a capability and a measurement age
// differently, and a page that presents them identically is promising the
// measurement.
test("every claim says what kind it is, and how to check it", async ({
	page,
}) => {
	await page.setViewportSize({ width: 1280, height: 900 });
	await page.goto(`${origin}/`, { waitUntil: "networkidle" });

	const cells = page.locator(".docs-proof-metrics > div");
	await expect(cells).toHaveCount(4);

	for (const value of [
		"0 B JS runtime",
		"WCAG 2.2 AA baseline",
		"Flexible distribution",
		"Small CSS footprint",
	]) {
		await expect(
			page.locator(".docs-proof-metrics", { hasText: value }),
			`${value} is stated`,
		).toBeVisible();
	}

	// Every cell: a kind, a claim, what it means, and a way to check it.
	const count = await cells.count();
	for (let index = 0; index < count; index++) {
		const cell = cells.nth(index);
		await expect(cell.locator("dt .docs-proof-state")).toHaveCount(1);
		await expect(cell.locator("dd > strong")).toHaveCount(1);
		await expect(cell.locator("dd small")).toHaveCount(1);
		const link = cell.locator("dd a");
		await expect(link, `cell ${index} has a check path`).toHaveCount(1);
		expect(
			(await link.getAttribute("href")) || "",
			`cell ${index} path is real`,
		).not.toBe("");
	}

	// The vocabulary is three words, used by both halves of the section —
	// the strip and the list under it — so a reader learns it once.
	const kinds = await page
		.locator(".docs-proof .docs-proof-state")
		.evaluateAll((marks) => marks.map((mark) => mark.textContent?.trim()));
	expect(kinds).toEqual([
		"Guarantee",
		"Guarantee",
		"Capability",
		"Current fact",
		"Guarantee",
		"Capability",
	]);

	// The size is the one current fact, and it is stated as a measurement of
	// this build rather than as a ceiling: a real number, in the caption
	// that dates it, with the check beside it. A bare "<14 KB" headline is
	// the shape of a promise, and the page does not make that one — the
	// budget is a build guard, not a claim to a reader.
	const size = cells.nth(3);
	await expect(size.locator("dd > strong")).toHaveText("Small CSS footprint");
	await expect(size.locator("dd small")).toContainText(/\d+(\.\d+)? KB/);
	await expect(size.locator("dd small")).toContainText("this build");
	await expect(page.locator(".docs-proof")).not.toContainText("<14 KB");

	// No claim rests on a count of builds either. "4 builds" was accurate,
	// and the promise it implied — that there will always be exactly four —
	// is not one worth making when print sheets and presets already sit
	// beside them.
	await expect(page.locator(".docs-proof")).not.toContainText(/\d+ builds/);

	// The two claims that are not about the package's shape are a list, not
	// a second table of the four above.
	const claims = page.locator(".docs-proof-claims li");
	await expect(claims).toHaveCount(2);
	await expect(page.locator(".docs-proof table")).toHaveCount(0);
	for (const value of ["0 B JS", "WCAG 2.2", "footprint"]) {
		await expect(
			page.locator(".docs-proof-claims", { hasText: value }),
			`${value} is not restated below the strip`,
		).toHaveCount(0);
	}

	// The marks are still glyphs from the shell's own set: one size, no
	// container, hidden from assistive technology because the word is right
	// beside them.
	const marks = await page
		.locator(".docs-proof-state svg")
		.evaluateAll((nodes) =>
			nodes.map((node) => ({
				tag: node.tagName.toLowerCase(),
				hidden: node.getAttribute("aria-hidden"),
				width: Math.round(node.getBoundingClientRect().width),
				height: Math.round(node.getBoundingClientRect().height),
				border: getComputedStyle(node).borderTopWidth,
			})),
		);
	expect(marks).toHaveLength(6);
	for (const mark of marks) {
		expect(mark.tag).toBe("svg");
		expect(mark.hidden).toBe("true");
		expect(mark.width).toBe(16);
		expect(mark.height).toBe(16);
		expect(Number.parseFloat(mark.border)).toBe(0);
	}

	// The band has no frame of its own: the two showcases above are each a
	// hairline plate, and a third would be the shape this page was rebuilt
	// to stop having. Its tint is what separates it from them, and from the
	// FAQ below — which is back on the canvas for the same reason.
	const grounds = await page.evaluate(() => {
		const read = (/** @type {string} */ selector) => {
			const element = document.querySelector(selector);
			if (!element) return null;
			const style = getComputedStyle(element);
			return {
				background: style.backgroundColor,
				border: Number.parseFloat(style.borderTopWidth),
			};
		};
		return {
			proof: read(".docs-proof"),
			faq: read(".docs-native-faq"),
			metrics: read(".docs-proof-metrics"),
			showcase: read(".docs-showcase"),
		};
	});
	expect(grounds.metrics?.border, "the metric strip has no frame").toBe(0);
	expect(
		grounds.proof?.background,
		"the proof band is tinted away from its neighbours",
	).not.toBe(grounds.faq?.background);
	expect(grounds.proof?.background).not.toBe(grounds.showcase?.background);

	// It stays a hairline grid at every width — two columns on a phone, four
	// once the row can hold them, and never a set of stacked cards with the
	// claims' relationship to each other taken out.
	for (const width of [1440, 1023, 767, 390, 320]) {
		await page.setViewportSize({ width, height: 900 });
		const columns = await page
			.locator(".docs-proof-metrics")
			.evaluate(
				(element) =>
					getComputedStyle(element).gridTemplateColumns.split(" ").length,
			);
		expect(columns, `metric columns at ${width}px`).toBe(width >= 960 ? 4 : 2);
	}
});

// --- The hero composition -----------------------------------------------

/**
 * What the hero has to be true about, now that the reveal is a CSS wipe
 * over markup that never changes: the source is whole and highlighted at
 * every moment, the output is the real build, and neither of those facts
 * depends on JavaScript having run, on the animation having finished, or
 * on a preference being set one way rather than the other.
 * @param {import("@playwright/test").Page} page
 */
const heroState = (page) =>
	page.evaluate(() => {
		const code = /** @type {HTMLElement} */ (
			document.querySelector("[data-lab-source]")
		);
		const pre = /** @type {HTMLElement} */ (
			document.querySelector(".docs-source-panel pre")
		);
		return {
			text: code.textContent?.length ?? 0,
			highlighted: code.querySelectorAll(".hljs-name, .hljs-attr").length,
			preHeight: Math.round(pre.getBoundingClientRect().height),
			preScrollWidth: pre.scrollWidth,
			cardHeight: Math.round(
				/** @type {HTMLElement} */ (
					document.querySelector(".docs-source-panel")
				).getBoundingClientRect().height,
			),
		};
	});

test("the hero writes the source in without ever changing it", async ({
	page,
}) => {
	await page.emulateMedia({ reducedMotion: "no-preference" });
	await page.goto(`${origin}/`, { waitUntil: "networkidle" });

	// Mid-animation.
	const during = await heroState(page);
	expect(during.text).toBeGreaterThan(300);
	expect(during.highlighted).toBeGreaterThan(10);

	const animation = await page
		.locator(".docs-source-panel pre > code")
		.evaluate((element) => {
			const running = element.getAnimations();
			return {
				count: running.length,
				// One pass and done: a hero that keeps re-typing itself is a
				// thing to look away from, not a thing to read.
				iterations: running.map(
					(item) =>
						/** @type {CSSAnimation & { effect: KeyframeEffect }} */ (item)
							.effect.getTiming().iterations,
				),
			};
		});
	expect(animation.count).toBe(1);
	expect(animation.iterations).toEqual([1]);

	// Let it finish, then compare. The wipe only ever changed the ink, so
	// nothing about the pane — its height, its scroll extent, the card
	// around it, the text inside it, or the highlighting — is allowed to
	// differ between a half-written state and a finished one.
	await page
		.locator(".docs-source-panel pre > code")
		.evaluate((element) =>
			Promise.all(element.getAnimations().map((item) => item.finished)),
		);
	const after = await heroState(page);
	expect(after).toEqual(during);

	// And the whole snippet is selectable and copyable throughout, because
	// it was never taken out of the document to begin with. The last line
	// of the markup, so reaching it means none of it was cut.
	await expect(page.locator("[data-lab-source]")).toContainText("</main>");
});

test("the hero holds still under reduced motion", async ({ page }) => {
	// The behavior project already runs reduced, which is what makes the
	// screenshot suite deterministic; assert the contract rather than
	// assume it.
	await page.emulateMedia({ reducedMotion: "reduce" });
	await page.goto(`${origin}/`, { waitUntil: "networkidle" });

	const animations = await page.evaluate(() =>
		document
			.getAnimations()
			.map((item) => /** @type {CSSAnimation} */ (item).animationName)
			.filter(Boolean),
	);
	expect(animations).not.toContain("docs-lab-write");
	expect(animations).not.toContain("docs-lab-render");

	// The finished composition is the resting state, so removing the
	// animation removes nothing: full source, unclipped, output visible.
	const state = await heroState(page);
	expect(state.text).toBeGreaterThan(300);
	expect(state.highlighted).toBeGreaterThan(10);
	expect(
		await page
			.locator(".docs-source-panel pre > code")
			.evaluate((element) => getComputedStyle(element).clipPath),
	).toBe("none");
	await expect(page.locator(".docs-output-frame")).toBeVisible();
	expect(
		await page
			.locator(".docs-output-frame")
			.evaluate((element) => getComputedStyle(element).opacity),
	).toBe("1");
});

test("the hero has no controls, and its output follows the page", async ({
	page,
}) => {
	await page.goto(`${origin}/`, { waitUntil: "networkidle" });

	// The demo makes its argument by being read, not by being operated:
	// the build and theme selects that used to sit in the two title bands
	// are gone, and nothing replaced them.
	await expect(page.locator(".docs-lab-stage select")).toHaveCount(0);
	// The copy button stays: it belongs to the code block, is the same
	// affordance every <pre> on the site carries, and asks nothing of a
	// reader who ignores it.
	await expect(
		page.locator(".docs-lab-stage button:not(.copy)"),
	).toHaveCount(0);

	// The one thing markup cannot express: the framed document is a
	// separate document and does not inherit the page's colour scheme. So
	// it follows it, rather than asking the reader to pick.
	const before = await heroState(page);
	await expect(page.locator("[data-lab-frame]")).toHaveAttribute(
		"src",
		/theme=light/,
	);
	await page.locator(".docs-theme-toggle").click();
	await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
	await expect(page.locator("[data-lab-frame]")).toHaveAttribute(
		"src",
		/theme=dark/,
	);

	// And the markup on the other side is untouched by any of it.
	const after = await heroState(page);
	expect(after.text).toBe(before.text);
	expect(after.highlighted).toBeGreaterThan(10);
});

test.describe("without JavaScript", () => {
	test.use({ javaScriptEnabled: false });

	test("the hero demo serves the complete source and the real output", async ({
		page,
	}) => {
		await page.goto(`${origin}/`, { waitUntil: "load" });

		const code = page.locator("[data-lab-source]");
		await expect(code).toContainText('<main class="container">');
		await expect(code).toContainText('name="password"');
		await expect(code).toContainText("<button>Sign in</button>");
		await expect(code).not.toContainText("…");
		// Highlighted at build time, so it is highlighted here too.
		expect(await code.locator("span").count()).toBeGreaterThan(10);
		// The output is the real build, not a placeholder.
		await expect(page.locator("[data-lab-frame]")).toHaveAttribute(
			"src",
			/\/lab\/default\//,
		);
		await expect(
			page.frameLocator("[data-lab-frame]").getByRole("heading", {
				name: "Sign in",
			}),
		).toBeVisible();
		// And the proof band is readable without a line of script.
		await expect(page.locator(".docs-proof-metrics > div")).toHaveCount(4);
		await expect(page.locator(".docs-proof-claims li")).toHaveCount(2);
	});

	// The showcase's fallback is the whole reason its tab strip ships
	// `hidden` rather than inert: with no script there is no tablist, so
	// all three examples are served rendered, complete, and under their own
	// headings. A row of buttons that cannot change anything would be the
	// other outcome, and this page's own rule — stated on the preset select
	// beside it — is that a choice which cannot be applied is not offered.
	test("the showcase degrades to three complete examples", async ({ page }) => {
		await page.goto(`${origin}/`, { waitUntil: "load" });

		const strip = page.locator("[data-docs-switch]");
		await expect(strip).toHaveCount(1);
		await expect(strip).toBeHidden();
		// No roles either: a tabpanel with no tablist anywhere would be a
		// lie about the document, so the script that implements them is
		// what puts them there.
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
		// own children — the same specimen, in the light DOM, painted by the
		// page's Cirth. `:not(:defined)` is that state, and it is what
		// carries the pane's padding while it lasts.
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
		// The pane gave its padding to the element, so the un-upgraded
		// element has to carry it — otherwise the specimen sits against the
		// stage's own edge.
		expect(fallback.padding).toBeGreaterThan(8);
		await expect(
			preview.locator("article button", { hasText: "Save changes" }),
		).toBeVisible();

		// The control that drives the sequence is not offered, because
		// without script there is no sequence to pause.
		await expect(page.locator("[data-docs-theme-toggle]")).toBeHidden();
	});
});


// --- The home page's showcase sections ---------------------------------

// Every specimen on this page is declared once in home.njk and used twice:
// rendered into the page, and highlighted into the pane beside it. The
// point of doing it that way is that the two cannot drift — the hero has
// had exactly that bug before, a snippet declaring attributes the rendered
// output no longer had — so the contract to pin is equality, not the
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

	// Each tab controls a panel, and each panel is named by its tab —
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
	// panel is already in the document — nothing is fetched by arrowing.
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
			".docs-example:not([hidden]) .docs-stage-preview :is(input, select, summary), .docs-theme-showcase .docs-stage-preview :is(input, select, summary)",
		);
		const count = await controls.count();
		for (let index = 0; index < count; index++) {
			const control = controls.nth(index);
			// A Tab first, because opening an example is a click and every
			// engine's `:focus-visible` heuristic remembers that the last
			// interaction was a pointer — a programmatic focus after a click
			// is deliberately not focus-visible. The keypress puts the
			// browser back in the modality this assertion is about.
			await page.keyboard.press("Tab");
			await control.focus();
			expect(
				await control.evaluate((element) => element.matches(":focus-visible")),
				`${id ?? "theme"} control ${index} takes focus`,
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
				`${id ?? "theme"} control ${index} paints a focus ring`,
			).toBe(true);
			checked += 1;
		}
	}
	expect(checked).toBeGreaterThanOrEqual(8);
});

// --- The theme section --------------------------------------------------

/**
 * The listing beside the preview and the stylesheet the preview is really
 * carrying, normalised the same way. The listing breaks a `light-dark()`
 * value over three lines to fit the pane; the applied declaration is one
 * line. Collapsing whitespace — and the padding a broken line leaves
 * inside the parentheses — compares the declarations rather than the two
 * formattings of them.
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
		const surface = shadow?.querySelector(".cirth");
		const style = shadow?.querySelector("style[data-cirth-theme]");
		const block = document.querySelector("[data-docs-theme-block]");
		return {
			applied: style?.textContent ?? "",
			listed: block?.textContent ?? "",
			marked: [...document.querySelectorAll(".docs-token.is-changed")].map(
				(line) => line.getAttribute("data-token"),
			),
			// Resolved through the element, which is the only way to ask what
			// the demo's own copy of Cirth thinks a token is.
			accent: surface
				? getComputedStyle(surface).getPropertyValue("--cirth-primary").trim()
				: "",
			radius: surface
				? getComputedStyle(
						/** @type {Element} */ (surface.querySelector("article")),
					).borderTopLeftRadius
				: "",
			button: surface
				? getComputedStyle(
						/** @type {Element} */ (surface.querySelector("button")),
					).backgroundColor
				: "",
			pageAccent: getComputedStyle(document.documentElement)
				.getPropertyValue("--cirth-primary")
				.trim(),
			chip: getComputedStyle(
				/** @type {Element} */ (
					document.querySelector(
						'.docs-token-legend li[data-token="--cirth-primary"] .docs-token-chip',
					)
				),
			).backgroundColor,
		};
	});

// The demo is a custom element with its own copy of Cirth in a shadow
// root, and every claim this section makes rests on that: the declarations
// it applies have to reach the preview and nothing else, and the listing
// beside it has to be the stylesheet the preview is carrying rather than a
// picture of one.
test("the theme preview carries its own Cirth, in a shadow root", async ({
	page,
}) => {
	await page.goto(`${origin}/`, { waitUntil: "networkidle" });

	const element = page.locator("cirth-theme-preview");
	await expect(element).toHaveCount(1);

	const shadow = await element.evaluate((host) => {
		const root = host.shadowRoot;
		const sheets = [...(root?.querySelectorAll("link[rel=stylesheet]") ?? [])];
		return {
			mode: root ? "open" : "none",
			// The real compiled scoped build, not a look-alike written for
			// the demo — the same artifact the /lab/ specimens load.
			stylesheets: sheets.map((sheet) =>
				String(sheet.getAttribute("href")).replace(/^.*\/styles\//, "styles/"),
			),
			// The theme comes after Cirth's own sheet: an ordinary stylesheet
			// loaded after it, overriding custom properties at the same
			// specificity, which is what the documentation tells an author to
			// write. Before it, every declaration would lose.
			themeAfterCirth:
				[...(root?.children ?? [])].findIndex((child) =>
					child.matches("style[data-cirth-theme]"),
				) >
				[...(root?.children ?? [])].findIndex((child) =>
					child.matches("link[rel=stylesheet]"),
				),
			// The scoped build's theme root, which is what the listing names.
			wrapper: root?.querySelector(".cirth")?.tagName.toLowerCase() ?? null,
			specimen: root?.querySelector(".cirth > article")?.tagName.toLowerCase() ?? null,
			// The fallback children were taken into the shadow root, not left
			// behind as a second, unrendered copy of the same form.
			lightChildren: host.children.length,
		};
	});
	expect(shadow.mode).toBe("open");
	expect(shadow.stylesheets).toEqual(["styles/generated/cirth-lab-scoped.css"]);
	expect(shadow.themeAfterCirth).toBe(true);
	expect(shadow.wrapper).toBe("div");
	expect(shadow.specimen).toBe("article");
	expect(shadow.lightChildren).toBe(0);

	// The listing is the stylesheet. Not "shows the same values": the same
	// text, which is the only version of this claim that cannot drift.
	const state = await themeState(page);
	expect(normalizeCss(state.listed)).toBe(normalizeCss(state.applied));
	expect(state.applied).toContain(".cirth {");
	for (const token of [
		"--cirth-primary",
		"--cirth-border-radius",
		"--cirth-canvas",
	]) {
		expect(state.applied, `${token} is applied`).toContain(token);
	}

	// Nothing is marked before anything has moved, and the demo is served
	// in the default theme — the page's own — so the section opens on
	// agreement rather than on a difference the reader did not ask for.
	expect(state.marked).toEqual([]);
	expect(state.accent).toBe(state.pageAccent);

	// The chip is painted by the value the preview is carrying, so a swatch
	// cannot show one accent while the preview shows another.
	expect(state.chip).toBe(state.button);
});

// The isolation, exercised rather than asserted: the site's own preset
// switcher moves the page's tokens, and the demo — which has just been
// given a different set of values — does not move with it. This is the
// property the shadow root is for, and the reason the section can show a
// page theme and a demo theme at the same time.
test("the theme demo and the page keep separate themes", async ({ page }) => {
	await page.goto(`${origin}/`, { waitUntil: "networkidle" });

	const toggle = page.locator("[data-docs-theme-toggle]");
	await expect(toggle).toBeVisible();

	// Step the demo off its opening state by hand. The suite runs under
	// reduced motion, where nothing autoplays — which is the contract
	// below, and here it means the sequence only moves when asked.
	const opening = await themeState(page);
	await toggle.click();
	await expect
		.poll(async () => (await themeState(page)).accent, {
			message: "the demo takes a value of its own",
			timeout: 15000,
		})
		.not.toBe(opening.accent);
	await toggle.click();

	const moved = await themeState(page);
	// The demo moved; the page did not.
	expect(moved.pageAccent).toBe(opening.pageAccent);
	expect(moved.accent).not.toBe(moved.pageAccent);
	// And the listing still is the stylesheet, mid-sequence.
	expect(normalizeCss(moved.listed)).toBe(normalizeCss(moved.applied));

	// Now the other direction: the site's preset switcher repaints the page
	// and leaves the demo exactly where it was.
	const header = page.locator("[data-cirth-preset-select]");
	await header.selectOption("playroom");
	await expect(page.locator("#cirth-preset-stylesheet")).toHaveAttribute(
		"href",
		/presets\/playroom\.css$/,
	);
	const after = await themeState(page);
	expect(after.pageAccent).not.toBe(moved.pageAccent);
	expect(after.accent, "the demo is not repainted by the page").toBe(
		moved.accent,
	);
	expect(after.applied).toBe(moved.applied);

	await header.selectOption("amber");
});

// The sequence itself: one token at a time, marked where it stands, and
// the value that lands is the value the listing then shows. Every value in
// it is read out of a compiled file at build time, so "no fake code" is a
// property of the pipeline — what this checks is that the demo applies
// what it prints, at every step.
test("the token animation applies exactly what it prints", async ({ page }) => {
	await page.goto(`${origin}/`, { waitUntil: "networkidle" });

	const toggle = page.locator("[data-docs-theme-toggle]");
	const seen = new Set();

	for (let step = 0; step < 4; step += 1) {
		const before = await themeState(page);
		await toggle.click();
		await expect
			.poll(async () => (await themeState(page)).applied, {
				message: "a declaration moves",
				timeout: 15000,
			})
			.not.toBe(before.applied);
		await toggle.click();

		const after = await themeState(page);
		// The listing is still the stylesheet.
		expect(normalizeCss(after.listed)).toBe(normalizeCss(after.applied));

		// One declaration moved, and it is the one that is marked.
		const changed = ["--cirth-primary", "--cirth-border-radius", "--cirth-canvas"]
			.filter((token) => {
				const read = (/** @type {string} */ css) =>
					new RegExp(`${token}:([^;]+);`).exec(normalizeCss(css))?.[1];
				return read(before.applied) !== read(after.applied);
			});
		expect(changed, `step ${step}: one declaration at a time`).toHaveLength(1);
		expect(after.marked, `step ${step}: the moved line is marked`).toEqual(
			changed,
		);
		seen.add(changed[0]);
	}

	// And the sequence walks the tokens rather than sitting on one of them.
	expect(seen.size).toBeGreaterThan(1);
});

// Auto-updating content that is presented beside everything else needs a
// way to stop it (WCAG 2.2.2), and a reader who has asked for reduced
// motion should not have to use it: the demo holds its opening state and
// the control is what starts the sequence.
test("the theme demo holds still under reduced motion", async ({ page }) => {
	await page.goto(`${origin}/`, { waitUntil: "networkidle" });

	const toggle = page.locator("[data-docs-theme-toggle]");
	// The suite runs with reduced motion set (playwright.behavior.config).
	await expect(toggle).toHaveText("Play");
	await expect(toggle).toHaveAttribute("aria-label", /play/i);

	const opening = await themeState(page);
	await page.waitForTimeout(2500);
	expect(
		(await themeState(page)).applied,
		"nothing autoplays with the preference set",
	).toBe(opening.applied);

	// It is still available on request, and the button says which state it
	// is in rather than only what it does.
	await toggle.click();
	await expect(toggle).toHaveText("Pause");
	await expect
		.poll(async () => (await themeState(page)).applied, { timeout: 15000 })
		.not.toBe(opening.applied);
	await toggle.click();
	await expect(toggle).toHaveText("Play");
	const paused = await themeState(page);
	await page.waitForTimeout(2500);
	expect((await themeState(page)).applied, "pausing pauses it").toBe(
		paused.applied,
	);
});

// The control the section grew, and the trap the tab strip fell into once
// already: a <button> rebinds `--cirth-color` and `--cirth-background-color`
// to the pair the framework paints a filled button with, so a rule inside
// the button reaching for either name gets white-on-accent. Hovering this
// one turned it white on the band's own surface at 1.07:1 — caught by an
// axe pass over the section, and pinned here because it comes back the
// moment a state is left out of the rule.
test("the theme demo's control keeps the band's ink in every state", async ({
	page,
}) => {
	await page.goto(`${origin}/`, { waitUntil: "networkidle" });

	const toggle = page.locator("[data-docs-theme-toggle]");
	// The band's own two inks, read off the band rather than restated here.
	const band = await page
		.locator(".docs-theme-showcase .docs-stage-band")
		.evaluate((element) => {
			const style = getComputedStyle(element);
			return {
				ink: style.getPropertyValue("--docs-band-color").trim(),
				muted: style.getPropertyValue("--docs-band-muted").trim(),
				surface: style.getPropertyValue("--docs-band-surface").trim(),
			};
		});

	/** @param {import("@playwright/test").Locator} locator */
	const paint = (locator) =>
		locator.evaluate((element) => {
			const style = getComputedStyle(element);
			return { color: style.color, background: style.backgroundColor };
		});
	/** @param {string} value */
	const resolve = (value) =>
		page.evaluate((raw) => {
			const probe = document.createElement("span");
			probe.style.color = raw;
			document.body.append(probe);
			const resolved = getComputedStyle(probe).color;
			probe.remove();
			return resolved;
		}, value);

	const [ink, muted, surface] = await Promise.all(
		[band.ink, band.muted, band.surface].map(resolve),
	);

	const rest = await paint(toggle);
	expect(rest.color).toBe(muted);
	expect(rest.background).toBe(surface);

	await toggle.hover();
	const hovered = await paint(toggle);
	expect(hovered.color).toBe(ink);
	expect(hovered.background).toBe(surface);

	await toggle.focus();
	const focused = await paint(toggle);
	expect([ink, muted]).toContain(focused.color);
	expect(focused.background).toBe(surface);

	// And it takes a ring, like everything else this page asks a reader to
	// operate.
	await page.keyboard.press("Tab");
	await toggle.focus();
	expect(
		await toggle.evaluate((element) => {
			const style = getComputedStyle(element);
			return (
				(style.outlineStyle !== "none" &&
					Number.parseFloat(style.outlineWidth) > 0) ||
				style.boxShadow !== "none"
			);
		}),
		"the focused control paints a ring",
	).toBe(true);
});

// The one thing the old block-per-preset structure existed to protect: the
// shell injects a copy button on every `pre > code` and copies
// `textContent`, so anything hidden inside the block would be handed over
// with it. One block whose values are replaced has nothing hidden in it.
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
	expect(copied).toContain("--cirth-radius-sm");
	expect(copied).not.toContain("--cirth-radius-lg");
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
	// No skipped levels: the specimen cards sit at h3 inside sections
	// titled h2, and nothing on this page reaches for a level to get a
	// size (axe: heading-order).
	for (let index = 1; index < outline.length; index++) {
		expect(
			outline[index] - outline[index - 1],
			`heading ${index} follows ${outline[index - 1]}`,
		).toBeLessThanOrEqual(1);
	}

	// Five sections, because eight was the problem. "Native behavior stays
	// native" and "You're already looking at Cirth" are examples and a
	// sentence inside the showcase now; "Small surface, finished defaults"
	// and "Claims with a check path" are one proof band.
	const sections = await page
		.locator("main > section")
		.evaluateAll((items) => items.map((item) => item.className.split(" ")[0]));
	expect(sections).toEqual([
		"docs-native-hero",
		"docs-showcase",
		"docs-showcase",
		"docs-proof",
		"docs-native-faq",
	]);
	for (const gone of [
		"Native behavior stays native",
		"You're already looking at Cirth",
		"Small surface, finished defaults",
		"Claims with a check path",
	]) {
		await expect(
			page.locator("main h2", { hasText: gone }),
			`${gone} is not a section any more`,
		).toHaveCount(0);
	}
});

test("every showcase is one contained stage, not three loose columns", async ({
	page,
}) => {
	await page.goto(`${origin}/`, { waitUntil: "networkidle" });

	const grid = await page
		.locator(".docs-native-grid")
		.first()
		.evaluate((element) => element.getBoundingClientRect().width);

	for (const section of ["semantic", "theme"]) {
		const stage = page.locator(`[aria-labelledby="${section}-title"] .docs-stage`);
		await expect(stage, `${section} has one stage`).toHaveCount(1);

		// The stage spans the content column. What this replaced put the
		// heading in a narrow rail and left the evidence at two thirds of the
		// width, with the live half at under a third of it.
		const width = await stage.evaluate(
			(element) => element.getBoundingClientRect().width,
		);
		expect(Math.round(width), `${section} stage width`).toBeGreaterThanOrEqual(
			Math.round(grid) - 1,
		);

		// Everything the demo needs is inside it: the band that names it and
		// carries its control, and the panes, sharing one frame.
		await expect(
			stage.locator(":scope > .docs-stage-band"),
			`${section} stage names itself`,
		).toHaveCount(1);
	}

	// The live half is not a thumbnail: it takes at least as much of the row
	// as the listing that explains it — and in the theme stage, where the
	// cause is three declarations long, rather more.
	for (const scope of [
		'[data-docs-panel="article"]',
		".docs-theme-showcase",
	]) {
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

	// Switching examples must not move the page under the reader. The
	// listings were levelled for this: at one element per line the article
	// was 27 lines against the disclosure's 14, and the stage jumped 240px.
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

// The section that used to make this claim in its own heading ("You're
// already looking at Cirth") is gone, and the claim moved into one sentence
// under the disclosure example. A sentence is cheaper than a section, so
// the thing worth pinning is that it is still true: the questions at the
// bottom of this page are the element the example is showing.
test("the disclosure example is the element the FAQ below is made of", async ({
	page,
}) => {
	await page.goto(`${origin}/`, { waitUntil: "networkidle" });
	await openExample(page, "details");

	/** @param {string} selector */
	const shapeOf = (selector) =>
		page.locator(selector).first().evaluate((element) => {
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
				children: [...element.children].map((child) =>
					child.tagName.toLowerCase(),
				),
				answerColor: paragraph && getComputedStyle(paragraph).color,
				summaryColor: summary && getComputedStyle(summary).color,
			};
		});

	const [specimen, question] = await Promise.all([
		shapeOf('[data-docs-panel="details"] details'),
		shapeOf(".docs-faq-list details"),
	]);

	// The same element, the same four parts, and no classes on any of
	// them: `<details name>` + `<summary>` + `<p>`.
	expect(specimen.tag).toBe("details");
	expect(specimen).toEqual(question);
	expect(specimen.classes, "the specimen wears no classes").toBe("");
	expect(specimen.grouped, "and it is a group, like the FAQ is").toBe(true);

	// The FAQ is a real list of questions, and the note under the example
	// says so in a link a reader can follow.
	await expect(page.locator(".docs-faq-list details")).not.toHaveCount(0);
	await expect(
		page.locator('[data-docs-panel="details"] .docs-example-note a'),
	).toHaveAttribute("href", "#faq-title");

	// Two groups on the page, and they are separate ones: the specimen is
	// its own accordion, not a member of the FAQ's. The section this
	// replaced shipped a specimen carrying `name="faq"`, so opening it
	// closed an answer 2000px further down.
	expect(
		await page
			.locator("main details[name]")
			.evaluateAll((items) =>
				[...new Set(items.map((item) => item.getAttribute("name")))].sort(),
			),
	).toEqual(["delivery", "faq"]);
});
