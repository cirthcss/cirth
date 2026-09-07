const { spawnSync } = require("node:child_process");
const path = require("node:path");

const { distTagFor, parseVersion } = require("./lib/version");

// Where a release currently is, and the one step that may legally come
// next.
//
// This exists because the alternative to an obvious path is an invented
// one. Half of the mistakes a release can make are really the same
// mistake — acting on a stale idea of what has already happened — and the
// answer is cheap: ask git, GitHub and npm, then say which rung of the
// ladder we are on.
//
// It is strictly read-only. It runs nothing, triggers nothing, and
// publishes nothing; it prints the command that would be next, for a
// person or an agent to run deliberately. The gates that actually refuse
// a bad release live in check-release.js and in the workflows.
//
//   node scripts/release-status.js --version 0.15.0-beta.2

const projectRoot = path.join(__dirname, "..");
const manifest = require("../package.json");
const repository = "cirthcss/cirth";

/**
 * @param {string} command
 * @param {string[]} args
 * @returns {{ ok: boolean, stdout: string, stderr: string }}
 */
const run = (command, args) => {
	const result = spawnSync(command, args, {
		cwd: projectRoot,
		encoding: "utf8",
	});
	return {
		ok: result.status === 0,
		stdout: (result.stdout || "").trim(),
		stderr: (result.stderr || "").trim(),
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

/**
 * @param {"done" | "pending" | "unknown"} state
 * @param {string} label
 * @param {string} [detail]
 */
const line = (state, label, detail) => {
	const mark = { done: "✓", pending: "·", unknown: "?" }[state];
	console.log(
		`  ${mark} ${label}${detail ? `\n      ${detail.split("\n").join("\n      ")}` : ""}`,
	);
};

const main = () => {
	const requested = option("version", manifest.version);
	const version = parseVersion(requested);
	const tag = `v${version.raw}`;
	const distTag = distTagFor(version);

	console.log(`[@cirthcss/cirth] Release status for ${tag}\n`);

	// --- 1. Is this version on master? ---------------------------------

	run("git", ["fetch", "--quiet", "--no-tags", "origin", "master"]);

	const onMaster = run("git", ["show", "origin/master:package.json"]);
	/** @type {string | null} */
	let masterVersion = null;
	if (onMaster.ok) {
		try {
			masterVersion = JSON.parse(onMaster.stdout).version;
		} catch {
			masterVersion = null;
		}
	}

	const masterCommit = run("git", ["rev-parse", "origin/master"]).stdout;
	const isOnMaster = masterVersion === version.raw;

	if (isOnMaster) {
		line(
			"done",
			`the release commit is on master`,
			`origin/master ${masterCommit.slice(0, 10)} is at ${version.raw}`,
		);
	} else {
		line(
			"pending",
			`the release commit is NOT on master`,
			`origin/master is at ${masterVersion ?? "an unreadable version"}`,
		);
	}

	// --- 2. Was CI green on it? ----------------------------------------

	/** @type {"done" | "pending" | "unknown"} */
	let ciState = "unknown";
	if (isOnMaster) {
		const runs = run("gh", [
			"api",
			`repos/${repository}/actions/workflows/ci.yml/runs` +
				`?head_sha=${masterCommit}&status=completed&per_page=100`,
			"--jq",
			"[.workflow_runs[].conclusion] | join(\" \")",
		]);
		if (!runs.ok) {
			line("unknown", "CI conclusion could not be read (is `gh` logged in?)");
		} else if (runs.stdout.split(" ").includes("success")) {
			ciState = "done";
			line("done", "CI concluded successfully on that commit");
		} else {
			ciState = "pending";
			line(
				"pending",
				"CI has NOT concluded successfully on that commit",
				`conclusions: ${runs.stdout || "none"}`,
			);
		}
	} else {
		line("pending", "CI status not applicable yet");
	}

	// --- 3. The tag -----------------------------------------------------

	const remoteTag = run("git", [
		"ls-remote",
		"--tags",
		"origin",
		`refs/tags/${tag}`,
	]);
	/** @type {string | null} */
	let taggedCommit = null;
	if (remoteTag.ok && remoteTag.stdout) {
		/** @type {Map<string, string>} */
		const refs = new Map(
			remoteTag.stdout
				.split("\n")
				.map((entry) => entry.split("\t"))
				.filter((parts) => parts.length === 2)
				.map(([sha, ref]) => [ref, sha]),
		);
		taggedCommit =
			refs.get(`refs/tags/${tag}^{}`) ?? refs.get(`refs/tags/${tag}`) ?? null;
	}

	if (!taggedCommit) {
		line("pending", `${tag} does not exist on origin`);
	} else if (taggedCommit === masterCommit) {
		line("done", `${tag} points at origin/master`);
	} else {
		const reachable = run("git", [
			"merge-base",
			"--is-ancestor",
			taggedCommit,
			"origin/master",
		]).ok;
		line(
			reachable ? "done" : "pending",
			`${tag} points at ${taggedCommit.slice(0, 10)}`,
			reachable
				? "reachable from origin/master"
				: "NOT reachable from origin/master — this tag cannot be released",
		);
	}

	// --- 4. GitHub Release ----------------------------------------------

	const release = run("gh", [
		"api",
		`repos/${repository}/releases/tags/${tag}`,
		"--jq",
		".prerelease",
	]);
	const hasRelease = release.ok;
	line(
		hasRelease ? "done" : "pending",
		hasRelease
			? `GitHub Release exists (prerelease: ${release.stdout})`
			: "no GitHub Release yet",
	);

	// --- 5. npm ----------------------------------------------------------

	const published = run("npm", ["view", `${manifest.name}@${version.raw}`, "version"]);
	const isPublished = published.ok && published.stdout === version.raw;

	const staged = run("npm", ["stage", "list", manifest.name, "--json"]);
	const isStaged =
		staged.ok && staged.stdout.includes(version.raw) && !isPublished;

	if (isPublished) {
		line("done", `published on npm as ${version.raw}`);
	} else if (isStaged) {
		line("done", "staged on npm, awaiting maintainer approval");
	} else if (!staged.ok) {
		line("unknown", "npm staging could not be read (is `npm whoami` set up?)");
	} else {
		line("pending", "nothing published or staged on npm");
	}

	if (isPublished) {
		const tags = run("npm", ["dist-tag", "ls", manifest.name]);
		if (tags.ok) {
			line("done", "dist-tags", tags.stdout);
		}
	}

	// --- The next legal step --------------------------------------------

	console.log("\n  Next:\n");

	/** @param {string[]} lines */
	const next = (lines) => {
		for (const entry of lines) {
			console.log(`    ${entry}`);
		}
	};

	if (!isOnMaster) {
		next([
			`${version.raw} is not on master yet.`,
			"",
			`  npm run release:prepare -- --version ${version.raw}`,
			"",
			"then write the changelog and release notes, open the PR, and STOP.",
			"Merging it into master is the maintainer's decision.",
		]);
	} else if (ciState !== "done") {
		next([
			"Wait for CI to conclude successfully on the release commit,",
			"or re-run it. A release does not proceed without it.",
		]);
	} else if (!taggedCommit) {
		next([
			`  git tag ${tag} ${masterCommit.slice(0, 10)}`,
			`  git push origin ${tag}`,
		]);
	} else if (!hasRelease) {
		next([`  gh workflow run package.yml --ref master -f tag=${tag}`]);
	} else if (!isStaged && !isPublished) {
		next([
			"  gh workflow run npm-publish.yml --ref master \\",
			`    -f tag=${tag} -f channel=${distTag} -f mode=stage`,
		]);
	} else if (isStaged) {
		next([
			"■ CHECKPOINT 2 — maintainer only.",
			"",
			`  npm stage list ${manifest.name}`,
			"  npm stage view <stage-id>",
			"  npm stage approve <stage-id>     # 2FA; this is the publish",
			"",
			"An agent stops here. It does not approve, and does not supply 2FA.",
		]);
	} else {
		next([
			`${version.raw} is published.`,
			"",
			`  npm dist-tag ls ${manifest.name}   # latest must not have moved`,
			...(version.channel === null
				? ["  npm run check:sri -- --from-cdn"]
				: []),
		]);
	}

	console.log("\n  RELEASING.md has the full process.\n");
};

main();
