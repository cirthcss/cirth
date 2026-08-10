const { spawnSync } = require("node:child_process");

// Shared error handling around spawnSync: build.js (prettier, stylelint,
// the check-css-variables step) and process-css.js (the Lightning CSS
// binary) both need "run this, print the underlying error, and exit
// non-zero on failure" — this is that, once.
/**
 * @param {string} command
 * @param {readonly string[]} args
 * @param {import("node:child_process").SpawnSyncOptions} [options]
 */
const runSync = (command, args, options = {}) => {
	const result = spawnSync(command, args, { stdio: "inherit", ...options });

	if (result.error) {
		console.error(result.error.message);
		process.exit(1);
	}

	if (result.status !== 0) {
		process.exit(result.status || 1);
	}
};

module.exports = { runSync };
