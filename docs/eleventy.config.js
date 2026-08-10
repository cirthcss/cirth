const fs = require("node:fs");
const path = require("node:path");
const { EleventyHtmlBasePlugin } = require("@11ty/eleventy");
const markdownIt = require("markdown-it");
const markdownItAnchor = require("markdown-it-anchor");
const GithubSlugger = require("github-slugger").default;
const hljs = require("highlight.js");

// Eleventy replacement for the previous Astro setup. Same site shape:
// docs/src/pages -> docs/dist, one <path>/index.html per page, served at
// https://cirthcss.github.io/cirth/ (GITHUB_PAGES=true sets the /cirth/
// path prefix, rewritten into links by EleventyHtmlBasePlugin).
const docsRoot = __dirname;
const demosFolder = path.join(docsRoot, "src/content/demos");

const escapeHtml = (value) =>
	value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");

// Static, build-time-only SVG icons (Phosphor, "regular" weight, viewBox
// 0 0 256 256) — same path data as the previous Icon.astro, extracted from
// @phosphor-icons/vue for pixel parity. Zero client JS.
const iconPaths = {
	code: "M69.12,94.15,28.5,128l40.62,33.85a8,8,0,1,1-10.24,12.29l-48-40a8,8,0,0,1,0-12.29l48-40a8,8,0,0,1,10.24,12.3Zm176,27.7-48-40a8,8,0,1,0-10.24,12.3L227.5,128l-40.62,33.85a8,8,0,1,0,10.24,12.29l48-40a8,8,0,0,0,0-12.29ZM162.73,32.48a8,8,0,0,0-10.25,4.79l-64,176a8,8,0,0,0,4.79,10.26A8.14,8.14,0,0,0,96,224a8,8,0,0,0,7.52-5.27l64-176A8,8,0,0,0,162.73,32.48Z",
	sliders:
		"M136,120v96a8,8,0,0,1-16,0V120a8,8,0,0,1,16,0Zm64,72a8,8,0,0,0-8,8v16a8,8,0,0,0,16,0V200A8,8,0,0,0,200,192Zm24-32H208V40a8,8,0,0,0-16,0V160H176a8,8,0,0,0,0,16h48a8,8,0,0,0,0-16ZM56,160a8,8,0,0,0-8,8v48a8,8,0,0,0,16,0V168A8,8,0,0,0,56,160Zm24-32H64V40a8,8,0,0,0-16,0v88H32a8,8,0,0,0,0,16H80a8,8,0,0,0,0-16Zm72-48H136V40a8,8,0,0,0-16,0V80H104a8,8,0,0,0,0,16h48a8,8,0,0,0,0-16Z",
	layers:
		"M12,111l112,64a8,8,0,0,0,7.94,0l112-64a8,8,0,0,0,0-13.9l-112-64a8,8,0,0,0-7.94,0l-112,64A8,8,0,0,0,12,111ZM128,49.21,223.87,104,128,158.79,32.13,104ZM246.94,140A8,8,0,0,1,244,151L132,215a8,8,0,0,1-7.94,0L12,151A8,8,0,0,1,20,137.05l108,61.74,108-61.74A8,8,0,0,1,246.94,140Z",
	moon: "M233.54,142.23a8,8,0,0,0-8-2,88.08,88.08,0,0,1-109.8-109.8,8,8,0,0,0-10-10,104.84,104.84,0,0,0-52.91,37A104,104,0,0,0,136,224a103.09,103.09,0,0,0,62.52-20.88,104.84,104.84,0,0,0,37-52.91A8,8,0,0,0,233.54,142.23ZM188.9,190.34A88,88,0,0,1,65.66,67.11a89,89,0,0,1,31.4-26A106,106,0,0,0,96,56,104.11,104.11,0,0,0,200,160a106,106,0,0,0,14.92-1.06A89,89,0,0,1,188.9,190.34Z",
	zap: "M215.79,118.17a8,8,0,0,0-5-5.66L153.18,90.9l14.66-73.33a8,8,0,0,0-13.69-7l-112,120a8,8,0,0,0,3,13l57.63,21.61L88.16,238.43a8,8,0,0,0,13.69,7l112-120A8,8,0,0,0,215.79,118.17ZM109.37,214l10.47-52.38a8,8,0,0,0-5-9.06L62,132.71l84.62-90.66L136.16,94.43a8,8,0,0,0,5,9.06l52.8,19.8Z",
	shield:
		"M208,40H48A16,16,0,0,0,32,56v56c0,52.72,25.52,84.67,46.93,102.19,23.06,18.86,46,25.26,47,25.53a8,8,0,0,0,4.2,0c1-.27,23.91-6.67,47-25.53C198.48,196.67,224,164.72,224,112V56A16,16,0,0,0,208,40Zm0,72c0,37.07-13.66,67.16-40.6,89.42A129.3,129.3,0,0,1,128,223.62a128.25,128.25,0,0,1-38.92-21.81C61.82,179.51,48,149.3,48,112l0-56,160,0ZM82.34,141.66a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35a8,8,0,0,1,11.32,11.32l-56,56a8,8,0,0,1-11.32,0Z",
	sun: "M120,40V16a8,8,0,0,1,16,0V40a8,8,0,0,1-16,0Zm72,88a64,64,0,1,1-64-64A64.07,64.07,0,0,1,192,128Zm-16,0a48,48,0,1,0-48,48A48.05,48.05,0,0,0,176,128ZM58.34,69.66A8,8,0,0,0,69.66,58.34l-16-16A8,8,0,0,0,42.34,53.66Zm0,116.68-16,16a8,8,0,0,0,11.32,11.32l16-16a8,8,0,0,0-11.32-11.32ZM192,72a8,8,0,0,0,5.66-2.34l16-16a8,8,0,0,0-11.32-11.32l-16,16A8,8,0,0,0,192,72Zm5.66,114.34a8,8,0,0,0-11.32,11.32l16,16a8,8,0,0,0,11.32-11.32ZM48,128a8,8,0,0,0-8-8H16a8,8,0,0,0,0,16H40A8,8,0,0,0,48,128Zm80,80a8,8,0,0,0-8,8v24a8,8,0,0,0,16,0V216A8,8,0,0,0,128,208Zm112-88H216a8,8,0,0,0,0,16h24a8,8,0,0,0,0-16Z",
};

module.exports = (eleventyConfig) => {
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
	// One slugger per build, reset per page, so repeated headings on a page
	// dedupe (foo, foo-1) without pages leaking suffixes into each other.
	eleventyConfig.on("eleventy.before", () => slugger.reset());

	// Eleventy doesn't clean its output directory (Astro did); start each
	// build fresh so stale pages — or iCloud "name 2.html" duplicates —
	// can't accumulate in docs/dist between builds.
	eleventyConfig.on("eleventy.before", () => {
		fs.rmSync(path.join(docsRoot, "dist"), { recursive: true, force: true });
	});
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
	const buildDemo = (src, variant) => {
		const file = path.join(demosFolder, `${src}.html`);
		if (!fs.existsSync(file)) {
			throw new Error(`[demo] missing snippet: ${src}.html`);
		}
		const html = fs.readFileSync(file, "utf8").trim();
		const classlessClass = variant === "classless" ? " cirth-classless" : "";
		return `<div class="docs-demo">
<div class="docs-demo-preview${classlessClass}">${html}</div>
<details class="docs-demo-source">
<summary>Show HTML</summary>
<pre tabindex="0"><code class="hljs language-html">${
			hljs.highlight(html, { language: "html", ignoreIllegals: true }).value
		}</code></pre>
</details>
</div>`;
	};

	eleventyConfig.addShortcode(
		"demo",
		(src, variant = "default") => `<!--cirth-demo:${src}:${variant}-->`,
	);

	eleventyConfig.addTransform("cirth-demos", (content, outputPath) => {
		if (!outputPath?.endsWith(".html")) return content;
		return content.replace(
			/<!--cirth-demo:([\w-]+):(\w+)-->/g,
			(_, src, variant) => buildDemo(src, variant),
		);
	});

	eleventyConfig.addShortcode("icon", (name, size = 20, className = "") => {
		const d = iconPaths[name];
		if (!d) throw new Error(`[icon] unknown icon: ${name}`);
		const classAttribute = className ? ` class="${className}"` : "";
		return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="${size}" height="${size}" fill="currentColor" aria-hidden="true"${classAttribute}><path d="${d}"/></svg>`;
	});

	// Light-mode --cirth-primary swatches for the default theme and each
	// preset (values from src/theme/_light.scss and src/presets/*.scss).
	eleventyConfig.addShortcode("colorSwatches", () => {
		const colors = [
			{ name: "amber", hex: "#8f6023", note: "default theme" },
			{ name: "cobalt", hex: "#0f2d57", note: "preset" },
			{ name: "coral", hex: "#c0401f", note: "preset" },
		];
		return `<div class="docs-colors-grid">${colors
			.map(
				(color) => `<div class="docs-color-swatch">
<div class="docs-color-swatch-preview" style="background-color: ${color.hex}"><span style="color: #fff; font-size: 0.75rem; font-weight: 600;">Aa</span></div>
<div class="docs-color-swatch-label">${color.name} (${color.note})</div>
</div>`,
			)
			.join("")}</div>`;
	});

	// --- Filters ----------------------------------------------------------
	// Page URLs always end in "/" (one <path>/index.html per page) while
	// nav-config links don't — normalize before comparing for active state.
	const withSlash = (link) => (link.endsWith("/") ? link : `${link}/`);
	eleventyConfig.addFilter("withSlash", withSlash);

	// Nunjucks `set` inside a for-loop doesn't escape the loop scope, so
	// active-item and prev/next lookups live here instead of the template.
	eleventyConfig.addFilter("hasActiveItem", (items, pageUrl) =>
		items.some((item) => withSlash(item.link) === pageUrl),
	);
	eleventyConfig.addFilter("findPageIndex", (flatPages, pageUrl) =>
		flatPages.findIndex((item) => withSlash(item.link) === pageUrl),
	);

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
	eleventyConfig.addPassthroughCopy({
		"docs/public": "/",
		"docs/src/styles/style.css": "styles/style.css",
		"docs/src/styles/generated": "styles/generated",
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
		pathPrefix: process.env.GITHUB_PAGES === "true" ? "/cirth/" : "/",
	};
};
