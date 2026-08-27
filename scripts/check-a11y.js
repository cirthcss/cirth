const fs = require("node:fs");
const path = require("node:path");
const { AxeBuilder } = require("@axe-core/playwright");
const { chromium } = require("playwright");
const {
	assertDocsBuilt,
	createServer,
	installTheme,
	listPages,
	startServer,
	themeVariants,
	waitForTheme,
} = require("./lib/docs-site");

// Axe (WCAG 2.0–2.2 A/AA rules) over every page of the built docs site, in
// every shipped theme, both color schemes, and forced-colors mode, so the
// "AA — verified in the source" claim stays continuously verified. Dialog
// and popover examples are also audited while open: axe otherwise skips
// their hidden content.
// Fails only on violations not present in the committed baseline
// (scripts/a11y-baseline.json); run with --update-baseline after
// deliberately accepting or fixing entries.
//
// Requires `npm run docs:build` first and a Playwright Chromium
// (`npx playwright install chromium`).

const baselinePath = path.join(__dirname, "a11y-baseline.json");
const updateBaseline = process.argv.includes("--update-baseline");

/**
 * @typedef {{
 *   page: string,
 *   theme: "default" | "plain" | "playroom",
 *   mode: "light" | "dark" | "forced-colors",
 *   state: "default" | "dialog-open" | "popover-open",
 *   violation: import("axe-core").Result,
 * }} Finding
 */

const wcagTags = [
	"wcag2a",
	"wcag2aa",
	"wcag21a",
	"wcag21aa",
	"wcag22aa",
];
/**
 * @type {{
 *   name: Finding["mode"],
 *   options: import("playwright").BrowserContextOptions,
 * }[]}
 */
const modes = [
	{ name: "light", options: { colorScheme: "light" } },
	{ name: "dark", options: { colorScheme: "dark" } },
	{
		name: "forced-colors",
		options: { colorScheme: "light", forcedColors: "active" },
	},
];
/**
 * @type {{
 *   page: string,
 *   state: Finding["state"],
 *   prepare: (page: import("playwright").Page) => Promise<void>,
 * }[]}
 */
const openStates = [
	{
		page: "components/modal/index.html",
		state: "dialog-open",
		prepare: async (page) => {
			await page.locator(".docs-demo-preview dialog").evaluate((dialog) => {
				if (!(dialog instanceof HTMLDialogElement)) {
					throw new Error("modal demo dialog not found");
				}
				if (dialog.open) dialog.close();
				dialog.showModal();
			});
		},
	},
	{
		page: "components/popover/index.html",
		state: "popover-open",
		prepare: async (page) => {
			const popover = page.locator(".docs-demo-preview [popover]");
			await popover.evaluate((popover) => {
				if (!(popover instanceof HTMLElement)) {
					throw new Error("popover demo not found");
				}
				popover.showPopover();
			});
			await page.waitForFunction(() => {
				const element = document.querySelector(".docs-demo-preview [popover]");
				return element && getComputedStyle(element).opacity === "1";
			});
		},
	},
];
const viewport = { width: 1440, height: 900 };
const concurrency = 4;

try {
	assertDocsBuilt("check-a11y");
} catch (error) {
	console.error(/** @type {Error} */ (error).message);
	process.exit(1);
}

const pages = listPages();
const server = createServer();

// --- Audit -----------------------------------------------------------

const baseline = fs.existsSync(baselinePath)
	? new Set(JSON.parse(fs.readFileSync(baselinePath, "utf8")))
	: new Set();

/**
 * @param {import("playwright").Page} page
 * @param {Finding["mode"]} mode
 */
const analyze = (page, mode) => {
	const builder = new AxeBuilder({ page }).withTags(wcagTags);
	// In forced-colors mode the operating system replaces author foregrounds
	// and backgrounds. Chromium exposes the resulting Canvas/CanvasText colors
	// correctly, but axe 4.12 still evaluates some data-theme and <kbd> pairs
	// from their authored colors and reports false positives. Contrast is
	// therefore left to the platform in this one mode; the dedicated
	// Playwright checks below this gate verify focus, spinner, borders, open
	// surfaces, and reflow under the actual emulation.
	if (mode === "forced-colors") {
		builder.disableRules(["color-contrast"]);
	}
	return builder.analyze();
};

/**
 * @param {import("playwright").Page} page
 * @param {string} target
 * @param {(typeof themeVariants)[number]} theme
 * @param {Finding["mode"]} mode
 * @param {Finding["state"]} state
 * @param {Finding[]} found
 */
const audit = async (page, target, theme, mode, state, found) => {
	await page.goto(target, { waitUntil: "load" });
	await waitForTheme(page, theme);
	const results = await analyze(page, mode);
	for (const violation of results.violations) {
		found.push({
			page: new URL(target).pathname.slice(1),
			theme: /** @type {Finding["theme"]} */ (theme.name),
			mode,
			state,
			violation,
		});
	}
};

const run = async () => {
	const origin = await startServer(server);

	const browser = await chromium.launch();
	/** @type {Finding[]} */
	const found = [];

	for (const theme of themeVariants) {
		for (const mode of modes) {
			const context = await browser.newContext({
				...mode.options,
				// Freeze the docs' animations (hero typing demo) so axe audits a
				// stable page.
				reducedMotion: "reduce",
				viewport,
			});
			await installTheme(context, theme);

			const queue = [...pages];
			const worker = async () => {
				const page = await context.newPage();
				for (let target = queue.shift(); target; target = queue.shift()) {
					await audit(
						page,
						`${origin}/${target}`,
						theme,
						/** @type {Finding["mode"]} */ (mode.name),
						"default",
						found,
					);
				}
				await page.close();
			};
			await Promise.all(
				Array.from({ length: concurrency }, worker),
			);

			const statePage = await context.newPage();
			for (const openState of openStates) {
				const target = `${origin}/${openState.page}`;
				await statePage.goto(target, { waitUntil: "load" });
				await waitForTheme(statePage, theme);
				await openState.prepare(statePage);
				const results = await analyze(
					statePage,
					/** @type {Finding["mode"]} */ (mode.name),
				);
				for (const violation of results.violations) {
					found.push({
						page: openState.page,
						theme: /** @type {Finding["theme"]} */ (theme.name),
						mode: /** @type {Finding["mode"]} */ (mode.name),
						state: /** @type {Finding["state"]} */ (openState.state),
						violation,
					});
				}
			}
			await statePage.close();
			await context.close();
		}
	}

	await browser.close();
	server.close();
	return found;
};

run()
	.then((found) => {
		/** @param {Finding} finding */
		const keyOf = ({ page, theme, mode, state, violation }) =>
			`${page} [${mode}${theme === "default" ? "" : `; ${theme}`}${state === "default" ? "" : `; ${state}`}] ${violation.id}`;
		const foundKeys = new Set(found.map(keyOf));
		const fresh = found.filter((entry) => !baseline.has(keyOf(entry)));
		const stale = [...baseline].filter((key) => !foundKeys.has(key)).sort();

		if (updateBaseline) {
			const keys = [...foundKeys].sort();
			fs.writeFileSync(baselinePath, `${JSON.stringify(keys, null, "\t")}\n`);
			console.log(
				`check-a11y: baseline updated with ${keys.length} entr(y/ies).`,
			);
			return;
		}

		for (const { page, theme, mode, state, violation } of fresh) {
			console.error(
				`✗ ${page} [${mode}${theme === "default" ? "" : `; ${theme}`}` +
					`${state === "default" ? "" : `; ${state}`}] ` +
					`${violation.id} (${violation.impact}): ` +
					`${violation.help}`,
			);
			for (const node of violation.nodes.slice(0, 5)) {
				console.error(`    ${node.target.join(" ")}`);
			}
			console.error(`    ${violation.helpUrl}`);
		}

		if (stale.length > 0) {
			console.log(
				`check-a11y: ${stale.length} baseline entr(y/ies) no longer ` +
					`occur — run with --update-baseline to prune:`,
			);
			for (const key of stale) {
				console.log(`  ${key}`);
			}
		}

		if (fresh.length > 0) {
			console.error(
				`\ncheck-a11y: ${fresh.length} new WCAG 2.0–2.2 A/AA ` +
					`violation(s) across ${pages.length} pages × ${themeVariants.length} ` +
					`themes × ${modes.length} modes plus ${openStates.length} open states ` +
					`per theme/mode. Fix them or, ` +
					`if accepted deliberately, run ` +
					`\`node scripts/check-a11y.js --update-baseline\`.`,
			);
			process.exit(1);
		}

		console.log(
			`✓ check-a11y: no new WCAG 2.0–2.2 A/AA violations across ` +
				`${pages.length} pages × ${themeVariants.length} themes × ` +
				`${modes.length} modes plus ${openStates.length} open states per ` +
				`theme/mode` +
				(baseline.size > 0 ? ` (${baseline.size} baselined)` : "") +
				".",
		);
	})
	.catch((error) => {
		console.error(`check-a11y: ${error.stack ?? error}`);
		process.exit(1);
	});
