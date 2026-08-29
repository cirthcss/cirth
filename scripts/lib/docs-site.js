const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { listPresetNames } = require("./presets");

// Shared access to the built docs site (docs/dist) for the checks that
// audit it (check-a11y.js, tests/visual.spec.js): page enumeration and a
// dependency-free static server. Eleventy emits one `<path>/index.html`
// per page, so extensionless requests resolve the same way a real static
// host would.

const projectRoot = path.join(__dirname, "../..");
const docsDist = path.join(projectRoot, "docs/dist");

const themeVariants = [
	{ name: "default", storageValue: "amber" },
	...listPresetNames().map((name) => ({ name, storageValue: name })),
];

/** @param {string} label */
const assertDocsBuilt = (label) => {
	if (!fs.existsSync(path.join(docsDist, "index.html"))) {
		throw new Error(
			`${label}: built docs not found — run \`npm run docs:build\` first.`,
		);
	}
};

// Archived documentation lines (docs/versions/, copied into the output at
// build time) are frozen sites, not part of this one: auditing them would
// re-audit whatever the toolchain thought a year ago, and any finding
// would be unfixable by definition. The /next/ preview is excluded for the
// opposite reason — it is this site, built twice.
// Share-card/icon routes are deterministic rasterization sources, not
// navigable documentation. The lab routes are isolated iframe targets and
// intentionally omit the docs preset controls that generic page audits wait
// for; their real form markup and builds are covered by the home comparison
// and the underlying component suites.
const excludedTopLevel =
	/^(v\d+\.\d+|next|lab|social-preview|readme-preview-light|readme-preview-dark|favicon-preview)$/;

/**
 * @param {string} [dir]
 * @param {string} [prefix]
 * @returns {string[]}
 */
const listPages = (dir = docsDist, prefix = "") => {
	const pages = [];
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const relative = path.posix.join(prefix, entry.name);
		if (entry.isDirectory()) {
			if (prefix === "" && excludedTopLevel.test(entry.name)) {
				continue;
			}

			pages.push(...listPages(path.join(dir, entry.name), relative));
		} else if (
			entry.name.endsWith(".html") &&
			// Skip macOS/iCloud "name 2.html" duplicates that can appear in
			// local gitignored build output.
			!/ \d+\.html$/.test(entry.name)
		) {
			pages.push(relative);
		}
	}
	return pages.sort();
};

/** @type {Record<string, string>} */
const contentTypes = {
	".html": "text/html; charset=utf-8",
	".css": "text/css",
	".js": "text/javascript",
	".json": "application/json",
	".svg": "image/svg+xml",
	".png": "image/png",
	".jpg": "image/jpeg",
	".webp": "image/webp",
	".ico": "image/x-icon",
	".woff": "font/woff",
	".woff2": "font/woff2",
};

const createServer = () =>
	http.createServer((request, response) => {
		const pathname = decodeURIComponent(
			new URL(request.url ?? "/", "http://localhost").pathname,
		);
		let filePath = path.join(docsDist, pathname);

		if (!filePath.startsWith(docsDist)) {
			response.writeHead(403).end();
			return;
		}
		if (pathname.endsWith("/")) {
			filePath = path.join(filePath, "index.html");
		} else if (!path.extname(filePath) && fs.existsSync(`${filePath}.html`)) {
			filePath = `${filePath}.html`;
		}

		if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
			response.writeHead(404).end("Not found");
			return;
		}

		response.writeHead(200, {
			"content-type":
				contentTypes[path.extname(filePath)] ?? "application/octet-stream",
		});
		fs.createReadStream(filePath).pipe(response);
	});

// Listens on an ephemeral port; resolves to the origin URL.
/** @param {import("node:http").Server} server */
const startServer = async (server) => {
	await new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(undefined)));
	const address = /** @type {import("node:net").AddressInfo} */ (server.address());
	return `http://127.0.0.1:${address.port}`;
};

/**
 * Configure the docs' real preset loader before the first page script runs.
 * BrowserContext and Page both expose addInitScript(), so this works for the
 * standalone axe runner as well as Playwright fixtures.
 *
 * @param {{ addInitScript: Function }} target
 * @param {(typeof themeVariants)[number]} theme
 */
const installTheme = (target, theme) =>
	target.addInitScript((/** @type {string} */ storageValue) => {
		sessionStorage.setItem("cirth-preset", storageValue);
	}, theme.storageValue);

/**
 * Wait until the switcher reflects the requested theme and, for a preset,
 * its dynamically inserted stylesheet has finished loading.
 *
 * @param {import("playwright").Page} page
 * @param {(typeof themeVariants)[number]} theme
 */
const waitForTheme = (page, theme) =>
	page.waitForFunction(
		({ name, storageValue }) => {
			const select = document.querySelector("[data-cirth-preset-select]");
			const link = document.getElementById("cirth-preset-stylesheet");
			if (!(select instanceof HTMLSelectElement)) return false;
			if (select.value !== storageValue) return false;
			if (name === "default") return link === null;
			return (
				link instanceof HTMLLinkElement &&
				link.href.endsWith(`/styles/generated/presets/${name}.css`) &&
				Boolean(link.sheet)
			);
		},
		{ name: theme.name, storageValue: theme.storageValue },
	);

module.exports = {
	assertDocsBuilt,
	createServer,
	docsDist,
	installTheme,
	listPages,
	startServer,
	themeVariants,
	waitForTheme,
};
