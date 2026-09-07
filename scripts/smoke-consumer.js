const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const { createRequire } = require("node:module");
const os = require("node:os");
const path = require("node:path");

// Installs the real tarball into a clean project and uses it the way a
// consumer would.
//
// Everything else in this repository checks dist/ where it is built. That
// cannot see the layer between: `files`, `exports`, and npm's own packing
// rules. An entry point can be documented, built, and still unreachable —
// `exports` is an allow-list, so a subpath it does not name is a hard
// resolution error no matter what the tarball contains.
//
// So this reads nothing from dist/. It packs, installs, and then asks
// Node's own resolver the question a consumer's bundler asks, from inside
// the consumer's directory. What it reads back is whatever npm delivered.

const projectRoot = path.join(__dirname, "..");
const manifest = require("../package.json");

/**
 * Every documented entry point, with something only the right file could
 * contain. The sentinels are deliberately about the *promise the subpath
 * makes* — a print sheet is print-only, a classless build has no classes,
 * a scoped build lives under the wrapper — so a mapping that pointed a
 * subpath at the wrong build would be caught, which byte-size alone cannot.
 *
 * @type {{ subpath: string, must: string[], mustNot: string[] }[]}
 */
const entryPoints = [
	{ subpath: ".", must: ["--cirth-", ".container"], mustNot: ["@media print"] },
	{
		subpath: "./classless",
		must: ["--cirth-"],
		mustNot: [".container", "@media print"],
	},
	{
		subpath: "./scoped",
		must: ["--cirth-", ".cirth", ".container"],
		mustNot: ["@media print"],
	},
	{
		subpath: "./classless/scoped",
		must: ["--cirth-", ".cirth"],
		mustNot: [".container", "@media print"],
	},
	{ subpath: "./print", must: ["@media print"], mustNot: [] },
	{
		subpath: "./classless/print",
		must: ["@media print"],
		mustNot: [".container"],
	},
	{ subpath: "./scoped/print", must: ["@media print", ".cirth"], mustNot: [] },
	{
		subpath: "./classless/scoped/print",
		must: ["@media print", ".cirth"],
		mustNot: [".container"],
	},
	{ subpath: "./presets/plain", must: ["--cirth-"], mustNot: [] },
	{ subpath: "./presets/playroom", must: ["--cirth-"], mustNot: [] },
	// The two `*` patterns, reached by a path only they can serve: the
	// expanded builds, which no explicit subpath names.
	{ subpath: "./presets/plain.css", must: ["--cirth-"], mustNot: [] },
	{ subpath: "./dist/cirth.css", must: ["--cirth-", ".container"], mustNot: [] },
];

// Repository internals a consumer must not be able to reach. `exports`
// closing the package is the whole reason the SCSS source, the tooling and
// the working notes can live in the repository without becoming API.
const sealed = [
	"./src/cirth.scss",
	"./scripts/build.js",
	"./HANDOFF.md",
	"./docs/src/pages/index.md",
	"./package-lock.json",
];

/** @type {string[]} */
const failures = [];

/** @param {string} message */
const fail = (message) => {
	failures.push(message);
};

/**
 * @param {string} command
 * @param {string[]} args
 * @param {string} cwd
 */
const run = (command, args, cwd) => {
	const result = spawnSync(command, args, { cwd, encoding: "utf8" });
	if (result.status !== 0) {
		throw new Error(
			`${command} ${args.join(" ")} failed in ${cwd}:\n` +
				`${(result.stderr || result.stdout || "").trim()}`,
		);
	}
	return (result.stdout || "").trim();
};

const main = () => {
	// realpath, because the resolver returns one: on macOS os.tmpdir() is
	// /var/..., which is a symlink to /private/var/..., and the containment
	// check below would compare two spellings of the same directory and
	// report every entry point as escaping the package.
	const workspace = fs.realpathSync(
		fs.mkdtempSync(path.join(os.tmpdir(), "cirth-smoke-")),
	);
	const consumer = path.join(workspace, "consumer");
	fs.mkdirSync(consumer);

	try {
		// 1 — a real tarball, not a dry run. This is the artifact.
		const packed = JSON.parse(
			run(
				"npm",
				["pack", "--json", "--pack-destination", workspace],
				projectRoot,
			),
		)[0];
		const tarball = path.join(workspace, packed.filename);

		console.log(
			`[@cirthcss/cirth] Packed ${packed.filename} ` +
				`(${(packed.size / 1024).toFixed(0)} kB, ${packed.entryCount} files)`,
		);

		// 2 — an empty project, then a plain install of that file.
		fs.writeFileSync(
			path.join(consumer, "package.json"),
			`${JSON.stringify(
				{ name: "cirth-consumer-smoke", version: "0.0.0", private: true },
				null,
				2,
			)}\n`,
		);

		run(
			"npm",
			[
				"install",
				tarball,
				"--no-audit",
				"--no-fund",
				// A stylesheet has no install scripts; refusing to run any keeps
				// this from being a way to execute code during a check.
				"--ignore-scripts",
			],
			consumer,
		);

		const installed = path.join(consumer, "node_modules", manifest.name);
		if (!fs.existsSync(installed)) {
			throw new Error(`npm install left no ${manifest.name} in node_modules.`);
		}

		// 3 — resolve as the consumer, through `exports`.
		const resolve = createRequire(path.join(consumer, "index.cjs")).resolve;

		for (const { subpath, must, mustNot } of entryPoints) {
			const specifier = `${manifest.name}${subpath.replace(/^\./, "")}`;
			/** @type {string} */
			let resolved;

			try {
				resolved = resolve(specifier);
			} catch (error) {
				fail(
					`\`${specifier}\` does not resolve from a consumer project ` +
						`(${error instanceof Error ? error.message.split("\n")[0] : error}).`,
				);
				continue;
			}

			if (!resolved.startsWith(installed + path.sep)) {
				fail(`\`${specifier}\` resolved outside the package: ${resolved}`);
				continue;
			}

			const contents = fs.readFileSync(resolved, "utf8");

			if (contents.length === 0) {
				fail(`\`${specifier}\` resolved to an empty file.`);
				continue;
			}

			for (const needle of must) {
				if (!contents.includes(needle)) {
					fail(
						`\`${specifier}\` delivered a stylesheet with no ` +
							`\`${needle}\` in it — that is not the build this subpath ` +
							`promises.`,
					);
				}
			}

			for (const needle of mustNot) {
				if (contents.includes(needle)) {
					fail(
						`\`${specifier}\` delivered a stylesheet containing ` +
							`\`${needle}\`, which this subpath promises not to emit.`,
					);
				}
			}
		}

		// 4 — the manifest a consumer's tooling reads, from the installed copy.
		const deliveredManifest = JSON.parse(
			fs.readFileSync(resolve(`${manifest.name}/package.json`), "utf8"),
		);

		if (deliveredManifest.version !== manifest.version) {
			fail(
				`the installed package reports ${deliveredManifest.version}, but ` +
					`this tree is at ${manifest.version}.`,
			);
		}

		if (!fs.existsSync(path.join(installed, "NOTICE.md"))) {
			fail(
				"NOTICE.md did not survive the install — the upstream Pico CSS " +
					"attribution has to travel with the package.",
			);
		}

		// 5 — and what must stay unreachable.
		for (const subpath of sealed) {
			const specifier = `${manifest.name}/${subpath.replace(/^\.\//, "")}`;
			try {
				const leaked = resolve(specifier);
				fail(`\`${specifier}\` resolved to ${leaked} — it must not be API.`);
			} catch {
				// The expected outcome: ERR_PACKAGE_PATH_NOT_EXPORTED.
			}
		}
	} finally {
		fs.rmSync(workspace, { force: true, recursive: true });
	}

	if (failures.length > 0) {
		for (const failure of failures) {
			console.error(`✗ ${failure}`);
		}
		console.error(
			`\nsmoke-consumer: ${failures.length} problem(s) installing and ` +
				`using the package as a consumer would.`,
		);
		process.exit(1);
	}

	console.log(
		`✓ smoke-consumer: installed from the tarball into a clean project; ` +
			`${entryPoints.length} entry points resolve and deliver the build ` +
			`they promise; ${sealed.length} internal paths stay sealed.`,
	);
};

main();
