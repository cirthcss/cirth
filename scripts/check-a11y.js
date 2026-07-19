const fs = require("node:fs");
const path = require("node:path");
const { AxeBuilder } = require("@axe-core/playwright");
const { chromium } = require("playwright");
const {
	assertDocsBuilt,
	createServer,
	listPages,
	startServer,
} = require("./lib/docs-site");

// Axe (WCAG 2.x A/AA rules) over every page of the built docs site, in
// both color schemes, so the "AA — verified in the source" claim stays
// continuously verified. Fails only on violations not present in the
// committed baseline (scripts/a11y-baseline.json); run with
// --update-baseline after deliberately accepting or fixing entries.
//
// Requires `npm run docs:build` first and a Playwright Chromium
// (`npx playwright install chromium`).

const baselinePath = path.join(__dirname, "a11y-baseline.json");
const updateBaseline = process.argv.includes("--update-baseline");

const wcagTags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];
const schemes = ["light", "dark"];
const viewport = { width: 1440, height: 900 };
const concurrency = 4;

try {
	assertDocsBuilt("check-a11y");
} catch (error) {
	console.error(error.message);
	process.exit(1);
}

const pages = listPages();
const server = createServer();

// --- Audit -----------------------------------------------------------

const baseline = fs.existsSync(baselinePath)
	? new Set(JSON.parse(fs.readFileSync(baselinePath, "utf8")))
	: new Set();

const run = async () => {
	const origin = await startServer(server);

	const browser = await chromium.launch();
	const found = [];

	for (const scheme of schemes) {
		const context = await browser.newContext({
			colorScheme: scheme,
			// Freeze the docs' animations (hero typing demo) so axe audits a
			// stable page.
			reducedMotion: "reduce",
			viewport,
		});

		const queue = [...pages];
		const worker = async () => {
			const page = await context.newPage();
			for (let target = queue.shift(); target; target = queue.shift()) {
				await page.goto(`${origin}/${target}`, { waitUntil: "load" });
				const results = await new AxeBuilder({ page })
					.withTags(wcagTags)
					.analyze();
				for (const violation of results.violations) {
					found.push({ page: target, scheme, violation });
				}
			}
			await page.close();
		};
		await Promise.all(
			Array.from({ length: concurrency }, worker),
		);
		await context.close();
	}

	await browser.close();
	server.close();
	return found;
};

run()
	.then((found) => {
		const keyOf = ({ page, scheme, violation }) =>
			`${page} [${scheme}] ${violation.id}`;
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

		for (const { page, scheme, violation } of fresh) {
			console.error(
				`✗ ${page} [${scheme}] ${violation.id} (${violation.impact}): ` +
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
				`\ncheck-a11y: ${fresh.length} new WCAG A/AA violation(s) across ` +
					`${pages.length} pages × ${schemes.length} schemes. Fix them or, ` +
					`if accepted deliberately, run ` +
					`\`node scripts/check-a11y.js --update-baseline\`.`,
			);
			process.exit(1);
		}

		console.log(
			`✓ check-a11y: no new WCAG A/AA violations across ${pages.length} ` +
				`pages × ${schemes.length} color schemes` +
				(baseline.size > 0 ? ` (${baseline.size} baselined)` : "") +
				".",
		);
	})
	.catch((error) => {
		console.error(`check-a11y: ${error.stack ?? error}`);
		process.exit(1);
	});
