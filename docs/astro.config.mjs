// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import rehypeHighlight from "rehype-highlight";

// Served at https://cirthcss.github.io/cirth/ by the deploy-docs workflow,
// which sets GITHUB_PAGES=true. Local dev/preview keep the root base so
// relative paths still work without a path prefix. Mirrors the same env
// switch the old docs/.vitepress/config.mts used.
const base = process.env.GITHUB_PAGES === "true" ? "/cirth/" : "/";

// Astro's built-in Sätteri processor (Shiki-based syntax highlighting) is
// swapped for highlight.js via a rehype plugin, so code blocks emit the
// same theme-agnostic .hljs-* token classes the docs shell (style.css) has
// always colored — Shiki emits its own inline styles instead, which
// style.css doesn't target.
//
// Deliberately using the markdown.rehypePlugins/syntaxHighlight shape here
// instead of the newer `markdown.processor: unified({...})` API: the new
// API is marked as what MDX should inherit from, but in practice (Astro
// 7.1) .mdx pages silently fell back to the default Shiki pipeline when
// configured that way — verified live (grep for `.hljs-` in the built
// output came up empty, Shiki's `astro-code`/inline-style output showed up
// instead). The shape below is deprecated (logs one warning at build time)
// but verified working end to end, including on .mdx pages; revisit if a
// future Astro release documents the MDX-inheritance path more precisely.
const rehypePlugins = [
	[rehypeHighlight, { ignoreMissing: true }],
	// Code blocks scroll horizontally, so they must be reachable with the
	// keyboard (axe: scrollable-region-focusable) — same rule the old
	// markdown-it fence override enforced.
	() => (tree) => {
		const visit = (node) => {
			if (node.tagName === "pre") {
				node.properties = { ...node.properties, tabIndex: 0 };
			}
			(node.children ?? []).forEach(visit);
		};
		visit(tree);
	},
];

export default defineConfig({
	site: "https://cirthcss.github.io",
	base,
	trailingSlash: "always",
	output: "static",
	integrations: [mdx({ syntaxHighlight: false, rehypePlugins })],
	markdown: {
		syntaxHighlight: false,
		rehypePlugins,
	},
});
