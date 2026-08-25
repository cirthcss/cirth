const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.join(__dirname, "..");
const manifest = path.join(projectRoot, "package.json");

// The Browserslist target names ten browser families, but it only ever
// describes *one* engine floor: Opera and Samsung Internet are Chromium
// forks, Firefox for Android ships the same Gecko as the desktop build,
// and iOS Safari is WebKit either way. Saying "Chrome >= 123" while
// leaving "Opera >= 97" behind does not widen support — it silently
// lowers the floor to Chromium 111, because Lightning CSS compiles for
// the oldest engine in the list. Nothing else in the repository notices:
// the build succeeds, the output is valid, and every feature the floor
// was raised to buy quietly stops being guaranteed.
//
// So this check asserts the invariant rather than the numbers: whatever
// the floor is, every family has to express the same one.

// Chromium version -> the Opera and Samsung Internet releases built on
// it. Derived from MDN's browser-compat-data by collecting, across every
// CSS/HTML/API feature it records, the (chrome, opera) and (chrome,
// samsung) version pairs a feature landed in, and taking the median per
// Chromium version. Regenerate the same way if the range needs
// extending — the forks skip versions often enough that guessing an
// offset goes wrong within a year.
/** @type {Record<number, { opera: number, samsung: number }>} */
const CHROMIUM_FORKS = {
	111: { opera: 97, samsung: 22 },
	112: { opera: 98, samsung: 23 },
	113: { opera: 99, samsung: 23 },
	114: { opera: 100, samsung: 23 },
	115: { opera: 101, samsung: 23 },
	116: { opera: 102, samsung: 24 },
	117: { opera: 103, samsung: 24 },
	118: { opera: 104, samsung: 25 },
	119: { opera: 105, samsung: 25 },
	120: { opera: 106, samsung: 25 },
	121: { opera: 107, samsung: 25 },
	122: { opera: 108, samsung: 26 },
	123: { opera: 109, samsung: 27 },
	124: { opera: 110, samsung: 27 },
	125: { opera: 111, samsung: 27 },
	126: { opera: 112, samsung: 28 },
	127: { opera: 113, samsung: 28 },
	128: { opera: 114, samsung: 28 },
	129: { opera: 115, samsung: 28 },
	130: { opera: 115, samsung: 28 },
	131: { opera: 116, samsung: 29 },
	132: { opera: 117, samsung: 29 },
	133: { opera: 118, samsung: 29 },
	134: { opera: 119, samsung: 29 },
	135: { opera: 120, samsung: 29 },
	136: { opera: 121, samsung: 29 },
	137: { opera: 121, samsung: 29 },
};

// Families that must be present, and how they relate to each other.
const CHROMIUM_FAMILIES = ["Chrome", "ChromeAndroid", "Edge"];
const PAIRED_FAMILIES = [
	["Firefox", "FirefoxAndroid"],
	["Safari", "iOS"],
];

/** @type {string[]} */
const UNCONSTRAINED = [];

// Never in the target. Its one modern caniuse entry is the same engine as
// Chrome for Android, already covered, and it accounts for 0.03% of
// usage — while including it makes Lightning CSS stop trusting grouped
// selectors and expand every `A, B { }` in the library into separate
// rules, 743 B gzipped and over the size budget.
// Opera Mobile was in the target until 2026-08-25, deliberately exempt
// from the floor. It is forbidden now, and the reason is not usage: it is
// that caniuse-lite pins the family to a single stale bucket, op_mob 80,
// which is the release where the engine went Chromium — not a version
// anyone still runs. Browserslist and Lightning CSS both read that bucket
// literally, so one dead data point held the whole build below the floor
// for light-dark(). Lightning then compiled every pair down to its
// --lightningcss-light/--lightningcss-dark emulation, and that emulation
// does not reproduce the native semantics: a [data-theme] subtree stopped
// resolving its own scheme entirely (verified in all three engines).
// Re-adding this family does not merely cost bytes — it silently breaks
// theme/_dual.scss. scripts/process-css.js fails the build if the
// emulation ever reappears.
const FORBIDDEN = [
	"Android",
	"AndroidBrowser",
	"and_chr_legacy",
	"OperaMobile",
];

/** @type {string[]} */
const violations = [];

/** @param {string} message */
const fail = (message) => {
	violations.push(message);
};

const { browserslist } = JSON.parse(fs.readFileSync(manifest, "utf8"));

if (!Array.isArray(browserslist)) {
	console.error("[@cirthcss/cirth] package.json has no browserslist array.");
	process.exit(1);
}

/** @type {Record<string, string>} */
const floor = {};

for (const entry of browserslist) {
	const match = /^([A-Za-z_]+)\s*>=\s*([\d.]+)$/.exec(String(entry).trim());

	if (!match) {
		fail(`\`${entry}\` is not a \`Family >= version\` entry`);
		continue;
	}

	const [, family, version] = match;

	if (floor[family]) {
		fail(`${family} is listed twice`);
	}

	floor[family] = version;
}

for (const family of FORBIDDEN) {
	if (floor[family]) {
		fail(
			`${family} must not be in the target — see the comment in this file`,
		);
	}
}

const required = [
	...CHROMIUM_FAMILIES,
	...PAIRED_FAMILIES.flat(),
	...UNCONSTRAINED,
	"Opera",
	"Samsung",
];

for (const family of required) {
	if (!floor[family]) {
		fail(`${family} is missing from the target`);
	}
}

// Every Chromium family at the same version, and the forks on the release
// built from it.
const [reference] = CHROMIUM_FAMILIES;
const chromium = floor[reference];

if (chromium) {
	for (const family of CHROMIUM_FAMILIES.slice(1)) {
		if (floor[family] && floor[family] !== chromium) {
			fail(
				`${family} >= ${floor[family]} disagrees with ${reference} >= ${chromium}` +
					` — both are Chromium, so both carry the same floor`,
			);
		}
	}

	const forks = CHROMIUM_FORKS[Number(chromium)];

	if (!forks) {
		fail(
			`Chromium ${chromium} is outside the table in this file. Extend it` +
				` the way its comment describes, rather than guessing an offset`,
		);
	} else {
		/** @type {[string, number][]} */
		const expectations = [
			["Opera", forks.opera],
			["Samsung", forks.samsung],
		];

		for (const [family, expected] of expectations) {
			if (floor[family] && Number(floor[family]) !== expected) {
				fail(
					`${family} >= ${floor[family]} is not the release built on` +
						` Chromium ${chromium} — that is ${family} ${expected}`,
				);
			}
		}
	}
}

for (const [desktop, mobile] of PAIRED_FAMILIES) {
	if (floor[desktop] && floor[mobile] && floor[desktop] !== floor[mobile]) {
		fail(
			`${mobile} >= ${floor[mobile]} disagrees with ${desktop} >= ${floor[desktop]}` +
				` — they are the same engine`,
		);
	}
}

if (violations.length > 0) {
	console.error("[@cirthcss/cirth] Browserslist target is inconsistent:\n");
	violations.forEach((violation) => {
		console.error(`- ${violation}`);
	});
	console.error(
		"\nThe target describes one engine floor. Every family has to say" +
			" the same thing about it.",
	);
	process.exit(1);
}

console.log(
	`[@cirthcss/cirth] Browserslist target is consistent at Chromium ${chromium}` +
		`, Gecko ${floor.Firefox}, WebKit ${floor.Safari}`,
);
