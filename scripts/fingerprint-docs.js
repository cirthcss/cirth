const fs = require("node:fs");
const path = require("node:path");
const { contextKey, walkSite } = require("./lib/docs-fingerprint");

// A reproducible measurement of what the built docs site renders.
//
//   node scripts/fingerprint-docs.js --out .cache/before.json
//   …make the change, npm run docs:build…
//   node scripts/fingerprint-docs.js --compare .cache/before.json
//
// One entry per (page, viewport, scheme, state): a hash over every
// element's box and its paint-bearing computed properties, plus the same
// hash per element so a difference can be pointed at rather than merely
// announced. Two states per page — as loaded, and with every <details>,
// <dialog> and popover opened — because the surfaces a shell gets wrong
// are usually the ones that are not on screen when the page arrives.
//
// It answers one question: did this change move anything a reader can see?
// It is not a screenshot suite and does not replace one — no fonts, no
// rasterization, no baselines to bless. Use it to make a refactor's "no
// visual change" claim checkable in a few minutes.

const args = process.argv.slice(2);
/** @param {string} flag */
const flag = (flag) => {
	const at = args.indexOf(flag);
	return at === -1 ? undefined : args[at + 1];
};

const outPath = flag("--out");
const comparePath = flag("--compare");
const only = flag("--page");
const detail = Number(flag("--detail") ?? 12);

/** @type {Record<string, { hash: string, elements: number, digest: Record<string, string> }>} */
const fingerprint = {};

/** @type {string[]} */
const unstable = [];

const run = async () => {
	const started = Date.now();

	await walkSite({
		label: "fingerprint-docs",
		pages: only ? [only] : undefined,
		onPage: async (page, context) => {
			const measured = await page.evaluate(() =>
				window.__cirthAudit.collectStable(),
			);
			if (measured.unstable) {
				unstable.push(contextKey(context));
			}
			fingerprint[contextKey(context)] = measured;
		},
	});

	const keys = Object.keys(fingerprint).sort();
	const elements = keys.reduce((sum, key) => sum + fingerprint[key].elements, 0);
	const seconds = ((Date.now() - started) / 1000).toFixed(1);

	console.log(
		`[@cirthcss/cirth] Fingerprinted ${keys.length} renderings, ${elements} element measurements, in ${seconds}s`,
	);

	if (unstable.length > 0) {
		console.warn(
			`[@cirthcss/cirth] ${unstable.length} rendering(s) never settled and are not comparable:\n` +
				unstable.map((key) => `- ${key}`).join("\n"),
		);
	}

	if (outPath) {
		const resolved = path.resolve(outPath);
		fs.mkdirSync(path.dirname(resolved), { recursive: true });
		fs.writeFileSync(
			resolved,
			JSON.stringify({ createdAt: new Date().toISOString(), fingerprint }),
		);
		console.log(`[@cirthcss/cirth] Wrote ${outPath}`);
	}

	if (!comparePath) {
		return 0;
	}

	const previous = JSON.parse(fs.readFileSync(comparePath, "utf8")).fingerprint;
	const allKeys = [
		...new Set([...Object.keys(previous), ...keys]),
	].sort();

	/** @type {string[]} */
	const changed = [];
	for (const key of allKeys) {
		const before = previous[key];
		const after = fingerprint[key];
		if (!before) {
			changed.push(`+ ${key} (new rendering)`);
			continue;
		}
		if (!after) {
			changed.push(`- ${key} (rendering gone)`);
			continue;
		}
		if (before.hash === after.hash) continue;

		const moved = Object.keys({ ...before.digest, ...after.digest }).filter(
			(element) => before.digest[element] !== after.digest[element],
		);
		changed.push(
			`~ ${key} — ${moved.length} element${moved.length === 1 ? "" : "s"} differ\n` +
				moved
					.slice(0, detail)
					.map((element) => `    ${element}`)
					.join("\n") +
				(moved.length > detail ? `\n    …and ${moved.length - detail} more` : ""),
		);
	}

	if (changed.length === 0) {
		console.log(
			`[@cirthcss/cirth] Identical to ${comparePath} across all ${keys.length} renderings`,
		);
		return 0;
	}

	console.error(
		`\n[@cirthcss/cirth] ${changed.length} rendering(s) differ from ${comparePath}:\n`,
	);
	for (const entry of changed) console.error(entry);
	return 1;
};

run().then(
	(code) => process.exit(code),
	(error) => {
		console.error(error);
		process.exit(1);
	},
);
