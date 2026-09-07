const { spawnSync } = require("node:child_process");
const path = require("node:path");

const {
	compareVersions,
	distTagFor,
	parseTag,
	parseVersion,
} = require("./lib/version");

// The gate every npm release passes through, in one place so the workflow
// and a maintainer's terminal ask the identical question.
//
// The rule it exists to enforce: **develop anywhere, release only from
// master.** npm is a permanent, public record — a version, once live, is
// the version everyone with a caret range may install — so what it holds
// must exist in the repository's own history, not in a branch that may be
// rebased, renamed or abandoned. A tag on a working branch is a perfectly
// valid git object and an invalid release.
//
// Ancestry is the check that says this, and it is deliberately
// `--is-ancestor` rather than "the tag equals master's head": master moves
// on after a release, and every past release must stay verifiable.
//
//   node scripts/check-release.js --tag v0.15.0-beta.1 --channel beta
//
// Before the tag exists, the same contract can be checked against a
// commit:
//
//   node scripts/check-release.js --tag v0.15.0-beta.1 --channel beta \
//     --unpublished --commit HEAD

const projectRoot = path.join(__dirname, "..");
const { version: manifestVersion } = require("../package.json");

/**
 * @param {string[]} args
 * @param {{ allowFailure?: boolean }} [options]
 * @returns {{ ok: boolean, stdout: string, stderr: string }}
 */
const git = (args, options = {}) => {
	const result = spawnSync("git", args, {
		cwd: projectRoot,
		encoding: "utf8",
	});
	const ok = result.status === 0;

	if (!ok && !options.allowFailure) {
		throw new Error(
			`git ${args.join(" ")} failed:\n${(result.stderr || "").trim()}`,
		);
	}

	return {
		ok,
		stdout: (result.stdout || "").trim(),
		stderr: (result.stderr || "").trim(),
	};
};

/**
 * @param {string} name
 * @param {string} fallback
 * @returns {string}
 */
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

/** @type {string[]} */
const passed = [];

/**
 * @param {string} message
 * @returns {never}
 */
const fail = (message) => {
	for (const line of passed) {
		console.error(`  ✓ ${line}`);
	}
	console.error(`  ✗ ${message}\n`);
	console.error("[@cirthcss/cirth] Release validation failed.");
	process.exit(1);
};

/** @param {string} message */
const pass = (message) => {
	passed.push(message);
};

const main = () => {
	const tagName = option("tag", "");
	const requestedChannel = option("channel", "");
	const base = option("base", "origin/master");
	const unpublished = flag("unpublished");
	const commitRef = option("commit", unpublished ? "HEAD" : tagName);

	if (!tagName) {
		console.error(
			"Usage: node scripts/check-release.js --tag vX.Y.Z[-beta.N] " +
				"[--channel <beta|rc|latest>] [--base origin/master] " +
				"[--unpublished [--commit <ref>]]\n\n" +
				"  --channel states which npm dist-tag the caller intends. It is " +
				"optional for a\n  caller that publishes nothing — the GitHub " +
				"release job — and required of the one\n  that does.",
		);
		process.exit(2);
	}

	console.log(`[@cirthcss/cirth] Validating release ${tagName}\n`);

	// 1 — the tag is a version this project can issue at all.
	/** @type {import("./lib/version").ParsedVersion} */
	let tagVersion;
	try {
		tagVersion = parseTag(tagName);
	} catch (error) {
		return fail(error instanceof Error ? error.message : String(error));
	}
	pass(`tag \`${tagName}\` is a well-formed release tag`);

	// 2 — the tag and the manifest name the same version. A tag that says
	// one thing while package.json says another publishes the second and
	// records the first, and nothing downstream can tell.
	/** @type {import("./lib/version").ParsedVersion} */
	let packageVersion;
	try {
		packageVersion = parseVersion(manifestVersion);
	} catch (error) {
		return fail(
			`package.json version: ${
				error instanceof Error ? error.message : String(error)
			}`,
		);
	}

	if (compareVersions(tagVersion, packageVersion) !== 0) {
		return fail(
			`tag \`${tagName}\` does not match package.json, which is at ` +
				`${manifestVersion}. The tag and the manifest must name the ` +
				`same version.`,
		);
	}
	pass(`package.json is at ${manifestVersion}, the version the tag names`);

	// 3 — the channel asked for is the channel the version belongs to. The
	// dist-tag is derived, never chosen: the request is a statement of
	// intent that has to agree with the version's own shape.
	const distTag = distTagFor(tagVersion);

	if (requestedChannel && requestedChannel !== distTag) {
		return fail(
			`this workflow was asked for the \`${requestedChannel}\` channel, ` +
				`but ${tagVersion.raw} belongs to \`${distTag}\`.\n` +
				`    A prerelease publishes under its own identifier; only a ` +
				`version with no prerelease may take \`latest\`.`,
		);
	}
	pass(
		requestedChannel
			? `channel \`${requestedChannel}\` matches the version's own shape`
			: `no channel requested; this version belongs to \`${distTag}\``,
	);

	// 4 — the commit under release.
	const resolved = git(["rev-list", "-n", "1", commitRef], {
		allowFailure: true,
	});
	if (!resolved.ok || !resolved.stdout) {
		return fail(
			unpublished
				? `\`${commitRef}\` does not resolve to a commit.`
				: `tag \`${tagName}\` does not exist in this checkout. ` +
						`Push the tag before dispatching the release.`,
		);
	}
	const releaseCommit = resolved.stdout;
	pass(`${commitRef} resolves to ${releaseCommit.slice(0, 10)}`);

	// 5 — the tag on the remote is the tag being validated. Skipped only
	// while the tag does not exist yet; in CI a locally fabricated tag must
	// not be able to stand in for the published one.
	if (!unpublished) {
		const remote = option("remote", "origin");
		const listed = git(
			["ls-remote", "--tags", remote, `refs/tags/${tagName}`],
			{ allowFailure: true },
		);

		if (!listed.ok || !listed.stdout) {
			return fail(`\`${remote}\` has no tag \`${tagName}\`.`);
		}

		// An annotated tag lists twice: the tag object, and `^{}` for the
		// commit it points at. The dereferenced line is the one that matters.
		/** @type {Map<string, string>} */
		const refs = new Map(
			listed.stdout
				.split("\n")
				.map((line) => line.split("\t"))
				.filter((parts) => parts.length === 2)
				.map(([sha, ref]) => [ref, sha]),
		);
		const remoteCommit =
			refs.get(`refs/tags/${tagName}^{}`) ?? refs.get(`refs/tags/${tagName}`);

		if (remoteCommit !== releaseCommit) {
			return fail(
				`tag \`${tagName}\` points at ${releaseCommit.slice(0, 10)} here ` +
					`but ${String(remoteCommit).slice(0, 10)} on ${remote}.`,
			);
		}
		pass(`${remote} agrees the tag points at ${releaseCommit.slice(0, 10)}`);
	}

	// 6 — the release commit is already in master's history. This is the
	// check the whole file exists for.
	const baseResolved = git(["rev-parse", "--verify", `${base}^{commit}`], {
		allowFailure: true,
	});
	if (!baseResolved.ok) {
		return fail(
			`\`${base}\` is not available in this checkout — fetch it before ` +
				`validating (the ancestry check cannot be skipped).`,
		);
	}

	const ancestor = git(
		["merge-base", "--is-ancestor", releaseCommit, baseResolved.stdout],
		{ allowFailure: true },
	);

	if (!ancestor.ok) {
		const branches = git(
			["branch", "-a", "--contains", releaseCommit],
			{ allowFailure: true },
		).stdout;

		return fail(
			`Releases must be published from commits already merged into ` +
				`master.\n` +
				`    ${releaseCommit.slice(0, 10)} is not reachable from ` +
				`${base} (${baseResolved.stdout.slice(0, 10)}).\n` +
				(branches
					? `    It is currently reachable from:\n${branches
							.split("\n")
							.map((line) => `      ${line.trim()}`)
							.join("\n")}\n`
					: "") +
				`    Merge the work into master, let CI go green, then tag the ` +
				`master commit.`,
		);
	}
	pass(`${releaseCommit.slice(0, 10)} is reachable from ${base}`);

	for (const line of passed) {
		console.log(`  ✓ ${line}`);
	}

	if (unpublished) {
		// Advisory only. This mode skips the remote-tag check, so it answers
		// "would this be releasable?" and not "is this release authorised?".
		// It deliberately emits no workflow outputs: a publish job must never
		// be able to consume a verdict reached without the tag existing.
		console.log(
			`\n[@cirthcss/cirth] ADVISORY — ${tagName} would be releasable ` +
				`from master under the \`${distTag}\` dist-tag.\n` +
				`  The tag does not exist yet, so this is a pre-tag check and ` +
				`authorises nothing.\n` +
				`  The release workflow runs the full check, including the ` +
				`remote tag, and cannot be given this result.`,
		);
		return;
	}

	console.log(
		`\n[@cirthcss/cirth] ${tagName} is releasable from master ` +
			`under the \`${distTag}\` dist-tag.`,
	);

	// Consumed by the workflow, which never derives the dist-tag itself.
	if (process.env.GITHUB_OUTPUT) {
		require("node:fs").appendFileSync(
			process.env.GITHUB_OUTPUT,
			`dist-tag=${distTag}\n` +
				`commit=${releaseCommit}\n` +
				`version=${tagVersion.raw}\n` +
				`prerelease=${tagVersion.channel === null ? "false" : "true"}\n`,
		);
	}
};

main();
