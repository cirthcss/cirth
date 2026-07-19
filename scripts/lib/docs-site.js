const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

// Shared access to the built docs site (docs/.vitepress/dist) for the
// checks that audit it (check-a11y.js, tests/visual.spec.js): page
// enumeration and a dependency-free static server. VitePress builds
// with cleanUrls, so extensionless requests fall back to `<path>.html`.

const projectRoot = path.join(__dirname, "../..");
const docsDist = path.join(projectRoot, "docs/.vitepress/dist");

const assertDocsBuilt = (label) => {
	if (!fs.existsSync(path.join(docsDist, "index.html"))) {
		throw new Error(
			`${label}: built docs not found — run \`npm run docs:build\` first.`,
		);
	}
};

const listPages = (dir = docsDist, prefix = "") => {
	const pages = [];
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const relative = path.posix.join(prefix, entry.name);
		if (entry.isDirectory()) {
			if (entry.name !== "assets") {
				pages.push(...listPages(path.join(dir, entry.name), relative));
			}
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
			new URL(request.url, "http://localhost").pathname,
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
const startServer = async (server) => {
	await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
	return `http://127.0.0.1:${server.address().port}`;
};

module.exports = { assertDocsBuilt, createServer, docsDist, listPages, startServer };
