const fs = require("node:fs");
const path = require("node:path");

const { compareVersions, parseVersion } = require("./version");

const projectRoot = path.join(__dirname, "../..");

// The version the documentation tells a reader to install, which is not
// always the version in package.json, and during a prerelease series it
// must not be.
//
// A `<link>` in the README is an instruction to a reader, and the reader
// asked for the framework, not for a beta of it: the same reason a
// prerelease never takes the `latest` dist-tag. While package.json is at
// 0.15.0-beta.1, the snippets keep pointing at the last stable release, so
// `npm install` and the CDN say the same thing.
//
// The stable line is read from .github/releases/, which gains a file per
// release and is therefore the one list in the repository that cannot fall
// behind the tags without somebody noticing.
//
// scripts/update-sri.js pins every documented CDN `<link>` to this version,
// and the docs build hands it to the pages as `release.version`, so a
// command that downloads a file names the same version as the snippets.

/** @param {string} [root] */
const documentedVersion = (root = projectRoot) => {
	const { version } = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
	const parsed = parseVersion(version);
	if (parsed.channel === null) return version;

	const releaseNotesDir = path.join(root, ".github/releases");
	const released = fs
		.readdirSync(releaseNotesDir)
		.flatMap((entry) => {
			const match = /^v(\d+\.\d+\.\d+)\.md$/.exec(entry);
			return match ? [parseVersion(match[1])] : [];
		})
		.sort(compareVersions);

	if (released.length === 0) {
		throw new Error(
			`${version} is a prerelease, so the documented CDN snippets should ` +
				`stay on the last stable release, but ${path.relative(
					root,
					releaseNotesDir,
				)} lists none.`,
		);
	}

	return released[0].raw;
};

module.exports = { documentedVersion };
