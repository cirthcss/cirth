const { chromium } = require("playwright");
const {
	assertDocsBuilt,
	createServer,
	listPages,
	startServer,
} = require("./docs-site");

// The rendering corpus the CSS audit is measured against.
//
// Removing a declaration and looking at the home page proves nothing: the
// last audit found two declarations that looked completely inert on all 27
// built pages and were doing real work inside the drawer and the search
// dialog — surfaces that simply are not rendered on a page that has just
// loaded. So the corpus opens what is normally closed, and it says out
// loud which media contexts it does *not* enter, rather than letting a
// rule that only applies in `forced-colors` be reported as dead because
// the query never matched.
//
// A fingerprint is one number per (page, viewport, scheme, state): a hash
// over every element's box and its paint- and layout-bearing computed
// properties. Two runs of the same site produce the same numbers; a
// declaration that changes anything a reader can see changes at least one
// of them.
//
// The corpus renders under `prefers-reduced-motion: reduce`, which is what
// makes those numbers repeatable: the site's own motion — the hero typing
// demo, dialog and disclosure transitions — stops itself there, and a
// measurement taken half way through a transition is noise, not a finding.
// The price is that `prefers-reduced-motion: no-preference` joins
// `forced-colors` and `print` on the list of contexts this corpus does not
// enter, so rules under it are reported as unobservable rather than dead.
// That is the trade this file makes deliberately, and `observable()` below
// is where it is written down.

// Four widths, and the two in the middle are not decoration.
//
// The corpus ran at 1440 and 390 only, and the shell's tier ladder has
// seven boundaries: everything between 36rem and 80rem was sampled by
// neither. Measured consequence — a dozen declarations came back inert
// that are the tablet band's entire layout, because at 390 the narrower
// rule overrides them and at 1440 their query does not match at all. The
// two-column drawer nav, the six-part home grid, the sidebar rail's own
// `grid-template-columns`: all of them, all "dead".
//
// 900 sits in the band where the drawer is the navigation and there is no
// rail; 1100 sits where the rail is back and the page outline is not. With
// 390 and 1440 that is one sample inside every tier this shell declares.
const viewports = {
	desktop: { width: 1440, height: 900 },
	laptop: { width: 1100, height: 900 },
	tablet: { width: 900, height: 900 },
	mobile: { width: 390, height: 844 },
};

/** @type {("light" | "dark")[]} */
const schemes = ["light", "dark"];

// What the matrix above actually exercises. Any rule sitting under a media
// feature outside this set is *not observable here* — a different thing
// from inert, and the distinction the previous audit had to make by hand.
const observableMediaFeatures = new Set([
	"width",
	"min-width",
	"max-width",
	"height",
	"min-height",
	"max-height",
	"orientation",
	"aspect-ratio",
	"min-aspect-ratio",
	"max-aspect-ratio",
	"prefers-color-scheme",
	"scripting",
	"pointer",
	"any-pointer",
	"hover",
	"any-hover",
]);

// Properties read per element. Not the whole computed style: that is ~340
// properties of which most never differ, and the cost is paid once per
// element per state. These are the ones a shell declaration can move.
//
// The rule for what belongs here: anything a reader can see that the four
// numbers of a bounding box cannot show. A property that only ever moves
// geometry — `order`, `justify-self`, `float` — is already covered, because
// moving geometry moves rectangles. A property that repaints without moving
// anything is invisible unless it is named, and the audit reads "invisible"
// as "inert".
//
// That is not hypothetical. The first full sweep called `list-style: none`
// inert on five lists, `cursor: pointer` inert on the copy button, and the
// three `background-position/repeat/size` of the code-block chrome inert —
// all of them because nothing here was looking. Deleting any of them on that
// report would have put bullets back on the footer, changed a cursor and
// moved a gradient, with every rectangle in the document unchanged.
const trackedProperties = [
	"align-content",
	"align-items",
	"background-color",
	"background-image",
	"background-position",
	"background-repeat",
	"background-size",
	"border-block-end",
	"border-block-start",
	"border-inline-end",
	"border-inline-start",
	"border-radius",
	"box-shadow",
	"color",
	"column-gap",
	"content",
	"display",
	"filter",
	"flex",
	"flex-direction",
	"flex-wrap",
	"font-family",
	"font-size",
	"font-style",
	"font-variant",
	"font-weight",
	"grid-column",
	"grid-row",
	"grid-template-columns",
	"grid-template-rows",
	"justify-content",
	"letter-spacing",
	"cursor",
	"line-height",
	"list-style-image",
	"list-style-position",
	"list-style-type",
	"margin",
	"max-height",
	"max-width",
	"min-height",
	"min-width",
	"opacity",
	"outline",
	"overflow",
	"overflow-wrap",
	"padding",
	"pointer-events",
	"position",
	"row-gap",
	"text-align",
	"text-decoration",
	"text-transform",
	"text-underline-offset",
	"transform",
	"visibility",
	"white-space",
	"z-index",
];

// --- In-page half ------------------------------------------------------

// Everything below runs inside the browser. It is written as one string of
// source installed with addInitScript, so both tools get the same
// measurement code and neither can drift from the other.
const pageAgent = `
window.__cirthAudit = (() => {
	const PROPS = ${JSON.stringify(trackedProperties)};
	const PSEUDOS = ["::before", "::after"];

	const hash = (text) => {
		// FNV-1a, 32-bit. Not cryptography: a change detector cheap enough to
		// run over a whole document a few hundred times in a row.
		let value = 0x811c9dc5;
		for (let index = 0; index < text.length; index += 1) {
			value ^= text.charCodeAt(index);
			value = Math.imul(value, 0x01000193) >>> 0;
		}
		return value.toString(36);
	};

	const pathOf = (element) => {
		const parts = [];
		for (let node = element; node && node.nodeType === 1; node = node.parentElement) {
			const parent = node.parentElement;
			const index = parent ? [...parent.children].indexOf(node) : 0;
			parts.unshift(node.tagName.toLowerCase() + "[" + index + "]");
		}
		return parts.join(">");
	};

	const describe = (element) => {
		const box = element.getBoundingClientRect();
		const parts = [
			Math.round(box.x * 100) / 100,
			Math.round(box.y * 100) / 100,
			Math.round(box.width * 100) / 100,
			Math.round(box.height * 100) / 100,
		];
		for (const pseudo of [null, ...PSEUDOS]) {
			const style = getComputedStyle(element, pseudo);
			for (const property of PROPS) parts.push(style.getPropertyValue(property));
		}
		return parts.join("|");
	};

	const measurable = (element) =>
		element.tagName !== "SCRIPT" && element.tagName !== "STYLE";

	// The second half of a rendering, and the half describe() above is
	// structurally blind to.
	//
	// describe() is boxes and computed style. That is the right signal for
	// the audit — removing a CSS declaration cannot change a word of copy —
	// but it made the fingerprint miss the thing a documentation site
	// changes most often. "Zero JavaScript" became "No JavaScript runtime"
	// on a line that did not re-wrap, and 400 renderings reported identical.
	//
	// So: the element's tag, the text it owns *itself*, and the attributes
	// that are part of the document rather than part of its styling. Own
	// text only, not textContent: an ancestor would otherwise repeat every
	// descendant's words, which is quadratic and points a diff at <body>
	// instead of at the paragraph that changed. Whitespace is collapsed, so
	// re-indenting a template is not a finding.
	//
	// The class attribute is deliberately absent. It is the shell's own
	// vocabulary, it is already visible through every computed property it
	// drives, and it is what scripts toggle — including it would trade the
	// signal for noise. Every data- attribute is absent for the same reason.
	const ATTRS = [
		"alt",
		"download",
		"for",
		"headers",
		"href",
		"hreflang",
		"id",
		"lang",
		"name",
		"open",
		"rel",
		"role",
		"scope",
		"src",
		"srcset",
		"title",
		"type",
		"value",
	];

	const describeContent = (element) => {
		let text = "";
		for (const node of element.childNodes) {
			if (node.nodeType === 3) text += node.nodeValue;
		}
		const parts = [element.tagName, text.replace(/\s+/g, " ").trim()];

		for (const name of ATTRS) {
			if (element.hasAttribute(name)) {
				parts.push(name + "=" + element.getAttribute(name));
			}
		}
		// Everything ARIA, whatever it is called: the accessible name and
		// state of the built page are documentation output too.
		for (const attribute of element.attributes) {
			if (attribute.name.startsWith("aria-")) {
				parts.push(attribute.name + "=" + attribute.value);
			}
		}
		return parts.join("|");
	};

	// A per-element digest, so a diff can name what moved instead of only
	// reporting that something did. Style and content are hashed together:
	// one number per element, answering "is this element still the same".
	const collect = () => {
		const digest = Object.create(null);
		let combined = "";
		for (const element of document.querySelectorAll("*")) {
			if (!measurable(element)) continue;
			const description = describe(element) + "~~" + describeContent(element);
			combined += description + "\\n";
			digest[pathOf(element)] = hash(description);
		}
		return { hash: hash(combined), elements: Object.keys(digest).length, digest };
	};

	// The probing half of the same measurement, and the reason the audit
	// finishes in minutes rather than hours. collect() builds a path string
	// and a hash for every element; a probe needs neither. It needs to know
	// whether *anything* moved, so it walks the document against a snapshot
	// taken in the same order and stops at the first element that differs.
	const snapshot = () => {
		const descriptions = [];
		for (const element of document.querySelectorAll("*")) {
			if (measurable(element)) descriptions.push(describe(element));
		}
		return descriptions;
	};

	const differs = (baseline) => {
		let index = 0;
		for (const element of document.querySelectorAll("*")) {
			if (!measurable(element)) continue;
			if (index >= baseline.length) return true;
			if (describe(element) !== baseline[index]) return true;
			index += 1;
		}
		return index !== baseline.length;
	};

	// Measure twice and only believe a number that repeats. Even frozen,
	// a page can still settle a frame late — a dialog that has just been
	// shown, a lazily inserted stylesheet — and a fingerprint that changes
	// between two runs of the same site is worse than no fingerprint.
	const settle = () =>
		new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 60))));

	const collectStable = async (attempts = 6) => {
		let previous = collect();
		for (let attempt = 1; attempt < attempts; attempt += 1) {
			await settle();
			const next = collect();
			if (next.hash === previous.hash) return next;
			previous = next;
		}
		return { ...previous, unstable: true };
	};

	// Open what a freshly loaded page keeps closed. Non-modal for dialogs:
	// showModal() makes the rest of the document inert and takes it out of
	// the measurement, and the point here is to measure both at once.
	const open = () => {
		for (const details of document.querySelectorAll("details")) details.open = true;
		for (const dialog of document.querySelectorAll("dialog")) {
			try {
				if (!dialog.open) dialog.show();
			} catch {}
		}
		for (const element of document.querySelectorAll("[popover]")) {
			try {
				element.showPopover();
			} catch {}
		}
	};

	// The docs stylesheet, as a live CSSOM handle plus a flat index of every
	// declaration in it, each with the at-rule conditions it sits under.
	const sheetOf = (needle) => {
		for (const sheet of document.styleSheets) {
			if (sheet.href && sheet.href.includes(needle)) return sheet;
		}
		return null;
	};

	const index = (needle) => {
		const sheet = sheetOf(needle);
		if (!sheet) return null;
		const declarations = [];
		const walk = (rules, path, conditions) => {
			[...rules].forEach((rule, position) => {
				const here = [...path, position];
				// A style rule is checked first: CSSStyleRule carries a
				// (usually empty) .cssRules of its own now that nesting is
				// supported, so testing for that first walks straight past
				// every declaration in the sheet.
				if (!rule.style || !rule.selectorText) {
					if (!rule.cssRules) return;
					walk(
						rule.cssRules,
						here,
						rule.conditionText === undefined
							? conditions
							: [...conditions, rule.constructor.name + ":" + rule.conditionText],
					);
					return;
				}
				// Authored properties, not the longhands a browser expands a
				// shorthand into: iterating a CSSStyleDeclaration hands back
				// "background-position-x" and friends for a "background:" the
				// source never wrote, which triples the work and reports
				// findings against declarations nobody can go and delete.
				for (const { property, text } of authored(rule.style.cssText)) {
					declarations.push({
						id: here.join(".") + "|" + property,
						path: here,
						property,
						// getPropertyValue serialises to "" for a few values
						// the engine will not round-trip — anything holding
						// env(), for one — so the authored text is the
						// fallback, and it is what env-detection reads.
						value:
							rule.style.getPropertyValue(property) ||
							text.slice(text.indexOf(":") + 1).trim(),
						raw: text,
						priority: rule.style.getPropertyPriority(property),
						selector: rule.selectorText,
						conditions,
					});
				}
			});
		};
		walk(sheet.cssRules, [], []);
		return declarations;
	};

	const ruleAt = (needle, path) => {
		let rules = sheetOf(needle).cssRules;
		let rule = null;
		for (const position of path) {
			rule = rules[position];
			rules = rule.cssRules;
		}
		return rule;
	};

	// Property names as the source wrote them. Splits the serialized block
	// on top-level semicolons — parentheses and quotes hold, so a url() or a
	// content string carrying one does not split a declaration in half.
	const authored = (cssText) => {
		const names = [];
		let depth = 0;
		let quote = "";
		let start = 0;
		const push = (end) => {
			const declaration = cssText.slice(start, end).trim();
			const colon = declaration.indexOf(":");
			if (colon > 0) {
				names.push({
					property: declaration.slice(0, colon).trim(),
					text: declaration,
				});
			}
			start = end + 1;
		};
		for (let index = 0; index < cssText.length; index += 1) {
			const character = cssText[index];
			if (quote) {
				if (character === quote && cssText[index - 1] !== "\\\\") quote = "";
			} else if (character === '"' || character === "'") quote = character;
			else if (character === "(") depth += 1;
			else if (character === ")") depth -= 1;
			else if (character === ";" && depth === 0) push(index);
		}
		push(cssText.length);
		return names;
	};

	// The states this corpus never enters. A rule behind one of them has not
	// been shown to be dead — it has not been looked at, which is a
	// different sentence, and the one a report has to be able to say.
	const STATE_PSEUDO =
		/::?(?:active|autofill|backdrop|default|focus|focus-visible|focus-within|hover|placeholder-shown|selection|target|target-text|user-invalid|user-valid|visited)\\b|::-\\w+-[\\w-]+/g;

	const matches = (selector) => {
		try {
			return document.querySelector(selector) !== null;
		} catch {
			// :has() and friends are all supported; a selector this cannot
			// parse is a browser-support question, not a dead-CSS one.
			return true;
		}
	};

	// Does anything this selector matches sit in a sticky box? An inset on
	// one is a scroll decision, and this corpus does not scroll.
	const sticky = (selector) => {
		try {
			for (const element of document.querySelectorAll(selector)) {
				if (getComputedStyle(element).position === "sticky") return true;
			}
		} catch {
			return false;
		}
		return false;
	};

	// "Would this selector match if the state it asks for were reachable?"
	// Answers "matched", "stateful" — the base matches, the state does not
	// — or "absent".
	const reachability = (selector) => {
		if (matches(selector)) return "matched";
		STATE_PSEUDO.lastIndex = 0;
		if (!STATE_PSEUDO.test(selector)) return "absent";
		const base = selector
			.split(",")
			.map((part) => part.replace(STATE_PSEUDO, "").trim())
			.filter(Boolean)
			.join(", ");
		return base && matches(base) ? "stateful" : "absent";
	};

	return {
		collect,
		collectStable,
		differs,
		hash,
		index,
		matches,
		open,
		reachability,
		ruleAt,
		sticky,
		settle,
		snapshot,
	};
})();
`;

// --- Node half ---------------------------------------------------------

/**
 * @typedef {{
 *   page: string,
 *   viewport: "desktop" | "laptop" | "tablet" | "mobile",
 *   scheme: "light" | "dark",
 *   state: "loaded" | "opened",
 * }} Context
 */

/** @param {Context} context */
const contextKey = (context) =>
	`${context.page} · ${context.viewport} · ${context.scheme} · ${context.state}`;

/**
 * Walk the built site once per (viewport, scheme), capturing both states of
 * every page. `visit` is called with the page handle and the context, after
 * the page has been opened up, so a caller can do more than fingerprint.
 *
 * @param {{
 *   concurrency?: number,
 *   label: string,
 *   onPage?: (page: import("playwright").Page, context: Context) => Promise<void>,
 *   pages?: string[],
 * }} options
 */
const walkSite = async ({ concurrency = 4, label, onPage, pages }) => {
	assertDocsBuilt(label);

	const targets = pages ?? listPages();
	const server = createServer();
	const origin = await startServer(server);
	const browser = await chromium.launch();

	try {
		for (const [viewport, size] of Object.entries(viewports)) {
			for (const scheme of schemes) {
				const context = await browser.newContext({
					colorScheme: scheme,
					// See the note at the top of this file: repeatability is
					// worth more here than coverage of the five no-preference
					// blocks, which `observable()` then declines to judge.
					reducedMotion: "reduce",
					viewport: size,
				});
				await context.addInitScript(pageAgent);

				const queue = [...targets];
				const worker = async () => {
					const page = await context.newPage();
					for (let target = queue.shift(); target; target = queue.shift()) {
						await page.goto(`${origin}/${target}`, { waitUntil: "load" });
						for (const state of /** @type {const} */ (["loaded", "opened"])) {
							if (state === "opened") {
								await page.evaluate(async () => {
									window.__cirthAudit.open();
									await window.__cirthAudit.settle();
								});
							}
							await onPage?.(page, {
								page: target,
								scheme,
								state,
								viewport: /** @type {"desktop"} */ (viewport),
							});
						}
					}
					await page.close();
				};

				await Promise.all(Array.from({ length: concurrency }, worker));
				await context.close();
			}
		}
	} finally {
		await browser.close();
		server.close();
	}
};

/**
 * The same corpus, opened once and driven in whatever order the caller
 * asks for.
 *
 * `walkSite` above is a sweep: it walks the site in a fixed order, which
 * is exactly right for a fingerprint, where every rendering costs the same
 * and the order cannot matter. It is wrong for the audit, where the order
 * is the difference between an hour and ten minutes — a declaration proved
 * live on the first rendering is never probed again, so visiting the
 * richest pages first empties the undecided set fastest. Under `listPages()`
 * order the home page — far and away the richest — sorted *last*.
 *
 * So the four (viewport, scheme) browser contexts are all opened up front
 * and held, each with one page, and the caller drives visits across them in
 * any order for the price of a navigation. A visit is a page in one
 * viewport and scheme; it yields both states, so this costs no more
 * navigations than the sweep does.
 *
 * @param {{ label: string, pages?: string[] }} options
 */
const openCorpus = async ({ label, pages }) => {
	assertDocsBuilt(label);

	const targets = pages ?? listPages();
	const server = createServer();
	const origin = await startServer(server);
	const browser = await chromium.launch();

	/** @type {Map<string, import("playwright").Page>} */
	const sessions = new Map();
	/** @type {{ page: string, viewport: Context["viewport"], scheme: Context["scheme"] }[]} */
	const visits = [];

	for (const [viewport, size] of Object.entries(viewports)) {
		for (const scheme of schemes) {
			const context = await browser.newContext({
				colorScheme: scheme,
				// Same trade as the sweep: see the note at the top of this file.
				reducedMotion: "reduce",
				viewport: size,
			});
			await context.addInitScript(pageAgent);
			sessions.set(`${viewport}|${scheme}`, await context.newPage());

			for (const target of targets) {
				visits.push({
					page: target,
					scheme,
					viewport: /** @type {"desktop"} */ (viewport),
				});
			}
		}
	}

	/**
	 * Load one visit and hand back its two states in order. The page is
	 * navigated once; `opened` is the same document with every disclosure,
	 * dialog and popover opened, which is why it comes second.
	 *
	 * @param {(typeof visits)[number]} visit
	 * @param {(page: import("playwright").Page, context: Context) => Promise<void>} onState
	 */
	const visit = async (visit, onState) => {
		const page = /** @type {import("playwright").Page} */ (
			sessions.get(`${visit.viewport}|${visit.scheme}`)
		);
		await page.goto(`${origin}/${visit.page}`, { waitUntil: "load" });

		for (const state of /** @type {const} */ (["loaded", "opened"])) {
			if (state === "opened") {
				await page.evaluate(async () => {
					window.__cirthAudit.open();
					await window.__cirthAudit.settle();
				});
			}
			await onState(page, { ...visit, state });
		}
	};

	const close = async () => {
		await browser.close();
		server.close();
	};

	return { close, visit, visits };
};

/**
 * True when every media feature this rule sits under is one the corpus
 * actually varies. `forced-colors` and `print` are the two that matter in
 * this repository: a rule under either is unobservable here, and calling it
 * dead would be a measurement error rather than a finding.
 *
 * @param {string[]} conditions
 */
const observable = (conditions) => {
	for (const condition of conditions) {
		if (!condition.startsWith("CSSMediaRule:")) continue;
		const text = condition.slice("CSSMediaRule:".length);
		if (/(^|[\s,(])print([\s,)]|$)/.test(text)) return false;
		for (const [, feature] of text.matchAll(/\(\s*([a-z-]+)\s*[:)]/g)) {
			if (!observableMediaFeatures.has(feature)) return false;
		}
	}
	return true;
};

// Declarations the corpus cannot judge for a reason that is neither the
// selector nor the at-rule: the *kind of thing* they do is one a still
// photograph of a page cannot show.
//
// Each of these was a wrong "inert" in a real report, and each would have
// been a real regression if the report had been believed:
//
// - env()        Playwright emulates a viewport, not a notch, so
//                calc(1rem + env(safe-area-inset-left, 0px)) measures
//                exactly as the 1rem it replaced. Deleting it is the
//                difference between a search dialog that clears an
//                iPhone's rounded corner and one that does not.
// - the scroll   A position: sticky inset pays out only once the page
//   family       moves, and this corpus never scrolls: at offset 0 a
//                sticky header sits exactly where it would sit with
//                top: auto. Three of them — the header, the sidebar rail
//                and the page outline — came back inert on that footing.
// - motion       A transition or an animation is a path between two
//                states, and every measurement here is of one state,
//                taken deliberately after the motion has settled.
const SCROLL_PROPERTIES =
	/^(?:overscroll-behavior|scroll-behavior|scroll-margin|scroll-padding|scroll-snap|scroll-timeline)/;
const MOTION_PROPERTIES = /^(?:animation|transition|view-transition)/;
const INSET_PROPERTIES =
	/^(?:top|right|bottom|left|inset(?:-block|-inline)?)(?:-(?:start|end))?$/;

/** @param {string} property */
const insetProperty = (property) => INSET_PROPERTIES.test(property);

/**
 * @param {{ property: string, raw?: string, sticky?: boolean, value: string }} declaration
 * @returns {"" | "device" | "motion" | "scroll"}
 */
const unmeasurable = (declaration) => {
	if (/\benv\s*\(/.test(declaration.raw ?? declaration.value)) return "device";
	if (SCROLL_PROPERTIES.test(declaration.property)) return "scroll";
	if (MOTION_PROPERTIES.test(declaration.property)) return "motion";
	if (declaration.sticky && insetProperty(declaration.property)) return "scroll";
	return "";
};

module.exports = {
	contextKey,
	insetProperty,
	observable,
	observableMediaFeatures,
	openCorpus,
	pageAgent,
	schemes,
	trackedProperties,
	unmeasurable,
	viewports,
	walkSite,
};
