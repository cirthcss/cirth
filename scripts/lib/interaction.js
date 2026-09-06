// The interaction model behind the dead-CSS verification pass.
//
// One question, asked of a live document: if a cleanup deleted this whole
// set of declarations at once, would anything move — and if so, which
// members is the movement actually made of?
//
// It lives here, apart from scripts/verify-dead-css.js, because the answer
// has to be testable against documents built to have a known answer.
// scripts/check-interaction-model.js does exactly that: fixtures whose
// interactions are constructed, not discovered, so a change to the search
// below fails on a case whose truth does not depend on the docs site.
//
// Everything exported here is *in-page* source. It runs inside
// page.evaluate() against the agent installed by lib/docs-fingerprint.js,
// so it may close over nothing.

// --- Finding the members ------------------------------------------------
//
// The old search was leave-one-out, capped at eight rounds: put one member
// back, take all the rest out, and call that member essential if the page
// stops moving. That is exactly right for one interacting group and wrong
// for two. With two independent pairs, removing all-but-one always leaves
// the other pair fully removed, so the page always moves, so nothing is
// ever named — and the tool reports "something moved, no idea what".
//
// Greedy minimisation answers the same question without that blind spot.
// Take the whole moving set and try to drop each member in turn, keeping
// the drop whenever what is left still moves, and repeat until a pass drops
// nothing. What survives moves and stops moving without any one of its
// members: a minimal interacting group, every member load-bearing. Take
// that group out of the set and ask again, and the next independent group
// comes out.
//
// The bounds are the data's: at most one group per member, and at most one
// minimising pass per member of the group. Both are reached only by a
// document that will not converge, which the loop reports rather than
// truncating — there is no round budget left to run out.

/**
 * The key a candidate is addressed by, matching the report's own scheme:
 * conditions, selector and property, disambiguated by occurrence for the
 * handful of declarations that repeat all three.
 *
 * @param {{ needle: string }} input
 * @returns {string[] | null}
 */
const indexKeys = ({ needle }) => {
	const index = window.__cirthAudit.index(needle);
	if (!index) return null;
	/** @type {Map<string, number>} */
	const seen = new Map();
	return index.map((entry) => {
		const base = `${entry.conditions.join(" && ")}|${entry.selector}|${entry.property}`;
		const occurrence = seen.get(base) ?? 0;
		seen.set(base, occurrence + 1);
		return `${base}#${occurrence}`;
	});
};

/**
 * @param {{ needle: string, wanted: string[] }} input
 * @returns {{
 *   essential: string[],
 *   groups: string[][],
 *   moved: boolean,
 *   passes: number,
 *   settled: number,
 *   unresolved: boolean,
 *   unstable: boolean,
 * }}
 */
const measureTogether = ({ needle, wanted }) => {
	const audit = window.__cirthAudit;
	/** @type {ReturnType<typeof measureTogether>} */
	const nothing = {
		essential: [],
		groups: [],
		moved: false,
		passes: 0,
		settled: 0,
		unresolved: false,
		unstable: false,
	};

	const index = audit.index(needle);
	if (!index) return nothing;

	/** @type {Map<string, number>} */
	const seen = new Map();
	/** @type {Map<string, typeof index[number]>} */
	const byKey = new Map();
	for (const entry of index) {
		const base = `${entry.conditions.join(" && ")}|${entry.selector}|${entry.property}`;
		const occurrence = seen.get(base) ?? 0;
		seen.set(base, occurrence + 1);
		byKey.set(`${base}#${occurrence}`, entry);
	}

	const here = wanted.filter((key) => byKey.has(key));
	if (here.length === 0) return nothing;

	let base = audit.snapshot();

	// How often the document had to be re-measured because a probe left it
	// somewhere else. Removing twenty-odd declarations at once can collapse
	// the header, and the shell's own script then moves the display
	// controls into the drawer — permanently. Putting the CSS back does not
	// put the DOM back, so the reference has to move with it.
	//
	// This is a diagnostic, not a verdict. It used to decide `unstable`,
	// which made every large candidate set look unstable: a set big enough
	// to collapse the header re-baselines once per rendering by
	// construction, and there is nothing wrong with the answer it gives.
	let settled = 0;

	// Remove a whole set at once, measure, and put every rule back exactly
	// as it was. Grouped by rule, so a block's text is saved once and the
	// restore is a single assignment per rule.
	const sweep = (/** @type {string[]} */ keys) => {
		// Always measured against a document that is where it says it is.
		if (audit.differs(base)) {
			base = audit.snapshot();
			settled += 1;
		}
		/** @type {Map<string, { entries: typeof index, path: number[] }>} */
		const byRule = new Map();
		for (const key of keys) {
			const entry = /** @type {typeof index[number]} */ (byKey.get(key));
			const group = byRule.get(entry.path.join(".")) ?? {
				entries: [],
				path: entry.path,
			};
			group.entries.push(entry);
			byRule.set(entry.path.join("."), group);
		}

		/** @type {{ rule: CSSStyleRule, saved: string }[]} */
		const touched = [];
		for (const { entries, path } of byRule.values()) {
			const rule = audit.ruleAt(needle, path);
			touched.push({ rule, saved: rule.style.cssText });
			for (const entry of entries) rule.style.removeProperty(entry.property);
		}
		const moved = audit.differs(base);
		for (const { rule, saved } of touched) rule.style.cssText = saved;
		return moved;
	};

	// `unstable` means one thing: the same question, asked twice of the
	// same document, came back with two different answers. Nothing else —
	// a set can be large, slow, and force a dozen re-baselines and still be
	// perfectly deterministic, which is the common case and used to be
	// reported as instability.
	let unstable = false;
	const agrees = (/** @type {string[]} */ keys, /** @type {boolean} */ expected) => {
		if (sweep(keys) !== expected) unstable = true;
		return !unstable;
	};

	const moved = sweep(here);
	// The decisive measurement, confirmed once. If these two disagree,
	// every verdict below was read off a document that will not hold still,
	// and saying so is more useful than reporting either answer.
	agrees(here, moved);
	if (!moved || unstable) {
		return { ...nothing, moved, settled, unstable };
	}

	/** @type {string[][]} */
	const groups = [];
	let set = here;
	let passes = 0;
	// Set only when the leftovers have been *shown* not to move: either
	// every member was accounted for, or what remains was swept and held
	// still. Falling out of the loop any other way is not convergence.
	let resolved = false;

	// The safety bound is the data's own: every pass names a group of at
	// least one member and takes it out of the set, so there cannot be more
	// passes than there are members. It is a guard against a document that
	// will not converge, not a budget — the loop below exits on its own the
	// moment the remainder stops moving.
	while (passes < here.length) {
		passes += 1;

		// Drop members one at a time, keeping every drop that still moves
		// the page, and repeat until a whole pass drops nothing.
		//
		// The repeat is not belt and braces. A single greedy pass measures
		// each drop against whatever the set happened to be at that moment,
		// so a member kept early was judged against a larger set than the
		// one that comes back — and CSS does not promise that removing less
		// moves less, so it can turn out to be droppable from the smaller
		// set after all. Running to a fixpoint means every member of the
		// result has been measured against the result, which is what makes
		// the confirmation below a genuine second opinion rather than a
		// question that was never actually asked.
		let minimal = set;
		for (let pass = 0; pass < set.length; pass += 1) {
			const before = minimal;
			for (const key of before) {
				const trial = minimal.filter((other) => other !== key);
				if (trial.length > 0 && sweep(trial)) minimal = trial;
			}
			if (minimal.length === before.length) break;
		}

		// The set moves but nothing in it can be dropped and nothing can be
		// kept: the search has stalled on this document. Say so rather than
		// loop to the bound.
		if (minimal.length === 0) break;
		groups.push(minimal);

		// 1-minimality, confirmed: the group moves, and putting any single
		// member back stops it. This is where an oscillating candidate is
		// caught, because it is the same question the minimisation has just
		// answered — a different answer now is the definition of unstable.
		if (!agrees(minimal, true)) break;
		let holds = true;
		for (const key of minimal) {
			if (!agrees(minimal.filter((other) => other !== key), false)) {
				holds = false;
				break;
			}
		}
		if (!holds) break;

		set = set.filter((key) => !minimal.includes(key));
		if (set.length === 0 || !sweep(set)) {
			resolved = true;
			break;
		}
	}

	return {
		essential: [...new Set(groups.flat())],
		groups,
		moved: true,
		passes,
		settled,
		// An interaction the search could not take apart. Deterministic, and
		// therefore not the same thing as instability: it means the movement
		// is real and this document could not attribute it to members.
		unresolved: !unstable && !resolved,
		unstable,
	};
};

module.exports = { indexKeys, measureTogether };
