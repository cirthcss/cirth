const fs = require("node:fs");
const path = require("node:path");

// Installs the PreToolUse guard into this machine's Claude Code settings.
//
// `.claude/` is gitignored — it is per-machine assistant state, not project
// configuration — so the settings cannot be committed. What is tracked is
// this installer and the guard it points at, which is enough for a fresh
// clone to reach the same protection with one command.
//
// It merges. Whatever else is in the settings file stays, a backup is
// written before the first change, and running it twice changes nothing
// the second time.
//
//   npm run setup:claude-hooks
//   npm run setup:claude-hooks -- --check

const projectRoot = path.join(__dirname, "..");
const settingsPath = path.join(projectRoot, ".claude/settings.local.json");
const checkOnly = process.argv.includes("--check");

const guardCommand =
	'node "$CLAUDE_PROJECT_DIR/scripts/claude-guard.js"';

/** The one entry this installer owns. */
const guardHook = {
	type: "command",
	command: guardCommand,
};

/**
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
const isObject = (value) =>
	typeof value === "object" && value !== null && !Array.isArray(value);

const main = () => {
	/** @type {Record<string, unknown>} */
	let settings = {};
	const existed = fs.existsSync(settingsPath);

	if (existed) {
		try {
			settings = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
		} catch (error) {
			console.error(
				`✗ ${path.relative(projectRoot, settingsPath)} is not valid JSON ` +
					`(${error instanceof Error ? error.message : error}).\n` +
					`  Refusing to touch it — fix or move it, then run this again.`,
			);
			process.exit(1);
		}
	}

	const hooks = isObject(settings.hooks) ? settings.hooks : {};
	const preToolUse = Array.isArray(hooks.PreToolUse) ? hooks.PreToolUse : [];

	const installed = preToolUse.some(
		(entry) =>
			isObject(entry) &&
			Array.isArray(entry.hooks) &&
			entry.hooks.some(
				(hook) => isObject(hook) && hook.command === guardCommand,
			),
	);

	if (installed) {
		console.log(
			`  ✓ the release guard is already in ` +
				`${path.relative(projectRoot, settingsPath)}`,
		);
		console.log(
			`\n[@cirthcss/cirth] Claude Code PreToolUse guard is configured.`,
		);
		return;
	}

	if (checkOnly) {
		console.error(
			`✗ the Claude Code release guard is not installed.\n` +
				`  Run \`npm run setup:claude-hooks\`.`,
		);
		process.exit(1);
	}

	if (existed) {
		const backup = `${settingsPath}.backup-${Date.now()}`;
		fs.copyFileSync(settingsPath, backup);
		console.log(`  ✓ backed up to ${path.basename(backup)}`);
	} else {
		fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
	}

	// Append rather than replace: another matcher group for Bash may
	// already be doing something unrelated, and it is not ours to remove.
	settings.hooks = {
		...hooks,
		PreToolUse: [...preToolUse, { matcher: "Bash", hooks: [guardHook] }],
	};

	fs.writeFileSync(settingsPath, `${JSON.stringify(settings, null, 2)}\n`);

	console.log(
		`  ✓ added a PreToolUse guard on Bash to ` +
			`${path.relative(projectRoot, settingsPath)}`,
	);
	console.log(
		`\n[@cirthcss/cirth] Claude Code PreToolUse guard installed.\n` +
			`  It refuses local npm publishing, stage approval, dist-tag edits, ` +
			`and direct\n  pushes to master or a release tag.\n` +
			`  Per-machine and gitignored: this file is not project ` +
			`configuration.\n` +
			`  Restart the Claude Code session for it to take effect.`,
	);
};

main();
