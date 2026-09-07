// The version grammar this project actually issues, and nothing wider.
//
// A general SemVer parser shrugs at `0.15.0-beta` (no number) and
// `0.15.0-beta.01` (leading zero); a release must not. Both of those sort
// unpredictably against their neighbours — `beta` < `beta.1` but `beta.01`
// is a *string* identifier and sorts after every numeric one — so a series
// that contains either has no reliable "latest beta". They are errors here.
//
// The whole npm channel model falls out of one rule:
//
//   dist-tag = the prerelease identifier, or `latest` when there is none.
//
// so `0.15.0-beta.1` publishes under `beta`, `0.15.0-rc.1` under `rc`, and
// `0.15.0` under `latest`. Nothing has to remember a mapping table, and a
// tag can never be paired with a channel it does not name.

/** The prerelease identifiers a release may use. */
const prereleaseChannels = ["alpha", "beta", "rc"];

/**
 * @typedef {object} ParsedVersion
 * @property {string} raw
 * @property {number} major
 * @property {number} minor
 * @property {number} patch
 * @property {string | null} channel prerelease identifier, or null
 * @property {number | null} iteration prerelease number, or null
 */

const versionPattern = new RegExp(
	// X.Y.Z with no leading zeroes,
	"^(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)" +
		// optionally -<identifier>.<n>, the identifier from the list above
		// and the number likewise free of leading zeroes.
		`(?:-(${prereleaseChannels.join("|")})\\.(0|[1-9]\\d*))?$`,
);

/**
 * @param {string} value
 * @returns {ParsedVersion}
 */
const parseVersion = (value) => {
	const match = versionPattern.exec(value);

	if (!match) {
		throw new Error(
			`\`${value}\` is not a version this project can release. ` +
				`Expected X.Y.Z, optionally followed by ` +
				`${prereleaseChannels.map((name) => `-${name}.N`).join(", ")} ` +
				`(for example 0.15.0 or 0.15.0-beta.1).`,
		);
	}

	const [, major, minor, patch, channel, iteration] = match;

	return {
		raw: value,
		major: Number(major),
		minor: Number(minor),
		patch: Number(patch),
		channel: channel ?? null,
		iteration: iteration === undefined ? null : Number(iteration),
	};
};

/**
 * The npm dist-tag a version belongs under. A prerelease never lands on
 * `latest`: that tag is what a bare `npm install` resolves to, and moving
 * it is how a beta reaches people who did not ask for one.
 *
 * @param {ParsedVersion} version
 * @returns {string}
 */
const distTagFor = (version) => version.channel ?? "latest";

/**
 * @param {string} value a git tag, e.g. `v0.15.0-beta.1`
 * @returns {ParsedVersion}
 */
const parseTag = (value) => {
	if (!value.startsWith("v")) {
		throw new Error(`Tag \`${value}\` must start with \`v\`.`);
	}
	return parseVersion(value.slice(1));
};

/**
 * Newest first, so `sort(compareVersions)[0]` is the highest. A release
 * outranks its own prereleases (0.15.0 > 0.15.0-beta.2), which is what
 * SemVer §11 says and what "the last stable" has to mean.
 *
 * @param {ParsedVersion} a
 * @param {ParsedVersion} b
 * @returns {number}
 */
const compareVersions = (a, b) => {
	for (const key of /** @type {const} */ (["major", "minor", "patch"])) {
		if (a[key] !== b[key]) {
			return b[key] - a[key];
		}
	}

	if (a.channel === null && b.channel === null) {
		return 0;
	}
	if (a.channel === null) {
		return -1;
	}
	if (b.channel === null) {
		return 1;
	}
	if (a.channel !== b.channel) {
		return (
			prereleaseChannels.indexOf(b.channel) -
			prereleaseChannels.indexOf(a.channel)
		);
	}
	return (b.iteration ?? 0) - (a.iteration ?? 0);
};

module.exports = {
	compareVersions,
	distTagFor,
	parseTag,
	parseVersion,
	prereleaseChannels,
};
