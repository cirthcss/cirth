const postcss = require("postcss");
const selectorParser = require("postcss-selector-parser");

const EXCLUSION_CLASS = "no-cirth";
const EXCLUSION_GUARD = `:where(:not(.${EXCLUSION_CLASS}, .${EXCLUSION_CLASS} *))`;
const COMPONENT_START = "cirth-component:start";
const COMPONENT_END = "cirth-component:end";

/** @param {string} value */
const compact = (value) => value.replace(/\s+/g, "");
const compactGuard = compact(EXCLUSION_GUARD);
const legacyPseudoElements = new Set([
	":after",
	":before",
	":first-letter",
	":first-line",
]);

/** @param {import("postcss-selector-parser").Node} node */
const isPseudoElement = (node) =>
	node.type === "pseudo" &&
	(node.value.startsWith("::") || legacyPseudoElements.has(node.value));

/** @param {import("postcss-selector-parser").Node} node */
const isGuardNode = (node) =>
	node.type === "pseudo" &&
	node.value === ":where" &&
	compact(node.toString()) === compactGuard;

const newGuardNode = () => {
	const root = selectorParser().astSync(EXCLUSION_GUARD);
	return root.nodes[0].nodes[0].clone();
};

/**
 * A declaration subject is the rightmost compound selector. The guard belongs
 * at the end of that compound, but before a pseudo-element originating from
 * the subject (`button::before`, `dialog::backdrop`, and vendor control
 * pseudos). Functional pseudo-classes such as `:has()` remain part of the
 * subject and stay before the guard.
 *
 * @param {import("postcss-selector-parser").Selector} selector
 */
const appendGuard = (selector) => {
	let compoundStart = 0;
	for (let index = selector.nodes.length - 1; index >= 0; index -= 1) {
		if (selector.nodes[index].type === "combinator") {
			compoundStart = index + 1;
			break;
		}
	}

	const pseudoElement = selector.nodes
		.slice(compoundStart)
		.find(isPseudoElement);
	const guard = newGuardNode();

	if (pseudoElement) {
		// A selector-list branch such as `, ::selection` stores the formatting
		// space on the pseudo node. Move it to the inserted guard or serializing
		// would turn that whitespace into a descendant combinator between the
		// guard and the pseudo-element.
		guard.spaces.before = pseudoElement.spaces.before;
		pseudoElement.spaces.before = "";
		selector.insertBefore(pseudoElement, guard);
	} else {
		selector.append(guard);
	}
};

/**
 * @param {import("postcss-selector-parser").Selector} selector
 * @returns {boolean}
 */
const hasValidGuard = (selector) => {
	let compoundStart = 0;
	for (let index = selector.nodes.length - 1; index >= 0; index -= 1) {
		if (selector.nodes[index].type === "combinator") {
			compoundStart = index + 1;
			break;
		}
	}

	const subject = selector.nodes.slice(compoundStart);
	const guards = subject.filter(isGuardNode);
	if (guards.length !== 1) {
		return false;
	}

	const guardIndex = subject.indexOf(guards[0]);
	const pseudoElementIndex = subject.findIndex(isPseudoElement);
	return pseudoElementIndex === -1 || guardIndex < pseudoElementIndex;
};

/** @param {import("postcss").Rule} rule */
const isInsideKeyframes = (rule) => {
	/** @type {import("postcss").Container | import("postcss").Document | undefined} */
	let node = rule.parent;
	for (; node; node = node.parent) {
		if (
			node.type === "atrule" &&
			/keyframes$/i.test(/** @type {import("postcss").AtRule} */ (node).name)
		) {
			return true;
		}
	}
	return false;
};

/**
 * @param {import("postcss").Rule} rule
 * @param {string} filename
 */
const guardRule = (rule, filename) => {
	if (isInsideKeyframes(rule)) {
		return 0;
	}

	let branches = 0;
	rule.selector = selectorParser((root) => {
		for (const selector of root.nodes) {
			appendGuard(selector);
			branches += 1;
		}
	}).processSync(rule.selector);

	selectorParser((root) => {
		for (const selector of root.nodes) {
			if (!hasValidGuard(selector)) {
				throw new Error(
					`${filename}: exclusion guard was not placed on the subject of ` +
						`\`${selector.toString()}\``,
				);
			}
		}
	}).processSync(rule.selector);

	return branches;
};

/**
 * Apply `.no-cirth` only between explicit component ownership markers.
 * Markers are removed before the CSS reaches Lightning CSS.
 *
 * @param {import("postcss").Root} root
 * @param {string} filename
 */
const transformRoot = (root, filename = "<css>") => {
	let inComponents = false;
	let sections = 0;
	let componentRules = 0;
	let componentBranches = 0;
	let globalRules = 0;

	for (const node of [...root.nodes]) {
		if (node.type === "comment" && node.text.trim() === COMPONENT_START) {
			if (inComponents) {
				throw new Error(`${filename}: nested ${COMPONENT_START} marker`);
			}
			inComponents = true;
			sections += 1;
			node.remove();
			continue;
		}

		if (node.type === "comment" && node.text.trim() === COMPONENT_END) {
			if (!inComponents) {
				throw new Error(`${filename}: unmatched ${COMPONENT_END} marker`);
			}
			inComponents = false;
			node.remove();
			continue;
		}

		/** @type {import("postcss").Rule[]} */
		const rules = [];
		if (node.type === "rule") {
			rules.push(node);
		}
		if ("walkRules" in node && node.type !== "rule") {
			node.walkRules((rule) => {
				rules.push(rule);
			});
		}

		for (const rule of rules) {
			if (isInsideKeyframes(rule)) {
				continue;
			}
			if (inComponents) {
				componentBranches += guardRule(rule, filename);
				componentRules += 1;
			} else {
				globalRules += 1;
				selectorParser((selectors) => {
					for (const selector of selectors.nodes) {
						if (selector.nodes.some(isGuardNode)) {
							throw new Error(
								`${filename}: intentionally global selector carries the ` +
									`component guard: \`${selector.toString()}\``,
							);
						}
					}
				}).processSync(rule.selector);
			}
		}
	}

	if (inComponents) {
		throw new Error(`${filename}: missing ${COMPONENT_END} marker`);
	}

	return { componentBranches, componentRules, globalRules, sections };
};

/**
 * @param {string} css
 * @param {string} [filename]
 */
const transformCss = (css, filename = "<css>") => {
	const root = postcss.parse(css, { from: filename });
	const stats = transformRoot(root, filename);
	return { css: root.toString(), stats };
};

/**
 * Check the form of every `.no-cirth` occurrence after Lightning CSS has
 * regrouped or minified selectors. Source ownership is checked separately by
 * `transformRoot`; this makes sure the optimizer did not produce a malformed
 * or misplaced guard.
 *
 * @param {string} css
 * @param {string} [filename]
 */
const auditFinalCss = (css, filename = "<css>") => {
	const root = postcss.parse(css, { from: filename });
	let guardedBranches = 0;

	root.walkRules((rule) => {
		if (isInsideKeyframes(rule)) {
			return;
		}
		selectorParser((selectors) => {
			for (const selector of selectors.nodes) {
				/** @type {import("postcss-selector-parser").ClassName[]} */
				const exclusionClasses = [];
				selector.walkClasses((node) => {
					if (node.value === EXCLUSION_CLASS) {
						exclusionClasses.push(node);
					}
				});

				if (exclusionClasses.length === 0) {
					continue;
				}
				if (exclusionClasses.length !== 2 || !hasValidGuard(selector)) {
					throw new Error(
						`${filename}: .${EXCLUSION_CLASS} appears outside one valid ` +
							`subject guard in \`${selector.toString()}\``,
					);
				}
				guardedBranches += 1;
			}
		}).processSync(rule.selector);
	});

	return guardedBranches;
};

module.exports = {
	COMPONENT_END,
	COMPONENT_START,
	EXCLUSION_CLASS,
	EXCLUSION_GUARD,
	appendGuard,
	auditFinalCss,
	hasValidGuard,
	transformCss,
	transformRoot,
};
