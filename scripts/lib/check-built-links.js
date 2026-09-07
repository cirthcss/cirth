const fs = require("node:fs");
const path = require("node:path");

// The built half of the documentation link check (scripts/check-doc-links.js).
//
// Checks A and B in that file read hand-written Markdown, so they never see
// an href a template produced: the site header, the footer, the sidebar, the
// page outline, the home page's own cards. The three broken links this site
// shipped were all of that kind, and all of them were found by hand.
//
// Four questions, asked of the output an actual reader gets:
//
//   /foo/          does that page exist?
//   ../bar/        does it exist, resolved from the page the link is on?
//   /foo/#bar      does the page exist, and does it contain id="bar"?
//   #section       does this page contain id="section"?
//
// Not a crawler: nothing leaves the filesystem, and an http(s) link is
// somebody else's uptime. The requirement is narrower and absolute — the
// documentation must not be able to build with an internal 404 or with a
// fragment that points at nothing.

// Archived documentation lines are frozen copies of an older site: their
// links were correct when they were published, and a finding in one is
// unfixable by definition. /next/ is this same site built twice.
const excludedRoute = /^\/(?:v\d+\.\d+|next)(?:\/|$)/;

const idPattern = /\sid\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;
const anchorPattern = /<(?:a|area)\b[^>]*?\shref\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;

/** @param {string} folder @returns {string[]} */
const listHtml = (folder) =>
	fs.existsSync(folder)
		? fs
				.readdirSync(folder, { withFileTypes: true })
				.flatMap((entry) => {
					const full = path.join(folder, entry.name);
					if (entry.isDirectory()) return listHtml(full);
					// Skip the "name 2.html" duplicates macOS/iCloud can leave in
					// a local, gitignored build directory.
					return entry.name.endsWith(".html") && !/ \d+\.html$/.test(entry.name)
						? [full]
						: [];
				})
				.sort()
		: [];

/** @param {string} folder @returns {string[]} */
const listAll = (folder) =>
	fs.existsSync(folder)
		? fs.readdirSync(folder, { withFileTypes: true }).flatMap((entry) => {
				const full = path.join(folder, entry.name);
				return entry.isDirectory() ? listAll(full) : [full];
			})
		: [];

/** @param {string} value */
const decodeEntities = (value) =>
	value
		.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&amp;/g, "&");

/**
 * @param {string} source
 * @param {number} index
 */
const lineAt = (source, index) => source.slice(0, index).split("\n").length;

/**
 * A route as a reader would type it. Eleventy writes <path>/index.html, and
 * a static host serves that for /path/ and for /path alike, so all three
 * spellings name the same page and all three have to resolve.
 *
 * @param {string} root
 * @param {string} file
 */
const routesFor = (root, file) => {
	const url = `/${path.relative(root, file).split(path.sep).join("/")}`;
	if (!url.endsWith("/index.html")) return [url];
	const directory = url.slice(0, -"index.html".length);
	return directory === "/"
		? ["/", url]
		: [directory, directory.slice(0, -1), url];
};

/**
 * @param {{ root: string, reportRoot?: string }} options
 * @returns {{ checked: number, pages: number, violations: string[] }}
 */
const checkBuiltLinks = ({ root, reportRoot = root }) => {
	/** @type {string[]} */
	const violations = [];
	const htmlFiles = listHtml(root);

	if (htmlFiles.length === 0) {
		return { checked: 0, pages: 0, violations };
	}

	/** @type {Map<string, Set<string>>} */
	const idsByRoute = new Map();
	for (const file of htmlFiles) {
		/** @type {Set<string>} */
		const ids = new Set();
		const source = fs.readFileSync(file, "utf8");
		for (const match of source.matchAll(idPattern)) {
			const id = decodeEntities(match[1] ?? match[2] ?? match[3] ?? "");
			if (id) ids.add(id);
		}
		for (const route of routesFor(root, file)) idsByRoute.set(route, ids);
	}

	// Everything else the output holds, so a link to a stylesheet, an image
	// or a downloadable file is checked as a file rather than as a page.
	const assets = new Set(
		listAll(root).map(
			(file) => `/${path.relative(root, file).split(path.sep).join("/")}`,
		),
	);

	let checked = 0;

	for (const file of htmlFiles) {
		const [route] = routesFor(root, file);
		if (excludedRoute.test(route)) continue;

		checked += 1;
		const source = fs.readFileSync(file, "utf8");
		const name = path.relative(reportRoot, file);

		for (const match of source.matchAll(anchorPattern)) {
			const href = decodeEntities((match[1] ?? match[2] ?? "").trim());

			if (
				href === "" ||
				href === "#" ||
				href.startsWith("//") ||
				/^[a-z][a-z0-9+.-]*:/i.test(href)
			) {
				continue;
			}

			const hash = href.indexOf("#");
			const target = hash === -1 ? href : href.slice(0, hash);
			const fragment = hash === -1 ? "" : href.slice(hash + 1);
			const line = lineAt(source, match.index ?? 0);

			// Where does this land? The same page when the href is a bare
			// fragment; otherwise resolved as a URL against this page's own
			// route, which is what makes `../` correct rather than guessed.
			const resolved =
				target === ""
					? route
					: new URL(target, `http://docs${route}`).pathname.replace(
							/\/{2,}/g,
							"/",
						);

			if (excludedRoute.test(resolved)) continue;

			const page = idsByRoute.get(resolved) ?? idsByRoute.get(`${resolved}/`);

			if (!page) {
				// Not a page. It is allowed to be a file the site really ships
				// — a stylesheet, an image, an archive.
				if (assets.has(resolved)) continue;
				violations.push(
					`${name}:${line} Link "${href}" resolves to ${resolved}, which the built site does not contain`,
				);
				continue;
			}

			// An empty fragment and #top are the document itself.
			if (fragment === "" || fragment === "top") continue;

			if (!page.has(decodeURIComponent(fragment))) {
				violations.push(
					`${name}:${line} Link "${href}" points at #${fragment}, which does not exist on ${resolved}`,
				);
			}
		}
	}

	return { checked, pages: htmlFiles.length, violations };
};

module.exports = { checkBuiltLinks };
