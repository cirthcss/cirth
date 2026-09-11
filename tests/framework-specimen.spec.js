const { expect, test } = require("@playwright/test");
const {
	assertDocsBuilt,
	createServer,
	startServer,
} = require("../scripts/lib/docs-site");
const {
	contrastColors,
	contrastRatio,
	oklabDistance,
	parseColor,
	simulateCvd,
} = require("../scripts/lib/color");

assertDocsBuilt("framework-specimen.spec");

const specimens = ["default", "plain", "playroom", "blue"];
/** @type {import("node:http").Server} */
let server;
/** @type {string} */
let origin;

test.beforeAll(async () => {
	server = createServer();
	origin = await startServer(server);
});

test.afterAll(() => server.close());

for (const specimen of specimens) {
	test(`${specimen} uses only the public framework surface`, async ({
		page,
	}) => {
		await page.goto(`${origin}/specimen/${specimen}/`);

		await expect(
			page.locator('link[href*="cirth-lab-default.css"]'),
		).toHaveCount(1);
		await expect(page.locator('link[href*="styles/style.css"]')).toHaveCount(0);
		await expect(
			page.locator('[class^="docs-"], [class*=" docs-"]'),
		).toHaveCount(0);
		await expect(page.locator("img, svg")).toHaveCount(0);
		await expect(page.locator("nav")).toHaveCount(3);

		// This is the maturity specimen, not a hand-picked component demo. If
		// one of these disappears, the visual suite would otherwise keep
		// passing while an entire native category silently left the audit.
		const publicSurface = [
			"h1",
			"h2",
			"h3",
			"h4",
			"h5",
			"h6",
			"p",
			"small",
			"a",
			"strong",
			"em",
			"abbr",
			"mark",
			"ins",
			"del",
			"code",
			"pre",
			"kbd",
			"samp",
			"var",
			"sub",
			"sup",
			"ul ul",
			"ol",
			"dl",
			"blockquote",
			"cite",
			"hr",
			"figure",
			"figcaption",
			"table caption",
			"form",
			"search",
			"fieldset",
			"textarea",
			"select",
			'input[type="search"]',
			'input[type="number"]',
			'input[type="date"]',
			'input[type="time"]',
			'input[type="datetime-local"]',
			'input[type="file"]',
			'input[type="range"]',
			'input[type="checkbox"]',
			'input[type="radio"]',
			'input[role="switch"]',
			"meter",
			"progress",
			"details",
			"dialog",
			"[popover]",
		];
		const missing = await page.evaluate((selectors) =>
			selectors.filter((selector) => !document.querySelector(selector)),
		publicSurface);
		expect(missing, `${specimen}: missing native specimen coverage`).toEqual([]);

		// The radius is a *pair*, not a number: a container is one step
		// softer than the controls inside it, so a card reads as a sheet
		// holding buttons rather than as a big button. A preset is expected
		// to move both ends of that pair — plain squares them off, playroom
		// rounds them — and the invariant is the relationship, not the value
		// it had in the default theme.
		const geometry = await page
			.locator('input[name="owner"]')
			.evaluate((field) => {
				const style = getComputedStyle(field);
				const card = document.querySelector("article");
				return {
					bottom: style.borderBottomWidth,
					cardRadius: Number.parseFloat(
						getComputedStyle(/** @type {Element} */ (card)).borderTopLeftRadius,
					),
					radius: Number.parseFloat(style.borderTopLeftRadius),
					top: style.borderTopWidth,
				};
			});
		expect(geometry.bottom).toBe(geometry.top);
		expect(geometry.radius).toBeGreaterThanOrEqual(0);
		expect(
			geometry.cardRadius,
			`${specimen}: the container radius is not softer than the control radius`,
		).toBeGreaterThan(geometry.radius);

		const buttonGeometry = await page
			.getByRole("button", { name: "Approve selected" })
			.evaluate((button) => {
				const style = getComputedStyle(button);
				return {
					bottom: style.borderBottomWidth,
					height: style.height,
					top: style.borderTopWidth,
				};
			});
		expect(buttonGeometry.bottom).toBe(buttonGeometry.top);
		expect(Number.parseFloat(buttonGeometry.height)).toBeGreaterThanOrEqual(44);
	});
}

const deficiencies = /** @type {const} */ ([
	"protanopia",
	"deuteranopia",
]);

for (const specimen of specimens) {
	for (const scheme of /** @type {const} */ (["light", "dark"])) {
		test(`${specimen} ${scheme} keeps native highlights, range, and semantic actions distinct`, async ({
			page,
		}) => {
			await page.emulateMedia({ colorScheme: scheme });
			await page.goto(`${origin}/specimen/${specimen}/`);

			const evidence = await page.evaluate(() => {
				/** @param {string} property */
				const resolve = (property) => {
					const probe = document.createElement("span");
					probe.style.backgroundColor = `var(${property})`;
					document.body.append(probe);
					const value = getComputedStyle(probe).backgroundColor;
					probe.remove();
					return value;
				};
				/** @param {string} selector */
				const styles = (selector) => {
					const element = document.querySelector(selector);
					if (!element) throw new Error(`missing ${selector}`);
					const style = getComputedStyle(element);
					return {
						background: style.backgroundColor,
						color: style.color,
					};
				};
				const range = document.querySelector('#controls input[type="range"]');
				const mark = document.querySelector("mark");
				if (!range || !mark) throw new Error("native evidence is unavailable");
				const markStyle = /** @type {CSSStyleDeclaration & { webkitBoxDecorationBreak?: string }} */ (
					getComputedStyle(mark)
				);

				return {
					danger: styles("button.danger"),
					mark: {
						background: markStyle.backgroundColor,
						boxDecorationBreak:
							markStyle.boxDecorationBreak || markStyle.webkitBoxDecorationBreak,
						color: markStyle.color,
					},
					primary: styles('#semantic-states [role="group"] button:first-child'),
					range: {
						height: range.getBoundingClientRect().height,
						thumb: resolve("--cirth-range-thumb-color"),
						track: resolve("--cirth-range-border-color"),
					},
					warningSurface: resolve("--cirth-warning-surface"),
				};
			});

			expect(evidence.mark.background).not.toBe(evidence.warningSurface);
			expect(evidence.mark.boxDecorationBreak).toBe("clone");
			expect(
				contrastRatio(evidence.mark.color, evidence.mark.background),
				`${specimen} ${scheme}: mark text`,
			).toBeGreaterThanOrEqual(4.5);
			expect(evidence.range.height).toBeGreaterThanOrEqual(44);
			expect(
				contrastRatio(evidence.range.thumb, evidence.range.track),
				`${specimen} ${scheme}: range thumb against track`,
			).toBeGreaterThanOrEqual(3);

			const pairs = [
				{
					name: "normal",
					transform:
						/** @param {ReturnType<typeof parseColor>} color */ (color) => color,
				},
				...deficiencies.map((deficiency) => ({
					name: deficiency,
					transform:
						/** @param {ReturnType<typeof parseColor>} color */ (color) =>
							simulateCvd(color, deficiency),
				})),
			];
			for (const { name, transform } of pairs) {
				const primaryFill = transform(parseColor(evidence.primary.background));
				const dangerFill = transform(parseColor(evidence.danger.background));
				const primaryText = transform(parseColor(evidence.primary.color));
				const dangerText = transform(parseColor(evidence.danger.color));
				expect(
					contrastColors(primaryText, primaryFill),
					`${specimen} ${scheme} ${name}: primary label`,
				).toBeGreaterThanOrEqual(4.5);
				expect(
					contrastColors(dangerText, dangerFill),
					`${specimen} ${scheme} ${name}: danger label`,
				).toBeGreaterThanOrEqual(4.5);
				// A label carries the meaning; this modest perceptual-distance floor
				// additionally prevents copper and destructive red collapsing into
				// one fill when red/green discrimination is reduced.
				expect(
					oklabDistance(primaryFill, dangerFill),
					`${specimen} ${scheme} ${name}: primary/danger distance`,
				).toBeGreaterThanOrEqual(0.06);
			}

			const range = page.locator('#controls input[type="range"]').first();
			const rest = await range.screenshot();
			await range.hover();
			const hover = await range.screenshot();
			expect(hover.equals(rest), `${specimen} ${scheme}: range hover`).toBe(false);
			await page.mouse.down();
			try {
				const active = await range.screenshot();
				expect(
					active.equals(hover),
					`${specimen} ${scheme}: range active`,
				).toBe(false);
			} finally {
				await page.mouse.up();
			}
			await focusVisibly(page, range);
			expect(
				Number.parseFloat(
					await range.evaluate(
						(element) => getComputedStyle(element).outlineWidth,
					),
				),
			).toBeGreaterThan(0);

			const disabledRange = page.locator("#risk-disabled");
			/** @param {import("@playwright/test").Locator} locator */
			const disabledStyle = (locator) =>
				locator.evaluate((element) => {
					const style = getComputedStyle(element);
					return {
						opacity: style.opacity,
						pointerEvents: style.pointerEvents,
						thumb: style.getPropertyValue("--cirth-range-thumb-color"),
						track: style.getPropertyValue("--cirth-range-border-color"),
					};
				});
			const disabledRest = await disabledStyle(disabledRange);
			const disabledBox = await disabledRange.boundingBox();
			if (!disabledBox) throw new Error("disabled range geometry is unavailable");
			// Disabled controls intentionally opt out of pointer events. Moving
			// the pointer to its painted box verifies the inert result without
			// asking Playwright to perform an action the element must reject.
			await page.mouse.move(
				disabledBox.x + disabledBox.width / 2,
				disabledBox.y + disabledBox.height / 2,
			);
			const disabledHover = await disabledStyle(disabledRange);
			expect(
				disabledHover,
				`${specimen} ${scheme}: disabled range is inert`,
			).toEqual(disabledRest);
			expect(disabledRest.pointerEvents).toBe("none");
			expect(Number.parseFloat(disabledRest.opacity)).toBeLessThan(1);
		});
	}
}

// A preset changes the dialect, not the grammar.
//
// This test used to assert that a preset changed *nothing* except colour —
// identical radius, identical stroke — which made the shipped presets a
// demonstration of one token and left the rest of the contract unexercised.
// A preset is supposed to be the worked example of what the token surface
// can do, so plain and playroom now also move the radius pair, the spacing
// rhythm and the transition. What must not move is the part docs/brand.md
// calls the structural signature: one hairline on every resting edge, the
// 44px control floor, and the radius *pairing*. Those are asserted below,
// along with the thing that would make the presets pointless in the other
// direction — every one of them being identical after all.
test("presets change the dialect, not the grammar", async ({ page }) => {
	const values = [];
	for (const specimen of specimens) {
		await page.goto(`${origin}/specimen/${specimen}/`);
		values.push(
			await page.locator('input[name="owner"]').evaluate((field) => {
				const style = getComputedStyle(field);
				const card = document.querySelector("article");
				// A button in the page body, not the one in the <nav>: a nav
				// opts its controls down to a compact 40px band on purpose
				// (components/_nav.scss), and asserting the 44px floor
				// against it would assert the opposite of that decision.
				const button = document.querySelector('[role="group"] button');
				const navButton = document.querySelector("nav button");
				return {
					borderBottomWidth: style.borderBottomWidth,
					borderTopWidth: style.borderTopWidth,
					buttonHeight: Number.parseFloat(
						getComputedStyle(/** @type {Element} */ (button)).height,
					),
					navButtonHeight: Number.parseFloat(
						getComputedStyle(/** @type {Element} */ (navButton)).height,
					),
					cardRadius: Number.parseFloat(
						getComputedStyle(/** @type {Element} */ (card)).borderTopLeftRadius,
					),
					controlRadius: Number.parseFloat(style.borderTopLeftRadius),
					primary: getComputedStyle(document.documentElement)
						.getPropertyValue("--cirth-primary")
						.trim(),
				};
			}),
		);
	}

	for (const [index, value] of values.entries()) {
		const name = specimens[index];
		// One stroke, all four sides, in every preset.
		expect(value.borderBottomWidth, name).toBe(value.borderTopWidth);
		// The 44px target floor is not a preset's to give away.
		expect(value.buttonHeight, name).toBeGreaterThanOrEqual(44);
		// A nav opts down to a compact band, but never below WCAG 2.5.8's
		// 24px AA minimum, and never as far as pretending to be a form.
		expect(value.navButtonHeight, name).toBeGreaterThanOrEqual(40);
		expect(value.navButtonHeight, name).toBeLessThan(44);
		// The pair holds wherever the scale is moved to.
		expect(value.cardRadius, name).toBeGreaterThan(value.controlRadius);
	}

	// One stroke width across the whole lineup.
	expect(
		new Set(values.map(({ borderBottomWidth }) => borderBottomWidth)).size,
	).toBe(1);
	// Four distinct accents...
	expect(new Set(values.map(({ primary }) => primary)).size).toBe(4);
	// ...and at least two distinct geometries, which is what stops a preset
	// from being a palette with extra steps.
	expect(
		new Set(values.map(({ controlRadius }) => controlRadius)).size,
	).toBeGreaterThan(1);
});

const schemes = /** @type {const} */ (["light", "dark"]);
const transitionDuration = 260;

/** @param {import("@playwright/test").Locator} locator */
const controlStyle = (locator) =>
	locator.evaluate((element) => {
		const style = getComputedStyle(element);
		return {
			background: style.backgroundColor,
			border: style.borderColor,
			borderBottomColor: style.borderBottomColor,
			borderBottomWidth: style.borderBottomWidth,
			borderLeftWidth: style.borderLeftWidth,
			borderRightWidth: style.borderRightWidth,
			borderTopColor: style.borderTopColor,
			borderTopWidth: style.borderTopWidth,
			boxShadow: style.boxShadow,
			color: style.color,
			height: element.getBoundingClientRect().height,
			radius: style.borderRadius,
			transform: style.transform,
		};
	});

/**
 * @param {import("@playwright/test").Page} page
 * @param {import("@playwright/test").Locator} locator
 */
const focusVisibly = async (page, locator) => {
	await page.keyboard.press("Tab");
	// WebKit follows the macOS Full Keyboard Access preference and can skip
	// buttons in the sequential tab order. A keyboard event before this
	// fallback preserves :focus-visible without inventing a test-only state.
	if (
		!(await locator.evaluate((element) => element === document.activeElement))
	) {
		await locator.focus();
	}
	await expect(locator).toBeFocused();
	expect(
		await locator.evaluate((element) => element.matches(":focus-visible")),
	).toBe(true);
};

for (const specimen of specimens) {
	for (const scheme of schemes) {
		test(`${specimen} ${scheme} exposes distinct real control states`, async ({
			page,
		}) => {
			await page.emulateMedia({ colorScheme: scheme });
			const url = `${origin}/specimen/states/${specimen}/`;
			await page.goto(url);

			const controls = [
				page.locator("[data-state-input]"),
				page.locator('input[type="search"]').first(),
				page.locator("select").first(),
				page.locator("textarea").first(),
				page.locator('input[type="date"]'),
				page.locator('input[type="time"]'),
			];

			for (const control of controls) {
				const rest = await controlStyle(control);
				await control.hover();
				await page.waitForTimeout(transitionDuration);
				const hover = await controlStyle(control);
				expect(hover.border).not.toBe(rest.border);
				expect(hover.background).toBe(rest.background);
				expect(hover.borderBottomWidth).toBe(hover.borderTopWidth);
			}

			const input = page.locator("[data-state-input]");
			const hoverInput = await controlStyle(input);
			await input.focus();
			await page.waitForTimeout(transitionDuration);
			expect(await input.evaluate((element) => element.matches(":focus"))).toBe(
				true,
			);
			const focusInput = await controlStyle(input);
			expect(focusInput.boxShadow).not.toBe("none");
			expect(focusInput.boxShadow).not.toBe(hoverInput.boxShadow);

			await page.goto(url);
			const primary = page.locator("[data-state-button]");
			const secondary = page.getByRole("button", { name: "Secondary" });
			const contrast = page.getByRole("button", { name: "Contrast" });
			const outline = page.locator("[data-state-outline]");
			const ghost = page.locator("[data-state-ghost]");
			const disabled = page.locator("[data-state-disabled-button]");
			const restButton = await controlStyle(primary);
			for (const variant of [secondary, contrast, outline]) {
				const variantStyle = await controlStyle(variant);
				expect(variantStyle.borderBottomWidth).toBe(
					restButton.borderBottomWidth,
				);
				expect(variantStyle.height).toBe(restButton.height);
				expect(variantStyle.radius).toBe(restButton.radius);
			}
			expect((await controlStyle(ghost)).borderBottomWidth).toBe(
				(await controlStyle(ghost)).borderTopWidth,
			);
			expect((await controlStyle(disabled)).borderBottomWidth).toBe(
				(await controlStyle(disabled)).borderTopWidth,
			);

			for (const variant of [primary, secondary, contrast, outline, ghost]) {
				const rest = await controlStyle(variant);
				await variant.hover();
				await page.waitForTimeout(transitionDuration);
				const hover = await controlStyle(variant);
				expect(hover.background).not.toBe(rest.background);
			}
			// Flat: the bottom edge is the same colour as the other three, not
			// a darkened lip simulating relief.
			expect(restButton.borderBottomColor).toBe(restButton.borderTopColor);

			for (const variant of [primary, secondary, contrast, outline, ghost]) {
				await page.goto(url);
				const rest = await controlStyle(variant);
				await focusVisibly(page, variant);
				await page.waitForTimeout(transitionDuration);
				const focus = await controlStyle(variant);
				expect(focus.boxShadow).not.toBe("none");
				expect(focus.boxShadow).not.toBe(rest.boxShadow);
			}

			await page.goto(url);
			const activeButton = page.locator("[data-state-button]");
			const activeRest = await controlStyle(activeButton);
			await activeButton.hover();
			await page.mouse.down();
			try {
				expect(
					await activeButton.evaluate((element) => element.matches(":active")),
				).toBe(true);

				const active = await controlStyle(activeButton);

				// Pressed is a colour change, not a nudge. The control used to
				// translate 1px, which read as relief on a button whose edges
				// are otherwise flat, and moved the target under the pointer.
				expect(active.transform).toBe("none");
				expect(active.background).not.toBe(activeRest.background);
			} finally {
				await page.mouse.up();
			}

			const flatSelectors = [
				"[data-state-card]",
				"[data-state-code]",
				"[data-state-button]",
				"[data-state-outline]",
				"[data-state-ghost]",
			];
			for (const selector of flatSelectors) {
				const style = await controlStyle(page.locator(selector));
				expect(
					new Set([
						style.borderTopWidth,
						style.borderRightWidth,
						style.borderBottomWidth,
						style.borderLeftWidth,
					]).size,
				).toBe(1);
				// "No shadow" has two spellings here: `none` on structural
				// surfaces, and a fully transparent zero-offset shadow on
				// buttons, which exists only so the focus ring has something to
				// compose onto. Both paint nothing.
				expect(
					style.boxShadow === "none" ||
						/^rgba\(0, 0, 0, 0\) 0px 0px 0px 0px$/.test(style.boxShadow),
					`unexpected shadow: ${style.boxShadow}`,
				).toBe(true);
			}

			const details = page.locator("[data-state-accordion]");
			const summary = details.locator("summary");
			const [detailsBox, summaryBox] = await Promise.all([
				details.boundingBox(),
				summary.boundingBox(),
			]);
			if (!detailsBox || !summaryBox) {
				throw new Error("accordion geometry is unavailable");
			}
			expect(summaryBox.height).toBeGreaterThanOrEqual(44);
			expect(Math.abs(detailsBox.width - summaryBox.width)).toBeLessThanOrEqual(
				2,
			);
			const divider = await details.evaluate((element) => {
				const summary = element.querySelector("summary");
				if (!summary) {
					throw new Error("accordion summary is unavailable");
				}
				return {
					item: Number.parseFloat(getComputedStyle(element).borderBottomWidth),
					trigger: Number.parseFloat(
						getComputedStyle(summary).borderBottomWidth,
					),
				};
			});
			expect(divider.item).toBeGreaterThan(0);
			expect(divider.trigger).toBe(0);
			const summaryRest = await controlStyle(summary);
			await summary.hover();
			await page.waitForTimeout(transitionDuration);
			const summaryHover = await controlStyle(summary);
			expect(summaryHover.background).toBe(summaryRest.background);
			expect(summaryHover.color).not.toBe(summaryRest.color);
			await page.goto(url);
			await focusVisibly(page, summary);
			expect(
				Number.parseFloat(
					await summary.evaluate(
						(element) => getComputedStyle(element).outlineWidth,
					),
				),
			).toBeGreaterThan(0);
			await summary.click();
			await expect(details).toHaveAttribute("open", "");
		});
	}
}

test("multiline accordion keeps its full target at 320px", async ({ page }) => {
	await page.setViewportSize({ width: 320, height: 720 });
	await page.goto(`${origin}/specimen/states/default/`);
	const summary = page.locator("details").nth(2).locator("summary");
	const details = page.locator("details").nth(2);
	const [summaryBox, detailsBox] = await Promise.all([
		summary.boundingBox(),
		details.boundingBox(),
	]);
	if (!summaryBox || !detailsBox) {
		throw new Error("mobile accordion geometry is unavailable");
	}
	expect(summaryBox.height).toBeGreaterThanOrEqual(44);
	expect(Math.abs(summaryBox.width - detailsBox.width)).toBeLessThanOrEqual(2);
});

test("dark progress follows each public primary instead of default amber", async ({
	page,
}) => {
	await page.emulateMedia({ colorScheme: "dark" });
	const values = [];

	for (const specimen of specimens) {
		await page.goto(`${origin}/specimen/${specimen}/`);
		values.push(
			await page.evaluate(() => {
				const swatch = document.createElement("span");
				swatch.style.backgroundColor = "var(--cirth-progress-color)";
				document.body.append(swatch);
				const color = getComputedStyle(swatch).backgroundColor;
				swatch.remove();
				return color;
			}),
		);
	}

	expect(new Set(values).size).toBe(4);
});

test("dialog behavior is specimen-only and keyboard reachable", async ({
	page,
}) => {
	await page.goto(`${origin}/specimen/default/`);
	await page
		.getByRole("button", { name: "Review confirmation dialog" })
		.click();
	const dialog = page.getByRole("dialog");
	await expect(dialog).toBeVisible();
	await expect(
		page.getByRole("button", { name: "Cancel" }).last(),
	).toBeFocused();
	await page.keyboard.press("Escape");
	await expect(dialog).toBeHidden();
});
