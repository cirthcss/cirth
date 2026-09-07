const { classifyCommand } = require("./lib/release-guard");

// A Claude Code PreToolUse hook: refuses the release commands an agent
// must never run directly, before the shell sees them.
//
// The Git pre-push hook already covers pushes, and covers them better —
// it sees the resolved refs rather than a command string. This exists for
// the half Git cannot see: `npm publish`, `npm stage approve`, a dist-tag
// moved by hand. Those never touch Git, so nothing else local would
// notice them.
//
// It reads the documented PreToolUse input on stdin and blocks with exit
// code 2, which Claude Code treats as an unconditional refusal and whose
// stderr is shown to the model. Failing closed matters more than a tidy
// payload here: a malformed JSON reply would let the call through.
//
// Per-machine, installed by scripts/setup-claude-hooks.js into
// .claude/settings.local.json. Not the source of truth for the policy —
// that is RELEASING.md — and not a boundary either, since whoever owns the
// machine owns the settings file.

/** @type {string[]} */
const chunks = [];

process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => chunks.push(String(chunk)));

process.stdin.on("end", () => {
	/** @type {{ tool_name?: string, tool_input?: { command?: string } }} */
	let payload;

	try {
		payload = JSON.parse(chunks.join(""));
	} catch {
		// Not something this hook understands. Say nothing rather than
		// blocking every tool call in the session.
		process.exit(0);
	}

	if (payload.tool_name !== "Bash") {
		process.exit(0);
	}

	const command = payload.tool_input?.command;
	if (typeof command !== "string" || command.length === 0) {
		process.exit(0);
	}

	const verdict = classifyCommand(command);
	if (!verdict.blocked) {
		process.exit(0);
	}

	process.stderr.write(
		`Blocked by the Cirth release policy.\n\n${verdict.reason}\n\n` +
			`Do not work around this guard — not with --no-verify, not by ` +
			`editing hook\nconfiguration. Follow the canonical process in ` +
			`RELEASING.md, and if it genuinely\ndoes not cover this case, stop ` +
			`and say so.\n`,
	);
	process.exit(2);
});
