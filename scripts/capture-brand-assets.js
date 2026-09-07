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

/** @type {Array<{file: string, width: number, height: number, theme: "light" | "dark"}>} */
const reviewCaptures = [
	{ file: "home-desktop-light.png", width: 1440, height: 900, theme: "light" },
	{ file: "home-desktop-dark.png", width: 1440, height: 900, theme: "dark" },
	{ file: "home-mobile-light.png", width: 390, height: 844, theme: "light" },
	{ file: "home-mobile-dark-320.png", width: 320, height: 780, theme: "dark" },
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
				path: path.join(projectRoot, "docs/public", capture.file),
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
				await page.goto(origin, { waitUntil: "networkidle" });
				await page.screenshot({
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
