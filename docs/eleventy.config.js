const fs = require("node:fs");
const path = require("node:path");
const { EleventyHtmlBasePlugin } = require("@11ty/eleventy");
const markdownIt = require("markdown-it");
const markdownItAnchor = require("markdown-it-anchor");
const GithubSlugger = require("github-slugger").default;
const hljs = require("highlight.js");
const { buildPagefindIndex } = require("../scripts/build-pagefind");
const { removeBuildOutput } = require("../scripts/lib/build-output");
const { brotliSize, gzipSize } = require("../scripts/lib/compressed-size");
const { listPresetNames, presetLabel } = require("../scripts/lib/presets");
const { docsPathPrefix } = require("../scripts/lib/docs-site");
const { measuredTheme } = require("../scripts/lib/measured-theme");
const frameworks = require("./src/_data/frameworks.js");

// Eleventy replacement for the previous Astro setup. Same site shape:
// docs/src/pages -> docs/dist, one <path>/index.html per page, served at
// https://cirthcss.github.io/cirth/ (GITHUB_PAGES=true sets the /cirth/
// path prefix, rewritten into links by EleventyHtmlBasePlugin).
const docsRoot = __dirname;
const demosFolder = path.join(docsRoot, "src/content/demos");

// The theme preview's declarations, read out of the compiled stylesheets
// rather than written here: the default theme's from the scoped build the
// preview element actually loads, each preset's from its own compiled
// file. A theme is literally a handful of custom properties, and this is
// the honest way to show that — the listing beside the live preview is the
// declaration the real file makes, and the same string is what the demo
// applies.
//
// What this returns, per state, is one already-highlighted line per token
// plus the single-line value to apply. The section shows one block and
// swaps a line at a time, so the declaration that moved can be marked
// where it stands and the two that did not are visibly the same two lines.
// One block rather than one per state also means the shell's copy button —
// which copies `textContent` — can only ever hand over the declarations
// that are on screen.
//
// Whitespace inside a <pre> is content, so the block is assembled here in
// JS where every newline is deliberate, rather than in a template where
// tag boundaries would leak into the listing.
const themePreview = () => {
	const postcss = require("postcss");
	// Preference order, intersected with reality below. Every token named
	// here is one an author would actually write, and one whose effect is
	// visible in the preview beside it.
	const preferred = [
		"--cirth-primary",
		"--cirth-border-radius",
		"--cirth-canvas",
	];
	const generated = path.join(docsRoot, "src/styles/generated");

	// A theme root, and nothing else. The compiled files declare these same
	// names in three other places — inside prefers-contrast and
	// forced-colors blocks, and on components that rebind them locally
	// (`.cirth [type=search] { --cirth-border-radius: … }`) — and none of
	// those is what an author writes. Presets compile to `:root, :host`;
	// the scoped build the preview loads puts the theme on `.cirth`.
	const themeRootPattern = /^(:root|:host|\.cirth)$/;

	// Top level of the file, or top level of the one `@layer cirth` block
	// every compiled file now wraps itself in (gh#124). A rule nested any
	// deeper sits in a media query, which is the case excluded above.
	/** @param {import("postcss").Rule} rule */
	const atTopLevel = (rule) => {
		const parent = rule.parent;
		if (parent?.type === "root") return true;
		return (
			parent?.type === "atrule" &&
			/** @type {import("postcss").AtRule} */ (parent).name === "layer" &&
			parent.parent?.type === "root"
		);
	};

	/**
	 * @param {string} file
	 * @returns {Map<string, string>}
	 */
	const read = (file) => {
		const found = new Map();
		if (!fs.existsSync(file)) return found;
		postcss.parse(fs.readFileSync(file, "utf8")).walkRules((rule) => {
			if (!atTopLevel(rule)) return;
			if (
				!rule.selector
					.split(",")
					.every((selector) => themeRootPattern.test(selector.trim()))
			) {
				return;
			}
			for (const declaration of rule.nodes ?? []) {
				if (declaration.type !== "decl") continue;
				if (!preferred.includes(declaration.prop)) continue;
				// One line, and none of the compiled file's own padding: the
				// default build writes `light-dark( a, b )` with the parens
				// spaced and the preset files do not, and this value is both
				// listed and applied — two formattings of one declaration
				// would show up as the listing and the demo disagreeing.
				found.set(
					declaration.prop,
					declaration.value
						.replace(/\s+/g, " ")
						.replace(/\(\s+/g, "(")
						.replace(/\s+\)/g, ")"),
				);
			}
		});
		return found;
	};

	const states = [
		{
			name: "default",
			label: "Default theme",
			file: "cirth.scoped.css",
			declarations: read(path.join(generated, "cirth-lab-scoped.css")),
		},
		...listPresetNames().map((name) => ({
			name,
			label: `${presetLabel(name)} preset`,
			file: `presets/${name}.css`,
			declarations: read(path.join(generated, `presets/${name}.css`)),
		})),
	];

	// Only the tokens every state really declares. A line that one file does
	// not set could only be filled with an inherited value or a blank, and
	// both would be a listing describing something the file does not say —
	// so the set of lines is the intersection, and it maintains itself: a
	// preset that stops declaring one drops the line for all of them rather
	// than inventing it for one.
	const tokens = preferred.filter((prop) =>
		states.every((state) => state.declarations.has(prop)),
	);

	// `light-dark(a, b)` is one long line — 700px of it at the pane's
	// measure, which scrolls rather than reads. Broken at the comma the way
	// the source file itself breaks it, so the pane shows the whole
	// declaration instead of the first two thirds of one. The captures are
	// lazy and eat their own padding: the compiled default writes
	// `light-dark( a, b )` with the parens spaced, and a greedy `(.+)`
	// carried that space into the reflowed line.
	/** @param {string} value */
	const reflow = (value) =>
		value.length > 46 && value.startsWith("light-dark(")
			? value.replace(
					/^light-dark\(\s*(.+?)\s*,\s*(.+?)\s*\)$/,
					"light-dark(\n    $1,\n    $2\n  )",
				)
			: value;

	// Highlighted one declaration at a time. Checked against the whole
	// block: highlight.js emits byte-identical markup for `  --prop: value;`
	// on its own as it does for the same line inside a rule, so the listing
	// is the same listing the fenced-code pipeline would produce.
	/**
	 * @param {string} prop
	 * @param {string} value
	 */
	const declaration = (prop, value) =>
		hljs.highlight(`  ${prop}: ${value};`, {
			language: "css",
			ignoreIllegals: true,
		}).value;

	// The selector the demo's own stylesheet really carries. The preview is
	// a custom element holding the scoped build in a shadow root, so
	// `.cirth` is the theme root in there — printing `:root` would be
	// printing a rule the page does not apply anywhere.
	const selector = ".cirth";

	// The listing as served: one line group per token, so the script can
	// swap a line where it stands. Assembled here rather than in the
	// template because every newline between these spans is content of a
	// <pre> — a tag boundary in a template leaks into the listing, and a
	// <pre> that carries its line breaks in CSS copies out as one line.
	/** @param {{ lines: Record<string, { value: string, html: string }> }} state */
	const block = (state) =>
		`${hljs.highlight(`${selector} {`, { language: "css" }).value}\n` +
		`${tokens
			.map(
				(prop) =>
					`<span class="docs-token" data-token="${prop}">` +
					`${state.lines[prop].html}</span>`,
			)
			.join("\n")}\n}`;

	const rendered = states.map((state) => ({
		name: state.name,
		label: state.label,
		file: state.file,
		lines: Object.fromEntries(
			tokens.map((prop) => {
				const value = String(state.declarations.get(prop));
				return [prop, { value, html: declaration(prop, reflow(value)) }];
			}),
		),
	}));

	return {
		selector,
		tokens,
		states: rendered,
		block: block(rendered[0]),
	};
};

// The shipped build modes, counted off the source entrypoints rather than
// written down: only top-level `src/cirth*.scss` files compile, and the
// print sheets are a companion to a build rather than a build to choose
// between. Adding a fifth mode moves this number and the proof cell that
// quotes it without anyone remembering to.
const buildModeCount = () =>
	fs
		.readdirSync(path.join(docsRoot, "../src"))
		.filter((file) => /^cirth(?!\.print)[.a-z]*\.scss$/.test(file)).length;

const runtimeTokenCount = () => {
	const generatedBuild = path.join(
		docsRoot,
		"src/styles/generated/cirth-lab-default.css",
	);
	if (!fs.existsSync(generatedBuild)) return 0;
	const css = fs.readFileSync(generatedBuild, "utf8");
	return new Set(css.match(/--cirth-[a-z0-9-]+/g) ?? []).size;
};

// The gzipped size of the default build, measured here rather than
// written down: the home page states the size as a measurement taken on
// this build, not as a ceiling the project promises never to cross, so the
// number has to come off the file every time the site is built.
// `scripts/check-css-size.js` gzips the same bytes at the same level, and
// is what fails a build that grows past the current budget.
//
// dist/ is produced by `npm run build`, which runs before `docs:build`
// everywhere it matters (CI, the deploy workflow, the release script). If
// it is missing — a docs-only local run — the cell falls back to the
// budget rather than printing a zero, and says which it is.
const defaultBuildSize = () => {
	const file = path.join(docsRoot, "../dist/cirth.min.css");
	if (!fs.existsSync(file)) return null;
	const source = fs.readFileSync(file);
	const bytes = gzipSize(source);
	const kb = (/** @type {number} */ value) => `${(value / 1024).toFixed(1)} KB`;
	// `label` is the quoted figure: gzip, because that is what the delivery
	// paths this site documents actually send. `brotliLabel` is the best case
	// a host reaches by precompressing the file itself — reported, never
	// promised. See scripts/lib/compressed-size.js.
	return { bytes, label: kb(bytes), brotliLabel: kb(brotliSize(source)) };
};

// The radius pair (a container's corner against the corners of the
// controls inside it), resolved off the compiled stylesheet rather than
// written down. The Brand page quotes both numbers as the thing that
// survives a retheme, and it quoted them wrong for three minor versions:
// the knob moved from `radius-md` to `radius-sm` in "establish a
// recognizable default surface" and the prose kept saying 9px and 6px
// while the build shipped 6px and 4px. A number a reader can check
// against `dist/` has to come out of `dist/`.
//
// The resolver is deliberately narrow. It follows the two shapes the
// radius tokens actually use (`var(--other)` and
// `calc(var(--other) * <n>)`) down to a `rem` or `px` literal, and
// returns null on anything else rather than guessing. A null prints as a
// token name with no measurement, which is missing information; a guess
// would be wrong information.
const radiusPair = () => {
	const file = path.join(docsRoot, "../dist/cirth.min.css");
	if (!fs.existsSync(file)) return null;
	const css = fs.readFileSync(file, "utf8");

	// Root custom properties only. A token redeclared inside a component
	// scope (`article` moves --cirth-block-spacing-*, [type=search] moves
	// the radius to a pill) is that component's decision, not the default
	// this table describes, so the first declaration is the one read: the
	// `:root` one, which the minifier emits ahead of the scoped overrides.
	/** @type {Map<string, string>} */
	const declared = new Map();
	for (const [, name, value] of css.matchAll(
		/(--cirth-[a-z0-9-]+)\s*:\s*([^;}]+)/g,
	)) {
		if (!declared.has(name)) declared.set(name, value.trim());
	}

	const ROOT_FONT_SIZE = 16;
	/**
	 * @param {string} name
	 * @param {number} depth
	 * @returns {number | null}
	 */
	const resolve = (name, depth = 0) => {
		if (depth > 8) return null;
		const value = declared.get(name);
		if (!value) return null;

		const rem = /^(-?[0-9.]+)rem$/.exec(value);
		if (rem) return Number(rem[1]) * ROOT_FONT_SIZE;
		const px = /^(-?[0-9.]+)px$/.exec(value);
		if (px) return Number(px[1]);

		const alias = /^var\((--cirth-[a-z0-9-]+)\)$/.exec(value);
		if (alias) return resolve(alias[1], depth + 1);

		const scaled = /^calc\(\s*var\((--cirth-[a-z0-9-]+)\)\s*\*\s*([0-9.]+)\s*\)$/.exec(
			value,
		);
		if (scaled) {
			const base = resolve(scaled[1], depth + 1);
			return base === null ? null : base * Number(scaled[2]);
		}
		return null;
	};

	/** @param {number | null} value */
	const px = (value) =>
		value === null ? null : `${Math.round(value * 100) / 100}px`;

	return {
		control: px(resolve("--cirth-border-radius")),
		container: px(resolve("--cirth-card-border-radius")),
	};
};

// The supported browsers, read off the one place that decides them: the
// Browserslist target in package.json, which is what Lightning CSS
// compiles against and what scripts/check-browserslist.js holds to a
// single engine floor. Written out as a sentence so the FAQ answer cannot
// drift from the target the build actually uses — raising the floor
// rewrites the answer.
const browserTargets = () => {
	const names = {
		Chrome: "Chrome",
		ChromeAndroid: "Chrome for Android",
		Edge: "Edge",
		Firefox: "Firefox",
		FirefoxAndroid: "Firefox for Android",
		iOS: "iOS Safari",
		Opera: "Opera",
		Safari: "Safari",
		Samsung: "Samsung Internet",
	};
	const manifest = JSON.parse(
		fs.readFileSync(path.join(docsRoot, "../package.json"), "utf8"),
	);

	/** @type {Map<string, string[]>} */
	const byVersion = new Map();
	for (const entry of manifest.browserslist ?? []) {
		const match = /^([A-Za-z]+)\s*>=\s*([0-9.]+)$/.exec(String(entry));
		if (!match) continue;
		const [, family, version] = match;
		byVersion.set(version, [
			...(byVersion.get(version) ?? []),
			names[family] ?? family,
		]);
	}

	// Families that share a floor share a clause: "Chrome, Chrome for
	// Android and Edge 123+" is one fact, and three clauses would read as
	// three.
	const clauses = [...byVersion.entries()].map(([version, families]) => {
		const listed =
			families.length > 1
				? `${families.slice(0, -1).join(", ")} and ${families.at(-1)}`
				: families[0];
		return `${listed} ${version}+`;
	});

	return { sentence: clauses.join("; ") };
};

const escapeHtml = (value) =>
	value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");

// Static, build-time-only SVG icons: Phosphor, "regular" weight, viewBox
// 0 0 256 256, path data extracted from @phosphor-icons/vue for pixel
// parity. Zero client JS.
//
// One weight, one grid, one box, so the set reads as one set. Every entry
// here is rendered somewhere: the shortcode throws on a name it does not
// know, which catches a typo, and nothing catches a definition that no
// page asks for. Add a glyph when a page needs it.
const iconPaths = {
	search:
		"M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z",
	moon: "M233.54,142.23a8,8,0,0,0-8-2,88.08,88.08,0,0,1-109.8-109.8,8,8,0,0,0-10-10,104.84,104.84,0,0,0-52.91,37A104,104,0,0,0,136,224a103.09,103.09,0,0,0,62.52-20.88,104.84,104.84,0,0,0,37-52.91A8,8,0,0,0,233.54,142.23ZM188.9,190.34A88,88,0,0,1,65.66,67.11a89,89,0,0,1,31.4-26A106,106,0,0,0,96,56,104.11,104.11,0,0,0,200,160a106,106,0,0,0,14.92-1.06A89,89,0,0,1,188.9,190.34Z",
	// Phosphor's dots-three-vertical: three r=28 discs on the vertical
	// centreline at 48 / 128 / 208. Written as circles rather than copied
	// out of the package because the geometry *is* the icon, so parity
	// holds by construction.
	"dots-three-vertical":
		"M100,48a28,28,0,1,0,56,0a28,28,0,1,0-56,0ZM100,128a28,28,0,1,0,56,0a28,28,0,1,0-56,0ZM100,208a28,28,0,1,0,56,0a28,28,0,1,0-56,0Z",
	sun: "M120,40V16a8,8,0,0,1,16,0V40a8,8,0,0,1-16,0Zm72,88a64,64,0,1,1-64-64A64.07,64.07,0,0,1,192,128Zm-16,0a48,48,0,1,0-48,48A48.05,48.05,0,0,0,176,128ZM58.34,69.66A8,8,0,0,0,69.66,58.34l-16-16A8,8,0,0,0,42.34,53.66Zm0,116.68-16,16a8,8,0,0,0,11.32,11.32l16-16a8,8,0,0,0-11.32-11.32ZM192,72a8,8,0,0,0,5.66-2.34l16-16a8,8,0,0,0-11.32-11.32l-16,16A8,8,0,0,0,192,72Zm5.66,114.34a8,8,0,0,0-11.32,11.32l16,16a8,8,0,0,0,11.32-11.32ZM48,128a8,8,0,0,0-8-8H16a8,8,0,0,0,0,16H40A8,8,0,0,0,48,128Zm80,80a8,8,0,0,0-8,8v24a8,8,0,0,0,16,0V216A8,8,0,0,0,128,208Zm112-88H216a8,8,0,0,0,0,16h24a8,8,0,0,0,0-16Z",
};

module.exports = (eleventyConfig) => {
	eleventyConfig.addGlobalData("proof", {
		tokenCount: runtimeTokenCount(),
		buildCount: buildModeCount(),
		size: defaultBuildSize(),
		radius: radiusPair(),
	});
	eleventyConfig.addGlobalData(
		"presets",
		listPresetNames().map((name) => ({ label: presetLabel(name), name })),
	);
	eleventyConfig.addGlobalData("themePreview", themePreview());
	eleventyConfig.addGlobalData("browsers", browserTargets());
	// Surface levels, edges, inks, the accent, the states and the rhythm,
	// measured off dist/tokens for the Brand and Colors pages; null on a
	// docs-only run with no build, where the pages print token names only.
	eleventyConfig.addGlobalData("measured", measuredTheme(path.join(docsRoot, "..")));

	// --- Markdown pipeline ------------------------------------------------
	// Fenced code: highlight.js token classes (same .hljs-* classes the docs
	// shell has colored since the VitePress era) + tabindex="0" so
	// horizontally scrollable blocks stay keyboard-reachable (axe:
	// scrollable-region-focusable).
	const markdown = markdownIt({
		html: true,
		linkify: false,
		highlight: (code, language) => {
			if (language && hljs.getLanguage(language)) {
				const { value } = hljs.highlight(code, {
					language,
					ignoreIllegals: true,
				});
				return `<pre tabindex="0"><code class="hljs language-${language}">${value}</code></pre>`;
			}
			return `<pre tabindex="0"><code>${escapeHtml(code)}</code></pre>`;
		},
	});

	// Heading ids (GitHub-style slugs, matching the previous Astro output so
	// existing #fragment links keep resolving) plus a visible-on-hover
	// permalink anchor — the .header-anchor affordance the VitePress site
	// had and the Astro port lost (gh#54).
	const slugger = new GithubSlugger();
	markdown.use(markdownItAnchor, {
		slugify: (title) => slugger.slug(title),
		level: [2, 3, 4],
		permalink: markdownItAnchor.permalink.linkInsideHeader({
			class: "header-anchor",
			symbol: "#",
			ariaHidden: false,
			assistiveText: (title) => `Permalink to "${title}"`,
		}),
	});

	// Markdown tables can become wider than the reading column at narrow
	// viewports or under text zoom. Keep that overflow local and make the
	// resulting scroll region keyboard reachable. The column names produce
	// a useful, page-specific accessible name instead of a repeated generic
	// "scrollable table" landmark.
	markdown.renderer.rules.table_open = (tokens, index) => {
		const columnNames = [];
		for (let cursor = index + 1; cursor < tokens.length; cursor += 1) {
			if (tokens[cursor].type === "tbody_open") break;
			if (tokens[cursor].type !== "th_open") continue;

			const inline = tokens.slice(cursor + 1).find((token) => token.type === "inline");
			if (inline?.content) columnNames.push(inline.content.replace(/[*_`]/g, ""));
		}

		const suffix = columnNames.length > 0 ? `: ${columnNames.join(", ")}` : "";
		return `<div class="overflow-auto docs-table-scroll" tabindex="0" role="region" aria-label="Table${escapeHtml(suffix)}"><table>`;
	};
	markdown.renderer.rules.table_close = () => "</table></div>";
	// One slugger per build, reset per page, so repeated headings on a page
	// dedupe (foo, foo-1) without pages leaking suffixes into each other.
	eleventyConfig.on("eleventy.before", () => slugger.reset());

	// Eleventy doesn't clean its output directory (Astro did); start each
	// process fresh so stale pages, or iCloud "name 2.html" duplicates,
	// can't accumulate. The directory is the one Eleventy reports for this
	// build (`directories.output`): docs/dist normally, or whatever
	// `--output` named, so a build pointed elsewhere never touches the real
	// site. It is cleaned once per process: in --serve mode eleventy.before
	// also runs for incremental rebuilds, where deleting the active output
	// directory leaves Eleventy with nowhere to write.
	const cleanedOutputs = new Set();
	/** @param {{ directories: { output: string } }} event */
	const buildOutput = ({ directories }) => path.resolve(directories.output);
	eleventyConfig.on("eleventy.before", (/** @type {any} */ event) => {
		const output = buildOutput(event);
		if (cleanedOutputs.has(output)) return;
		removeBuildOutput(output, {
			sources: [event.directories.input, event.directories.includes, event.directories.data].filter(Boolean),
		});
		cleanedOutputs.add(output);
	});
	// Search is indexed from, and written into, the same directory.
	eleventyConfig.on("eleventy.after", (/** @type {any} */ event) => buildPagefindIndex({ outputDir: buildOutput(event) }));
	markdown.core.ruler.before("normalize", "cirth-reset-slugs", () => {
		slugger.reset();
		return true;
	});

	eleventyConfig.setLibrary("md", markdown);

	// --- Shortcodes -------------------------------------------------------
	// Live example + "Show HTML" source (the previous Demo.astro): the raw
	// snippet is read at build time and injected both rendered and as
	// literal text. Zero client JS — the <details> disclosure is native.
	//
	// Two-phase on purpose: the shortcode runs before markdown-it, and a
	// demo snippet containing a blank line would terminate the surrounding
	// CommonMark HTML block, re-parsing the rest of the snippet as markdown
	// (this silently broke the customization demo's <style> overrides). The
	// shortcode emits a single-line placeholder comment — inert to markdown
	// — and the transform below swaps in the real HTML after rendering.
	const buildDemo = (src, variant, frame) => {
		const file = path.join(demosFolder, `${src}.html`);
		if (!fs.existsSync(file)) {
			throw new Error(`[demo] missing snippet: ${src}.html`);
		}
		const html = fs.readFileSync(file, "utf8").trim();
		const classlessClass = variant === "classless" ? " cirth-classless" : "";
		const frameClass = frame === "narrow" ? " docs-demo-narrow" : "";
		// A caption only when it says something the page does not: which
		// build renders the example, when it is not the default one. The
		// same two lines of metadata on every demo were read once and then
		// skipped, on every page.
		const caption =
			variant === "classless"
				? `<figcaption class="docs-demo-caption">Classless build</figcaption>\n`
				: "";
		return `<figure class="docs-demo${frameClass}">
${caption}<div class="docs-demo-preview${classlessClass}">${html}</div>
<details class="docs-demo-source">
<summary>HTML</summary>
<pre tabindex="0"><code class="hljs language-html">${
			hljs.highlight(html, { language: "html", ignoreIllegals: true }).value
		}</code></pre>
</details>
</figure>`;
	};

	// One source per example. Most pages follow a demo with the listing a
	// reader should copy, written for reading rather than rendered inline;
	// with the demo's own disclosure beside it the same code appeared twice.
	// When an HTML listing follows a demo directly it becomes the demo's
	// source band, open, and the disclosure goes; a demo with no listing
	// after it keeps the disclosure.
	const adoptListing = (content) =>
		content.replace(
			/<details class="docs-demo-source">[\s\S]*?<\/details>\n<\/figure>\s*(<pre[^>]*><code class="hljs language-html">[\s\S]*?<\/code><\/pre>)/g,
			(_, listing) => `<div class="docs-demo-source">${listing}</div>\n</figure>`,
		);

	// `frame` is the stage's width, not the example's: "narrow" gives a
	// screen that is narrow by nature (a sign-in card) a stage its own size
	// instead of the full column. Nothing inside the preview changes.
	eleventyConfig.addShortcode(
		"demo",
		(src, variant = "default", frame = "") =>
			`<!--cirth-demo:${src}:${variant}${frame ? `:${frame}` : ""}-->`,
	);

	eleventyConfig.addTransform("cirth-demos", (content, outputPath) => {
		if (!outputPath?.endsWith(".html")) return content;
		return adoptListing(
			content.replace(
				/<!--cirth-demo:([\w-]+):(\w+)(?::(\w+))?-->/g,
				(_, src, variant, frame) => buildDemo(src, variant, frame),
			),
		);
	});

	eleventyConfig.addShortcode("icon", (name, size = 20, className = "") => {
		const d = iconPaths[name];
		if (!d) throw new Error(`[icon] unknown icon: ${name}`);
		const classAttribute = className ? ` class="${className}"` : "";
		return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="${size}" height="${size}" fill="currentColor" aria-hidden="true"${classAttribute}><path d="${d}"/></svg>`;
	});

	// Light-mode --cirth-primary swatches for the default theme and each
	// preset (values from src/theme/_dual.scss and src/presets/*.scss).
	// A data URI cannot read a custom property, and neither can a swatch that
	// has to sit next to the preset it names while the page is in another
	// preset — so these are literals, and they have to be re-read from source
	// when the default accent moves.
	eleventyConfig.addShortcode("colorSwatches", () => {
		const colors = [
			{ name: "default", hex: "#aa46b4", note: "default theme" },
			{ name: "plain", hex: "#1c65c8", note: "preset" },
			{ name: "material", hex: "#6750a4", note: "preset" },
			{ name: "metro", hex: "#0050ef", note: "preset" },
		];
		return `<div class="docs-colors-grid">${colors
			.map(
				(color) => `<article class="docs-color-swatch">
<div class="docs-color-swatch-preview" style="background-color: ${color.hex}"><span style="color: #fff; font-size: 0.75rem; font-weight: 600;">Aa</span></div>
<div class="docs-color-swatch-label">${color.name} (${color.note})</div>
</article>`,
			)
			.join("")}</div>
<section class="docs-theme-lab" aria-label="Default theme role comparison">
  <figure data-theme="light">
    <figcaption><strong>Light</strong><code>data-theme="light"</code></figcaption>
    <div class="docs-theme-sample"><article><small>Verified state</small><h3>Semantic surface</h3><p>Canvas, card, text, border and accent signal are live theme roles.</p><button type="button">Primary action</button></article></div>
    <dl class="grid"><div><dt>Canvas</dt><dd><i style="background:var(--cirth-background-color)"></i><code>--cirth-background-color</code></dd></div><div><dt>Signal</dt><dd><i style="background:var(--cirth-primary)"></i><code>--cirth-primary</code></dd></div></dl>
  </figure>
  <figure data-theme="dark">
    <figcaption><strong>Dark</strong><code>data-theme="dark"</code></figcaption>
    <div class="docs-theme-sample"><article><small>Verified state</small><h3>Semantic surface</h3><p>Dark roles are designed values, not a mathematical inversion.</p><button type="button">Primary action</button></article></div>
    <dl class="grid"><div><dt>Canvas</dt><dd><i style="background:var(--cirth-background-color)"></i><code>--cirth-background-color</code></dd></div><div><dt>Signal</dt><dd><i style="background:var(--cirth-primary)"></i><code>--cirth-primary</code></dd></div></dl>
  </figure>
</section>`;
	});

	// --- Filters ----------------------------------------------------------
	// Syntax highlighting for source that is not coming through markdown: the
	// hero's source panel, and the specimens the home page declares once and
	// renders twice (live, and highlighted into the pane beside it). Same
	// highlight.js pass and same .hljs-* classes the fenced-code pipeline
	// above emits, so there is one highlighter in the build and none in the
	// browser. The language is a parameter because the theme section shows
	// the stylesheet that moved the tokens, not markup.
	eleventyConfig.addFilter(
		"highlight",
		(code, language = "html") =>
			hljs.highlight(String(code), { language, ignoreIllegals: true }).value,
	);

	// How many class names a snippet carries, counted rather than claimed:
	// the home page's story quotes the number beside the markup it counts.
	eleventyConfig.addFilter("classCount", (html) =>
		[...String(html).matchAll(/\sclass="([^"]*)"/g)].reduce(
			(total, [, value]) => total + value.split(/\s+/).filter(Boolean).length,
			0,
		),
	);

	// A framework guide's own shape, laid on the page markdown already
	// rendered, so the source stays plain markdown and every rhythm rule
	// that reads the column's direct children keeps reading them. Three
	// changes, all to what is already there:
	//
	//   · the <h1> carries the guide's marks before its text. They are
	//     decorative (alt=""): the title is the name, and firstHeading
	//     strips the images, so <title> and the search index read "Vite";
	//   · a sentence under the lead says what the guide will have you do,
	//     taken from the step headings themselves, so it cannot drift from
	//     them;
	//   · a numbered <h2> ("2. Import it") becomes a step: its number set
	//     apart in a badge, where the heading's name reads "2 Import it",
	//     and the id and the anchor untouched, so every link to a step
	//     still lands.
	const numberWords = ["", "One step", "Two steps", "Three steps", "Four steps", "Five steps", "Six steps"];
	/** @param {{ file: string, dark?: string, aspect: number }} mark */
	const markImages = (mark, height) => {
		const width = Math.round(mark.aspect * height);
		const image = (file, variant) =>
			`<img class="docs-mark-image${variant ? ` docs-logo docs-logo-${variant}` : ""}" src="/logos/frameworks/${file}" alt="" width="${width}" height="${height}" decoding="async">`;
		return mark.dark
			? image(mark.file, "light") + image(mark.dark, "dark")
			: image(mark.file, "");
	};
	eleventyConfig.addFilter("frameworkGuide", (content, id) => {
		const guide = frameworks.guides.find((entry) => entry.id === id);
		if (!guide) throw new Error(`[frameworkGuide] unknown guide: ${id}`);
		let html = String(content);

		const stepPattern =
			/<h2 id="([^"]+)" tabindex="-1">(\d+)\. ([\s\S]*?) (<a class="header-anchor"[\s\S]*?<\/a>)<\/h2>/g;
		const steps = [...html.matchAll(stepPattern)].map((match) => match[3]);
		html = html.replace(
			stepPattern,
			(_, slug, number, title, anchor) =>
				`<h2 id="${slug}" tabindex="-1" class="docs-step-heading"><span class="docs-step-number">${number}</span> ${title} ${anchor}</h2>`,
		);

		const marks = guide.marks
			.map((mark) => `<span class="docs-mark">${markImages(frameworks.marks[mark], 40)}</span>`)
			.join("");
		if (!/<h1>[\s\S]*?<\/h1>/.test(html)) {
			throw new Error(`[frameworkGuide] ${id}: no <h1> to carry the marks`);
		}
		html = html.replace(
			/<h1>([\s\S]*?)<\/h1>/,
			(_, title) => `<h1 class="docs-guide-title"><span class="docs-guide-marks">${marks}</span>${title}</h1>`,
		);

		if (steps.length > 1 && steps.length < numberWords.length) {
			const named = steps.map((step) => step.charAt(0).toLowerCase() + step.slice(1));
			const list =
				named.length === 2
					? named.join(" and ")
					: `${named.slice(0, -1).join(", ")} and ${named.at(-1)}`;
			html = html.replace(
				/(<\/h1>\s*<p>[\s\S]*?<\/p>)/,
				`$1\n<p class="docs-guide-summary">${numberWords[steps.length]}: ${list}.</p>`,
			);
		}
		return html;
	});

	// Page URLs always end in "/" (one <path>/index.html per page) while
	// nav-config links don't — normalize before comparing for active state.
	const withSlash = (link) => (link.endsWith("/") ? link : `${link}/`);
	eleventyConfig.addFilter("withSlash", withSlash);

	// What a page is for decides how it is set. A reference page (an
	// element, a component, a layout primitive, a utility) is consulted:
	// the grammar leads, with chapter rules and dense tables. Everything
	// else is a guide, read from the top: the reading rhythm leads.
	// A contrast ratio as the pages print it: two decimals, so a value just
	// over a threshold is not rounded onto it.
	eleventyConfig.addFilter("ratio", (/** @type {number | null | undefined} */ value) =>
		typeof value === "number" && Number.isFinite(value) ? `${value.toFixed(2)}:1` : "n/a",
	);

	eleventyConfig.addFilter("docsKind", (url = "") =>
		/^\/(?:layout|content|forms|components|utilities)\//.test(url)
			? "reference"
			: "guide",
	);

	// Nunjucks `set` inside a for-loop doesn't escape the loop scope, so
	// active-item and prev/next lookups live here instead of the template.
	eleventyConfig.addFilter("hasActiveItem", (items, pageUrl) =>
		items.some((item) => withSlash(item.link) === pageUrl),
	);
	eleventyConfig.addFilter("findPageIndex", (flatPages, pageUrl) =>
		flatPages.findIndex((item) => withSlash(item.link) === pageUrl),
	);

	// A page's own title, read off its first <h1>, for <title> and the
	// Open Graph title when front matter does not name one. Markup inside
	// the heading (an accent span, a permalink) is dropped and entities are
	// left as they are, since the value lands in an attribute and a <title>
	// that the template escapes again.
	eleventyConfig.addFilter("firstHeading", (content) => {
		const match = /<h1\b[^>]*>([\s\S]*?)<\/h1>/.exec(String(content ?? ""));
		if (!match) return "";
		return match[1]
			.replace(/<a\b[^>]*class="header-anchor"[\s\S]*?<\/a>/g, "")
			.replace(/<br\s*\/?>/g, " ")
			.replace(/<[^>]+>/g, "")
			.replace(/&amp;/g, "&")
			.replace(/&lt;/g, "<")
			.replace(/&gt;/g, ">")
			.replace(/&quot;/g, '"')
			.replace(/&#39;/g, "'")
			.replace(/\s+/g, " ")
			.trim();
	});

	// "On this page" data: h2/h3 headings of the rendered page content.
	eleventyConfig.addFilter("headings", (content) => {
		if (!content) return [];
		const found = [];
		const headingPattern =
			/<h([23])[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/h\1>/g;
		for (const match of content.matchAll(headingPattern)) {
			const text = match[3]
				.replace(/<a\b[^>]*class="header-anchor"[\s\S]*?<\/a>/g, "")
				.replace(/<[^>]+>/g, "")
				.trim();
			found.push({ depth: Number(match[1]), slug: match[2], text });
		}
		return found;
	});

	// --- Copy & structure -------------------------------------------------
	// Archived documentation lines: whole sites, built once at the breaking
	// release that ended them and committed as-is. Copied rather than
	// rebuilt, so an old line never has to keep compiling against today's
	// toolchain to stay readable.
	eleventyConfig.addPassthroughCopy({
		"docs/versions": "/",
	});

	eleventyConfig.addPassthroughCopy({
		"docs/public": "/",
		"docs/src/styles/style.css": "styles/style.css",
		"docs/src/styles/home.css": "styles/home.css",
		"docs/src/styles/generated": "styles/generated",
	});

	// Getting out of the /next/ preview and back to the released site.
	// Root-relative links are no use here: EleventyHtmlBasePlugin rewrites
	// them with this build's own prefix, so "/" would resolve back inside
	// /next/. A relative path is the one shape the plugin leaves alone.
	eleventyConfig.addFilter("siteRoot", (/** @type {string} */ url) => {
		if (process.env.DOCS_VARIANT !== "next") {
			return "/";
		}

		const depth = String(url).split("/").filter(Boolean).length;

		return "../".repeat(depth + 1);
	});

	eleventyConfig.addPlugin(EleventyHtmlBasePlugin);

	return {
		dir: {
			input: "docs/src/pages",
			includes: "../_includes",
			data: "../_data",
			output: "docs/dist",
		},
		markdownTemplateEngine: "njk",
		htmlTemplateEngine: "njk",
		pathPrefix: docsPathPrefix(),
	};
};
