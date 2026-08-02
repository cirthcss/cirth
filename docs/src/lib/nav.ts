// Site navigation config — the Astro equivalent of the old
// docs/.vitepress/config.mts `themeConfig` block. Ported 1:1.

export interface NavLink {
	text: string;
	link?: string;
	items?: { text: string; link: string }[];
}

export interface SidebarGroup {
	text: string;
	items: { text: string; link: string }[];
}

export const siteTitle = "Cirth";
export const siteDescription =
	"Semantic-first CSS for production-ready interfaces.";

export const nav: NavLink[] = [
	{ text: "Docs", link: "/get-started" },
	{ text: "Examples", link: "/examples" },
];

export const sidebar: SidebarGroup[] = [
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
		items: [
			{ text: "Document", link: "/layout/document" },
			{ text: "Landmarks", link: "/layout/landmarks" },
			{ text: "Section", link: "/layout/section" },
			{ text: "Container", link: "/layout/container" },
			{ text: "Row", link: "/layout/row" },
			{ text: "Grid", link: "/layout/grid" },
			{ text: "Overflow auto", link: "/layout/overflow-auto" },
		],
	},
	{
		text: "Content",
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
		items: [
			{ text: "Accessibility", link: "/utilities/accessibility" },
			{ text: "Reduce motion", link: "/utilities/reduce-motion" },
			{ text: "Screen-reader only", link: "/utilities/sr-only" },
			{ text: "Truncate", link: "/utilities/truncate" },
			{ text: "Breakout", link: "/utilities/breakout" },
		],
	},
	{
		text: "Project",
		items: [
			{ text: "Examples", link: "/examples" },
			{ text: "Contributions", link: "/contributions" },
			{ text: "Brand", link: "/brand" },
		],
	},
];

export const socialLinks = [
	{ icon: "github", link: "https://github.com/cirthcss/cirth" },
];

export const footerLinks = [
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
];

export const footer = {
	message: "Released under the MIT License.",
	copyright: "Copyright © 2025-present Riccardo Pastori",
};

// Flat, ordered list of every doc page — drives prev/next footer links.
export const flatPages: { text: string; link: string }[] = sidebar.flatMap(
	(group) => group.items,
);
