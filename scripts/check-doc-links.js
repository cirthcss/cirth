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
	".agent-harness",
	".claude",
]);

const trackedFileExtensions = new Set([".md", ".vue", ".ts", ".mts"]);

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

const lineAt = (source, index) => source.slice(0, index).split("\n").length;

const violations = [];

// Check A — every github.com/cirthcss/cirth/(blob|tree)/<ref> link must
// point at "master" or a real release tag (vX.Y.Z), never a branch like the
// long-gone "develop". A stale ref silently serves outdated file contents.
const repoRefPattern =
	/github\.com\/cirthcss\/cirth\/(?:blob|tree)\/([^/\s"')]+)/g;
const semverTagPattern = /^v\d+\.\d+\.\d+$/;

// Check B — every relative markdown link ([text](target)) in a hand-written
// .md file must resolve to a real file. Two conventions coexist:
// - README.md, CHANGELOG.md, and .github/**/*.md use plain repo-relative
//   file paths (docs/colors.md, ../LICENSE.md, .github/CONTRIBUTING.md).
// - docs/**/*.md use VitePress root-relative page routes (/colors,
//   /forms/, no .md extension), resolved against docs/ instead.
const markdownLinkPattern = /(?<!!)\[[^\]]*\]\(([^)]+)\)/g;

const resolveDocRoute = (targetPath) => {
	const withoutFragment = targetPath.split("#")[0].split("?")[0];

	if (withoutFragment === "" || withoutFragment === "/") {
		return path.join(projectRoot, "docs/index.md");
	}

	if (withoutFragment.endsWith("/")) {
		return path.join(projectRoot, "docs", `${withoutFragment}index.md`);
	}

	return path.join(projectRoot, "docs", `${withoutFragment}.md`);
};

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

	if (path.extname(filename) !== ".md") {
		return;
	}

	const isDocsPage = relativeFilename.startsWith(`docs${path.sep}`);

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
