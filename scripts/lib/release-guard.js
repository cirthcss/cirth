// One definition of "this would bypass the release process", read by both
// local guards.
//
// The Git pre-push hook sees real refs — it knows exactly what is being
// pushed, because Git tells it. The Claude Code PreToolUse hook sees a
// command string and has to work out what it would do. Those are different
// problems, but they must not come to different conclusions about which
// branches and tags are protected, so both answers are derived here.
//
// Neither guard is a security boundary. The machine owner can pass
// --no-verify, repoint core.hooksPath, or edit these files. They exist to
// stop an accident and to make the canonical path the path of least
// resistance; GitHub rulesets and npm's own 2FA are what actually refuse.

/** Branches whose history may only change through a pull request. */
const protectedBranches = ["master"];

/** Release tags. Created only as part of the canonical release. */
const protectedTagPattern = /^v\d/;

/** Where the repository keeps its tracked Git hooks. */
const hooksPath = ".githooks";

const canonicalPath =
	"Push the working branch and open a pull request instead. " +
	"RELEASING.md has the process.";

/**
 * @typedef {object} Verdict
 * @property {boolean} blocked
 * @property {string} [reason] why, and what to do instead
 */

/** @type {Verdict} */
const allowed = { blocked: false };

/**
 * @param {string} reason
 * @returns {Verdict}
 */
const block = (reason) => ({ blocked: true, reason });

// --- Refs, for the Git hook -------------------------------------------

/**
 * A ref name as it will exist on the remote, whatever spelling the local
 * side used. Git hands the hook the fully-qualified remote ref, so this is
 * mostly a lookup, but the tag and branch cases read differently.
 *
 * @param {string} remoteRef e.g. `refs/heads/master`, `refs/tags/v0.15.0`
 * @returns {Verdict}
 */
const classifyRef = (remoteRef) => {
	const branch = remoteRef.startsWith("refs/heads/")
		? remoteRef.slice("refs/heads/".length)
		: null;

	if (branch !== null && protectedBranches.includes(branch)) {
		return block(
			`Direct pushes to ${branch} are blocked by the Cirth release ` +
				`policy.\n  ${canonicalPath}`,
		);
	}

	const tag = remoteRef.startsWith("refs/tags/")
		? remoteRef.slice("refs/tags/".length)
		: null;

	if (tag !== null && protectedTagPattern.test(tag)) {
		return block(
			`${tag} is a release tag. Release tags are created as part of the ` +
				`canonical release, never pushed by hand.\n` +
				`  See RELEASING.md, Phase C.`,
		);
	}

	return allowed;
};

/**
 * The pre-push protocol: one line per ref, `<local ref> <local sha>
 * <remote ref> <remote sha>`. A deletion arrives with an all-zero local
 * sha and is judged the same way — deleting master is not safer than
 * pushing to it.
 *
 * @param {string} stdin
 * @returns {Verdict[]}
 */
const classifyPush = (stdin) =>
	stdin
		.split("\n")
		.map((line) => line.trim())
		.filter(Boolean)
		.map((line) => {
			const [, , remoteRef] = line.split(/\s+/);
			return remoteRef ? classifyRef(remoteRef) : allowed;
		})
		.filter((verdict) => verdict.blocked);

// --- Commands, for the Claude Code hook --------------------------------

/**
 * Enough of a shell tokenizer for the commands agents actually write:
 * quotes, escapes, and the operators that separate one command from the
 * next. Not a shell — a command hidden inside `$(…)` or an alias is not
 * caught here, and is not meant to be. The Git hook sees those anyway,
 * because they still end up invoking git.
 *
 * @param {string} input
 * @returns {string[][]} one token list per command segment
 */
const segments = (input) => {
	/** @type {string[][]} */
	const commands = [];
	/** @type {string[]} */
	let current = [];
	let token = "";
	let quote = "";
	let started = false;

	const endToken = () => {
		if (started) {
			current.push(token);
			token = "";
			started = false;
		}
	};
	const endCommand = () => {
		endToken();
		if (current.length > 0) {
			commands.push(current);
			current = [];
		}
	};

	for (let index = 0; index < input.length; index += 1) {
		const character = input[index];

		if (quote) {
			if (character === quote) {
				quote = "";
			} else if (character === "\\" && quote === '"') {
				index += 1;
				token += input[index] ?? "";
			} else {
				token += character;
			}
			continue;
		}

		if (character === "'" || character === '"') {
			quote = character;
			started = true;
			continue;
		}

		if (character === "\\") {
			index += 1;
			token += input[index] ?? "";
			started = true;
			continue;
		}

		if (/\s/.test(character)) {
			endToken();
			continue;
		}

		// Separators. `&&`, `||` and `|` are two characters or one; `;` and
		// a newline are always one.
		if (character === ";" || character === "&" || character === "|") {
			endCommand();
			if (input[index + 1] === character) {
				index += 1;
			}
			continue;
		}

		token += character;
		started = true;
	}

	endCommand();
	return commands;
};

/**
 * `git -C dir --no-pager push …` — strip the options git itself takes
 * before the subcommand, so the subcommand can be found.
 *
 * @param {string[]} tokens
 * @returns {string[]} tokens from the subcommand onwards
 */
const afterGitOptions = (tokens) => {
	let index = 1;
	while (index < tokens.length) {
		const token = tokens[index];
		if (token === "-C" || token === "-c" || token === "--git-dir" || token === "--work-tree") {
			index += 2;
			continue;
		}
		if (token.startsWith("-")) {
			index += 1;
			continue;
		}
		break;
	}
	return tokens.slice(index);
};

/**
 * @param {string[]} tokens `push` onwards
 * @returns {Verdict}
 */
const classifyGitPush = (tokens) => {
	const flags = tokens.filter((token) => token.startsWith("-"));
	const operands = tokens.slice(1).filter((token) => !token.startsWith("-"));

	if (flags.includes("--no-verify")) {
		return block(
			"`--no-verify` skips the repository's pre-push guard.\n" +
				"  If a guard is refusing a push, follow the canonical process " +
				"instead of switching the guard off. See AGENTS.md.",
		);
	}

	for (const flag of ["--tags", "--follow-tags", "--mirror", "--all"]) {
		if (flags.includes(flag)) {
			return block(
				`\`${flag}\` can push release tags or protected branches ` +
					`wholesale.\n  Push the specific ref you mean. See RELEASING.md.`,
			);
		}
	}

	// operands[0] is the remote; the rest are refspecs. A bare `git push`
	// names nothing, and is deliberately left to the Git hook, which can
	// see which branch is actually checked out.
	for (const refspec of operands.slice(1)) {
		// `+src:dst`, `src:dst`, or a bare name that is both.
		const destination = refspec.includes(":")
			? refspec.slice(refspec.indexOf(":") + 1)
			: refspec.replace(/^\+/, "");

		const name = destination.replace(/^refs\/(heads|tags)\//, "");

		if (protectedBranches.includes(name)) {
			return block(
				`Direct pushes to ${name} are not allowed.\n  ${canonicalPath}`,
			);
		}
		if (protectedTagPattern.test(name)) {
			return block(
				`${name} is a release tag. Release tags belong to the canonical ` +
					`release process.\n  See RELEASING.md, Phase C.`,
			);
		}
	}

	return allowed;
};

/**
 * @param {string[]} tokens `config` onwards
 * @returns {Verdict}
 */
const classifyGitConfig = (tokens) => {
	const mentionsHooks = tokens.some((token) =>
		token.toLowerCase().includes("core.hookspath"),
	);
	if (!mentionsHooks) {
		return allowed;
	}
	// Reading is fine, and `check:hooks` does exactly that.
	const reading = tokens.some((token) =>
		["--get", "--get-all", "--list", "-l", "--get-regexp"].includes(token),
	);
	if (reading) {
		return allowed;
	}
	// Pointing it AT the guard is the sanctioned setup, which is what
	// `npm run setup:hooks` does. Pointing it anywhere else turns the guard
	// off, which is the thing worth refusing.
	if (tokens.includes(hooksPath)) {
		return allowed;
	}
	return block(
		"Changing `core.hooksPath` would disable the repository's pre-push " +
			"guard.\n  Never reconfigure a safeguard as part of a release task. " +
			"See AGENTS.md.",
	);
};

/** Read-only npm staging subcommands, which are how a stage is inspected. */
const readOnlyStage = ["list", "ls", "view", "download", "reject"];

/**
 * @param {string[]} tokens the whole npm command
 * @returns {Verdict}
 */
const classifyNpm = (tokens) => {
	const words = tokens.slice(1).filter((token) => !token.startsWith("-"));
	const [command, subcommand] = words;

	if (command === "publish") {
		if (tokens.includes("--dry-run")) {
			return allowed;
		}
		return block(
			"Do not publish npm packages from a local shell.\n" +
				"  Use the canonical GitHub release workflow, which stages the " +
				"package via OIDC:\n" +
				"    gh workflow run npm-publish.yml --ref master \\\n" +
				"      -f tag=vX.Y.Z -f channel=<beta|rc|latest> -f mode=stage",
		);
	}

	if (command === "stage") {
		if (subcommand === "publish") {
			return block(
				"Staging is done by the release workflow over GitHub OIDC, not " +
					"from a local shell.\n" +
					"  gh workflow run npm-publish.yml --ref master " +
					"-f tag=vX.Y.Z -f channel=<c> -f mode=stage",
			);
		}
		if (subcommand === "approve") {
			return block(
				"Approving a staged package is the maintainer's checkpoint.\n" +
					"  It requires 2FA and is not an agent action. Report the stage " +
					"id and stop. See RELEASING.md, Checkpoint 2.",
			);
		}
		if (subcommand !== undefined && !readOnlyStage.includes(subcommand)) {
			return block(
				`\`npm stage ${subcommand}\` is not a read-only staging command.\n` +
					`  Inspect a stage with list, view or download; reject is the ` +
					`recovery path.`,
			);
		}
		return allowed;
	}

	if (command === "dist-tag" && ["add", "rm", "remove"].includes(subcommand)) {
		return block(
			"dist-tags are derived from the version by the release workflow, " +
				"never set by hand.\n" +
				"  Moving `latest` onto a prerelease is exactly what the beta " +
				"channel exists to prevent. See RELEASING.md, Channels.",
		);
	}

	return allowed;
};

/**
 * @param {string} command a shell command string, as an agent would run it
 * @returns {Verdict}
 */
const classifyCommand = (command) => {
	for (const tokens of segments(command)) {
		if (tokens.length === 0) {
			continue;
		}

		// `env FOO=bar git push …`, `sudo npm publish` — step over the
		// wrapper rather than being fooled by it.
		let words = tokens;
		while (
			words.length > 1 &&
			(["env", "sudo", "command", "nice", "time"].includes(words[0]) ||
				/^[A-Za-z_][A-Za-z0-9_]*=/.test(words[0]))
		) {
			words = words.slice(1);
		}

		const program = (words[0] ?? "").split("/").pop() ?? "";

		if (program === "git") {
			const rest = afterGitOptions(words);
			const verdict =
				rest[0] === "push"
					? classifyGitPush(rest)
					: rest[0] === "config"
						? classifyGitConfig(rest)
						: allowed;
			if (verdict.blocked) {
				return verdict;
			}
		}

		if (program === "npm") {
			const verdict = classifyNpm(words);
			if (verdict.blocked) {
				return verdict;
			}
		}
	}

	return allowed;
};

module.exports = {
	classifyCommand,
	hooksPath,
	classifyPush,
	classifyRef,
	protectedBranches,
	protectedTagPattern,
	segments,
};
