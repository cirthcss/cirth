const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
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

// --- An immutable copy of the build, for the tools that measure it -----
//
// `docs/dist` is a build output, not an input: `npm run docs:build` can
// replace any file in it at any moment, and eleventy's passthrough copy
// *replaces* rather than edits, so there is a window in which
// styles/style.css does not exist at all. A run that reads the directory
// directly can therefore fail — or, worse, measure two different builds
// and report the difference as a finding.
//
// The audit and the fingerprint take minutes to hours; a build takes
// seconds. Rather than lock the build out for the length of a run, they
// copy the tree once, up front, and serve the copy. 8 MB and ~300 files:
// the copy costs well under a second, and after it nothing the run reads
// can change.
//
// The copy itself is the one window left, so it is verified rather than
// assumed: the directory is inventoried before and after, and a tree that
// moved underneath the copy is discarded and re-copied instead of served.

/**
 * Every file under `dir`, with its size and mtime, as one comparable
 * string. Cheap enough (~300 stats) to run twice per snapshot.
 *
 * @param {string} dir
 * @param {string} [prefix]
 * @returns {string[]}
 */
const inventory = (dir, prefix = "") => {
	/** @type {string[]} */
	const entries = [];
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const relative = path.posix.join(prefix, entry.name);
		if (entry.isDirectory()) {
			entries.push(...inventory(path.join(dir, entry.name), relative));
		} else {
			const stats = fs.statSync(path.join(dir, entry.name));
			entries.push(`${relative}:${stats.size}:${stats.mtimeMs}`);
		}
	}
	return entries.sort();
};

/** @type {Set<string>} */
const snapshots = new Set();
let cleanupInstalled = false;

/** @param {string} root */
const discard = (root) => {
	snapshots.delete(root);
	fs.rmSync(root, { force: true, recursive: true });
};

// Whatever ends the process — a thrown error, Ctrl-C, a normal exit — the
// copy goes with it. `exit` cannot await, so the removal is synchronous.
const installCleanup = () => {
	if (cleanupInstalled) return;
	cleanupInstalled = true;
	process.on("exit", () => {
		for (const root of [...snapshots]) discard(root);
	});
	for (const signal of /** @type {const} */ (["SIGINT", "SIGTERM"])) {
		process.on(signal, () => {
			for (const root of [...snapshots]) discard(root);
			process.exit(130);
		});
	}
};

/**
 * Copy the built docs into a temporary directory and hand back its path.
 * The caller serves and measures that copy, and disposes of it when the
 * run ends; `dispose` is idempotent, so a `finally` and the exit handler
 * can both call it.
 *
 * `source` defaults to docs/dist and is a parameter so the isolation can
 * be proved against a tree a test owns — see check-audit-snapshot.js.
 *
 * @param {{ attempts?: number, label: string, source?: string }} options
 * @returns {{ dispose: () => void, root: string }}
 */
const snapshotDocs = ({ attempts = 3, label, source = docsDist }) => {
	if (source === docsDist) assertDocsBuilt(label);
	installCleanup();

	for (let attempt = 1; attempt <= attempts; attempt += 1) {
		const before = inventory(source).join("\n");
		const root = fs.mkdtempSync(path.join(os.tmpdir(), "cirth-docs-"));
		snapshots.add(root);
		fs.cpSync(source, root, { recursive: true });

		// Torn copy, or a build that landed mid-copy: throw it away and take
		// another one rather than measure half of each build.
		if (inventory(source).join("\n") === before) {
			// A build in flight is the reason this exists, so the copy is
			// checked for the two files every consumer needs before it is
			// declared usable.
			for (const required of ["index.html", "styles/style.css"]) {
				const file = path.join(root, required);
				if (!fs.existsSync(file) || fs.statSync(file).size === 0) {
					throw new Error(
						`${label}: ${path.relative(projectRoot, source)} is missing or ` +
							`empty at ${required} — run \`npm run docs:build\`.`,
					);
				}
			}
			return { dispose: () => discard(root), root };
		}

		discard(root);
	}

	throw new Error(
		`${label}: ${path.relative(projectRoot, source)} kept changing while it ` +
			`was being copied (${attempts} attempts). Is a docs build running?`,
	);
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
	/^(v\d+\.\d+|next|lab|specimen|social-preview|readme-preview-light|readme-preview-dark|favicon-preview)$/;

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
	".wasm": "application/wasm",
	".svg": "image/svg+xml",
	".png": "image/png",
	".jpg": "image/jpeg",
	".webp": "image/webp",
	".ico": "image/x-icon",
	".woff": "font/woff",
	".woff2": "font/woff2",
};

/**
 * Serve a built docs tree. Defaults to `docs/dist`; the audit and the
 * fingerprint pass a snapshot of it instead — see `snapshotDocs`.
 *
 * @param {string} [root]
 */
const createServer = (root = docsDist) =>
	http.createServer((request, response) => {
		const pathname = decodeURIComponent(
			new URL(request.url ?? "/", "http://localhost").pathname,
		);
		let filePath = path.join(root, pathname);

		if (!filePath.startsWith(root)) {
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
	snapshotDocs,
	startServer,
	themeVariants,
	waitForTheme,
};
