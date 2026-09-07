const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const { compareVersions, parseVersion } = require("./lib/version");

// The mechanical half of preparing a release, so that improvising one is
// never the easier path.
//
// Everything here is bookkeeping that has exactly one right answer: which
// commit to branch from, what the branch is called, what the version
// string is, where the release notes file goes, which compare link the
// changelog needs. None of it is a judgement call, and all of it is easy
// to get subtly wrong at eleven at night.
//
// What it deliberately does NOT do is write the prose. A changelog
// generated from commit subjects describes the repository's history; a
// release note describes what changed for someone using the library, and
// only a reader of the diff can tell which is which.
//
// It also never commits, pushes, merges, or tags. The release branch it
// leaves behind is a proposal — a human decides whether it enters master.
//
//   node scripts/release-prepare.js --version 0.15.0-beta.2
//   node scripts/release-prepare.js --version 0.15.0-beta.2 --dry-run

const projectRoot = path.join(__dirname, "..");
const manifestPath = path.join(projectRoot, "package.json");
const changelogPath = path.join(projectRoot, "CHANGELOG.md");
const releaseNotesDir = path.join(projectRoot, ".github/releases");
const prereleaseTemplate = path.join(
	releaseNotesDir,
	"TEMPLATE-prerelease.md",
);
const repositoryUrl = "https://github.com/cirthcss/cirth";

/**
 * @param {string[]} args
 * @param {{ allowFailure?: boolean }} [options]
 */
const git = (args, options = {}) => {
	const result = spawnSync("git", args, {
		cwd: projectRoot,
		encoding: "utf8",
	});
	if (result.status !== 0 && !options.allowFailure) {
		throw new Error(
			`git ${args.join(" ")} failed:\n${(result.stderr || "").trim()}`,
		);
	}
	return {
		ok: result.status === 0,
		stdout: (result.stdout || "").trim(),
	};
};

/** @param {string} name @param {string} fallback */
const option = (name, fallback) => {
	const index = process.argv.indexOf(`--${name}`);
	if (index === -1) {
		return fallback;
	}
	const value = process.argv[index + 1];
	if (value === undefined || value.startsWith("--")) {
		throw new Error(`--${name} needs a value.`);
	}
	return value;
};

/** @param {string} name */
const flag = (name) => process.argv.includes(`--${name}`);

const dryRun = flag("dry-run");

/** @type {string[]} */
const planned = [];

/** @param {string} message */
const step = (message) => {
	planned.push(message);
	console.log(`${dryRun ? "  would" : "  ✓"} ${message}`);
};

/**
 * @param {string} message
 * @returns {never}
 */
const stop = (message) => {
	console.error(`\n✗ ${message}\n`);
	console.error("[@cirthcss/cirth] Release preparation stopped.");
	process.exit(1);
};

/**
 * The newest release before this one, from the one list in the repository
 * that gains an entry per release. Read *before* anything is scaffolded,
 * and never counting the version being prepared: a compare link from a
 * version to itself is not a link.
 *
 * @param {string} excluding
 * @returns {string | null}
 */
const previousRelease = (excluding) => {
	const released = fs
		.readdirSync(releaseNotesDir)
		.flatMap((entry) => {
			const match = /^v(\d+\.\d+\.\d+(?:-[a-z]+\.\d+)?)\.md$/.exec(entry);
			return match && match[1] !== excluding ? [parseVersion(match[1])] : [];
		})
		.sort(compareVersions);
	return released.length > 0 ? released[0].raw : null;
};

const main = () => {
	const requested = option("version", "");
	const base = option("base", "origin/master");

	if (!requested) {
		console.error(
			"Usage: node scripts/release-prepare.js --version X.Y.Z[-beta.N] " +
				"[--base origin/master] [--dry-run]",
		);
		process.exit(2);
	}

	/** @type {import("./lib/version").ParsedVersion} */
	let version;
	try {
		version = parseVersion(requested);
	} catch (error) {
		return stop(error instanceof Error ? error.message : String(error));
	}

	const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
	const current = parseVersion(manifest.version);
	const branch = `release/v${version.raw}`;
	const notesPath = path.join(releaseNotesDir, `v${version.raw}.md`);
	const previous = previousRelease(version.raw);

	console.log(
		`[@cirthcss/cirth] Preparing ${version.raw}` +
			`${dryRun ? " (dry run — nothing will be written)" : ""}\n`,
	);

	// --- Refusals, before anything is touched --------------------------

	// A release must move forward. Re-cutting a version that npm already
	// holds is the one mistake with no clean undo.
	if (compareVersions(version, current) >= 0) {
		return stop(
			`${version.raw} does not come after ${current.raw}, which is what ` +
				`package.json is at. A release only ever moves forward.`,
		);
	}

	const dirty = git(["status", "--porcelain"]).stdout;
	if (dirty) {
		return stop(
			`the working tree has uncommitted changes:\n\n${dirty
				.split("\n")
				.map((line) => `      ${line}`)
				.join("\n")}\n\n` +
				`    Commit or stash them first — a release branch must contain ` +
				`release material only.`,
		);
	}

	const baseCommit = git(["rev-parse", "--verify", `${base}^{commit}`], {
		allowFailure: true,
	});
	if (!baseCommit.ok) {
		return stop(
			`\`${base}\` is not available. Run \`git fetch origin master\` ` +
				`first: a release branches from master, never from wherever you ` +
				`happen to be.`,
		);
	}

	const currentBranch = git(["branch", "--show-current"]).stdout;
	const branchExists = git(
		["rev-parse", "--verify", `refs/heads/${branch}`],
		{ allowFailure: true },
	).ok;

	// Either we are about to create the branch at master, or we are already
	// on it and it must not be missing anything master has.
	if (branchExists && currentBranch !== branch) {
		return stop(
			`branch \`${branch}\` already exists but you are on ` +
				`\`${currentBranch}\`. Switch to it, or delete it if the ` +
				`previous attempt is being abandoned.`,
		);
	}

	if (currentBranch === branch) {
		const hasMaster = git(
			["merge-base", "--is-ancestor", baseCommit.stdout, "HEAD"],
			{ allowFailure: true },
		).ok;
		if (!hasMaster) {
			return stop(
				`\`${branch}\` does not contain ${base} ` +
					`(${baseCommit.stdout.slice(0, 10)}). Master has moved since ` +
					`this branch was cut; rebase it or start again.`,
			);
		}
	}

	// --- The bookkeeping ------------------------------------------------

	if (currentBranch === branch) {
		step(`stay on ${branch}, which already contains ${base}`);
	} else {
		step(`create ${branch} at ${base} (${baseCommit.stdout.slice(0, 10)})`);
		if (!dryRun) {
			git(["switch", "--create", branch, baseCommit.stdout]);
		}
	}

	step(`set package.json version to ${version.raw}`);
	if (!dryRun) {
		const result = spawnSync(
			"npm",
			["version", "--no-git-tag-version", version.raw],
			{ cwd: projectRoot, encoding: "utf8", stdio: "inherit" },
		);
		if (result.status !== 0) {
			return stop("npm version failed.");
		}
	}

	// Release notes: a skeleton with the headings, never the words.
	if (fs.existsSync(notesPath)) {
		step(`leave ${path.relative(projectRoot, notesPath)} alone (it exists)`);
	} else {
		step(`scaffold ${path.relative(projectRoot, notesPath)}`);
		if (!dryRun) {
			const template =
				version.channel !== null && fs.existsSync(prereleaseTemplate)
					? fs
							.readFileSync(prereleaseTemplate, "utf8")
							.replace(/^# Cirth vX\.Y\.Z-beta\.N$/m, `# Cirth v${version.raw}`)
							// The template's own instructions ("copy this to…") are
							// addressed to whoever copies it. Once copied they are
							// stale advice sitting inside a published release note.
							.replace(/\n<!--[\s\S]*?-->\n/, "")
					: `# Cirth v${version.raw}\n\n` +
						`One paragraph on what this release is.\n\n` +
						`## Breaking changes\n\n## What looks different\n\n` +
						`## New and changed defaults\n\n## API\n\n## Known issues\n`;
			fs.writeFileSync(notesPath, template);
		}
	}

	// Changelog: promote [Unreleased] and add the compare link. The prose
	// under the heading is not this script's business.
	const changelog = fs.readFileSync(changelogPath, "utf8");
	const heading = `## [${version.raw}]`;

	if (changelog.includes(heading)) {
		step(`leave CHANGELOG.md alone (it already has ${heading})`);
	} else if (!changelog.includes("## [Unreleased]")) {
		step("leave CHANGELOG.md alone (no [Unreleased] section to promote)");
	} else {
		const today = new Date().toISOString().slice(0, 10);
		step(
			`promote CHANGELOG.md [Unreleased] to [${version.raw}] - ${today}` +
				(previous ? `, linked against v${previous}` : ""),
		);
		if (!dryRun) {
			let updated = changelog.replace(
				"## [Unreleased]",
				`## [Unreleased]\n\n## [${version.raw}] - ${today}`,
			);
			if (previous) {
				const link =
					`[${version.raw}]: ${repositoryUrl}/compare/` +
					`v${previous}...v${version.raw}`;
				updated = updated.replace(
					`[${previous}]: `,
					`${link}\n[${previous}]: `,
				);
			}
			fs.writeFileSync(changelogPath, updated);
		}
	}

	// --- The checks -----------------------------------------------------

	if (dryRun) {
		console.log(
			`\n  would then run: npm run build, lint, check:dist, check:size, ` +
				`check:package, check:consumer`,
		);
	} else {
		const checks = [
			["build", ["run", "build"]],
			["lint", ["run", "lint"]],
			["check:dist", ["run", "check:dist"]],
			["check:size", ["run", "check:size"]],
			["check:package", ["run", "check:package"]],
			["check:consumer", ["run", "check:consumer"]],
		];

		console.log("");
		for (const [name, args] of checks) {
			process.stdout.write(`  running ${name} … `);
			const result = spawnSync("npm", /** @type {string[]} */ (args), {
				cwd: projectRoot,
				encoding: "utf8",
			});
			if (result.status !== 0) {
				console.log("failed");
				console.error(`\n${(result.stdout || "") + (result.stderr || "")}`);
				return stop(
					`\`npm ${/** @type {string[]} */ (args).join(" ")}\` failed. Fix ` +
						`it on this branch before opening the release PR.`,
				);
			}
			console.log("ok");
		}
	}

	// --- What a person still has to do ---------------------------------

	console.log(
		`\n[@cirthcss/cirth] ${version.raw} prepared${
			dryRun ? " (dry run)" : ""
		}. Nothing was committed, pushed, or tagged.\n`,
	);
	console.log("  Still to write, by hand:");
	console.log(
		`    - CHANGELOG.md, under ## [${version.raw}] — what changed for` +
			` someone using Cirth`,
	);
	console.log(
		`    - ${path.relative(projectRoot, notesPath)} — the release notes`,
	);
	console.log(
		"\n  Release notes describe changes in Cirth, not how the maintainers",
	);
	console.log("  arrived at them. See RELEASING.md.\n");
	console.log("  Then: commit, open the PR against master, and STOP.");
	console.log("  Merging the release PR is the maintainer's decision.");
};

main();
