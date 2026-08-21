// Site navigation config — ported 1:1 from the previous src/lib/nav.ts.

const siteTitle = "Cirth";
const siteDescription =
	"HTML-native CSS framework. Production-ready UI from semantic HTML — under 14KB gzipped, 0 JavaScript.";

const topNav = [
	{ text: "Docs", link: "/get-started" },
	{ text: "Examples", link: "/examples" },
];

const sidebar = [
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
			{ text: "Meter", link: "/components/meter" },
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
			{ text: "High contrast", link: "/utilities/high-contrast" },
			{ text: "Reduce motion", link: "/utilities/reduce-motion" },
			{ text: "Screen-reader only", link: "/utilities/sr-only" },
			{ text: "Truncate", link: "/utilities/truncate" },
			{ text: "Breakout", link: "/utilities/breakout" },
			{ text: "Print", link: "/utilities/print" },
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

const footerLinks = [
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

const footer = {
	message: "Released under the Apache License 2.0.",
	copyright: "Copyright © 2025-present Riccardo Pastori",
};

module.exports = {
	siteTitle,
	siteDescription,
	topNav,
	sidebar,
	footerLinks,
	footer,
	github: "https://github.com/cirthcss/cirth",
	// Flat, ordered list of every doc page — drives prev/next footer links.
	flatPages: sidebar.flatMap((group) => group.items),
};
