const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const { hooksPath } = require("./lib/release-guard");

// Points this clone's Git at the tracked hooks, and verifies it stayed
// pointed there.
//
// Git will not run a hook a repository ships — .githooks/ is just a
// directory until `core.hooksPath` names it — so a fresh clone has no
// guard at all until this runs. That is a property of Git, not an
// oversight: a repository that could execute code on clone would be a
// remarkable thing to hand a stranger.
//
// `--check` verifies without changing anything, which is what
// `npm run check:hooks` does. It is deliberately NOT part of
// `npm run check:tooling`: CI has no hooks configured and does not need
// any, and a check that fails for every consumer of this repository would
// be switched off within a week.
//
//   npm run setup:hooks
//   npm run check:hooks

const projectRoot = path.join(__dirname, "..");
const hooksDir = path.join(projectRoot, hooksPath);
const checkOnly = process.argv.includes("--check");

// Every hook the directory must carry. pre-push is the guard; the other
// three exist only because core.hooksPath replaces .git/hooks/ wholesale,
// and `git lfs install` put its hooks there.
const requiredHooks = ["pre-push", "post-checkout", "post-commit", "post-merge"];

/**
 * @param {string[]} args
 * @returns {{ ok: boolean, stdout: string }}
 */
const git = (args) => {
	const result = spawnSync("git", args, {
		cwd: projectRoot,
		encoding: "utf8",
	});
	return { ok: result.status === 0, stdout: (result.stdout || "").trim() };
};

/** @type {string[]} */
const problems = [];

const main = () => {
	const configured = git(["config", "--local", "--get", "core.hooksPath"]);
	const current = configured.ok ? configured.stdout : null;

	if (current === hooksPath) {
		console.log(`  ✓ core.hooksPath is ${hooksPath}`);
	} else if (checkOnly) {
		problems.push(
			`core.hooksPath is ${current === null ? "not set" : `\`${current}\``}, ` +
				`not \`${hooksPath}\` — this clone is running no release guard. ` +
				`Run \`npm run setup:hooks\`.`,
		);
	} else {
		// --local, never --global: this is one repository's policy, and
		// repointing a whole machine's hooks at it would break every other
		// checkout on it.
		const set = git(["config", "--local", "core.hooksPath", hooksPath]);
		if (!set.ok) {
			problems.push(`could not set core.hooksPath (is this a git clone?)`);
		} else {
			console.log(
				`  ✓ core.hooksPath set to ${hooksPath}` +
					`${current === null ? "" : ` (was \`${current}\`)`}`,
			);
		}
	}

	for (const hook of requiredHooks) {
		const file = path.join(hooksDir, hook);

		if (!fs.existsSync(file)) {
			problems.push(`${hooksPath}/${hook} is missing.`);
			continue;
		}

		const executable = (fs.statSync(file).mode & 0o111) !== 0;
		if (executable) {
			console.log(`  ✓ ${hooksPath}/${hook} is executable`);
		} else if (checkOnly) {
			problems.push(`${hooksPath}/${hook} is not executable.`);
		} else {
			fs.chmodSync(file, 0o755);
			console.log(`  ✓ ${hooksPath}/${hook} made executable`);
		}
	}

	// The guard is only worth anything if it actually refuses. Ask it.
	const guard = spawnSync(
		process.execPath,
		[path.join(projectRoot, "scripts/pre-push-guard.js")],
		{
			cwd: projectRoot,
			encoding: "utf8",
			input: "refs/heads/master aaa refs/heads/master bbb\n",
		},
	);
	if (guard.status === 0) {
		problems.push(
			"the pre-push guard allowed a push to master — it is not working.",
		);
	} else {
		console.log("  ✓ the guard refuses a push to master when asked");
	}

	if (problems.length > 0) {
		console.error("");
		for (const problem of problems) {
			console.error(`  ✗ ${problem}`);
		}
		console.error(
			`\n[@cirthcss/cirth] Git hooks are not configured for this clone.`,
		);
		process.exit(1);
	}

	console.log(
		`\n[@cirthcss/cirth] Git hooks ${checkOnly ? "verified" : "configured"}: ` +
			`direct pushes to master and release tags are refused locally.\n` +
			`  Git LFS keeps working — its hooks are carried in ${hooksPath}/ too.\n` +
			`  This is defense in depth, not a boundary: --no-verify skips it. ` +
			`See RELEASING.md.`,
	);
};

main();
