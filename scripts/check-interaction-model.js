const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { chromium } = require("playwright");
const { createServer, startServer } = require("./lib/docs-site");
const { pageAgent } = require("./lib/docs-fingerprint");
const { indexKeys, measureTogether } = require("./lib/interaction");

// Proof that the interaction search finds what it claims to find.
//
//   node scripts/check-interaction-model.js
//
// scripts/verify-dead-css.js ends by removing every confirmed-inert
// declaration at once and asking what moved. Until now the only evidence
// that the search behind that question worked was the docs site itself:
// thirteen candidates, one known pair, and a verdict nobody could check
// against a document whose answer was known in advance.
//
// So these fixtures are built to have an answer. Each one is a page and a
// stylesheet small enough to reason about completely, exercising a shape
// the real sheet either contains or plausibly could:
//
//   1. independent inert   two dead declarations, dead together too
//   2. pair                each inert alone, live as a pair
//   3. three-way           each inert alone, every pair inert, the trio live
//   4. nine pairs          eighteen candidates in nine independent groups
//   5. complex             twelve candidates, deterministic, nothing moving
//   6. unstable            a document that answers the same question twice
//                          with two different answers
//
// Fixture 4 is the one that pins the convergence rule. The old search was
// leave-one-out capped at eight rounds, and this fixture defeats it twice
// over: leave-one-out names nothing at all when there is more than one
// interacting group (removing all-but-one still removes every other group
// whole, so the page always moves), and nine groups need nine passes.

/** @type {string[]} */
const checks = [];
/** @param {string} what */
const passed = (what) => {
	checks.push(what);
	console.log(`  ok  ${what}`);
};

/** @param {string} body @param {string} script */
const page = (body, script = "") =>
	'<!doctype html><html lang="en"><head><meta charset="utf-8">' +
	'<title>fixture</title><link rel="stylesheet" href="/styles/style.css">' +
	`</head><body>${body}${script ? `<script>${script}</script>` : ""}</body></html>`;

// A stylesheet the fixtures share: the page is a fixed-width frame so that
// nothing here depends on the window, and the probe target shrinks to fit
// its own text, so "auto" and "100px" are different numbers.
const frame = `
html { font: 16px/1.5 monospace; }
body { margin: 0; width: 600px; }
.frame { width: 400px; }
.fit { display: inline-block; }
`;

/**
 * @typedef {{
 *   assert: (result: ReturnType<typeof measureTogether>, key: (selector: string, property: string, occurrence?: number) => string) => void,
 *   css: string,
 *   html: string,
 *   name: string,
 *   script?: string,
 *   wanted: [string, string, number?][],
 * }} Fixture
 */

/** @type {Fixture[]} */
const fixtures = [];

// --- 1. Independent inert ----------------------------------------------
//
// Both declarations lose to a later rule of the same specificity. Neither
// does anything alone, and removing both does nothing either — the verdict
// a cleanup needs before it deletes.

fixtures.push({
	name: "two independent inert declarations stay inert together",
	html: '<div class="frame"><p class="dead">text</p></div>',
	css: `${frame}
.dead { width: 120px; }
.dead { color: rgb(1, 2, 3); }
.dead { width: 220px; color: rgb(9, 9, 9); }
`,
	wanted: [
		[".dead", "width", 0],
		[".dead", "color", 0],
	],
	assert: (result) => {
		assert.equal(result.moved, false, "an overridden pair moved the page");
		assert.deepEqual(result.essential, []);
		assert.deepEqual(result.groups, []);
		assert.equal(result.unstable, false);
		assert.equal(result.unresolved, false);
	},
});

// --- 2. Pair interaction ------------------------------------------------
//
// The shape that produced the regression this whole pass exists to catch,
// and built the same way it occurs: two `width` declarations feeding one
// intrinsic size. Both items sit in the same auto-sized grid column, so the
// column is the larger of their contributions and either one alone states
// it — while the other, stretched to the column, measures the same either
// way. `width` is not a tracked computed property, so removing one really
// is invisible; removing both is not.

const grid = `
.grid { display: inline-grid; grid-template-columns: auto; }
.grid i { font-style: normal; }
`;

fixtures.push({
	name: "a pair inert one at a time is named when removed together",
	html: '<div class="frame"><div class="grid pair"><i class="a">ab</i><i class="b">ab</i></div></div>',
	css: `${frame}${grid}
.pair .a { width: 100px; }
.pair .b { width: 100px; }
`,
	wanted: [
		[".pair .a", "width"],
		[".pair .b", "width"],
	],
	assert: (result, key) => {
		assert.equal(result.moved, true, "removing both widths did not move the page");
		assert.deepEqual(
			result.essential.slice().sort(),
			[key(".pair .a", "width"), key(".pair .b", "width")].sort(),
		);
		assert.equal(result.groups.length, 1, "the pair was split across groups");
		assert.equal(result.passes, 1);
		assert.equal(result.unstable, false);
		assert.equal(result.unresolved, false);
	},
});

// --- 3. Three-way interaction -------------------------------------------
//
// Stronger than the pair, and the case a search that removes one member at
// a time cannot see: no single declaration matters, no *pair* of them
// matters, and all three together change every box in the group.

fixtures.push({
	name: "three declarations inert alone and in pairs are all named",
	html:
		'<div class="frame"><div class="grid trio">' +
		'<i class="a">ab</i><i class="b">ab</i><i class="c">ab</i></div></div>',
	css: `${frame}${grid}
.trio .a { width: 100px; }
.trio .b { width: 100px; }
.trio .c { width: 100px; }
`,
	wanted: [
		[".trio .a", "width"],
		[".trio .b", "width"],
		[".trio .c", "width"],
	],
	assert: (result, key) => {
		assert.equal(result.moved, true, "removing all three did not move the page");
		assert.deepEqual(
			result.essential.slice().sort(),
			[
				key(".trio .a", "width"),
				key(".trio .b", "width"),
				key(".trio .c", "width"),
			].sort(),
			"a three-way interaction lost a member",
		);
		assert.equal(result.groups.length, 1);
		assert.equal(result.passes, 1);
		assert.equal(result.unstable, false);
		assert.equal(result.unresolved, false);
	},
});

// --- 4. Nine independent pairs ------------------------------------------
//
// Eighteen candidates in nine groups, and the fixture that makes the old
// eight-round bound impossible to reintroduce quietly. It defeats the old
// search twice over: leave-one-out names nothing at all once there is more
// than one group — removing all-but-one still removes every other group
// whole, so the page always moves — and nine groups need nine passes.

const pairs = 9;
fixtures.push({
	name: `${pairs} independent pairs are each named, in ${pairs} passes`,
	html:
		'<div class="frame">' +
		Array.from(
			{ length: pairs },
			(_, at) =>
				`<div class="grid g${at}"><i class="a">ab</i><i class="b">ab</i></div>`,
		).join("") +
		"</div>",
	css:
		frame +
		grid +
		Array.from(
			{ length: pairs },
			(_, at) => `.g${at} .a { width: 100px; }\n.g${at} .b { width: 100px; }`,
		).join("\n") +
		"\n",
	wanted: /** @type {Fixture["wanted"]} */ (
		Array.from({ length: pairs }, (_, at) => [
			[`.g${at} .a`, "width"],
			[`.g${at} .b`, "width"],
		]).flat()
	),
	assert: (result, key) => {
		assert.equal(result.moved, true);
		assert.equal(
			result.essential.length,
			pairs * 2,
			"independent groups lost members — leave-one-out names none of these",
		);
		assert.equal(result.groups.length, pairs, "the groups were not separated");
		for (const group of result.groups) {
			assert.equal(group.length, 2, "a pair came back as something else");
		}
		assert.equal(
			result.passes,
			pairs,
			"the search stopped before every group was named",
		);
		assert.ok(result.passes > 8, "this fixture must outlive the old bound");
		for (let at = 0; at < pairs; at += 1) {
			assert.ok(result.essential.includes(key(`.g${at} .a`, "width")));
			assert.ok(result.essential.includes(key(`.g${at} .b`, "width")));
		}
		assert.equal(result.unstable, false);
		assert.equal(result.unresolved, false);
	},
});

// --- 5. A large, complex, entirely deterministic set ---------------------
//
// Twelve candidates on one element, every one of them overridden by the
// rule below it. The old heuristic called a set unstable when it had to
// re-measure more often than it had members, which a set this size reaches
// by being large rather than by being unreliable. Nothing here is unstable,
// and the tool has to say so.

const overridden = [
	["width", "120px", "200px"],
	["min-width", "60px", "0px"],
	["max-width", "500px", "300px"],
	["height", "30px", "40px"],
	["min-height", "10px", "0px"],
	["padding-left", "4px", "0px"],
	["padding-top", "3px", "0px"],
	["margin-left", "5px", "0px"],
	["margin-top", "6px", "0px"],
	["color", "rgb(1, 2, 3)", "rgb(9, 9, 9)"],
	["opacity", "0.5", "1"],
	["z-index", "3", "7"],
];
fixtures.push({
	name: `${overridden.length} overridden declarations are complex, not unstable`,
	html: '<div class="frame"><p class="stack">text</p></div>',
	css: `${frame}
${overridden.map(([property, dead]) => `.stack { ${property}: ${dead}; }`).join("\n")}
.stack {
\tposition: relative;
${overridden.map(([property, , live]) => `\t${property}: ${live};`).join("\n")}
}
`,
	wanted: overridden.map(([property]) => [".stack", property, 0]),
	assert: (result) => {
		assert.equal(result.moved, false, "an overridden set moved the page");
		assert.deepEqual(result.essential, []);
		assert.equal(
			result.unstable,
			false,
			"a large deterministic set was called unstable",
		);
		assert.equal(result.unresolved, false);
	},
});

// --- 6. A document that will not hold still ------------------------------
//
// `unstable` now means one thing: the same question, asked twice of the
// same document, came back with two different answers. That is a property
// of the document, not of the size of the set.
//
// The real thing this stands in for is the docs shell's own script, which
// relocates the display controls when the header collapses and does not put
// them back: a probe changes the document permanently, so the reference the
// next probe measures against is not the one before it. That is
// asynchronous, and a fixture built on it would be a race rather than a
// test. Alternating one measured value on a schedule the fixture controls
// is synchronous, deterministic, and asks the search the same question.
//
// `#flip` is the last element in the document and the only one that moves,
// so `differs()` reaches it on every walk. Its width alternates, but only
// while the `.quiet` rule has no `width` — that is, only inside a sweep that
// has removed the candidate.

fixtures.push({
	name: "a document that answers differently twice is reported unstable",
	html: '<div class="frame"><p class="quiet">text</p><p id="flip">flip</p></div>',
	css: `${frame}
.quiet { width: 400px; }
#flip { width: 100px; }
`,
	script: `
	(() => {
		const flip = document.getElementById("flip");
		const real = Element.prototype.getBoundingClientRect;
		const quietRule = [...document.styleSheets[0].cssRules].find(
			(rule) => rule.selectorText === ".quiet",
		);
		let parity = 0;
		Element.prototype.getBoundingClientRect = function () {
			const box = real.call(this);
			if (this !== flip || quietRule.style.width !== "") return box;
			parity += 1;
			return parity % 2 === 1
				? new DOMRect(box.x, box.y, box.width + 10, box.height)
				: box;
		};
	})();
	`,
	wanted: [[".quiet", "width"]],
	assert: (result) => {
		assert.equal(
			result.unstable,
			true,
			"a document that gave two answers was not reported unstable",
		);
		assert.deepEqual(
			result.essential,
			[],
			"an unstable document still produced a verdict",
		);
		assert.deepEqual(result.groups, []);
	},
});

// --- Runner -------------------------------------------------------------

const run = async () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "cirth-interaction-"));
	const browser = await chromium.launch();
	/** @type {import("node:http").Server | null} */
	let server = null;

	try {
		for (const fixture of fixtures) {
			const site = path.join(root, fixture.name.replace(/\W+/g, "-"));
			fs.mkdirSync(path.join(site, "styles"), { recursive: true });
			fs.writeFileSync(
				path.join(site, "index.html"),
				page(fixture.html, fixture.script ?? ""),
			);
			fs.writeFileSync(path.join(site, "styles/style.css"), fixture.css);

			server = createServer(site);
			const origin = await startServer(server);
			const context = await browser.newContext({
				colorScheme: "light",
				reducedMotion: "reduce",
				viewport: { height: 600, width: 800 },
			});
			await context.addInitScript(pageAgent);
			const tab = await context.newPage();

			try {
				await tab.goto(`${origin}/index.html`, { waitUntil: "load" });

				// Keys are built by the page, from the same index the search
				// uses, so a test cannot pass by agreeing with a stale idea of
				// how a candidate is addressed.
				const indexed = await tab.evaluate(indexKeys, {
					needle: "styles/style.css",
				});
				assert.ok(indexed, `${fixture.name}: no stylesheet matched`);
				const keys = indexed;
				const declarations = await tab.evaluate(
					({ needle }) =>
						(window.__cirthAudit.index(needle) ?? []).map(
							(entry) => `${entry.selector}|${entry.property}`,
						),
					{ needle: "styles/style.css" },
				);
				/** @type {(selector: string, property: string, occurrence?: number) => string} */
				const key = (selector, property, occurrence = 0) => {
					let at = -1;
					for (let index = 0; index < declarations.length; index += 1) {
						if (declarations[index] !== `${selector}|${property}`) continue;
						at += 1;
						if (at === occurrence) return keys[index];
					}
					throw new Error(
						`${fixture.name}: no declaration ${selector} { ${property} } #${occurrence}`,
					);
				};

				const wanted = fixture.wanted.map(([selector, property, occurrence]) =>
					key(selector, property, occurrence),
				);

				// Twice, and the two runs have to agree. A search that is not
				// reproducible cannot be the basis for deleting anything, and
				// nothing about these documents changes between the two.
				const first = await tab.evaluate(measureTogether, {
					needle: "styles/style.css",
					wanted,
				});
				const second = await tab.evaluate(measureTogether, {
					needle: "styles/style.css",
					wanted,
				});

				fixture.assert(first, key);
				assert.deepEqual(
					{ ...second, settled: 0 },
					{ ...first, settled: 0 },
					`${fixture.name}: two identical runs disagreed`,
				);
				passed(fixture.name);
			} finally {
				await context.close();
				const listening = server;
				server = null;
				await new Promise((resolve) => listening.close(() => resolve(undefined)));
			}
		}
	} finally {
		await browser.close();
		const listening = server;
		if (listening) {
			await new Promise((resolve) => listening.close(() => resolve(undefined)));
		}
		fs.rmSync(root, { force: true, recursive: true });
	}

	console.log(
		`\n[@cirthcss/cirth] Interaction model: ${checks.length} checks passed.`,
	);
	return 0;
};

run().then(
	(code) => process.exit(code),
	(error) => {
		console.error(error);
		process.exit(1);
	},
);
