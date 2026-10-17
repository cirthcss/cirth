const crypto = require("node:crypto");
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
// Brand data comes from the generators. A running dev server reloads this
// file but keeps required modules cached, so they are dropped first.
for (const id of ["../scripts/build-brand-lockup", "../scripts/build-brand-marks", "../scripts/lib/brand-mark"]) {
	delete require.cache[require.resolve(id)];
}
const { palette: brandPalette } = require("../scripts/build-brand-marks");
const brandLockup = require("../scripts/build-brand-lockup");
const { documentedVersion } = require("../scripts/lib/documented-version");
const { readResults: markupBenchmark } = require("../scripts/lib/markup-benchmark");
const frameworks = require("./src/_data/frameworks.js");

// docs/src/pages -> docs/dist, one <path>/index.html per page.
const docsRoot = __dirname;
const demosFolder = path.join(docsRoot, "src/content/demos");

// The shipped build modes, counted off the top-level src/cirth*.scss entry
// points; print sheets are companions, not modes.
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

// The default build's size, measured on dist/ at every docs build: the home
// page states it as a measurement, while scripts/check-css-size.js enforces
// the budget. Null without dist/ (a docs-only run), so pages print their
// fallback.
const defaultBuildSize = () => {
	const file = path.join(docsRoot, "../dist/cirth.min.css");
	if (!fs.existsSync(file)) return null;
	const source = fs.readFileSync(file);
	const bytes = gzipSize(source);
	const kb = (/** @type {number} */ value) => `${(value / 1024).toFixed(1)} KB`;
	// gzip is the quoted figure, what the documented delivery paths send;
	// Brotli is the best case a host reaches by precompressing
	// (scripts/lib/compressed-size.js).
	return {
		bytes,
		label: kb(bytes),
		brotliLabel: kb(brotliSize(source)),
		minifiedBytes: source.length,
		minified: kb(source.length),
	};
};


// The control and container radii, resolved from dist/. The resolver
// follows only `var(--other)` and `calc(var(--other) * <n>)` down to a rem
// or px literal and returns null on anything else: a token name with no
// measurement is missing information, a guess would be wrong information.
const radiusPair = () => {
	const file = path.join(docsRoot, "../dist/cirth.min.css");
	if (!fs.existsSync(file)) return null;
	const css = fs.readFileSync(file, "utf8");

	// The first declaration of each token is the :root one; component scopes
	// redeclare some of them later.
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

// The supported browsers, as a sentence read from the Browserslist target
// in package.json, so the documentation cannot drift from the build.
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

	// Families that share a floor share a clause.
	const clauses = [...byVersion.entries()].map(([version, families]) => {
		const listed =
			families.length > 1
				? `${families.slice(0, -1).join(", ")} and ${families.at(-1)}`
				: families[0];
		return `${listed} ${version}+`;
	});

	return { sentence: clauses.join("; ") };
};

// A heading's text: its permalink and markup dropped, entities decoded,
// whitespace collapsed. Templates escape it again where it is printed.
const headingText = (html) =>
	String(html)
		.replace(/<a\b[^>]*class="header-anchor"[\s\S]*?<\/a>/g, "")
		.replace(/<br\s*\/?>/g, " ")
		.replace(/<[^>]+>/g, "")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&amp;/g, "&")
		.replace(/\s+/g, " ")
		.trim();

// The light accent the default theme and each preset declare at their
// root, read from the generated stylesheets so the Themes page's swatches
// cannot drift from the source. Null before `npm run docs:assets` has run.
const accentOf = (/** @type {string} */ file) => {
	if (!fs.existsSync(file)) return null;
	const match = /--cirth-primary:\s*light-dark\(\s*((?:[^(),]|\([^()]*\))+?)\s*,/.exec(
		fs.readFileSync(file, "utf8"),
	);
	return match?.[1] ?? null;
};

const themeAccents = () => {
	const generated = path.join(docsRoot, "src/styles/generated");
	return [
		{ name: "default", note: "default theme", color: accentOf(path.join(generated, "cirth-docs.css")) },
		...listPresetNames().map((name) => ({
			name,
			note: "preset",
			color: accentOf(path.join(generated, "presets", `${name}.css`)),
		})),
	];
};

const escapeHtml = (value) =>
	value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");

// Build-time SVG icons: Phosphor, regular weight, viewBox 0 0 256 256. The
// shortcode throws on an unknown name; add a glyph only when a page uses it.
const iconPaths = {
	search:
		"M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z",
	moon: "M233.54,142.23a8,8,0,0,0-8-2,88.08,88.08,0,0,1-109.8-109.8,8,8,0,0,0-10-10,104.84,104.84,0,0,0-52.91,37A104,104,0,0,0,136,224a103.09,103.09,0,0,0,62.52-20.88,104.84,104.84,0,0,0,37-52.91A8,8,0,0,0,233.54,142.23ZM188.9,190.34A88,88,0,0,1,65.66,67.11a89,89,0,0,1,31.4-26A106,106,0,0,0,96,56,104.11,104.11,0,0,0,200,160a106,106,0,0,0,14.92-1.06A89,89,0,0,1,188.9,190.34Z",
	// Three r=28 discs at 48, 128 and 208 on the vertical centreline.
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
	eleventyConfig.addGlobalData("themeAccents", themeAccents);
	// The version every download command and CDN snippet is pinned to
	// (scripts/update-sri.js).
	eleventyConfig.addGlobalData("release", { version: documentedVersion() });
	// Theme measurements from dist/tokens for the Brand and Colors pages; null
	// without a build, where the pages print token names only.
	eleventyConfig.addGlobalData("measured", measuredTheme(path.join(docsRoot, "..")));
	// The scale steps the brand files are painted with.
	eleventyConfig.addGlobalData("brandMark", brandPalette());
	// The icons' URLs, each with a hash of the file's content. Browsers keep
	// a favicon by its URL long after the file behind it changes (Safari
	// across reloads and restarts), so a redrawn icon has to be a new URL.
	// A function, so a rebuild reads the files again.
	eleventyConfig.addGlobalData("brandIcons", () => {
		/** @param {string} file */
		const versioned = (file) => {
			const hash = crypto.createHash("sha256").update(fs.readFileSync(path.join(docsRoot, "public", file))).digest("hex");
			return `/${file}?v=${hash.slice(0, 10)}`;
		};
		return {
			svg: versioned("favicon.svg"),
			ico: versioned("favicon.ico"),
			touch: versioned("apple-touch-icon.png"),
		};
	});
	// Each lockup's box, so every <img> reserves its space, and where its
	// name's capitals are centred, for the header: `brandLockup.full` and
	// `brandLockup.compact`, both `brandLockup.height` high.
	eleventyConfig.addGlobalData("brandLockup", brandLockup.boxes());
	// The markup comparison, read through its check, so fixtures edited without
	// `npm run benchmark` fail the build.
	eleventyConfig.addGlobalData("benchmark", markupBenchmark());

	// Markdown

	// Fenced code is highlighted at build time, with tabindex="0" so a block
	// that scrolls sideways is keyboard reachable.
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

	// GitHub-style heading ids, so existing fragment links keep resolving, each
	// with a permalink anchor (gh#54).
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

	// Tables scroll inside a keyboard-reachable region named after their
	// columns, so overflow stays local at narrow widths or under zoom.
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
	// One slugger, reset per page, so repeated headings dedupe within a page
	// without suffixes leaking between pages.
	eleventyConfig.on("eleventy.before", () => slugger.reset());

	// Each process starts from an empty output directory, the one Eleventy
	// reports for this build. Cleaned once: in --serve mode eleventy.before
	// also runs for incremental rebuilds.
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

	// A live example and its source from content/demos. The shortcode emits a
	// placeholder that survives Markdown (a blank line in a snippet would end
	// the HTML block) and the transform swaps in the HTML after rendering.
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

	// Filters

	// Build-time highlighting for the home page's specimens.
	eleventyConfig.addFilter("highlight", (code) => hljs.highlight(String(code), { language: "html", ignoreIllegals: true }).value);

	// A framework guide's head and foot, laid on the rendered Markdown from
	// frameworks.js alone: the project card (mark, name, description, links;
	// the mark links to the project's site, out of the tab order since
	// "Website" goes there too), the <h1>, a status line, a summary taken from
	// the step headings, numbered steps with their number in a badge (ids and
	// anchors untouched), the verification note and, where the project's terms
	// ask for one, its trademark notice.
	const numberWords = ["", "One step", "Two steps", "Three steps", "Four steps", "Five steps", "Six steps"];
	const longDate = (/** @type {string} */ iso) =>
		new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", {
			day: "numeric",
			month: "long",
			year: "numeric",
			timeZone: "UTC",
		});
	/**
	 * A mark's <img> elements: one, or a project's light and dark pair, each
	 * at its intrinsic ratio. A file drawn for light grounds only is marked
	 * for the stylesheet.
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
	// A site's host alone, for a card too small for a path.
	eleventyConfig.addFilter("siteHost", (/** @type {string} */ url) => new URL(url).hostname.replace(/^www\./, ""));
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
				? `<a class="docs-project-mark" href="${guide.brand.linkTo ?? guide.officialUrl}" tabindex="-1" aria-hidden="true"><span class="docs-mark">${markImages(guide.markData, 40)}</span></a>`
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
			`</aside>` +
			// The notice the project's terms ask for, in the site's fine print.
			(guide.brand.trademarkNotice ? `\n<p class="docs-fine-print">${escapeHtml(guide.brand.trademarkNotice)}</p>` : "");
		return html;
	});

	// Page URLs end in "/"; nav links do not.
	const withSlash = (link) => (link.endsWith("/") ? link : `${link}/`);
	eleventyConfig.addFilter("withSlash", withSlash);

	// A contrast ratio as the pages print it: two decimals, so a value just
	// over a threshold is not rounded onto it.
	eleventyConfig.addFilter("ratio", (/** @type {number | null | undefined} */ value) =>
		typeof value === "number" && Number.isFinite(value) ? `${value.toFixed(2)}:1` : "n/a",
	);

	// Reference pages (layout, content, forms, components, utilities) are
	// consulted and get chapter rules; everything else reads as a guide.
	eleventyConfig.addFilter("docsKind", (url = "") =>
		/^\/(?:layout|content|forms|components|utilities)\//.test(url)
			? "reference"
			: "guide",
	);

	// Nunjucks `set` does not escape a loop, so the lookup lives here. A group
	// holding Installation holds every guide, so it opens on a guide too.
	/** @param {{ link: string, items?: any[] }[]} items @param {string} pageUrl @returns {boolean} */
	const hasActiveItem = (items, pageUrl) =>
		items.some(
			(item) =>
				(typeof item.link === "string" && withSlash(item.link) === pageUrl) ||
				(Array.isArray(item.items) && hasActiveItem(item.items, pageUrl)),
		);
	eleventyConfig.addFilter("hasActiveItem", hasActiveItem);

	// The trail above a nested page, from the tree the sidebar draws. Empty for
	// a top-level page.
	eleventyConfig.addFilter("breadcrumb", (/** @type {any[]} */ sidebar, /** @type {string} */ pageUrl) => {
		// A category has no page, so its crumb leads to its heading on the parent's
		// page.
		/** @param {any[]} items @returns {{ text: string, link?: string }[] | null} */
		const trail = (items) => {
			for (const entry of items) {
				if (typeof entry.link === "string" && withSlash(entry.link) === pageUrl) return [{ text: entry.text }];
				if (entry.link || !entry.items) continue;
				const below = trail(entry.items);
				if (below) return [{ text: entry.text, link: entry.anchor }, ...below];
			}
			return null;
		};
		for (const group of sidebar) {
			for (const item of group.items) {
				const below = trail(item.items ?? []);
				if (below) return [{ text: item.text, link: item.link }, ...below];
			}
		}
		return [];
	});

	// A page's title from its first <h1>, when front matter names none.
	eleventyConfig.addFilter("firstHeading", (content) => {
		const match = /<h1\b[^>]*>([\s\S]*?)<\/h1>/.exec(String(content ?? ""));
		return match ? headingText(match[1]) : "";
	});

	// The outline as a tree, each h3 under its h2. Past `collapsible` the
	// subsections fold, since a flat list would outgrow its rail.
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
			found.push({ depth: Number(match[1]), slug: match[2], text: headingText(match[3]) });
		}
		return found;
	});

	// Output

	// Archived documentation lines are copied as built, never rebuilt.
	eleventyConfig.addPassthroughCopy({
		"docs/versions": "/",
	});

	eleventyConfig.addPassthroughCopy({
		"docs/public": "/",
		"docs/src/styles/style.css": "styles/style.css",
		"docs/src/styles/home.css": "styles/home.css",
		"docs/src/styles/generated": "styles/generated",
	});

	// The way out of the /next/ preview: a relative path, the one shape
	// EleventyHtmlBasePlugin does not rewrite with this build's prefix.
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
