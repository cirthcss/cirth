const { classifyPush } = require("./lib/release-guard");

// The decision half of .githooks/pre-push, in Node so it shares one
// definition of "protected" with the Claude Code command guard rather than
// growing a second one in shell.
//
// Reads the pre-push protocol on stdin — `<local ref> <local sha>
// <remote ref> <remote sha>`, one line per ref — and exits non-zero if any
// of them may not be pushed by hand.

/** @type {string[]} */
const chunks = [];

process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => chunks.push(String(chunk)));

process.stdin.on("end", () => {
	const blocked = classifyPush(chunks.join(""));

	if (blocked.length === 0) {
		process.exit(0);
	}

	process.stdout.write(
		`\n✗ Push refused by the Cirth release policy.\n\n` +
			blocked.map((verdict) => `  ${verdict.reason}\n`).join("\n") +
			`\n  This guard is local. It is here to stop an accident, not to ` +
			`be worked around:\n  do not re-run with --no-verify.\n`,
	);
	process.exit(1);
});
