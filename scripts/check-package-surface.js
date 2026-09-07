const { spawnSync } = require("node:child_process");
const path = require("node:path");

const { distFiles } = require("./lib/dist-manifest");

// What `npm publish` would actually hand a consumer.
//
// `files: ["dist"]` is a rule, not an inventory: it says which directory
// npm may walk, and npm then adds README/LICENSE/package.json on its own.
// Nothing in the repository stated the resulting list, so nothing could
// notice it changing — a stale file left in dist/ by an interrupted build
// ships, a renamed build variant silently stops shipping, and an entry
// point in `exports` can point at a file the tarball does not contain,
// which fails at the consumer's `import` and nowhere earlier.
//
// This asserts the list in both directions: every file a complete build
// produces is present, and every file present is one a build produces.
// Then it walks `exports` and requires each documented entry point to land
// on a file that is really in there.
//
// Runs against `npm pack --dry-run`, so it reads the same computation
// `npm publish` performs rather than a re-implementation of it.

const projectRoot = path.join(__dirname, "..");
const manifest = require("../package.json");

// tsc types package.json from its literal contents, so a field that is
// absent today has no type — and "is this field absent?" is exactly what
// several checks below ask. This is the same object seen as plain data.
const manifestFields = /** @type {Record<string, unknown>} */ (
	/** @type {unknown} */ (manifest)
);

/** Files npm contributes regardless of `files`, plus the ones we ask for. */
const metadataFiles = [
	"package.json",
	"README.md",
	"LICENSE.md",
	// Cirth is a fork of Pico CSS, whose MIT licence requires its copyright
	// notice to travel with every substantial portion of the code. LICENSE.md
	// is the bare Apache-2.0 text and names nobody; NOTICE.md is where that
	// attribution lives, so the package has to carry it.
	"NOTICE.md",
];

// Paths that would each be a distinct kind of accident, named so a failure
// says what went wrong rather than merely that something did.
const knownLeaks = [
	{ test: /^docs\//, what: "documentation source" },
	{ test: /^src\//, what: "SCSS source (the package ships compiled CSS only)" },
	{ test: /^tests\//, what: "test fixtures or visual baselines" },
	{ test: /^scripts\//, what: "build and audit tooling" },
	{ test: /^\.cache\//, what: "a local cache" },
	{ test: /^test-results\//, what: "test run output" },
	{ test: /^\.github\//, what: "repository automation" },
	{ test: /^(HANDOFF|TODO|ISSUES-PROPOSED)\.md$/, what: "a working note" },
	{ test: /^examples\//, what: "local QA scratch files" },
	{ test: /\.(tgz|tar\.gz|zip)$/, what: "a package archive" },
	{ test: /^(playwright|stylelint|tsconfig|\.prettierrc)/, what: "tool config" },
	{ test: /^package-lock\.json$/, what: "the lockfile" },
];

/** @type {string[]} */
const failures = [];

/** @param {string} message */
const fail = (message) => {
	failures.push(message);
};

/**
 * `npm pack --dry-run` computes the tarball without writing one.
 *
 * @returns {{ path: string, size: number }[]}
 */
const packedFiles = () => {
	const result = spawnSync("npm", ["pack", "--dry-run", "--json"], {
		cwd: projectRoot,
		encoding: "utf8",
		// npm writes its human-readable notice to stderr and the JSON to
		// stdout; only the second is parsed.
		stdio: ["ignore", "pipe", "pipe"],
	});

	if (result.status !== 0) {
		throw new Error(`npm pack --dry-run failed:\n${result.stderr.trim()}`);
	}

	/** @type {{ files: { path: string, size: number }[] }[]} */
	const parsed = JSON.parse(result.stdout);
	return parsed[0].files;
};

/**
 * An `exports` target may be a string or a conditions object; collect every
 * path either shape can resolve to.
 *
 * @param {unknown} target
 * @returns {string[]}
 */
const exportTargets = (target) => {
	if (typeof target === "string") {
		return [target];
	}
	if (Array.isArray(target)) {
		return target.flatMap(exportTargets);
	}
	if (target && typeof target === "object") {
		return Object.values(target).flatMap(exportTargets);
	}
	return [];
};

const main = () => {
	const files = packedFiles();
	const present = new Set(files.map((file) => file.path));
	const expected = new Set([...metadataFiles, ...distFiles()]);

	// --- Metadata the registry page and a consumer's tooling read --------

	if (manifestFields.private === true) {
		fail("package.json sets `private: true` — npm would refuse to publish.");
	}

	for (const field of [
		"name",
		"version",
		"description",
		"license",
		"author",
		"homepage",
		"engines",
		"files",
		"exports",
		"main",
		"style",
	]) {
		if (!(field in manifestFields)) {
			fail(`package.json has no \`${field}\`.`);
		}
	}

	if (manifest.repository?.url !== "git+https://github.com/cirthcss/cirth.git") {
		fail(
			`package.json repository.url is \`${manifest.repository?.url}\`. ` +
				`npm provenance matches this field against the publishing ` +
				`repository, case-sensitively.`,
		);
	}

	if (manifest.publishConfig?.access !== "public") {
		fail(
			"package.json publishConfig.access must stay `public`: a scoped " +
				"package defaults to restricted, which would publish a paywalled " +
				"version of a public framework.",
		);
	}

	// --- The file list, in both directions -------------------------------

	for (const file of [...expected].sort()) {
		if (!present.has(file)) {
			fail(`${file} is missing from the tarball.`);
		}
	}

	for (const { path: file } of files) {
		if (expected.has(file)) {
			continue;
		}
		const leak = knownLeaks.find((entry) => entry.test.test(file));
		fail(
			leak
				? `${file} would be published — that is ${leak.what}, which the ` +
						`package must not carry.`
				: `${file} would be published and is not part of the declared ` +
						`surface. Add it to scripts/lib/dist-manifest.js if a build ` +
						`is meant to produce it, or keep it out of \`files\`.`,
		);
	}

	for (const file of files) {
		if (file.size === 0) {
			fail(`${file.path} is empty.`);
		}
	}

	// --- Every documented entry point lands somewhere real ---------------

	/** @type {[string, string][]} */
	const entryPoints = Object.entries(manifest.exports ?? {}).flatMap(
		([subpath, target]) =>
			exportTargets(target).map(
				(value) => /** @type {[string, string]} */ ([subpath, value]),
			),
	);

	for (const [subpath, target] of entryPoints) {
		const file = target.replace(/^\.\//, "");

		if (!file.includes("*")) {
			if (!present.has(file)) {
				fail(
					`exports["${subpath}"] points at ${target}, which the tarball ` +
						`does not contain — \`import "${manifest.name}${subpath.slice(1)}"\` ` +
						`would fail for every consumer.`,
				);
			}
			continue;
		}

		const pattern = new RegExp(
			`^${file.split("*").map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("(.+)")}$`,
		);
		const matches = [...present].filter((candidate) => pattern.test(candidate));

		if (matches.length === 0) {
			fail(
				`exports["${subpath}"] is a \`*\` pattern matching nothing in the ` +
					`tarball.`,
			);
		}
	}

	// `main` and `style` are how bundlers and older tooling find the sheet
	// when they do not read `exports` at all.
	for (const field of /** @type {const} */ (["main", "style"])) {
		const value = String(manifest[field] ?? "").replace(/^\.\//, "");
		if (value && !present.has(value)) {
			fail(`package.json ${field} points at ${value}, which is not packed.`);
		}
	}

	// --- Report ----------------------------------------------------------

	if (failures.length > 0) {
		for (const failure of failures) {
			console.error(`✗ ${failure}`);
		}
		console.error(
			`\ncheck-package-surface: ${failures.length} problem(s) in what ` +
				`npm would publish.`,
		);
		process.exit(1);
	}

	const bytes = files.reduce((total, file) => total + file.size, 0);
	console.log(
		`✓ check-package-surface: ${manifest.name}@${manifest.version} packs ` +
			`${files.length} files (${(bytes / 1024).toFixed(0)} kB unpacked) — ` +
			`${distFiles().length} build outputs, ${metadataFiles.length} metadata ` +
			`files, nothing else; ${entryPoints.length} entry points all resolve.`,
	);
};

main();
