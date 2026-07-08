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

	head: [
		// `head` entries render as raw HTML and aren't rewritten for `base`
		// the way Markdown/theme asset links are, so it's prefixed by hand.
		["link", { rel: "icon", href: `${base}logo_brand_app.svg` }],
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
			{ text: "Get Started", link: "/get-started" },
			{ text: "Customization", link: "/customization" },
			{ text: "Colors", link: "/colors" },
			{ text: "Docs", link: "/layout/document" },
			{
				text: "0.3.0",
				items: [
					{ text: "Changelog", link: "https://github.com/cirthcss/cirth/blob/develop/CHANGELOG.md" },
					{ text: "About Cirth", link: "/about" },
				],
			},
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
					items: [{ text: "Build tooling", link: "/build-tooling" }],
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
				title: "Community",
				items: [
					{ text: "GitHub", link: "https://github.com/cirthcss/cirth" },
					{ text: "Issues", link: "https://github.com/cirthcss/cirth/issues" },
				],
			},
			{
				title: "Resources",
				items: [
					{ text: "Changelog", link: "https://github.com/cirthcss/cirth/blob/develop/CHANGELOG.md" },
					{ text: "About Cirth", link: "/about" },
					{ text: "Build tooling", link: "/build-tooling" },
				],
			},
		],

		footer: {
			message: "Released under the MIT License.",
			copyright: "Copyright © 2025-present Riccardo Pastori",
		},
	},
});
