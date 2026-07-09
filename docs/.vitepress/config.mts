import hljs from "highlight.js";
import { defineConfig } from "vitepress";

// Served at https://cirthcss.github.io/cirth/ by the deploy-docs workflow,
// which sets GITHUB_PAGES=true. Local dev/preview keep the root base so
// relative paths still work without a path prefix.
const base = process.env.GITHUB_PAGES === "true" ? "/cirth/" : "/";

export default defineConfig({
	title: "Cirth",
	description: "Semantic-first CSS for production-ready interfaces.",
	cleanUrls: true,
	base,

	// Light/dark is handled by Cirth's own data-theme mechanism (see
	// theme/composables/theme.ts), not by VitePress's appearance switcher.
	appearance: false,

	markdown: {
		// Populate page.headers so the theme can render the per-page
		// "On this page" outline (see Layout.vue).
		headers: { level: [2, 3] },
		// Highlight.js at build time instead of VitePress's bundled shiki:
		// it emits theme-agnostic token classes (.hljs-*) that the docs
		// shell colors with Cirth's own light/dark palette in style.css.
		highlight: (str, lang) => {
			if (lang && hljs.getLanguage(lang)) {
				return hljs.highlight(str, {
					language: lang,
					ignoreIllegals: true,
				}).value;
			}
			return "";
		},
	},

	head: [
		// `head` entries render as raw HTML and aren't rewritten for `base`
		// the way Markdown/theme asset links are, so it's prefixed by hand.
		// The icon-tile variants of the brand mark serve as favicon; the
		// media-scoped pair matches the browser UI's own scheme, with the
		// first entry as fallback for browsers that ignore `media`.
		["link", { rel: "icon", href: `${base}logo_brand_app.svg` }],
		[
			"link",
			{
				rel: "icon",
				href: `${base}logo_brand_app.svg`,
				media: "(prefers-color-scheme: light)",
			},
		],
		[
			"link",
			{
				rel: "icon",
				href: `${base}logo_brand_app_dark.svg`,
				media: "(prefers-color-scheme: dark)",
			},
		],
		// Set data-theme before first paint to avoid a light-mode flash.
		[
			"script",
			{},
			`(function () {
				var stored = localStorage.getItem("cirth-theme");
				var dark = stored
					? stored === "dark"
					: window.matchMedia("(prefers-color-scheme: dark)").matches;
				document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
			})();`,
		],
	],

	themeConfig: {
		nav: [
			{ text: "Docs", link: "/get-started" },
			{ text: "Examples", link: "/examples" },
		],

		sidebar: {
			"/": [
				{
					text: "Introduction",
					items: [
						{ text: "Get Started", link: "/get-started" },
						{ text: "Customization", link: "/customization" },
						{ text: "Colors", link: "/colors" },
						{ text: "About Cirth", link: "/about" },
					],
				},
				{
					text: "Layout",
					collapsed: false,
					items: [
						{ text: "Document", link: "/layout/document" },
						{ text: "Landmarks", link: "/layout/landmarks" },
						{ text: "Section", link: "/layout/section" },
						{ text: "Container", link: "/layout/container" },
						{ text: "Grid", link: "/layout/grid" },
						{ text: "Overflow auto", link: "/layout/overflow-auto" },
					],
				},
				{
					text: "Content",
					collapsed: false,
					items: [
						{ text: "Typography", link: "/content/typography" },
						{ text: "Link", link: "/content/link" },
						{ text: "Button", link: "/content/button" },
						{ text: "Table", link: "/content/table" },
						{ text: "Code", link: "/content/code" },
						{ text: "Figure", link: "/content/figure" },
						{ text: "Embedded content", link: "/content/embedded" },
						{ text: "Misc", link: "/content/misc" },
					],
				},
				{
					text: "Forms",
					collapsed: false,
					items: [
						{ text: "Overview", link: "/forms/" },
						{ text: "Checkbox, radio, switch", link: "/forms/checkbox-radio-switch" },
						{ text: "Input color", link: "/forms/input-color" },
						{ text: "Input date", link: "/forms/input-date" },
						{ text: "Input file", link: "/forms/input-file" },
						{ text: "Input range", link: "/forms/input-range" },
						{ text: "Input search", link: "/forms/input-search" },
					],
				},
				{
					text: "Components",
					collapsed: false,
					items: [
						{ text: "Accordion", link: "/components/accordion" },
						{ text: "Card", link: "/components/card" },
						{ text: "Dropdown", link: "/components/dropdown" },
						{ text: "Group", link: "/components/group" },
						{ text: "Loading", link: "/components/loading" },
						{ text: "Modal", link: "/components/modal" },
						{ text: "Nav", link: "/components/nav" },
						{ text: "Progress", link: "/components/progress" },
						{ text: "Tooltip", link: "/components/tooltip" },
					],
				},
				{
					text: "Utilities",
					collapsed: false,
					items: [
						{ text: "Accessibility", link: "/utilities/accessibility" },
						{ text: "Reduce motion", link: "/utilities/reduce-motion" },
					],
				},
				{
					text: "Project",
					collapsed: true,
					items: [
						{ text: "Examples", link: "/examples" },
						{ text: "Contributions", link: "/contributions" },
						{ text: "Brand", link: "/brand" },
					],
				},
			],
		},

		socialLinks: [{ icon: "github", link: "https://github.com/cirthcss/cirth" }],

		footerLinks: [
			{
				title: "Docs",
				items: [
					{ text: "Get Started", link: "/get-started" },
					{ text: "Customization", link: "/customization" },
					{ text: "Colors", link: "/colors" },
					{ text: "Components", link: "/components/card" },
				],
			},
			{
				title: "Project",
				items: [
					{ text: "About Cirth", link: "/about" },
					{ text: "Brand", link: "/brand" },
					{ text: "Examples", link: "/examples" },
					{ text: "Contributions", link: "/contributions" },
				],
			},
			{
				title: "Community",
				items: [
					{ text: "GitHub", link: "https://github.com/cirthcss/cirth" },
					{ text: "Issues", link: "https://github.com/cirthcss/cirth/issues" },
				],
			},
		],

		footer: {
			message: "Released under the MIT License.",
			copyright: "Copyright © 2025-present Riccardo Pastori",
		},
	},
});
