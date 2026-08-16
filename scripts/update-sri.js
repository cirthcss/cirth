const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const { version } = require("../package.json");

const projectRoot = path.join(__dirname, "..");
const cdnOrigin = "https://cdn.jsdelivr.net/npm/@cirthcss/cirth";

// Subresource Integrity for the documented CDN snippets. Every
// `<link>` that points at jsDelivr carries the sha384 digest of the exact
// file the pinned version serves, so a tampered or swapped CDN response is
// refused by the browser instead of styling the page.
//
// The digest is only meaningful next to the version it was taken from, so
// this script rewrites the pin and the hash together. Two sources for the
// bytes:
// - local dist/ (default), the release-prep flow: bump the version, build,
//   run this, and the hash covers the artifact that is about to be
//   published. The build is reproducible, so the file npm publishes from CI
//   is byte-identical to the local one.
// - the CDN itself (`--from-cdn`), ground truth after publishing, for
//   fixing up a release or regenerating from a tree that has moved on.
//
// `--check` never writes: on its own it verifies the snippets are pinned to
// the current version and carry a well-formed hash (cheap enough for
// `npm run lint`), and with `--from-cdn` it verifies the committed hashes
// against what jsDelivr actually serves.
const writeMode = !process.argv.includes("--check");
const fromCdn = process.argv.includes("--from-cdn");

const integrityPattern = /^sha384-[A-Za-z0-9+/]+={0,2}$/;
const linkTagPattern = new RegExp(
	`<link\\b[^>]*${cdnOrigin.replace(/[.*+?^$()|[\]\\]/g, "\\$&")}@[^>]*>`,
	"g",
);
const attributePattern = /([a-zA-Z][a-zA-Z0-9-]*)(?:="([^"]*)")?/g;
const hrefPattern = new RegExp(`^${cdnOrigin}@([^/]+)/(.+)$`);

/** @param {string} folder @returns {string[]} */
const getMarkdownFiles = (folder) =>
	fs
		.readdirSync(folder, { withFileTypes: true })
		.flatMap((entry) => {
			const filename = path.join(folder, entry.name);

			if (entry.isDirectory()) {
				return getMarkdownFiles(filename);
			}

			return entry.name.endsWith(".md") ? [filename] : [];
		})
		.sort();

// Hand-written pages only. `.github/releases/*.md` quote the snippet as it
// stood for a past version and are historical records, not instructions.
const documents = [
	path.join(projectRoot, "README.md"),
	...getMarkdownFiles(path.join(projectRoot, "docs/src/pages")),
];

/** @param {Buffer} contents */
const digest = (contents) =>
	`sha384-${crypto.createHash("sha384").update(contents).digest("base64")}`;

/** @type {Map<string, Promise<string>>} */
const digestCache = new Map();

/**
 * @param {string} pinnedVersion
 * @param {string} file
 * @returns {Promise<string>}
 */
const integrityFor = (pinnedVersion, file) => {
	const url = `${cdnOrigin}@${pinnedVersion}/${file}`;
	const cached = digestCache.get(url);

	if (cached) {
		return cached;
	}

	const pending = fromCdn
		? fetch(url).then(async (response) => {
				if (!response.ok) {
					throw new Error(
						`${url}: jsDelivr answered ${response.status}. ` +
							`Is ${pinnedVersion} published yet?`,
					);
				}
				return digest(Buffer.from(await response.arrayBuffer()));
			})
		: (async () => {
				const filePath = path.join(projectRoot, file);
				if (!fs.existsSync(filePath)) {
					throw new Error(`${file} not found: run \`npm run build\` first.`);
				}
				return digest(fs.readFileSync(filePath));
			})();

	digestCache.set(url, pending);
	return pending;
};

/**
 * Attributes in source order, so rewriting a tag keeps whatever else it
 * carries instead of regenerating a fixed shape.
 *
 * @param {string} tag
 * @returns {[string, string | undefined][]}
 */
const parseAttributes = (tag) => {
	const body = tag.slice("<link".length, -1);
	return [...body.matchAll(attributePattern)].map((match) => [
		match[1],
		match[2],
	]);
};

/**
 * @param {[string, string | undefined][]} attributes
 * @param {string} indent
 */
const serializeTag = (attributes, indent) => {
	const parts = attributes.map(([name, value]) =>
		value === undefined ? name : `${name}="${value}"`,
	);
	const singleLine = `<link ${parts.join(" ")}>`;

	// The href alone is ~75 columns and the hash adds ~85 more, so a tag
	// carrying integrity always wraps: one attribute per line, which is
	// also what makes rewriting idempotent.
	if (singleLine.length <= 80) {
		return singleLine;
	}

	return `<link\n${parts.map((part) => `${indent}  ${part}`).join("\n")}>`;
};

/**
 * @param {[string, string | undefined][]} attributes
 * @param {string} name
 * @param {string} value
 */
const setAttribute = (attributes, name, value) => {
	const existing = attributes.findIndex(([attribute]) => attribute === name);

	if (existing === -1) {
		attributes.push([name, value]);
	} else {
		attributes[existing] = [name, value];
	}
};

/** @type {string[]} */
const violations = [];
/** @type {string[]} */
const rewritten = [];
let snippets = 0;

/** @param {string} source @param {number} index */
const lineAt = (source, index) => source.slice(0, index).split("\n").length;

/** @param {string} filename */
const processDocument = async (filename) => {
	const relativeFilename = path.relative(projectRoot, filename);
	const source = fs.readFileSync(filename, "utf8");
	let output = "";
	let cursor = 0;

	for (const match of source.matchAll(linkTagPattern)) {
		const tag = match[0];
		const index = /** @type {number} */ (match.index);
		const location = `${relativeFilename}:${lineAt(source, index)}`;
		const attributes = parseAttributes(tag);
		const href = attributes.find(([name]) => name === "href")?.[1] ?? "";
		const hrefParts = href.match(hrefPattern);

		if (!hrefParts) {
			violations.push(`${location} unparseable jsDelivr href \`${href}\``);
			continue;
		}

		snippets += 1;

		const [, pinnedVersion, file] = hrefParts;
		const integrity = attributes.find(([name]) => name === "integrity")?.[1];
		const crossorigin = attributes.find(([name]) => name === "crossorigin")?.[1];

		if (writeMode) {
			const lineStart = source.lastIndexOf("\n", index) + 1;
			const indent = source.slice(lineStart, index).match(/^\s*/)?.[0] ?? "";

			setAttribute(attributes, "href", `${cdnOrigin}@${version}/${file}`);
			setAttribute(attributes, "integrity", await integrityFor(version, file));
			setAttribute(attributes, "crossorigin", "anonymous");

			output += source.slice(cursor, index) + serializeTag(attributes, indent);
			cursor = index + tag.length;
			continue;
		}

		if (pinnedVersion !== version) {
			violations.push(
				`${location} pins ${pinnedVersion}, but package.json is at ` +
					`${version}. Run \`npm run sri\` to repin and rehash.`,
			);
			continue;
		}

		if (!integrity) {
			violations.push(
				`${location} has no integrity attribute. Run \`npm run sri\`.`,
			);
			continue;
		}

		if (!integrityPattern.test(integrity)) {
			violations.push(`${location} has a malformed hash \`${integrity}\`.`);
			continue;
		}

		// Without crossorigin the browser sends an opaque no-CORS request,
		// which SRI cannot check and therefore blocks outright.
		if (crossorigin !== "anonymous") {
			violations.push(
				`${location} needs crossorigin="anonymous" for the ` +
					`integrity check to run.`,
			);
			continue;
		}

		if (fromCdn) {
			const published = await integrityFor(pinnedVersion, file);

			if (published !== integrity) {
				violations.push(
					`${location} does not match the published file:\n` +
						`    documented ${integrity}\n` +
						`    served     ${published}`,
				);
			}
		}
	}

	if (!writeMode) {
		return;
	}

	output += source.slice(cursor);

	if (output !== source) {
		fs.writeFileSync(filename, output);
		rewritten.push(relativeFilename);
	}
};

const main = async () => {
	for (const filename of documents) {
		try {
			await processDocument(filename);
		} catch (error) {
			violations.push(
				`${path.relative(projectRoot, filename)}: ${
					error instanceof Error ? error.message : String(error)
				}`,
			);
		}
	}

	if (violations.length > 0) {
		console.error("[@cirthcss/cirth] Subresource Integrity problems:\n");
		violations.forEach((violation) => {
			console.error(`- ${violation}`);
		});

		process.exit(1);
	}

	const source = fromCdn ? "the published CDN files" : "dist/";

	if (!writeMode) {
		console.log(
			`[@cirthcss/cirth] Checked ${snippets} CDN snippet(s) against ` +
				`${fromCdn ? source : `version ${version}`}`,
		);
		return;
	}

	console.log(
		rewritten.length > 0
			? `[@cirthcss/cirth] Hashed ${snippets} CDN snippet(s) from ${source}: ` +
					`updated ${rewritten.join(", ")}`
			: `[@cirthcss/cirth] ${snippets} CDN snippet(s) already match ${source}`,
	);
};

main();
