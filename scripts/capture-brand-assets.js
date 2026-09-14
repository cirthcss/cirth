const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require("playwright");
const { createServer, startServer } = require("./lib/docs-site");

const projectRoot = path.join(__dirname, "..");
const captures = [
	{ page: "social-preview", file: "social-preview.png", width: 1200, height: 630 },
	{ page: "readme-preview-light", file: "readme-native-baseline.png", width: 960, height: 240 },
	{ page: "readme-preview-dark", file: "readme-native-baseline-dark.png", width: 960, height: 240 },
	{ page: "favicon-preview", file: "apple-touch-icon.png", width: 180, height: 180 },
];

// Every capture below freezes animations. The homepage writes its source
// panel in with a CSS wipe, so a capture taken on `networkidle` lands on
// whatever frame the wipe had reached — which made these review assets
// differ on every run, and churn a tracked file for no reason. `animations:
// "disabled"` finishes the animation and holds it there, the same thing
// tests/visual.spec.js does for the same reason.

// The lockup ships as vector; these are the raster fallbacks for the
// places that cannot take an SVG (slides, print, some package registries).
// Rendered from the generated SVG itself rather than re-laid-out here, so
// the two can never disagree, and at 4x so the raster survives a retina
// README. The mono variant is deliberately vector-only: it paints with
// `currentColor`, which a raster cannot carry.
const lockupCaptures = [
	{ source: "wordmark.svg", file: "wordmark.png" },
	{ source: "wordmark_dark.svg", file: "wordmark_dark.png" },
];

// The set a brand reviewer needs, rendered from the site rather than mocked
// up beside it. The two specimen captures are the application screen: copper
// on small surfaces, graphite dark surfaces, and a primary sitting next to a
// destructive action — the adjacency the palette was hardest to settle.
/** @type {Array<{file: string, width: number, height: number, theme: "light" | "dark", path?: string}>} */
const reviewCaptures = [
	{ file: "home-desktop-light.png", width: 1440, height: 900, theme: "light" },
	{ file: "home-desktop-dark.png", width: 1440, height: 900, theme: "dark" },
	{ file: "home-mobile-light.png", width: 390, height: 844, theme: "light" },
	{ file: "home-mobile-dark-320.png", width: 320, height: 780, theme: "dark" },
	{
		file: "specimen-default-light.png",
		width: 1440,
		height: 900,
		theme: "light",
		path: "/specimen/default/",
	},
	{
		file: "specimen-default-dark.png",
		width: 1440,
		height: 900,
		theme: "dark",
		path: "/specimen/default/",
	},
];

(async () => {
	const browser = await chromium.launch({ headless: true });
	try {
		for (const capture of captures) {
			const page = await browser.newPage({
				viewport: { width: capture.width, height: capture.height },
				deviceScaleFactor: 1,
			});
			const input = path.join(projectRoot, "docs/dist", capture.page, "index.html");
			await page.goto(pathToFileURL(input).href, { waitUntil: "load" });
			await page.screenshot({
				animations: "disabled",
				path: path.join(projectRoot, "docs/public", capture.file),
			});
			await page.close();
		}

		for (const capture of lockupCaptures) {
			const source = path.join(projectRoot, "docs/public", capture.source);
			const svg = fs.readFileSync(source, "utf8");
			const box = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
			if (!box) {
				throw new Error(`capture-brand-assets: no viewBox in ${capture.source}`);
			}
			const page = await browser.newPage({
				viewport: {
					width: Math.ceil(Number(box[1])),
					height: Math.ceil(Number(box[2])),
				},
				deviceScaleFactor: 4,
			});
			await page.goto(pathToFileURL(source).href, { waitUntil: "load" });
			await page.screenshot({
				animations: "disabled",
				path: path.join(projectRoot, "docs/public", capture.file),
				omitBackground: true,
			});
			await page.close();
		}

		const screenshotFolder = path.join(
			projectRoot,
			"docs/screenshots/native-baseline",
		);
		fs.mkdirSync(screenshotFolder, { recursive: true });
		const server = createServer();
		const origin = await startServer(server);
		try {
			for (const capture of reviewCaptures) {
				const page = await browser.newPage({
					viewport: { width: capture.width, height: capture.height },
					colorScheme: capture.theme,
				});
				await page.addInitScript((theme) => {
					localStorage.setItem("cirth-theme", theme);
				}, capture.theme);
				await page.goto(`${origin}${capture.path ?? "/"}`, {
					waitUntil: "networkidle",
				});
				await page.screenshot({
					animations: "disabled",
					path: path.join(screenshotFolder, capture.file),
				});
				await page.close();
			}
		} finally {
			server.close();
		}
	} finally {
		await browser.close();
	}
	console.log("[cirth] responsive brand assets captured");
})().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
