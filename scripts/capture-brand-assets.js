const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require("playwright");
const { createServer, startServer } = require("./lib/docs-site");
const { iconSource, icons } = require("./build-brand");

const projectRoot = path.join(__dirname, "..");
const captures = [
	{ page: "social-preview", file: "social-preview.png", width: 1200, height: 630 },
	{ page: "readme-preview-light", file: "readme-native-baseline.png", width: 960, height: 240 },
	{ page: "readme-preview-dark", file: "readme-native-baseline-dark.png", width: 960, height: 240 },
];

// Every capture below freezes animations. The homepage writes its source
// panel in with a CSS wipe, so a capture taken on `networkidle` lands on
// whatever frame the wipe had reached, which made these review assets
// differ on every run, and churn a tracked file for no reason. `animations:
// "disabled"` finishes the animation and holds it there, the same thing
// tests/visual.spec.js does for the same reason.

// The lockup ships as vector; these are the raster fallbacks for the
// places that cannot take an SVG (slides, print, some package registries).
// Rendered from the generated SVG itself rather than re-laid-out here, so
// the two can never disagree, and at 4x so the raster survives a retina
// README.
const lockupCaptures = [
	{ source: "wordmark.svg", file: "wordmark.png" },
	{ source: "wordmark_dark.svg", file: "wordmark_dark.png" },
];

// The mark's raster, at 1024px, rendered from the generated SVG for the
// same reason as the lockups: a PNG exported by hand falls behind its SVG
// without anything noticing.
const logoCaptures = ["logo_brand"];

// An .ico file of PNG images, the form every browser that reads .ico
// accepts: a six-byte header, a sixteen-byte entry per image, the images.
/** @param {Array<{ size: number, png: Buffer }>} images */
const ico = (images) => {
	const header = Buffer.alloc(6);
	header.writeUInt16LE(1, 2);
	header.writeUInt16LE(images.length, 4);
	let offset = header.length + 16 * images.length;
	const entries = images.map(({ size, png }) => {
		const entry = Buffer.alloc(16);
		entry.writeUInt8(size >= 256 ? 0 : size, 0);
		entry.writeUInt8(size >= 256 ? 0 : size, 1);
		entry.writeUInt16LE(1, 4);
		entry.writeUInt16LE(32, 6);
		entry.writeUInt32LE(png.length, 8);
		entry.writeUInt32LE(offset, 12);
		offset += png.length;
		return entry;
	});
	return Buffer.concat([header, ...entries, ...images.map(({ png }) => png)]);
};

// The set a brand reviewer needs, rendered from the site rather than mocked
// up beside it. The two specimen captures are the application screen: the
// 324deg accent on small surfaces, dark surfaces on the 132deg neutrals, and a
// primary sitting next to a destructive action: the adjacency the palette was
// hardest to settle.
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

		for (const name of logoCaptures) {
			const page = await browser.newPage({
				viewport: { width: 512, height: 512 },
				deviceScaleFactor: 2,
			});
			await page.goto(pathToFileURL(path.join(projectRoot, "docs/public", `${name}.svg`)).href, {
				waitUntil: "load",
			});
			await page.screenshot({
				animations: "disabled",
				path: path.join(projectRoot, "docs/public", `${name}.png`),
				omitBackground: true,
			});
			await page.close();
		}

		// Each icon at each of its sizes, rendered from its SVG at that size
		// rather than scaled from a larger raster. Those on the paper canvas
		// are opaque; the others keep a transparent ground.
		for (const icon of icons) {
			/** @type {Array<{ size: number, png: Buffer }>} */
			const images = [];
			for (const size of icon.sizes) {
				const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
				const source = Buffer.from(iconSource(icon, size)).toString("base64");
				await page.setContent(
					`<!doctype html><style>html,body{margin:0;background:transparent}img{display:block}</style><img src="data:image/svg+xml;base64,${source}" width="${size}" height="${size}" alt="">`,
				);
				await page.locator("img").evaluate((img) => /** @type {HTMLImageElement} */ (img).decode());
				images.push({ size, png: await page.screenshot({ animations: "disabled", omitBackground: !icon.ground }) });
				await page.close();
			}
			const target = path.join(projectRoot, "docs/public", icon.file);
			fs.writeFileSync(target, icon.file.endsWith(".ico") ? ico(images) : images[0].png);
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
