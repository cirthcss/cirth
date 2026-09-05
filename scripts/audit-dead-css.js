const fs = require("node:fs");
const path = require("node:path");
const {
	contextKey,
	insetProperty,
	observable,
	openCorpus,
	unmeasurable,
} = require("./lib/docs-fingerprint");

// Which declarations in the documentation shell's stylesheet are actually
// doing something?
//
//   node scripts/audit-dead-css.js
//   node scripts/audit-dead-css.js --sheet styles/style.css --json .cache/dead.json
//
// The method is the one thing that makes a dead-CSS cleanup a fact rather
// than a hope: take a declaration out of the live CSSOM, re-measure the
// page, put it back. If nothing moved in any rendering of the corpus — 50
// pages, two viewports, two schemes, and every disclosure, dialog and
// popover opened — the declaration is inert *there*, and that is exactly
// what the report says.
//
// Four verdicts, and the difference between them is the whole point:
//
//   live               removing it changed something. Named with the first
//                      rendering that noticed, so the claim is checkable.
//   inert              its selector matched real elements and removing it
//                      changed nothing anywhere in the corpus.
//   unmatched          its selector never matched an element on any page.
//   not observable     it sits under a media query this corpus does not
//                      enter — `forced-colors`, `print`,
//                      `prefers-reduced-motion: no-preference`, or a width
//                      band none of the four viewports lands in, which the
//                      run establishes by asking matchMedia rather than by
//                      reading a list — or behind an
//                      element state it does not reach (`:hover`, `:focus`,
//                      `::backdrop`, `::selection`), or its value asks the
//                      device a question a browser on a desktop cannot answer
//                      (`env(safe-area-inset-*)`). Not a finding — a
//                      measurement this tool cannot make. The last audit
//                      misread exactly this class, and separately called two
//                      declarations dead that were alive inside the drawer
//                      and the search dialog, which is why the corpus opens
//                      what is normally closed.
//
// `inert` and `unmatched` are candidates for deletion, not instructions:
// read each one before removing it, and know what the corpus is not.
//
// It **opens** what a page keeps closed but never **drives** anything: it
// types nothing, hovers nothing, clicks nothing. The search-results styling,
// which Pagefind builds only once a query has been typed, therefore comes
// back `unmatched`, and it is very much alive. Read `unmatched` as "no page
// in the corpus contains this element" — a fact about the corpus as much as
// about the rule.
//
// It is **one engine**. Chromium's intrinsic sizing is not Gecko's: a
// `width` beside a `flex-basis` measured inert here and, taken out, left the
// header's actions cluster 66px wide holding 88px of controls in Firefox,
// hanging the menu toggle 6px off a 320px screen. `npm run check:behavior`
// runs three engines and is what caught it.
//
// It is **one theme**. Presets move tokens, and two declarations that
// resolve to the same value under the default theme need not under
// `playroom` — a `font-family: var(--cirth-font-family-sans)` pinning the
// shell's chrome to the plain system stack is inert until a preset makes the
// page face rounded. `npm run check:visual` renders the presets and is what
// caught that one.
//
// Neither gap is a reason to distrust the verdicts; both are a reason to run
// the suites after acting on them. A cleanup of 71 declarations produced two
// regressions, and both were caught before anything shipped.

const args = process.argv.slice(2);
/** @param {string} name */
const flag = (name) => {
	const at = args.indexOf(name);
	return at === -1 ? undefined : args[at + 1];
};

const sheet = flag("--sheet") ?? "styles/style.css";
const jsonPath = flag("--json");
const filter = flag("--filter");
const explainOrder = args.includes("--explain-order");
// Escape hatch, and the way the ordering was measured rather than asserted:
// --no-order walks the corpus in listPages() order, which is what this tool
// did before, so the two runs differ in nothing else.
const noOrder = args.includes("--no-order");

/**
 * @typedef {{
 *   id: string,
 *   property: string,
 *   selector: string,
 *   conditions: string[],
 *   raw: string,
 *   sticky?: boolean,
 *   value: string,
 * }} Declaration
 */

// The inset longhands, which are the ones whose meaning depends on whether
// the box they sit on is sticky.
const INSET_NAMES = [
	"bottom",
	"inset",
	"inset-block",
	"inset-block-end",
	"inset-block-start",
	"inset-inline",
	"inset-inline-end",
	"inset-inline-start",
	"left",
	"right",
	"top",
].filter(insetProperty);

/** @type {Map<string, Declaration>} */
const declarations = new Map();
/** @type {Map<string, string>} */
const live = new Map();
/** @type {Set<string>} */
const matched = new Set();
/** @type {Set<string>} */
const stateful = new Set();
/** @type {Set<string>} */
const unprobeable = new Set();
/** @type {Set<string>} */
const conditionsMet = new Set();
/** @type {Set<string>} */
const undecided = new Set();

let renderings = 0;
let probes = 0;
let skipped = 0;

const run = async () => {
	const started = Date.now();
	const corpus = await openCorpus({ label: "audit-dead-css", pages: undefined });

	try {
		// --- Pass 1: the catalogue, and what each visit can even see -------
		//
		// Cheap — one querySelectorAll per rule per rendering, no measuring —
		// and it buys the order of pass 2. Without it the walk runs in
		// listPages() order, which puts the near-empty 404 page first and the
		// home page, by far the richest, dead last.

		/** @type {Map<string, Set<string>>} */
		const coverage = new Map();

		for (const target of corpus.visits) {
			await corpus.visit(target, async (page, context) => {
				renderings += 1;
				const result = await page.evaluate(
					({ insetNames, needle, seedFilter, wantCatalogue }) => {
						const audit = window.__cirthAudit;
						const index = audit.index(needle);
						if (!index) return null;

						const catalogue = seedFilter
							? index.filter((entry) => entry.selector.includes(seedFilter))
							: index;

						// One answer per selector: a rule with eight
						// declarations would otherwise ask the same question
						// eight times.
						// Every at-rule condition on the sheet, asked of this
						// rendering. A condition that no rendering in the whole
						// corpus matches has not been shown to be dead — the
						// corpus simply never enters it, which is the same
						// answer as forced-colors and one the hand-written
						// feature list above cannot give for a width band.
						/** @type {string[]} */
						const conditionsMet = [];
						for (const condition of new Set(
							catalogue.flatMap((entry) => entry.conditions),
						)) {
							const text = condition.replace(/^CSS\w+Rule:/, "");
							try {
								if (window.matchMedia(text).matches) conditionsMet.push(condition);
							} catch {
								conditionsMet.push(condition);
							}
						}

						/** @type {Map<string, string>} */
						const reach = new Map();
						/** @type {Map<string, boolean>} */
						const isSticky = new Map();
						const here = [];
						const stateOnly = [];
						const sticky = [];
						for (const entry of catalogue) {
							if (!reach.has(entry.selector)) {
								reach.set(entry.selector, audit.reachability(entry.selector));
							}
							const answer = reach.get(entry.selector);
							if (answer === "matched") here.push(entry.id);
							else if (answer === "stateful") stateOnly.push(entry.id);

							if (answer === "matched" && insetNames.includes(entry.property)) {
								if (!isSticky.has(entry.selector)) {
									isSticky.set(entry.selector, audit.sticky(entry.selector));
								}
								if (isSticky.get(entry.selector)) sticky.push(entry.id);
							}
						}

						return {
							conditionsMet,
							sticky,
							catalogue: wantCatalogue
								? catalogue.map(
										({ id, property, selector, conditions, raw, value }) => ({
											id,
											property,
											selector,
											conditions,
											raw,
											value,
										}),
									)
								: null,
							here,
							stateOnly,
						};
					},
					{
						// Which properties are worth asking the sticky
						// question about, computed once out here rather than
						// re-derived per element in the page.
						insetNames: INSET_NAMES,
						needle: sheet,
						seedFilter: filter ?? null,
						wantCatalogue: declarations.size === 0,
					},
				);

				if (!result) {
					// The sheet was not in document.styleSheets. Almost always
					// this means docs/dist is being rewritten underneath the
					// run — an eleventy passthrough copy replaces the file
					// rather than editing it, so there is a window where the
					// page loads without it. Reload once before giving up.
					throw new Error(
						`audit-dead-css: no stylesheet matching "${sheet}" on ${context.page}. ` +
							"If a docs build was running at the same time, that is why: " +
							"the run reads docs/dist and cannot see it change.",
					);
				}

				if (result.catalogue) {
					for (const entry of result.catalogue) {
						declarations.set(entry.id, entry);
						if (observable(entry.conditions) && !unmeasurable(entry)) {
							undecided.add(entry.id);
						}
					}
				}

				for (const condition of result.conditionsMet) conditionsMet.add(condition);
				for (const id of result.here) matched.add(id);
				for (const id of result.stateOnly) stateful.add(id);
				for (const id of result.sticky) {
					const declaration = declarations.get(id);
					if (declaration) declaration.sticky = true;
				}
				coverage.set(contextKey(context), new Set(result.here));
			});
		}

		// Stickiness and which conditions the corpus can even enter are only
		// known after the survey, so the undecided set is trimmed once more
		// before anything is probed.
		/** @param {Declaration} declaration */
		const entered = (declaration) =>
			declaration.conditions.every((condition) => conditionsMet.has(condition));

		for (const [id, declaration] of declarations) {
			if (unmeasurable(declaration) || !entered(declaration)) undecided.delete(id);
		}

		const surveyed = ((Date.now() - started) / 1000).toFixed(1);

		// --- The order --------------------------------------------------
		//
		// Greedy set cover over what pass 1 measured: the visit that can see
		// the most undecided declarations goes first, then the one that adds
		// the most the first could not see, and so on. Nothing about which
		// page or viewport that is, is written down here — it falls out of
		// the site as built.

		/** @param {(typeof corpus.visits)[number]} target */
		const seenBy = (target) => {
			const union = new Set();
			for (const state of ["loaded", "opened"]) {
				const ids = coverage.get(contextKey({ ...target, state: /** @type {"loaded"} */ (state) }));
				if (ids) for (const id of ids) union.add(id);
			}
			return union;
		};

		const remaining = new Set(
			[...undecided].filter((id) => matched.has(id)),
		);
		/** @type {{ target: (typeof corpus.visits)[number], gain: number }[]} */
		const order = [];
		const pool = corpus.visits.map((target) => ({ target, ids: seenBy(target) }));

		while (!noOrder && pool.length > 0) {
			let bestAt = 0;
			let bestGain = -1;
			for (let at = 0; at < pool.length; at += 1) {
				let gain = 0;
				for (const id of pool[at].ids) if (remaining.has(id)) gain += 1;
				if (gain > bestGain) {
					bestGain = gain;
					bestAt = at;
				}
			}
			const [chosen] = pool.splice(bestAt, 1);
			for (const id of chosen.ids) remaining.delete(id);
			order.push({ gain: bestGain, target: chosen.target });
		}

		if (noOrder) {
			for (const { target } of pool) order.push({ gain: -1, target });
		}

		if (explainOrder) {
			console.log("\nOrder, by declarations a visit is the first to reach:\n");
			for (const { gain, target } of order.slice(0, 12)) {
				console.log(
					`  ${String(gain).padStart(5)}  ${target.page} · ${target.viewport} · ${target.scheme}`,
				);
			}
			const tail = order.slice(12).reduce((sum, entry) => sum + entry.gain, 0);
			console.log(`  ${String(tail).padStart(5)}  …across the other ${order.length - 12} visits\n`);
		}

		// --- Pass 2: probe, richest first --------------------------------

		for (const { target } of order) {
			await corpus.visit(target, async (page, context) => {
				const result = await page.evaluate(
					async ({ needle, pending }) => {
						const audit = window.__cirthAudit;
						const index = audit.index(needle);
						if (!index) return null;

						const wanted = new Set(pending);
						/** @type {Map<string, boolean>} */
						const reach = new Map();
						const here = [];
						for (const entry of index) {
							if (!wanted.has(entry.id)) continue;
							if (!reach.has(entry.selector)) {
								reach.set(entry.selector, audit.matches(entry.selector));
							}
							if (reach.get(entry.selector)) here.push(entry);
						}

						/** @type {string[]} */
						const changed = [];
						/** @type {string[]} */
						const seen = [];
						/** @type {string[]} */
						const unstable = [];
						/** @type {string[]} */
						const unprobeable = [];
						let tested = 0;

						if (here.length > 0) {
							let base = audit.snapshot();

							// Grouped by rule so the block's text is saved and
							// put back once per rule rather than once per
							// declaration — and so a longhand restored after a
							// shorthand cannot silently reorder the cascade
							// inside the block.
							/** @type {Map<string, { path: number[], entries: typeof here }>} */
							const byRule = new Map();
							for (const entry of here) {
								const key = entry.path.join(".");
								const group = byRule.get(key) ?? {
									entries: [],
									path: entry.path,
								};
								group.entries.push(entry);
								byRule.set(key, group);
							}

							// The page is not a still life. This site's own
							// header script moves the display controls into the
							// drawer when the bar gets too narrow, so touching a
							// padding can make the document rearrange itself —
							// permanently, and through no fault of the
							// declaration being probed.
							//
							// So a probe proves it put the page back. But only
							// when it has to: `differs()` walks the document and
							// stops at the first element that moved, which makes
							// the "something changed" answer cheap and the
							// "nothing changed" answer a full pass. Verifying
							// the restore unconditionally therefore charged every
							// *inert* declaration two full passes — and inert
							// declarations are exactly the ones that survive to
							// be re-probed on all four hundred renderings.
							//
							// A removal that measured no change cannot have
							// rearranged anything this corpus can see; putting
							// the same cssText back cannot un-see it either. If
							// something did move asynchronously in that window,
							// the *next* probe reads it as a change, takes the
							// verification path below, finds the page dirty and
							// re-baselines — so the drift is still caught, one
							// probe later, and the verdict it can produce in the
							// meantime is "live", never "inert". The
							// optimisation only ever errs toward keeping a
							// declaration.
							const probe = (
								/** @type {CSSStyleRule} */ rule,
								/** @type {string} */ saved,
								/** @type {string} */ property,
							) => {
								rule.style.removeProperty(property);

								// Did the removal remove anything? A longhand
								// belonging to a shorthand written with var()
								// is held as a pending-substitution value, and
								// removeProperty on one of its parts is a
								// no-op: the block comes back unchanged, the
								// page therefore measures unchanged, and the
								// declaration would be reported inert on the
								// strength of an experiment that never ran.
								// Two of `padding-block: var(--cirth-space-2)`
								// were in the first report on exactly that
								// footing.
								if (rule.style.cssText === saved) {
									return { clean: true, moved: false, noop: true };
								}

								const moved = audit.differs(base);
								rule.style.cssText = saved;
								return {
									clean: moved ? !audit.differs(base) : true,
									moved,
									noop: false,
								};
							};

							for (const { path, entries } of byRule.values()) {
								const rule = audit.ruleAt(needle, path);
								const saved = rule.style.cssText;
								for (const entry of entries) {
									tested += 1;
									let attempt = probe(rule, saved, entry.property);
									if (attempt.noop) {
										unprobeable.push(entry.id);
										continue;
									}
									if (!attempt.clean) {
										base = audit.snapshot();
										attempt = probe(rule, saved, entry.property);
										if (!attempt.clean) {
											base = audit.snapshot();
											unstable.push(entry.id);
											continue;
										}
									}
									seen.push(entry.id);
									if (attempt.moved) changed.push(entry.id);
								}
							}
						}

						return { changed, seen, tested, unprobeable, unstable };
					},
					{ needle: sheet, pending: [...undecided] },
				);

				if (!result) {
					throw new Error(
						`audit-dead-css: no stylesheet matching "${sheet}" on ${context.page}`,
					);
				}

				probes += result.tested;
				skipped += result.unstable.length;
				for (const id of result.unprobeable) unprobeable.add(id);
				for (const id of result.changed) {
					if (!live.has(id)) live.set(id, contextKey(context));
					undecided.delete(id);
				}
			});
		}

		const seconds = ((Date.now() - started) / 1000).toFixed(1);

		// --- Report ------------------------------------------------------

		/** @type {{ environment: Declaration[], inert: Declaration[], notObservable: Declaration[], stateOnly: Declaration[], unmatched: Declaration[], unprobeable: Declaration[] }} */
		const report = {
			environment: [],
			inert: [],
			notObservable: [],
			stateOnly: [],
			unmatched: [],
			unprobeable: [],
		};

		for (const [id, declaration] of declarations) {
			if (!observable(declaration.conditions) || !entered(declaration)) {
				report.notObservable.push(declaration);
			} else if (unmeasurable(declaration)) {
				report.environment.push(declaration);
			} else if (unprobeable.has(id) && !live.has(id)) {
				report.unprobeable.push(declaration);
			} else if (live.has(id)) {
				// Doing something. Nothing to report.
			} else if (matched.has(id)) {
				report.inert.push(declaration);
			} else if (stateful.has(id)) {
				// The element is on the page; the state the selector asks for
				// is not one this corpus puts it into.
				report.stateOnly.push(declaration);
			} else {
				report.unmatched.push(declaration);
			}
		}

		/** @param {Declaration} declaration */
		const format = (declaration) =>
			`  ${declaration.selector} { ${declaration.property}: ${declaration.value.trim()} }` +
			(declaration.conditions.length > 0
				? `\n      under ${declaration.conditions
						.map((condition) => condition.replace(/^CSS(\w+)Rule:/, "@$1 "))
						.join(" / ")}`
				: "");

		console.log(
			`\n[@cirthcss/cirth] ${declarations.size} declarations in ${sheet}, probed ${probes} times across ${renderings} renderings, in ${seconds}s (${surveyed}s of it surveying)\n`,
		);
		console.log(`  live            ${live.size}`);
		console.log(`  inert           ${report.inert.length}`);
		console.log(`  unmatched       ${report.unmatched.length}`);
		console.log(
			`  not observable  ${report.notObservable.length + report.stateOnly.length + report.environment.length}` +
				` (${report.notObservable.length} media, ${report.stateOnly.length} state,` +
				` ${report.environment.length} unmeasurable)`,
		);
		console.log(`  unprobeable     ${report.unprobeable.length}\n`);

		if (skipped > 0) {
			console.log(
				`  (${skipped} probe${skipped === 1 ? "" : "s"} discarded: the page rearranged itself\n` +
					"   under the probe and was re-measured rather than believed)\n",
			);
		}

		for (const [heading, entries] of /** @type {const} */ ([
			["Inert — matched real elements, changed nothing anywhere", report.inert],
			["Unmatched — the selector never matched an element", report.unmatched],
		])) {
			if (entries.length === 0) continue;
			console.log(`${heading}:\n`);
			for (const declaration of entries) console.log(format(declaration));
			console.log("");
		}

		const unjudged =
			report.notObservable.length +
			report.stateOnly.length +
			report.environment.length;

		if (unjudged > 0) {
			const plural = unjudged === 1 ? "declaration was" : "declarations were";
			console.log(
				`Not judged — ${unjudged} ${plural} not measured, rather than measured\n` +
					"and found inert. Verify these under the media context, the interaction\n" +
					"or the device they ask for; do not delete one on this report's say-so.\n",
			);
			console.log(
				`  ${String(report.notObservable.length).padStart(4)}  under a media context the corpus never entered —\n` +
					"        forced-colors, print, prefers-reduced-motion: no-preference,\n" +
					"        or a width band none of the four viewports lands in\n",
			);
			console.log(
				`  ${String(report.stateOnly.length).padStart(4)}  behind an element state it does not reach —\n` +
					"        :hover, :focus, ::backdrop, ::selection\n",
			);
			console.log(
				`  ${String(report.environment.length).padStart(4)}  doing something a still photograph cannot show —\n` +
					"        an env() the browser resolves to zero without a notch, an inset\n" +
					"        on a sticky box in a corpus that never scrolls, a transition\n",
			);
		}

		if (report.unprobeable.length > 0) {
			console.log(
				`Unprobeable — ${report.unprobeable.length} declarations could not be taken out of the\n` +
					"rule at all: they are longhands of a shorthand written with var(), which\n" +
					"the engine stores whole. The experiment never ran, so there is no verdict.\n",
			);
			for (const declaration of report.unprobeable) console.log(format(declaration));
			console.log("");
		}

		if (jsonPath) {
			const resolved = path.resolve(jsonPath);
			fs.mkdirSync(path.dirname(resolved), { recursive: true });
			fs.writeFileSync(
				resolved,
				JSON.stringify(
					{
						createdAt: new Date().toISOString(),
						live: Object.fromEntries(live),
						probes,
						renderings,
						seconds: Number(seconds),
						sheet,
						...report,
					},
					null,
					"\t",
				),
			);
			console.log(`[@cirthcss/cirth] Wrote ${jsonPath}`);
		}
	} finally {
		await corpus.close();
	}

	// A reporting tool, not a gate: an inert declaration is a candidate for
	// a human to look at, and failing the build on one would only teach
	// people to stop running it.
	return 0;
};

run().then(
	(code) => process.exit(code),
	(error) => {
		console.error(error);
		process.exit(1);
	},
);
