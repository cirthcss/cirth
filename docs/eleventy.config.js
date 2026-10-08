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
const { documentedVersion } = require("../scripts/lib/documented-version");
const { readResults: markupBenchmark } = require("../scripts/lib/markup-benchmark");
const frameworks = require("./src/_data/frameworks.js");

// docs/src/pages -> docs/dist, one <path>/index.html per page, served at
// https://cirthcss.github.io/cirth/ (GITHUB_PAGES=true sets the /cirth/
// path prefix, rewritten into links by EleventyHtmlBasePlugin).
const docsRoot = __dirname;
const demosFolder = path.join(docsRoot, "src/content/demos");

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
// it is missing (a docs-only local run), the pages print their fallback
// rather than a zero.
const defaultBuildSize = () => {
	const file = path.join(docsRoot, "../dist/cirth.min.css");
	if (!fs.existsSync(file)) return null;
	const source = fs.readFileSync(file);
	const bytes = gzipSize(source);
	const kb = (/** @type {number} */ value) => `${(value / 1024).toFixed(1)} KB`;
	// `label` is the quoted figure: gzip, because that is what the delivery
	// paths this site documents actually send. `brotliLabel` is the best case
	// a host reaches by precompressing the file itself: reported, never
	// promised. See scripts/lib/compressed-size.js.
	return { bytes, label: kb(bytes), brotliLabel: kb(brotliSize(source)) };
};

// The radius pair (a container's corner against the corners of the
// controls inside it), resolved off the compiled stylesheet rather than
// written down: a number a reader can check against `dist/` has to come
// out of `dist/`.
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
// drift from the target the build actually uses; raising the floor
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
	eleventyConfig.addGlobalData("browsers", browserTargets());
	// The version a guide tells a reader to download, the same one every
	// CDN snippet is pinned to (scripts/update-sri.js), so a command that
	// fetches a file cannot fall behind the links beside it.
	eleventyConfig.addGlobalData("release", { version: documentedVersion() });
	// Surface levels, edges, inks, the accent, the states and the rhythm,
	// measured off dist/tokens for the Brand and Colors pages; null on a
	// docs-only run with no build, where the pages print token names only.
	eleventyConfig.addGlobalData("measured", measuredTheme(path.join(docsRoot, "..")));
	// The markup comparison the home page draws and Why Cirth explains,
	// with the two fixtures it was measured on. Read through the check, so
	// a fixture edited without `npm run benchmark` fails the build rather
	// than printing a number the fixtures no longer give.
	eleventyConfig.addGlobalData("benchmark", markupBenchmark());

	// Markdown

	// Fenced code: highlight.js token classes, and tabindex="0" so a block
	// that scrolls sideways stays keyboard-reachable (axe:
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

	// Heading ids are GitHub-style slugs, so existing #fragment links keep
	// resolving, each with a permalink anchor shown on hover (gh#54).
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

	// Eleventy does not clean its output directory, so each process starts
	// from an empty one and stale pages cannot accumulate. The directory is
	// the one Eleventy reports for this build (`directories.output`), so a
	// build pointed elsewhere never touches docs/dist. Cleaned once per
	// process: in --serve mode eleventy.before also runs for incremental
	// rebuilds, where deleting the active output leaves nowhere to write.
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

	// Shortcodes

	// A live example and its source, read from content/demos at build time.
	// Two-phase: the shortcode emits a one-line placeholder, inert to
	// markdown-it (a blank line in a snippet would end the surrounding HTML
	// block), and the transform below swaps in the HTML after rendering.
	const buildDemo = (src, frame) => {
		const file = path.join(demosFolder, `${src}.html`);
		if (!fs.existsSync(file)) {
			throw new Error(`[demo] missing snippet: ${src}.html`);
		}
		const html = fs.readFileSync(file, "utf8").trim();
		const frameClass = frame === "narrow" ? " docs-demo-narrow" : "";
		return `<figure class="docs-demo${frameClass}">
<div class="docs-demo-preview">${html}</div>
<details class="docs-demo-source">
<summary>HTML</summary>
<pre tabindex="0"><code class="hljs language-html">${
			hljs.highlight(html, { language: "html", ignoreIllegals: true }).value
		}</code></pre>
</details>
</figure>`;
	};

	// An HTML listing written right after a demo becomes its source band,
	// replacing the disclosure, so the code is shown once.
	const adoptListing = (content) =>
		content.replace(
			/<details class="docs-demo-source">[\s\S]*?<\/details>\n<\/figure>\s*(<pre[^>]*><code class="hljs language-html">[\s\S]*?<\/code><\/pre>)/g,
			(_, listing) => `<div class="docs-demo-source">${listing}</div>\n</figure>`,
		);

	// `frame`: "narrow" sizes the stage, never the example inside it.
	eleventyConfig.addShortcode("demo", (src, frame = "") => `<!--cirth-demo:${src}${frame ? `:${frame}` : ""}-->`);

	eleventyConfig.addTransform("cirth-demos", (content, outputPath) => {
		if (!outputPath?.endsWith(".html")) return content;
		return adoptListing(
			content.replace(/<!--cirth-demo:([\w-]+)(?::(\w+))?-->/g, (_, src, frame) => buildDemo(src, frame)),
		);
	});

	eleventyConfig.addShortcode("icon", (name, size = 20, className = "") => {
		const d = iconPaths[name];
		if (!d) throw new Error(`[icon] unknown icon: ${name}`);
		const classAttribute = className ? ` class="${className}"` : "";
		return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="${size}" height="${size}" fill="currentColor" aria-hidden="true"${classAttribute}><path d="${d}"/></svg>`;
	});

	// Light-mode --cirth-primary swatches for the default theme and each
	// preset (values from src/theme/_dual.scss and src/presets/*.scss). A
	// swatch sits next to the preset it names while the page is in another
	// preset, so it cannot read a custom property: these are literals, to be
	// re-read from source when an accent moves.
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

	// Filters

	// The home page's specimens, highlighted by the same highlight.js pass
	// as fenced code, so nothing is highlighted in the browser.
	eleventyConfig.addFilter("highlight", (code) => hljs.highlight(String(code), { language: "html", ignoreIllegals: true }).value);

	// A framework guide's head and foot, laid on the page markdown already
	// rendered, so the source stays plain markdown (it has no <h1>) and every
	// rhythm rule that reads the column's direct children keeps reading them.
	// All of it comes from frameworks.js, so a guide cannot claim more than
	// its entry does:
	//
	//   · a card for the project: its mark, its name (text, not a heading),
	//     one sentence about it, and links to its site and its repository.
	//     The mark is decorative beside the printed name, and is also a link
	//     to the project's site, which is how the OpenJS Foundation and the
	//     DSF allow their logos; that link is left out of the tab order and
	//     the accessibility tree, since "Website" goes to the same place;
	//   · the <h1>, "Install Cirth for {name}", then the lead paragraph;
	//   · one line: how sure the guide is, with which release, and when;
	//   · a sentence saying what the guide will have you do, taken from the
	//     step headings themselves, so it cannot drift from them;
	//   · a numbered <h2> ("2. Import it") becomes a step: its number set
	//     apart in a badge, where the heading's name reads "2 Import it",
	//     and the id and the anchor untouched, so every link to a step
	//     still lands. The page ends with what was checked, with which
	//     versions, and the official pages the guide follows.
	const numberWords = ["", "One step", "Two steps", "Three steps", "Four steps", "Five steps", "Six steps"];
	const longDate = (/** @type {string} */ iso) =>
		new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", {
			day: "numeric",
			month: "long",
			year: "numeric",
			timeZone: "UTC",
		});
	const siteName = (/** @type {string} */ url) => url.replace(/^https:\/\/(www\.)?/, "").replace(/\/$/, "");
	/**
	 * A mark's <img> elements: one, or the light and dark pair a project
	 * publishes, each at its own intrinsic ratio. A file drawn for light
	 * backgrounds only is marked, so the stylesheet can set it on a light
	 * ground in the dark scheme.
	 * @param {{ file: string, dark?: string, ground?: "light", aspect: number, darkAspect?: number }} mark
	 * @param {number} height
	 */
	const markImages = (mark, height) => {
		const image = (/** @type {string} */ file, /** @type {number} */ ratio, /** @type {string} */ variant) =>
			`<img class="docs-mark-image${variant ? ` docs-logo docs-logo-${variant}` : ""}${mark.ground === "light" ? " docs-mark-on-light" : ""}${ratio > 2 ? " docs-mark-wide" : ""}" src="/logos/frameworks/${file}" alt="" width="${Math.round(ratio * height)}" height="${height}" decoding="async">`;
		return mark.dark
			? image(mark.file, mark.aspect, "light") +
					image(mark.dark, mark.darkAspect ?? mark.aspect, "dark")
			: image(mark.file, mark.aspect, "");
	};
	eleventyConfig.addFilter("markImages", (mark, height = 32) => markImages(mark, height));
	eleventyConfig.addFilter("longDate", longDate);
	// A count with its thousands grouped, as the page's prose writes them.
	eleventyConfig.addFilter("grouped", (/** @type {number} */ value) => Number(value).toLocaleString("en-GB"));
	eleventyConfig.addFilter("siteName", siteName);
	eleventyConfig.addFilter("frameworkGuide", (content, id) => {
		const guide = frameworks.byId[id];
		if (!guide) throw new Error(`[frameworkGuide] unknown guide: ${id}`);
		let html = String(content);
		if (/class="docs-verified"/.test(html)) {
			throw new Error(`[frameworkGuide] ${id}: the verification note comes from frameworks.js, not the page`);
		}

		const stepPattern =
			/<h2 id="([^"]+)" tabindex="-1">(\d+)\. ([\s\S]*?) (<a class="header-anchor"[\s\S]*?<\/a>)<\/h2>/g;
		const steps = [...html.matchAll(stepPattern)].map((match) => match[3]);
		html = html.replace(
			stepPattern,
			(_, slug, number, title, anchor) =>
				`<h2 id="${slug}" tabindex="-1" class="docs-step-heading"><span class="docs-step-number">${number}</span> ${title} ${anchor}</h2>`,
		);

		if (/<h1\b/.test(html)) {
			throw new Error(`[frameworkGuide] ${id}: the page has its own <h1>; the guide's comes from frameworks.js`);
		}
		const name = escapeHtml(guide.name);
		const card =
			`<aside class="docs-project" aria-label="About ${name}">` +
			(guide.markData
				? `<a class="docs-project-mark" href="${guide.officialUrl}" tabindex="-1" aria-hidden="true"><span class="docs-mark">${markImages(guide.markData, 40)}</span></a>`
				: "") +
			`<p class="docs-project-name">${name}</p>` +
			`<p class="docs-project-description">${escapeHtml(guide.description)}</p>` +
			`<p class="docs-project-links">` +
			`<a href="${guide.officialUrl}" aria-label="${name} official website">Website</a>` +
			(guide.github ? `<a href="${guide.github}" aria-label="${name} on GitHub">GitHub</a>` : "") +
			`</p></aside>\n<h1>Install Cirth for ${name}</h1>\n`;

		const { verified, status } = guide;
		const meta =
			`<p class="docs-guide-meta">` +
			`<span class="docs-guide-status" data-status="${verified.status}">${status.text}</span> with ${escapeHtml(guide.version)} on ` +
			`<time datetime="${verified.date}">${longDate(verified.date)}</time></p>`;
		let lead = meta;
		if (steps.length > 1 && steps.length < numberWords.length) {
			const named = steps.map((step) => step.charAt(0).toLowerCase() + step.slice(1));
			const list =
				named.length === 2
					? named.join(" and ")
					: `${named.slice(0, -1).join(", ")} and ${named.at(-1)}`;
			lead += `\n<p class="docs-guide-summary">${numberWords[steps.length]}: ${list}.</p>`;
		}
		if (!/^\s*<p>[\s\S]*?<\/p>/.test(html)) {
			throw new Error(`[frameworkGuide] ${id}: the page does not open with its lead paragraph`);
		}
		html = card + html.trimStart().replace(/^(<p>[\s\S]*?<\/p>)/, `$1\n${lead}`);

		// Data strings mark code with backticks, as markdown would.
		const code = (/** @type {string} */ text) =>
			escapeHtml(text).replace(/`([^`]+)`/g, "<code>$1</code>");
		const docs = guide.docs.map((doc) => `<a href="${doc.url}">${escapeHtml(doc.text)}</a>`);
		html +=
			`\n<aside class="docs-verified" aria-labelledby="verified-${id}">` +
			`<h2 id="verified-${id}" class="docs-verified-title">${status.text}</h2>` +
			`<p><strong>${status.text} on <time datetime="${verified.date}">${longDate(verified.date)}</time></strong> (${status.detail}) with ${code(verified.with)}. ${code(verified.result)}</p>` +
			`<p>Follows ${docs.length === 1 ? docs[0] : `${docs.slice(0, -1).join(", ")} and ${docs.at(-1)}`}.</p>` +
			`</aside>`;
		return html;
	});

	// Page URLs always end in "/" (one <path>/index.html per page) while
	// nav-config links do not: normalized before comparing.
	const withSlash = (link) => (link.endsWith("/") ? link : `${link}/`);
	eleventyConfig.addFilter("withSlash", withSlash);

	// A contrast ratio as the pages print it: two decimals, so a value just
	// over a threshold is not rounded onto it.
	eleventyConfig.addFilter("ratio", (/** @type {number | null | undefined} */ value) =>
		typeof value === "number" && Number.isFinite(value) ? `${value.toFixed(2)}:1` : "n/a",
	);

	// A reference page (an element, a component, a layout primitive, a
	// utility) is consulted and gets chapter rules; everything else is a
	// guide, read from the top.
	eleventyConfig.addFilter("docsKind", (url = "") =>
		/^\/(?:layout|content|forms|components|utilities)\//.test(url)
			? "reference"
			: "guide",
	);

	// Nunjucks `set` inside a for-loop doesn't escape the loop scope, so
	// the active-item lookup lives here instead of the template.
	// Recursive: a group holding Installation holds every guide under it,
	// so the group and the branch both open on a guide.
	/** @param {{ link: string, items?: any[] }[]} items @param {string} pageUrl @returns {boolean} */
	const hasActiveItem = (items, pageUrl) =>
		items.some(
			(item) =>
				(typeof item.link === "string" && withSlash(item.link) === pageUrl) ||
				(Array.isArray(item.items) && hasActiveItem(item.items, pageUrl)),
		);
	eleventyConfig.addFilter("hasActiveItem", hasActiveItem);

	// The trail above a nested page, read from the same tree the sidebar
	// draws: a guide's parent is Installation because nav.js nests it
	// there, not because a template says so. Empty for a top-level page,
	// which has nothing above it but its group's name.
	eleventyConfig.addFilter("breadcrumb", (/** @type {any[]} */ sidebar, /** @type {string} */ pageUrl) => {
		// A category between a page and its parent (Build tools, inside
		// Installation) has no page of its own, so the trail skips it.
		/** @param {any[]} items @returns {any} */
		const find = (items) =>
			items.find((entry) => typeof entry.link === "string" && withSlash(entry.link) === pageUrl) ??
			items.flatMap((entry) => (entry.link ? [] : entry.items ?? [])).find(
				(entry) => typeof entry.link === "string" && withSlash(entry.link) === pageUrl,
			);
		for (const group of sidebar) {
			for (const item of group.items) {
				const child = find(item.items ?? []);
				if (child) return [{ text: item.text, link: item.link }, { text: child.text }];
			}
		}
		return [];
	});

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

	// The outline as a tree: each h3 under the h2 it belongs to, so the
	// "On this page" lists say which section a subsection is part of. An h3
	// before the first h2 stands on its own. `collapsible` is the length at
	// which the subsections fold under their section: past it, a flat list
	// of every heading is taller than the rail that holds it.
	eleventyConfig.addFilter("outline", (/** @type {{ depth: number, slug: string, text: string }[]} */ headings) => {
		/** @type {{ slug: string, text: string, children: { slug: string, text: string }[] }[]} */
		const sections = [];
		for (const heading of headings) {
			const last = sections.at(-1);
			if (heading.depth === 3 && last) last.children.push({ slug: heading.slug, text: heading.text });
			else sections.push({ slug: heading.slug, text: heading.text, children: [] });
		}
		const nested = sections.reduce((total, section) => total + section.children.length, 0);
		return { sections, collapsible: headings.length > 14 && nested > 0 };
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

	// Output

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
