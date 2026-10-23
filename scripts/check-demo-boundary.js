const fs = require("node:fs");
const path = require("node:path");
const postcss = require("postcss");
const selectorParser = require("postcss-selector-parser");

// The documentation dogfoods Cirth, so its own CSS may lay out and animate
// a live example but must not restyle the components inside one. This
// finds the rules that would:
//
//   - a rule that reaches a semantic element inside a demo container and
//     sets an appearance property (colour, background, border, radius,
//     shadow, type, inner padding, outline, appearance, accent);
//   - a rule on a demo container that sets a --cirth-* token, which every
//     component inside inherits.
//
// It reads the docs stylesheets and the inline <style> of the isolated
// copies in the home page template, where `.cirth` is the copy's root.
// tests/docs-boundary.spec.js checks the same boundary in the browser.
//
//   node scripts/check-demo-boundary.js
//   node scripts/check-demo-boundary.js some.css other.css   (those files only)

const projectRoot = path.join(__dirname, "..");
const given = process.argv.slice(2);
const sheets = given.length > 0 ? given : ["docs/src/styles/style.css", "docs/src/styles/home.css"];
const templates = given.length > 0 ? [] : ["docs/src/_includes/home.njk"];

// Elements whose look belongs to Cirth when they are part of an example.
const containers = new Set([
	"docs-demo",
	"docs-demo-preview",
	"docs-hero-render",
	"docs-story-result",
	"docs-theme-sample",
	"cirth",
]);

const semantic = new Set(
	"a abbr article aside blockquote button caption code dd details dialog dl dt em fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 header hgroup hr img input kbd label legend li main mark menu meter nav ol optgroup option output p pre progress q search section select small strong summary table tbody td textarea tfoot th thead time tr ul".split(
		" ",
	),
);

const appearance = /^(color|background(-.*)?|border(-.*)?|box-shadow|font(-.*)?|line-height|letter-spacing|text-(transform|decoration.*|shadow)|padding(-.*)?|outline(-.*)?|appearance|accent-color|--cirth-.*)$/;

// Deliberate exceptions, each with the reason it is not a restyle.
/** @type {{ selector: RegExp, property: RegExp, reason: string }[]} */
const allowed = [
	{
		selector: /^\.docs-demo$/,
		property: /^--cirth-surface$/,
		reason: "the stage paints its own background and declares it, as colors.md asks of any container",
	},
	{
		selector: /^\.docs-demo-preview$/,
		property: /^--cirth-line-height$/,
		reason: "hands back Cirth's own value, which the prose column re-times",
	},
];

/** @type {string[]} */
const findings = [];

/**
 * @param {string} css
 * @param {string} source
 * @param {number} lineOffset
 */
const audit = (css, source, lineOffset = 0) => {
	postcss.parse(css).walkRules((rule) => {
		if (rule.parent?.type === "atrule" && /keyframes/.test(/** @type {import("postcss").AtRule} */ (rule.parent).name)) return;
		const properties = rule.nodes.filter((node) => node.type === "decl").map((node) => /** @type {import("postcss").Declaration} */ (node).prop);
		for (const selector of rule.selectors) {
			/** @type {any[][]} */
			const compounds = [[]];
			selectorParser((selectors) => {
				selectors.first.walk((node) => {
					if (node.type === "combinator") compounds.push([]);
					else if (node.parent?.type === "selector" && node.parent.parent?.type === "root") compounds.at(-1)?.push(node);
				});
			}).processSync(selector);
			const classes = (/** @type {any[]} */ compound) => compound.filter((node) => node.type === "class").map((node) => node.value);
			const tags = (/** @type {any[]} */ compound) => compound.filter((node) => node.type === "tag").map((node) => node.value.toLowerCase());
			const at = compounds.findIndex((compound) => classes(compound).some((name) => containers.has(name)));
			if (at === -1) continue;
			const line = (rule.source?.start?.line ?? 0) + lineOffset;
			const inside = compounds.slice(at + 1).some((compound) => tags(compound).some((name) => semantic.has(name)));
			const onContainer = at === compounds.length - 1;
			for (const property of properties) {
				if (inside && appearance.test(property)) findings.push(`${source}:${line}  ${selector}  { ${property} }  restyles a component inside a demo`);
				else if (onContainer && property.startsWith("--cirth-")) {
					if (allowed.some((entry) => entry.selector.test(selector.trim()) && entry.property.test(property))) continue;
					findings.push(`${source}:${line}  ${selector}  { ${property} }  sets a Cirth token every component in the demo inherits`);
				}
			}
		}
	});
};

for (const sheet of sheets) audit(fs.readFileSync(path.resolve(projectRoot, sheet), "utf8"), sheet);
for (const template of templates) {
	const text = fs.readFileSync(path.join(projectRoot, template), "utf8");
	for (const match of text.matchAll(/<style\b[^>]*>([^<]*)<\/style>/g)) {
		// Skip the theme demo's per-state stylesheets: setting --cirth-*
		// tokens on the copy is that demo's whole point.
		if (/data-docs-theme-state/.test(match[0])) continue;
		audit(match[1], template, text.slice(0, match.index).split("\n").length - 1);
	}
}

if (findings.length > 0) {
	console.error("check:demo-boundary: docs CSS restyles Cirth inside a live example:");
	for (const finding of findings) console.error(`  ${finding}`);
	process.exit(1);
}
console.log(`check:demo-boundary: no docs rule restyles a component inside a demo (${sheets.length} sheets, ${templates.length} template).`);
