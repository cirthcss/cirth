// The custom property prefix is written literally as `--cirth-` throughout
// src/, and that is what the default build ships. A consumer who embeds
// Cirth next to a design system that already owns the namespace can build
// the same artifact under another prefix (gh#126):
//
//   npm run build -- --prefix "--acme-"
//
// The rename happens once, on the CSS Sass emits and before Lightning CSS
// sees it, so the sources keep one spelling and every build step after the
// compile (transform, minify, the dist checks) runs on the result
// unchanged. scripts/check-prefix.js proves a prefixed build differs from
// the default one by the prefix alone.

const DEFAULT_PREFIX = "--cirth-";

// A dashed ident that still reads as a namespace once a token name is
// appended: `--acme-` + `primary`. The trailing hyphen is required so that
// `--acme` cannot silently produce `--acmeprimary`.
const PREFIX_PATTERN = /^--[A-Za-z_][A-Za-z0-9_-]*-$/;

// `--cirth-` only where it starts an identifier: not after another ident
// character, so a longer name that merely contains it is left alone.
const DEFAULT_PREFIX_PATTERN = /(?<![A-Za-z0-9_\\-])--cirth-/g;

/**
 * @param {string} prefix
 * @returns {string | null} why the prefix is rejected, or null when valid
 */
const validatePrefix = (prefix) => {
	if (!PREFIX_PATTERN.test(prefix)) {
		return (
			`"${prefix}" is not a valid custom property prefix: it must start ` +
			`with "--", continue with a letter or "_", use only letters, ` +
			`digits, "-" and "_", and end with "-" (for example "--acme-").`
		);
	}
	return null;
};

/**
 * Reads `--prefix <value>` or `--prefix=<value>` from an argument list. The
 * value itself starts with `--`, so it is taken positionally rather than
 * through a generic option parser that would read it as another flag.
 *
 * @param {readonly string[]} argv
 * @returns {string}
 */
const readPrefixArg = (argv) => {
	let prefix = DEFAULT_PREFIX;

	for (let index = 0; index < argv.length; index++) {
		const arg = argv[index];

		if (arg === "--prefix") {
			const value = argv[index + 1];
			if (value === undefined) {
				throw new Error('--prefix needs a value, for example --prefix "--acme-".');
			}
			prefix = value;
			index++;
		} else if (arg.startsWith("--prefix=")) {
			prefix = arg.slice("--prefix=".length);
		}
	}

	const problem = validatePrefix(prefix);
	if (problem) {
		throw new Error(problem);
	}
	return prefix;
};

/**
 * @param {string} css
 * @param {string} prefix
 * @returns {string}
 */
const applyPrefix = (css, prefix) =>
	prefix === DEFAULT_PREFIX
		? css
		: css.replace(DEFAULT_PREFIX_PATTERN, () => prefix);

module.exports = {
	DEFAULT_PREFIX,
	applyPrefix,
	readPrefixArg,
	validatePrefix,
};
