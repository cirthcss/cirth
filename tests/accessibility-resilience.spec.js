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

// Reflow and user-style resilience are manual WCAG checks that axe cannot
// infer from a desktop screenshot. Exercise the complete current docs line
// in every supported engine and shipped theme so a single long token,
// fixed-height control, or docs-shell regression cannot silently widen or
// clip a page.

assertDocsBuilt("accessibility-resilience.spec");

const pages = listPages();
const textSpacingCss = `
	*:not(script, style, svg, svg *) {
		line-height: 1.5 !important;
		letter-spacing: 0.12em !important;
		word-spacing: 0.16em !important;
	}
	p {
		margin-block-end: 2em !important;
	}
`;

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
 * @param {string} target
 * @param {(typeof themeVariants)[number]} theme
 */
const openPage = async (page, target, theme) => {
	await page.goto(`${origin}/${target}`, { waitUntil: "load" });
	await waitForTheme(page, theme);
	await page.evaluate(() => document.fonts.ready);
	await page.evaluate(
		() =>
			new Promise((resolve) => requestAnimationFrame(() => resolve(undefined))),
	);
};

/**
 * @param {import("@playwright/test").Page} page
 * @returns {Promise<{
 *   clientWidth: number,
 *   scrollWidth: number,
 *   offenders: string[],
 *   clippedText: string[],
 * }>}
 */
const measure = (page) =>
	page.evaluate(() => {
		const root = document.documentElement;
		const isInsideClosedDetails = (/** @type {Element} */ element) => {
			for (
				let ancestor = element.parentElement;
				ancestor;
				ancestor = ancestor.parentElement
			) {
				if (!ancestor.matches("details:not([open])")) continue;
				const summary = ancestor.querySelector(":scope > summary");
				if (!summary?.contains(element)) return true;
			}
			return false;
		};
		const selector = (/** @type {Element} */ element) => {
			const id = element.id ? `#${CSS.escape(element.id)}` : "";
			const classes = [...element.classList]
				.slice(0, 2)
				.map((name) => `.${CSS.escape(name)}`)
				.join("");
			return `${element.localName}${id}${classes}`;
		};

		const offenders = [...document.body.querySelectorAll("*")]
			.filter((element) => {
				if (isInsideClosedDetails(element)) return false;
				const rect = element.getBoundingClientRect();
				const style = getComputedStyle(element);
				return (
					style.position !== "fixed" &&
					style.display !== "none" &&
					style.visibility !== "hidden" &&
					(rect.right > root.clientWidth + 1 || rect.left < -1)
				);
			})
			.slice(0, 8)
			.map((element) => selector(element));

		const clippedText = [...document.body.querySelectorAll("*")]
			.filter((element) => {
				if (
					isInsideClosedDetails(element) ||
					element.matches(
						"script, style, svg, .sr-only, .sr-only-focusable, .truncate, [aria-hidden='true']",
					)
				) {
					return false;
				}

				const hasDirectText = [...element.childNodes].some(
					(node) =>
						node.nodeType === Node.TEXT_NODE &&
						Boolean(node.textContent?.trim()),
				);
				if (!hasDirectText) return false;

				const rect = element.getBoundingClientRect();
				const style = getComputedStyle(element);
				if (
					rect.width === 0 ||
					rect.height === 0 ||
					style.display === "none" ||
					style.visibility === "hidden"
				) {
					return false;
				}

				const clipsX = ["hidden", "clip"].includes(style.overflowX);
				const clipsY = ["hidden", "clip"].includes(style.overflowY);
				return (
					(clipsX && element.scrollWidth > element.clientWidth + 1) ||
					(clipsY && element.scrollHeight > element.clientHeight + 1)
				);
			})
			.slice(0, 8)
			.map((element) => selector(element));

		return {
			clientWidth: root.clientWidth,
			scrollWidth: root.scrollWidth,
			offenders,
			clippedText,
		};
	});

/**
 * @param {import("@playwright/test").Page} page
 * @param {(typeof themeVariants)[number]} theme
 * @param {(page: import("@playwright/test").Page) => Promise<void>} [prepare]
 */
const auditAllPages = async (page, theme, prepare) => {
	const failures = [];
	for (const target of pages) {
		await openPage(page, target, theme);
		if (prepare) {
			await prepare(page);
			await page.evaluate(
				() =>
					new Promise((resolve) =>
						requestAnimationFrame(() => resolve(undefined)),
					),
			);
		}

		const result = await measure(page);
		if (
			result.scrollWidth > result.clientWidth + 1 ||
			result.clippedText.length > 0
		) {
			failures.push({ page: target, ...result });
		}
	}

	expect(failures).toEqual([]);
};

for (const theme of themeVariants) {
	test.describe(`${theme.name} theme`, () => {
		test.beforeEach(async ({ page }) => {
			await installTheme(page, theme);
		});

		test("every docs page reflows at 320 CSS pixels", async ({ page }) => {
			await page.setViewportSize({ width: 320, height: 800 });
			await auditAllPages(page, theme);
		});

		test("every docs page supports text resized to 200%", async ({ page }) => {
			await page.setViewportSize({ width: 1440, height: 900 });
			await auditAllPages(page, theme, async (currentPage) => {
				await currentPage.addStyleTag({
					content: "html { font-size: 200% !important; }",
				});
			});
		});

		test("every docs page tolerates WCAG text-spacing overrides", async ({
			page,
		}) => {
			await page.setViewportSize({ width: 1280, height: 720 });
			await auditAllPages(page, theme, async (currentPage) => {
				await currentPage.addStyleTag({ content: textSpacingCss });
				// Firefox reports geometry for descendants of a closed <details>
				// even though users cannot see them. Open disclosures so their
				// labels are genuinely exercised under the spacing override.
				await currentPage.locator("details").evaluateAll((elements) => {
					for (const element of elements) {
						if (element instanceof HTMLDetailsElement) element.open = true;
					}
				});
			});
		});

		test("open dialog and popover retain horizontal reflow", async ({
			page,
		}) => {
			const scenarios = [
				{
					name: "320px",
					viewport: { width: 320, height: 800 },
					prepare: async () => {},
				},
				{
					name: "200% text",
					viewport: { width: 1440, height: 900 },
					prepare: async () => {
						await page.addStyleTag({
							content: "html { font-size: 200% !important; }",
						});
					},
				},
				{
					name: "text spacing",
					viewport: { width: 1280, height: 720 },
					prepare: async () => {
						await page.addStyleTag({ content: textSpacingCss });
					},
				},
			];
			const surfaces = [
				{
					name: "dialog",
					target: "components/modal/index.html",
					selector: ".docs-demo-preview dialog",
					open: (/** @type {HTMLElement} */ element) => {
						if (!(element instanceof HTMLDialogElement)) {
							throw new Error("modal demo dialog not found");
						}
						if (element.open) element.close();
						element.showModal();
					},
				},
				{
					name: "popover",
					target: "components/popover/index.html",
					selector: ".docs-demo-preview [popover]",
					open: (/** @type {HTMLElement} */ element) => element.showPopover(),
				},
			];
			const failures = [];

			for (const scenario of scenarios) {
				await page.setViewportSize(scenario.viewport);
				for (const surface of surfaces) {
					await openPage(page, surface.target, theme);
					await scenario.prepare();
					const layer = page.locator(surface.selector);
					await layer.evaluate(surface.open);
					await expect(
						layer,
						`${surface.name} should open with ${scenario.name}`,
					).toBeVisible();
					const [pageMetrics, layerMetrics] = await Promise.all([
						measure(page),
						layer.evaluate((element) => {
							const rect = element.getBoundingClientRect();
							return {
								left: rect.left,
								right: rect.right,
								clientWidth: element.clientWidth,
								scrollWidth: element.scrollWidth,
							};
						}),
					]);
					if (
						pageMetrics.scrollWidth > pageMetrics.clientWidth + 1 ||
						pageMetrics.clippedText.length > 0 ||
						layerMetrics.left < -1 ||
						layerMetrics.right > pageMetrics.clientWidth + 1 ||
						layerMetrics.scrollWidth > layerMetrics.clientWidth + 1
					) {
						failures.push({
							scenario: scenario.name,
							surface: surface.name,
							pageMetrics,
							layerMetrics,
						});
					}
				}
			}

			expect(failures).toEqual([]);
		});

		test.describe("forced-colors: active", () => {
			test.use({ contextOptions: { forcedColors: "active" } });

			test("every docs page stays within the viewport", async ({ page }) => {
				expect(
					await page.evaluate(
						() => matchMedia("(forced-colors: active)").matches,
					),
				).toBe(true);
				await auditAllPages(page, theme);
			});

			test("focus, loading, dialog, and popover affordances remain visible", async ({
				page,
			}) => {
				await openPage(page, "forms/index.html", theme);
				const field = page.locator("input:not([type='hidden'])").first();
				await field.focus();
				const focus = await field.evaluate((element) => {
					const style = getComputedStyle(element);
					return {
						style: style.outlineStyle,
						width: Number.parseFloat(style.outlineWidth),
					};
				});
				expect(focus.style).not.toBe("none");
				expect(focus.width).toBeGreaterThan(0);

				await openPage(page, "index.html", theme);
				for (const target of [
					page.locator(".docs-case").first(),
					page.locator(".docs-faq-list summary").first(),
				]) {
					await page.keyboard.press("Tab");
					await target.focus();
					expect(
						await target.evaluate((element) =>
							element.matches(":focus-visible"),
						),
					).toBe(true);
					const targetFocus = await target.evaluate((element) => {
						const style = getComputedStyle(element);
						return {
							style: style.outlineStyle,
							width: Number.parseFloat(style.outlineWidth),
						};
					});
					expect(targetFocus.style).not.toBe("none");
					expect(targetFocus.width).toBeGreaterThan(0);
				}

				await openPage(page, "components/loading/index.html", theme);
				const spinnerColor = await page
					.locator(".docs-demo-preview [aria-busy='true']")
					.first()
					.evaluate(
						(element) => getComputedStyle(element, "::before").backgroundColor,
					);
				expect(spinnerColor).not.toBe("rgba(0, 0, 0, 0)");

				await openPage(page, "components/modal/index.html", theme);
				const dialog = page.locator(".docs-demo-preview dialog");
				await dialog.evaluate((element) => {
					if (!(element instanceof HTMLDialogElement)) {
						throw new Error("modal demo dialog not found");
					}
					if (element.open) element.close();
					element.showModal();
				});
				await expect(
					page.getByRole("dialog", { name: "Confirm action" }),
				).toBeVisible();

				await dialog.evaluate((element) => {
					if (element instanceof HTMLDialogElement) element.close();
				});
				await openPage(page, "components/popover/index.html", theme);
				const popover = page.locator(".docs-demo-preview [popover]");
				await popover.evaluate((element) => {
					if (!(element instanceof HTMLElement)) {
						throw new Error("popover demo not found");
					}
					element.showPopover();
				});
				await expect(popover).toBeVisible();
				expect(
					await popover.evaluate(
						(element) => getComputedStyle(element).borderStyle,
					),
				).not.toBe("none");
			});
		});
	});
}
