const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const postcss = require("postcss");
const selectorParser = require("postcss-selector-parser");

const projectRoot = path.join(__dirname, "..");
const distDir = path.join(projectRoot, "dist");
const binExtension = process.platform === "win32" ? ".cmd" : "";
const lightningcss = path.join(
	projectRoot,
	"node_modules/.bin",
	`lightningcss${binExtension}`,
);

// Mechanical invariants of the published dist/ surface, run right after
// the build. Each entry names the contract the build variant promises:
// - classless builds must not emit class selectors (the wrapper class is
//   the single exception in the scoped variant);
// - scoped builds must not emit any rule outside the `.cirth` subtree;
// - presets must only override custom properties on theme roots.
const scopeClass = "cirth";

const rootBuilds = [
	{ name: "cirth", classless: false, scoped: false },
	{ name: "cirth.classless", classless: true, scoped: false },
	{ name: "cirth.scoped", classless: false, scoped: true },
	{ name: "cirth.classless.scoped", classless: true, scoped: true },
];

const presetBuilds = [{ name: "presets/coral" }, { name: "presets/cobalt" }];

const allFiles = [...rootBuilds, ...presetBuilds].flatMap(({ name }) => [
	`${name}.css`,
	`${name}.min.css`,
]);

const failures = [];

const fail = (file, message) => {
	failures.push(`dist/${file}: ${message}`);
};

// --- Presence + Lightning CSS re-parse -------------------------------

// Re-parsing with Lightning CSS (no --error-recovery) rejects any output
// the toolchain produced but a strict parser would drop.
for (const file of allFiles) {
	const filePath = path.join(distDir, file);

	if (!fs.existsSync(filePath)) {
		fail(file, "missing — run `npm run build` first.");
		continue;
	}

	if (fs.statSync(filePath).size === 0) {
		fail(file, "is empty.");
		continue;
	}

	const result = spawnSync(lightningcss, ["--minify", filePath], {
		cwd: projectRoot,
		encoding: "utf8",
	});

	if (result.status !== 0) {
		fail(file, `does not re-parse with Lightning CSS:\n${result.stderr.trim()}`);
	} else if (result.stdout.trim().length === 0) {
		fail(file, "re-parses to an empty stylesheet.");
	}
}

// --- Selector/declaration invariants ---------------------------------

// The expanded and minified files come from the same transform, so the
// structural checks parse the expanded file of each variant.
const parseDist = (file) => {
	const source = fs.readFileSync(path.join(distDir, file), "utf8");
	return postcss.parse(source, { from: file });
};

const isInsideKeyframes = (rule) => {
	for (let node = rule.parent; node; node = node.parent) {
		if (node.type === "atrule" && /keyframes$/i.test(node.name)) {
			return true;
		}
	}
	return false;
};

const walkStyleRules = (root, callback) => {
	root.walkRules((rule) => {
		if (!isInsideKeyframes(rule)) {
			callback(rule);
		}
	});
};

const listClasses = (selector) => {
	const classes = [];
	selectorParser((nodes) => {
		nodes.walkClasses((node) => classes.push(node.value));
	}).processSync(selector);
	return classes;
};

// A selector counts as scoped when its subject can only match the
// wrapper element or a descendant of it. Walking compounds left to
// right we track what the match so far is guaranteed to be: AT the
// wrapper (compound contains `.cirth` directly, or via `:is()`/
// `:where()` whose every branch is scoped) or strictly INSIDE it
// (after a descendant/child combinator). A sibling combinator keeps
// INSIDE (siblings of an inner element share its parent) but voids AT
// (`.cirth ~ p` escapes). `.cirth` inside `:not()`/`:has()` grants no
// scope. So `[dir="rtl"] .cirth input ~ label` passes; `.cirth ~ p`
// fails.
const STATE_NONE = 0;
const STATE_AT = 1;
const STATE_INSIDE = 2;

const compoundScopeState = (node) => {
	if (node.type === "class" && node.value === scopeClass) {
		return STATE_AT;
	}
	if (node.type === "pseudo" && [":is", ":where"].includes(node.value)) {
		if (node.nodes.length === 0) {
			return STATE_NONE;
		}
		const states = node.nodes.map(selectorScopeState);
		if (states.includes(STATE_NONE)) {
			return STATE_NONE;
		}
		return states.includes(STATE_AT) ? STATE_AT : STATE_INSIDE;
	}
	return STATE_NONE;
};

const selectorScopeState = (selectorNode) => {
	let state = STATE_NONE;
	for (const node of selectorNode.nodes) {
		if (node.type === "combinator") {
			if (node.value.trim() === "" || node.value === ">") {
				if (state !== STATE_NONE) {
					state = STATE_INSIDE;
				}
			} else if (state === STATE_AT) {
				state = STATE_NONE;
			}
		} else {
			state = Math.max(state, compoundScopeState(node));
		}
	}
	return state;
};

const isScopedSelector = (selector) => {
	let scoped = false;
	selectorParser((nodes) => {
		scoped = nodes.nodes.every(
			(selectorNode) => selectorScopeState(selectorNode) !== STATE_NONE,
		);
	}).processSync(selector);
	return scoped;
};

for (const { name, classless, scoped } of rootBuilds) {
	const file = `${name}.css`;
	if (!fs.existsSync(path.join(distDir, file))) {
		continue; // already reported above
	}
	const root = parseDist(file);

	if (classless) {
		walkStyleRules(root, (rule) => {
			const offending = listClasses(rule.selector).filter(
				(value) => !(scoped && value === scopeClass),
			);
			if (offending.length > 0) {
				fail(
					file,
					`classless build emits class selector(s) ` +
						`${offending.map((value) => `.${value}`).join(", ")} ` +
						`in \`${rule.selector}\``,
				);
			}
		});
	}

	if (scoped) {
		walkStyleRules(root, (rule) => {
			for (const selector of rule.selectors) {
				if (!isScopedSelector(selector)) {
					fail(file, `rule outside .${scopeClass} scope: \`${selector}\``);
				}
			}
		});
	}
}

// Presets are single-knob token overlays: only custom-property
// declarations, only on theme roots (:root/:host/[data-theme]/.cirth),
// only inside plain @media blocks.
const isPresetSelectorNode = (node) => {
	switch (node.type) {
		case "selector":
			return node.nodes.every(isPresetSelectorNode);
		case "pseudo":
			return (
				[":root", ":host", ":not"].includes(node.value) &&
				node.nodes.every(isPresetSelectorNode)
			);
		case "attribute":
			return node.attribute === "data-theme";
		case "class":
			return node.value === scopeClass;
		default:
			return false;
	}
};

for (const { name } of presetBuilds) {
	const file = `${name}.css`;
	if (!fs.existsSync(path.join(distDir, file))) {
		continue;
	}
	const root = parseDist(file);

	root.walkAtRules((atRule) => {
		if (atRule.name !== "media") {
			fail(file, `preset contains @${atRule.name} — only @media is allowed.`);
		}
	});

	walkStyleRules(root, (rule) => {
		let allowed = true;
		selectorParser((nodes) => {
			allowed = nodes.nodes.every(isPresetSelectorNode);
		}).processSync(rule.selector);
		if (!allowed) {
			fail(file, `preset selector is not a theme root: \`${rule.selector}\``);
		}
	});

	root.walkDecls((decl) => {
		if (!decl.prop.startsWith("--")) {
			fail(
				file,
				`preset declares \`${decl.prop}\` — presets may only set ` +
					`custom properties.`,
			);
		}
	});
}

// --- Report ----------------------------------------------------------

if (failures.length > 0) {
	for (const failure of failures) {
		console.error(`✗ ${failure}`);
	}
	console.error(
		`\ncheck-dist: ${failures.length} invariant violation(s) in dist/.`,
	);
	process.exit(1);
}

console.log(
	`✓ check-dist: ${allFiles.length} files parse and are non-empty; ` +
		`classless builds are class-free, scoped builds stay inside ` +
		`.${scopeClass}, presets only touch custom properties.`,
);
