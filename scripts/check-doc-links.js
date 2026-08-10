const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.join(__dirname, "..");

// Directories that hold generated, cached, or vendored content — never hand
// authored, so link rot there isn't a documentation bug.
const excludedDirnames = new Set([
	"node_modules",
	".git",
	"dist",
	"cache",
	".temp",
	".astro",
	".agent-harness",
	".claude",
]);

const trackedFileExtensions = new Set([".md", ".mdx", ".astro", ".tsx", ".ts", ".mts"]);

/** @param {string} folder @returns {string[]} */
const getTrackedFiles = (folder) =>
	fs
		.readdirSync(folder, { withFileTypes: true })
		.flatMap((entry) => {
			if (entry.isDirectory()) {
				return excludedDirnames.has(entry.name)
					? []
					: getTrackedFiles(path.join(folder, entry.name));
			}

			return trackedFileExtensions.has(path.extname(entry.name))
				? [path.join(folder, entry.name)]
				: [];
		})
		.sort();

/**
 * @param {string} source
 * @param {number} index
 */
const lineAt = (source, index) => source.slice(0, index).split("\n").length;

/** @type {string[]} */
const violations = [];

// Check A — every github.com/cirthcss/cirth/(blob|tree)/<ref> link must
// point at "master" or a real release tag (vX.Y.Z), never a branch like the
// long-gone "develop". A stale ref silently serves outdated file contents.
const repoRefPattern =
	/github\.com\/cirthcss\/cirth\/(?:blob|tree)\/([^/\s"')]+)/g;
const semverTagPattern = /^v\d+\.\d+\.\d+$/;

// Check B — every relative markdown link ([text](target)) in a hand-written
// .md/.mdx file must resolve to a real file. Two conventions coexist:
// - README.md, CHANGELOG.md, and .github/**/*.md use plain repo-relative
//   file paths (docs/colors.md, ../LICENSE.md, .github/CONTRIBUTING.md).
// - docs/src/pages/**/*.mdx use Astro root-relative page routes (/colors,
//   /forms/, no extension), resolved against docs/src/pages/ instead.
const markdownLinkPattern = /(?<!!)\[[^\]]*\]\(([^)]+)\)/g;

/** @param {string} targetPath */
const resolveDocRoute = (targetPath) => {
	const withoutFragment = targetPath.split("#")[0].split("?")[0];
	const pagesRoot = path.join(projectRoot, "docs/src/pages");

	const candidates =
		withoutFragment === "" || withoutFragment === "/"
			? ["index.mdx", "index.md"]
			: withoutFragment.endsWith("/")
				? [`${withoutFragment}index.mdx`, `${withoutFragment}index.md`]
				: [`${withoutFragment}.mdx`, `${withoutFragment}.md`];

	const resolved = candidates.map((candidate) => path.join(pagesRoot, candidate));
	return resolved.find((candidate) => fs.existsSync(candidate)) ?? resolved[0];
};

/**
 * @param {string} fromFile
 * @param {string} targetPath
 */
const resolveRelativeFile = (fromFile, targetPath) => {
	const withoutFragment = targetPath.split("#")[0].split("?")[0];
	return path.resolve(path.dirname(fromFile), withoutFragment);
};

getTrackedFiles(projectRoot).forEach((filename) => {
	const relativeFilename = path.relative(projectRoot, filename);
	const source = fs.readFileSync(filename, "utf8");

	for (const match of source.matchAll(repoRefPattern)) {
		const ref = match[1];

		if (ref !== "master" && !semverTagPattern.test(ref)) {
			const line = lineAt(source, match.index);
			violations.push(
				`${relativeFilename}:${line} Link points at branch/ref "${ref}" — use "master" (or a real vX.Y.Z tag for historical release notes)`,
			);
		}
	}

	if (![".md", ".mdx"].includes(path.extname(filename))) {
		return;
	}

	const isDocsPage = relativeFilename.startsWith(`docs${path.sep}src${path.sep}pages${path.sep}`);

	for (const match of source.matchAll(markdownLinkPattern)) {
		const target = match[1].trim();

		if (
			target === "" ||
			target.startsWith("#") ||
			/^[a-z][a-z0-9+.-]*:/i.test(target) // any URL scheme (http:, mailto:, ...)
		) {
			continue;
		}

		const resolved =
			isDocsPage && target.startsWith("/")
				? resolveDocRoute(target)
				: resolveRelativeFile(filename, target);

		if (!fs.existsSync(resolved)) {
			const line = lineAt(source, match.index);
			violations.push(
				`${relativeFilename}:${line} Link target "${target}" does not resolve to ${path.relative(projectRoot, resolved)}`,
			);
		}
	}
});

if (violations.length > 0) {
	console.error("[@cirthcss/cirth] Broken documentation references:\n");
	violations.forEach((violation) => {
		console.error(`- ${violation}`);
	});

	process.exit(1);
}

console.log("[@cirthcss/cirth] Documentation links check passed");
