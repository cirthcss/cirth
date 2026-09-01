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

/** @param {import("@playwright/test").Page} page */
const assertHeroDemoGeometry = async (page) => {
	const figureBox = await page.locator(".docs-transform-figure").boundingBox();
	const gridBox = await page.locator(".docs-transform-grid").boundingBox();
	const frameBox = await page.locator("[data-lab-frame]").boundingBox();
	const frameWrapperBox = await page
		.locator(".docs-output-frame")
		.boundingBox();
	const outputBox = await page.locator(".docs-output-panel").boundingBox();
	const noteBox = await page.locator(".docs-figure-note").boundingBox();
	if (
		!figureBox ||
		!gridBox ||
		!frameBox ||
		!frameWrapperBox ||
		!outputBox ||
		!noteBox
	) {
		throw new Error(
			"Expected the hero figure, preview, and footer to be visible",
		);
	}
	expect(
		Math.abs(noteBox.x + noteBox.width - (figureBox.x + figureBox.width)),
	).toBeLessThanOrEqual(1);
	expect(Math.abs(frameBox.y - frameWrapperBox.y)).toBeLessThanOrEqual(1);
	expect(
		Math.abs(
			frameBox.y +
				frameBox.height -
				(frameWrapperBox.y + frameWrapperBox.height),
		),
	).toBeLessThanOrEqual(1);
	expect(frameWrapperBox.y + frameWrapperBox.height).toBeLessThanOrEqual(
		outputBox.y + outputBox.height + 1,
	);
	expect(gridBox.y + gridBox.height).toBeLessThanOrEqual(noteBox.y + 1);
	expect(noteBox.y + noteBox.height).toBeLessThanOrEqual(
		figureBox.y + figureBox.height + 1,
	);
};

test("homepage keeps the source and authentic output comparison focused on mobile", async ({
	page,
}) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto(`${origin}/`, { waitUntil: "networkidle" });

	const output = page.locator(".docs-output-panel");
	const source = page.locator(".docs-source-panel");
	await expect(output).toHaveCount(1);
	await expect(page.locator(".docs-mechanism")).toHaveCount(0);
	await expect(page.locator(".docs-figure-caption")).toHaveCount(0);
	await expect(source.locator("[data-lab-source]")).toContainText(
		'<main class="container">',
	);
	await expect(source.locator("[data-lab-source]")).toContainText(
		'<input type="email" name="email" autocomplete="email">',
	);
	await expect(source.locator("[data-lab-source]")).not.toContainText("…");
	await expect(
		page.getByRole("button", { name: "Get Started" }),
	).toHaveAttribute("href", "/get-started");
	await expect(page.getByRole("button", { name: "Examples" })).toHaveAttribute(
		"href",
		"/examples",
	);

	const order = await Promise.all(
		[output, source].map((locator) =>
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
	for (const build of builds) {
		await page.locator("[data-lab-build]").selectOption(build.name);
		await expect(page.locator("[data-lab-frame]")).toHaveAttribute(
			"src",
			new RegExp(`/lab/${build.name}/`),
		);
		await expect(frame.locator('link[rel="stylesheet"]')).toHaveAttribute(
			"href",
			build.stylesheet,
		);
		await expect(frame.locator(".cirth")).toHaveCount(build.scoped ? 1 : 0);
		if (build.mainClass) {
			await expect(frame.locator("main")).toHaveClass(build.mainClass);
		} else {
			await expect(frame.locator("main")).not.toHaveAttribute("class");
		}
	}

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
}) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto(`${origin}/colors/`, { waitUntil: "networkidle" });

	const actions = page.locator(".docs-header-actions");
	const search = page.locator("[data-docs-search-trigger]");
	const menu = page.locator("[data-docs-mobile-menu]");
	const trigger = menu.locator(":scope > summary");
	const panel = menu.locator("#docs-mobile-menu-panel");
	const mobileControls = panel.locator("[data-docs-mobile-controls]");

	expect(
		await actions.evaluate((element) =>
			Array.from(element.children).map((child) => child.className),
		),
	).toEqual(["docs-header-search", "dropdown docs-mobile-menu"]);
	await expect(trigger).toHaveAttribute("aria-controls", "docs-mobile-menu-panel");
	await expect(trigger).toHaveAttribute("aria-expanded", "false");
	await expect(page.locator(".docs-header-controls-group [data-docs-header-control]")).toHaveCount(0);
	await expect(mobileControls.locator("[data-docs-header-control]")).toHaveCount(3);

	await search.focus();
	await page.keyboard.press("Tab");
	await expect(trigger).toBeFocused();
	await page.keyboard.press("Enter");
	await expect(menu).toHaveAttribute("open", "");
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
	await expect(menu).toBeHidden();
	await expect(page.locator(".docs-header-controls-group [data-docs-header-control]")).toHaveCount(3);
});

test("homepage cards and FAQ expose consistent interactive states", async ({
	page,
}) => {
	await page.emulateMedia({ reducedMotion: "no-preference" });
	await page.goto(`${origin}/`, { waitUntil: "networkidle" });

	const card = page.locator(".docs-case article").first();
	const rest = await card.evaluate((element) => {
		const style = getComputedStyle(element);
		return {
			background: style.backgroundColor,
			border: style.borderColor,
			boxShadow: style.boxShadow,
			transform: style.transform,
		};
	});
	await page.locator(".docs-case").first().hover();
	await page.waitForTimeout(200);
	const hover = await card.evaluate((element) => {
		const style = getComputedStyle(element);
		return {
			background: style.backgroundColor,
			border: style.borderColor,
			boxShadow: style.boxShadow,
			transform: style.transform,
		};
	});
	expect(hover.background).not.toBe(rest.background);
	expect(hover.border).not.toBe(rest.border);
	expect(hover.boxShadow).toBe("none");
	expect(hover.transform).toBe("none");

	const details = page.locator(".docs-native-faq details").first();
	const summary = details.locator("summary");
	const closedWidths = await Promise.all([
		details.evaluate((element) => element.getBoundingClientRect().width),
		summary.evaluate((element) => element.getBoundingClientRect().width),
	]);
	await summary.click();
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
				document.querySelector("[data-docs-mobile-menu]")
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
}) => {
	// 900px: squarely inside the range that used to be broken.
	await page.setViewportSize({ width: 900, height: 800 });
	await page.goto(`${origin}/get-started/`, { waitUntil: "networkidle" });

	const actions = page.locator(".docs-header-actions");
	const search = page.locator("[data-docs-search-trigger]");
	const menu = page.locator("[data-docs-mobile-menu]");
	const trigger = menu.locator(":scope > summary");
	const panel = menu.locator("#docs-mobile-menu-panel");
	const controls = panel.locator("[data-docs-mobile-controls]");

	// Search, then the toggler — in the DOM, so also in the tab order.
	expect(
		await actions.evaluate((element) =>
			Array.from(element.children).map((child) => child.className),
		),
	).toEqual(["docs-header-search", "dropdown docs-mobile-menu"]);
	const [searchBox, triggerBox] = await Promise.all([
		search.boundingBox(),
		trigger.boundingBox(),
	]);
	if (!searchBox || !triggerBox) throw new Error("collapsed bar is incomplete");
	expect(searchBox.x).toBeLessThan(triggerBox.x);

	await search.focus();
	await page.keyboard.press("Tab");
	await expect(trigger).toBeFocused();
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
	await page.keyboard.press("Enter");
	await expect(menu).toHaveAttribute("open", "");
	await page.setViewportSize({ width: 1280, height: 800 });
	await expect(menu).toBeHidden();
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

// --- The ledger is a table ----------------------------------------------

test("the ledger is a native table with one voice in its header row", async ({
	page,
}) => {
	await page.setViewportSize({ width: 1280, height: 900 });
	await page.goto(`${origin}/`, { waitUntil: "networkidle" });

	const table = page.locator(".docs-ledger-table table");
	// Real semantics, no ARIA re-implementation of them.
	await expect(table).toHaveCount(1);
	await expect(page.locator(".docs-ledger-table [role]")).toHaveCount(0);
	await expect(table.locator("thead th[scope='col']")).toHaveCount(4);
	await expect(table.locator("tbody tr")).toHaveCount(6);
	await expect(table.locator("tbody th[scope='row']")).toHaveCount(6);
	await expect(
		page.getByRole("table", { name: "Cirth proof ledger" }),
	).toBeVisible();

	// State, Claim, Evidence and Scope were set in three different
	// typefaces at two sizes, because the column rules matched the header
	// row too. One voice, and it has to stay one.
	const heads = await table.locator("thead th").evaluateAll((cells) =>
		cells.map((cell) => {
			const style = getComputedStyle(cell);
			return [
				style.fontFamily,
				style.fontSize,
				style.fontWeight,
				style.letterSpacing,
				style.textTransform,
				style.color,
				style.verticalAlign,
			].join("|");
		}),
	);
	expect(heads).toHaveLength(4);
	expect(new Set(heads).size, `header cells differ: ${heads.join("\n")}`).toBe(1);

	// The state marks are icons from the shell's own set, one size for
	// every state, hidden from assistive technology because the state is
	// already a word beside them.
	const marks = await page
		.locator(".docs-ledger-state svg")
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
	for (const state of ["verified", "covered", "runtime", "choice"]) {
		await expect(page.locator(".docs-ledger-state", { hasText: state }).first()).toBeVisible();
	}

	// It stays a table at every width — restacking it with `display: grid`
	// is what would take the row and column semantics back out.
	for (const width of [1023, 767, 390]) {
		await page.setViewportSize({ width, height: 900 });
		const shape = await table.evaluate((element) => ({
			display: getComputedStyle(element).display,
			head: getComputedStyle(
				/** @type {HTMLElement} */ (element.querySelector("thead th")),
			).display,
			overflow: document.documentElement.scrollWidth - window.innerWidth,
		}));
		expect(shape.display, `at ${width}px`).toBe("table");
		expect(shape.head, `at ${width}px`).toBe("table-cell");
		expect(shape.overflow, `at ${width}px`).toBeLessThanOrEqual(0);
	}
});

// --- The hero demo animates the source into the output ------------------

/**
 * @typedef {{
 *   phase: string,
 *   typed: number,
 *   total: number,
 *   outputStage: number,
 *   stops: number[],
 *   running: boolean,
 *   seek: (count: number) => void,
 *   complete: () => void,
 *   restart: () => void,
 *   stop: () => void,
 * }} LabDemo
 */

/**
 * The demo exposes its own state on `window` so the suite can
 * drive it instead of waiting a cycle out: every phase is one call away,
 * and nothing here depends on a timer landing.
 * @param {import("@playwright/test").Page} page
 */
const labState = (page) =>
	page.evaluate(() => {
		const demo = /** @type {LabDemo} */ (
			/** @type {any} */ (window).cirthLabDemo
		);
		const code = /** @type {HTMLElement} */ (
			document.querySelector("[data-lab-source]")
		);
		const pre = /** @type {HTMLElement} */ (
			document.querySelector(".docs-source-panel pre")
		);
		const doc = /** @type {HTMLIFrameElement} */ (
			document.querySelector("[data-lab-frame]")
		).contentDocument;
		const staged = /** @type {HTMLElement[]} */ (
			Array.from(
				doc?.querySelectorAll("article > h2, form > label, form > button") ?? [],
			)
		);
		return {
			phase: demo.phase,
			typed: demo.typed,
			total: demo.total,
			stage: demo.outputStage,
			stops: demo.stops,
			running: demo.running,
			// What is painted, and what is in the document, are different
			// questions here — that is the whole technique.
			inked: code.querySelectorAll(".docs-lab-ch.is-typed").length,
			text: code.textContent?.length ?? 0,
			highlighted: code.querySelectorAll(".hljs-name, .hljs-attr").length,
			outputShown: staged.filter((node) => node.style.display !== "none").length,
			outputTotal: staged.length,
			preHeight: Math.round(pre.getBoundingClientRect().height),
			preScrollWidth: pre.scrollWidth,
			cardHeight: Math.round(
				/** @type {HTMLElement} */ (
					document.querySelector(".docs-transform-figure")
				).getBoundingClientRect().height,
			),
		};
	});

test("the hero demo builds the output from the source and starts over", async ({
	page,
}) => {
	await page.emulateMedia({ reducedMotion: "no-preference" });
	await page.goto(`${origin}/`, { waitUntil: "networkidle" });
	await page.waitForFunction(() => /** @type {any} */ (window).cirthLabDemo?.total > 0);

	const start = await labState(page);
	expect(start.total).toBeGreaterThan(300);
	expect(start.stops).toHaveLength(5);
	expect(start.outputTotal).toBe(5);

	// Empty start: nothing painted, everything present.
	await page.evaluate(() => /** @type {any} */ (window).cirthLabDemo.seek(0));
	const empty = await labState(page);
	expect(empty.typed).toBe(0);
	expect(empty.inked).toBe(0);
	expect(empty.outputShown).toBe(0);
	expect(empty.text).toBe(start.total);
	expect(empty.highlighted).toBeGreaterThan(10);

	// Source advances, and the output gains exactly the elements the
	// markup typed so far produces.
	const seen = [];
	for (const [index, stop] of start.stops.entries()) {
		await page.evaluate((at) => /** @type {any} */ (window).cirthLabDemo.seek(at), stop);
		const step = await labState(page);
		expect(step.typed, `at stop ${index}`).toBe(stop);
		expect(step.inked, `at stop ${index}`).toBe(stop);
		expect(step.stage, `at stop ${index}`).toBe(index + 1);
		expect(step.outputShown, `at stop ${index}`).toBe(index + 1);
		// Highlighting survives the reveal; so does the whole source.
		expect(step.highlighted, `at stop ${index}`).toBe(empty.highlighted);
		expect(step.text, `at stop ${index}`).toBe(start.total);
		seen.push(step);
	}

	// Complete.
	await page.evaluate(() => /** @type {any} */ (window).cirthLabDemo.seek(/** @type {any} */ (window).cirthLabDemo.total));
	const full = await labState(page);
	expect(full.typed).toBe(start.total);
	expect(full.outputShown).toBe(5);

	// Deletion runs the same ladder backwards.
	await page.evaluate(() => /** @type {any} */ (window).cirthLabDemo.seek(/** @type {any} */ (window).cirthLabDemo.stops[2]));
	expect((await labState(page)).outputShown).toBe(3);
	await page.evaluate(() => /** @type {any} */ (window).cirthLabDemo.seek(0));
	expect((await labState(page)).outputShown).toBe(0);

	// Nothing moved. Not the panel, not its scroll extent, not the card:
	// the untyped tail keeps its space, which is why.
	const geometry = new Set(
		[empty, ...seen, full].map(
			(state) =>
				`${state.preHeight}/${state.preScrollWidth}/${state.cardHeight}`,
		),
	);
	expect([...geometry]).toHaveLength(1);

	// Restart returns to an empty pane and runs again.
	await page.evaluate(() => /** @type {any} */ (window).cirthLabDemo.restart());
	const restarted = await labState(page);
	expect(restarted.typed).toBe(0);
	expect(restarted.phase).toBe("typing");
	expect(restarted.running).toBe(true);
	await expect
		.poll(async () => (await labState(page)).typed, { timeout: 5000 })
		.toBeGreaterThan(0);
});

test("changing build or theme mid-cycle leaves one loop running", async ({
	page,
}) => {
	await page.emulateMedia({ reducedMotion: "no-preference" });
	await page.goto(`${origin}/`, { waitUntil: "networkidle" });
	await page.waitForFunction(() => /** @type {any} */ (window).cirthLabDemo?.total > 0);

	const before = await labState(page);
	await page.evaluate(() => /** @type {any} */ (window).cirthLabDemo.seek(/** @type {any} */ (window).cirthLabDemo.stops[2]));

	// A build change is a different snippet: stop, swap, start over.
	await page.locator("[data-lab-build]").selectOption("scoped");
	await expect(page.locator("[data-lab-frame]")).toHaveAttribute(
		"src",
		/\/lab\/scoped\//,
	);
	const rebuilt = await labState(page);
	expect(rebuilt.total).not.toBe(before.total);
	expect(rebuilt.total).toBe(rebuilt.text);
	expect(rebuilt.phase).toBe("typing");
	// One cycle, advancing once — not two racing each other.
	const samples = [];
	for (let i = 0; i < 4; i += 1) {
		samples.push((await labState(page)).typed);
		await page.waitForTimeout(150);
	}
	for (let i = 1; i < samples.length; i += 1) {
		expect(samples[i]).toBeGreaterThanOrEqual(samples[i - 1]);
	}
	expect(samples.at(-1)).toBeLessThanOrEqual(rebuilt.total);

	// A theme change is the same markup rendered differently, so the cycle
	// keeps its place rather than snapping back to an empty pane.
	await page.evaluate(() => /** @type {any} */ (window).cirthLabDemo.seek(/** @type {any} */ (window).cirthLabDemo.stops[3]));
	const held = await labState(page);
	await page.locator("[data-lab-theme]").selectOption("dark");
	await expect(page.locator("[data-lab-frame]")).toHaveAttribute(
		"src",
		/theme=dark/,
	);
	const after = await labState(page);
	expect(after.typed).toBe(held.typed);
	expect(after.total).toBe(held.total);
	// The reloaded frame comes back showing exactly the stage it left on.
	await expect
		.poll(async () => (await labState(page)).outputShown, { timeout: 5000 })
		.toBe(4);
});

test("the hero demo shows its finished state under reduced motion", async ({
	page,
}) => {
	// The behavior project already runs reduced, which is what makes the
	// screenshot suite deterministic; assert the contract rather than
	// assume it.
	await page.emulateMedia({ reducedMotion: "reduce" });
	await page.goto(`${origin}/`, { waitUntil: "networkidle" });
	await page.waitForFunction(() => /** @type {any} */ (window).cirthLabDemo);
	await page.waitForTimeout(400);

	const state = await labState(page);
	expect(state.phase).toBe("reduced");
	expect(state.running).toBe(false);
	// No cycle was ever set up: the source is simply the source.
	expect(state.total).toBe(0);
	expect(state.outputShown).toBe(state.outputTotal);
	await expect(page.locator("[data-lab-source]")).not.toHaveAttribute(
		"data-lab-typing",
		"",
	);
	await expect(page.locator("[data-lab-source]")).toContainText(
		'<input type="password" name="password" autocomplete="current-password">',
	);
	// Still no motion after a wait that would have covered several stops.
	await page.waitForTimeout(600);
	expect((await labState(page)).running).toBe(false);
});

test("reading the source stops the cycle and completes it", async ({ page }) => {
	await page.emulateMedia({ reducedMotion: "no-preference" });
	await page.goto(`${origin}/`, { waitUntil: "networkidle" });
	await page.waitForFunction(() => /** @type {any} */ (window).cirthLabDemo?.total > 0);
	await page.evaluate(() => /** @type {any} */ (window).cirthLabDemo.seek(20));

	await page.locator(".docs-source-panel pre").focus();
	const focused = await labState(page);
	expect(focused.running).toBe(false);
	expect(focused.phase).toBe("complete");
	expect(focused.typed).toBe(focused.total);
	expect(focused.outputShown).toBe(focused.outputTotal);
	// The pane is keyboard reachable and scrollable, and the cycle is not
	// moving under the reader's cursor.
	expect(
		await page
			.locator(".docs-source-panel pre")
			.evaluate((element) => element.scrollWidth > element.clientWidth),
	).toBe(true);
});

test.describe("without JavaScript", () => {
	test.use({ javaScriptEnabled: false });

	test("the hero demo serves the complete source and the real output", async ({
		page,
	}) => {
		await page.goto(`${origin}/`, { waitUntil: "load" });

		const code = page.locator("[data-lab-source]");
		await expect(code).toContainText('<main class="container">');
		await expect(code).toContainText(
			'<input type="password" name="password" autocomplete="current-password">',
		);
		await expect(code).toContainText("<button type=\"button\">Sign in</button>");
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
		// And the ledger is readable without a line of script.
		await expect(page.locator(".docs-ledger-table table tbody tr")).toHaveCount(6);
	});
});
