const fs = require("node:fs");
const path = require("node:path");
const {
	contextKey,
	narrowViewport,
	openCorpus,
	viewports,
} = require("./lib/docs-fingerprint");
const { measureTogether } = require("./lib/interaction");
const { auditSources, watchSources } = require("./lib/source-guard");

// The second half of the dead-CSS audit: re-probe the candidates in the
// engines and under the preset the first sweep cannot see.
//
//   node scripts/audit-dead-css.js --json .cache/dead-css.json
//   node scripts/verify-dead-css.js --report .cache/dead-css.json
//
// audit-dead-css.js is Chromium under the default theme, and both halves of
// that have already produced a false `inert`:
//
//   - `.docs-header-search { width }` sits beside a `flex: 0 0 …`. Chromium
//     ignores it; Gecko and WebKit compute the row's intrinsic width from
//     the item's `width`, so removing it left the header's actions cluster
//     66px wide holding 88px of controls and hung the menu toggle 6px off a
//     320px screen.
//   - `font-family: var(--cirth-font-family-sans)` on the shell's chrome
//     resolves to the same stack the page already had — until a preset
//     makes the page face rounded and the shell has to stay plain.
//
// Both were caught downstream, by check:behavior and check:visual, after
// the declarations had already been deleted. This pass moves that
// discovery to before the deletion.
//
// It is not a third suite, and deliberately not a sweep. The full audit
// probes ~1000 declarations across 800 renderings and takes the better
// part of an hour; running it again in three configurations would cost a
// working day. But only what the sweep called `inert` is a deletion
// candidate — a few dozen declarations — and the sweep already recorded,
// per (viewport, scheme), which renderings can see each of them. That
// cover is written into the report as a plan, and this pass executes it:
// the same corpus, the same in-page measurement code, a handful of
// renderings, another engine or another preset.
//
// The verdicts it adds:
//
//   inert              nothing moved in any configuration. This is the
//                      verdict that makes a declaration safe to delete.
//   engine-dependent   Chromium measured nothing; Firefox or WebKit did.
//                      Keep it, and say which engine needs it.
//   preset-dependent   the default theme measured nothing; playroom did.
//   not observable     the configuration never entered the media condition
//                      the rule sits under.
//   unmatched          the selector matched nothing where this pass looked.
//                      A fact about the plan's pages, not about the rule.
//   unprobeable        a longhand of a shorthand written with var(): the
//                      engine holds it whole and removeProperty is a no-op,
//                      so the experiment never ran.
//
// A candidate that comes back `unmatched`, `not observable` or
// `unprobeable` everywhere has not been verified — it has been looked for.
// The report says so rather than promoting it to `inert`.

const args = process.argv.slice(2);
/** @param {string} name */
const flag = (name) => {
	const at = args.indexOf(name);
	return at === -1 ? undefined : args[at + 1];
};

const reportPath = flag("--report") ?? ".cache/dead-css.json";
const jsonPath = flag("--json");
const only = flag("--only");
const quiet = args.includes("--quiet");

// The three configurations the first sweep is blind to, and the reason
// each one is in the list rather than an assumption that one stands in for
// the others. Firefox and WebKit are separate engines, not one
// "non-Chromium": they agree on the flex case above and need not agree on
// the next one. `playroom` is the preset that moves the most tokens — face,
// radius, weight — so it is the one most likely to separate two values that
// coincide at the default.
//
// Any `<engine>` or `<engine>+<preset>` also works, so a fourth
// combination is one argument away when a report asks for it.
/** @type {Record<string, { browserName: "chromium" | "firefox" | "webkit", preset: string }>} */
const CONFIGS = {
	firefox: { browserName: "firefox", preset: "default" },
	playroom: { browserName: "chromium", preset: "playroom" },
	webkit: { browserName: "webkit", preset: "default" },
};

/**
 * @param {string} name
 * @returns {{ browserName: "chromium" | "firefox" | "webkit", label: string, preset: string }}
 */
const parseConfig = (name) => {
	const known = CONFIGS[name];
	if (known) return { ...known, label: name };

	const [engine, preset = "default"] = name.split("+");
	if (engine !== "chromium" && engine !== "firefox" && engine !== "webkit") {
		throw new Error(
			`verify-dead-css: unknown configuration "${name}" — use one of ` +
				`${Object.keys(CONFIGS).join(", ")}, or <engine>+<preset>.`,
		);
	}
	return { browserName: engine, label: name, preset };
};

const configs = (flag("--configs") ?? "firefox,webkit,playroom")
	.split(",")
	.map((name) => parseConfig(name.trim()));

/**
 * @typedef {{
 *   conditions: string[],
 *   id: string,
 *   key: string,
 *   property: string,
 *   raw: string,
 *   selector: string,
 *   value: string,
 * }} Candidate
 */

/**
 * @typedef {{
 *   absent: string[],
 *   changed: string[],
 *   missing: string[],
 *   notObservable: string[],
 *   probed: string[],
 *   stateful: string[],
 *   tested: number,
 *   unprobeable: string[],
 *   unstable: string[],
 * }} Measurement
 */

// Everything below the `page.evaluate` boundary is the same experiment
// audit-dead-css.js runs — take the declaration out of the live CSSOM,
// re-measure, put it back — over a named subset instead of the whole
// sheet. It is a separate function only because the two passes select
// their subject differently: by rule path there, by authored identity
// here, which is what survives another engine's parse.
/**
 * @param {{ needle: string, wanted: string[] }} input
 * @returns {Measurement}
 */
const measure = ({ needle, wanted }) => {
	const audit = window.__cirthAudit;
	const index = audit.index(needle);
	/** @type {Measurement} */
	const result = {
		absent: [],
		changed: [],
		missing: [],
		notObservable: [],
		probed: [],
		stateful: [],
		tested: 0,
		unprobeable: [],
		unstable: [],
	};
	if (!index) {
		result.missing = [...wanted];
		return result;
	}

	// The same key the audit wrote into the report: what the source
	// authored, plus which occurrence of it this is. A rule path would not
	// survive an engine that drops a rule it cannot parse.
	/** @type {Map<string, number>} */
	const seen = new Map();
	/** @type {Map<string, typeof index[number] & { key: string }>} */
	const byKey = new Map();
	for (const entry of index) {
		const base = `${entry.conditions.join(" && ")}|${entry.selector}|${entry.property}`;
		const occurrence = seen.get(base) ?? 0;
		seen.set(base, occurrence + 1);
		byKey.set(`${base}#${occurrence}`, { ...entry, key: `${base}#${occurrence}` });
	}

	/** @type {Map<string, boolean>} */
	const met = new Map();
	/** @type {Map<string, string>} */
	const reach = new Map();
	/** @type {(typeof index[number] & { key: string })[]} */
	const here = [];

	for (const key of wanted) {
		const entry = byKey.get(key);
		// Not in this engine's parse of the sheet at all: it dropped the
		// rule, or serialises the selector differently. Either way this
		// configuration has not judged the declaration.
		if (!entry) {
			result.missing.push(key);
			continue;
		}

		const enters = entry.conditions.every((condition) => {
			if (!met.has(condition)) {
				const text = condition.replace(/^CSS\w+Rule:/, "");
				try {
					met.set(condition, window.matchMedia(text).matches);
				} catch {
					// @supports and friends: not a media question, and not
					// one this pass is trying to answer.
					met.set(condition, true);
				}
			}
			return met.get(condition) === true;
		});
		if (!enters) {
			result.notObservable.push(key);
			continue;
		}

		if (!reach.has(entry.selector)) {
			reach.set(entry.selector, audit.reachability(entry.selector));
		}
		const answer = reach.get(entry.selector);
		if (answer === "matched") here.push(entry);
		else if (answer === "stateful") result.stateful.push(key);
		else result.absent.push(key);
	}

	if (here.length === 0) return result;

	let base = audit.snapshot();

	// Grouped by rule, so the block's text is saved and restored once per
	// rule rather than once per declaration.
	/** @type {Map<string, { entries: typeof here, path: number[] }>} */
	const byRule = new Map();
	for (const entry of here) {
		const group = byRule.get(entry.path.join(".")) ?? {
			entries: [],
			path: entry.path,
		};
		group.entries.push(entry);
		byRule.set(entry.path.join("."), group);
	}

	const probe = (
		/** @type {CSSStyleRule} */ rule,
		/** @type {string} */ saved,
		/** @type {string} */ property,
	) => {
		rule.style.removeProperty(property);
		// A longhand of a shorthand written with var() is held whole by the
		// engine; removeProperty on one of its parts changes nothing, and
		// "nothing changed" would then be an answer to an experiment that
		// never ran.
		if (rule.style.cssText === saved) {
			return { clean: true, moved: false, noop: true };
		}
		const moved = audit.differs(base);
		rule.style.cssText = saved;
		return { clean: moved ? !audit.differs(base) : true, moved, noop: false };
	};

	for (const { entries, path } of byRule.values()) {
		const rule = audit.ruleAt(needle, path);
		const saved = rule.style.cssText;
		for (const entry of entries) {
			result.tested += 1;
			let attempt = probe(rule, saved, entry.property);
			if (attempt.noop) {
				result.unprobeable.push(entry.key);
				continue;
			}
			// The page can rearrange itself under a probe — the shell's own
			// header script moves controls into the drawer when the bar gets
			// narrow. Re-baseline and try once more before believing it.
			if (!attempt.clean) {
				base = audit.snapshot();
				attempt = probe(rule, saved, entry.property);
				if (!attempt.clean) {
					base = audit.snapshot();
					result.unstable.push(entry.key);
					continue;
				}
			}
			result.probed.push(entry.key);
			if (attempt.moved) result.changed.push(entry.key);
		}
	}

	return result;
};

// The experiment above is one declaration at a time, and a cleanup is not.
//
// `.docs-header-search { width }` and `.docs-search-trigger { width }` are
// each inert in every engine at every width this corpus samples: take one
// out and the other still states the cluster's width. Take out *both* — a
// cleanup deleting everything a report called inert — and Firefox sized
// the header's actions from the basis alone. That is how the regression
// the second pass exists to prevent actually happened, and no
// single-declaration probe can see it.
//
// So the last thing this pass does is the thing the human is about to do:
// remove every confirmed-inert declaration at once and re-measure. If
// nothing moves, the whole deletion is safe together as well as
// separately. If something moves, lib/interaction.js takes the movement
// apart into the minimal groups it is made of, and those members go back
// on the keep list.

/**
 * @typedef {{
 *   absent: number,
 *   liveAt: Map<string, string>,
 *   missing: Set<string>,
 *   notObservable: Set<string>,
 *   probed: Set<string>,
 *   probes: number,
 *   renderings: number,
 *   seconds: number,
 *   unprobeable: Set<string>,
 *   unreached: Set<string>,
 *   unstable: number,
 * }} ConfigResult
 */

/**
 * One configuration: open the corpus in that engine and preset, walk the
 * plan, probe the candidates each planned rendering can see.
 *
 * @param {ReturnType<typeof parseConfig>} config
 * @param {Candidate[]} candidates
 * @param {{ keys: string[], page: string, scheme: string, viewport: string }[]} plan
 * @returns {Promise<ConfigResult>}
 */
const verify = async (config, candidates, plan) => {
	const started = Date.now();
	const pages = [...new Set(plan.map((entry) => entry.page))].sort();
	const corpus = await openCorpus({
		browserName: config.browserName,
		label: `verify-dead-css (${config.label})`,
		pages,
		preset: config.preset,
		widths: { ...viewports, ...narrowViewport },
	});

	/** @type {ConfigResult} */
	const result = {
		absent: 0,
		liveAt: new Map(),
		missing: new Set(),
		notObservable: new Set(),
		probed: new Set(),
		probes: 0,
		renderings: 0,
		seconds: 0,
		unprobeable: new Set(),
		unreached: new Set(),
		unstable: 0,
	};

	// Candidates still worth carrying to the next rendering. A candidate
	// that has already moved somewhere is decided: the verdict is
	// "this configuration sees it", and probing it again cannot say more.
	const pending = new Set(candidates.map((candidate) => candidate.key));

	try {
		for (const step of plan) {
			const target = corpus.visits.find(
				(visit) =>
					visit.page === step.page &&
					visit.scheme === step.scheme &&
					visit.viewport === step.viewport,
			);
			if (!target) continue;

			await corpus.visit(target, async (page, context) => {
				if (pending.size === 0) return;
				result.renderings += 1;
				const measured = await page.evaluate(measure, {
					needle: sheet,
					wanted: [...pending],
				});

				result.probes += measured.tested;
				result.unstable += measured.unstable.length;
				result.absent += measured.absent.length;
				for (const key of measured.missing) result.missing.add(key);
				for (const key of measured.notObservable) result.notObservable.add(key);
				for (const key of measured.unprobeable) result.unprobeable.add(key);
				for (const key of [...measured.absent, ...measured.stateful]) {
					result.unreached.add(key);
				}
				for (const key of measured.probed) result.probed.add(key);
				for (const key of measured.changed) {
					if (!result.liveAt.has(key)) result.liveAt.set(key, contextKey(context));
					pending.delete(key);
				}
			});
		}
	} finally {
		await corpus.close();
	}

	result.seconds = Number(((Date.now() - started) / 1000).toFixed(1));
	return result;
};

/**
 * Phase two of a configuration: remove everything the first phase
 * confirmed inert, all at once, on the same plan. This is the operation a
 * cleanup performs, and it is the only one that can see two declarations
 * holding each other up.
 *
 * @param {ReturnType<typeof parseConfig>} config
 * @param {string[]} keys
 * @param {{ keys: string[], page: string, scheme: string, viewport: string }[]} plan
 * @returns {Promise<{
 *   at: string,
 *   essential: string[],
 *   renderings: number,
 *   seconds: number,
 *   settled: number,
 *   unresolved: number,
 *   unstable: number,
 * }>}
 */
const verifyTogether = async (config, keys, plan) => {
	const started = Date.now();
	const pages = [...new Set(plan.map((entry) => entry.page))].sort();
	const corpus = await openCorpus({
		browserName: config.browserName,
		label: `verify-dead-css (${config.label}, together)`,
		pages,
		preset: config.preset,
		widths: { ...viewports, ...narrowViewport },
	});

	let at = "";
	let renderings = 0;
	let settled = 0;
	let unresolved = 0;
	let unstable = 0;
	/** @type {Set<string>} */
	const essential = new Set();

	try {
		for (const step of plan) {
			const target = corpus.visits.find(
				(visit) =>
					visit.page === step.page &&
					visit.scheme === step.scheme &&
					visit.viewport === step.viewport,
			);
			if (!target) continue;

			await corpus.visit(target, async (page, context) => {
				renderings += 1;
				const result = await page.evaluate(measureTogether, {
					needle: sheet,
					wanted: keys,
				});
				settled += result.settled;
				if (result.unstable) unstable += 1;
				if (result.unresolved) unresolved += 1;
				if (!result.moved) return;
				if (!at) at = contextKey(context);
				for (const key of result.essential) essential.add(key);
			});
		}
	} finally {
		await corpus.close();
	}

	return {
		at,
		essential: [...essential],
		renderings,
		seconds: Number(((Date.now() - started) / 1000).toFixed(1)),
		settled,
		unresolved,
		unstable,
	};
};

/** @type {string} */
let sheet = "styles/style.css";

const run = async () => {
	const guard = watchSources({ files: auditSources, label: "verify-dead-css" });
	const resolved = path.resolve(reportPath);
	if (!fs.existsSync(resolved)) {
		throw new Error(
			`verify-dead-css: no report at ${reportPath}. Produce one first:\n` +
				"  node scripts/audit-dead-css.js --json .cache/dead-css.json",
		);
	}

	const report = JSON.parse(fs.readFileSync(resolved, "utf8"));
	sheet = report.sheet ?? sheet;

	// The sweep records what it measured; this pass refuses to build on a
	// report whose sheet has moved since. Reports written before that field
	// existed carry no `sources` and are taken at their word.
	if (report.sources) {
		const now = watchSources({ files: Object.keys(report.sources), label: "" });
		const current = now.digests();
		const moved = Object.keys(report.sources).filter(
			(file) => current[file] !== report.sources[file],
		);
		if (moved.length > 0) {
			throw new Error(
				`verify-dead-css: ${reportPath} was produced from a different ` +
					`tree.\n\n  Changed since the sweep ran:\n` +
					moved.map((file) => `    - ${file}`).join("\n") +
					"\n\n  Its candidates name declarations by position in that " +
					"sheet, so verifying\n  them against this one would check the " +
					"wrong lines. Re-run the sweep.",
			);
		}
	}
	if (!report.verification) {
		throw new Error(
			`verify-dead-css: ${reportPath} predates the verification plan. ` +
				"Re-run audit-dead-css.js --json to produce one.",
		);
	}

	/** @type {Candidate[]} */
	let candidates = report.verification.candidates;
	/** @type {{ keys: string[], page: string, scheme: string, viewport: string }[]} */
	let plan = report.verification.plan;

	if (only) {
		const wanted = new Set(
			candidates
				.filter((candidate) => candidate.selector.includes(only))
				.map((candidate) => candidate.key),
		);
		candidates = candidates.filter((candidate) => wanted.has(candidate.key));
		plan = plan
			.map((step) => ({ ...step, keys: step.keys.filter((key) => wanted.has(key)) }))
			.filter((step) => step.keys.length > 0);
	}

	// The sweep's plan covers the four widths the sweep samples. The one
	// below them is this pass's own: the same pages, in the same schemes,
	// probing the same candidates one tier narrower — see `narrowViewport`.
	// Ten more renderings per configuration, and the one class of false
	// inert that has actually shipped a regression.
	const [narrowName] = Object.keys(narrowViewport);
	for (const step of plan.filter((entry) => entry.viewport === "mobile")) {
		plan.push({ ...step, viewport: narrowName });
	}

	if (candidates.length === 0) {
		console.log(
			`\n[@cirthcss/cirth] No inert candidates in ${reportPath} — nothing to verify.\n`,
		);
		return 0;
	}

	const started = Date.now();
	console.log(
		`\n[@cirthcss/cirth] Verifying ${candidates.length} inert candidate${candidates.length === 1 ? "" : "s"} ` +
			`from ${reportPath}\n  across ${plan.length} rendering${plan.length === 1 ? "" : "s"} ` +
			`in ${configs.length} configuration${configs.length === 1 ? "" : "s"}: ` +
			`${configs.map((config) => `${config.browserName}/${config.preset}`).join(", ")}\n`,
	);

	/** @type {Map<string, ConfigResult>} */
	const results = new Map();
	for (const config of configs) {
		const outcome = await verify(config, candidates, plan);
		results.set(config.label, outcome);
		console.log(
			`  ${config.label.padEnd(9)} ${String(outcome.probes).padStart(5)} probes · ` +
				`${String(outcome.renderings).padStart(3)} renderings · ${outcome.seconds}s · ` +
				`${outcome.liveAt.size} live`,
		);
	}

	// --- Verdicts -----------------------------------------------------
	//
	// One line per candidate, one column per configuration, and the final
	// verdict is a reading of the row rather than of any single cell:
	// anything that moves in Firefox or WebKit is engine-dependent, anything
	// that moves only under a preset is preset-dependent, and a row with no
	// measurement anywhere is not a confirmation of anything.

	/** @param {ConfigResult} outcome @param {string} key */
	const cell = (outcome, key) => {
		if (outcome.liveAt.has(key)) return "live";
		if (outcome.probed.has(key)) return "inert";
		if (outcome.missing.has(key)) return "not in sheet";
		if (outcome.unprobeable.has(key)) return "unprobeable";
		if (outcome.notObservable.has(key)) return "not observable";
		if (outcome.unreached.has(key)) return "unmatched";
		return "not reached";
	};

	/** @type {{ candidate: Candidate, cells: Record<string, string>, verdict: string }[]} */
	const rows = [];
	for (const candidate of candidates) {
		/** @type {Record<string, string>} */
		const cells = {};
		for (const [label, outcome] of results) cells[label] = cell(outcome, candidate.key);

		const engineLive = configs
			.filter(
				(config) =>
					config.preset === "default" && cells[config.label] === "live",
			)
			.map((config) => config.label);
		const presetLive = configs
			.filter(
				(config) =>
					config.preset !== "default" && cells[config.label] === "live",
			)
			.map((config) => config.label);
		const measured = Object.values(cells).some(
			(value) => value === "inert" || value === "live",
		);

		let verdict = "inert";
		if (engineLive.length > 0 && presetLive.length > 0) {
			verdict = `engine-dependent (${engineLive.join(", ")}) + preset-dependent (${presetLive.join(", ")})`;
		} else if (engineLive.length > 0) {
			verdict = `engine-dependent (${engineLive.join(", ")})`;
		} else if (presetLive.length > 0) {
			verdict = `preset-dependent (${presetLive.join(", ")})`;
		} else if (!measured) {
			// Every configuration declined to judge it. The candidate keeps
			// whatever the first sweep said and gains no confirmation.
			const reasons = [...new Set(Object.values(cells))];
			verdict = `unverified — ${reasons.join(", ")}`;
		}

		rows.push({ candidate, cells, verdict });
	}

	// --- Phase two: the deletion, as one operation --------------------

	/** @type {Map<string, string[]>} */
	const together = new Map();
	// key -> the configurations in which the declaration is inert alone but
	// not alongside the rest of the confirmed set.
	/** @type {Map<string, string[]>} */
	const interactingIn = new Map();
	const safe = rows
		.filter((row) => row.verdict === "inert")
		.map((row) => row.candidate.key);

	if (safe.length > 0) {
		console.log(
			`\n[@cirthcss/cirth] Removing all ${safe.length} confirmed-inert declarations at once, ` +
				"which is\n  what a cleanup does and what a one-at-a-time probe cannot see:\n",
		);
		for (const config of configs) {
			const outcome = await verifyTogether(config, safe, plan);
			console.log(
				`  ${config.label.padEnd(9)} ${String(outcome.renderings).padStart(3)} renderings · ${outcome.seconds}s · ` +
					(outcome.at
						? `moved at ${outcome.at}`
						: "nothing moved") +
					(outcome.settled > 0
						? ` · re-measured ${outcome.settled}× (the page moved under the probe)`
						: "") +
					(outcome.unresolved > 0
						? ` · ${outcome.unresolved} rendering(s) moved without naming a group`
						: "") +
					(outcome.unstable > 0
						? ` · ${outcome.unstable} rendering(s) UNSTABLE (a repeat disagreed)`
						: ""),
			);
			if (outcome.at) {
				together.set(config.label, outcome.essential);
				// Every configuration that needs the member, not just the last
				// one to run: the pair below is held up by Firefox *and*
				// WebKit, and writing only the latter over the former made the
				// verdict name one engine for a fact about two.
				for (const key of outcome.essential) {
					interactingIn.set(key, [
						...(interactingIn.get(key) ?? []),
						config.label,
					]);
				}
			}
		}
		for (const [key, labels] of interactingIn) {
			const row = rows.find((entry) => entry.candidate.key === key);
			if (row) {
				row.verdict = `interacting — inert alone, not with the rest (${labels.join(", ")})`;
			}
		}
		console.log("");
	}

	const seconds = ((Date.now() - started) / 1000).toFixed(1);
	const probes = [...results.values()].reduce(
		(sum, outcome) => sum + outcome.probes,
		0,
	);
	const falseInert = rows.filter(
		(row) => row.verdict !== "inert" && !row.verdict.startsWith("unverified"),
	);
	const confirmed = rows.filter((row) => row.verdict === "inert");
	const unverified = rows.filter((row) => row.verdict.startsWith("unverified"));
	const interacting = rows.filter((row) => row.verdict.startsWith("interacting"));

	console.log(
		`\n[@cirthcss/cirth] ${candidates.length} candidates, ${probes} probes, ${seconds}s\n`,
	);
	console.log(`  confirmed inert     ${confirmed.length}`);
	console.log(`  engine/preset-bound ${falseInert.length - interacting.length}`);
	console.log(`  interacting         ${interacting.length}`);
	console.log(`  unverified          ${unverified.length}\n`);

	if (!quiet) {
		const width = Math.max(
			...rows.map(
				(row) =>
					`${row.candidate.selector} { ${row.candidate.property} }`.length,
			),
			9,
		);
		const header = ["candidate".padEnd(width), ...configs.map((config) => config.label.padEnd(14))];
		console.log(`  ${header.join(" ")} verdict`);
		console.log(`  ${"-".repeat(width)} ${configs.map(() => "-".repeat(14)).join(" ")} -------`);
		for (const row of rows) {
			const name = `${row.candidate.selector} { ${row.candidate.property} }`;
			console.log(
				`  ${name.padEnd(width)} ` +
					`${configs.map((config) => row.cells[config.label].padEnd(14)).join(" ")} ` +
					row.verdict,
			);
		}
		console.log("");
	}

	if (falseInert.length > 0) {
		console.log(
			`${falseInert.length} of the ${candidates.length} candidates are not inert. Chromium under the default\n` +
				"theme could not see them; another engine or another preset can. Keep them,\n" +
				"and write down which configuration needs them:\n",
		);
		for (const row of falseInert) {
			console.log(
				`  ${row.candidate.selector} { ${row.candidate.property}: ${row.candidate.value.trim()} }\n` +
					`      ${row.verdict}`,
			);
			for (const [label, outcome] of results) {
				const at = outcome.liveAt.get(row.candidate.key);
				if (at) console.log(`      ${label}: first seen at ${at}`);
			}
		}
		console.log("");
	}

	if (unverified.length > 0) {
		console.log(
			`${unverified.length} candidate${unverified.length === 1 ? " was" : "s were"} not judged by this pass — looked for, not measured.\n` +
				"They keep the first sweep's verdict and gain no confirmation from it:\n",
		);
		for (const row of unverified) {
			console.log(
				`  ${row.candidate.selector} { ${row.candidate.property} } — ${row.verdict}`,
			);
		}
		console.log("");
	}

	if (jsonPath) {
		const out = path.resolve(jsonPath);
		fs.mkdirSync(path.dirname(out), { recursive: true });
		fs.writeFileSync(
			out,
			JSON.stringify(
				{
					configs: configs.map((config) => ({
						browserName: config.browserName,
						label: config.label,
						preset: config.preset,
						probes: results.get(config.label)?.probes,
						renderings: results.get(config.label)?.renderings,
						seconds: results.get(config.label)?.seconds,
					})),
					createdAt: new Date().toISOString(),
					report: reportPath,
					seconds: Number(seconds),
					together: Object.fromEntries(together),
					sheet,
					verdicts: rows.map((row) => ({
						cells: row.cells,
						conditions: row.candidate.conditions,
						key: row.candidate.key,
						property: row.candidate.property,
						selector: row.candidate.selector,
						value: row.candidate.value,
						verdict: row.verdict,
					})),
				},
				null,
				"\t",
			),
		);
		console.log(`[@cirthcss/cirth] Wrote ${jsonPath}`);
	}

	// A reporting tool, like the sweep it follows: it says which candidates
	// survived, and a person decides what to delete — from the sheet this
	// run actually read, which is what the guard is checking.
	guard.assertUnchanged();
	return 0;
};

run().then(
	(code) => process.exit(code),
	(error) => {
		console.error(error);
		process.exit(1);
	},
);
